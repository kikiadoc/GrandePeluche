<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, urlCdnAI, apiCall, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownInit
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE, calcCagnotte, calcCagnotteNb }  from './ground.svelte.js'
	import Common from './Common.svelte'
	import Btn from './Btn.svelte'
	
	let {
		GBLCTX,
		wsCallComponents,
		pageDesc,
		pseudo,
		pseudoGenre,
		pseudoList,
		page = $bindable(0),
		pageDone = $bindable([]),
	} = $props();

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()
	const WSETAT = (()=>pageDesc.rootName+'.etat')()
	const APICONFIG = APIROOT+'config'
	const APIETAT = APIROOT+'etat'
	
	onMount(() => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// afficahge des popups standards 
	let dspResultats=$state(false) 	// affichage des résltats
	
	// appelé apres mount du component
	async function init() { await getConfig(); getEtat() }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op==WSETAT && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		s.debug ??= false
		s.noTimer ??= false
		s.enigmeNu ??= -1
		s.enigmeEcheance ??= 1
		s.lastBadReponse ??= 0
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}

	// calcul des timers
	function getTrouveEcheance(dthRef,nb,lastBad) {
		console.log("getTrouveEcheance",dthRef,nb,lastBad)
		if (lastBad) return lastBad+ 10*60000 // 10 minutes si mauvaise réponse 
		switch(nb) {
			case 0 : return dthRef + 1 // 1 pour toggle le countdown
			case 1 : return dthRef+ 5*60000
			case 2 : return dthRef+ 30*60000 
			case 3 : return dthRef+ 60*60000
			case 4 : return dthRef+ 180*60000
		}
		return dthRef+ 480*60000
	}
	function getSwapEcheance(dthRef,nb) {
		console.log("getSwapEcheance",dthRef,nb)
		// if (saisies.noTimer) return dthRef + 1
		switch(nb) {
			case 0 :
			case 1 : return dthRef + 1
			case 2 :
			case 3 :
			case 4 : return dthRef+ 2*60000
			case 5 :
			case 6 :
			case 7 :
			case 8 : return dthRef+ 4*60000
		}
		return dthRef+ 10*60000
	}
	// chargement etat du challenge 
	let CONFIG = $state(null)
	let etat = $state(null)
	async function getConfig(msgWs) {
		let ret = msgWs || await apiCall(APICONFIG);
		if (ret.status != 200) return console.error("erreur sur",APICONFIG, ret.status)
		// Listes des ENIGMES
		CONFIG = ret.o
	}
	async function getEtat(msgWs) {
		if (!CONFIG) return console.log("getEtat impossible sans CONFIG")
		let ret = msgWs || await apiCall(APIETAT);
		if (ret.status != 200) return console.error("erreur sur ", APIETAT,ret.status)
		let tEtat = ret.o
		// recalc selon le pseudo
		tEtat.myTrouveNb=0
		tEtat.myTrouveDth=1 // pas 0 pour declencher les chronos
		tEtat.myPoseNb=0
		tEtat.myPoseDth=1 // pas 0 pour declencher les chronos
		tEtat.totalTrouveNb=0
		tEtat.totalPoseNb=0
		let cagnottePseudosTrouve = []
		let cagnottePseudosPose = []
		for (let i=0; i < tEtat.elts.length; i++) {
			let e = tEtat.elts[i]
			if (e.trouvePseudo) {
				tEtat.totalTrouveNb++
				// calcul la liste pour la cagnotte
				if (! cagnottePseudosTrouve.includes(e.trouvePseudo))
					cagnottePseudosTrouve.push(e.trouvePseudo)
				if (i==e.targetIdx && ! cagnottePseudosPose.includes(e.posePseudo))
					cagnottePseudosPose.push(e.posePseudo)
			}
			if (e.trouvePseudo==pseudo) {
				tEtat.myTrouveNb++
				if (e.trouveDth > tEtat.myTrouveDth) tEtat.myTrouveDth = e.trouveDth
			}
			if (e.posePseudo==pseudo) {
				tEtat.myPoseNb++
				if (e.poseDth > tEtat.myPoseDth) tEtat.myPoseDth = e.poseDth
			}
			if (e.targetIdx==i) tEtat.totalPoseNb++
		}
		tEtat.isTrouvePossible = (tEtat.totalTrouveNb < CONFIG.SIZE*CONFIG.SIZE)
		tEtat.isPosePossible = (tEtat.totalPoseNb < CONFIG.SIZE*CONFIG.SIZE)
		// cagnotte
		tEtat.cagnottePseudosTrouve = cagnottePseudosTrouve
		tEtat.cagnottePseudosPose = cagnottePseudosPose
		tEtat.cagnotteNb = calcCagnotteNb(tEtat.cagnottePseudosTrouve.length,tEtat.cagnottePseudosPose.length)	
		tEtat.cagnotte = calcCagnotte(tEtat.cagnottePseudosTrouve.length,CONFIG.GILS,tEtat.cagnottePseudosPose.length)	
		// calcul des timers et autres info sliées au pseudo
		tEtat.myTrouveEcheance = getTrouveEcheance(tEtat.myTrouveDth,tEtat.myTrouveNb,saisies.lastBadReponse)
		tEtat.mySwapEcheance = getSwapEcheance(tEtat.myPoseDth,tEtat.myPoseNb)
		tEtat.myContributionTrouve = cagnottePseudosTrouve.includes(pseudo)
		tEtat.myContributionPose = cagnottePseudosPose.includes(pseudo)
		// commit du nouvel etat
		tEtat.fromIdx=null
		etat = tEtat
		// Si challenge termine, envoi la vidéo
		if (tEtat.totalPoseNb==tEtat.elts.length)
			playVideo("X-pharao/pharao2")
	}
	// une proposition est faite pour une enigme 
	function proposition(e) {
		let i = e.target.getAttribute('gpIdx')
		// vérification de la validite de la réponse
		if (saisies.enigmeNu<0) return // pas d'énigme en cours
		if (CONFIG.ENIGMES[saisies.enigmeNu].r != i) {
			saisies.lastBadReponse = Date.now()
			saisies.enigmeNu = -1
			saisies.enigmeEcheance = 0
			etat.myTrouveEcheance = getTrouveEcheance(etat.myTrouveDth,etat.myTrouveNb,saisies.lastBadReponse)
			// mauvaise réponse
			displayInfo({titre:"Noob!",body:["Tu n'as pas indiqué la bonne réponse","Une nouvelle enigme te sera proposée plus tard"], autoClose:10, ding:"prout-long"})
			return
		}
		apiCall(APIROOT+'proposition/idxSol/idxProp','POST')
		saisies.enigmeNu = -1
		saisies.lastBadReponse = 0
		saisies.enigmeEcheance = 0
	}
	// initialise l'image pour le canvas (chargement pour les canvas)
	let pharaoImage = new Image()
	let pharaoImagePromise = new Promise( (ok,ko) => {
		pharaoImage.onload = function () { console.log("image chargée",pharaoImage.src); ok(true) }
		pharaoImage.onerror = function () { console.log("image error",pharaoImage.src); ko(false) }
		pharaoImage.src = urlCdn+"X-pharao/imagePharao600x600.png";
	})
	// constuit le canvas d'un node
	async function buildCanvas(node) {
		// console.log("buildCanvas wait image")
		await pharaoImagePromise // atente si besoin du chargement de l'image
		let idx = node.getAttribute("idx")
		let targetIdx = etat.elts[idx].targetIdx
		let isTrouve = etat.elts[idx].trouvePseudo
		let px = targetIdx % CONFIG.SIZE
		let py = Math.floor(targetIdx / CONFIG.SIZE)
		// coordonnées dans l'image 
		const context = node.getContext('2d')
		// console.log("buildCanvas",idx,targetIdx,px,py,node.width,node.height)
		if (isTrouve)
			context.drawImage(pharaoImage, 100*px, 100*py, 100, 100, 0, 0, node.width, node.height)
	}

	// Calcule une question (si besoin)
	function newQuestion(noKeep) {
		if ( (saisies.enigmeNu >= 0) && (saisies.enigmeEcheance>Date.now())) return // si question en cours
		console.log("newQuestion")
		saisies.enigmeNu = Math.floor(Math.random() * CONFIG.ENIGMES.length)
		saisies.enigmeEcheance=Date.now()+CONFIG.ENIGMETIMER
	}
	// click sur un element
	function pharaoClick(n){
		if (saisies.debug) displayObject({pos: n, etat: etat.elts[n]})
		if (! etat.isPosePossible) {
			displayInfo({titre:"Impossible", body:["Tous les fragments de Pharao sont bien positionnés"]})
			return
		}
		if (etat.mySwapEcheance>Date.now()) {
			displayInfo({titre:"Impossible", body:["Tu ne peux pas encore échanger des fragments de Pharao"]})
			return
		}
		if (etat.fromIdx===null)
			// debut d'un switch
			etat.fromIdx = n
		else if (etat.fromIdx==n)
			// annulation d'un switch
			etat.fromIdx = null
		else {
			// Test si origine ou destination bien posée
			if ( (etat.elts[n].targetIdx==n && etat.elts[n].trouvePseudo) || 
					 (etat.elts[etat.fromIdx].targetIdx==etat.fromIdx && etat.elts[etat.fromIdx].trouvePseudo) ) {
				displayInfo({titre:"Echange impossible", body:["Une force magnétique semble coller ces fragments"]})
				// annulation d'un switch
				etat.fromIdx = null
				return
			}
			// tentative de switch  
			apiCall(APIROOT+"swap/"+etat.fromIdx+'/'+n,'POST')
		}
	}

	// calcul des résultsts
	function calcResultats() {
		let res = { byPseudo: {}, tTotal:0, sTotal:0, pTotal:0 }
		// displayObject(etat)
		for (let i=0; i< etat.elts.length; i++) {
			let e=etat.elts[i]
			if (e.trouvePseudo) {
				res.byPseudo[e.trouvePseudo] ??= { t: 0, s: 0, p:0}
				res.byPseudo[e.trouvePseudo].t++
				res.tTotal++
			}
			if (e.posePseudo) {
				res.byPseudo[e.posePseudo] ??= { t: 0, s: 0, p:0}
				res.byPseudo[e.posePseudo].s++
				res.sTotal++
				if (e.targetIdx==i) {
					res.byPseudo[e.posePseudo].p++
					res.pTotal++
				}
			}
		}
		dspResultats = res
	}

	
