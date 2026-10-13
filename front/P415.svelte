<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn
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
	function init() {	 }
	
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

</script>

<style>
	
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
			<img class="parchemin" src={urlCdn+"ff-10/canard-enchaine.jpg"} style="width:30%; float:right" alt="" />
			<div>Bienvenue {pseudo} dans <b>{pageDesc.texte}</b>.</div>
			<div>
				GrosDegueulasse, le pnj anticraft, a caché le grimoire d'Ikéa quelque part en
				Eorzéa.
			</div>
			
			<br/>
			
			<Btn bind:refStep={epiqStep} step=50 val="J'ai compris" />
			<div class="info">
				Ce challenge est un hommage aux auteurs qui, depuis près de 75 ans,
				alimentent toutes les semaines la chronique "Sur l'album de la comtesse" du
				Canard Enchaîné par d'innombrables contrepéteries souvent grivoises.
				<br/>
				En cas de difficulté pour ce challenge, une recherche Google peut-être ton amie!
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-10/canard-enchaine.jpg"} style="width:30%; float:right" alt="" />
				GrosDegueulasse, ce vieux routard, nous a proposé sa bible
				Votre courge est bien trop verte
				« L'hommage de leurs vers qu'à l'envi les poètes
		    À la femme déçue offrent toujours ardents
		    Flatte certes le but mais n'apaise la quête :
		    L'attente a des plaisirs qu'on ne fait qu'un moment. »
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

</div>
<!-- P415.svelte -->

