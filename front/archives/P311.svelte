<script>
	import { onMount, onDestroy, tick, afterUpdate } from 'svelte';
	import { loadIt, storeIt, apiCall } from "./storage.js"
	import { addNotification, newInfoPopup, playVideo, roundFloat, scrollTop } from "./storage.js"

	import Epiq from './z/Epiq.svelte'
	
	export let wsCallComponents
  export let pseudo
  // export let page
  export let pageDesc = null
  // export let pageDone = []
	// export let pseudoList = []
	export let audioAmbiance
	export let audioBack
	
	const pageEpiqLbl = "P"+pageDesc.n + "_epiqStep"
	let step = 0 // commence toujours a l'étape 0 -- loadIt(pageEpiqLbl,0);
  // pas d'auto save pour le benchmark -- $: storeIt(pageEpiqLbl,step)
	$: stepChange(step)

	// Gestion des reload, refresh etc..
	onMount(() => {
		if (wsCallComponents) wsCallComponents.add(myWsCallback);
	});
	onDestroy(() => {
		if (wsCallComponents) wsCallComponents.delete(myWsCallback);
		console.log('ménage du component')
		endAscien()
		endStress()
		endBurst()
	});
	// gestion de la fonction différée en fin d'update IHM
	let afterUpdateFct = null
	afterUpdate(() => {
		if (afterUpdateFct) {
			console.log('afterUpdateFct')
			let t = afterUpdateFct
			afterUpdateFct=null
			t()
		}
	})
	// callback sur le websocket
	function myWsCallback(m) {
		// pas message WS specifique
		// if (m.op=="???") {	???; return true }
	}

	// force audioAmbiance
	$: forceAudio(audioAmbiance)
	function forceAudio(a) {
		if (audioAmbiance != true) {
			console.log('forceAmbiance')
			audioAmbiance=true
		}
	}
	
	// Fonctions/etat du benchmark
	// NB benchmark est marqué CONST car ce sont les champ qui sont modifies pas l'iobjet lui meme
	const benchmark = { synthese: {}, actions: [], canvas: [], bursts: [], jsTicks: [] };
	const LEFT="ArrowLeft", TOP="ArrowUp", RIGHT="ArrowRight", BOTTOM="ArrowDown"
	const actionsText = ["◀","▲","▶","▼"]
	const actionsCode = {ArrowLeft: 0, ArrowUp:1, ArrowRight:2, ArrowDown:3, q:0, z:1, d:2, s:3}
	const HUMAN_TR = 4;  // temps max pour réaction humaine valide
	const JSTICKS_NB = 2000;
	const BURST_NB = 300 // 300   // nombre d'appel serveur pour la phase de burst
	const ACTION_NB = 30 // 30   // nonbre de touche/clic à réaliser
	const CANVAS_NB = 3000 // nombre max d'échantillon en canvas
	const CANVAS_BY = 4000 // nombre de boucle de stress en canvas
	const htmlConst = {
		// moy: '<math xmlns="http://www.w3.org/1998/Math/htmlConst" display="inline"><munderover><mo>x</mo><mrow>&nbsp;</mrow><mrow><mo>_</mo></mrow></munderover></math>',
		moy: '<span style="text-decoration: underline; text-underline-offset: -0.8em;">x</span',
		ect: 'σ',
		min: '∧',
		max: '∨',
		tableSep: '<tr><td colspan=4 style="font-size: 0.1em"><hr></td></tr>'
	}
	
	// praparation de la page apres changement de step
	async function stepChange(step) {
		console.log("stepChange",step)
		// si bug, caveeat...
		endAscien(); // par defaut annule le déplacement de l'ascien
		endStress(); // par defaut annule le stress test
		endBurst();  // par defaut arrete le burst
		// force sync ihm et maj DOM
		// step peut aussi etre un string representant un int
		switch (parseInt(step,10)) {
			case 0: 
				benchmark.synthese={}
				benchmark.actions=[]
				benchmark.canvas=[]
				benchmark.bursts=[]
				benchmark.jsTicks=[]
				benchmark.synthese.device = (window.matchMedia("(pointer: coarse)").matches)? "SM" : "PC";
				benchmark.lblDevice = (benchmark.synthese.device=="PC")? "PC" : "Smartphone"
				console.log("Device:", benchmark.synthese.device, benchmark.lblDevice )
				// si l'audio est désactivée reactivation de l'audio
				if (!audioAmbiance) {
					audioAmbiance=true
					audioBack=false
					newInfoPopup("Paramétrage du benchmark",
											 [
												 "Mon assistant Audio Blaster a réactivé ton ambiance sonore, car pendant ce benchmark, la musique d'ambiance doit être activée.",
												 "A la fin du benchmark, tu pourras désactiver l'ambiance sonore si tu le souhaites",
												 "Tu peux toutefois régler le volume en cliquant sur ton pseudo en haut de la page"
											 ],
											 "Ferme ce popup pour continuer"
					)
				}
				break
			case 1:
				startBurst()
				break
			case 2:
				endBurst()
				benchmark.microStep = 0
				afterUpdateFct = startAscien
				break
			case 99:
				afterUpdateFct = startStress
				break
			case 100: 
				synthese()
				saveBenchmark()
				break
			default: console.log('rien a faire',step)
		}
	}

	// recupère le résultat actuel
	let dspResultats=null
	async function resultats() {
		let ret = await apiCall("/adminTest/benchmark","GET")
		if (ret.status!="200") return;
		let tmpResultats = ret.o
		tmpResultats.nbPC = 0
		tmpResultats.nbSM = 0
		tmpResultats.minPC = +Infinity
		tmpResultats.minSM = +Infinity
		tmpResultats.pseudoPC = null
		tmpResultats.pseudoSM = null
		for (const [iPseudo, iVal] of Object.entries(tmpResultats.pseudos) ) {
			if (iVal.device=="PC" || (iVal.device!="PC" && iVal.badDetect) ) {
				tmpResultats.nbPC++
				if (iVal.score < tmpResultats.minPC) { tmpResultats.minPC= iVal.score; tmpResultats.pseudoPC = iPseudo }
			}
			if (iVal.device=="SM" || (iVal.device!="SM" && iVal.badDetect) ) {
				tmpResultats.nbSM++
				if (iVal.score < tmpResultats.minSM) { tmpResultats.minSM= iVal.score; tmpResultats.pseudoSM = iPseudo }
				
			}
		}
		dspResultats = tmpResultats
	}
	// chargement d'une synthèse d'un autre
	async function loadSynthese(iPseudo) {
		let ret = await apiCall("/adminTest/benchmarkSynthese/"+iPseudo,"GET")
		if (ret.status != 200) { addNotification("Chargement de "+iPseudo+" impossible", "red",10); return}
		if (!ret.o.synthese) { addNotification("Synthese de "+iPseudo+" non trouvée", "red",10); return}
		benchmark.synthese = ret.o.synthese
		benchmark.actions = ret.o.actions
		benchmark.synthese.loadedPseudo=ret.o.name // fake pseudo dans résultats
		step=101 // resultats
	}
	// sauveagrde du benchmark
	async function saveBenchmark() {
		console.log("***saveBenchmark*")
		let ret = await apiCall("/adminTest/benchmark","POST", {name: "benchmark_"+pseudo, synthese: benchmark.synthese, actions: benchmark.actions})
		if (ret.status=="200") { addNotification("Benchmark uploadé sur le serveur","lightgreen",15) }
	}

	//////////////////////////////////////////////
	// calcul de la synthèse
	//////////////////////////////////////////////
	function statsFromArray(tbl,champ) {
		let ret = {}
		ret.nb = tbl.reduce( (acc,elt) => { const v = Number.parseFloat(elt[champ]); return acc + ((v)? 1 : 0) } , 0 )
		// ∧ (min) ∨ (max)
		ret.min = tbl.reduce( (acc,elt) => { const v = Number.parseFloat(elt[champ]); return Math.min(acc, (v)? v : +Infinity) } , +Infinity )
		ret.max = tbl.reduce( (acc,elt) => { const v = Number.parseFloat(elt[champ]); return Math.max(acc, (v)? v : -Infinity) } , -Infinity )
		// stats
		ret.somme = tbl.reduce( (acc,elt) => { const v = Number.parseFloat(elt[champ]); return acc + ((v)? v : 0) } , 0 )
		ret.moyenne = ret.somme/ret.nb;
		ret.sommeCarre = tbl.reduce( (acc,elt) => { const v = Number.parseFloat(elt[champ]); return acc + ((v)? v : 0)**2 } , 0 )
		// variance de population moins adaptée que la variance d'échantillon ???
		// reste sur la variance de population.
		ret.variance = (ret.sommeCarre / ret.nb) - (ret.moyenne**2)
		ret.ect = Math.sqrt(ret.variance)
		/* si calcul d'échantillon
		if (ret.nb>1) {
			ret.variance = (ret.sommeCarre / (ret.nb-1)) - (ret.moyenne**2)
			ret.ect = Math.sqrt(ret.variance)
		}
		else {
			// echantillon non représentatif
			ret.variance = +Infinity
			ret.ect = +Infinity
		}
		*/
			
		return ret
	}
	// calcul de la synthèse
	function synthese() {
		// calcul de syntèse des opérations vectorielles du canvas
		benchmark.canvas.forEach( (c,i)=> { 
			c.veTr = c.dthEnd - c.dthStart
			if (i>0) c.deTr = c.dthStart - benchmark.canvas[i-1].dthStart
		})
		benchmark.synthese.statsVe = statsFromArray(benchmark.canvas,"veTr")
		benchmark.synthese.statsDe = statsFromArray(benchmark.canvas,"deTr")

		// calcul performance CPU et moteur JS
		benchmark.jsTicks.forEach( (c,i)=> { 
			c.jsTr = c.dthEnd - c.dthStart
			if (i>0) c.jdTr = c.dthStart - benchmark.jsTicks[i-1].dthEnd
		})
		benchmark.synthese.statsJs = statsFromArray(benchmark.jsTicks,"jsTr")
		benchmark.synthese.statsJd = statsFromArray(benchmark.jsTicks,"jdTr")
		benchmark.synthese.statsJi = statsFromArray(benchmark.jsTicks,"jsIt")

		// calcul de syntèse des opérations du serveur burst
		benchmark.bursts.forEach( (c,i)=> { 
			c.s0Tr = c.dthEnd - c.dthStart
			c.c0Tr = c.s0 && c.s0.tr && c.s0.tr.gbl
			c.r0Tr = c.s0Tr - c.c0Tr // temps réseau (global moins temps serveur)
		})
		benchmark.synthese.statsS0 = statsFromArray(benchmark.bursts,"s0Tr")
		benchmark.synthese.statsC0 = statsFromArray(benchmark.bursts,"c0Tr")
		benchmark.synthese.statsR0 = statsFromArray(benchmark.bursts,"r0Tr")
		
		// Calcul de la synthèse selon les valeurs du tableau benchmark.actions
		benchmark.actions.forEach( (a,i)=> { 
			// dthStart : lancement de l'indice
			// dthEnd : fin de l'indice par humain
			// s1DthStart : debut de l'appel 1 au serveur () - not stocké car = dthStart
			// s1DthEnd : fin de l'appel 1 au serveur ()
			// s2DthStart : debut de l'appel 2 au serveur () - non stocké car = dthEnd
			// s2DthEnd : fin de l'appel 2 au serveur ()
			// s3DthStart : debut de l'appel 3 au serveur () 
			// s3DthEnd : fin de l'appel 3 au serveur ()
			// s1: reponse serveur 1
			// s2: reponse serveur 2
			// s3: reponse serveur 3 en situation de collision avec serveur 1
			// s1.tr.gbl = temps serveurs pour s1
			// s2.tr.gbl = temps serveurs pour S2
			// s3.tr.gbl = temps serveurs pour S3
			a.huTr = a.dthEnd-a.dthStart
			a.s1Tr = a.s1DthEnd-a.dthStart
			a.s2Tr = a.s2DthEnd-a.dthEnd
			a.s3Tr = a.s3DthEnd-a.s3DthStart
			a.c1Tr = a.s1 && a.s1.tr && a.s1.tr.gbl
			a.c2Tr = a.s2 && a.s2.tr && a.s2.tr.gbl
			a.c3Tr = a.s3 && a.s3.tr && a.s3.tr.gbl
			a.r1Tr = a.s1Tr - a.c1Tr // temps réseau (global moins temps serveur)
			a.r2Tr = a.s2Tr - a.c2Tr // temps réseau (global moins temps serveur)
			a.r3Tr = a.s3Tr - a.c3Tr // temps réseau (global moins temps serveur)
		})
		// -----------------------------------------------------------
		// calcul des natures d'intéractions
		benchmark.synthese.nbClic = benchmark.actions.reduce( (a,act) => a + ((act.type=="T")? 1:0) , 0 )
		benchmark.synthese.nbClav = benchmark.actions.reduce( (a,act) => a + ((act.type=="K")? 1:0) , 0 )
		benchmark.synthese.nbBad = benchmark.actions.reduce( (a,act) => a + ((act.nbBad)? act.nbBad:0) , 0 )
		// calcul des nombre significatifs des TR
		benchmark.synthese.statsHu = statsFromArray(benchmark.actions,"huTr")
		benchmark.synthese.statsS1 = statsFromArray(benchmark.actions,"s1Tr")
		benchmark.synthese.statsS2 = statsFromArray(benchmark.actions,"s2Tr")
		benchmark.synthese.statsS3 = statsFromArray(benchmark.actions,"s3Tr")
		benchmark.synthese.statsC1 = statsFromArray(benchmark.actions,"c1Tr")
		benchmark.synthese.statsC2 = statsFromArray(benchmark.actions,"c2Tr")
		benchmark.synthese.statsC3 = statsFromArray(benchmark.actions,"c3Tr")
		benchmark.synthese.statsR1 = statsFromArray(benchmark.actions,"r1Tr")
		benchmark.synthese.statsR2 = statsFromArray(benchmark.actions,"r2Tr")
		benchmark.synthese.statsR3 = statsFromArray(benchmark.actions,"r3Tr")
	}
	//////////////////////////////////////////////
	// stress server en burst
	//////////////////////////////////////////////
	// Attente d'un nouvelle milliseconde, retourne now
	// bourrin mais fonctionne et reste en deca des limites des timer du front-end navigateur
	function waitNewMs() {
		// Attente d'un nouvelle milliseconde
		const init=parseInt(performance.now(),10)
		while (parseInt(performance.now(),10)==init) { }
		return performance.now()
	}
	async function startBurst() {
		benchmark.burstMode = true
		benchmark.jsStressMode = true
		benchmark.burstIdx = 0
		while (benchmark.burstMode && benchmark.burstIdx < BURST_NB) {
			let idx = benchmark.burstIdx++
			// console.log("burst", idx)
			benchmark.bursts[idx]= { dthStart : waitNewMs() }
			benchmark.bursts[idx].s0 = await apiCall("/adminTest/stress/0/"+idx)
			benchmark.bursts[idx].dthEnd=performance.now()
		}
		// performance JS
		startJs()
		//
		console.log("Serverburst termine",benchmark.burstMode,benchmark.burstIdx)
		endBurst()
	}
	async function endBurst() {
		console.log("endBurst")
		benchmark.burstMode = false
		benchmark.burstIdx = 0
	}

	//////////////////////////////////////////////
	// Reactivité humaine, reseau, serveur
	//////////////////////////////////////////////
	function keyPress(e) { 
		// console.log("kp",e.key)
		if (actionsCode[e.key]!==undefined) { 
		}
		e.preventDefault();
		e.stopPropagation();
  }
	function keyDown(e) {
		// console.log("kd",e.key)
		if (actionsCode[e.key]!==undefined) { 
				stressKey(e.key,'K')
		}
		e.preventDefault();
		e.stopPropagation();
	}
	// appel uniquement avec un Key valide, type= T touch ou K clavier
	async function stressKey(key,type) {
		const idx = benchmark.actions.length-1
		benchmark.microStep=true
		const action = actionsCode[key]
		// console.log("sk",key,type,idx,action,actionsCode)
		if (idx < 0) return;
		if (action != benchmark.actions[idx].action) {
			benchmark.actions[idx].nbBad++;
			return;
		}
		// bonne touche/touch/clic
		benchmark.actions[idx].dthEnd=Date.now()
		benchmark.actions[idx].type=type
		// appel serveur 2 pour stress
		apiCall("/adminTest/stress/2/"+idx).then( (r) => {benchmark.actions[idx].s2DthEnd=Date.now(); benchmark.actions[idx].s2=r} )
		// suivant
		newStress()
	}

	// nouveau stress test
	async function newStress() {
		const idx = benchmark.actions.length
		if (idx >= ACTION_NB) { setTimeout(()=>{step=100; scrollTop() },100); return}
		// calcul la nouvelle action différente de la precedente
		let newAct = Math.floor(Math.random()*4)
		while (newAct === benchmark.action) newAct = Math.floor(Math.random()*4)
		// Ajoute un element dans le tableau des actions
		benchmark.actions.push( { action: newAct, nbBad: 0 } )
		benchmark.action = newAct
		benchmark.actionText = actionsText[newAct]
		benchmark.actions[idx].dthStart = Date.now()
		// appel serveur pour stress (deux appels en parallèle)
		apiCall("/adminTest/stress/1/"+idx).then( (r) => {benchmark.actions[idx].s1DthEnd=Date.now(); benchmark.actions[idx].s1=r} )
		benchmark.actions[idx].s3DthStart = Date.now()
		apiCall("/adminTest/stress/3/"+idx).then( (r) => {benchmark.actions[idx].s3DthEnd=Date.now(); benchmark.actions[idx].s3=r} )
	}
	// fin du stress test
	function endStress() {
		console.log("endStress")
		benchmark.action=null;
		benchmark.actionText=null;
		document.removeEventListener("keydown", keyDown, true);
		document.removeEventListener("keypress", keyPress, true); 
	}
	// countdown de début	
	function startStress() {
		console.log("startStress...")
		benchmark.action = null
		benchmark.actionText = null
		benchmark.actions=[]
		document.addEventListener("keydown", keyDown, true);
		document.addEventListener("keypress", keyPress, true);
		scrollTop('rectangleRouge')

	  setTimeout( ()=> benchmark.delai=5, 0)	
	  setTimeout( ()=> benchmark.delai=4, 1000)	
	  setTimeout( ()=> benchmark.delai=3, 2000)	
	  setTimeout( ()=> benchmark.delai=2, 3000)	
	  setTimeout( ()=> benchmark.delai=1, 4000)	
	  setTimeout( ()=> {benchmark.delai=null; newStress()} , 5000)	
	}

	//////////////////////////////////////////////
	// CANVAS et performance equipement
	//////////////////////////////////////////////
	// performance moteur JS: calcul du nombre d'iteration pour 1ms
	// astuce pour éviter la détection de boucle du front-end du navigateur par l'usage d'un timer
	// pas tres clean, une option serait de le faire dans un web-worker, mais ce serai moins représentatif
	// du comportement du site
	// MEGA SOUCIS avec le tick ms (resolution 1.x ms sur firefox, resolution de 0.1x sur chrome)
	// donc insuffisant sur firefox : raison voir : https://www.w3.org/TR/hr-time-2/#sec-privacy-security
	// Necessite de faire un calcul de gigue de la CPU dans le rapport final.
	let jsTickLoop = JSTICKS_NB
	function startJs() {
		benchmark.synthese.jsGlobalStart = null; // sera maj a la premier itération
		jsTickLoop = JSTICKS_NB
		setTimeout(jsTickByMsCalculator,1)
	}
	function jsTickByMsCalculator() {
		benchmark.synthese.jsGlobalStart ??= performance.now() // positionne si premier itération
		let loop,i,start,limit
		loop=0
		while (loop++ < 20) {
			// Attente d'un nouvelle milliseconde
			i=0;
			start = waitNewMs()
			limit=start+1
			while (performance.now() < limit) { i++ }
			// i est le nombre d'itération par ms
			benchmark.jsTicks.push( { jsIt: i, dthEnd: performance.now(), dthStart: start } )
		}
		// si le nombre de boulce n'est pas atteint relance le test dans 1 ms (ou timer mini)
		jsTickLoop -= 20
		if (jsTickLoop>0) {
			// console.log("jsTickByMsCalculator loop:",jsTickLoop)
			setTimeout(jsTickByMsCalculator,1)
		}
		else {
			benchmark.synthese.jsGlobalEnd=performance.now()
			benchmark.jsStressMode = false
			console.log('jsStress end')
		}
	}

	// draw ascien via canvas
	let canvasParam = {x: 0, y:0, tick: 0, ctx: null, timer: null, versHaut: false }
	function endAscien() {
		console.log("endAscien")
		canvasParam.ctx = null
		clearTimeout(canvasParam.timer)
	}
	async function startAscien() {
		console.log("startAscien");
		let wrapper = document.getElementById("canvasWrapper")
		if (!wrapper) { addNotification("erreur de sync DOM: canvasWrapper pas encore disponible","red",60); return }
		canvasParam = {x: 0, y:0, tick: 0, ctx: null, timer: null, versHaut: false }
		benchmark.canvas = []
		let canvas = document.createElement("canvas")
		canvas.setAttribute("width", "20px")
		canvas.setAttribute("height", "200px")
		wrapper.appendChild(canvas);
		canvasParam.ctx = canvas.getContext('2d')
		canvasParam.timer = setTimeout(drawAscien,1) // max FPS
	}
	function drawAscien() {
		// console.log("drawAscien",canvasParam.y)
		let ctx = canvasParam.ctx;
		if (!ctx) {console.log('Erreur pas de contexte 2D'); return}
		// recupere le tick courant
		let tick = canvasParam.tick 
		// limite le nombre d'entrée pour les stats
		if (canvasParam.tick < CANVAS_NB) benchmark.canvas[tick] ={ dthStart: performance.now() }
		// drawn Ascien
		let s    = 20, // map.blockSize, 
				top  = (canvasParam.y/10) * s,
				left = (canvasParam.x/10) * s;
		let tl = left + s;
		let base = top + s - 3;
		let inc = s / 10;
		let high = tick % 10 > 5 ? 3  : -3;
		let low  = tick % 10 > 5 ? -3 : 3;
		// boucle de stress
		for (let i=0; i<CANVAS_BY; i++) {
			ctx.beginPath();
			ctx.fillStyle = "rgb(0,0,"+(i%255)+")";
			ctx.fillRect(0, 0, 20, i%200);
			ctx.moveTo(left, base);
			ctx.quadraticCurveTo(left, top, left + (s/2),  top);
			ctx.closePath();	 
		}
		// effacement du précédent
		ctx.beginPath();
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, 20, 200);
		ctx.closePath();	 
		// afficahge de l'ascien
		ctx.fillStyle = "pink" // getColour();
		ctx.beginPath();
		ctx.moveTo(left, base);
		ctx.quadraticCurveTo(left, top, left + (s/2),  top);
		ctx.quadraticCurveTo(left + s, top, left+s,  base);
		// Wavy things at the bottom
		ctx.quadraticCurveTo(tl-(inc*1), base+high, tl - (inc * 2),  base);
		ctx.quadraticCurveTo(tl-(inc*3), base+low, tl - (inc * 4),  base);
		ctx.quadraticCurveTo(tl-(inc*5), base+high, tl - (inc * 6),  base);
		ctx.quadraticCurveTo(tl-(inc*7), base+low, tl - (inc * 8),  base); 
		ctx.quadraticCurveTo(tl-(inc*9), base+high, tl - (inc * 10), base); 
		ctx.closePath();
		ctx.fill();
		ctx.beginPath();
		ctx.fillStyle = "#FFF";
		ctx.arc(left + 6,top + 6, s / 6, 0, 300, false);
		ctx.arc((left + s) - 6,top + 6, s / 6, 0, 300, false);
		ctx.closePath();
		ctx.fill();
		// yeux
		let f = s / 12;
		if (canvasParam.versHaut) f = -f
		ctx.beginPath();
		ctx.fillStyle = "#000";
		ctx.arc(left+6, top+6+f, s / 15, 0, 300, false);
		ctx.arc((left+s)-6, top+6+f, s / 15, 0, 300, false);
		ctx.closePath();
		ctx.fill();

		/* calcul les parametres de next step */
		if (canvasParam.versHaut) {
			if (canvasParam.y <= 0)
				canvasParam.versHaut=false
			else
				canvasParam.y--
		}
		else {
			if (canvasParam.y >= 90 )
				canvasParam.versHaut=true
			else
				canvasParam.y++
		}
		// limite le nombre d'entrée pour les stats
		if (canvasParam.tick < CANVAS_NB) benchmark.canvas[tick].dthEnd = performance.now()
		canvasParam.tick++ 
		canvasParam.timer = setTimeout(drawAscien,1) // le vrai timer sera limité par le navigateur
	};
	
