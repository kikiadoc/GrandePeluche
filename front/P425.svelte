<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo, displayObject,
					 markClick, isAdmin,
					 urlCdn, apiCall, apiCallExtern, getEpsilon,
					 addNotification, mediaPlay,countDownInit,
					 addTexteTTS, isPlaying, isProd,
					 playDing, playVideo
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
	import { babylonSetOption, babylonGetOption,
					 babylonStart, babylonStop,
					 babylonSetSceneActive, sceneLoadingCreate, babylonHome,
					 babylonGetMetrologie,
					 babylonMainSceneCreate, babylonObjetActifUpdate
				 } from './3Droot.js'
	import Btn from './Btn.svelte'
	import Info from './Info.svelte'
	import Common from './Common.svelte'
	
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
	const APIROOT = '/'+pageDesc.rootName+'/'
	
	const APICONFIG = APIROOT+'config'	
	const APIETAT = APIROOT+'etat'	
	const APIREQUPDATE = APIROOT+'reqUpdate'	
	const WSMSGETAT = pageDesc.rootName+".etat"
	
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
	function init() { console.log('**mount P'+pageDesc.n+'**'); getConfig() }
	
	// appelé apres unmount du component
	function reset() { console.log('**unmunt P'+pageDesc.n+'**'); babylonStop()	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op==WSMSGETAT && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.targetPseudo = null // cible actuelle
		s.nextIndiceEcheance ??= 1 // 1ms pour forcer le refresh timer
		s.nextIndiceEcheance ||= 1 // 1ms pour forcer le refresh timer
		s.sensibilite3D ??= 3
		return s
	}

	// appelé lors d'un changement de step de l'épique 
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	let CONFIG = null
	let etat = $state(null)
	async function getConfig() {
		let ret = await apiCall(APICONFIG);
		if (ret.status != 200) throw new Error("erreur sur "+APICONFIG+"("+ret.status+')')
		CONFIG = ret.o
		await getEtat()
	}
	// chargement etat du challenge
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall(APIETAT);
		if (ret.status != 200) return console.error("erreur sur",APIETAT,ret.status)
		recalcEtat(ret.o)
	}
	async function recalcEtat(tEtat) {
		console.log("recalcEtat")
		etat=tEtat
	}


/////////////////////////////////////////////////////////////////////////////////////
	// chargement de la scene 3D pour test 
	/////////////////////////////////////////////////////////////////////////////////////
	let babIHM = $state({})
	let babMessage = $state(null)
	let dspBabParam = $state(false)
	async function start3D() {
		console.log("****************** start3D")
		await babylonStart(pseudo,babIHM)
		babylonSetSceneActive(await sceneLoadingCreate())
		babylonSetOption('perf',true,true)
	}
	function helpCoord() {
		return { titre: "Tes Ortho-Coordonnées",
						 body: ["Elles ne respectent pas le même référentiel Euclidien que celui d'Eorzéa:",
										"Y et Z sont inversées"] }
	}
	async function event3d(e) {
		let o = e.srcElement.Event3D // recupere les complements de l'event
		console.log('descEvent:',o)
		if (!o) return
		if(o.nom=="btnGo") {
			playVideo("commons/voyage-orthotemps")
			babylonSetOption('perf',false,true)
			babylonSetSceneActive(await babylonMainSceneCreate(CONFIG.WORLD3DDESC))
		}
	}
</script>
<style>
	.babylon {
	  margin: 0;
	  padding: 0;
	  width: 100%;
	  /* height: 800px; /* 100%; */
	  /* font-size: 0; */
	  color: rgba(204, 204, 204, 1);
	}
