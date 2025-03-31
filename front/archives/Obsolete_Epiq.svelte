<script>
	import { playVideo, newInfoPopup, scrollTop, addNotification, apiCall, setHautFait } from "./storage.js"
	/**
	 * @typedef {Object} Props
	 * @property {any} step
	 * @property {number} [page]
	 * @property {any} [pageDone]
	 * @property {any} [oui]
	 * @property {any} [non]
	 * @property {any} [rst]
	 * @property {boolean} [ouiIf]
	 * @property {boolean} [nonIf]
	 * @property {boolean} [rstIf]
	 * @property {any} [ouiVideo]
	 * @property {any} [nonVideo]
	 * @property {any} [rstVideo]
	 * @property {any} [ouiHautFait]
	 * @property {any} [nonHautFait]
	 * @property {any} [rstHautFait]
	 * @property {any} [ouiMsg]
	 * @property {any} [nonMsg]
	 * @property {any} [rstMsg]
	 * @property {string} [ouiVal]
	 * @property {string} [nonVal]
	 * @property {string} [rstVal]
	 * @property {number} [ouiPage]
	 * @property {number} [nonPage]
	 * @property {number} [rstPage]
	 * @property {any} [ouiFct]
	 * @property {any} [nonFct]
	 * @property {any} [rstFct]
	 * @property {any} [ouiPageDone]
	 * @property {any} [nonPageDone]
	 * @property {any} [rstPageDone]
	 * @property {any} [selVal]
	 * @property {any} [selOpt]
	 * @property {string} [titre]
	 * @property {string} [trailer]
	 */

	/** @type {Props} */
	let {
		step = $bindable(),
		page = $bindable(0),
		pageDone = [],
		oui = null,
		non = null,
		rst = null,
		ouiIf = true,
		nonIf = true,
		rstIf = true,
		ouiVideo = null,
		nonVideo = null,
		rstVideo = null,
		ouiHautFait = null,
		nonHautFait = null,
		rstHautFait = null,
		ouiMsg = null,
		nonMsg = null,
		rstMsg = null,
		ouiVal = "oui",
		nonVal = "non",
		rstVal = "recommencer",
		ouiPage = 0,
		nonPage = 0,
		rstPage = 0,
		ouiFct = null,
		nonFct = null,
		rstFct = null,
		ouiPageDone = null,
		nonPageDone = null,
		rstPageDone = null,
		selVal = null,
		selOpt = null,
		titre = "Quête initiatique...",
		trailer = "Ferme ce popup pour continuer"
	} = $props();
	
	let scrollPrm = { behavior : "smooth", block: "start", inline: "start"  }

	function clicOui() {
		if (ouiMsg) newInfoPopup(titre,ouiMsg,trailer);
		playVideo(ouiVideo)
		if (ouiHautFait) setHautFait(ouiHautFait,3);
		if ( (ouiPageDone) && (pageDone.find((e) => e==ouiPageDone) == undefined) ) pageDone.push(ouiPageDone);
		if (ouiFct) ouiFct();
		step = oui
		if (ouiPage) page=ouiPage;
		scrollTop();
	}
	function clicNon() {
		if (nonMsg) newInfoPopup(titre,nonMsg,trailer);
		playVideo(nonVideo)
		if (nonHautFait) setHautFait(nonHautFait,3);
		if ( (nonPageDone) && (pageDone.find((e) => e==nonPageDone) == undefined) ) pageDone.push(nonPageDone);
		if (nonFct) nonFct();
		step = non
		if (nonPage) page=nonPage;
		scrollTop();
	}
	function clicRst() {
		if (rstMsg) newInfoPopup(titre,rstMsg,trailer);
		playVideo(rstVideo);
		if (rstHautFait) setHautFait(rstHautFait,3);
		if ( (rstPageDone) && (pageDone.find((e) => e==rstPageDone) == undefined) ) pageDone.push(rstPageDone);
		if (rstFct) rstFct();
		step = rst
		if (rstPage) page=rstPage;
		scrollTop();
	}
	
</script>

<style>
	
</style>

{#if oui != null && ouiIf} <input onclick={clicOui} type="button" value={ouiVal} />{/if}
{#if non != null && nonIf} <input onclick={clicNon} type="button" value={nonVal} />{/if}
{#if rst != null && rstIf} <input onclick={clicRst} type="button" value={rstVal} />{/if}
{#if selOpt !== null}
	{#if selVal}{selVal}{/if}
	<select bind:value={step}>
		{#each selOpt as opt,i}
			<option value={i}>{opt}</option>
		{/each}
	</select>
{/if}

<!-- epiq.svelte -->

