<script>
	import { onMount, onDestroy } from 'svelte'
	import { urlCdn, markClick, playDing } from './common.js'

	let {	dspInfo=$bindable(), template=null	} = $props()
	// tempate: snippet de formattage du texte
	// DSPINFO: {}
	// dspInfo.back : class de background
	// dspInfo.img : url dans le CDN
	// dspInfo.imgClass : img50 || img100 || custom global
	// dspInfo.titre : texte de titre
	// dspInfo.trailer : texte de trailer
	// dspInfo.autoClose : nombre de secondes avant autoclose
	// dspInfo.url : url a utiliser pour les liens
	// dspInfo.ding : nom du ding
	// dspInfo.body : TABLEAU des elements a afficher
	// Tableau dspInfo.body[i]:
	// dspInfo.body[i].txt : texte
	// dspInfo.body[i].cb : callback sur click (l,i,e) l=ligne body, i=#ligne, e=eventClick

	onMount(() => { if (dspInfo.ding) playDing(dspInfo.ding) })
	onDestroy(() => {  })

</script>

<style>
	.img50 { width: 50%; float: right }
	.img100 { width: 100% }
</style>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="popupCadre {dspInfo.back || 'papier'}">
	<div class="close" onclick={()=>dspInfo=null} role="button">X</div>
	<div class="popupZone">
		<div class="popupContent">
			{#if dspInfo.img}
				<img gpLink={dspInfo.url} onclick={markClick} src={urlCdn+dspInfo.img}
					class={ dspInfo.imgClass || "img50"} alt="" />
			{/if}
			<div class="info">{dspInfo.titre || 'Information'}</div>
			{#each (dspInfo.body || [dspInfo]) as l,i}
				{#if l==null}
					<hr/>
				{:else if typeof l == "string" }
					{#if template}{@render template(l)}{:else}<div>{l}</div>{/if}
				{:else if l.cb}
					<div class="{l.cls}" role="button" style="cursor:pointer" onclick={(e)=>l.cb(l,i,e)}>
						{#if template}👉{@render template(l)}{:else}👉{l.txt}{/if}
					</div>
				{:else}
					<div class="{l.cls}">
						{#if template}{@render template(l)}{:else}{l.txt}{/if}
					</div>
				{/if}
			{/each}
			<div style="clear:both"></div>
		</div>
		<div class="info">
			{dspInfo.trailer || "Ferme ce popup"}
			{#if dspInfo.autoClose}
				(<countdown dth={Date.now()+dspInfo.autoClose*1000} oncdTimeout={()=>dspInfo=null} />)
			{/if}
		</div>
	</div>
</div>

<!-- Info.svelte -->
