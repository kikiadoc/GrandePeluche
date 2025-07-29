<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, apiCall, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownTo, hhmmssms, isDistance, countDownInit, nbSecTo,
					 getEpsilon, isSM
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
	import Btn from './Btn.svelte'
	
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

	const PAGEEPIQLBL= "P"+pageDesc.n+"_epiqStep"
	const PAGESAISIESLBL = "P"+pageDesc.n + "_saisies"
	const APIROOT = '/'+pageDesc.rootName+'/'
	const CDNROOT = urlCdn+pageDesc.rootName+'/'
	const TIMERSONDE = 45000
	const TIMERBAD = 15000
	const CONFIRMEMAX = 6
	const SONDENB = 3

	
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback); reset() });

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
	async function init() { calcDebutChallengeDth(); await getZones(); await getEtat() }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op=='lesbases.etat' && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.pX ??= null
		s.pY ??= null
		s.sondeEcheance=0
		s.trouveEcheance=0
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// calcul de la date effective pour le challenge
	let debutChallengeDth = $state(Date.now()+60000) // par defaut en attente de la synchro initt
	function calcDebutChallengeDth() {
		debutChallengeDth = (isProd)? pageDesc.start + pageDesc.delaiDebut*60000 : Date.now()+pageDesc.delaiDebut*1000
	}
	// calcul echeance pour decouverte selon le nbTrouve et le tryEcheance
	function getEcheanceTrouve(tryEcheance,trouveDth,nbTrouve,lockTimer) {
		console.log("getEcheanceTrouve",tryEcheance,trouveDth,nbTrouve,lockTimer)
		return Math.max(tryEcheance,trouveDth + Math.min(nbTrouve,4)*lockTimer)
	}
	// chargement etat du challenge
	let zones = $state(null)
	let zonesCiblesNb=0 // calculé lors de l'init en await
	async function getZones(msgWs) {
		let ret = msgWs || await apiCall(APIROOT+'zones');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"zones", ret.status)
		zones = ret.o
		// calcul du nombre de lieux cibles
		zonesCiblesNb=0
		zones.forEach( (z) => { if (z.c) zonesCiblesNb++ } )
	}
	let etat = $state(null)
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall(APIROOT+'etat');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"etat", ret.status)
		console.log('getEtat')
		let tEtat = ret.o
		tEtat.trouveNb = 0
		tEtat.trouveTotalNb = 0 // nb de zone avec pseudo identifié
		tEtat.trouveDth = 0
		tEtat.tryNb = 0
		tEtat.tryEcheance = 0
		tEtat.confirmNb = 0 // nb de zone sélectionnée par le pseudo
		tEtat.confirmTotalNb = 0 // nb de zone avec pseudo identifié
		tEtat.confirmTotalGood = 0 // identifie, selectionnee et ok
		tEtat.elts.forEach( (e) => {
			if (e.trouvePseudo) {
				tEtat.trouveTotalNb++
				if (e.trouvePseudo==pseudo) {
					tEtat.trouveNb++
					if (e.trouveDth > tEtat.trouveDth)
						tEtat.trouveDth=e.trouveDth
				} 
			}
			if (e.tryPseudo==pseudo && e.tryEcheance > tEtat.tryEcheance)
				tEtat.tryEcheance=e.tryEcheance
			if (e.confirmPseudo) {
				tEtat.confirmTotalNb++
				if (e.confirmPseudo==pseudo) tEtat.confirmNb++
				if (zones[e.i].c)	tEtat.confirmTotalGood++
			}
			// calcul de l'état actuel (e.cls)
			let now= Date.now() + getEpsilon()
			e.cls = 
				(saisies.debug && e.nbSondes >=SONDENB && e.confirmPseudo && zones[e.i].c ) ?
				"tdSondeLock" :
				(e.confirmPseudo) ?
				"tdSonde" :
				(e.trouvePseudo==pseudo) ?
				"tdTrouve" :
				( (e.tryPseudo==pseudo) && (e.tryEcheance > now) ) ?
				"tdTry" :
				(e.tryPseudo==pseudo)?
				"tdKeep" :
				(e.tryPseudo && (e.tryEcheance > now) ) ?
				"tdLock" :
				(e.tryPseudo) ?
				"tdKeep" :
				"tdFree"
		})
		// test si le challenge est terminé
		addNotification("calcul challenge termine non fait")
		// si toutes les cases sont trouvées et le bien placés
		tEtat.challengeTermine = 
			(tEtat.trouveTotalNb==tEtat.elts.length) &&
			(zonesCiblesNb==tEtat.confirmTotalNb) &&
			(zonesCiblesNb==tEtat.confirmTotalGood)
		console.log("tEtat.trouveTotalNb",tEtat.trouveTotalNb)
		console.log("zonesCiblesNb",zonesCiblesNb)
		console.log("tEtat.confirmTotalNb",tEtat.confirmTotalNb)
		console.log("tEtat.confirmTotalGood",tEtat.confirmTotalGood)
		console.log("tEtat.challengeTermine",tEtat.challengeTermine)
		// commit
		saisies.trouveEcheance = getEcheanceTrouve(tEtat.tryEcheance,tEtat.trouveDth,tEtat.trouveNb,tEtat.LOCKTIMER)
		if (tEtat.challengeTermine) playVideo("lesbases/lesbases-4")
		etat=tEtat
	}
	// calcul des résultsts
	function calcResultats() {
		let res = { pseudos:  {} }
		etat.elts.forEach( (e) => {
			if (e.trouvePseudo) {
				res.pseudos[e.trouvePseudo] ??= { nTrouve: 0, nConfirm: 0}
				res.pseudos[e.trouvePseudo].nTrouve++
			}
			if (e.confirmPseudo) {
				res.pseudos[e.confirmPseudo] ??= { nTrouve: 0, nConfirm: 0}
				res.pseudos[e.confirmPseudo].nConfirm++
			}
		})
		dspResultats = res
	}

	// click sur une zone
	let dspTry = $state(null) // tentative d'identification d'une zone
	let dspSonde = $state(null) // possibilité de sondes
	function clickZoneDecouverte(e) {
		addNotification("ClickDecouverte:"+e.i)
		let now = Date.now() + getEpsilon()
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
			displayInfo({titre:"Impossible",body:[
				e.tryPseudo + " a un accès exclusif à cette zone pendant " + countDownTo(e.tryEcheance)
			]})
			return
		}
		// si l'échéance de troiuve n'est pas ok
		if ( saisies.trouveEcheance>now ) {
			displayInfo({
				titre:"Impossible",
				body:["Tu as déjà un lieu à découvrir ou tu n'es pas assez reposé"+G(pseudoGenre,"","e")+":",
							"Tu ne peux pas encore en découvrir un autre" ]})
			return
		}
		// preemption de la zone
		apiCall(APIROOT+'tentative/'+e.i,'POST')
		// simulation immediate en local
		e.tryEcheance = Date.now()+etat.LOCKTIMER
		e.tryPseudo = pseudo
		dspTry=e
		return
	}
	function clickZone(idx) {
		if (saisies.debug) displayObject({e: etat.elts[idx], z: zones[idx]})
		if (etat.challengeTermine) {
			displayInfo({
				titre:"Le challenge est terminé",
				body:["Le challenge est terminé" ]})
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
		let zone = zones[e.i]
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
		playVideo("lesbases/lesbases-3")
	}
	function envoiSonde(i) {
		dspSonde=null
		saisies.sondeEcheance=Date.now()+ TIMERSONDE
		apiCall(APIROOT+'sonde/'+i,'POST')
		playVideo("lesbases/lesbases-2")
	}
	function confirmeLieu(i) {
		dspSonde=null
		if (etat.confirmNb >= CONFIRMEMAX) {
			displayInfo({
				titre:"Hé, on se calme!",
				body:[
					"Tu as déjà confirmé "+etat.confirmNb+" lieux",
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
		/* background-image: url('https://cdn.adhoc.click/V10/ff-10/Pharao.png'); */
		background-size: 100% 100%; background-position: center; 
		width: 95%; margin: auto; padding: 0; border: 0;
		border-spacing: 0; border-collapse: collapse;
		font-size:0.7em;
		border: 0
	}
	.tbody { }
	.tr { }
	.td { width: 25% }
	.tdSondeLock {border: 5px inset red}
	.tdSonde {border: 5px inset green}
	.tdTrouve {border: 5px outset lightgreen}
	.tdTry { background-color: green}
	.tdKeep {background-color: orange}
	.tdLock {background-color: red}
	.tdFree {border: 5px outset lightgray}
	.tdRes { border: 2px solid white}
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
				<input type="button" value="SetAll-2" onclick={() => confirm("Tout valider?") && apiCall(APIROOT+'setAll','DELETE') } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
				<label><input type="checkbox" bind:checked={saisies.noTimer} />NoTimer</label>
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
		<!--
		<span role="button"	style="cursor: pointer" onclick={()=>{ dspObject={ template: "a modifier" }}}>
		🆘
		</span>
		-->
	</div>

	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			{#if debutChallengeDth > Date.now()}
				<div class="info adminCadre" style="color:red">
					Le challenge commencera dans
					<countdown dth={debutChallengeDth} oncdTimeout={()=>debutChallengeDth=0} />.
					<br/>
					Tu as le temps de bien lire le lore et regarder les vidéos!
				</div>
			{/if}
			Depuis que j'ai vu les Humains de la Terre expliquer le projet Pharao,
			une petite musique me trotte dans la tête.
			<br/>
			<Btn bind:refStep={epiqStep} step=10 video="lesbases/lesbases-1" val="Explique-moi!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<input type="button" value="Revoir la video" gpVideo="lesbases/lesbases-1" onclick={markClick} />
			<br/>
			Un système d'horloges permettant de vérifier notre Temps,
			c'est évidemment un Pharao en orbite autour d'Eorzéa, mais pas seulement.
			<br/>
			C'est aussi 12 lieux à la surface d'Eorzéa sur lequels nous installerons un Pharao.
			<br/>
			La chronosismicité de ces lieux doit être parmi les plus basses d'Eorzéa.
			<br/>
			<Btn bind:refStep={epiqStep} step=30 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			J'ai envoyé 40 mascottes explorer Eorzéa,
			mais je les ai perdues de vue.
			<br/>
			Il faut les retrouver et m'indiquer les coordonnées des lieux où elles se trouvent.
			<br/>
			Il faut aussi envoyer des sondes sur ces lieux afin de mesurer leur chronosismicité.
			Ceci permettra de déterminer les 12 sites ayant les plus faibles
			valeurs de chronosismicité.
			<br/>
			<Btn bind:refStep={epiqStep} step=80 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<div class="info">
				Ce challenge comporte plusieurs phases
				mais il n'est pas nécessaire d'avoir fini totalement une phase pour
				en commencer une autre.
				<br/>
				Ce challenge mêle compétition et collaboration
				<br/>
				Je te laisse découvrir les autres mécanismes de ce challenge.
				<br/>
				<u>N'oublie pas que tu peux partager questionnement et stratégie sur Discord.</u>
				<br/>
			</div>
			{#if debutChallengeDth < Date.now()}
				<Btn bind:refStep={epiqStep} step=90 val="J'y vais tout de suite" />
			{:else}
				<div class="info adminCadre" style="color:red">
					Le challenge commencera dans
					<countdown dth={debutChallengeDth} oncdTimeout={()=>debutChallengeDth=0} />.
					<br/>
					Prend le temps de bien lire le lore!
					Si tu as envie de le revoir ou si tu as zappé des informations,
					clique sur "Revoir le Lore".
				</div>
			{/if}
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat && zones}
		<div use:scrollPageToTop>
			<div>
				<span class="gpHelp" onclick={markClick} gpHelp="Repos nécessaire avant de pouvoir changer de lieu d'exploration ou après une découverte">
					🔎<countdown dth={saisies.trouveEcheance} txtTimeout="Possible" use:countDownInit />
				</span>
				<span class="gpHelp" onclick={markClick} gpHelp="Repos nécessaire avant de pouvoir envoyer une sonde sur un lieu">
					🎈<countdown dth={saisies.sondeEcheance} txtTimeout="Possible" use:countDownInit />
				</span>
				<span class="gpHelp" onclick={markClick} gpHelp="Identification des 12 lieux de faible valeur chronosismique. La balance doit être de 12/12. Pour valider le challenge, il faut aussi que tous les lieux soient identifiés">
					⚖{etat.confirmTotalNb}/{etat.confirmTotalGood}
				</span>
			</div>
			<div>
				<table class="papier table" style="text-align: center">
					<tbody class="tbody">
						{#each Array(etat.L) as _,l}
							<tr class="tr">
								{#each Array(etat.C) as _,c}
									{@const idx=l*etat.C+c}
									{#key etat.elts[idx]}
										{@const e=etat.elts[idx]}
										{@const z=zones[idx]}
										<td class="{e.cls}" style="cursor: pointer; width:25%" onclick={()=>clickZone(idx)}>
											<div style="position: relative">
												<div style="position: absolute; font-size:0.7em; color: yellow">
													{idx+1}
												</div>
												{#if e.trouvePseudo}
													<div style="position: absolute; right:0; bottom:0; font-size:0.7em; color: yellow">
														{#each Array(e.nbSondes) as _,i }🎈{/each}
													</div>
												{/if}
												{#if e.trouvePseudo}
													<div>✅{e.trouvePseudo}</div>
												{:else if e.tryPseudo}
													<div>🔎{e.tryPseudo}</div>
												{:else}
													<div>{z.l}</div>
												{/if}
												{#if e.confirmPseudo}
													<div>🎈{e.confirmPseudo}</div>
												{:else if e.cls=="tdTry" || e.cls=="tdLock" }
													<countdown dth={e.tryEcheance} oncdTimeout={()=>getEtat()} use:countDownInit />
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

	{#if dspResultats}
		{@const pseudos= Object.keys(dspResultats.pseudos)}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Résultats:</div>
					<table>
						<tbody>
							<tr>
								<td></td>
								<td class="tdRes">#trouvés</td>
								<td class="tdRes">#confirmés</td>
							</tr>
							{#each pseudos as p,i}
								<tr>
									<td class="tdRes">{p}</td>
									<td class="tdRes">{dspResultats.pseudos[p].nTrouve}</td>
									<td class="tdRes">{dspResultats.pseudos[p].nConfirm}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspTry}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspTry=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						{#if dspTry.tryEcheance > Date.now()}
							<div>
								Tu as encore l'exclusivité de la recherche pendant
								<countdown dth={dspTry.tryEcheance} oncdTimeout={()=>{dspTry=null; addNotification("Tu as perdu l'exclusivité de recherche de ce lieu","yellow",20)}} >
									{countDownTo(dspTry.tryEcheance)}
								</countdown>
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
							<div>Coordonnées de la mascotte ({zones[dspTry.i].l}):</div>
							<div>
								<input bind:value={saisies.pX} style="width:15%" type="number" step="0.1" placeholder="x.x" />
								<input bind:value={saisies.pY} style="width:15%" type="number" step="0.1" placeholder="y.y" />
								<input type="button" value="➤" onclick={()=>proposition(dspTry)} />
							</div>
							{#if isAdmin(pseudo)}
								<div class="adminCadre">
									Soluce: #{dspTry.i} x={zones[dspTry.i].x} y={zones[dspTry.i].y}
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
							{dspSonde.radiations/dspSonde.nbSondes},
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
						{#if dspSonde.nbSondes >=SONDENB && zones[dspSonde.i].c}
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
					<div>
						<img style="width: 100%" src={CDNROOT+"screens/screen-"+dspSonde.i+".png"} alt={"screen-"+dspSonde.i} />
					</div>
				</div>
			</div>
		</div>
	{/if}
	

</div>
<!-- P420.svelte -->

