<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, urlCdnAI, apiCall, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownTo, hhmmssms, isDistance, countDownInit, nbSecTo,
					 getEpsilon, isSM
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE,calcCagnotte, calcCagnotteNb }  from './ground.svelte.js'
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

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()
	const CDNROOT = (()=>urlCdn+pageDesc.rootName+'/')()
	const WSETAT = (()=>pageDesc.rootName+".etat")()
	const TIMERSONDE = 3*60000
	const TIMERBAD = 15*60000
	const CONFIRMEMAX = 6
	const SONDENB = 3

	
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
	async function init() { await getConfig(); await getEtat() }
	
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
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.pX ??= null
		s.pY ??= null
		s.sondeEcheance ??=0
		s.trouveEcheance ??=0
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// calcul echeance pour decouverte selon le nbTrouve et le tryEcheance
	function getEcheanceTrouve(tryEcheance,trouveDth,nbTrouve,lockTimer) {
		console.log("getEcheanceTrouve",tryEcheance,trouveDth,nbTrouve,lockTimer)
		return Math.max(tryEcheance,trouveDth + Math.min(nbTrouve,3)*lockTimer)
	}
	// chargement etat du challenge 
	let CONFIG =$state.raw(null)
	async function getConfig(msgWs) {
		let ret = msgWs || await apiCall(APIROOT+'config');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"config", ret.status)
		CONFIG = Object.assign(ret.o,( (isSM())? ret.o.SM : ret.o.PC))
	}
	let etat = $state(null)
	let etatVideoFinale=false
	async function getEtat(msgWs) {
		if (!CONFIG) return console.log("* getEtat sans config,ignoré")
		console.log('getEtat')
		let ret = msgWs || await apiCall(APIROOT+'etat');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"etat", ret.status)
		recalcEtat(ret.o)
	}
	function recalcEtatFromEvent(e) {
		recalcEtat(Object.assign({},etat))
	}
	function recalcEtat(tEtat) {
		tEtat.myTrouveNb = 0
		tEtat.totalTrouveNb = 0 // nb de zone avec pseudo identifié 
		tEtat.maxTrouveDth = 0
		// tEtat.tryNb = 0
		tEtat.tryEcheance = 0 // max des tryEcheance
		tEtat.myConfirmNb = 0 // nb de zone sélectionnée par le pseudo
		tEtat.myConfirmGood = 0 // nb de zone sélectionnée par le pseudo et faible sismicité
		tEtat.totalConfirmNb = 0 // nb de zone avec pseudo identifié
		tEtat.totalConfirmGood = 0 // identifie, selectionnee et ok
		tEtat.totalSondesNb = 0 // nombre total de sondes envoyées
		tEtat.listeTrouveurs=[] // lste des pseudos ayant touvé un lieu
		tEtat.listeConfirms=[] // lste des pseudos ayant confirmé un lieu
		tEtat.elts.forEach( (e) => {
			tEtat.totalSondesNb += e.nbSondes
			if (e.trouvePseudo) {
				if (!tEtat.listeTrouveurs.includes(e.trouvePseudo)) tEtat.listeTrouveurs.push(e.trouvePseudo)
				tEtat.totalTrouveNb++
				if (e.trouvePseudo==pseudo) {
					tEtat.myTrouveNb++
					if (e.trouveDth > tEtat.maxTrouveDth)
						tEtat.maxTrouveDth=e.trouveDth
				} 
			}
			if (e.tryPseudo==pseudo && e.tryEcheance > tEtat.tryEcheance)
				tEtat.tryEcheance=e.tryEcheance
			if (e.confirmPseudo) {
				if (!tEtat.listeConfirms.includes(e.confirmPseudo)) tEtat.listeConfirms.push(e.confirmPseudo)
				tEtat.totalConfirmNb++
				if (e.confirmPseudo==pseudo) {
					tEtat.myConfirmNb++
					if (CONFIG.ZONES[e.i].c) tEtat.myConfirmGood++
				} 
				if (CONFIG.ZONES[e.i].c)	tEtat.totalConfirmGood++
			}
			// calcul de l'état actuel (e.cls)
			let now= Date.now() + getEpsilon()
			e.cls = 
				(saisies.debug && e.nbSondes>=SONDENB && e.confirmPseudo && CONFIG.ZONES[e.i].c) ? "tdSondeLockAdmin" :
				(e.nbSondes>=SONDENB && e.confirmPseudo) ? "tdPaysage" : // confirmé et sondes ok
				(e.confirmPseudo) ? "tdBallon" : // confirmé mais pas assez de ballons
				(e.nbSondes>=SONDENB)? "tdCerveau" : // selectiponnable 
				(e.trouvePseudo==pseudo)? "tdBallon" : // trouve par moi pas assez de ballon
				(e.trouvePseudo) ? "tdBallon" : // trouvev par autre pas assez de ballon
				( (e.tryPseudo==pseudo) && (e.tryEcheance > now) ) ? "tdLoupeLock" : // par moi locked
				(e.tryPseudo==pseudo)? "tdLoupeLibre" : // par moi not lock
				(e.tryPseudo && (e.tryEcheance > now) ) ? "tdHelp" : // par autre not lock
				(e.tryPseudo) ?	"tdTravaux" : // par un autre lock
				"tdFree"
		})
		// challenge terminé ?
		tEtat.flagTrouveNb = (CONFIG.NBLIEUX==tEtat.totalTrouveNb)
		tEtat.flagConfirmNb = (CONFIG.ZONESCIBLESNB==tEtat.totalConfirmNb)
		tEtat.flagConfirmGood = (CONFIG.ZONESCIBLESNB==tEtat.totalConfirmGood)
		tEtat.flagSondesNb = ((CONFIG.NBLIEUX*CONFIG.NBSONDES)<=tEtat.totalSondesNb)
		tEtat.challengeTermine = tEtat.flagTrouveNb && tEtat.flagConfirmNb && tEtat.flagConfirmGood && tEtat.flagSondesNb
		// recalcule la cagnotte 
		tEtat.cagnotteNb = calcCagnotteNb(tEtat.listeTrouveurs.length,tEtat.listeConfirms.length)
		tEtat.cagnotte = calcCagnotte(tEtat.listeTrouveurs.length,CONFIG.GILS,tEtat.listeConfirms.length)
		// commit
		saisies.trouveEcheance = getEcheanceTrouve(tEtat.tryEcheance,tEtat.maxTrouveDth,tEtat.myTrouveNb,CONFIG.LOCKTIMER)
		if (tEtat.challengeTermine && !etatVideoFinale) {
			etatVideoFinale=true
			playVideo("X-lesbases/lesbases-4")
		}
		etat=tEtat
	}
	// calcul des résultsts
	function calcResultats() {
		let res = { coefTotal: 0, pseudos:  {} }
		etat.elts.forEach( (e) => {
			if (e.trouvePseudo) {
				res.pseudos[e.trouvePseudo] ??= { nTrouve: 0, nConfirm: 0, coef:0}
				res.pseudos[e.trouvePseudo].nTrouve++
				res.pseudos[e.trouvePseudo].coef += 1
				res.coefTotal += 1
			}
			if (e.confirmPseudo) {
				res.pseudos[e.confirmPseudo] ??= { nTrouve: 0, nConfirm: 0, coef:0}
				res.pseudos[e.confirmPseudo].nConfirm++
				res.pseudos[e.trouvePseudo].coef += 2
				res.coefTotal += 2
			}
		})
		dspResultats = res
	}

	// click sur une zone
	let dspTry = $state(null) // tentative d'identification d'une zone
	let dspSonde = $state(null) // possibilité de sondes
	function clickZoneDecouverte(e) {
		dspSonde = e
	}
	function clickZoneNonDecouverte(e) {
		let now = Date.now() + getEpsilon()
		// si la zone est encore ciblées, continue le try
		if (e.tryPseudo==pseudo) {
			if (saisies.tryEcheance > now) {
				displayInfo({titre:"Impossible",body:[
					"Attend "+nbSecTo(saisies.tryEcheance)+"s avant une nouvelle tentative:"
				]})
			}
			else {
				dspTry = e
			}
			return
		}
		// si la zone est préemptée par un autre
		if (e.tryPseudo && e.tryEcheance>now) {
			displayInfo({
				titre:"Pense à Contribution",
				imgBot: "X-lesbases/screens/screen-"+e.i+".png",
				body:[
					e.tryPseudo + " a un accès exclusif à cette zone de '"+CONFIG.ZONES[e.i].l+"' pendant " + countDownTo(e.tryEcheance),
					"Tu peux l'aider si tu le souhaites."
				]})
			return
		}
		// si l'échéance de troiuve n'est pas ok
		if ( saisies.trouveEcheance>now ) {
			if (etat.tryEcheance>now) {
				displayInfo({
					titre:"Impossible",
					body:["Tu as l'exclusivité d'exploration d'une zone"+
								", tu ne peux pas encore en découvrir une autre" ]})
			}
			else {
				displayInfo({
					titre:"Impossible",
					body:["Tu n'es pas assez reposé"+G(pseudoGenre,"","e")+ 
								", tu ne peux pas encore en découvrir une autre" ]})
			}
			return
		}
		// preemption de la zone
		apiCall(APIROOT+'tentative/'+e.i,'POST')
		// simulation immediate en local
		e.tryEcheance = Date.now()+CONFIG.LOCKTIMER
		e.tryPseudo = pseudo
		dspTry=e
		return
	}
	function clickZone(idx) {
		if (saisies.debug) displayObject({e: etat.elts[idx], z: CONFIG.ZONES[idx]})
		if (etat.challengeTermine) {
			displayInfo({
				titre: "Le challenge est terminé",
				imgBot: "X-lesbases/screens/screen-"+idx+".png",
				body: [{txt:"👉Revoir la vidéo", cb: ()=>playVideo('X-lesbases/lesbases-4')} ]})
			return
		}
		let e = etat.elts[idx]
		if (e.trouvePseudo)
			clickZoneDecouverte(e)
		else
			clickZoneNonDecouverte(e)
	}
	function proposition(e) {
		// verification locales des ccord
		let zone = CONFIG.ZONES[e.i]
		if (! isDistance(saisies.pX,saisies.pY,zone.x,zone.y,0.1) ) {
			dspTry=null
			saisies.tryEcheance = Date.now() + TIMERBAD
			displayInfo({
				titre:"Ce n'est pas le bon emplacement",
				body:[
					"Mauvaises coordonnées.",
					"Il faut indiquer les coordonnées du robot à ±0.1 près.",
					"Patiente "+nbSecTo(saisies.tryEcheance)+"s avant de refaire une proposition"
				]
			})
			return
		}
		apiCall(APIROOT+'proposition/'+e.i,'POST',{x: saisies.pX, y: saisies.pY})
		saisies.pX=null
		saisies.pY=null
		dspTry=null
		playVideo("X-lesbases/lesbases-3")
	}
	function envoiSonde(i) {
		dspSonde=null
		saisies.sondeEcheance=Date.now()+ TIMERSONDE
		apiCall(APIROOT+'sonde/'+i,'POST')
		playVideo("X-lesbases/lesbases-2")
	}
	function confirmeLieu(i) {
		dspSonde=null
		if (etat.myConfirmNb >= CONFIRMEMAX) {
			displayInfo({
				titre:"Hé, on se calme!",
				body:[
					"Tu as déjà confirmé "+etat.myConfirmNb+" lieux",
					"Tu ne peux plus en confirmer!",
					"Si tu changes d'avis sur un lieu, tu peux l'infirmer.",
				]
			})
			return
		}
		apiCall(APIROOT+'confirmation/'+i,'POST')
	}
	function infirmeLieu(i) {
		dspSonde=null
		apiCall(APIROOT+'infirmation/'+i,'POST')
	}
	function pasdaccord(i) {
		dspSonde=null
		apiCall(APIROOT+'pasdaccord/'+i,'POST')
	}
	
