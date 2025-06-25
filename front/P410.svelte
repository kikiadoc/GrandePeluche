<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, apiCall
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
	function init() { getEtat() }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
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
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall('/pharao/status');
		if (ret.status == 200) {
			pharaoStatus = ret.o;
		}
	}
	
	
</script>

<style>
	table { background-image: url('https://cdn.adhoc.click/V10/ff-10/Pharao.png');
					background-size: 100% 100%; background-position: center;
					width: 90%; margin: auto;
				}
	
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if pseudo.startsWith('Kikiadoc')}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin:
				{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={() => dspResultats=true} />
		<!--
		<span role="button"	style="cursor: pointer" onclick={()=>{ dspObject={ template: "a modifier" }}}>
		🆘
		</span>
		-->
	</div>
	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Résultat à faire
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-10/Pharao.png"} style="width:30%; float:right" alt="" />
			Bienvenue {pseudo} dans <b>{pageDesc.texte}</b>.
			<br/>
			Principe de pharao:
			Protéger les composants nécessaires à Pharao.
			<Btn bind:refStep={epiqStep} step=50 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==50}
		{@const PHARAO_SIZE=6}
		<div class="parchemin">
			<table>
				<tbody>
					{#each Array(PHARAO_SIZE) as _,l}
						<tr>
						{#each Array(PHARAO_SIZE) as _,c}
							<td>
								{l}-{c} 
							</td>
						{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- P410.svelte -->

