<script>
	import {
		displayInfo, setHautFait, playDing, playVideo, countDownInit, getPseudoFromStorage, isAdmin
	} from "./common.js"
	
	let {
		refStep = $bindable(null),
		refPage = $bindable(0),
		refPageDone = $bindable([]),
		refDth=0,
		delai=0,
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
			if (msg) displayInfo({titre:titre, body:[msg], trailer:trailer, ding:ding, back: back});
			if (video) playVideo(video)
			if (hautFait) setHautFait(hautFait,3)
			if (pageDone && refPageDone && ( refPageDone.find((e) => e==pageDone) == undefined) )
				refPageDone.push(pageDone)
			if (step!==null) refStep=step
			if (page!==null) refPage=page
		}
		else {
			if (koMsg) displayInfo({titre:titre, body:[koMsg], trailer:trailer, ding: 'prout-long', back:'papier'})
			if (koVideo) playVideo(koVideo)
		}
	}
	function clicTimerKO() {
		if (isAdmin(getPseudoFromStorage())) {
			if (confirm("Admin bypass timer ?"))
				return clicOui()
		}
			
		displayInfo({
			titre:"Ne rushe pas les explications !!",
			img: "commons/coyote.gif",
			imgClass: "img50",
			body:[
				"Pour toi, lire attentivement les explications, c'est l'assurance de bien comprendre le Lore.",
				"Pour moi, c'est parfois faire des opérations importantes invisibles pour toi.",
				"Bref, ne rushe pas et lis attentivement le Lore.",
				"Si tu l'avais fait, tu aurais vu le timer."
			],
			ding: "prout-long"
		})
	}
</script>

<style>
</style>
{#if delai && refDth && refDth<Date.now()+delai*1000}
	<span style="position: relative">
		<countdown style="position: absolute; color:yellow; font-size:0.7em" dth={refDth+delai*1000}
			oncdTimeout={()=>delai=0}>
		</countdown>
		<input style="color:grey" id={id} onclick={clicTimerKO} type="button" value={val} /> 
	</span>
{:else}
	<input id={id} onclick={clicOui} type="button" value={val} />
{/if}

<!-- z/Btn.svelte -->