</script>

<style>
	.table { 
		background-size: 100% 100%; background-position: center; 
		width: 95%; margin: auto; padding: 0; border: 0;
		border-spacing: 0; border-collapse: collapse;
		font-size:0.7em;
		border: 0
	}
	.tbody { }
	.tr { }
	.td { width: 25%; border: 2px solid lightgray; }
	.tdSondeLockAdmin {
		border: 5px inset red;
		background-size: 50% 100%; background-repeat: repeat; background-position: left ;
		background-image: url('https://cdn.adhoc.click/V10a/commons/ciel-anim.gif')
	} /* reseré admin - lock et bonne pos */
	.tdPaysage {
		background-size: 50% 100%; background-repeat: repeat; background-position: left ;
		background-image: url('https://cdn.adhoc.click/V10a/commons/ciel-anim.gif')
	}
	.tdBallon {
		background-size: auto 50%; background-repeat: no-repeat; background-position: left 50%;
		background-image: url('https://cdn.adhoc.click/V10a/commons/ballon2-anim.gif')
	} /* Trouve attente de sonde */
	.tdCerveau {
		background-size: auto 50%; background-repeat: no-repeat; background-position: left ;
		background-image: url('https://cdn.adhoc.click/V10a/commons/cerveaulampe-anim.gif')
	}
	.tdLoupeLibre {
		background-color: orange;
		background-size: contain; background-repeat: no-repeat;
		background-image: url('https://cdn.adhoc.click/V10a/commons/loupe-cherche-anim.gif')
	}	/* en cours d'explo plus de locl */
	.tdLoupeLock {
		background-color: lightgreen;
		background-size: contain; background-repeat: no-repeat; background-position: left ;
		background-image: url('https://cdn.adhoc.click/V10a/commons/loupe-cherche-anim.gif')
	} /* en cours d'explo perso */
	.tdTravaux {
		background-size: contain; background-repeat: no-repeat;
		background-image: url('https://cdn.adhoc.click/V10a/commons/chantier2-anim.gif')
	} /* en cours d'explo, mais par un autre  */
	.tdHelp {
		background-color: green;
		background-size: auto 50%; background-repeat: no-repeat; background-position: left 50%;
		background-image: url('https://cdn.adhoc.click/V10a/commons/ange-anim.gif')
	} /* en cours d'explo, mais par un autre  */
	.tdFree {
	} /* par defaut */
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
				<input type="button" value="ResetAll" onclick={() => confirm("Tout effacer?") && apiCall(APIROOT+'etat','DELETE') } />
				<input type="button" value="SetAll" onclick={() => confirm("Tout valider?") && apiCall(APIROOT+'setAll','DELETE') } />
				<input type="button" value="timerExplo" onclick={() => saisies.trouveEcheance=Date.now()+4000 } />
				<input type="button" value="timerBallon" onclick={() => saisies.sondeEcheance=Date.now()+4000 } />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
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
			Depuis que j'ai vu les Humains de la Terre expliquer le projet Pharao,
			une petite musique me trotte dans la tête.
			<br/>
			<Btn bind:refStep={epiqStep} step=10 video="X-lesbases/lesbases-1" val="Explique-moi!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==10 && etat}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<input type="button" value="Revoir la video" gpVideo="X-lesbases/lesbases-1" onclick={markClick} />
			<br/>
			Un système d'horloges permettant de vérifier notre Temps,
			c'est évidemment un Pharao au Point de Lagrange du système d'Eorzéa, mais pas seulement.
			<br/>
			C'est aussi {CONFIG.ZONESCIBLESNB} lieux à la surface d'Eorzéa sur lequels nous installerons une
			<a href="https://www.insu.cnrs.fr/fr/cnrsinfo/vers-des-horloges-atomiques-plus-precises-avec-lintrication-quantique" target="gpHelp">
				horloge à intrication
			</a>.
			<br/>
			La chronosismicité de ces lieux doit être parmi les plus basses d'Eorzéa.
			<br/>
			<Btn bind:refStep={epiqStep} step=30 val="Construire les Bases!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Et oui, nous n'avons pas les Bases.
			<div class="br" />
			J'ai envoyé 40 mascottes explorer Eorzéa,
			mais je les ai perdues de vue.
			<br/>
			Il faut les retrouver et m'indiquer les coordonnées des lieux où elles se trouvent.
			<br/>
			Il faut aussi envoyer des sondes sur ces lieux afin de mesurer leur chronosismicité.
			Ceci permettra de déterminer les {CONFIG.ZONESCIBLESNB} sites ayant les plus faibles
			valeurs de chronosismicité.
			<br/>
			<Btn bind:refStep={epiqStep} step=80 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
				<div class="blinkMsg" style="color:red">Attention!</div>
			<div class="info">
				Ce challenge peut ressembler à un simple challenge de screens.
				Il est bien plus complexe pour assurer une cagnotte maximale.
				<dic class="br"/>
				La cagnotte de ce challenge est maximale si, <u>au moment où ce challenge se termine</u>:
				<br/>
				➥Le nombre de personnes ayant découvert au moins un lieu est supérieur ou égal à {GBLCONST.EQUILIBRAGE.NB}
				<br/>
				➥Le nombre de personnes ayant identifié un lieu de faible chronosimicité est supérieur ou égal à {GBLCONST.EQUILIBRAGE.NB}
				<br/>
				Il faut partager une stratégie commune pour atteindre cet objectif.
				<br/>
				Je te laisse découvrir les autres mécanismes de ce challenge.
			</div>
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div use:scrollPageToTop>
			<div>
				{#if !etat.challengeTermine}
					<span onclick={markClick} style="cursor:pointer" gpImg="commons/cagnotte.png" 
						gpHelp="C'est la cagnotte. Elle augmente de façon exponentielle selon le nombre d'Aventuriers
										ayant découvert au moins un lieu et le nombre d'Aventuriers
										ayant indiqué un lieu de faible chronosismicité.
										Tu peux cliquer sur le bouton 'résultats' pour voir la répartition actuelle.">
						💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}
					</span>
					<span class="gpHelp" onclick={markClick}
						gpHelp="Nombre de sondes envoyées. Quand l'icone clignote tu peux envoyer une sonde sur un lieu.">
						<span class={(saisies.sondeEcheance==0)?"blinkFlag":""}>🎈</span>
						{etat.totalSondesNb}/{CONFIG.NBLIEUX*CONFIG.NBSONDES}
						<span style="display:none">
							<countdown dth={saisies.sondeEcheance} oncdTimeout={()=>saisies.sondeEcheance=0} />
						</span>
					</span>
					<span class="gpHelp" onclick={markClick} gpHelp="Repos nécessaire avant de pouvoir changer de lieu d'exploration ou après une découverte">
						🔎<countdown dth={saisies.trouveEcheance} txtTimeout="Possible" use:countDownInit />
					</span>
					{#if etat.myTrouveNb < 1}
						<span class="blinkFlag" onclick={markClick} style="cursor:pointer"
							gpHelp="Tu n'as pas encore identifié un lieu possible pour une Base Pharao.
											C'est important pour la Contribution,
											n'hésite pas à demander de l'aide sur Discord!">
							❇️
						</span>
					{/if}
					<span class="gpHelp" onclick={markClick}
						gpHelp={"Identification des "+CONFIG.ZONESCIBLESNB+" lieux de faible valeur chronosismique."+
										"La balance doit être de "+CONFIG.ZONESCIBLESNB+"/"+CONFIG.ZONESCIBLESNB+
										". Pour valider le challenge, il faut aussi que tous les lieux soient identifiés et sondés"}>
						⚖️{etat.totalConfirmNb}/{etat.totalConfirmGood}
					</span>
					{#if etat.myConfirmGood < 1}
						<span class="blinkFlag" onclick={markClick} style="cursor:pointer"
							gpHelp="Tu n'as pas encore identifié une zone de faible chronosismicité.
											C'est important pour la Contribution,
											n'hésite pas à demander de l'aide sur Discord!">
							❇️
						</span>
					{/if}
				{:else}
					Le challenge est terminé.
					<input type="button" value="Revoir la vidéo" onclick={()=>playVideo('X-lesbases/lesbases-4')} />
				{/if}
			</div>
			<div>
				<table class="papier table" style="text-align: center">
					<tbody class="tbody">
						{#each Array(CONFIG.L) as _,l}
							<tr class="tr">
								{#each Array(CONFIG.C) as _,c}
									{@const idx=l*CONFIG.C+c}
									{#key etat.elts[idx]}
										{@const e=etat.elts[idx]}
										{@const z=CONFIG.ZONES[idx]}
										<td class="{"td "+e.cls}" style="cursor: pointer; width:25%" onclick={()=>clickZone(idx)}>
											<div style="position: relative">
												<div style="position: absolute; font-size:0.7em; color: yellow">
													{idx+1}
												</div>
												{#if e.trouvePseudo}
													<div style="position: absolute; right:0; bottom:0; font-size:0.7em; color: yellow">
														{#if e.nbSondes>0 }
															🧿{(e.radiations/e.nbSondes).toFixed(2)}
														{:else}
															{#each Array(e.nbSondes) as _,i }🎈{/each}
														{/if}
													</div>
												{/if}
												{#if e.trouvePseudo}
													<div>👁️{e.trouvePseudo}</div>
												{:else if e.tryPseudo}
													<div>🔎{e.tryPseudo}</div>
												{:else}
													<div>{z.l}</div>
												{/if}
												{#if e.confirmPseudo}
													<div>👍{e.confirmPseudo}</div>
												{:else if e.tryEcheance > Date.now()+getEpsilon() }
													<countdown dth={e.tryEcheance} oncdTimeout={recalcEtatFromEvent} use:countDownInit />
												{:else}
													--:--:--
												{/if}
											</div>
										</td>
									{/key}
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if dspTry}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspTry=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						{#if dspTry.tryEcheance > Date.now()+getEpsilon()}
							<div>
								Tu as encore l'exclusivité de la recherche pendant
								<countdown dth={dspTry.tryEcheance} oncdTimeout={()=>{dspTry=null; addNotification("Tu as perdu l'exclusivité de recherche de ce lieu","yellow",20)}} use:countDownInit />
							</div>
						{:else}
							<div class="blinkMsg">Tu n'as plus l'exclusité de la recherche de ce lieu</div>
						{/if}
						<div>
							{#if isSM()}
								<div class="info">
									Passe en mode paysage pour afficher le screen en plein écran.
									Passe en mode portait pour revenir ici.
								</div>
							{/if}
							<div>Coordonnées de la mascotte ({CONFIG.ZONES[dspTry.i].l}):</div>
							<div>
								<input bind:value={saisies.pX} style="width:15%" type="number" step="0.1" placeholder="x.x" />
								<input bind:value={saisies.pY} style="width:15%" type="number" step="0.1" placeholder="y.y" />
								<input type="button" value="➤" onclick={()=>proposition(dspTry)} />
							</div>
							{#if isAdmin(pseudo)}
								<div class="adminCadre">
									Soluce: #{dspTry.i} x={CONFIG.ZONES[dspTry.i].x} y={CONFIG.ZONES[dspTry.i].y}
								</div>
							{/if}
							<img id="kikiFullArea" style="width: 100%" src={CDNROOT+"screens/screen-"+dspTry.i+".png"} alt={"screen-"+dspTry.i} />
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspSonde}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspSonde=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						{(dspSonde.trouvePseudo==pseudo)?"Tu as":dspSonde.trouvePseudo+"  a"}
						identifié ce lieu.
					</div>
					{#if dspSonde.confirmPseudo && dspSonde.confirmPseudo!=pseudo }
						<div>
							{dspSonde.confirmPseudo} pense
							que ce lieu est d'une instabilité chronosismique parmi les plus faible.
						</div>
					{/if}
					{#if dspSonde.nbSondes == 0}
						<div>Aucune donnée chronosismique n'est disponible car il n'y a aucune sonde.</div>
					{/if}
					{#if dspSonde.nbSondes > 0}
						<div>
							L'instabilité chronosismique moyenne de ce lieu est de
							{(dspSonde.radiations/dspSonde.nbSondes).toFixed(2)},
							{#if dspSonde.nbSondes >= SONDENB}
								et cela ne devrait plus évoluer.
							{:else}
								mais je n'en suis pas sure.
							{/if}
						</div>
					{/if}
					{#if dspSonde.nbSondes < SONDENB}
						{#if saisies.sondeEcheance > Date.now()}
							<div style="color:red">
								Tu pourras envoyer une sonde dans
								<countdown dth={saisies.sondeEcheance} oncdTimeout={()=>saisies.sondeEcheance=0} use:countDownInit />
							</div>
						{:else}
							<div>
								Souhaites-tu y envoyer une nouvelle sonde?
								<br/>
								<input type="button" value="oui" onclick={()=>envoiSonde(dspSonde.i)}/>
								<input type="button" value="non" onclick={()=>dspSonde=null} />
							</div>
						{/if}
					{/if}
					{#if dspSonde.confirmPseudo && dspSonde.confirmPseudo==pseudo}
						<div>
							Tu as sélectionné ce lieu comme l'un
							des douze lieux à la plus faible valeur d'instabilité chronosismique.
						</div>
						{#if dspSonde.nbSondes >=SONDENB && CONFIG.ZONES[dspSonde.i].c}
							<div class="info" style="color:lightgreen">
								Hé {pseudo}! Entre nous deux, je pense que tu as raison.
							</div>
						{/if}
						<div>
							<input type="button" value="J'infirme, c'était une erreur" onclick={()=>infirmeLieu(dspSonde.i) }/>
							<input type="button" value="Je confirme, c'est bon" onclick={()=>dspSonde=null}/>
						</div>
					{:else if dspSonde.confirmPseudo && dspSonde.confirmPseudo!=pseudo}
						<div>
							Ce lieu a été identifié par {dspSonde.confirmPseudo} comme l'un
							des douze lieux à la plus faible valeur d'instabilité chronosismique.
							Si tu penses que c'est une erreur, je peux le lui indiquer.
							<br/>
							<input type="button" value="oui, c'est une erreur" onclick={()=>pasdaccord(dspSonde.i) }/>
							<input type="button" value="non, c'est bon" onclick={()=>dspSonde=null}/>
							<input type="button" value="je ne sais pas encore" onclick={()=>dspSonde=null}/>
						</div>
					{:else if (!dspSonde.confirmPseudo) || dspSonde.confirmPseudo==pseudo}
						<div>
							Penses-tu que ce lieu est l'un des douze lieux avec
							la plus faible valeur d'instabilité chronosismique ?
							<br/>
							<input type="button" value="oui" onclick={()=>confirmeLieu(dspSonde.i)} />
							<input type="button" value="non" onclick={()=>infirmeLieu(dspSonde.i)} />
							<input type="button" value="je ne sais pas encore" onclick={()=>dspSonde=null}/>
						</div>
					{/if}
					{#if isAdmin(pseudo)}
						<div class="adminCadre">
							Admin: <input type="button" onclick={()=>infirmeLieu(dspSonde.i)} value="Reset Validation" />
						</div>
					{/if}
					<div>
						<img style="width: 100%" src={CDNROOT+"screens/screen-"+dspSonde.i+".png"} alt={"screen-"+dspSonde.i} />
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspResultats}
		{@const pseudos= Object.keys(dspResultats.pseudos)}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Résultats:
						💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB} ⇒
						{etat.cagnotte.toFixed(1)}M/{CONFIG.GILS}M
					</div>
					<div class="overflow: scroll">
					<table class="resTable">
						<tbody>
							<tr class="petit">
								<td></td>
								<td>Trouvés</td>
								<td>Confirmés</td>
								<td>%</td>
								<td>Gils (M)</td>
							</tr>
							{#each pseudos as p,i}
								{@const res=dspResultats.pseudos[p]}
								<tr>
									<td class="resTd" style="text-align: left">
										<img style="width: 1em" alt="" src={urlCdnAI+"pseudo-"+p+".jpg"} />
										{p}
									</td>
									<td class="resTd">{#if res.nTrouve>0}🪙{/if}{res.nTrouve}</td>
									<td class="resTd">{#if res.nConfirm>0}🪙{/if}{res.nConfirm}</td>
									<td class="resTd">
										{Math.round(100*res.coef/dspResultats.coefTotal)}
									</td>
									<td class="resTd">
										{(etat.cagnotte*res.coef/dspResultats.coefTotal).toFixed(3)}
									</td>
								</tr>
							{/each}
							<tr class="petit" style="border: 1px solid white">
								<td style="text-align: right">Global:</td>
								<td>🔎{etat.totalTrouveNb}/{CONFIG.NBLIEUX}</td>
								<td>⚖️{etat.totalConfirmGood}/{CONFIG.ZONESCIBLESNB}</td>
								<td colspan=2>🎈{etat.totalSondesNb}/{CONFIG.NBLIEUX*CONFIG.NBSONDES}</td>
							</tr>
							<tr class="petit">
								<td style="text-align: right">Contributions:</td>
								<td>🪙{etat.listeTrouveurs.length}</td>
								<td>🪙{etat.listeConfirms.length}</td>
								<td colspan=2>
									💰{etat.cagnotteNb}=min({etat.listeTrouveurs.length},{etat.listeConfirms.length},{GBLCONST.EQUILIBRAGE.NB})
								</td>
							</tr>
						</tbody>
					</table>
					</div>
					<div class="info">
						⚠️Les gains varient tant que le challenge n'est pas terminé
					</div>
				</div>
			</div>
		</div>
	{/if}

</div>
<!-- P420.svelte --> 