</script>

<style>
	.table {
		background-size: 100% 100%; background-position: center;
		width: 90%; margin: auto; padding: 0; border: 0;
		border-spacing: 0; border-collapse: collapse;
		cursor: pointer; aspect-ratio:2/1; 
	}
	.tbody { }
	.tr { padding: 0; margin: 0px; border: 0 }
	.td { padding: 0; margin: 0px; border: 0; position:relative; }
	.canvas {
		padding: 0; margin: 0; border:0; width: 100%; height:100%;
		position: absolute; top:0; left:0;
	}
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if isAdmin(pseudo) && etat}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin: {pageDesc.n}/{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="ResetAll" onclick={() => confirm("Tout effacer?") && apiCall(APIROOT+'etat','DELETE') } />
				<input type="button" value="SetAll-2" onclick={() => confirm("Tout valider?") && apiCall(APIROOT+'setAll','DELETE') } />
				<input type="button" value="TimerEnigme" onclick={() => etat.myTrouveEcheance=Date.now()+5000 } />
				<input type="button" value="TimerSwap" onclick={() => etat.mySwapEcheance=Date.now()+5000 } />
				<input type="number" min=0 max={CONFIG.ENIGMES.length-1} placeholder="enigme" bind:value={saisies.admEnigme} />
				<input type="button" value="goEnigme" onclick={() => saisies.enigmeNu=saisies.admEnigme} />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
				<span>Enigme:{saisies.enigmeNu}</span>
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
		<Common t="headerPage" pageDesc={pageDesc} />
	</div>
	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			{pseudo},
			depuis la venue de Thor, nous savons qu'une	sixième dimension existe,
			et que le docteur Daniel Jackson est parti l'explorer.
			<div class="br"/>
			Lors de nos, trop rares, visios interdimensionnelles,
			Daniel nous fait part	de ses découvertes.
			<br/>
			Dernièrement, il s'est rendu sur un lieu appelé
			la
			Terre
			du
			Système Solaire
			de la 
			Voie Lactée
			et a rencontré les Humains de la Terre.
			<div class="br"/>
			Selon Daniel, leur Temps est notre Hyper-Temps.
			<div class="br"/>
			Inquiets de la stabilité de leur Temps,
			les Humains de la Terre ont entrepris le projet Pharao pour vérifier que leur Temps
			ne présente pas de fluctuation.
			<br/>
			<Btn bind:refStep={epiqStep} step=10 video="X-pharao/pharao1" val="Le projet Pharao?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<input type="button" value="Revoir la video" gpVideo="X-pharao/pharao1" onclick={markClick} />
			<br/>
			C'est ainsi que les Humains de la Terre ont présenté leur projet Pharao à Daniel.
			<div class="br"/>
			Les Humains de la Terre n'en sont qu'à la vérification
			d'une Physique régissant un univers à quatre dimensions
			selon la
			<a href="https://fr.wikipedia.org/wiki/Relativit%C3%A9_g%C3%A9n%C3%A9rale" target="gpHelp">
				relativité générale
			</a>.
			<div class="br"/>
			Depuis que les Quatre sont partis explorer l'Ortho-Temps et depuis la visite
			de Thor depuis l'Hyper-Temps, nous savons que notre univers
			comporte au moins 6 dimensions de base (3 spaciales, 3 temporelles).
			C'est encore bien peu si on considère les
			<a href="https://fr.wikipedia.org/wiki/Introduction_%C3%A0_la_th%C3%A9orie_M" target="gpHelp">
				11 dimensions quantiques de la Théorie M
			</a>, théorie que les plus éminentes Peluches Mathématiciennes et Physiciennes tentent de
			finaliser.
			<div class="br"/>
			Le savoir des Peluches est plus avancé que celui des Humains de la Terre,
			pourtant Daniel était très troublé lors de notre dernière visio interdimensionnelle.
			<br/>
			<Btn bind:refStep={epiqStep} step=20 val="Daniel? Troublé?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Oui {pseudo}, Daniel était troublé!
			<div class="br"/>
			Selon son hypothèse, les fluctuations du Temps des Humains de la Terre
			seraient dues aux explosions temporelles survenues
			lorsque Méphistophélès s'est transporté depuis notre Temps vers l'Ortho-Temps puis
			ensuite vers l'Hyper-Temps sans capote temporelle.
			<div class="br"/>
			Bref, Méphistophélès a souillé les Dimensions!
			<br/>
			<Btn bind:refStep={epiqStep} step=22 val="Quel salopiot!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==22}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Oui, tu l'as dit {pseudo}, Méphistophélés était un vrai salopiot.
			<div class="br"/>
			Pour nous, comme pour les Humains de la Terre,
			il semble simple d'appréhender les coordonnées spatiales
			X,Y,Z indiquées sur nos boussoles.
			<br/>
			Mais imagine que, face à un primordial, tu veux faire un pas à gauche,
			et qu'au lieu de t'en éloigner, tu t'en approches en faisant un demi-pas à gauche
			et un pas en avant, et alors, bim, en plein dans l'AOE!
			<br/>
			En ne maîtrisant plus tes mouvements, 
			tu n'as plus aucune chance de le vaincre!
			<div class="br"/>
			Voila ce que Daniel redoute pour nos trois dimensions temporelles:
			Une fluctuation de leurs
			<a href="https://fr.wikipedia.org/wiki/Orthogonalit%C3%A9" target="gpHelp">
				orthogonalités
			</a>.
			<div class="br"/>
			Je commence à bien te connaitre {pseudo}.
			Tu penses à la possibilité d'une téléportation temporelle...
			<br/>
			<Btn bind:refStep={epiqStep} step=25 val="Oui!" />
			<Btn bind:refStep={epiqStep} step=26 val="Non!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==25}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Je m'en doutais, mais tu es un petit scarabée.
			<div class="br"/>
			La téléportation multidimensionnelle se base au contraire
			sur de parfaites orthogonalités entre les Dimensions.
			<div class="br"/>
			<Btn bind:refStep={epiqStep} step=30 val="Evidemment!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==26}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			C'est vilain de mentir, je sais que tu y as pensé.
			<div class="br"/>
			Mais la téléportation multidimensionnelle se base au contraire
			sur de parfaites orthogonalités entre les Dimensions.
			<div class="br"/>
			<Btn bind:refStep={epiqStep} step=30 val="Evidemment!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Les fluctuations de l'Orthogonalité des dimensions temporelles pourraient, selon Daniel,
			expliquer les récentes disparations inquiétantes de nombreuses peluches en Eorzéa. 
			<div class="br"/>
			{pseudo}, toi qui semble tellement au fait de l'importance des Orthogonalités,
			saurais-tu m'indiquer une des Peluches ayant disparu d'Eorzéa selon la théorie de Daniel?
			<div class="br"/>
			<Btn msg="Mais non, Althea Arlert, c'est le nom de mon Illustrateur" val="Althea" />
			<Btn msg="Mais non, Kikiadoc Lepetiot, c'est le nom de mon patron. Et quand on le connait, on l'appelle Kikiadoc. Et après quelques années, je me permets de l'appeler Kiki!" val="Lepetiot" />
			<Btn msg="Mais non, Althea Arlert, c'est le nom de mon Illustrateur" val="Arlert" />
			<Btn msg="Voilà, ce n'était pas bien compliqué" bind:refStep={epiqStep} step=35 val="Khloe" />
			<Btn msg="Mais non, Kikiadoc c'est mon patron. En son absence je ne serai pas quoi faire!" val="Kikiadoc" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==35}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Je pense que Thor, de façon sibylline, va aider les Humains de la Terre à
			analyser les fluctuations de leur Temps, notre Hyper-Temps.
			<div class="br"/>
			Mais les Humains de la Terre n'ont pas connaissance de notre Temps
			ni de l'Ortho-Temps.
			<div class="br"/>
			Pour vérifier la théorie de Daniel, et bien avant de nous lancer à la
			recherche des Peluches Perdues,
			il nous faut construire
			des Pharao afin d'examiner les fluctuations de ces deux Dimensions.
			<br/>
			<Btn bind:refStep={epiqStep} step=40 val="On va construire des Pharao!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==40}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Tout à fait {pseudo}.
			<div class="br"/>
			Et nous avons un peu de chance: Si Méhistophélès s'est transporté facilement
			entre les Dimensions, c'est parce que les Nouveaux Anciens avaient construit
			un Pharao sur Eorzéa.
			<br/>
			Les explosions temporelles de Méphistophélès l'ont brisé.
			<br/>
			Des fragments de Pharao ont alors été dispersés dans différents lieux d'Eorzéa.
			<div class="br"/>
			{pseudo}, contriburas-tu à rétablir les Orthogonalités entre
			le Temps, l'Ortho-Temps et l'Hyper-Temps?
			<div class="br"/>
			<div class="">
				C'est la condition pour que 
				<a href="https://fr.wikipedia.org/wiki/Expansion_de_l%27Univers" target="gpHelp">
					l'Expansion de notre Univers Connu
				</a>
				se poursuive sans un
				<a href="https://fr.wikipedia.org/wiki/Armageddon" target="gpHelp">
				Armageddon
				</a>
				entre les Dimensions.
			</div>
			<div>
				Ce n'est qu'ensuite que nous pourrons espérer retrouver les Peluches disparues.
			</div>
			<Btn bind:refStep={epiqStep} step=50 val="Carrément l'EXPANSION de l'Univers Connu!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==50}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Et oui, simplement permettre à l'Univers Connu de continuer de s'expanser!
			<br/>
			Bien sûr que je compte sur toi, {pseudo}.
			<div class="br" />
			Je suis sûre que tu seras bientôt
			{G(pseudoGenre,"l'un des aventuriers","l'une des aventurières")}
			dont le nom brillera sur la première de couverture du
			Grand Grimoire des Savoirs.
			<div class="br" />
			Mais avant cela, nous devons reconstituer le Pharao brisé.
			<div class="info">
				⚠️Les gains de ce challenge sont fonction d'une
				<span class="imgLink" onclick={markClick} gpImg={"commons/cagnotte.png"} gpImgClass="img100">
					cagnotte basées sur deux types de Contributions.
				</span>
				<br/>
				En cliquant sur le bouton "résultats", tu verras le détail du calcul des contributions.
				<br/>
				N'hésite pas à partager stratégies et questionnements sur Discord.
				<br/>
				Toutes les positions sont identifiées par un numéro afin de faciliter tes discussions.
				<br/>
				Je te laisse découvrir les autres mécaniques de ce challenge.
			</div>
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div>
			<span onclick={markClick} style="cursor:pointer" gpImg="commons/cagnotte.png" 
				gpHelp="C'est la cagnotte.
								Elle augmente de façon exponentielle selon les contributions qui sont de deux types:
								Le nombre de personnes ayant découvert au moins un fragment de Pharao
								et le nombre de personnes ayant positionné correctement un fragment de Pharao.
								Tu peux cliquer sur le bouton 'résultats' pour voir la répartition actuelle.">
				💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}
			</span>
			{#if etat.isTrouvePossible}
				<span onclick={markClick} style="cursor:pointer"
					gpHelp="Delai avant de pouvoir découvrir un fragment de Pharao. Réponds à l'énigme quand elle est affichée">
					<span style="color: green">🔎</span>
					{#if saisies.enigmeEcheance > Date.now()}
						Possible
					{:else}
						<countdown dth={etat.myTrouveEcheance} oncdTimeout={newQuestion} txtTimeout="Possible" use:countDownInit />
					{/if}
				</span>
				{#if !etat.myContributionTrouve}
					<span class="blinkFlag" onclick={markClick} style="cursor:pointer"
						gpHelp="Tu n'as pas encore trouvé de fragment de Pharao.
										C'est important pour la Contribution,
										n'hésite pas à demander de l'aide sur Discord!">
						❇️
					</span>
				{/if}			
			{:else}
				<span onclick={markClick} style="color:red; cursor:pointer"
					gpHelp="Tous les fragments de Pharao ont été trouvés">
					🛇 Terminé
				</span>
			{/if}
			{#if etat.isPosePossible}
				<span onclick={markClick} style="cursor:pointer"
					gpHelp="Délai avant de pouvoir échanger des fragments de Pharao. Quand cela est possible, tu peux cliquer sur un fragment de Pharao pour l'échanger avec un autre afin d'en reconstituer la structure" >
					<span style="color: green">✥</span>
					<countdown dth={etat.mySwapEcheance} txtTimeout="Possible" use:countDownInit />
				</span>
				{#if !etat.myContributionPose}
					<span class="blinkFlag" onclick={markClick} style="cursor:pointer"
						gpHelp="Tu n'as pas encore placé un fragment de Pharao à sa bonne position.
										C'est important pour la Contribution,
										n'hésite pas à demander de l'aide sur Discord!">
						❇️
					</span>
				{/if}			
			{:else}
				<span onclick={markClick} style="color:red; cursor:pointer" gpHelp="Tous les fragments de Pharao ont été assemblés">
					🛇 Terminé
				</span>
			{/if}
		</div>
		<div class="adminCadre papier scrollbar">
			{#if etat.isTrouvePossible && saisies.enigmeNu >= 0}
				{@const enigme=CONFIG.ENIGMES[saisies.enigmeNu]}
				{enigme.l}
				<div>
					{#each enigme.o as o,i}
						<input type="button" value={o} gpIdx={i} onclick={proposition} />
					{/each}
				</div>
				<div class="info">
					Tu dois répondre en moins de 
					<countdown dth={saisies.enigmeEcheance} oncdTimeout={newQuestion} use:countDownInit />
				</div>
				{#if saisies.debug}
					<div class="adminCadre">
						Soluce: {enigme.r} {enigme.o[enigme.r]}
					</div>
				{/if}
			{:else if etat.isPosePossible}
				Repose-toi un peu avant de chercher un fragment de Pharao.
				<div class="petit blinkMsg">
					Tu peux améliorer ton score en aidant les autres. Discute sur Discord!
				</div>
			{:else}
				Pharao a été reconstruit.
				<br/>
				Propulsé par Peluche VI, il se dirige vers le
				<a href="https://fr.wikipedia.org/wiki/Point_de_Lagrange" target="gpHelp">
					Point de Lagrange L1
				</a>
				du système d'Eorzéa
			{/if}
		</div>
		<div class="parchemin">
			<table class="table">
				<tbody class="tbody">
					{#each Array(CONFIG.SIZE) as _,l}
						<tr class="tr">
							{#each Array(CONFIG.SIZE) as _,c}
								{@const idx = l*CONFIG.SIZE+c}
								{#key etat.elts[idx] || etat.fromIdx }
									{@const cls = (idx===etat.fromIdx)?"td tdBlink":"td"}
									<td class={cls} onclick={()=>pharaoClick(idx,etat.elts)}>
										<span style="visibility: hidden; font-size: 1.6em;">?</span>
										<canvas class="canvas" idx={idx} use:buildCanvas />
										<span style="font-size: 0.5em; position: absolute; top:0; left:0">{idx+1}</span>
									</td>
								{/key}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if dspResultats && etat && CONFIG}
		{@const tblPseudos = Object.keys(dspResultats.byPseudo)}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Résultats: 💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}⇒ {etat.cagnotte.toFixed(1)}M/{CONFIG.GILS}M Gils
					</div>
					<table class="resTable">
						<tbody >
							<tr class="info">
								<td>Pseudos</td>
								<td>Trouvés</td>
								<td>Placés</td>
								<td>%</td>
								<td>Gils</td>
								{#if saisies.debug}
									<td style="color:red">Swaps</td>
									<td style="color:red">Coef</td>
								{/if}
							</tr>
							{#each tblPseudos as p,i}
								{@const bp=dspResultats.byPseudo[p]}
								{@const coef= (bp.t+bp.p) / (dspResultats.tTotal+dspResultats.pTotal)}
								<tr>
									<td class="resTd">
										<img style="width: 1em" alt="" src={urlCdnAI+"pseudo-"+p+".jpg"} />
										{p}
									</td>
									<td class="resTd">{#if bp.t>0}🪙{/if}{bp.t}</td>
									<td class="resTd">{#if bp.p>0}🪙{/if}{bp.p}</td>
									<td class="resTd">{Math.round(100*coef)}%</td>
									<td class="resTd">
										{ (etat.cagnotte*coef).toFixed(3) }M
									</td>
									{#if saisies.debug}
										<td style="color:red">{bp.s}</td>
										<td style="color:red">{coef}</td>
									{/if}
								</tr>
							{/each}
							<tr class="petit">
								<td>Contributions</td>
								<td>🪙={etat.cagnottePseudosTrouve.length}</td>
								<td>🪙={etat.cagnottePseudosPose.length}</td>
								<td></td>
								<td colspan=3>
									💰{etat.cagnotteNb}=min({etat.cagnottePseudosTrouve.length},{etat.cagnottePseudosPose.length},{GBLCONST.EQUILIBRAGE.NB})
								</td>
							</tr>
						</tbody>
					</table>
					<div class="info">
						⚠️Les gains varient tant que le challenge n'est pas terminé
					</div>
				</div>
			</div>
		</div>
	{/if}
	

</div>
<!-- P410.svelte -->