</style>
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if isAdmin(pseudo)}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin:
				{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="ResetAll" onclick={() => confirm("Tout effacer?") && apiCall(APIROOT+'etat','DELETE') } />
				<input type="button" value="ResetTimerIndice" onclick={() => saisies.nextIndiceEcheance=1 } />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}
	<Common t="popupDebutChallenge" pageDesc={pageDesc} />
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={() => dspResultats=true} />
	</div>
	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			"Chess Board" (https://skfb.ly/6SAZ9) by danielpaulse is licensed under Creative Commons Attribution-ShareAlike (http://creativecommons.org/licenses/by-sa/4.0/).
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat }
		<div class="reveal" use:scrollPageToTop>
			<div {@attach start3D} id="kikiFullArea">
				{#if dspBabParam}
					<div style="position: absolute" class="popupCadre papier">
							<div class="close" onclick={()=>dspBabParam=null} role="button">X</div>
							<div class="popupZone">
								Paramètres/actions:
								<div class="popupContent" style="font-size:0.8em">
									<input type="button" value="Retour à l'entrée" onclick={()=>babylonHome()} />
									<hr/>
									<input type="button" value="Mode PC/SM" onclick={()=>babylonSetOption("IHM")} />
									<input type="button" value="Molette▲▼" onclick={()=>babylonSetOption("wheelDir")} />
									<hr/>
									<input type="button" value="Fullscreen" onclick={()=>babylonSetOption("fullscreen",true)} />
									<input type="button" value="Normal" onclick={()=>babylonSetOption("fullscreen",false)} />
									<hr/>
									<input type="button" value="Debug" onclick={()=>babylonSetOption("debug")} />
									<input type="button" value="Perf" onclick={()=>babylonSetOption("perf")} />
								</div>
								{#if isAdmin(pseudo)}
									<div class="adminCadre">
										<input bind:value={saisies.add3Di} type="number" min=0 max=100 step=1 placeholder="i" />
										<input bind:value={saisies.add3Dn} type="text" placeholder="nom" />
										<input bind:value={saisies.add3Dcx} type="number" placeholder="cX" min=-100 max=100 step=0.1 />
										<input bind:value={saisies.add3Dcy} type="number" placeholder="cY" min=-100 max=100 step=0.1 />
										<input bind:value={saisies.add3Dcz} type="number" placeholder="cZ" min=-100 max=100 step=0.1 />
										<input bind:value={saisies.add3Drx} type="number" placeholder="rX" min=-100 max=100 step=0.1 />
										<input bind:value={saisies.add3Dry} type="number" placeholder="rY" min=-100 max=100 step=0.1 />
										<input bind:value={saisies.add3Drz} type="number" placeholder="rZ" min=-100 max=100 step=0.1 />
										<input type="button" value="Update" onclick={()=>babylonObjetActifUpdate(
											saisies.add3Di,saisies.add3Dn,
											saisies.add3Dcx,saisies.add3Dcy,saisies.add3Dcz,	
											saisies.add3Drx,saisies.add3Dry,saisies.add3Drz	
										)} />
									</div>
								{/if}
							</div>
					</div>
				{/if}
				{#if babMessage}
					<Info bind:dspInfo={babMessage} />
				{/if}
				<div>
					<span role="button" class="simpleLink" onclick={()=>babMessage=helpCoord()} >
						🔮X:{babIHM.x?.toFixed(1)} Y:{babIHM.y?.toFixed(1)} Z:{babIHM.z?.toFixed(1)} 
						{#if babIHM.debug}
							🔮:	rX:{babIHM.rx?.toFixed(1)} rY:{babIHM.ry?.toFixed(1)} rZ:{babIHM.rz?.toFixed(1)} 
						{/if}
					</span>
					<span role="button" class="simpleLink" onclick={()=>babMessage="Vitesse de déplacement dans l'Ortho-Temps"}>🏃</span>
					<input type="range" min=1 max=5 step=1 style="width:20%"
						bind:value={saisies.sensibilite3D}
						onchange={(e)=>babylonSetOption("sensibilite",e.srcElement.value)} />
					<span role="button" style="cursor:pointer" onclick={()=>dspBabParam=!dspBabParam}>⚙️</span>
				</div>
				<div>
					<canvas class="babylon" id="render-canvas-3D" onevent3d={event3d}></canvas>
				</div>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
</div>

<!-- P425.svelte -->
