<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, apiCall, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownTo, hhmmssms, isDistance, countDownInit,
					 getEpsilon
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
	function init() { calcDebutChallengeDth(); getEtat() }
	
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
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// Liste des zones à découvrir (40)
	const zones = [
		/* 0-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 0-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 0-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 0-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 1-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 1-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 1-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 1-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 2-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 2-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 2-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 2-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 3-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 3-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 3-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 3-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 4-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 4-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 4-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 4-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 5-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 5-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 5-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 5-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 6-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 6-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 6-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 6-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 7-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 7-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 7-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 7-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 8-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 8-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 8-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 8-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 9-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 9-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 9-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 9-3 */ { x: 0.0, y: 0.0, l:"zone???" }
	]
	
	// calcul de la date effective pour le challenge
	let debutChallengeDth = $state(Date.now()+60000) // par defaut en attente de la synchro initt
	function calcDebutChallengeDth() {
		debutChallengeDth = (isProd)? pageDesc.start + 15*60000 : Date.now()+3*60000 // 
	}
	function getEcheanceTrouve(tryEcheance,trouveDth,nbTrouve,lockTimer) {
		console.log("getEcheanceTrouve",tryEcheance,trouveDth,nbTrouve,lockTimer)
		return Math.max(tryEcheance,trouveDth + nbTrouve*lockTimer)
	}
	// chargement etat du challenge
	let etat = $state(null)
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall('/lesbases/etat');
		if (ret.status != 200) return console.error("erreur sur /lesbases/etat", ret.status)
		let tEtat = ret.o
		tEtat.trouveNb = 0
		tEtat.trouveDth = 0
		tEtat.tryNb = 0
		tEtat.tryEcheance = 0
		tEtat.elts.forEach( (e) => {
			if (e.trouvePseudo==pseudo) {
				tEtat.trouveNb++
				if (e.trouveDth > tEtat.trouveDth)
					tEtat.trouveDth=e.trouveDth
			} 
			if (e.tryPseudo==pseudo && e.tryEcheance > tEtat.tryEcheance)
				tEtat.tryEcheance=e.tryEcheance
		})
		tEtat.trouveEcheance = getEcheanceTrouve(tEtat.tryEcheance,tEtat.trouveDth,tEtat.trouveNb,tEtat.LOCKTIMER)
		etat=tEtat
	}
	// calcul des résultsts
	function calcResultats() {
		dspResultats = res
	}

	// click sur une zone
	let dspTry = $state(null) // tentative d'identification d'une zone
	function clickZoneDecouverte(e) {
		addNotification("ClickDecouverte:"+e.idx)		
	}
	function clickZoneNonDecouverte(e) {
		let now = Date.now() + getEpsilon()
		// si la zone est encore ciblées, continue le try
		if (e.tryPseudo==pseudo) {
			dspTry = e
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
		if ( etat.trouveEcheance>now ) {
			displayInfo({titre:"Impossible",body:["Tu n'es pas assez repos"+G(pseudoGenre,"é","ée")]})
			return
		}
		// preemption de la zone
		apiCall('/lesbases/tentative/'+e.idx,'POST')
		// simulation immediate en local
		e.tryEcheance = Date.now()+etat.LOCKTIMER
		e.tryPseudo = pseudo
		dspTry=e
		return
	}
	function clickZone(idx) {
		console.log("clickZone:",idx)
		let e = etat.elts[idx]
		if (saisies.debug) displayObject(e)
		if (e.trouvePseudo)
			clickZoneDecouverte(e)
		else
			clickZoneNonDecouverte(e)
	}
	function proposition(e) {
		// verification locales des ccord
		let zone = zones[e.idx]
		if (! isDistance(saisies.pX,saisies.pY,zone.x,zone.y,0.1) ) {
			displayInfo({
				titre:"Ce n'est pas le bon emplacement",
				body:[
					"Mauvaises coordonnées",
					"Il faut indiquer les coordonnées du robot à +/- 0.1 près"
				]
			})
			return
		}
		apiCall('/lesbases/proposition/'+e.idx,'POST',{x: saisies.pX, y: saisies.pY})
		saisies.pX=null
		saisies.pY=null
		dspTry=null
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
	.td { width: 20% }
	.tdTrouve {background-color: white}
	.tdTry { background-color: green}
	.tdKeep {background-color: orange}
	.tdFree {}
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
				<input type="button" value="ResetAll" onclick={() => confirm("Tout effacer?") && apiCall('/lesbases/etat','DELETE') } />
				<input type="button" value="SetAll-2" onclick={() => confirm("Tout valider?") && apiCall('/lesbases/setAll','DELETE') } />
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
				<div class="info" style="color:red">
					Le challenge commencera dans
					<countdown dth={debutChallengeDth} oncdTimeout={()=>debutChallengeDth=0} />.
					<br/>
					Tu as le temps de bien lire le lore et regarder les vidéos!
				</div>
			{/if}
			Depuis le lancement de Pharao vers le Point de Lagrange,
			une musique me trotte dans la tête.
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

			blablabla
			<br/>
			<Btn bind:refStep={epiqStep} step=80 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Blablabla
			blablabla
			<br/>
			{#if debutChallengeDth < Date.now()}
				<Btn bind:refStep={epiqStep} step=90 val="J'y vais tout de suite" />
			{:else}
				<div class="info" style="color:red">
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

	{#if epiqStep==90 && etat}
		<div use:scrollPageToTop>
			<div>
				<span class="gpHelp" onclick={markClick} gpHelp="Repos nécessaire avant de changer de lieu ou après une découverte">
					🔎<countdown dth={etat.trouveEcheance} txtTimeout="Possible" use:countDownInit />
				</span>
			</div>
			<div class="parchemin">
				<table class="table">
					<tbody class="tbody">
						{#each Array(etat.L) as _,l}
							<tr class="tr">
								{#each Array(etat.C) as _,c}
									{@const idx=l*etat.C+c}
									{@const e=etat.elts[idx]}
									{@const z=zones[idx]}
									{@const cls= (e.trouvePseudo==pseudo)?
										"tdTrouve" :
										(e.tryPseudo==pseudo && e.tryEcheance > Date.now())?
										"tdTry" :
										(e.tryPseudo==pseudo)?
										"tdKeep" :
										"tdFree"
									}
									<td class="{cls}" onclick={()=>clickZone(idx)}>
										{e.trouvePseudo || e.tryPseudo || z.l}
										<br/>
										{#if cls=="tdTry" || cls=="tdKeep"}
											<countdown dth={e.tryEcheance} oncdTimeout={()=>getEtat()} use:countDownInit />
										{:else}
											--:--:--
										{/if}
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

	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Résultats:</div>
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
								Tu as l'exclusivité de la recherche pendant
								<countdown dth={dspTry.tryEcheance} oncdTimeout={()=>dspTry=null} >
									{countDownTo(dspTry.tryEcheance)}
								</countdown>
							</div>
						{:else}
							<div class="blinkMsg">Tu n'as plus l'exclusité de la recherche dans cette zone</div>
						{/if}
						<div>
							<div>Coordonnées du robot:</div>
							<div>
								<input bind:value={saisies.pX} style="width:15%" type="number" step="0.1" placeholder="x.x" />
								<input bind:value={saisies.pY} style="width:15%" type="number" step="0.1" placeholder="y.y" />
								<input type="button" value="➤" onclick={()=>proposition(dspTry)} />
							</div>
							<div style="height: 5em; width:80%; border: 1px solid white">Affichage de l'image</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	

</div>
<!-- P420.svelte -->

