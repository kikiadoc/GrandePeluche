<script>
	import { infoPopup, setHautFait, playDing, playVideo } from "./storage.js"
	/**
	 * @typedef {Object} Props
	 * @property {any} [refStep]
	 * @property {number} [refPage]
	 * @property {any} [refPageDone]
	 * @property {any} [id]
	 * @property {string} [val]
	 * @property {any} [ifFct]
	 * @property {any} [msg]
	 * @property {any} [koMsg]
	 * @property {any} [ding]
	 * @property {any} [video]
	 * @property {any} [koVideo]
	 * @property {any} [hautFait]
	 * @property {any} [page]
	 * @property {any} [step]
	 * @property {any} [pageDone]
	 * @property {string} [titre]
	 * @property {string} [trailer]
	 */

	/** @type {Props} */
	let {
		refStep = $bindable(null),
		refPage = $bindable(0),
		refPageDone = $bindable([]),
		id = null,
		val = "ok",
		ifFct = null,
		msg = null,
		koMsg = null,
		ding = null,
		video = null,
		koVideo = null,
		hautFait = null,
		page = null,
		step = null,
		pageDone = null,
		titre = "Challenge...",
		back = null,
		trailer = "Ferme ce popup pour continuer"
	} = $props();
	
	function clicOui() {
		let ok = (ifFct)? ifFct() : true
		if (ok) {
			if (msg) infoPopup({titre:titre, body:msg, trailer:trailer, ding:ding, back: back});
			if (video) playVideo(video)
			if (hautFait) setHautFait(hautFait,3);
			if (pageDone && refPageDone && (refPageDone.find((e) => e==pageDone) == undefined) ) refPageDone.push(pageDone)
			if (step!==null) refStep=step
			if (page!==null) refPage=page
		}
		else {
			if (koMsg) infoPopup({titre:titre, body:koMsg, trailer:trailer, ding: 'prout-long', back:'papier'})
			if (koVideo) playVideo(koVideo)
		}
	}
</script>

<style>
</style>

<input id={id} onclick={clicOui} type="button" value={val} />

<!-- z/Btn.svelte -->