</script>
<style>

	#rectangleContainer {
		/* background-color: green; */
	  width: 80vw; /* 13em; 382px; */
	  height: 50vh; /* 16em;  470px; */
	  margin: 0 auto;
		/* background-color: green; */
	}
	#rectangleRouge {
		/* ratio  X/Y 0.81 pour un zone style smartphone */
	  border-radius: 10px;
	  margin: 0 auto;
		/* width: 100%; */
		/* background-color: red; */
		/* height: 50vh; */
		min-height: 50vh;
		font-size: 0.6em; 
	}
	.tbCenter {margin: 0 auto; border:0; /* width:100% */ }
	.bkRed { background-color: red; border: 1px solid white; border-radius: 10px; }
	.trNoborder {margin: 0 auto; border:0; }
	.tdLeft {margin: 0 auto; border:1px solid red; }
	.tdRight {margin: 0 auto; border:1px solid red; }
	.tdTop {margin: 0 auto; border:1px solid red; }
	.tdBot {margin: 0 auto; border:1px solid red; }
	.tdCenter { text-align: center}
	.svgPolyline { fill: none ; stroke: white; stroke-linejoin: round; stroke-width: 4}
	.svgText { }
	.svgUnder { text-decoration: underline; }
	.tdSynth { vertical-align: top; /* word-break: break-all */ }
	.selOui {border: 4px inset red; cursor: pointer }
	.selNon { border: 4px outset #404040; cursor: pointer }
	/* .selBad { border: 4px solid #303030; color: #404040 } */
	.bigKey { font-size:2em }

</style>

{#if pseudo.startsWith("Kikiadoc")}
	<div class="adminCadre">
		<input type="button" value="resetResultat" on:click={() => confirm('ResetResultats') && apiCall('/adminTest/benchmark','DELETE')} />
		<input type="button" value="goSynthese" on:click={() => confirm('Go') && (step=100) } />
		<input type="button" value="go1" on:click={() => confirm('Go') && (step=1) } />
		<input type="button" value="go2" on:click={() => confirm('Go') && (step=2) } />
		<input type="button" value="go3" on:click={() => confirm('Go') && (step=3) } />
		<input type="button" value="go4" on:click={() => confirm('Go') && (step=4) } />
		<input type="button" value="go99" on:click={() => confirm('Go') && (step=99) } />
		<input type="text" placeholder="pseudo?" id="admPseudo" />
		<input type="button" value="loadSynthese" on:click={() => loadSynthese(document.getElementById('admPseudo').value)} />
	</div>
{/if}

<div>
	<Epiq bind:step={step} oui=0 ouiVal="Recommencer le benchmark" />
	<input type="button" on:click={()=>resultats()} value="Résultats" />
</div>

{#if step==2}
	<div style="font-size:0.7em">
		<span>Si tu as un quelconque soucis ➜</span>
	  <Epiq bind:step={step} oui=3 ouiFct={()=>benchmark.synthese.badDisplay=true} ouiVal="J'ai un soucis" />
		<br/>
		Pendant cette phase du benchmark, je stresse un coeur du processeur de ton équipement.
		Ecoute la musique d'ambience, et vérifie l'abscence de saccades.
		<br/>
		<u>Pendant ce test, laisse le temps à l'Ascien de faire au moins 4 allers-retours</u>
		<br/>
		Scroll ton écran pour <u>afficher en même temps</u>
		le rectangle rouge <u>ET</u> les boutons de direction en dessous du rectangle ➜
		<input type="button" value="Positionne mon écran" on:click={() => scrollTop('rectangleRouge')} /><br/>
	</div>
	
	<div id="rectangleContainer">
	<div id="rectangleRouge">
		<table class="tbCenter bkRed">
			<tbody>
			<tr><td colspan=3 class="tdCenter">
				<div>
					Tu dois voir différents éléments dans ce rectangle
					<br/>
					Tu dois voir 4 boutons de direction en dessous.
					<br/>
					Suis les consignes affichées en bas du rectangle.
				</div>
			</td></tr>
			<tr class="trCenter">
				<td class="tdCenter">
					<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="200" height="200">
						<polyline class="svgPolyline" points="0,100 20,40 60,30 90,50 120,10 150,40 170,20 200,0"/>
					  <rect width="100" height="100" x="0" y="100" fill="green" />
					  <rect width="100" height="100" x="100" y="100" fill="yellow" />
					  <circle cx="100" cy="100" r="50" fill="blue" />
					  <text x="60" y="25" class="svgText" fill="white">Un graphique</text>
					  <text x="60" y="95" class="svgText" fill="white">Un rond bleu</text>
					  <text x="45" y="110" class="svgText svgUnder" fill="white">un rond, pas un ovale</text>
					  <text x="0" y="150" class="svgText" fill="white">Un carré vert</text>
					  <text x="100" y="150" class="svgText" fill="white">Un carré jaune</text>
					  <text x="10" y="170" class="svgText svgUnder" fill="white">des carrés, pas des rectangles</text>
					</svg>
				</td>
				<td class="tdCenter">
					<div id="canvasWrapper"></div>
				</td>
				<td class="tdCenter">
					<div>
						Formule:
					</div>
					<math style="text-shadow: none" display="block" xmlns="http://www.w3.org/1998/Math/MathML">
				    <mrow>
				      <munderover>
				        <mo>∑</mo>
				        <mrow>
				          <mi>n</mi>
				          <mo>=</mo>
				          <mn>1</mn>
				        </mrow>
				        <mrow>
				          <mo>+</mo>
				          <mn>∞</mn>
				        </mrow>
				      </munderover>
				      <mfrac>
				        <mn>1</mn>
				        <msup>
				          <mi>n</mi>
				          <mn>2</mn>
				        </msup>
				      </mfrac>
				    </mrow>
						<mtext>=</mtext>
				    <mfrac>
				      <msup>
				        <mi>π</mi>
				        <mn>2</mn>
				      </msup>
				      <mn>6</mn>
				    </mfrac>
					</math>
				</td>
			</tr>
			<tr><td colspan=3 class="tdCenter">
				<div>
					{#if benchmark.microStep==0}
						<span class="blinkMsg">Clique sur un bouton en dessous</span>
					{:else if benchmark.microStep==1}
						<input type="button" on:click={()=>benchmark.microStep++} value="Je vois le rectangle ET 4 boutons" />
					{:else if benchmark.microStep==2}
						<input type="button" on:click={()=>benchmark.microStep++} value="Je vois les carrés vert et jaune" />
					{:else if benchmark.microStep==3}
						<input type="button" on:click={()=>benchmark.microStep++} value="Je vois le rond bleu et le graphique" />
					{:else if benchmark.microStep==4}
						<input type="button" on:click={()=>benchmark.microStep++} value="L'Ascien se déplace sans saccade" />
					{:else if benchmark.microStep==5}
						<input type="button" on:click={()=>benchmark.microStep++} value="Je vois la formule de math" />
					{:else if benchmark.microStep==6}
						<Epiq bind:step={step} oui=4 ouiVal="La musique n'a jamais été saccadée" />
					{/if}
				</div>
			</td></tr>
			<tr><td colspan=3 class="tdCenter">
				<Epiq bind:step={step} oui=3 ouiFct={()=>benchmark.synthese.badDisplay=true} ouiVal="J'ai un Souci" />
			</td></tr>
			</tbody>
		</table>
	</div>
	</div>
{/if}
{#if step==99}
	<div id="rectangleContainer">
	<div id="rectangleRouge">
		<table class="tbCenter bkRed">
			<tbody>
			<tr><td colspan=3 class="tdCenter" style="font-size:2em">
				Consigne
				<br/>
				<span style="font-size: 1.2em">&nbsp;</span>{benchmark.actionText}<span style="font-size: 1.2em">&nbsp;</span>
				<br/>
				{benchmark.actions.length}/{ACTION_NB}
				<br/>
				{#if benchmark.delai}Début dans: {benchmark.delai}{/if}
			</td></tr>
			</tbody>
		</table>
	</div>
	</div>
{/if}
{#if step==99 || step==2}
	<!-- boutons pour smartphones -->
	<div>
		<table class="tbCenter">
			<tbody>
			<tr class="trNoborder">
				<td></td>
				<td></td>
				<td class="tdTop"><input class="bigKey" type="button" value="▲" on:click={()=>stressKey(TOP,"T")} /></td>
				<td></td>
				<td></td>
			</tr>
			<tr class="trNoborder">
				<td></td>
				<td class="tdLeft"><input class="bigKey" type="button" value="◀" on:click={()=>stressKey(LEFT,'T')} /></td>
				<td></td>
				<td class="tdRight"><input class="bigKey" type="button" value="▶" on:click={()=>stressKey(RIGHT,'T')} /></td>
				<td></td>
			</tr>
			<tr class="trNoborder">
				<td></td>
				<td></td>
				<td class="tdBot"><input class="bigKey" type="button" value="▼" on:click={()=>stressKey(BOTTOM,'T')} /></td>
				<td></td>
				<td></td>
			</tr>
			</tbody>
		</table>
	</div>
{/if}

{#if step==0}
	<div>
		<p>
			Bienvenue {pseudo}.
		</p>
		<p class="blinkMsg">
			Pour ce benchmark, il est important de bien lire toutes les instructions de chaque étape
		</p>
		<p>
			Afin de permettre de nouvelles mécaniques lors de challenges du 
			<span style="color: orange; text-decoration: orange wavy underline;">Kiki's Event IX</span>,
			Kikiadoc souhaite utiliser de nouvelles techniques pour le site, 
			de mieux prendre en compte les variations de temps de traitement en situation de stress
			(humain, equipement, réseau, serveur)
			et équilibrer les challenges en s'adaptant au type de ton équipement (PC, smartphone)
		</p>
		<p>
			C'est le pourquoi de ce benchmark. Il dure environ 2/3 minutes.
		</p>
		<p>
			Ce benchmark va réaliser différents tests et remonter les résultats sur le serveur.
			<br/>
			Tu pourras refaire ce benchmark si tu te rends compte d'un soucis
			ou si tu as raté quelque chose.
			Le serveur ne conserve que ton dernier résultat.
			<br/>
			Enfin, seul Kikiadoc connaitra ton dernier résultat.
		</p>
		<p>
			Tu peux interrompre le benchmark à tout moment, en cliquant sur "Recommencer le benchmark"
			ou en cliquant sur le bandeau en haut du site.
		</p>
		<p>
			<u>IMPORTANT, si tu as une erreur, fait un screen et MP Kikiadoc sur Discord.</u>
			<br>
			N.B: Le 
			<a href="https://fr.wikipedia.org/wiki/Prime_aux_bogues" target="_blank" alt="">Bug Bounty</a>
			(300K gils) est aussi valable lors de ce benchmark.
		</p>
		<p>
			Allez, fin du blabla...
		</p>
	</div>
	<p>
		Selon mon <u>nouvel algorithme</u> simplifié de détection de ton équipement,
		tu utilises un {benchmark.lblDevice}, peux-tu le confirmer ?
		<br/>
			<span class="{(benchmark.synthese.badDetect)?'selNon':'selOui'}" on:click={()=>{benchmark.synthese.badDetect=false}} role="button" on:keypress={null} tabindex=0>
			Oui, {benchmark.lblDevice}
			</span>
			<span class="{(benchmark.synthese.badDetect)?'selOui':'selNon'}" on:click={()=>{benchmark.synthese.badDetect=true}} role="button" on:keypress={null} tabindex=0>
			Non, {(benchmark.synthese.device=="PC")?"Smartphone":"PC"}
			</span>
	</p>
	{#if (benchmark.synthese.device=="PC" && !benchmark.synthese.badDetect) || (benchmark.synthese.device!="PC" && benchmark.synthese.badDetect) }
		<p>
			Indique moi aussi si FF14 est démarré sur ton PC
			<br/>
				<span class="{(benchmark.synthese.gameRunning)?'selOui':'selNon'}" on:click={()=>{benchmark.synthese.gameRunning=true}} role="button" on:keypress={null} tabindex=0>
				Oui, démarré
				</span>
				<span class="{(benchmark.synthese.gameRunning)?'selNon':'selOui'}" on:click={()=>{benchmark.synthese.gameRunning=false}} role="button" on:keypress={null} tabindex=0>
				Non, pas démarré
				</span>
		</p>
	{/if}

  <Epiq bind:step={step} oui=1 ouiVal="Et c'est parti mon Kiki !" />
{/if}

{#if step==1}
	<div>
		<p>
			J'ai démarré le benchmark.
		</p>
		<p>
			Certains tests se font sans ton intervention:
			<br/>
			J'ai
			{#if benchmark && benchmark.burstMode}
				<span style="color: orange">commencé</span>
			{:else}
				<span style="color: lightgreen">terminé</span>
			{/if}
			le test de stress du serveur et
			{#if benchmark && benchmark.jsStressMode}
				<span style="color: orange">commencé</span>
			{:else}
				<span style="color: lightgreen">terminé</span>
			{/if}
			le calcul des performances du moteur Javascript de ton navigateur.
		</p>
		<p>
			La prochaine étape est de vérifier que ton équipement (en particulier les smartphones)
			peut afficher une interface complète composée d'un rectangle rouge
			et de divers boutons de direction en dessous de ce rectangle rouge
			<br/>
			Dans ce rectangle rouge se trouvent des composants utilisant 
			des techniques qui n'ont pas été utilisées lors des événements précédents.
		</p>
	</div>
	{#if !benchmark || benchmark.burstMode || benchmark.jsStressMode}
		<div class="blinkMsg">Stress en cours</div>
	{:else}
	  <Epiq bind:step={step} oui=2 ouiVal="Affiche l'interface de test" />
	{/if}
{/if}

{#if step==3}
	<div>
		Envoi un mp à @kikiadoc sur discord pour lui indiquer ton soucis avec si possible un screen
		de ton smartphone ou de ton pc.
		<br/>
	  <Epiq bind:step={step} oui=2 ouiVal="Reaffiche le test pour que je fasse un screen" non=4 nonVal="Je continue le test" />
	</div>
{/if}

{#if step==4}
	<div>
		Tu as terminé l'étape 1.
		<p>
			L'étape 2 est une étape de stress de bout en bout. Elle permet de préciser les performances de ton équipement,
			de ta connexion Internet et du serveur dans différentes conditions.
			<br/>
			Je vais aussi chronometrer ta réactivité.
			<br/>
			Cela permettra d'équilibrer les paramètres afin que tous les challenges soient "jouables"
			que tu utilises un smartphone ou un PC.
		</p>
		<p>
			Pour cela, tu vais te donner des consignes sous la forme de triangles:
			<span style="font-family: courier">▲◀▶▼</span> (pour haut, gauche, droit, bas)
			<br/>
			Dès qu'une consigne apparait, il faut que tu appuies <span class="blinkMsg">le PLUS VITE POSSIBLE</span>
			sur la bonne touche de direction de ton clavier PC (les flèches ou ZQDS)
			ou que tu cliques sur le bon bouton en dessous du rectangle rouge sur ton smartphone.
			<br/>
			Le nombre de consignes est élevé ({ACTION_NB}) mais voulu. Ce nombre élévé va
			faire varier ta concentration et influer sur la mesure de la dispersion de tes actions.
		</p>
		<!-- ne peux pas etre un Epiq component a cause du scroll
	  <Epiq bind:step={step} oui=99 ouiVal="OK, je suis pret" />
		-->
		<input type="button" value="Ok, je suis prêt" on:click={()=>step=99} />
	</div>
{/if}

<!-- 100: affichage resultat perso, 101 d'un autre -->
{#if (step==100 || step==101) && benchmark && benchmark.synthese}
	<div style="">
		{#if step==100}
			<div>Merci {pseudo}.</div>
			{#if benchmark.synthese.statsHu.max > HUMAN_TR*1000 }
				<div class="adminCadre" style="font-size: 0.8em">
					Tu as mis plus de {HUMAN_TR} secondes pour cliquer/clavioter après
					au moins une de mes	consignes.
					<br/>
					Je peux conserver ton résultat actuel, mais il est préférable que tu refasses
					l'étape 2 du benchmark de telle sorte que toutes tes réactions soient en dessous
					de {HUMAN_TR} secondes.
					<br/>
					Cela évitera de perturber les statistiques globales que Kikiadoc prépare en secret
					afin d'équilibrer les futurs challenges.
					<br/>
					<Epiq bind:step={step} oui=4 ouiVal="Je vais recommencer l'étape 2" />
				</div>
			{:else}
				<div class="adminCadre stars" style="font-size: 0.8em">
					En ayant uploadé ce benchmark, tu candidates au Haut fait de Réactivé Humaine dans la catégorie {benchmark.lblDevice}
					<br/>
					Ton score est de {roundFloat(benchmark.synthese.statsHu.moyenne)} millisecondes.
					<br/>
					Tu peux afficher les résultats en cliquant sur "Résultats"
					<br/>
					Tu peux tenter de l'améliorer en refaisant l'étape 2 du benchmark.
					<br/>
					<Epiq bind:step={step} oui=4 ouiVal="Je tente d'améliorer mon score" />
				</div>			
			{/if}
		{/if}
		<div>Synthèse de ton benchmark:</div>
		<div style="font-size:0.7em">
			<table style="border: 2px solid white" class="papier">
			<tbody>
				<tr>
					<td class="tdSynth">Pseudo:</td>
					<td class="tdSynth" colspan=3>{#if step==100}{pseudo}{:else}{benchmark.synthese.loadedPseudo}{/if}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">Equipement détecté</td>
					<td class="tdSynth">{(benchmark.synthese.device=="PC")?"PC":"Smartphone"}</td>
					<td class="tdSynth">
						{(benchmark.synthese.badDetect)?"Mal détecté selon joueur":"Confirmé par joueur"}<br/>
						{(benchmark.synthese.device=="PC" && benchmark.synthese.gameRunning)? "FF14 lancé" : "FF14 non lancé"}
					</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">Affichage évolué et cadrage</td>
					<td class="tdSynth">{benchmark.synthese.badDisplay? "Anomalie" : "Ok" }</td>
					<td class="tdSynth">Avis selon joueur</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">Touches/Clics:</td><td>♯{benchmark.synthese.nbClav}/♯{benchmark.synthese.nbClic}</td>
					<td class="tdSynth">Erreurs: ♯{benchmark.synthese.nbBad}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">Humain (ms):<br/>♯{benchmark.synthese.statsHu.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsHu.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsHu.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsHu.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsHu.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">jsEngine (♯/ms):<br/>
															ΣΔt={roundFloat(benchmark.synthese.statsJs.somme)}ms<br/>
															t<sub>max</sub>-t<sub>min</sub>={roundFloat(benchmark.synthese.jsGlobalEnd-benchmark.synthese.jsGlobalStart)}ms</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsJi.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsJi.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsJi.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsJi.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">cpuJitter (ms):<br/>
															ΣΔt={roundFloat(benchmark.synthese.statsJd.somme-benchmark.synthese.statsJs.somme)}ms</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsJd.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsJd.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsJd.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsJd.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">FPS={roundFloat(1000/benchmark.synthese.statsDe.moyenne)} Δ/tick:<br/>♯{benchmark.synthese.statsDe.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsDe.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsDe.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsDe.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsDe.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">{CANVAS_BY} Curves (ms):<br/>♯{benchmark.synthese.statsVe.nb*CANVAS_BY}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsVe.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsVe.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsVe.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsVe.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">GlobalBurst (ms):<br/>♯{benchmark.synthese.statsS0.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsS0.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsS0.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsS0.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsS0.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">NetworkBurst (ms):<br/>♯{benchmark.synthese.statsR0.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsR0.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsR0.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsR0.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsR0.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">ServerBurst (ms):<br/>♯{benchmark.synthese.statsC0.nb} (no map-reduce)</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsC0.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsC0.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsC0.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsC0.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">GlobalInit (ms):<br/>♯{benchmark.synthese.statsS1.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsS1.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsS1.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsS1.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsS1.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">NetworkInit (ms):<br/>♯{benchmark.synthese.statsR1.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsR1.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsR1.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsR1.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsR1.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">ServerInit (ms):<br/>♯{benchmark.synthese.statsC1.nb} (map-reduce)</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsC1.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsC1.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsC1.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsC1.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">GlobalRelax (ms):<br/>♯{benchmark.synthese.statsS2.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsS2.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsS2.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsS2.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsS2.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">NetworkRelax (ms):<br/>♯{benchmark.synthese.statsR2.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsR2.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsR2.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsR2.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsR2.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">ServerRelax (ms):<br/>♯{benchmark.synthese.statsC2.nb} (map-reduce)</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsC2.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsC2.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsC2.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsC2.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">GlobalRace (ms):<br/>♯{benchmark.synthese.statsS3.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsS3.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsS3.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsS3.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsS3.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">NetworkRace (ms):<br/>♯{benchmark.synthese.statsR3.nb}</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsR3.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsR3.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsR3.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsR3.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">ServerRace (ms):<br/>♯{benchmark.synthese.statsC3.nb} (map-reduce)</td>
					<td class="tdSynth">{@html htmlConst.moy}={roundFloat(benchmark.synthese.statsC3.moyenne)}<br/>
															{@html htmlConst.ect}={roundFloat(benchmark.synthese.statsC3.ect)}</td>
					<td class="tdSynth">{@html htmlConst.min}={roundFloat(benchmark.synthese.statsC3.min)}<br/>
															{@html htmlConst.max}={roundFloat(benchmark.synthese.statsC3.max)}</td>
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">Stress Curves:<br>Quadratic</td>
					<td class="tdSynth">♯{CANVAS_BY}</td>	
					<td class="tdSynth" colspan=3>/tick</td>	
				</tr>
				{@html htmlConst.tableSep}
				<tr>
					<td class="tdSynth">Stress serveur:<br/>map-reduce</td>
					<td class="tdSynth">♯200000</td>	
					<td class="tdSynth" colspan=3>/call</td>	
				</tr>
			</tbody>
			</table>
		</div>
		<div>
			Tu peux retourner à ta liste des Possibles en cliquent sur le bandeau en haut de ton écran ou
			recommencer un benchmark qui remplacera alors celui déjà stocké sur le serveur.
		</div>
	</div>
{/if}

{#if dspResultats}
	<div class="popupCadre papier">
		<div class="close" on:click={()=>dspResultats=null} role="button" on:keypress={null} tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div style="text-decoration: underline">Résultats actuels</div>
				<div style="font-size:0.8em">
					<div>Meilleur score en catégorie PC: {roundFloat(dspResultats.minPC)} ({dspResultats.nbPC} bench)</div>
					<div>Meilleur score en catégorie Smartphone: {roundFloat(dspResultats.minSM)} ({dspResultats.nbSM} bench)</div>
					{#if dspResultats.pseudoPC == pseudo || dspResultats.pseudoSM == pseudo }
						<div style="color: lightgreen">Tu es le plus réactif dans ta catégorie</div>
					{:else}
						<div style="color: orange">Tu n'es pas le plus réactif dans ta catégorie</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
	
{/if}

<!-- PAGE P311.svelte -->


