<script>
	// import { onMount, onDestroy } from 'svelte';
	// import { addNotification, urlCdn } from "./storage.js"

	// Usage: <Radio nom=nom cb=(idx) options=[]  ... />
	
	let { 
				nom, // nom est string du nom du groupe de selection
				lock = false, // indique si les modifs sont autorisées
				cb = (i)=>null, // callback de click - -1 si disabled, >=0 index de click 
				value = $bindable(0), // value est la valeur sélectionnée (bind)
				options = [] // options est un tbl de { val: "val", lbl:"label", icon:"url" }
			} = $props();

</script>

<style>
	/* boutons radio */
	.radio { }
	.radioNotChecked { border: 4px outset lightgrey; cursor: pointer; text-wrap: nowrap; }
	.radioChecked { border: 4px inset lightgreen; cursor: pointer; text-wrap: nowrap; }
	label {
		border-radius: 61.25em;
		padding: 0.1em 0.4em;
		font-size: 0.75em;
		font-weight: 400;
		border: 0.03125em solid;
		cursor:pointer;
	}
</style>

<span class="radio">
	{#each options as o,i}
		<span>
			<label class={(value===o.val)? "radioChecked":"radioNotChecked"}>
				{#if lock}
					<input name={nom} bind:group={value} type="radio" value={o.val} onclick={(e)=>{cb(-1); e.preventDefault()}} />
				{:else}
					<input name={nom} bind:group={value} type="radio" value={o.val} onclick={(e)=>cb(i)} />
				{/if}
				{o.lbl}
				{#if o.icon}
					<img style="height:1em; vertical-align:text-top" src={o.icon} alt="" />
				{/if}
			</label>
		</span>
		<span>&nbsp;</span>
	{/each}
</span>

<!-- Radio.svelte -->
	

