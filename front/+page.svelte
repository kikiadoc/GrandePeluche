<script>
	const SVELTEVERSION=null // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
	const CLIENTVERSION=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
	const GLOBALSTARTDTH=Date.now() // dth de démarrage des traitements 
	console.log('******** CLIENT START id:',GLOBALSTARTDTH)

	// divers caractères pour copier/coller : ➤▲⏸◀▶▼⏬🔎📽❓✅🆘⚠️⬇️✅➥📷εΔ⛭👉😈ⓘ(ℹ)🛈႞⒤⇛⏳
	// ne fonctionne pas sur android 🛈 utiliser (ℹ)

	//////////////////////////////////////////
	// Imports
	//////////////////////////////////////////
	import { onMount, onDestroy } from 'svelte'
	import {
		loadIt, storeIt, isProd, swcSetup, urlCdn, urlRaw,
		addNotification, displayInfo, displayError,
		startCountDown, stopCountDown, scrollNodeToBottom, 
		connectToServer, disconnectFromServer, apiCall,	getDynMetro, getEpsilon,
		hhmmss, hhmmssms, geUtcMsFrom, mmssms,
		orientationChange, visibilityChange, startBlinkGlobal, markClick, firstClick,
		playMusic, playDing, playVideo, closeVideo, audioInit, audioSetup, wsMedia,
		tts, tryTTS,
		securitypolicyviolation, generateSecurityAlert,
		metaCacheList, metaCacheClear, swcGetWaitingIds
	} from "./common.js";
	
	import { G, unPatchConsole } from "./privacy.js"
	import { GBLCONST, GBLSTATE } from "./ground.svelte.js"

	import Info from './Info.svelte'
	import Radio from './Radio.svelte'
	import Phome from './Phome.svelte'
	import Pauth from './Pauth.svelte'
	import Padmin from './Padmin.svelte'
	import Pipa from './Pipa.svelte'
	
	// import P400 from './P400.svelte' // metropolis
	import P401 from './P401.svelte' // Kiki's Event X - le bug bounty
	import P405 from './P405.svelte' // Kiki's Event X - initiatique
	import P410 from './P410.svelte' // Kiki's Event X - Pharao
	// import P499 from './P499.svelte' // Pharao

	//////////////////////////////////////////
	// Gestion du cycle de vie
	//////////////////////////////////////////
	onMount(() => {
		console.log('** Mount Début ** id=',GLOBALSTARTDTH)
		// unlock play media sur first click
		document.addEventListener("click", firstClick, { once: true })
		audioInit(GBLSTATE)
		// audiosetup par call et ensuite via un effect, ca fait redondant, mais nop, possible
		// d'avoir un start média apres le mount et avant l'effect
		// audioresume, playVideo gere les appels doublons
		audioSetup(GBLSTATE.audioVolume,GBLSTATE.audioBack,GBLSTATE.audioAmbiance,GBLSTATE.audioTTS)
		$effect(() => audioSetup(GBLSTATE.audioVolume,GBLSTATE.audioBack,GBLSTATE.audioAmbiance,GBLSTATE.audioTTS) )
		// gestion smartphone		
		window.screen?.orientation?.addEventListener("change", orientationChange);
		visibilityChange()
		startCountDown()
		GBLSTATE.swcReady = swcSetup() // init le dialogue avec le service worker controller
		console.log('** Mount Fin ** id=',GLOBALSTARTDTH)
	});
	onDestroy(() => {
		console.log('** UnMount ** id=',GLOBALSTARTDTH)
		disconnectFromServer()
		stopCountDown()
		document.removeEventListener("click", firstClick, { once: true })
		window.screen?.orientation?.removeEventListener("change", orientationChange)
		unPatchConsole()
		console.log('** UnMount Ok ** id=',GLOBALSTARTDTH)
	});

	// peut être appelé après l'identification (effect) ou si dejà identifié (loadit)
	function init(pseudo) {
		console.log('Pseudo init:',pseudo)
		if (pseudo)
			connectToServer(wsCbStatus, wsCbMessage,CLIENTVERSION)
		else
			page = 0; // force login car !pseudo
	}
	function initAfterKeyValidation() {
		// si la page n'est pas dans la desription, reset la page a 0
		if (page!=0 && !pageList.find( (e) => { return (e.n == page) } ) ) page=0
	}

	/////////////////////////////////////////////////////////////////////
	// Configuration générale
	//
	let page = $state(loadIt('page',0))
	$effect(() => storeIt('page',page))
	$effect(() => pageChange(page))
	let pageDone = $state(loadIt('pageDone',[]))
	$effect(() => storeIt('pageDone',pageDone))
	let PageComponent = $state(null); // Attention, contient un SVELTE COMPONENT si non null
	let pageDesc = $state(null)
	let pseudoList=$state([]) //chargement par WS
	let pseudo = $state(loadIt('pseudo',""))
	$effect(() => init(pseudo)) // init selon pseudo ou auth
	let pseudoGenre = $state(loadIt('pseudoGenre',null))
	$effect(() => storeIt('pseudoGenre',pseudoGenre))
	// affichage popup	
	let dspPseudo=$state(null) // affichage Popup pseudo
	let dspMultiPopup=$state(null)
	let dspInfo = $state(null)
	let dspObject = $state(null)
	let dspError = $state(null)
	let dspAdminMsg = $state(null)

	/////////////////////////////////////////////////////////////////////
	// gestion du changement de page (sur $effect)
	/////////////////////////////////////////////////////////////////////
	function pageChange(newPage) {
		console.log('Changement Page:',newPage)
		let wPageDesc = pageList.find((e) => e.n == newPage)	// Recherche la description de la page
		PageComponent = wPageDesc?.component
		pageDesc = wPageDesc
		playMusic(wPageDesc?.music)
	}

	//
	// Liste des pages de jeu
	// (page list n'est pas const pour permettre le refresh)
	// always: true indique qu'il faut toujours afficher
	// beta: true inidique que c'est disponible en avant premiere
	// prereq: nnn element prérequis (doit être dans pageDone)
	let pageList = $state([
		{n: 10, texte: "L'IPA, l'Institut Peluchique de l'Audiovisuel",
		 music: "derniere-seance",
		 start: 0,
		 end: 0,
		 always: true,
		 component: Pipa
		},
		/*
		{n: 400, texte: "Métropolis", music: "le-jeu",
		 start: geUtcMsFrom(2025,3,21,19,0,0),
		 end: geUtcMsFrom(2025,3,25,8,0,0),
		 after: true,
		 component: P400
		},
		*/
		{n: 401, texte: "Le Bug Bounty de l'IPA", music: "Alice",
		 start: geUtcMsFrom(2025,6,20,18,0,0),
		 end: geUtcMsFrom(2025,7,15,18,0,0),
		 component: P401,
		},
		{n: 405, texte: "Initiatique (Kiki's Event X)", music: "pharao-secrets",
		 start: 0,
		 end: 0,
		 component: P405,
		 // beta: true
		},
		{n: 410, texte: "Pharao", music: "plus-pres-des-etoiles",
		 start: 0,
		 end: 0,
		 component: P410
		},
		{n: 415, texte: "Mercredi", music: "mercredi",
		 start: 0,
		 end: 0,
		 component: null
		 // idée: des fantomes popent a différents endroits
		 // il permettent de trouver l'album de la comtesse
		},
		{n: 420, texte: "La comtesse", music: "dolmen",
		 start: 0,
		 end: 0,
		 // component: P415
		 // idée: une horreur a modifie le poèms 
		},
		{n: 999, texte: "Epilogue", music: "dolmen",
		 start: 0,
		 end: 0,
		 component: null
		},
		/*
		{n: 400, texte: "Métropolis", music: "le-jeu",
		 start: (isProd)? geUtcMsFrom(2025, 3, 21, 19, 0, 0) : geUtcMsFrom(2025, 3, 18, 19, 0, 0),
		 end:  geUtcMsFrom(2025, 3, 25, 8, 0, 0),
		 beta: true,
		 component: P400
		},
		*/
		/*
		{n: 490, texte: "Kiki's Event X, épilogue", music: "BlindingLights",
		 start: 0,
		 end: 0,
		 // beta: true,
		 // component: Psample
		},
		*/
	])
	

	/////////////////////////////////////////////////////////////////////
	// Gestion du websocket, reception des ordres, ordres admin
	/////////////////////////////////////////////////////////////////////
	let wsCallComponents = new Set()
	let wsStatus = $state(0)
	// changement etat du WS v: 0 disconnect, 1 connected, 2 erreur
	function wsCbStatus(v) {
		switch(v) {
			case 0:	wsStatus = v;	break;
			case 1:	wsStatus = v;	initAfterKeyValidation();	break;
			case 2:	wsStatus = v;	break;
			default:	addNotification("Erreur wsCbStatus="+v+", contacter Kikiadoc","red",60)
		}
	}

	function wsCbMessage(m) {
		// console.log("wsCbMessage",m)
		let done=false;
		switch(m.op) {
			case "pseudoList":	pseudoList = m.pseudoList; done = true;	break;
			case "notif": chatNotif(m);	done=true; break;
			case "tts": tts(m);	done=true; break // TTS a mettre en file
			case "ttsNow": tts(m,true);	done=true; break; // TTS a faire immediatement
			case "wsMedia": wsMedia(m.o);	done=true; break; // Ordre multimedia depuis le ws
			case "admGotoPage": admGotoPage(m);	done=true; break; // admin switch page
		};
		// appel des composants enregistrés si besoin
		if (!done) wsCallComponents.forEach( (cb) => { if ( cb(m) ) done=true; });
		if (!done) console.log("WS op non géré: ", m);
	}

	// force la page d'un user
	function admGotoPage(wsm) {
		if (wsm.o.pseudo != pseudo) return displayInfo({body: "admGotoPage bad pseudo, contacte Kikiadoc"})
		dspObject = wsm
		page = wsm.o.page		
	}

	/////////////////////////////////////////////////////////////////////
	// Popup mutijoueurs et gestion du chat 
	/////////////////////////////////////////////////////////////////////
	let chatMsgList=$state([]) // liste des messages recus
	let chatFlag=$state(false) // indique le blink du flag de chat
	let chatInput=$state({}) // .msg et .msgAdm
	
	// reception d'un message de notification (depuis le WS)
	function chatNotif(m) {
		// console.log("chatNotif",m)
		if (m.admin) { 
			dspAdminMsg = { titre:"MESSAGE IMPORTANT", body: [m.texte], ding:"call-to-attention" }
		}
		else if (m.toPseudo == pseudo) {
			displayInfo({
				titre: "Message personnel de "+((m.fromPseudo)? m.fromPseudo : "la Grande Peluche"),
				body: m.toTexte, ding: "ding-ding"
			})
		}	
		else if (m.fromPseudo) {
			chatFlag=true;
			addNotification(m.fromPseudo+": "+m.texte, "orange", m.duree, m.mp3 || "Ding");
		}
		else
			addNotification(m.texte, m.couleur, m.duree, m.mp3)
		chatMsgList.push(m);
		if (chatMsgList.length > 100) chatMsgList.slice(50)
	}
	
	// envoi d'un message
	function chatSend() {
		if (chatInput.msg) apiCall("/chat","POST", {texte: chatInput.msg, admin: chatInput.msgAdm} );
		chatInput.msg=null;
	}

	/////////////////////////////////////////////////////////////////////
	// Gestion des clics avec attribute gphelp, gp*, popup info, divers popupinfo, bandeau clignotant etc...
	/////////////////////////////////////////////////////////////////////
	function bubbleClick(e) {
		//  console.log(e)
		if (e.target.nodeName=="LABEL") return console.log ("click label ignoré, car bubble")
		// complete si besoin
		e.gpHelp ??= e.target.getAttribute("gpHelp")
		e.gpImg ??= e.target.getAttribute("gpImg")
		e.gpImgClass ??= e.target.getAttribute("gpImgClass")
		e.gpVideo ??= e.target.getAttribute("gpVideo")
		e.gpNotif ??= e.target.getAttribute("gpNotif")
		e.gpLink ??= e.target.getAttribute("gpLink")
		// fait les actions demandées pour le click
		if (e.gpHelp) dspInfo={titre: "Explication", body: [e.gpHelp], trailer:"Ferme ce popup", img: "ff-7/ff-7-help.gif", back:"papier" }
		if (e.gpImg) dspInfo={ titre:"", body:[], img: e.gpImg, imgClass: e.gpImgClass, back:"papier" }
		if (e.gpVideo) playVideo(e.gpVideo)
		if (e.gpLink) window.open(e.gpLink,"_blank")
		if (e.gpNotif) {
			// complements pour notif
			e.gpColor ??= e.target.getAttribute("gpColor")
			e.gpTimeout ??= e.target.getAttribute("gpTimeout")
			e.gpDing ??= e.target.getAttribute("gpDing")
			addNotification(e.gpNotif,e.gpColor,e.gpTimeout,e.gpDing)	
		}
	}
	function addStackTrace(body,eltWithStack) {
		if (eltWithStack?.stack) 
			body.push("StackTrace:", ... eltWithStack.stack?.split('\n'))
		else
			body.push("Pas de stackTrace")
	}
	function globalHdlError(e) {
		console.log(">>>>>>>> Erreur DEB e:", e)
		let bld = {
			titre:"FAIT UN SCREEN + MP KIKIADOC", trailer:"Fait un screen et contacte Kikiadoc",
			back:"rouge",
			body: ["Type: onerror","Message: "+e.message]
		}
		bld.body.push("Erreur:"+e.toString())
		// Ajoute la reason 
		if (e.reason) {
			bld.body.push("Raison.msg: "+e.reason.message)
			bld.body.push("Raison.name: "+e.reason.name)
			bld.body.push("Raison.code: "+e.reason.code)
		}
		// Ajoute le staktrace
		addStackTrace(bld.body,e.error)
		displayError(bld)
		console.log(">>>>>>>> Erreur FIN e:", e)
	}
	function globalHdlRejection(e) {
		console.log(">>>>>>>> Rejection DEB e:",e,e?.reason)
		let bld = {
			titre:"FAIT UN SCREEN + MP KIKIADOC", trailer:"Fait un screen et contacte Kikiadoc",
			back:"rouge",
			body: ["Type: onunhandledrejection", "Raw: "+e?.reason, "Message: "+e?.reason.message]
		}
		addStackTrace(bld.body,e.error)
		displayError(bld)
		console.log(">>>>>>>> Rejection FIN e:",e,e?.reason)
	}

	/* debug
	function testError() {
		console.log('>> testError')
		playVideo("pipo")
		let e= new Error('pipo')
		e.name="kikiTest"
		// throw e
	}
	setTimeout(()=>{
		testError()
	},5000)
	*/
