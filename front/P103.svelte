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
	// TEST§§§ 
	async function challengeDef() {
		let ret = await apiCall(APIROOT+'challengeDef','POST', {Q:saisies.challengeTxt,R:saisies.challengeRep});
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"challengeDef", ret.status)
	}
	// TEST§§§ 
	async function testChallengeRep() {
		let ret = await apiCall(APIROOT+'testChallengeRep','POST', { x: "xx" });
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"challengeDef", ret.status)
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
				{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONF) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
				<label>Txt:<input type="text" bind:value={saisies.challengeTxt} /></label>
				<label>Rep:<input type="text" bind:value={saisies.challengeRep} /></label>
				<input type="button" value=">" onclick={challengeDef} />
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
		<!-- <Common t="headerPage" pageDesc={pageDesc} /> -->
	</div>

	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"S-codex/codex.jpg"} style="width:30%; float:right" alt="" />
			{pseudo}, le Codex est une relique très fragile et
			parfois, une de ses pages se dégrade.
			<br/>
			Dans ce cas, il me faut reconstituer la partie dégradée.
			<br/>
			Pour me permettre une restauration rapide, tu pourras m'aider en me rappelant
			le contenu d'une page endommagée.
			<br/>
			Pour celà, je ferai appel à ta mémoire.
			<br/>
			<Btn bind:refStep={epiqStep} step=90 val="Compte sur moi" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==90 && etat}
		<div class="reveal" use:scrollPageToTop>
			{#if etat.challenge?.echeance}
				<img class="parchemin" src={urlCdn+"S-codex-challenge/codex.jpg"} style="width:30%; float:right" alt="" />
				<div>
					{pseudo}, une page du Codex se détériore. Je dois la restaurer.
					Je peux le faire seule, mais cela va me prendre du temps:
					<countdown dth={etat.challenge.echeance} oncdTimeout={()=>etat.challenge=null} />.
					<br/>
					Cela pourra être bien plus rapide si 
					tu sais m'indiquer la réponse à cette question...
					<div class="adminCadre">
						<div>{etat.challenge?.Q}</div>
						<div>
							<input type="text" bind:value={saisies.challengeRep} />
							<input type="button" value=">" onclick={testChallengeRep} />
						</div>
						<div>
							Réponse: {etat.challenge?.R}
						</div>
				</div>
				</div>
			{:else}
				<img class="parchemin" src={urlCdn+"S-codex-challenge/codex.jpg"} style="width:30%; float:right" alt="" />
				<div>
					L'intégrité du Codex ne semble pas menacée actuellement.
					<br/>
					Mais reste vigilant{G(pseudoGenre,"","e")},
					cela est peut-être le calme avant une prochaine tempête.
					<br/>
					Si j'ai besoin de ton aide, je t'interpellerai sur Discords
					(FF14 France et La Grande Peluche).
				</div>
			{/if}
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
<!-- P103.svelte --> 

