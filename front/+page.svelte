<script>
	const SVELTEVERSION=null // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
	const CLIENTVERSION=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
	const VITEVERSION=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
	const WEBPATH=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
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
		startCountDown, stopCountDown, scrollNodeToBottom, scrollNodeToMiddle,
		connectToServer, disconnectFromServer, apiCall,	getDynMetro, getEpsilon,
		hhmmss, hhmmssms, getUtcMsFrom,
		orientationChange, visibilityChange, startBlinkGlobal, markClick, firstClick,
		playMusic, playDing, playVideo, closeVideo, audioInit, audioSetup, wsMedia,
		tts, tryTTS, reviver, replacer,
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

	import Info from './Info.svelte'
	import Radio from './Radio.svelte'
	import Phome from './Phome.svelte'
	import Pauth from './Pauth.svelte'
	import Padmin from './Padmin.svelte'
	import Pipa from './Pipa.svelte'
	import Common from './Common.svelte'
	import Pcodex from './Pcodex.svelte'
	// import Kikitest from './Kikitest.svelte'
	// import Pff14France from './Pff14France.svelte'

	import P100 from './P100.svelte' // FF14 - Codex
	import P102 from './P102.svelte' // FF14 - Codex
	import P103 from './P103.svelte' // FF14 - Codex
	import P104 from './P104.svelte' // FF14 - Lieu-Joli
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
		if (webAuth.etat=="ok") { init(); }
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
		webAuth.etat="reload" // init webauth
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
			webAuth = ret.o // Si ok, l'init sera lancé par l'effect
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
		// Maj contexte client si non ok
		if (! localCtx.ttsLodeStone) {
			localCtx.ttsLodeStone=true
			let ret = await apiCall('/clientConfig/ttsLodestoneRefresh')
		}
		// OBSOLETE
		// let ret= await apiCall('/clientConfig/getContext')
		// if (ret.status==200) ...
	}

	/////////////////////////////////////////////////////////////////////
	// Configuration générale
	//
	function localCtxNormalize(c) {
		// Positionne le SKIN depuis le SKINCONST
		// svelte-ignore state_referenced_locally
		c.skinName ??= GBLCONST.SKINCONST
		c.page ??= {} // Liste des pages (index par le numero de page)
		return c
	}
	let localCtx = $state(localCtxNormalize(loadIt('localCtx',{})))
	$effect(() => storeIt('localCtx',localCtx))
	let page = $state(loadIt('page',0))
	$effect(() => storeIt('page',page))
	$effect(() => pageChange(page))
	/*
	let pageDone = $state(loadIt('pageDone',[]))
	$effect(() => storeIt('pageDone',pageDone))
	*/
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
	let pageList = $state([
		{n: 0, texte: "Home",
		 music: null, // la musique ne change pas
		 component: Phome,
		 start: -Infinity,
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "home",
		},
		{n: 10, texte: "Découvrir l'Institut Peluchique de l'Audiovisuel",
		 music: "derniere-seance",
		 component: Pipa,
		 start: -Infinity,
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 help: "Challenge de Bienvenue",
		 rootName: "ipa",
		 resetDth: getUtcMsFrom(2026,4,1,19,0,0) // heure de reset serveur du challenge
		},
		{n: 403, texte: "Le Prélude de la Rapidité",
		 music: "X-prelude-rapidite/elcondorpasa",
		 component: P403,
		 start: getUtcMsFrom(2026,6,1,17,0,0), // getUtcMsFrom(2026,5,13,17,0,0),
		 end: getUtcMsFrom(2026,6,5,21,0,0),
		 beta: getUtcMsFrom(2026,5,14,23,0,0), // Beta
		 rootName: "X-prelude",
		 inscription: 20,  // nombre max de participants 
		 after: true,
		},
		{n: 404, texte: "Cherchez le lala",
		 music: "X-cherchezlelala/Cherchez-le-garcon",
		 component: P404,
		 start: Infinity, // getUtcMsFrom(2026,7,16,17,0,0), // Infinity, // pas enore disponible
		 end: Infinity, // getUtcMsFrom(2026,7,14,17,0,0), // Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "X-cherchezlelala",
		 tip: {idx:2, txt: "Bientôt, chercher le Lala et trouver la base secrète de la Grande Peluche, tu devras."}
		},
		{n: 100, texte: "Le Codex",
		 icon: "Codex_Logo2.webp",
		 music: "S-codex-music",
		 public: true,
		 // privilege: 1,
		 component: P100,
		 start: getUtcMsFrom(2026,9,1,17,0,0),
		 end: Infinity,
		 beta: getUtcMsFrom(2026,6,17,18,0,0), // beta
		 rootName: "S-codex",
		},
		{n: 102, texte: "Les feuillets oubliés",
		 // ATTENTION uniquement sur public
		 icon: "Codex_Logo2.webp",
		 music: "carol-bell",
		 public: true,
		 pasPrive: true,
		 start: Infinity, // pa ouvert
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "S-codex",
		 component: P102
		},
		{n: 103, texte: "Les feuillets oubliés",
		 icon: "Codex_Logo2.webp",
		 music: "carol-bell",
		 component: P103,
		 start: Infinity, //getUtcMsFrom(2026,5,16,17,0,0), //, // pas enore disponible
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "S-codex-challenge",
		},
		{n: 104, texte: "Les Lieux-Jolis",
		 music: "carol-bell",
		 component: P104,
		 start: Infinity,
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "S-lieux-jolis",
		 
		},
		{n: 405, texte: "L'Initiatique (Kiki's Event X)",
		 music: "X-initiatique/secrets",
		 component: P405,
		 start: Infinity, // pas enore disponible
		 end: Infinity,
		 beta: -Infinity, // pas de beta
		 rootName: null, // A VERIFIER SI BESOIN
		},
		{n: 408, texte: "Le Temps des Fleurs",
		 music: "X-depasse-temps",
		 component: P408,
		 start: Infinity, // pas enore disponible
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "X-tranquilite",
		 delaiDebut: 6,
		 prereq: 405,
		},
		{n: 410, texte: "Pharao",
		 music: "plus-pres-des-etoiles",
		 component: P410,
		 start: Infinity, // pas enore disponible
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "X-pharao",
		 delaiDebut: 4,
		 prereq: 405,
		},
		{n: 420, texte: "Les Bases",
		 music: "dolmen",
		 component: P420,
		 start: Infinity, // pas enore disponible
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "X-lesbases",
		 delaiDebut: 5,
		 prereq: 405,
		},
		{n: 425, texte: "Les Failles",
		 music: "dolmen",
		 component: P425,
		 start: Infinity, // pas enore disponible
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "X-barathym",
		 delaiDebut: 20,
		 prereq: 405,
		},
		{n: 440, texte: "Les Composants",
		 music: "mercredi",
		 component: P440,
		 start: Infinity, // pas enore disponible
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "X-orthocomposants",
		 delaiDebut: 20,
		 prereq: 405,
		},
		{n: 460, texte: "Les Dissonances",
		 music: "mercredi",
		 component: P460,
		 start: Infinity, // pas enore disponible
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "X-dissonances",
		 delaiDebut: 20,
		 prereq: 405,
		},
		{n: 480, texte: "Retour à L'Orthogonalité",
		 music: "dolmen",
		 component: P480,
		 start: Infinity, // pas enore disponible
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "X-dessins",
		 delaiDebut: 20,
		 prereq: 405,
		},
		 ///////////////////////////////////
		 // Passé mais encore consultables 
		 ///////////////////////////////////
		{n: 402, texte: "Le Marché de Noël", music: "X-ventesPrivees/Marche-de-noel",
		 start: getUtcMsFrom(2025,12,13,20,15,0),
		 end: getUtcMsFrom(2026,1,19,20,0,0),
		 beta: Infinity, // pas de beta
		 rootName: "X-ventesprivees",
		 component: P402,
		 after: true,
		},
		 ///////////////////////////////////
		 // ADMIN ou cross ref 
		 ///////////////////////////////////
		{n: 50, texte: "Codex Master",
		 icon: "Codex_Logo2.webp",
		 music: "S-codex-music",
		 privilege: 1,
		 component: Pcodex,
		 start: -Infinity,
		 end: Infinity,
		 beta: Infinity, // pas de beta
		 rootName: "S-codex",
		},
		 ///////////////////////////////////
		 ///////////////////////////////////
		 ///////////////////////////////////
		/*
		{n: 400, texte: "Métropolis", music: "le-jeu",
		 start: (isProd)? getUtcMsFrom(2025, 3, 21, 19, 0, 0) : getUtcMsFrom(2025, 3, 18, 19, 0, 0),
		 end:  getUtcMsFrom(2025, 3, 25, 8, 0, 0),
		 beta: true,
		 component: P400
		},
		*/
		/*
		{n: 400, texte: "Métropolis", music: "le-jeu",
		 start: getUtcMsFrom(2025,3,21,19,0,0),
		 end: getUtcMsFrom(2025,3,25,8,0,0),
		 after: true,
		 component: P400
		},
		{n: 401, texte: "Le Bug Bounty de l'IPA", music: "Alice",
		 start: getUtcMsFrom(2025,6,20,18,0,0),
		 end: getUtcMsFrom(2025,7,15,18,0,0),
		 component: P401,
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
	::-webkit-scrollbar { width: 9px;}
	::-webkit-scrollbar-track { background: transparent;}
	::-webkit-scrollbar-thumb { background: rgba(155, 155, 155, 0.5);  border-radius: 20px;  border: transparent; }							

	*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

	:root {
		--v:    #7c3aed;
		--vl:   #c4b5fd;
		--b:    #2563eb;
		--bl:   #93c5fd;
		--t:    #0d9488;
		--tl:   #5eead4;
		--w:    #f0f4ff;
		--bg:   #060810;
		--bgc:  #0b0e1a;
		--bgc2: #0d1120;
		--bd:   rgba(140,150,255,0.12);
		--bdh:  rgba(140,150,255,0.28);
		--mu:   #3d4566;
		--mu2:  #252c45;
		--FfBgImg: none;
		--GpImgParchemin: url("https://cdn.adhoc.click/STATIC/parchemin.png");
		--GpImgPapier: url("https://cdn.adhoc.click/V10a/texture-papier-noir.jpg");
		--GpImgRouge: url("https://cdn.adhoc.click/V10a/backRouge.gif");
		--GpImgStars: url("https://cdn.adhoc.click/V10a/stars.gif");
		--GpImgOracle: url("https://cdn.adhoc.click/V10a/Oracle.png");
		--GpImgAlien: url("https://cdn.adhoc.click/V10a/commons/alien.gif");
		--GpTitreHeight: 3.0em;
		--FfTitreHeight: 2.5em;
	}

	/* PC */
	@media (pointer: fine) and (max-width: 900px)  {
		.body { font-size: 1.4em; margin: var(--FfTitreHeight) 0 0 0  }
		.contenu {  }
	}
	@media (pointer: fine) and (min-width: 900px) and (max-width: 1399px)  {
		.body { font-size: 1.5em; margin: var(--FfTitreHeight) 5% 0 5%  }
		.contenu {  }
	}
	@media (pointer: fine) and (min-width: 1400px) {
		.body { font-size: 1.7em ; margin: var(--FfTitreHeight) 10% 0 10%}
		.contenu {  }
	}
	/* smartphone portait */
	@media (pointer: coarse) and (orientation: portrait) {
		.body { font-size: 5.8vw; margin: var(--FfTitreHeight) 0% 0 0%  }
		.contenu {  }
  }
	/* smartphone landscape */
	@media (pointer: coarse) and (orientation: landscape) {
		.body { font-size: 2.8vw; margin: var(--FfTitreHeight) 0% 0 0%  }
		.contenu {  }
  }

	.skin {
		text-shadow: 0px 0.10em 0.1em black, 0px -0.1em 0.1em black, 0px 0.20em 0.2em black, 0px -0.2em 0.2em black;
		font-family: "Times New Roman", Times, serif;
		position: fixed;
		top:0; left:0; right:0; bottom:0;
		background-color: black;
		background-image: var(--GpImgOracle);
		background-position: center;
		background-size: cover;
    display: flex;
    flex-direction: column;
		color: white;
	}
	.body {
		overflow: scroll; scrollbar-width: none;
	}
	.contenu {
	}
	notifications {	top: 0px; right: 0px; position: fixed; z-index: 20000; width: 50%; }
	
	titre {
		background: radial-gradient( ellipse at 0% 10%,  red 25% , grey 40% , #FFFFFF00 60%, #FFFFFF00 100%	);
		vertical-align: top; position: fixed;	left: 0; top: 0; width: 100%; height: var(--GpTitreHeight);
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

	label { cursor: pointer; }
	
	hr { margin: 0.2em 0em}

	/* entete */
	.pseudo { top: 0px; right: 2em; height: 2em; background-size:cover;
						position: fixed; z-index: 1000; cursor: pointer; }
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
	div :global(.cBlue) { color: blue}
	
	div :global(.papier) {
		background-color: grey; background-position: center;
		background-image: var(--GpImgPapier);
	}
	div :global(.rouge) {
		background-color: grey; background-position: center;
		background-image: var(--GpImgRouge);
	}
	div :global(.stars)  {
		background-color: grey; background-position: center;
		background-image: var(--GpImgStars);
	}
	div :global(.alien)  {
		background-color: grey; background-position: center;
		background-size: cover;
		background-image: var(--GpImgAlien);
		font-size:1.2em;
	}
	div :global(.popupCadre) {
		position: fixed; top: 10%; left: 10%;
		border: 2px outset red; border-width: 5%; border-radius: 0.875em;
    transform: translate(-5%, 0%);
		overflow: visible;
		z-index: 7000;
    padding: 0.5em 0.5em 0.5em 0.5em;
	}
	div :global(.popupZone) { /* padding: 1.5em 0.5em 1.0em 1.0em;  */	}
	div :global(.popupContent) {
		max-height: 79vh; min-height: 4em; min-width: 10em;
		scrollbar-color: white grey; scrollbar-width: thin; overflow: auto;
		white-space: normal; word-break: auto-phrase;	}
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
		background-image: var(--GpImgPapier);
		animation-duration: 10s; animation-name: revealFrames; animation-iteration-count: 1;
	}
	div :global(.reveal2) {
		border: 0.1em solid white; padding: 0.2em; margin-top: 0.5em; color: white;
		background-position: center; background-repeat: no-repeat; 
		background-size: cover; background-color: black;
		background-image: var(--GpImgPapier);
		animation-duration: 10s; animation-name: revealFrames; animation-iteration-count: 1;
		opacity: 80%;
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
	
	.SKINFF :global {
    .body {
      /* background: var(--bg); */
      font-family: 'Inter', -apple-system, sans-serif;
      color: var(--w);
    }
		titre {
			background: transparent;
			height: var(--FfTitreHeight);
		}
		.contenu {
			top: var(--FfTitreHeight);
		}

    /* ── HERO ── */
    .hero-section {
      padding: 1em 2em 1em;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero-eyebrow {
      font-size: 0.6875em;
      font-weight: 500;
      color: var(--tl);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-bottom: 0.875em;
      position: relative;
    }
    .hero-title {
      font-size: 2.625em;
      font-weight: 300;
      letter-spacing: -0.04em;
      color: var(--w);
      line-height: 1.1;
      margin-bottom: 1em;
      position: relative;
    }
    .hero-title strong { font-weight: 500; color: var(--vl); }

    .hero-sub {
      font-size: 0.7em;
      color: var(--mu);
      font-weight: 300;
      line-height: 1.6;
      /* max-width: 25em; */
      /* margin: 0 auto 0.25em; */
      position: relative;
    }
    .hero-actions {
      display: flex;
      gap: 1em;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .btn-primary {
      background: var(--v);
      color: #fff;
      font-size: 0.875em;
      font-weight: 400;
      padding: 0.625em 1.5em;
      border-radius: 61.25em;
      cursor: pointer;
      border: none;
      font-family: inherit;
      letter-spacing: -0.01em;
      transition: background 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }
    .btn-primary:hover { background: #6d28d9; }

    .btn-ghost {
      color: var(--bl);
      font-size: 0.875em;
      font-weight: 400;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25em;
      background: none;
      border: none;
      font-family: inherit;
      text-decoration: none;
      transition: color 0.2s;
    }
    .btn-ghost:hover { color: var(--vl); }

    /* ── DIVIDER ── */
    .divider { height: 0.03125em; background: var(--bd); margin: 0 2em; }

    /* ── CARDS ── */
    .cards-section { padding: 0.5em 0.5em; }

    .cards-label {
      font-size: 0.6875em;
      font-weight: 500;
      color: var(--mu);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 1.25em;
    }
    .cards-grid {
      display: grid;
      /* grid-template-columns: repeat(2, minmax(0, 1fr)); */
      gap: 0.625em;
      margin-bottom: 0.625em;
    }
    .card {
      background: var(--bgc);
      border-radius: 1em;
      padding: 1.5em 1.375em;
      cursor: pointer;
      border: 0.03125em solid var(--bd);
      transition: border-color 0.2s;
      text-decoration: none;
      /* display: block; */
			display: flex	
			
    }
    .card:hover { border-color: var(--bdh); }

    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1em;
    }
    .card-icon { width: 2.75em; height: 3.25em; display: flex; align-items: center; }
    .card-icon img { width: 2.25em; height: 2.75em; object-fit: contain; }

    .card-badge {
      font-size: 0.6875em;
      font-weight: 500;
      padding: 0.25em 0.625em;
      border-radius: 61.25em;
    }
    .badge-teal { background: rgba(13,148,136,0.18); color: var(--tl); }
    .badge-gray { background: rgba(255,255,255,0.04); color: var(--mu); }

    .card-title {
      font-size: 1em;
      font-weight: 500;
      color: var(--w);
      letter-spacing: -0.02em;
      margin-bottom: 0.375em;
    }
    .card-locked .card-title { color: var(--mu2); }
    .card-locked .card-icon img { opacity: 0.15; filter: grayscale(1); }

    .card-desc { font-size: 0.8125em; color: var(--mu); line-height: 1.6; font-weight: 300; }
    .card-locked .card-desc { color: var(--mu2); }

    .card-arrow {
      display: flex;
      align-items: center;
      margin-top: 1em;
      font-size: 0.8125em;
      color: var(--vl);
      gap: 0.25em;
    }
    .card-locked .card-arrow { color: var(--mu2); }

    /* ── WIDE CARDS ── */
    .card-wide {
      background: var(--bgc);
      border-radius: 0.875em;
      padding: 1.125em 1.375em 1.125em 1.375em;
      border: 0.03125em solid var(--bd);
			/*
      display: flex;
      align-items: center;
      gap: 1em;
			*/
      margin-bottom: 0.5em;
      cursor: pointer;
      transition: border-color 0.2s;
      text-decoration: none;
    }
    .card-wide:hover { border-color: var(--bdh); }
		/* NEW */
    .card-wide-container {
      display: flex;
      align-items: center;
      gap: 1em;
		}

    .card-wide-icon {
      width: 2.375em;
      height: 2.375em;
      border-radius: 0.625em;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.125em;
    }
    .icon-blue { background: rgba(37,99,235,0.15); color: var(--bl); }
    .icon-teal { background: rgba(13,148,136,0.15); color: var(--tl); }

    .card-wide-body { flex: 1; }
    .card-wide-title { font-size: 0.875em; font-weight: 500; color: #c8d4f0; margin-bottom: 0.125em; letter-spacing: -0.01em; }
    .card-wide-desc { font-size: 0.75em; color: var(--mu); font-weight: 300; }
    .card-wide-chevron { color: var(--mu2); font-size: 0.9375em; }

    /* ── PRIVACY ── */
    .privacy-section {
      /* margin: 0 2em 2.5em; */
			margin: 0.5em;
      background: var(--bgc2);
      border-radius: 1em;
      /* padding: 1.5em; */
			padding: 0.5em 0.5em;
      border: 0.03125em solid var(--bd);
      font-size: 0.875em;
    }
    .privacy-title {
      font-size: 0.875em;
      font-weight: 500;
      color: #c8d4f0;
      margin-top: 0.3em;
      /* margin-bottom: 1em; */
      display: flex;
      align-items: center;
      gap: 0.5em;
      letter-spacing: -0.01em;
    }
    .privacy-title i { color: var(--tl); font-size: 1em; }

    .privacy-pills { display: flex; flex-wrap: wrap; gap: 0.5em; }
    .pill {
      display: flex;
      align-items: center;
      gap: 0.375em;
      border-radius: 61.25em;
      padding: 0.375em 0.875em;
      font-size: 0.75em;
      font-weight: 400;
      border: 0.03125em solid;
			cursor:pointer;
    }
    .pill i { font-size: 0.8125em; }
    .pill-v { background: rgba(124,58,237,0.1); border-color: rgba(196,181,253,0.2); color: var(--vl); }
    .pill-b { background: rgba(37,99,235,0.1);  border-color: rgba(147,197,253,0.2); color: var(--bl); }
    .pill-t { background: rgba(13,148,136,0.1);  border-color: rgba(94,234,212,0.2);  color: var(--tl); }

    /* ── FOOTER ── */
    .footer {
      margin-top: auto;
      border-top: 0.03125em solid var(--bd);
      padding: 1.125em 2em;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg);
    }
    .footer-copy { font-size: 0.75em; color: var(--mu2); }
    .footer-links { display: flex; gap: 1.25em; list-style: none; }
    .footer-links a { font-size: 0.75em; color: var(--mu); cursor: pointer; text-decoration: none; transition: color 0.2s; }
    .footer-links a:hover { color: var(--vl); }

    /* ── RESPONSIVE ── */
    @media (max-width: 35em) {
      .cards-grid { grid-template-columns: 1fr; }
      .nav-links { display: none; }
      .hero-title { font-size: 2em; }
    }
    @media ((min-width: 35em ) and (max-width: 70em)) {
      .cards-grid { grid-template-columns: 1fr 1fr; }
      .nav-links { display: none; }
      .hero-title { font-size: 2em; }
    }
    @media ((min-width: 70em ) and (max-width: 105em)) {
      .cards-grid { grid-template-columns: 1fr 1fr 1fr; }
      .nav-links { display: none; }
      .hero-title { font-size: 2em; }
    }
    @media ((min-width: 105em )) {
      .cards-grid { grid-template-columns: 1fr 1fr 1fr; }
      .nav-links { display: none; }
      .hero-title { font-size: 2em; }
    }

		/* toggle uniquement sur SKINFF */
		.skin {
			background-image: var(--GpImgStars);
			background-size: contain;
			background-position: center;
			background-repeat: repeat;
			background-blend-mode: hard-light;
		}
		.privacy-section-legacy { display: none}
		.card-gpIcon-gauche  { display: none }
		.card-gpIcon-droite { margin-left: auto; vertical-align:top }
		.card-gpIcon-droite img { width: 2em }
    input[type=button] {
      border-radius: 61.25em;
      padding: 0.1em 0.4em;
      font-size: 0.75em;
      font-weight: 400;
      border: 0.03125em solid;
			cursor:pointer;
    }
	}
	.SKINGP :global { 
		.card { display: flex; cursor: pointer}
		.card-wide-container {
			display: flex;
      align-items: center;
	    gap: 1em;
			color: lightgreen;
			cursor: pointer;
		} 
		.card-wide-desc { display: none}
		.privacy-section { display: none}
		.card-gpIcon-gauche  { vertical-align: top }
		.card-gpIcon-droite  { vertical-align: top }
		.card-gpIcon-droite img { width: 2em }
	}
	
</style> 

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag --> 
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_media_has_caption -->
<div class={localCtx.skinName}>
	<div class="skin">
		<div id="scrollTopPage" class="body" role="none">
			<notifications id="notifications"></notifications>
			<titre>
				<div onclick={() => { page=0 }} role="button">
					<div style="font-size: 1.0em">{GBLCONST.SKINELT.titreLbl}</div>
					<div style="font-size: 0.6em">
						{WEBPATH} ({localCtx.skinName}-{CLIENTVERSION || 'DEV'})
					</div>
				</div>
				<div class="pseudo">
					{#if wsStatus==1}
						<span style="color: lightgreen" onclick={togglePseudo} role="button">
							{pseudo}
						</span>
					{:else}
						<span style="color: yellow;" onclick={togglePseudo} role="button">
							{(GBLCONST.public)? "Accès public" : (pseudo)? pseudo+" non validé" : "pseudo non validé"}
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
					<Padmin webAuth={webAuth} wsCallComponents={wsCallComponents} GBLCONST={GBLCONST} />
				{/if}
				{#if wsStatus==1 || GBLCONST.public}
					<!-- mode authentifié validé ou public -->
					<PageComponent
						webAuth={webAuth}
						wsCallComponents={wsCallComponents}
						pageDesc={Object.assign({}, pageDesc)}
						pseudo={pseudo}
						pseudoGenre={pseudoGenre}
						pseudoList={pseudoList}
						pageList={pageList}
						bind:page={page}
						bind:localCtx={localCtx}
					/>
				{:else if webAuth.etat != "ok" && webAuth.etat != "initWebAuth"}
					<!-- mode authentifié non validé et séquence de webauth commencée -->
					<Pauth bind:pseudo={pseudo} bind:webAuth={webAuth} CLIENTVERSION={CLIENTVERSION} />
				{/if}
				<div style="height: 80vh" />
			</div>
		
			{#if dspMultiPopup}
				<div class="popupCadre papier">
					<div class="close" onclick={() => { dspMultiPopup = false; chatFlag=false}} role="button" tabindex=0>X</div>
					<div class="popupZone">
						<div class="popupContent">
							{#if wsStatus==1}
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
							{:else}
								<div>
									Tu es en accès sécurisé, mais public et non authentifié.
									<br/>
									Les infos multijoueurs, les challenges en compétition ou coopération
									necessitent ton authentification forte.
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
			
			{#if dspPseudo}
				{@const es= loadIt("elipticSecurity",{})}
				{@const dynMetro= getDynMetro()}
				<div class="popupCadre papier petit">
					<div class="close" onclick={()=>dspPseudo=!dspPseudo} role="button">X</div>
					<div class="popupZone">
						<div class="popupContent">
							<img class="parchemin" style="float:right; width: 6em" alt="" src={urlCdnAI+"pseudo-"+pseudo+".jpg"} />
							<div>
								{#if pseudo && pseudo!= ""}
									Ton pseudo est {pseudo}<br/>({webAuth.prenom} {webAuth.nom} @{webAuth.monde})
								{:else}
									Tu accèdes au site en mode sécurisé, non authentifié.
								{/if}
							</div>
							<hr/>
							<div>
								<span class="infoLink" gpHelp="C'est une information sensible, elle ne quittera pas ton appareil.
																							 Elle restera inconnue du serveur.
																							 Elle sera utilisée pour adapter nos intéractions
																							 lors des post-traitements sur ton appareil uniquement">
									Ton genre est:
								</span>
								<br/>
								<span role="none" onclick={markClick} gpColor="yellow" gpDing="Ding" gpTimeout="15" 
									gpNotif="Cette information sensible restera sur ton appareil"						>
									<Radio bind:value={pseudoGenre} nom="pseudoGenre" options={GBLCONST.GENRES} />
								</span>
								<hr/>
								<span class="infoLink" gpHelp="Ceci définit l'aspect du site,
									tu peux en changer à tout moment de façon temporaire ">
									Le visuel du site est:
								</span>
								<br/>
								<Radio bind:value={localCtx.skinName} nom="skinName" options={GBLCONST.SKINS} />
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
										Mon assistant AudioBlaster coupe l'ambiance sonore si il détecte que
										la fenêtre de ton navigateur est masquée.
										Cette détection automatique a des lacunes,
										par exemple, si tu as plusieurs écrans ou utilise Chromecast sur ton smartphone.
										Pour couper l'ambiance, tu peux aussi, sur windows ou smartphone, minimiser
										la fenêtre de ton navigateur, 
										ou repasser sur l'écran d'accueil sur ton smartphone.
									</div>
								{:else}	
									<div class="info">L'ambance sonore continuera même si ta fenêtre de navigateur est masquée</div>
								{/if}
							</div>
							<hr />
							<div>
								<div onclick={()=>localCtx.flagUserDetail = !localCtx.flagUserDetail} role="button">
									{#if localCtx.flagUserDetail}
										<div class="blinkMsg redPointer">
											👇Les informations ci-dessous sont à utiliser selon les conseils de Kikiadoc
										</div>
									{:else}
										<div class="yellowPointer">
											👉Voir les éléments techniques (sur conseil de Kikiadoc)
										</div>
									{/if}
								</div>
								{#if localCtx.flagUserDetail}
									<div class="adminCadre">
										<div>
											<div>
												Version client: {CLIENTVERSION || 'DEV'}
											</div>
										</div>
										<div>
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
										<hr />
										<div>Sécurité (Uniquement pour le mode authentifié)</div>
										<div class={(webAuth?.etat=="ok")?"cGreen":"cRed"}>
											<label><input type="checkbox" bind:checked={flags.dspWebAuth} />Infos de sécurité webAuthn</label>
										</div>
										{#if flags.dspWebAuth}<pre>{JSON.stringify(webAuth,null,2)}</pre>{/if}
										<div class={(es.jwkPrivateKey)?"cGreen":"cRed"}>
											<label><input type="checkbox" bind:checked={flags.dspElliptic} />Clef publique racine elliptique</label>
										</div>
										{#if flags.dspElliptic}<pre>{JSON.stringify(es.jwkPublicKey || "Indéfinie",null,2)}</pre>{/if}
										<div class={(wsStatus!=1)?"cRed":"cGreen"}>
											<label><input type="checkbox" bind:checked={flags.dspCleSession} />Challenge éphémère de session temps réel</label>
										</div>
										{#if flags.dspCleSession}<pre>{loadIt("pseudoPwd","Non défini")}</pre>{/if}
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
										<div>Métacache (optimisation téléchargements des scènes 3D)</div>
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
											{#if wsStatus==1}
												<div>
													<input type="button" value="Resynch config" onclick={async ()=>{dspObject={msg:"Attendre..."}; dspObject = await apiCall('/clientConfig/ttsLodestoneRefresh')} } />
												</div>
											{:else}
												<div class="cRed">
													Indisponible (pas d'authentification forte).
												</div>
											{/if}
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
								{/if}
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
								[{new Date(dspObject.dth2local).toLocaleDateString()}]
							</div>
							<div><pre style="white-space: pre-wrap; word-break: break-all;">{JSON.stringify(dspObject,replacer,2)}</pre></div>
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
	</div>
</div>
<!-- page +page svelte -->


