<script>
	import { onMount, onDestroy } from 'svelte'
	import {urlImg, markClick, playDing, playMusic} from './storage.js'

	let {	dspInfo=$bindable(), domId=null	} = $props();

	onMount(() => {
		if (dspInfo.ding) playDing(dspInfo.ding)
		if (dspInfo.mp3) playMusic(dspInfo.mp3)
	})
	onDestroy(() => {  });

</script>
<style>

</style>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div id={domId || 'Cinfo'+Date.now()} class="popupCadre {dspInfo.back || 'stars'}">
	<div class="close" onclick={()=>dspInfo=null} role="button">X</div>
	<div class="popupZone">
		<div class="popupContent">
			{#if dspInfo.img}
				<img gpLink={dspInfo.url} onclick={markClick} src={urlImg+dspInfo.img} style="float: right; width: 50%" alt="">
			{/if}
			{#if dspInfo.imgTop}
				<img src={urlImg+dspInfo.imgTop} style="width: 100%" alt="">
			{/if}
			<div class="info">{dspInfo.titre || 'Information'}</div>
			{#if Array.isArray(dspInfo.body) }
				{#each dspInfo.body as p}
					{#if p==null}
						<hr/>
					{:else if typeof p == "object" }
						{#if p.cb}
							<div role="button" style="cursor:pointer" onclick={p.cb}>{p.txt}</div>
						{:else}
							<div>objet:{p.txt}</div>
						{/if}
					{:else}
						<div>{p}</div>
					{/if}
				{/each}
			{:else}
					<div>{dspInfo.body || dspInfo }</div>
			{/if}
			{#if dspInfo.cbActions}
				{#each dspInfo.cbActions as a}
					<div role="button" style="cursor:pointer" onclick={a.cb}>👉{a.txt}</div>
				{/each}
			{/if}
			{#if dspInfo.url && !dspInfo.img}
				<div><a href={dspInfo.url} target="_blank">Info</a></div>
			{/if}
			{#if dspInfo.imgBot}
				<img src={urlImg+dspInfo.imgBot} style="width: 100%" alt="">
			{/if}
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

<!-- Cinfo.svelte -->