</script>

<svelte:document 
	onvisibilitychange={visibilityChange}
	ondspObject={(e) => dspObject=e.detail}
	ondspInfo={(e) => dspInfo=e.detail}
	ondspError={(e) => dspError=e.detail}
	onclick={(e)=>bubbleClick(e)}
	onsecuritypolicyviolation={(e)=>securitypolicyviolation(e)}
/>
<svelte:window
	onerror={globalHdlError}
	onunhandledrejection={globalHdlRejection}
/>

<style>
	.body {
		position: fixed; color: white; background-color: transparent;
		font-family: "Times New Roman", Times, serif;	font-size: 1.5em; 
		top:0; left:0; right:0; bottom:0; margin:0;
		width:100%;	height:100%;
		text-shadow: 0px 0.10em 0.1em black, 0px -0.1em 0.1em black, 0px 0.20em 0.2em black, 0px -0.2em 0.2em black;
	}
	.contenu { position: fixed; top: 3em; left: 0; bottom: 0.1em; 
							overflow: scroll; scrollbar-width: thin;
							width: 100%; padding: 0 0 0 0; /* top | right | bottom | left */
					 }
	::-webkit-scrollbar { width: 9px;}
	::-webkit-scrollbar-track { background: transparent;}
	::-webkit-scrollbar-thumb { background: rgba(155, 155, 155, 0.5);  border-radius: 20px;  border: transparent; }							
	
	/* PC */
	@media (pointer: fine) and (max-width: 900px)  {
		.body { font-size: 1.5em }
		.contenu { width: 100%; padding: 0 0 0 0; }
	}
	@media (pointer: fine) and (min-width: 900px) and (max-width: 1399px)  {
		.body { font-size: 1.6em;  }
		.contenu { width: 90%; padding: 0 5% 0 5% }
	}
	@media (pointer: fine) and (min-width: 1400px) {
		.body { font-size: 1.7em;  }
		.contenu { width: 80%; padding: 0 10% 0 10% }
	}
	/* smartphone portait */
	@media (pointer: coarse) and (orientation: portrait) {
		.body { font-size: 5.8vw; } /* 4.8 */
  }
	/* smartphone landscape */
	@media (pointer: coarse) and (orientation: landscape) {
		.body { font-size: 5.8vh; } /* 4.8 */
  }
	notifications {	top: 0px; right: 0px; position: fixed; z-index: 20000; width: 50%; }
	
	titre {
		background: radial-gradient( ellipse farthest-corner at 0% 10%,  red , grey, grey	);
		vertical-align: top; position: fixed;	left: 0; top: 0; width: 100%; height: 3em;
		cursor: pointer; font-size: 1em;
		z-index:5000;
	}
	blinkGlobal {
		display:none; position: fixed; left: 0; top: 0; width: 100%; height: 3em; z-index:9999;
		animation-duration: 0.2s;
		animation-name: blinkGlobalFrames;
		animation-iteration-count: 15;
		animation-play-state: paused;
	}
	@keyframes blinkGlobalFrames {
		from { background-color: red; opacity: 100%}
		50% { background-color: red; opacity: 0%}
		to { background-color: red; opacity: 100%}
	}

	audio { visibility: hidden }
	
	back {
		background-image: url("https://cdn.adhoc.click/V10/Oracle.png");
		width: 100%; height: 100%; background-position: center; background-size: cover;
		position: fixed; left: 0; top: 1.8em;	z-index: -1;
		margin: 0; padding: 0; border:0; 
	}

	label { cursor: pointer; }

	/* classes pour la listes des possibles */
	.pseudo { top: 0px; right: 0%; height: 2em; background-size:cover;	position: fixed; z-index: 1000; 	cursor: pointer; }
	.wsClass { top: 1.1em; right: 0px; height: 3%; position: fixed; z-index: 1000; 	cursor: pointer; }
	.wsClass0 { color: red }
	.wsClass1 { color: lightgreen }
	.wsClass2 { color: red }

	/* popup de multi - envoi de messages */
	.pseudosList { font-size: 0.8em; font-family: "Times New Roman" }
	.messagesList { border: 5px solid black; font-size: 0.8em; font-family: "Times New Roman"; height: 7em }
	.mScrollbar { scrollbar-color: white green; scrollbar-width: thin; overflow-y: auto }
	
	.divVideo { display: none; z-index: 6000; position: fixed; top:0; left: 0;
						height: 80%; max-height: 80%; width: 80%; max-width: 80%; transform: translate(10%,10%); }
	.video { border: 0.2em solid white; height: 100%; max-height: 100%; width: 100%; max-width: 100%;  }


	/* Styles partagé */
	:global(input) {	font-family: "Times New Roman";	font-size: 0.8em; cursor: pointer	}
	:global(select) {	font-family: "Times New Roman";	font-size: 0.8em; cursor: pointer	}
	:global(.blinkFlag) {
		color: white; outline: 2px solid white; border-radius: 25%; cursor: pointer;
		animation-duration: 2s;
		animation-name: blinkFlagFrames;
		animation-iteration-count: infinite;
	}
	@keyframes blinkFlagFrames { from { outline-color: black; }	to { outline-color: white; }	}

	div :global(.adminCadre) { border: 2px solid red; background-color: black; margin: 2px }
	div :global(.papier) {
		background-color: grey; background-position: center;
		background-image: url("https://cdn.adhoc.click/V10/texture-papier-noir.jpg");
	}
	div :global(.rouge) {
		background-color: grey; background-position: center;
		background-image: url("https://cdn.adhoc.click/V10/backRouge.gif");
	}
	div :global(.stars)  {
		background-color: grey; background-position: center;
		background-image: url("https://cdn.adhoc.click/V10/stars.gif");
	}
	div :global(.popupCadre) {
		position: fixed; top: 10%; left: 20%;
		border: 2px outset red; border-radius: 10%; border-width: 5%;
    transform: translate(-5%, 0%);
		overflow: visible; z-index: 7000;
	}
	div :global(.popupZone) { padding: 1.5em 0.5em 1.0em 1.0em;	}
	div :global(.popupContent) {
		max-height: 59vh; min-height: 4em; min-width: 10em;
		scrollbar-color: white grey; scrollbar-width: thin; overflow-y: auto;
		/* white-space: normal; word-break: break-all; */	}
	div :global(.close) {
		display: block; overflow: visible; text-shadow: none; cursor: pointer;
		position: absolute; right: -0.3em; top: -0.5em;
		font-size: 2em; color: #64748B; background: #E2E8F0;
		border-radius: 6px; border: 2px outset yellow;
		z-index: 5001;
	}
	div :global(.reveal) {
		border: 0.1em solid white; padding: 0.2em; margin-top: 0.5em; color: white;
		background-position: center; background-repeat: no-repeat; 
		background-size: cover; background-color: black;
		background-image: url('https://cdn.adhoc.click/V10/texture-papier-noir.jpg');
		animation-duration: 10s; animation-name: revealFrames; animation-iteration-count: 1;
	}
	@keyframes revealFrames {
	  from { color: black; }
		50% {color: #C0C0C0 }
	  to { color: white; }
	}
	:global(a) {color:lightgreen; text-decoration: unset; cursor: pointer}
	:global(a::after) {content: "🔎"; font-size:0.8em; vertical-align: top; color: lightgreen}
	div :global(.br) { min-height: 0.4em; }
	:global(.extLink) {color: lightgreen; text-decoration: unset; cursor: pointer}
	:global(.extLink::after) {content: "🔎"; font-size:0.8em; vertical-align: top; color: lightgreen}
	:global(.videoLink) {color: lightgreen; text-decoration: unset; cursor: pointer}
	:global(.videoLink::after) {content: "📽"; font-size:0.8em; vertical-align: top; color: lightgreen}
	:global(.imgLink) {color: lightgreen; text-decoration: unset; cursor: pointer}
	:global(.imgLink::after) {content: "📷"; font-size:0.7em; vertical-align: top; color: lightgreen}
	:global(.infoLink) {color: lightgreen; text-decoration: unset; cursor: pointer}
	:global(.infoLink::after) {content: "(ℹ)"; font-size:0.8em; vertical-align: top; color: lightgreen}
	:global(.simpleLink) {color: lightgreen; text-decoration: unset; cursor: pointer}
	:global(.parchemin) {
		margin: auto; border: 0.5em 1em; padding: 1em 1em; max-width: 80%;
	  border-image-source: url("https://cdn.adhoc.click/V10/ff-7/parchemin.png");
		border-image-repeat: stretch;	border-image-slice: 2% 2% fill; text-align: center;
	}
	:global(.info) { font-style: italic; font-size: 0.8em }
	:global(.gpHelp) { color: lightgreen; cursor: pointer }
	:global(.selOui) { border: 4px inset red; cursor: pointer }
	:global(.selNon) { border: 4px outset #404040; cursor: pointer }
	:global(.selBad) { border: 4px solid #303030; color: #404040 }
	:global(sup) { color:lightblue }
	:global(.blinkMsg) {
		text-decoration: underline double black;
		animation-duration: 2s; animation-name: msgFrames; animation-iteration-count: infinite;
	}
	@keyframes -global-msgFrames {
		from { text-decoration-color: black; }
		to { text-decoration-color: white; }
	}

</style> 

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_media_has_caption -->

<div class="body" id="topPage" role="none" >
	<back>&nbsp;</back>
	<notifications id="notifications"></notifications>
	<titre>
		<div onclick={() => { page=0 }} role="button">
			<div style="font-size: 1.0em">La Grande Peluche</div>
			<div style="font-size: 0.6em">Enjoy ({CLIENTVERSION || 'DEV'})</div>
		</div>
		<div class="pseudo">
			{#if wsStatus==1}
				<span style="color: lightgreen" onclick={()=>dspPseudo=!dspPseudo} role="button">
					{pseudo}
				</span>
			{:else}
				<span style="color: red;" onclick={()=>dspPseudo=!dspPseudo}  role="button">
					{pseudo || "pseudo"} non validé
				</span>
			{/if}
			<span onclick={()=>GBLSTATE.audioAmbiance= !GBLSTATE.audioAmbiance} role="button">
				{#if GBLSTATE.audioAmbiance}🔊{:else}🔇{/if}
			</span>
		</div>
		<div class="wsClass wsClass{wsStatus}" id="syncStatus" onclick={() => {dspMultiPopup = true}} role="button" >
			{#if chatFlag}<span class="blinkFlag">💬</span>{/if}
			multijoueurs
		</div>
	</titre>
	<blinkGlobal id="blinkGlobal" />

	<audio id="ding" onerror={(e)=>mediaError(e)}  />
	<audio id="musique" onerror={(e)=>mediaError(e)} />
	<audio id="tts" onended={()=>tryTTS(true)} onerror={(e)=>mediaError(e)}></audio>
	<div id="divVideo" class="divVideo">
		<div class="close" onclick={closeVideo} role="button" tabindex=0>X</div>
		<video id="video" class="video stars" width="1920" height="1080" controls />
	</div>

	<div id="contenu" class="contenu">
		{#if pseudo?.startsWith("Kikiadoc")}
			<Padmin wsCallComponents={wsCallComponents} />
		{/if}
		
		{#if pseudo}
			{#if page==0}
				<Phome pseudo={pseudo} pageList={pageList} bind:page={page} />
			{:else if PageComponent !== null}
				<div>
					<PageComponent
						wsCallComponents={wsCallComponents}
						pageDesc={pageDesc}
						pseudo={pseudo}
						pseudoGenre={pseudoGenre}
						pseudoList={pseudoList}
						bind:page={page}
						bind:pageDone={pageDone} 
					/>
				</div>
			{:else}
				<div>Le contenu de la page {page} n'est pas disponible dans cette configuration</div>
			{/if}
		{:else}
			<Pauth bind:pseudo={pseudo}/>
		{/if}
	</div>

	{#if dspMultiPopup}
		<div class="popupCadre papier">
			<div class="close" onclick={() => { dspMultiPopup = false; chatFlag=false}} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div class="pseudosList">
						{pseudoList.length} connecté{#if pseudoList.length > 1}s{/if} :
						{#each pseudoList as name, i}
							{name} &nbsp;
						{/each}
					</div>
					<div class="messagesList mScrollbar" use:scrollNodeToBottom>
						{#each chatMsgList as o,i}
							<div>{hhmmss(o.dth)} ({(o.fromPseudo)? o.fromPseudo : "Grande Peluche"}) {o.texte}</div>
						{/each}
					</div>
					<div>
						<input bind:value={chatInput.msg} type="text" maxlength="140"
							onkeypress={(e) => e.key=="Enter" && chatSend()} />
						<input type="button" value="►" onclick={()=>chatSend()} />
						{#if pseudo=="Kikiadoc"}
							<label>Admin:<input type="checkbox" bind:checked={chatInput.msgAdm} /></label>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspPseudo}
		{@const desc = loadIt("pseudoDesc",{})}
		{@const es= loadIt("elipticSecurity",{})}
		{@const dynMetro= getDynMetro()}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspPseudo=!dspPseudo} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Ton pseudo est {pseudo} ({desc.prenom} {desc.nom} @{desc.monde})
					</div>
					<div>
						Ton
						<span class="infoLink" gpHelp="C'est une information sensible, elle ne quittera pas ton appareil. Elle restera inconnue du serveur. Elle sera utilisée pour adapter nos intéractions lors des post-traitements sur ton appareil uniquement">
							genre
						</span>
						est
						<span role="none" onclick={markClick} gpColor="yellow" gpDing="Ding" gpTimeout="15" 
							gpNotif="Cette information sensible restera sur ton appareil"						>
							<Radio bind:value={pseudoGenre} nom="pseudoGenre" options={GBLCONST.GENRES} />
						</span>
					</div>
					<hr/>
					{#if es.jwkPrivateKey}
						<div>
							Tu as une 
							<a href="https://fr.wikipedia.org/wiki/Cryptographie_sur_les_courbes_elliptiques" target="_blank">
								clé cryptographique elliptique
							</a>
							valide sur cet appareil.
							<u>Tes échanges sont cryptés, signés et vérifiés</u>.
						</div>
						<div>
							Tu utiliseras une 
							<a href="https://fr.wikipedia.org/wiki/Cryptographie_post-quantique" target="_blank">
								signature post-quantique
							</a>
							dès que possible
						</div>
					{:else}
						<div style="color:red">
							Tu as n'as pas de clé cryptographique elliptique valide sur cet appareil.
						</div>
					{/if}
					{#if wsStatus!=1}
						<div style="color:red">
							Il semble que ton appareil n'a pas été validé par mon Grimoire
							de Sécurité, alors il te faut contacter Kikiadoc sur Discord pour analyser ta situation
						</div>
					{/if}
					<hr/>
					{#if ! GBLSTATE.audioAmbiance}
						<div style="color:red">
							Pour vérifier ou modifer les volumes sonores, active la musique d'ambiance
							en cliquant sur 🔊 en haut à droite de ton écran.
						</div>
					{/if}
					<div>
						Mon volume audio général est actuellement de {GBLSTATE.audioVolume}% avant mixage par ton appareil.
						{#if GBLSTATE.audioVolume < 10 || GBLSTATE.audioVolume > 80}
							<span style="color:red">(conseillé entre 10% et 80%)</span>
						{:else}
							<span style="color:lightgreen">(conseillé entre 10% et 80%)</span>
						{/if}
					</div>
					<div><input style="width:80%" bind:value={GBLSTATE.audioVolume} id="newVolumeAudio" type="range" min=0 max=100 /></div>
					<div class="br">
						Le volume audio de ma
						<a href="https://fr.wikipedia.org/wiki/Synth%C3%A8se_vocale" target="_blank">
							voix
						</a>
						est actuellement de {GBLSTATE.audioTTS}% avant mixage par ton appareil.
						{#if GBLSTATE.audioTTS < 80}
							<span style="color:red">(conseillé entre 80 et 100%)</span>
						{:else}
							<span style="color:lightgreen">(conseillé entre 80 et 100%)</span>
						{/if}
						<input type="button" value="Je veux tester ta voix" onclick={(e)=>tts({o:{statique:true, file:"mavoix.mp3"}})} />
					</div>
					<div><input style="width:80%" bind:value={GBLSTATE.audioTTS} id="newVolumeTTS" type="range" min=0 max=100 /></div>
					<div>
						<label>
							<input bind:checked={GBLSTATE.audioBack} type="checkbox" />
							le son continue même si la fenêtre est minimisée ou cachée
						</label>
						{#if !GBLSTATE.audioBack}
							<div class="info">
								AudioBlaster coupe le son si la fenêtre de ton navigateur est masquée.
								Cela ne fonctionne pas automatiquement si tu utilises le site sur smartphone
								ou avec plusieurs écrans.
								Pour couper l'ambiance, sur windows, minimise la fenêtre de ton navigateur, 
								et sur smartphone, repasse sur l'écran d'accueil.
							</div>
						{:else}	
							<div class="info">L'ambance sonore continuera même si ta fenêtre de navigateur est masquée</div>
						{/if}
					</div>
					<hr />
					<div class="info">
						<u>Les informations ci-dessous sont à utiliser selon les conseils de Kikiadoc</u>
					</div>
					<div class="adminCadre">
						{#if dynMetro?.srv} 
							{@const latence=Math.floor(1000*(( (dynMetro.cliRes - dynMetro.cliReq) - (dynMetro.srv.load + dynMetro.srv.run + 1.0) ) / 2.0))/1000}
							<div style="font-size: 0.8em">
								<div>Synchro temps réel:
									<input type="button" onclick={()=> dspObject=dynMetro} value="🛈" />
								</div>
								<div style="color:{ (getEpsilon() > 500)? "red": (getEpsilon() > 100)? "yellow" : "lightgreen"}">
									Correction temporelle (ε): {getEpsilon()}ms
								</div>
								<div style="color:{ (latence > 500)? "red": (latence > 100)? "yellow" : "lightgreen"}">
									Latence réseau instantanée: {latence}ms
								</div>
								<div>Correction horloge (ε dynamique): {Math.floor(1000*dynMetro.epsilon)/1000}ms</div>
								<div>Correction horloge (ε lissé): n/a</div>
								<div>Horloge Serveur: {hhmmssms(dynMetro.srv.dth)}</div>
								<div>Horloge Locale: {hhmmssms(dynMetro.cliDth)}</div>
								<div>DeltaClient: {Math.floor(1000*(dynMetro.cliRes - dynMetro.cliReq))/1000} ms</div>
								<div>DeltaServer: {Math.floor(1000*(dynMetro.srv.load + dynMetro.srv.run + 1.0))/1000} ms</div>
							</div>
						{:else}
							<div style="font-size: 0.8em; color:yellow">
								Je n'ai pas encoré vérifié la synchronisation temporelle entre ton équipement et le serveur.
								Ce sera le cas lorsque je ferai une requête serveur permettant de la déterminer.
							</div>
						{/if}
						<hr />
						<div style="font-size: 0.8em">
							<div role="button" style="cursor: pointer" onclick={markClick} gpHelp="Ceci est la taille mémoire utilisable, limitée à 8Go">
								Mémoire globale utilisable sur ton équipement: {navigator.deviceMemory} Go<sup>(i)</sup> (RAM ou SWAP)
							</div>
							{#if navigator.storage?.estimate}
								{#await navigator.storage.estimate()}
									<div>Analyse en cours...</div>
								{:then e}
									<div role="button" style="cursor: pointer" onclick={markClick} gpHelp="Cette information est approximative, c'est un stockage utilisé par MétaCache">
										Usage/Quota:
										{(e.usage/(1024*1024*1024)).toFixed(2)}/{(e.quota/(1024*1024*1024)).toFixed(2)}Go
										<sup>(i)</sup> (disque ou SSD sur PC/MAC, SD/smartphone)
									</div>
								{:catch error}
									<div style="color: red">{error.message}</div>
								{/await}
							{:else}
								<div style="color:yellow">
									Ton navigateur ne permet pas l'analyse du stockage associé au site par storage.estimate
								</div>
							{/if}
							{#if performance?.measureUserAgentSpecificMemory}
								{#await performance.measureUserAgentSpecificMemory()}
									<div>Analyse en cours...</div>
								{:then e}
									<div role="button" onclick={()=>dspObject=e} style="cursor: pointer">
										Usage:
										{(e.bytes/(1024*1024)).toFixed(2)}Mo
										<sup>(i)</sup>
									</div>
								{:catch error}
									<div style="color: red">{error.message}</div>
								{/await}
							{:else}
								<div style="color:yellow">
									Ton navigateur ne dispose pas de l'introspection mémoire par
									<a href="https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory"
										target="_blank">
										measureUserAgentSpecificMemory
									</a>
									C'est une fonction récente qui n'est pas supportée par tous les navigateurs.
								</div>
							{/if}
						</div>
						<hr />
						{#if window.crossOriginIsolated}
							<div style="font-size: 0.8em">
								DeepCheckSec est <span style="color:lightGreen">active</span>. 
								Cette page est isolée via 
								<a target="_blank" href="https://developer.mozilla.org/fr/docs/Web/HTTP/CSP">
									CSP
								</a>,
								<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy">
									COOP
								</a>
								et
								<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy">
									COEP
								</a>
							</div>
						{:else}
							<div style="font-size: 0.8em; color:red">
								DeepCheckSec n'est pas active, contacte Kikiadoc
							</div>
						{/if}
						<div style="font-size: 0.8em; color:red">
							<div class="infoLink" role="button" onclick={markClick}
								gpHelp="En cliquant sur un bouton 'Provoquer...',
												je vais provoquer une vraie tentative de hack du site.
												Cela doit déclencher DeepCheckSec.
												Si il fonctionne correctement, tu verras un message d'alerte.
												Evidemment, ces attaques sont réelles, mais sans risque.">
								Tester le fonctionnement de DeepCheckSec
							</div>
							<input type="button" value="Provoquer script externe"
								onclick={(e)=>generateSecurityAlert(1)} />
							<input type="button" value="Provoquer script inline"
								onclick={(e)=>generateSecurityAlert(2)} />
							<input type="button" value="Provoquer media"
								onclick={(e)=>generateSecurityAlert(3)} />
						</div>
						<hr />
						<div style="font-size: 0.8em">
							{#if GBLSTATE.swcReady}
								<div>
									Métacache est <span style="color:lightGreen">active</span>,
									les accès réseau de cette page sont optimisés.
									<br/>
									<input type="button" value="Liste" onclick={metaCacheList}/>
									<input type="button" value="Vider" onclick={metaCacheClear}/>
									<input type="button" value="En attente" onclick={() => dspObject= swcGetWaitingIds()}/>
								</div>
							{:else}
								<div style="color:red">
									Métacache n'est pas active. C'est normal si tu es en navigation privée.
									Recharge la page par F5 et si cela ne suffit pas, 
									ferme TOUS les onglets sur le site, puis FERME TON NAVIGATEUR et
									reviens visiter le site.
									<br/>
									Contacte Kikiadoc en cas de souci.
								</div>
							{/if}
								
						</div>
						<hr />
						<div style="font-size: 0.8em">
							<div>
								Moteur HTML: <a href="https://svelte.dev/" target="_blank">Svelte</a>
								{SVELTEVERSION || "Playground"}
							</div>
							<div>
								Moteur 3D: <a href="https://www.babylonjs.com/" target="_blank">BabylonJS</a>
								{#if typeof BABYLON == 'object'}
									{BABYLON.Engine.Version}
								{:else}
									non chargé
								{/if}
							</div>
						</div>
						<!--
						<hr />
						<div style="font-size: 0.8em">
							Métrologie technique:
							<br/>
							<input onclick={metrologieSend} type="button" value="Envoyer mes données" />
							<input onclick={metrologieDisplay} type="button" value="Voir mes données" />
							<input onclick={metrologieClear} type="button" value="Effacer mes données" />
						</div>
						-->
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspInfo}
		<Info bind:dspInfo={dspInfo} />
	{/if}

	{#if dspObject}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspObject=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent" style="font-size:0.8em">
					<div class="blinkMsg" style="color:red">
						Diagnostic technique, ne pas utiliser sans Kikiadoc
					</div>
					<div>
						loc: {mmssms(Date.now())} srv: {mmssms(Date.now()-getEpsilon())} loc=srv+ε({getEpsilon()}ms)
					</div>
					<div class="adminCadre">
						<input bind:value={dspObject.dth2local} type="number" placeholder="dth" /> =
						{mmssms(dspObject.dth2local)}
						(<countdown dth={dspObject.dth2local || 0} txtTimeout="dépassé" />)
					</div>
					<div><pre style="white-space: pre-wrap; word-break: break-all;">{JSON.stringify(dspObject,null,2)}</pre></div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspError}
		<Info bind:dspInfo={dspError}>
			{#snippet template(t)}
				<div style="word-break: break-all">{t}</div>
			{/snippet}
		</Info>
	{/if}
	
	{#if dspAdminMsg}
		<Info bind:dspInfo={dspAdminMsg}>
			{#snippet template(t)}
				<div class="blinkMsg" style="color:red; font-size:1.5em">{t}</div>
			{/snippet}
		</Info>
	{/if}

</div>



<!-- page +page.svelte -->
