<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, apiCall, isAdmin, urlCdnAI,
					 displayObject, addNotification, playVideo,
					 isProd, countDownTo, hhmmssms, isDistance, countDownInit,
					 getEpsilon, jjmmhhmmss, intCountBits32
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE,calcCagnotte,calcCagnotteNb }  from './ground.svelte.js'
	import Btn from './Btn.svelte'
	import Common from './Common.svelte'
	
	let {
		GBLCTX,
		wsCallComponents,
		pageDesc = null,
		pseudo,
		pseudoGenre,
		pseudoList,
		page = $bindable(0),
		pageDone = $bindable([]),
	} = $props();

	// svelte-ignore state_referenced_locally
	const PAGEEPIQLBL= "P"+pageDesc.n+"_epiqStep"
	// svelte-ignore state_referenced_locally
	const PAGESAISIESLBL = "P"+pageDesc.n + "_saisies"
	// svelte-ignore state_referenced_locally
	const APIROOT = '/'+pageDesc.rootName+'/'
	// svelte-ignore state_referenced_locally
	const WSETAT = pageDesc.rootName+'.etat'
	const FAILTIMER = 1* 60000
	const VIDEOFINALE = "commons/videoafaire"	
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
	async function init() { console.log('**init 440**'); await getConfig(); await getEtat() }
	
	// appelé apres unmount du component
	function reset() { console.log('**reset 440**')	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true 
		if (m.op==WSETAT && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		s.admGoStep ??= 0
		s.debug ??= false
		s.questionNextEcheance ??= 0
		// s.questionIdx ??= null
		// s.elixirEcheance??=1 
		// s.propositionLastEcheance??=1	
		// s.pipoVal ??= 0 // exemple de normalized
		// s.noTimer??=false
		// retur saisies normalized
		return s
	}

	// appelé lors d'un changement de step de l'épique 
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// chargement config du challenge
	let CONFIG = $state.raw(null)
	async function getConfig(msgWs) {
		let ret = msgWs || await apiCall(APIROOT+'config');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"config", ret.status)
		CONFIG = ret.o
	}
	// chargement etat du challenge 
	let etat = $state(null)
	let etatVideo=false // si video finale affichée
	async function getEtat(msgWs) {
		if (!CONFIG) return console.log("****************** GETETAT sans CONFIG")
		let ret = msgWs || await apiCall(APIROOT+'etat');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"etat", ret.status)
		recalcEtat(ret.o)
	}
	function refreshEtat(e) {
		let tEtat = Object.assign({},etat)
		etat=null
		console.log("*****************RECALCETAT",tEtat)
		recalcEtat(tEtat)
	}
	const STATUS = { PREMIER:1, ENCOURSAUTRE:2, ENCOURS:3, TIMER:4, DISPO:5, ERREUR:0 }
	function recalcStatusQuestion(q,p) {
		let nowSrv = Date.now()-getEpsilon()
		q.myStatus=
			(q.firstPseudo==pseudo) ? STATUS.PREMIER :
			(q.tryPseudo==pseudo && q.tryEcheance>nowSrv)? STATUS.ENCOURS :
			(q.tryPseudo && q.tryEcheance>nowSrv)? STATUS.ENCOURSAUTRE :
			(q.nextEcheance>nowSrv) ? STATUS.TIMER :
			(q.nextEcheance<=nowSrv) ? STATUS.DISPO :
			STATUS.ERREUR
	}
	function recalcEtatEvent(e) {
		recalcEtat()
	}
	function recalcEtat(tEtat) {
		if (!tEtat) tEtat=Object.assign({},etat)
		let nowLoc = Date.now()
		let nowSrv = nowLoc+getEpsilon()
		let lpQ = [] // liste des pseudos ayant répondu a une eniogme  
		let lpC = [] // liste des pseudos ayant envoyé un composant
		tEtat.myQuestionIdx = null;
		tEtat.questions.forEach ( (q,i)=> {
			if (q.firstPseudo) {
				if (!lpQ.includes(q.firstPseudo)) lpQ.push(q.firstPseudo)
			}
			// premier, encours, disponible, timer, , dejarepondu, 
			recalcStatusQuestion(q,tEtat.pseudos[pseudo])
			if (q.myStatus==STATUS.ENCOURS) tEtat.myQuestionIdx = i
		} )
		tEtat.myComposantsTrouvesNb = 0
		tEtat.totalComposantsTrouvesNb = 0
		tEtat.composants.forEach ( (c)=> {
			if (c.elixirPseudo) {
				tEtat.totalComposantsTrouvesNb++
				if (c.elixirPseudo==pseudo) tEtat.myComposantsTrouvesNb++
				if (!lpC.includes(c.elixirPseudo)) lpC.push(c.elixirPseudo)
			}
		} )
		
		tEtat.lpQ = lpQ
		tEtat.lpC = lpC
		tEtat.flagObjetFirst = lpQ.includes(pseudo)
		tEtat.flagComposantFirst = lpC.includes(pseudo)
		
		tEtat.cagnotteNb=calcCagnotteNb(tEtat.lpQ.length,tEtat.lpC.length)
		tEtat.cagnotte=calcCagnotte(tEtat.lpQ.length,CONFIG.GILS,tEtat.lpC.length)
		tEtat.challengeTermine = (tEtat.totalComposantsTrouvesNb==tEtat.composants.length)
		// commit
		etat=tEtat

		// mise à jour en fonction du nouvel état
		saisies.questionEcheance =  (etat.myQuestionIdx===null)? 0 : etat.questions[etat.myQuestionIdx].tryEcheance
		// saisies<!>.questionNextEcheance = 
		if (dspQuestion) dspQuestion = (etat.myQuestionIdx!==null)? etat.questions[etat.myQuestionIdx] : null
		if (dspComposant)	displayComposant()

		// vido finale
		if (etat.challengeTermine && !etatVideo) {
			etatVideo=true
			playVideo(VIDEOFINALE)
		}	
	}

	let dspQuestion=$state(null) // option d'action sur un element
	// affiche la question, e est l'event source
	function clickQuestion(e) {
		let i = parseInt((e && e.currentTarget.getAttribute("gpIdx")),10)
		let q = etat.questions[i]
		recalcStatusQuestion(q,etat.pseudos[pseudo])
		switch(q.myStatus) {
			case STATUS.PREMIER:
				displayInfo({titre: "Primo-extraction!",
										 body:["Tu as été "+G(pseudoGenre,"le premier","la première")+" à y extraire de l'élixir",
													 "Tu ne peux plus extraire d'élixir à cet endroit"],
										 img: urlCdn+"commons/hamac-sommeil.gif",
										 imgClass:"img50"
										})
				dspQuestion = null
				break
			case STATUS.ENCOURSAUTRE:
				displayInfo({titre: "Recherche...",
										 body:[
											 q.tryPseudo+" tente d'extraire de l'élixir de cet objet",
											 "("+countDownTo(q.tryEcheance)+")"
										 ],
										 img: urlCdn+"commons/hamac-sommeil.gif",
										 imgClass:"img50"
										})
				dspQuestion = null
				break
			case STATUS.ENCOURS:
				if (saisies.questionNextEcheance >= Date.now()) {
					displayInfo({titre: "Repose-toi",
											 body:[
												 "Tu ne peux pas encore identifier un objet",
												 "("+countDownTo(saisies.questionNextEcheance)+")"
											 ],
											 img: urlCdn+"commons/hamac-sommeil.gif",
											 imgClass:"img50"
											})
					dspQuestion = null
					return
				}
				dspQuestion = q
				break
			case STATUS.TIMER:
				displayInfo({titre: "Extraction récente",
										 body:[q.lastPseudo+" a récemment extrait de l'élixir de cet objet"],
										 img: urlCdn+"commons/hamac-sommeil.gif",
										 imgClass:"img50"
										})
				dspQuestion = null
				break
			case STATUS.DISPO:
				if (saisies.questionNextEcheance >= Date.now()) {
					displayInfo({titre: "Repose-toi",
											 body:[
												 "Tu ne peux pas encore identifier un objet",
												 "("+countDownTo(saisies.questionNextEcheance)+")"
											 ],
											 img: urlCdn+"commons/hamac-sommeil.gif",
											 imgClass:"img50"
											})
					dspQuestion = null
					return
				}
				if (etat.myQuestionIdx!==null && etat.myQuestionIdx!=i) {
					displayInfo({titre: "Concentre-toi!",
											 body:["Tu es déjà à la recherche de l'objet #"+(etat.myQuestionIdx+1),
														 "pour en extraire de l'élixir"],
											 img: urlCdn+"commons/course.gif",
											 imgClass:"img50"
											})
					return
				}
				// anticipe la maj server
				saisies.questionNextEcheance = 0
				q.status=STATUS.ENCOURS
				q.tryPseudo=pseudo
				q.tryEcheance = Date.now() + CONFIG.TIMERQUESTIONRESOLU;
				dspQuestion = q
				apiCall(APIROOT+"tryQuestion/"+q.i,"POST")
		}
	}
	// fait une propositionQuestion pour l'objet par l'event e
	async function propositionQuestion(e) {
		let i = parseInt(e && e.currentTarget.getAttribute("gpIdx"))
		console.log("propositionQuestion:"+i+" l:"+saisies.pL+" px:"+saisies.pX+" py:"+saisies.pY)
		dspQuestion=null
		// vérif de la solution en local 
		let cQ = CONFIG.QUESTIONS[i]
		if ( cQ.l==saisies.pL && isDistance(saisies.pX,saisies.pY,cQ.x,cQ.y,cQ.d) ) {
			saisies.questionNextEcheance = Date.now()+CONFIG.TIMERQUESTIONSUCCES
			saisies.questionEcheance = 1
			let ret= await apiCall(APIROOT+"propositionQuestion/"+i,"POST",{l:saisies.pL, x:saisies.pX, y:saisies.pY})
			if (ret.status==200) playVideo("X-orthocomposants/orthocomposants-1")
		}
		else {
			saisies.questionNextEcheance = Date.now()+CONFIG.TIMERQUESTIONFAIL
			saisies.questionEcheance = 1
			displayInfo({
				titre:"Mauvaise localisation",
				img: "commons/fail.gif",
				body:[
					"Je ne vois pas d'objet permettant l'extraction d'élixir à cet endroit:",
					"("+CONFIG.LIEUX[saisies.pL].lbl+","+saisies.pX+","+saisies.pY+")",
					{cls:"info", txt:"⚠️Superpose exactement ton personnage sur ta cible et indique les coordonnées exactes de ta boussole"}
				],
			})
		}
	}

	let dspComposant=$state(null)
	// affiche le composant, e est l'event source si null, utilise le précédent du dspComposant 
	function displayComposant(e) {
		if (etat.challengeTermine) {
			displayInfo({titre: "Challenge terminé",body:[{txt:"Revoir la vidéo", cb: ()=>playVideo(VIDEOFINALE)}]})
			dspComposant=null
			return
		}
		let i = parseInt((e && e.currentTarget.getAttribute("gpIdx")) || (dspComposant && dspComposant.i),10)
		dspComposant=Object.assign({},etat.composants[i])
		if (saisies.debug) displayObject({composant: dspComposant, map: CONFIG.MAP[i] })
	}
	// fait une proposition pour Composant i 
	async function propositionComposant(i) {
		console.log("propositionComposant:"+i)
		saisies.elixirEcheance = Date.now() + (etat.myComposantsTrouvesNb+1) * CONFIG.TIMERELIXIR
		dspComposant=null
		let ret=await apiCall(APIROOT+"propositionComposant/"+i,"POST")
		switch(ret.status) {
			case 200:
				playVideo("X-orthocomposants/orthocomposants-2")
				break
			case 201: 
				// addNotification("Pas assez d'élixir selon le serveur","yellow",30)
				break
		}
	}
	
	// calcul des résultsts
	function calcResultats() {
		let res={ byPseudo: {}, totalQ: 0, totalC:0 }
		Object.keys(etat.pseudos).forEach( (p) => {
			res.byPseudo[p] ??= { nbQ: 0, nbC:0 }
			res.byPseudo[p].nbQ = intCountBits32(etat.pseudos[p].qMask)
			res.totalQ += res.byPseudo[p].nbQ
		} )
		etat.composants.forEach( (e) => {
			if (e.elixirPseudo) {
				res.byPseudo[e.elixirPseudo] ??= { nbQ: 0, nbC:0 }
				res.byPseudo[e.elixirPseudo].nbC++
				res.totalC ++
			}
		})
		if (saisies.debug) displayObject(res)
		dspResultats = res
	}
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bungee+Tint&display=swap');
	.rune {
		padding: 0.1em; border: 5px outset; /* height: 1.9em; margin: 5px; */ 
		cursor: pointer;
		font-size:1.1em; font-weight: bold;
	}
	.runeR {background-color: red;	}
	.runeY {background-color: yellow;	}
	.runeV {background-color: green;	}
	.table {
		background-image: url('https://cdn.adhoc.click/V10a/X-pharao/Pharao.png');
		background-size: 100% 100%; background-position: center; 
		width: 100%; margin: auto; padding: 0; border: 0;
		border-spacing: 0; border-collapse: collapse;
		border: 0; text-align: center; cursor: pointer;
	}
	.tbody { }
	.tr { }
	.td { height: 2em;font-size:0.7em; text-align:top; border: 1px solid white }
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if isAdmin(pseudo)}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin:
				{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="resetAll" onclick={() => confirm("Tout effacer?") && apiCall(APIROOT+'resetAll','DELETE') } />
				<input type="button" value="setAll" onclick={() => confirm("Tout valider?") && apiCall(APIROOT+'setAll','DELETE') } />
				<input type="button" value="ResetQuestionNextEcheance" onclick={() => saisies.questionNextEcheance=Date.now()+4000 } />
				<input type="button" value="ReserTimerQuestion" onclick={() => saisies.questionEcheance=Date.now()+4000 } />
				<input type="button" value="ReserTimerCompo" onclick={() => saisies.elixirEcheance=Date.now()+4000 } />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
				<!-- <label><input type="checkbox" bind:checked={saisies.noTimer} />NoTimer</label> -->
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
			Le Pharao d'Eorzéa poursuit son voyage vers le Point de Lagrange.
			<br/>
			Nous finalisons les Bases Pharao sur Eorzéa et
			l'Ortho-Temps est purifié progressivement.
			<div class="br"/>
			Il nous faut maintenant construire un Pharao pour l'Ortho-Temps: l'Ortho-Pharao.
			<br/>
			<Btn bind:refStep={epiqStep} step=20 val="Explique-moi!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Le Pharao de l'Ortho-Temps
			nécessite les mêmes composants que celui d'Eorzéa,
			mais pour pouvoir envoyer Pharao dans l'Ortho-Temps, 
			il faut	phaser chacun des composants.
			<br/>
			Ceci peut être fait en utilisant des molécules d'élixir de conversion de phase:
			Ces molécules peuvent être extraites de certains objets.
			<br/>
			Le Grand Grimoire des Savoirs les mentionnent sous forme d'énigmes référencant
			le lieu où un tel objet peut être trouvé.
			<br/>
			Je pense que tous ces objets se trouvent dans la maison de CL de Kikiadoc
			ou dans les chambres associées.
			<br/>
			Je compte sur toi pour identifier ces lieux et extraire des molécules d'élixir.
			<br/>
			Phaser un composant nécessite une 
			<a target="gpHelp" href="https://fr.wikipedia.org/wiki/Quantit%C3%A9_de_mati%C3%A8re">
				quantité très variable de molécules d'élixir
			</a>
			(entre 2000000 et 9000000
			<span class="infoLink" onclick={markClick} gpHelp="rmol est une mesure de la quantité de matière selon le système internationnal, voir en bas de page pour des détails" >
				rmol
			</span>)
			selon la complexité du composant.
			<br/>
			<Btn bind:refStep={epiqStep} step=80 val="Je veux être {G(pseudoGenre,"maître","maîtresse")} des Phases" />
			<div class="info">
				<hr/>
				(ℹ) rmol est une unité de mesure du
				<a target="gpHelp" href="https://fr.wikipedia.org/wiki/Syst%C3%A8me_international_d%27unit%C3%A9s">
					Système international
				</a>.
				<br/>
				Elle est composés
				de l'unite de base, la
				<a target="gpHelp" href="https://fr.wikipedia.org/wiki/Mole_(unit%C3%A9)">
					mole
				</a>
				et du préfixe
				<a target="gpHelp" href="https://fr.wikipedia.org/wiki/Pr%C3%A9fixes_du_Syst%C3%A8me_international_d%27unit%C3%A9s">
					ronto
				</a>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Extraire de l'Elixir de Conversion et phaser un composant
				peut te sembler relativement simple.
				<br/>
				Détrompe toi {pseudo}.
				<br/>
				Si tu peux le faire en solo pour de rares composants simples,
				obtenir la quantité d'Elixir nécessaire au phasage de certains composants plus délicats
				nécessite de le faire en coopération pour réussir.
				<br/>
				Celà nécessite une parfaite synchronisation de toutes les
				actions d'extraction d'élixir et de tentatives de conversion de composant.
				<br/>
				Ainsi, par exemple:
				<br/>
				➥Les molécules d'élixir sont instables, la réserve diminue rapidement.
				<br/>
				➥Extraire de l'élixir "fatigue" l'objet, et plus il
				a été sollicité, plus il faut attendre pour en extraire de l'élixir.
				<br/>
				➥Tu ne peux extraire d'élixir d'un objet que tu as identifié en premier.
				<br/>
				➥Tu dois te reposer après une conversion de composant.
			</div>
			<div class="info">
				Je te laisse découvrir les autres mécanismes de ce challenge.
				<br/>
				Pour faciliter coopération et synchronisation, les questions et les composants
				sont numérotées pour faciliter la communication entre vous.
				<br/>
				Derniers conseils: Retrouvez vous en vocal si possible, réfléchis avant d'agir,
				partage sur discord et, même en situation de stress, ne rushe pas.
			</div>
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div use:scrollPageToTop>
			<div>
				{#if etat.challengeTermine}
					Le challenge est terminé.
				{:else}
					<span onclick={markClick} style="cursor:pointer" gpImg="commons/cagnotte.png" 
						gpHelp="C'est la cagnotte. Elle augmente de façon exponentielle selon le nombre d'Aventuriers ayant envoyé au moins un composant dans l'Ortho-Temps ou ayant résolu en premier un énigme (max:{CONFIG.GILS}M). Tu peux cliquer sur le bouton résultat pour voir la répartition actuelle.">
						💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}
					</span>
					<span class="gpHelp" onclick={markClick} gpHelp="Quantité restante de molécules d'élixir dans la réserve. Les molécules sont instables.">
						🧪
						{#if etat.elixirsNb > 1000 }
							<countdown id="idElixirCpt"
								cnt={etat.elixirsNb}
								cntdth={etat.elixirsDth}
								cntstep=1000
								oncdTimeout={()=>etat.elixirsNb=-1}
								use:countDownInit />
						{:else}
							Vide
						{/if}
					</span> 
					{#if saisies.questionEcheance > Date.now()}
						<span class="gpHelp" onclick={markClick} gpHelp="Durée restante pour trouver l'objet et extraire de l'élixir">
							🔎<countdown dth={saisies.questionEcheance} oncdtimeout={recalcEtatEvent} use:countDownInit />
						</span>
					{:else if saisies.questionNextEcheance > Date.now()}
						<span class="gpHelp" onclick={markClick} gpHelp="Délai de repos avant prochaine tentative d'extraction">
							⌛️<countdown dth={saisies.questionNextEcheance} oncdtimeout={recalcEtatEvent} use:countDownInit />
						</span>
					{:else}
						<span class="gpHelp" onclick={markClick} gpHelp="Extraction d'elixir possible">
							🧬Possible
						</span>
					{/if}
					{#if !etat.flagObjetFirst}
						<span class="blinkFlag" onclick={markClick} style="cursor:pointer"
							gpHelp="Tu n'as pas encore extrait, en premier, l'exilir d'un objet.
											C'est important pour la Contribution,
											n'hésite pas à demander de l'aide sur Discord!">
							❇️
						</span>
					{/if}
					<span class="gpHelp" onclick={markClick} gpHelp="Délai avant de pouvoir tenter une conversion d'un composant">
						🪄<countdown dth={saisies.elixirEcheance} txtTimeout="Possible" use:countDownInit />
					</span>
					{#if !etat.flagComposantFirst}
						<span class="blinkFlag" onclick={markClick} style="cursor:pointer"
							gpHelp="Tu n'as pas encore envoyé un composant de Pharao dans l'Ortho-Temps.
											C'est important pour la Contribution,
											n'hésite pas à demander de l'aide sur Discord!">
							❇️
						</span>
					{/if}
				{/if}
			</div>
			<div class="parchemin">
				<div style="overflow-wrap: anywhere">
					{#each etat.questions as q,i}
						<span style="position: relative; border: 3px outset black"
							gpIdx={i} onclick={clickQuestion}>
					<!-- PREMIER:1, ENCOURS:2, DISPO:3, TIMER:4, ERREUR:0 🚧🔨⏳🕒🔧🍊🎫🎟️❓💵🎁🔖🧪 -->
					<!-- const STATUS = { PREMIER:1, ENCOURSAUTRE:2, ENCOURS:3, TIMER:4, DISPO:5, ERREUR:0 } -->
							{#if q.myStatus==STATUS.PREMIER}
								<span class="">☑️</span>
							{:else if q.myStatus==STATUS.ENCOURSAUTRE}
								<span class="">🚧</span>
							{:else if q.myStatus==STATUS.ENCOURS}
								<span class="blinkFlag">❓</span>
							{:else if q.myStatus==STATUS.TIMER}
								<span class="">⏳</span>
							{:else if q.myStatus==STATUS.DISPO}
								<span class="">🧪</span>
							{:else}
								<span class="">Erreur</span>
							{/if}
							<span style="position: absolute; top:0px; left: 0px; color: yellow; font-size: 0.4em; overflow: hidden; overflow-wrap: normal;">
								{i+1}
							</span>
							<span style="position: absolute; bottom:0px; right: 0px; color: yellow; font-size: 0.4em; overflow: hidden; overflow-wrap: normal;">
								{q.nbResolu}
							</span>
						</span>
					{/each}
				</div>
				<div class="br"/>
				<table class="table">
					<tbody class="tbody">
						{#each Array(CONFIG.SIZE) as _,l}
							<tr class="tr">
								{#each Array(CONFIG.SIZE) as _,c}
									{@const idx=l*CONFIG.SIZE+c}
									{@const cmp=etat.composants[idx]}
									{@const cls= (cmp.elixirPseudo)?"td stars":"td"}
									<td style="width: 16.6%" class={cls} gpIdx={idx} onclick={displayComposant}>
										<div style="position: relative; aspect-ratio: 2.5">
											<div style="position: absolute; top:0px; left: 0px; color: yellow">
												{idx+1}
											</div>
											{cmp.elixirPseudo}
										</div>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if dspQuestion}
		{@const confQ=CONFIG.QUESTIONS[dspQuestion.i]}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspQuestion=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<img class="parchemin" src={urlCdn+"commons/Human_brainstem2.gif"} style="width:20%; float:right" alt="" />
					<div>
						L'Ortho-Temps-{dspQuestion.i+1}, une page du Grand Grimoire des Savoirs,
						mentionne l'extraction d'Elixir:
					</div>
					<div class="adminCadre">{confQ.q}</div>
					<div>Quel endroit celà t'évoque-t-il?</div>
					<div>
						<select bind:value={saisies.pL}>
							{#each CONFIG.LIEUX as z,i}
								<option value={i}>{z.lbl}</option>
							{/each}
						</select>
						<input bind:value={saisies.pX} type="number" min=0 max=100 step=0.1 placeholder="x.x"/>
						<input bind:value={saisies.pY} type="number" min=0 max=100 step=0.1 placeholder="y.y"/>
						<input type="button" value="➤" gpIdx={dspQuestion.i} onclick={propositionQuestion} />
					</div>
					<div style="color:lightgreen">
						Tu as encore
						<countdown dth={dspQuestion.tryEcheance} oncdTimeout={()=>dspQuestion=null} />
						pour y répondre.
					</div>
				</div>
				{#if dspQuestion.firstPseudo}
					<div class="info" style="color:lightgreen">
						Pour information, {dspQuestion.firstPseudo} a déjà résolu cette énigme.
					</div>
				{/if}
				{#if isAdmin(pseudo)}
					<div class="adminCadre">
						Soluce: l={confQ.l} x={confQ.x} y={confQ.y} ({CONFIG.LIEUX[confQ.l].lbl})
					</div>
				{/if}
			</div>
		</div>
	{/if}
	
	{#if dspComposant}
		{@const now=Date.now()+getEpsilon()}
		{@const cpt=document.getElementById('idElixirCpt')?.getAttribute('curval')}
		{@const bes= CONFIG.MAP[dspComposant.i].nb}
		{@const ratio = cpt/bes}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspComposant=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
						<div>
							{#if dspComposant.elixirPseudo}
								Ce composant a disparu du Temps,
								{dspComposant.elixirPseudo} l'a phasé et envoyé dans l'Ortho-temps.
							{:else if saisies.elixirEcheance > now}
								<img class="parchemin" src={urlCdn+"commons/hamac-sommeil.gif"} style="width:30%; float:right" alt="" />
								Tu as phasé un composant récemment,
								<br/>
								repose-toi au minimum
								<countdown dth={saisies.elixirEcheance} oncdTimeout={()=>dspComposant=null} />
							{:else }
								<img class="parchemin" src={urlCdn+"commons/Human_brainstem2.gif"} style="width:30%; float:right" alt="" />
								Tu peux tenter d'utiliser des molécules d'élixir de conversion
								pour changer la phase de ce composant.
								{#if ratio < 1.01}
									<div style="color:yellow">
										⚠️ Vu le niveau de la réserve d'élixir, tenter de phaser ce composant est très risqué.
									</div>
								{/if}
								<br/>
								<input type="button" value="Tenter la conversion" onclick={()=>propositionComposant(dspComposant.i)} />
								{#if isAdmin(pseudo)}
									<div class="adminCadre">
										reserve:{cpt}, besoin:{bes}, ratio:{(1.0*cpt/bes).toFixed(1)}
									</div>
								{/if}
							{/if}	
						</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspResultats && etat}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Résultats: 💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}⇒ {etat.cagnotte.toFixed(1)}M/{CONFIG.GILS}M Gils
					</div>
					<table class="resTable">
						<tbody>
							<tr class="petit">
								<td>Pseudo</td><td>Elixir</td><td>Envoyés</td><td>%</td><td>Gils</td>
							</tr>
							{#each Object.keys(dspResultats.byPseudo) as pn,i}
								{@const p=dspResultats.byPseudo[pn]}
								{@const coef=(p.nbQ+p.nbC)/(dspResultats.totalQ+dspResultats.totalC)}
								<tr>
									<td class="resTd">
										<img style="width: 1em" alt="" src={urlCdnAI+"pseudo-"+pn+".jpg"} />
										{pn}
									</td>
									<td class="resTd">
										{#if etat.lpQ.includes(pn)}🪙{/if}
										{p.nbQ}
									</td>
									<td class="resTd">
										{#if etat.lpC.includes(pn)}🪙{/if}
										{p.nbC}
									</td>
									<td class="resTd">
										{(100*coef).toFixed(0)}%
									</td>
									<td class="resTd">
										{(etat.cagnotte*coef).toFixed(3)}M
									</td>
									{#if saisies.debug}
										<td style="color:red">
											{coef.toFixed(2)}
										</td>
									{/if}
									{#if saisies.debug}
										<td style="color:red">
											{coef.toFixed(2)}
										</td>
									{/if}
								</tr>
							{/each}
							<tr class="petit">
								<td>Contributions</td>
								<td>🪙={etat.lpQ.length}</td>
								<td>🪙={etat.lpC.length}</td>
								<td></td>
								<td colspan=3 style="text-align:left">
									💰=min({etat.lpQ.length},{etat.lpC.length},{GBLCONST.EQUILIBRAGE.NB})={etat.cagnotteNb}
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
<!-- P440.svelte -->

