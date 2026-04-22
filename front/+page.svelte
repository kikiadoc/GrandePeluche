<script>
	const SVELTEVERSION=null // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
	const CLIENTVERSION=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
	const VITEVERSION=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
	const GLOBALSTARTDTH=Date.now() // dth de démarrage des traitements 
	console.log('******** CLIENT START dthid:',GLOBALSTARTDTH)
	// divers caractères pour copier/coller : ⚙️🔊🔇⁜➤▲⏸◀▶▼⏬🔎📽❓✅🆘⚠️⬇️✅➥📷εΔ⛭⎵
	// 👉😈ⓘ(ℹ)႞⒤⇛⏳ 😴😭🚫💰🪄😴⚖️🎈🕬 🗺 🔮📢💎
	// ne fonctionne pas sur android 🛈 utiliser (ℹ)

	//////////////////////////////////////////
	// Imports
	//////////////////////////////////////////
	import { onMount, onDestroy } from 'svelte'
	import {
		loadIt, storeIt, isProd, swcSetup, urlCdn, urlRaw,urlCdnAI,
		addNotification, displayInfo, displayError,
		startCountDown, stopCountDown, scrollNodeToBottom, 
		connectToServer, disconnectFromServer, apiCall,	getDynMetro, getEpsilon,
		hhmmss, hhmmssms, geUtcMsFrom,
		orientationChange, visibilityChange, startBlinkGlobal, markClick, firstClick,
		playMusic, playDing, playVideo, closeVideo, audioInit, audioSetup, wsMedia,
		tts, tryTTS,
		securitypolicyviolation, generateSecurityAlert,
		metaCacheList, metaCacheClear, swcGetWaitingIds,
		isAdmin, isSM, isEquipementPC, isPWA, isAndroid
	} from "./common.js";
	
	import { G, patchConsole, unpatchConsole, getConsole, 
					 reportConsole, addReport,addReportError
				 } from "./privacy.js"
	import { GBLCONST, GBLSTATE } from "./ground.svelte.js"

	// metrologie
	addReport("global","clientStartDth",GLOBALSTARTDTH)
	addReport("global","clientVersion",CLIENTVERSION)
	addReport("global","svelteVersion",SVELTEVERSION)
	addReport("global","isEquipementPC",isEquipementPC())
	addReport("global","isPWA",isPWA())
	addReport("global","isAndroid",isAndroid())

	import Info from './Info.svelte'
	import Radio from './Radio.svelte'
	import Phome from './Phome.svelte'
	import Pauth from './Pauth.svelte'
	import Padmin from './Padmin.svelte'
	import Pipa from './Pipa.svelte'
	import Common from './Common.svelte'
	import Pcodex from './Pcodex.svelte'
	import Kikitest from './Kikitest.svelte'
	
	// import P400 from './P400.svelte' // metropolis
	// import P401 from './P401.svelte' // Kiki's Event X - le bug bounty
	import P402 from './P402.svelte' // Kiki's Event X - Ventes privées
	import P403 from './P403.svelte' // Kiki's Event X - Prélude 
	import P404 from './P404.svelte' // Kiki's Event X - Chercher le lala 
	import P405 from './P405.svelte' // Kiki's Event X - initiatique
	import P408 from './P408.svelte' // Kiki's Event X - tranquilite
	import P410 from './P410.svelte' // Kiki's Event X - Pharao
	import P420 from './P420.svelte' // Kiki's Event X - Les bases
	import P425 from './P425.svelte' // Kiki's Event X - bar a thym
	import P430 from './P430.svelte' // Kiki's Event X - TBD
	import P440 from './P440.svelte' // Kiki's Event X - Les orth-composants
	import P460 from './P460.svelte' // Kiki's Event X - Dissonances
	import P480 from './P480.svelte' // Kiki's Event X - Dessins

	//////////////////////////////////////////
	// Gestion de la sécurité
	//////////////////////////////////////////
	let pseudo = $state(loadIt('pseudo',""))
	$effect(() => storeIt('pseudo',pseudo))
	let webAuth = $state({etat: "initWebAuth"})
	$effect(() => {
		console.log("***** Effect webAuth",webAuth.etat)
		if (webAuth.etat=="reload") { initWebAuth();  }
	})
	//////////////////////////////////////////
	// Gestion du cycle de vie
	//////////////////////////////////////////
	onMount( async () => {
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
		// si la page n'est pas dans la desription, reset la page a 0
		if (page!=0 && !pageList.find( (e) => { return (e.n == page) } ) ) page=0
		await	initWebAuth()
		console.log('** Mount Fin ** id=',GLOBALSTARTDTH)
	});
	onDestroy(() => {
		console.log('** UnMount ** id=',GLOBALSTARTDTH)
		disconnectFromServer()  
		stopCountDown()
		document.removeEventListener("click", firstClick, { once: true })
		window.screen?.orientation?.removeEventListener("change", orientationChange)
		unpatchConsole()
		webAuth.etat="unmount"
		console.log('** UnMount Ok ** id=',GLOBALSTARTDTH)
	});

	async function initWebAuth() {
		// Recupère un contexte d'authentification pour cette session 
		if (!pseudo || pseudo==""){
			// cas particulier ou on a perdu le pseudo...
			console.log("initWebAuth, pas de pseudo, force reload")
			webAuth.etat="reload"
			return
		}
		// Uniquement avec le pseudo, le serveur fait le reste 
		let ret = await apiCall("/pseudos/webauthn","GET",null,true )
		if (ret.status == 200) {
			webAuth = ret.o
			if (webAuth.etat=="ok") { await init(); }
		}
		else
			displayInfo({titre:"Erreur d'init cybersécurité", back:"rouge",
									 body:["Impossible de recevoir le contexte de cybersécurité"],
									 trailer: "Contacte Kikiadoc IMMEDIATEMENT"
									})
	}

	// le webAuth est ok, in
	async function init() {
		// acces direct au pseudo
		pseudo = webAuth.pseudo
		// connection WS au server
		connectToServer(wsCbStatus, wsCbMessage,CLIENTVERSION,webAuth)
	}
	async function initAfterKeyValidation() {
		// Maj contexte client
		// OBSOLETE
		// let ret= await apiCall('/clientConfig/getContext')
		// if (ret.status==200) ...
	}

	///////////////////////////////////////////////////////////////////// 
	// Configuration générale
	//
	let localCtx = $state(loadIt('localCtx',{pseudoOpen:false}))
	$effect(() => storeIt('localCtx',localCtx))
	let page = $state(loadIt('page',0))
	$effect(() => storeIt('page',page))
	$effect(() => pageChange(page))
	let pageDone = $state(loadIt('pageDone',[]))
	$effect(() => storeIt('pageDone',pageDone))
	let PageComponent = $state(null); // Attention, contient un SVELTE COMPONENT si non null
	let pageDesc = $state(null)
	let pseudoList=$state([]) //chargement par WS
	let pseudoGenre = $state(loadIt('pseudoGenre',null))
	$effect(() => storeIt('pseudoGenre',pseudoGenre))

	// flags locaux
	let flags = $state({})
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
		{n: 9, texte: "Codex Master",
		 music: "S-privilege-music",
		 start: 0,
		 end: 0,
		 always: true,
		 privilege: 1,
		 rootName: "S-codex",
		 component: Pcodex,
		},
		{n: 10, texte: "Découvrir l'Institut Peluchique de l'Audiovisuel",
		 music: "derniere-seance",
		 start: 0,
		 end: 0,
		 always: true,
		 rootName: "ipa",
		 component: Pipa,
		 resetDth: geUtcMsFrom(2026,4,1,19,0,0)
		},
		/*
		{n: 400, texte: "Métropolis", music: "le-jeu",
		 start: geUtcMsFrom(2025,3,21,19,0,0),
		 end: geUtcMsFrom(2025,3,25,8,0,0),
		 after: true,
		 component: P400
		},
		{n: 401, texte: "Le Bug Bounty de l'IPA", music: "Alice",
		 start: geUtcMsFrom(2025,6,20,18,0,0),
		 end: geUtcMsFrom(2025,7,15,18,0,0),
		 component: P401,
		}, 
		*/
		{n: 402, texte: "Le Marché de Noël", music: "X-ventesPrivees/Marche-de-noel",
		 start: geUtcMsFrom(2025,12,13,20,15,0),
		 end: geUtcMsFrom(2026,1,19,20,0,0),
		 rootName: "X-ventesprivees",
		 component: P402,
		 after: true,
		 // beta: true 
		},
		{n: 403, texte: "Le Prélude de la Rapidité", music: "X-prelude-rapidite/elcondorpasa",
		 start: 0, // geUtcMsFrom(2026,4,20,17,0,0),
		 end: 0, // geUtcMsFrom(2026,4,24,20,0,0),
		 rootName: "X-prelude",
		 component: P403,
		 after: true,
		 inscription: 20,
		 // beta: true 
		},
		{n: 404, texte: "Cherchez le lala", music: "X-cherchezlelala/Cherchez-le-garcon",
		 start: 0,//geUtcMsFrom(2026,4,30,19,0,0),
		 end: 0, //geUtcMsFrom(2026,5,5,20,0,0),
		 rootName: "X-cherchezlelala",
		 component: P404,
		 after: true,
		 // beta: true 
		},
		{n: 405, texte: "L'Initiatique (Kiki's Event X)", music: "X-initiatique/secrets",
		 start: 0, // geUtcMsFrom(2027,0,1,20,0,0),
		 end: 0,
		 component: P405,
		 beta: true
		},
		{n: 408, texte: "Le Temps des Fleurs", music: "X-depasse-temps",
		 start: 0,  // geUtcMsFrom(2025,11,11,20,0,0),
		 end: 0,  // geUtcMsFrom(2025,11,17,20,0,0),
		 rootName: "X-tranquilite",
		 component: P408,
		 delaiDebut: 6,
		 prereq: 405,
		 // beta: true
		},
		/*
		{n: 408, texte: "Rendez-vous intertemporels", music: "pharao-secrets",
		 start: 0,
		 end: 0,
		 component: null,
		 // beta: true
		},
		*/
		{n: 410, texte: "Pharao", music: "plus-pres-des-etoiles",
		 start: 0,  // geUtcMsFrom(2025,11,12,20,0,0),
		 end: 0,  // geUtcMsFrom(2025,11,17,20,0,0),
		 rootName: "X-pharao",
		 delaiDebut: 4,
		 prereq: 405,
		 component: P410
		},
		{n: 420, texte: "Les Bases", music: "dolmen",
		 start: 0,  // geUtcMsFrom(2025,11,13,20,0,0),
		 end: 0,  // geUtcMsFrom(2025,11,17,20,0,0),
		 rootName: "X-lesbases",
		 delaiDebut: 5,
		 prereq: 405,
		 component: P420
		},
		{n: 425, texte: "Les Failles", music: "dolmen",
		 start: 0,  // geUtcMsFrom(2025,11,14,20,0,0),
		 end: 0,  // geUtcMsFrom(2025,11,17,20,0,0),
		 rootName: "X-barathym",
		 delaiDebut: 20,
		 prereq: 405,
		 component: P425
		},
		/*
		{n: 430, texte: "(TBD)", music: "dolmen",
		 start: 0,
		 end: 0,
		 rootName: "X-xxx",
		 delaiDebut: 20,
		 prereq: 405,
		 component: P430
		},
		*/
		{n: 440, texte: "Les Composants", music: "mercredi",
		 start: 0,  // geUtcMsFrom(2025,11,15,20,0,0),
		 end: 0,  // geUtcMsFrom(2025,11,17,20,0,0),
		 rootName: "X-orthocomposants",
		 delaiDebut: 20,
		 prereq: 405,
		 component: P440
		},
		{n: 460, texte: "Les Dissonances", music: "mercredi",
		 start: 0,  // geUtcMsFrom(2025,11,16,20,0,0),
		 end: 0,  // geUtcMsFrom(2025,11,17,20,0,0),
		 rootName: "X-dissonances",
		 delaiDebut: 20,
		 prereq: 405,
		 component: P460
		},
		{n: 480, texte: "Retour à L'Orthogonalité", music: "dolmen",
		 start: 0,  // geUtcMsFrom(2025,11,17,20,0,0),
		 end: 0,  // geUtcMsFrom(2025,11,18,20,0,0),
		 rootName: "X-dessins",
		 delaiDebut: 20,
		 prereq: 405,
		 component: P480
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
		 // component: Pxxx
		 // explication du projet pharao sur terre
		 // 
		 // idée: trouver les lieux propices pour des horloges 
		 // upgrade du chronogyre avec un pupitre de commande
		 // idée: construire el cadmos dans l'hypertemps
		 // idée: une horreur a modifie le poèms 
		 // idée: des fantomes popent a différents endroits
		 // idée: construire el cadmos dans l'hypertemps
		 // il permettent de trouver l'album de la comtesse
		 ///////////////////////////////////
			// challenge n collaboration tempreel
			// base sur les musique
			// tout le monde se co 
			// X musque à découvrir
			 // un "élu" doit repondre dans les X minutes, les autres doient aider
			 // les musiques sont partagées et diffusée (usage du # pour synchro??)
	 		 ///////////////////////////////////
			 // découvrir un monde grace a la descripiton du monde (monde ou descriptionou...) 
			 // lore: ce n'est pas un mog blanc
			 // --> devinette pour éliminer les mondes un a un
			 // --> annonce du chgt du server
			 // --> devniette sur la zone de logement
			 // --> secteurs
			 // -->
			 // dans le lore on pose un truc inbittable, mais si tu cliques sur le livre
			 // de correspondnce, tu as la "traduction"
			 // 
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
			addNotification(m.fromPseudo+": "+m.texte, m.couleur || "orange", m.duree || 15, m.mp3 || "Ding");
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
	// Gestion des clics avec attribute gphelp, gp*, popup info, divers popupinfo,
	// bandeau clignotant etc...
	/////////////////////////////////////////////////////////////////////
	function bubbleClick(e) {
		//  console.log(e)
		if (e.target.nodeName=="LABEL") return console.log ("click label ignoré, car bubble")
		// complete si besoin
		// console.log("bubbleClick",e.target) 
		e.gpHelp ??= e.target.getAttribute("gpHelp")
		e.gpImg ??= e.target.getAttribute("gpImg")
		e.gpImgClass ??= e.target.getAttribute("gpImgClass")
		e.gpVideo ??= e.target.getAttribute("gpVideo")
		e.gpNotif ??= e.target.getAttribute("gpNotif")
		e.gpLink ??= e.target.getAttribute("gpLink")
		// console.log("bubbleClick",e)
		// fait les actions demandées pour le click
		if (e.gpHelp || e.gpImg) dspInfo={
			titre: (!e.gpImg)? "Explication" : " ",
			body: e.gpHelp? [e.gpHelp] : [],
			trailer:"Ferme ce popup",
			img: e.gpImg || "commons/help-anim.gif",
			imgClass: e.gpImgClass,
			back:"papier"
		}
		if (e.gpVideo) playVideo(e.gpVideo)
		if (e.gpLink) window.open(e.gpLink,"gpHelp")
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
	function erreurGlobaleHandler(e) {
		console.warn(">>>>>>>> Erreur e:", e)
		let bld = {
			titre:"Erreur, fait un rapport à KIKIADOC", trailer:"Fait un rapport à Kikiadoc",
			back:"rouge",
			body: [
				"Pour faire un rapport:",
				"1-ferme ce popup d'erreur",
				"2-clique sur ton pseudo en haut à droite",
				"3-scroll jusque la rubrique Rapport technique de fonctionnement",
				"4-clique sur le bouton 'Envoyer le rapport'",
				null,
				"Type: erreurGlobaleHandler",
				"Message: "+e.message
			]
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
		addReportError(bld.body)
		// console.log(">>>>>>>> Erreur FIN e:", e) 
	}
	function togglePseudo() {
		dspPseudo=!dspPseudo
		localCtx.popupConfig = true
	}
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
	onerror={erreurGlobaleHandler}
	onunhandledrejection={erreurGlobaleHandler}
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
		background-image: url("https://cdn.adhoc.click/V10a/Oracle.png");
		width: 100%; height: 100%; background-position: center; background-size: cover;
		position: fixed; left: 0; top: 1.8em;	z-index: -1;
		margin: 0; padding: 0; border:0; 
	}

	label { cursor: pointer; }

	/* entete */
	.pseudo { top: 0px; right: 2em; height: 2em; background-size:cover;	position: fixed; z-index: 1000; cursor: pointer; }
	.wsClass { top: 1.1em; right: 2em; height: 3%; position: fixed; z-index: 1000; cursor: pointer; }
	.wsClass0 { color: yellow }
	.wsClass1 { color: lightgreen }
	.wsClass2 { color: red }
	.audioToggle { top: 0px; right: 0em; height: 2em; font-size:1.5em; position: fixed; z-index: 1000; cursor: pointer; }

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
	
	div :global(.greenPointer) { color: lightgreen; cursor: pointer}
	div :global(.orangePointer) { color: orange; cursor: pointer}
	div :global(.yellowPointer) { color: yellow; cursor: pointer}
	div :global(.redPointer) { color: red; cursor: pointer}
	div :global(.cGreen) { color: lightgreen}
	div :global(.cOrange) { color: orange}
	div :global(.cYellow) { color: yellow}
	div :global(.cRed) { color: red}
	
	div :global(.papier) {
		background-color: grey; background-position: center;
		background-image: url("https://cdn.adhoc.click/V10a/texture-papier-noir.jpg");
	}
	div :global(.rouge) {
		background-color: grey; background-position: center;
		background-image: url("https://cdn.adhoc.click/V10a/backRouge.gif");
	}
	div :global(.stars)  {
		background-color: grey; background-position: center;
		background-image: url("https://cdn.adhoc.click/V10a/stars.gif");
	}
	div :global(.alien)  {
		background-color: grey; background-position: center;
		background-size: cover;
		background-image: url("https://cdn.adhoc.click/V10a/commons/alien.gif");
		font-size:1.2em;
	}
	div :global(.popupCadre) {
		position: fixed; top: 10%; left: 10%;
		border: 2px outset red; border-radius: 10%; border-width: 5%;
    transform: translate(-5%, 0%);
		overflow: visible; z-index: 7000;
	}
	div :global(.popupZone) { padding: 1.5em 0.5em 1.0em 1.0em; 	}
	div :global(.popupContent) {
		max-height: 79vh; min-height: 4em; min-width: 10em;
		scrollbar-color: white grey; scrollbar-width: thin; overflow: auto;
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
		background-image: url('https://cdn.adhoc.click/V10a/texture-papier-noir.jpg');
		animation-duration: 10s; animation-name: revealFrames; animation-iteration-count: 1;
	}
	@keyframes revealFrames {
	  from { color: black; }
		50% {color: #C0C0C0 }
	  to { color: white; }
	}
	:global(a) {color:lightgreen; text-decoration: unset; cursor: pointer}
	:global(pre) {text-wrap: wrap; overflow-wrap: anywhere}
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
		margin: auto; border: 0.5em 1em; padding: 0.7em 0.7em; max-width: 95%;
	  border-image-source: url("https://cdn.adhoc.click/STATIC/parchemin.png");
		border-image-repeat: stretch;	border-image-slice: 2% 2% fill; text-align: center;
	}
	:global(.parchemin-vertical) {
		margin: auto; border-width: 0.5em 1em; padding: 3.3em 1.4em; max-width: 95%; 
	  border-image-source: url("https://cdn.adhoc.click/STATIC/parchemin-vertical.jpg");
		border-image-repeat: stretch;	border-image-slice: 2% 2% fill; text-align: center;
	}
	:global(.info) { font-style: italic; font-size: 0.8em }
	:global(.petit) { font-size: 0.8em }
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
	:global(.tdBlink) { 
		outline: 5px solid yellow;
		animation-duration: 2s; animation-name: tdBlinkFrames; animation-iteration-count: infinite;
	}
	@keyframes -global-tdBlinkFrames {
		from { outline-color: black; }
		to { outline-color: yellow; }
	}
	:global(.resTable) {
		font-size: 0.8em; text-align: center; border-collapse: collapse;  width:100%;
		scrollbar-width: thin; overflow: scroll;
		/* white-space: normal; word-break: break-all; overflow-wrap: break-word;  */
	}
	:global(.resTd) { border: 1px solid white }
</style> 

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_media_has_caption -->

<div class="body" id="topPage" role="none">
	<back>&nbsp;</back>
	<notifications id="notifications"></notifications>
	<titre>
		<div onclick={() => { page=0 }} role="button">
			<div style="font-size: 1.0em">La Grande Peluche</div>
			<div style="font-size: 0.6em">Enjoy ({CLIENTVERSION || 'DEV'})</div>
		</div>
		<div class="pseudo">
			{#if wsStatus==1}
				<span style="color: lightgreen" onclick={togglePseudo} role="button">
					{pseudo}
				</span>
			{:else}
				<span style="color: yellow;" onclick={togglePseudo} role="button">
					{pseudo || "pseudo"} non validé
				</span>
			{/if}
		</div>
		<div class="wsClass wsClass{wsStatus}" id="syncStatus" onclick={() => {dspMultiPopup = true}} role="button" >
			{#if chatFlag}<span class="blinkFlag">💬</span>{/if}
			multijoueurs
		</div>
		<div class="audioToggle" onclick={()=>GBLSTATE.audioAmbiance= !GBLSTATE.audioAmbiance} role="button">
			{#if GBLSTATE.audioAmbiance}🔊{:else}🔇{/if}
		</div>
	</titre>
	<blinkGlobal id="blinkGlobal"/>

	<audio id="ding"/>
	<audio id="musique"/>
	<audio id="tts" onended={()=>tryTTS(true)}></audio>
	<div id="divVideo" class="divVideo">
		<div class="close" onclick={closeVideo} role="button" tabindex=0>X</div>
		<video id="video" class="video stars" width="1920" height="1080" controls />
	</div>

	<div id="contenu" class="contenu">
		{#if isAdmin(pseudo)}
			<Padmin webAuth={webAuth} wsCallComponents={wsCallComponents} />
		{/if}
		{#if !isProd}
			<Kikitest CLIENTVERSION={CLIENTVERSION} bind:pseudo={pseudo} bind:webAuth={webAuth} />
		{/if}

		{#if webAuth?.etat=="ok" && webAuth?.existJwkPublicKey && pseudo && pseudo!=""}
			{#if page==0}
				<Phome pseudo={pseudo} pageDone={pageDone} pageList={pageList} webAuth={webAuth}
					bind:page={page} bind:localCtx={localCtx} />
			{:else if PageComponent !== null}
				<div>
					<PageComponent
						wsCallComponents={wsCallComponents}
						pageDesc={Object.assign({}, pageDesc)}
						pseudo={pseudo}
						pseudoGenre={pseudoGenre}
						pseudoList={pseudoList}
						bind:page={page}
						bind:pageDone={pageDone}
						bind:localCtx={localCtx}
					/>
				</div>
			{:else}
				<div>Le contenu de la page {page} n'est pas disponible dans cette configuration</div>
			{/if}
		{:else if webAuth?.etat!="initWebAuth"}
			<Pauth bind:pseudo={pseudo} bind:webAuth={webAuth} CLIENTVERSION={CLIENTVERSION} />
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
						{#if isAdmin(pseudo)}
							<label>Admin:<input type="checkbox" bind:checked={chatInput.msgAdm} /></label>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspPseudo}
		{@const es= loadIt("elipticSecurity",{})}
		{@const dynMetro= getDynMetro()}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspPseudo=!dspPseudo} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<img class="parchemin" style="float:right; width: 4em" alt="" src={urlCdnAI+"pseudo-"+pseudo+".jpg"} />
					<div>
						Ton pseudo est {pseudo} ({webAuth.prenom} {webAuth.nom} @{webAuth.monde})
					</div>
					<div>
						Ton
						<span class="infoLink" gpHelp="C'est une information sensible, elle ne quittera pas ton appareil. Elle restera inconnue du serveur. Elle sera utilisée pour adapter nos intéractions lors des post-traitements sur ton appareil uniquement">
							genre
						</span>
						est:
						<br/>
						<span role="none" onclick={markClick} gpColor="yellow" gpDing="Ding" gpTimeout="15" 
							gpNotif="Cette information sensible restera sur ton appareil"						>
							<Radio bind:value={pseudoGenre} nom="pseudoGenre" options={GBLCONST.GENRES} />
						</span>
					</div>
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
						<a href="https://fr.wikipedia.org/wiki/Synth%C3%A8se_vocale" target="gpHelp">
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
								AudioBlaster coupe le son si il détecte que la fenêtre de ton navigateur est masquée.
								Cette détection automatique a des lacunes.
								Pour couper l'ambiance, sur windows, minimise la fenêtre de ton navigateur, 
								et sur smartphone, repasse sur l'écran d'accueil.
							</div>
						{:else}	
							<div class="info">L'ambance sonore continuera même si ta fenêtre de navigateur est masquée</div>
						{/if}
					</div>
					<div class="adminCadre petit">
						<div class="blinkMsg cRed">
							Les informations ci-dessous sont à utiliser selon les conseils de Kikiadoc
						</div>
						<hr />
						<div>Sécurité</div>
						<div class={(webAuth?.etat=="ok")?"cGreen":"blinkMsg cRed"}>
							<label><input type="checkbox" bind:checked={flags.dspWebAuth} />Infos de sécurité webAuthn</label>
						</div>
						{#if flags.dspWebAuth}<pre>{JSON.stringify(webAuth,null,2)}</pre>{/if}
						<div class={(es.jwkPrivateKey)?"cGreen":"blinkMsg cRed"}>
							<label><input type="checkbox" bind:checked={flags.dspElliptic} />Clef publique racine elliptique</label>
						</div>
						{#if flags.dspElliptic}<pre>{JSON.stringify(es.jwkPublicKey,null,2)}</pre>{/if}
						<div class={(wsStatus!=1)?"cRed":"cGreen"}>
							<label><input type="checkbox" bind:checked={flags.dspCleSession} />Challenge éphémère de session temps réel</label>
						</div>
						{#if flags.dspCleSession}<pre>{loadIt("pseudoPwd","???")}</pre>{/if}
						<hr/>
						{#if dynMetro?.srv} 
							{@const latence=Math.floor(1000*(( (dynMetro.cliRes - dynMetro.cliReq) - (dynMetro.srv.load + dynMetro.srv.run + 1.0) ) / 2.0))/1000}
							<div>
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
							<div style="color:yellow">
								Je n'ai pas encoré vérifié la synchronisation temporelle entre ton équipement et le serveur.
								Ce sera le cas lorsque je ferai une requête serveur permettant de la déterminer.
							</div>
						{/if}
						<hr />
						<div>DeepCheckSec (sécurité de ton navigateur)</div>
						{#if window.crossOriginIsolated}
							<div>
								✅DeepCheckSec est <span style="color:lightGreen">active</span>. 
								Cette page est isolée via 
								<a target="gpHelp" href="https://developer.mozilla.org/fr/docs/Web/HTTP/CSP">
									CSP
								</a>,
								<a target="gpHelp" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy">
									COOP
								</a>
								et
								<a target="gpHelp" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy">
									COEP
								</a>
							</div>
						{:else}
							<div class="redPointer blinkMsg">
								🛑DeepCheckSec n'est pas active, pour ta sécurité, contacte immédiatement Kikiadoc
							</div>
						{/if}
						{#if pseudo && isAdmin(pseudo)}
							<div>
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
						{/if}
						<hr />
						<div>Métacache (optimisation téléchargements)</div>
						<div>
							<Common t="checklist3D" />
							{#if GBLSTATE.swcReady}
								<div>
									<input type="button" value="Liste" onclick={metaCacheList}/>
									<input type="button" value="Vider" onclick={metaCacheClear}/>
									<input type="button" value="En attente" onclick={() => dspObject= swcGetWaitingIds()}/>
								</div>
							{/if}
						</div>
						<hr />
						<div>
							<div role="button" style="cursor: pointer" onclick={markClick} gpHelp="Ceci est la taille mémoire utilisable, limitée à 8Go">
								Mémoire globale utilisable sur ton équipement: {navigator.deviceMemory} Go<sup>(i)</sup> (RAM ou SWAP)
							</div>
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
										target="gpHelp">
										{#if isSM()}
											measureUser...
										{:else}
											measureUserAgentSpecificMemory
										{/if}
									</a>
									C'est une fonction récente qui n'est pas supportée par tous les navigateurs.
								</div>
							{/if}
						</div>
						<hr/>
						<div>
							<div>
								Rapport technique de fonctionnement:
							</div>
							<div>
								<input type="button" value="Capturer" onclick={()=>patchConsole()} />
								<input type="button" value="Arreter" onclick={()=>unpatchConsole()} />
								<input type="button" value="Afficher" onclick={()=>dspObject=getConsole()} />
								<input type="button" value="Envoyer le rapport à Kikiadoc" onclick={()=>reportConsole()} />
							</div>
						</div>
						<hr />
						<div>
							<div>
								Resynchro lodestone, IA vocale etc...
							</div>
							<div>
								<input type="button" value="Resynch config" onclick={async ()=>{dspObject={msg:"Attendre..."}; dspObject = await apiCall('/clientConfig/refresh')} } />
							</div>
						</div>
						<hr />
						<div style="font-size: 0.8em">
							<div>
								Version client: {CLIENTVERSION || 'DEV'}
							</div>
						</div>
						<div style="font-size: 0.8em">
							<div>
								Build: <a href="https://vite.dev/" target="gpHelp">Vite</a>
								{VITEVERSION || "DEV"}
							</div>
							<div>
								Moteur HTML: <a href="https://svelte.dev/" target="gpHelp">Svelte</a>
								{SVELTEVERSION || "DEV"}
							</div>
							<div>
								Moteur 3D: <a href="https://www.babylonjs.com/" target="gpHelp">BabylonJS</a>
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
						loc: {hhmmssms(Date.now())} srv: {hhmmssms(Date.now()-getEpsilon())} loc=srv+ε({getEpsilon()}ms)
					</div>
					<div class="adminCadre">
						<input bind:value={dspObject.dth2local} type="number" placeholder="dth" /> =
						{hhmmssms(dspObject.dth2local)}
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
