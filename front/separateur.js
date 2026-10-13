<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo, displayObject,
					 markClick, isAdmin,
					 urlCdn, apiCall,
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
	
	const APICONFIG = APIROOT+'config'	
	const APIETAT = APIROOT+'etat'	
	const WSMSGETAT = pageDesc.rootName+".etat"
	
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
	function init() { console.log('**mount P'+pageDesc.n+'**') }
	
	// appelé apres unmount du component
	function reset() { console.log('**unmunt P'+pageDesc.n+'**')	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op==WSMSGETAT && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		
		// retur saisies normalized
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let lastEquipStepChangeDth=Date.now()
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		lastEquipStepChangeDth=Date.now()
	}

	// calcul de la date effective pour le challenge
	let debutChallengeDth = $state(Date.now()+60000) // par defaut en attente de la synchro initt
	function calcDebutChallengeDth() {
		debutChallengeDth = (isProd)? pageDesc.start + pageDesc.delaiDebut*60000 : Date.now()+pageDesc.delaiDebut*1000
	}
	// chargement config du challenge
	let CONFIG = $state(null)
	async function getConfig(msgWs) {
		let ret = msgWs || await apiCall(APICONFIG);
		if (ret.status != 200) return console.error("erreur sur",APICONFIG,ret.status)
		CONFIG = ret.o
	}
	// chargement etat du challenge
	let etat = $state(null)
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall(APIETAT);
		if (ret.status != 200) return console.error("erreur sur",APIETAT,ret.status)
		recalcEtat(ret.o)
	}

	async function recalcEtat(tEtat) {
		// complete l'etat 
		etat=tEtat
	}
	
	// calcul des résultsts
	function calcResultats() {
		let res={ }
		dspResultats = res
	}

	
</script>

<style>

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
				<input type="button" value="getConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="getEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
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
			<div>
				blabla hyper-temps lancement en difficulté
				dissonances perturbent
				trouver les origines des dissonances dans le temps eorzeen
			</div>
			<Btn bind:refStep={epiqStep} step=90 val="Explique-moi!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	

	{#if epiqStep==90 && etat && CONFIG}
		<div use:scrollPageToTop>
			<div>
				barre de titre
			</div>
			<div>
				contenu
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
</div>

/* separateur.js */
