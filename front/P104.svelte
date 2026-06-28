<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo, displayObject, addNotification, playVideo,
					 markClick, urlCdn, apiCall, isPrivilege, countDownTo, hhmmssms, countDownInit
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
	import Btn from './Btn.svelte'
	import Common from './Common.svelte'
	
	let {
		GBLCTX,
		webAuth,
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
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// chargement etat du challenge 
	let CONF =$state.raw(null)
	async function getConfig(msgWs) {
		let ret = msgWs || await apiCall(APIROOT+'conf');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"conf", ret.status)
		CONF = ret.o
	}
	let etat = $state(null)
	async function getEtat(msgWs) {
		if (!CONF) return console.log("* getEtat sans config,ignoré")
		console.log('getEtat')
		let ret = msgWs || await apiCall(APIROOT+'etat');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"etat", ret.status)
		recalcEtat(ret.o)
	}
	function recalcEtat(tEtat) {
		etat=tEtat
	}
	// calcul des résultsts 
	function calcResultats() {
		dspResultats = {}
	}
</script>

<style>
	
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if isPrivilege(webAuth,pageDesc.privilege)}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin:
				{pageDesc?.n}-{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONF) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
		<!-- <Common t="headerPage" pageDesc={pageDesc} /> -->
	</div>

	{#if epiqStep==0 && CONF}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"S-codex/codex.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Le Lieu-Joli est un challenge récurrent bimensuel.
				<br/>
				Tu peux exposer ta maison de cl, ta maison perso, ta chambre
				ou même un autre lieu de housing que tu as découvert et qui te plait.
				<br/>
				Attention, tu ne peux exposer qu'un seul lieu:
				Si tu indiques un nouveau lieu, cela remplacera celui que tu exposais précédemment.
				<br/>
				Si ton lieu est déclaré "Lieu-Joli du moment" à la fin d'un cycle de votation,
				il sera noté dans le "Hall Of Fame des Lieux-Jolis".
				Il ne sera plus exposable mais tu pourras en exposer un autre et concourir à nouveau.
				Toi et l'un de ceux qui ont voté pour ton "Lieu-Joli" seront récompensés.
				<br/>
				Afin de permettre une saine compétition, le challenge ne commence que si
				{CONF.NBLIEUXMIN} Lieux-Jolis sont exposés
				et pour être déclaré "Lieu-Joli du moment" un lieu doit avoir receuilli
				au moins 33% des votes.
				<br/>
				Afin d'éviter les abus, l'importance d'un vote est pondérée:
				Plus une personne a voté précédemment, plus l'importance de son vote est minorée
				(1.0 pour un premier vote, 0.75 pour un second, 0.5 pour les suivants)
			</div>
			<Btn bind:refStep={epiqStep} step=90 val="Proposer ton Lieu-Joli" />
			<Btn bind:refStep={epiqStep} step=90 val="Voir les lieux exposés actuellement:" />
			<Btn bind:refStep={epiqStep} step=90 val="Voir les lieux exposés au prochain cycle de votation" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==90 && etat}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"S-codex-challenge/codex.jpg"} style="width:30%; float:right" alt="" />
			<div>Exposer un lieu:</div>
			<div>
				<select bind:value={saisies.lieuType}>
					<option value="1">Maison de CL</option>
					<option value="2">Maison personnelle</option>
					<option value="3">Chambre de maison de CL</option>
					<option value="4">Appartement</option>
				</select>
				<select bind:value={saisies.lieuMonde}>
					{#each CONF.MONDES as m}
						<option>{m}</option>
					{/each}
				</select>
				<select bind:value={saisies.lieuLoc}>
					{#each CONF.HOUSING as l}
						<option>{l}</option>
					{/each}
				</select>
				<input type="number" min=0 max=1000 bind:value={saisies.lieuSecteur} placeholder="#secteur" />
				{#if saisies.lieuType<=3}
					<input type="number" min=1 max=60 bind:value={saisies.lieuSlot} placeholder="#emplacement" />
				{/if}
				{#if saisies.lieuType==3}
					<input type="number" min=0 max=1000 bind:value={saisies.lieuChambre} placeholder="#chambre" />
				{/if}
				{#if saisies.lieuType==4}
					<input type="number" min=0 max=1000 bind:value={saisies.lieuAppart} placeholder="#appartement" />
					<label><input bind:checked={saisies.lieuAnnexe} type="checkbox"/>Annexe</label>
				{/if}
				<div>Décris pourquoi ton Lieu-Joli est magnifique:</div>
				<div>Tu peux utiliser
					<a href="https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline" target="gpHelp">
						le markup de Discord
					</a>
				</div>
				<textarea bind:value={saisies.lieuDesc} cols=30 rows=5></textarea>
				<div>Enfin, indique-moi un screen à associer à ton LIeu-Joli</div>
				<input type="file"  />
			</div>
			
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Résultats:
					</div>
				</div>
			</div>
		</div>
	{/if}

</div>
<!-- P104.svelte --> 

