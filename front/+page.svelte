<script>
	// standard
	import { onMount, onDestroy, tick } from 'svelte';

	import {
		isLowerNumeric, lowerFirstLetter, capitalizeFirstLetter,
		isPseudoValid, loadIt, storeIt, clearStorage,
		addNotification, newInfoPopup, scrollTop, urlImg, urlRaw,
		connectToServer, disconnectFromServer, apiCall,
		getDynMetro, getEpsilon,
		hhmmss, jjmmhhmmss, hhmmssms, countDownTo, geUtcMsFrom, mmssms,
		playSound, playDing, audioPause, audioResume,
		playVideo, closeVideo, clickSur,
		startWakeLock, stopWakeLock, crypoCreateKeyPair
	} from "./storage.js";
	
	import P0 from './z/P0.svelte'
	import P1 from './z/P1.svelte'
	// ONLYCOMPILED import P310 from './P310.svelte'; // Nommer l'innomable
	// ONLYCOMPILED import P311 from './P311.svelte'; // Benchmark
	import P330 from './P330.svelte'
	import P332 from './P332.svelte'
	import P335 from './P335.svelte'
	import P340 from './P340.svelte'
	import P350 from './P350.svelte'
	import P355 from './P355.svelte'
	import P360 from './P360.svelte'
	import P370 from './P370.svelte'
	import P380 from './P380.svelte'

	let version=null;  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer

	// compilerVersion=4.2.19
	// compilerVersion=3.56.0
	// divers caractères pour copier/coller : ➤▲⏸◀▶▼⏬🔎📽❓✅🆘⚠️⬇️✅➥📷εΔ⛭👉😈ⓘ(ℹ)🛈႞⒤
	// ne fonctionne pas sur android 🛈 ne pas confondre avec 🛈
	// on:keypress={(e) => e.key=="Enter" && clickSur('domId')}

	// Gestion des reload, refresh etc..
	onMount(() => {
		console.log('** Mount **')
		const splash = document.getElementById("splash")
		if (splash)	setTimeout(() => {  splash.remove(); } , 1500)
		// play audio des qu'un click...
		document.addEventListener("click", firstClick, { once: true });
		startWakeLock()
		startCountDown()
		init()
		console.log('** Mount Done **')
	});
	onDestroy(() => {
		console.log('** UnMount **')
		disconnectFromServer()
		stopCountDown()
		stopWakeLock()
		clearTimeout(timerIdList)
		document.removeEventListener("click", firstClick, { once: true });
		console.log('** UnMount Done **')
	});

	function init() {
		// NOOP: se fera par l'effect
		// setupAudio(audioVolume,audioBack,audioAmbiance,audioTTS)
		if (pseudo) {
			connectToServer(wsCbStatus, wsCbMessage,version);
			setupTimerList();
		}
		else
			page = 0; // force login car !pseudo
	}
	function initAfterKeyValidation() {
		if (!audioAmbiance) addNotification("Musique d'ambiance désactivée, clic sur 🔇 en haut à droite pour la réactiver","orange",5)
		// si la page n'est pas dans la desription, reset la page a 0
		if (page!=0 && !pageList.find( (e) => { return (e.n == page) } ) ) page=0;
	}
	function firstClick() {
		document.premierClickOk = true
		setupAudio(audioVolume,audioBack,audioAmbiance,audioTTS);
		playSound();
	}

	//
	// Configuration générale
	//
	let pseudo = $state(loadIt('pseudo',""))
	let pseudoPwd = loadIt('pseudoPwd',"")
	let lastPage = -1;
	let page = $state(loadIt('page',0));
	let pageDone = $state(loadIt('pageDone',[]));
	let PageComponent = $state(null);
	let pageDesc = $state(null);
	let pseudoList=$state([]) //chargement par WS
	let showAdmin = $state(false) // affiche les infos d'admin
	let dspAssistance = $state(false) // affichage assistance
	let dspCredits = $state(false) // affichage credts

	//
	// Liste des pages de jeu
	// (page list n'est pas const pour permettre le refresh)
	// option rares: 
	// always: true indique qu'il faut toujours afficher
	// betaTest: true inidique que c'est disponible en avant premiere
	// prereq: nnn element prérequis (doit être dans pageDone)
	// viewAfter: true permet d'afficher le composant apres la fin
	let pageList = $state([
		{n: 1, texte: "Visiter l'IPA, l'Institut Peluchique de l'Audiovisuel", music: "Alice",
		 start: geUtcMsFrom(2024, 1, 2, 19, 0, 0),
		 // start: geUtcMsFrom(2024, 4, 24, 19, 0, 0),
		 end: geUtcMsFrom(2034, 1, 1, 19, 0, 0),
		 always: true,
		 component: P1
		},
		/*
		{n: 310, texte: "Nommer l'Innommable", music: "FrontTitles",
		 start: geUtcMsFrom(2024, 5, 24, 18, 0, 0),
		 end: geUtcMsFrom(2024, 6, 6, 18, 0, 0),
		 viewAfter: true,
		 // ONLYCOMPILED component: P310
		},
		{n: 311, texte: "Kiki's Event IX, Benchmark", music: "SonOfSon",
		 start: geUtcMsFrom(2024, 6, 16, 15, 30, 0),
		 end: geUtcMsFrom(2024, 6, 28, 8, 0, 0),
		 viewAfter: true,
		 // ONLYCOMPILED component: P311
		},
		*/
		{n: 330, texte: "Kiki's Event IX, l'Initiatique", music: "LOTR-connaissances",
		 start: geUtcMsFrom(2025, 1,10, 19, 0, 0),
		 end: geUtcMsFrom(2025, 1,11, 19, 0, 0),
		 viewAfter: true,
		 betaTest: true,
		 component: P330
		},
		{n: 332, texte: "Les Nouveaux Anciens", music: "Artemis",
		 start: geUtcMsFrom(2025, 1,10, 20, 0, 0),
		 end: geUtcMsFrom(2025, 1, 12, 19, 0, 0),
		 preReq: 330, preLbl: "l'Initiatique de l'événement",
		 viewAfter: true,
		 component: P332
		},
		{n: 335, texte: "La doctrine du Mal", music: "godofwar",
		 start: geUtcMsFrom(2025, 1,11, 19, 0, 0),
		 end: geUtcMsFrom(2025, 1, 15, 19, 0, 0),
		 // betaTest: true,
		 preReq: 332, preLbl: "les Nouveaux Anciens",
		 viewAfter: true,
		 component: P335
		},
		{n: 340, texte: "La Conjecture de Syracuse", music: "KanAnErer",
		 start: geUtcMsFrom(2025, 1,12, 19, 0, 0),
		 end: geUtcMsFrom(2025, 1, 15, 19, 0, 0),
		 viewAfter: true,
		 component: P340
		},
		{n: 350, texte: "La Torchère", music: "ShadowArgonath",
		 start: geUtcMsFrom(2025, 1, 13, 19, 0, 0),
		 end: geUtcMsFrom(2025, 1, 19, 19, 0, 0),
		 viewAfter: true,
		 component: P350
		},
		{n: 355, texte: "Station Alpha", music: "Gift",
		 start: geUtcMsFrom(2025, 1, 15, 19, 0, 0),
		 end: geUtcMsFrom(2025, 1, 19, 19, 0, 0),
		 viewAfter: true,
		 component: P355
		},
		{n: 360, texte: "Les Avaloirs", music: "Propaganda",
		 start: geUtcMsFrom(2025, 1, 16, 19, 0, 0),
		 end: geUtcMsFrom(2025, 1, 20, 19, 0, 0),
		 component: P360
		},
		{n: 370, texte: "Les Spartaci", music: "medium",
		 start: geUtcMsFrom(2025, 1, 18, 19, 0, 0),
		 end: geUtcMsFrom(2025, 1, 20, 0, 0, 0),
		 effectiveStart: geUtcMsFrom(2025, 1, 19, 19, 0, 0),
		 viewAfter: true,
		 component: P370
		},
		{n: 380, texte: "Station Omega", music: "guardians",
		 start: geUtcMsFrom(2025, 1, 20, 20, 0, 0),
		 end: geUtcMsFrom(2025, 1, 22, 20, 0, 0),
		 viewAfter: true,
		 component: P380
		},
		{n: 390, texte: "Epilogue", music: "BlindingLights",
		 start: geUtcMsFrom(2025, 1, 21, 19, 0, 0),
		 end: geUtcMsFrom(2025, 1, 23, 19, 0, 0),
		 viewAfter: true,
		 // component: pacman
		}
	]);

	/////////////////////////////////////////////////////////////////////
	// Gestion des parametres audio
	/////////////////////////////////////////////////////////////////////
	let audioVolume = $state(loadIt('audioVolume',30)); // volume relatif des audios et videos
	let audioTTS = $state(loadIt('audioTTS',100)); // volume relatif au TTS
	let audioBack = $state(loadIt('audioBack',false)); // flag de pause automatique désactivée
	let audioAmbiance = $state(loadIt('audioAmbiance',true)); // flag d'activation musique d'ambiance

	// global react sur param audios
	$effect(() => setupAudio(audioVolume,audioBack,audioAmbiance,audioTTS) )
	// Mofif des options audios
	function setupAudio(vol,background,ambiance,tts) {
		console.log("setupAudio vol:",vol,"back:",background,"ambiance:",ambiance,"tts:",tts)
		const domMusique=document.getElementById("musique");
		const domDing=document.getElementById("ding");
		const domTTS=document.getElementById("tts");
		const domVideo = document.getElementById("video");
		if (!domMusique || !domDing || !domTTS || !domVideo) return addNotification("setupAudio, dom not ready")
		domMusique.audioVolume = vol/100
		domMusique.audioAmbiance = ambiance;
		domMusique.audioBackground = background;
		domDing.audioVolume = vol/100
		domVideo.audioVolume = vol/100
		domTTS.audioVolume = tts/100
		domTTS.volume = tts/100
		if (ambiance)
				audioResume(domMusique)
		else
				audioPause(domMusique)
		storeIt('audioVolume', audioVolume)
		storeIt('audioTTS', audioTTS)
		storeIt('audioBack', audioBack)
		storeIt('audioAmbiance', audioAmbiance)
		return ambiance
	}

	/////////////////////////////////////////////////////////////////////
	// gestion du changement de page
	/////////////////////////////////////////////////////////////////////
	function pageChange() {
		if (page != lastPage) {
			storeIt('page', page);
			storeIt('pageDone', pageDone);
			lastPage = page;
			scrollTop()
			// Recherche la description de la page
			let wPageDesc = pageList.find((e) => e.n == page);
			// Si trouvé, 
			if (wPageDesc) {
				playSound(wPageDesc.music);
				PageComponent = (wPageDesc.component)? wPageDesc.component : null;
			}
			else {
				console.log("wPageDesc not found: ", page)
				playSound(null);
				PageComponent = null;
			}
			pageDesc = wPageDesc;
		}
	}
	$effect(() => pageChange(page))

	/////////////////////////////////////////////////////////////////////
	// Gestion du websocket / multijoueurs / TTS / admin
	/////////////////////////////////////////////////////////////////////
	let wsCallComponents = new Set();
	let wsStatus = $state(0);
	// v: 0 disconnect, 1 connected, 2 erreur
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
			case "wsMedia": wsMedia(m);	done=true; break; // Ordre multimedia depuis le ws
			case "admGotoPage": admGotoPage(m);	done=true; break; // admin switch page
		};
		// appel des composants enregistrés si besoin
		if (!done) wsCallComponents.forEach( (cb) => { if ( cb(m) ) done=true; });
		if (!done) console.log("WS op non géré: ", m);
	}

	// force la page d'un user
	function admGotoPage(wsm) {
		if (wsm.o.pseudo != pseudo) return newInfoPopup("admGotoPage bad pseudo")
		dspObject = wsm
		page = wsm.o.page		
	}

	// ordre de jouer un truc multimedia
	function wsMedia(wsm) {
		switch(wsm.o.type) {
			case 'mp4': {
				if (wsm.o.delai) 
					setTimeout(playVideo,1000*wsm.o.delai,wsm.o.mp4 )
				else
					playVideo(wsm.o.mp4)
			}
			default: console.log ("bad wsMedia:",wsm)
		}
	}
	
	let etatTTS = $state({ dth:0, files: [] })
	function tts(m,force) {
		console.log("tts:",m)
		if (force) etatTTS.files = []
		etatTTS.dth=Date.now()
		if (Array.isArray(m.o))
			m.o.forEach((e)=>etatTTS.files.push(e))
		else
			etatTTS.files.push(m.o)
		tryTTS(force)
	}
	function tryTTS(force) {
		let elt = document.getElementById('tts')
		let now = Date.now()
		// attend si pas force, playing et que playing depuis moins de 15 seconde
		if (!force && elt.gpPlaying && (elt.gpPlaying+15000>now)) return console.log("TTS playing") // attente erreur ou end
		elt.gpPlaying=0
		let next = etatTTS.files.shift()
		if (!next) { console.log("TTS: no file in queue"); return }
		elt.gpPlaying=now
		elt.gpRef=next.file
		if (next.statique)
			elt.src = urlImg+"ff-tts-static/"+next.file
		else
			elt.src = "https://ff14.adhoc.click/grimoire/"+next.file
		if (next.flash) startBlinkGlobal()
		elt.play()
	}
	function erreurTTS(e) {
		console.log(e);
		addNotification("Erreur TTS sur "+e.gpRef)
	}

	/////////////////////////////////////////////////////////////////////
	// Gestion du pseudo et creation compte
	/////////////////////////////////////////////////////////////////////
	let dspPseudo=$state(false); // affichage Popup pseudo
	function toggleDspPseudo() {
		dspPseudo = !dspPseudo
	}
	
	async function registerPseudo()	{
		let enregistrer = document.getElementById("enregistrerPseudo");
		if (enregistrer.style.color=="red")	return newInfoPopup("Patience ! ","Les vérifications sont en cours","Patience")
		enregistrer.style.color="red";
		try {	await registerPseudoTech();	} catch(e) {console.log(e)} ;
		enregistrer.style.color="black";
	}

	async function registerPseudoTech()	{
		let newPseudo = capitalizeFirstLetter(document.getElementById("pseudoRequest").value.replaceAll(' ','').toLowerCase())
		let nomIG = capitalizeFirstLetter(document.getElementById("nomRequest").value.replaceAll(' ','').toLowerCase())
		let monde = capitalizeFirstLetter(document.getElementById("mondeRequest").value.replaceAll(' ','').toLowerCase())
		if (!isPseudoValid(newPseudo) || !isPseudoValid(nomIG))
			return newInfoPopup("Invalide!","Ton prénom et nom doivent respecter les regles de nommage de FF14","");

		let ret = null; // resulta de requete
		addNotification("Vérif / lodestone","green",3)
		// acces lodestone via proxy sur adhoc.click (pour eviter les reponses opaques)
		ret = await apiCall("/lodestone/check/"+newPseudo+"/"+nomIG+"/"+monde,"GET",null,true)
		if (ret.status==202)
			return newInfoPopup("Tu es inconnu du lodestone",
									 ["Je n'ai pas trouvé "+newPseudo+" "+nomIG+"@"+monde+" sur le Lodestone de FF14",
										"Vérifie bien les prénom, nom et monde que tu as indiqué",
										"Attention, il ne faut pas indiquer ton mot de passe pour FF14",
									 ],
									 "si cette erreur persiste, contacte Kikiadoc sur discord"
									)
		if (ret.status!=200)
			return newInfoPopup("Erreur d'accès sur le lodestone",
									 ["Je ne peux pas vérifier ton existance sur le lodestone de FF14",
										"car le lodestone ne me répond pas"
									 ],
									 "Recommence dans quelques minutes"
									)
		const ff14Id = ret.o.ff14Id

		if (! confirm(newPseudo+" "+nomIG+"@"+monde+"(Lodestone Id="+ff14Id+"),\n"+
								"tu vas recevoir un pseudo et une clé personnelle sera enregistrée sur ton appareil (PC ou smartphone).\n"+
								"En cas de changement d'équipement ou d'erreur, il faudra contacter Kikiadoc sur discord"))
			return;
		
		addNotification("Création de ta clé de crypto elliptique...","green",3)
		let jwkPublicKey = await crypoCreateKeyPair()
		if (! jwkPublicKey )
			return newInfoPopup("ATTENTION erreur GRAVE","Génération de la clé de crypto elliptique impossible","Contacte Kikiadoc")
		addNotification("Enregistrement de ton perso sur le server...","green",3)
		ret = await apiCall("/pseudos","PUT",
			{pseudo: newPseudo, nom: nomIG, monde: monde, ff14Id: ff14Id, jwkPublicKey: jwkPublicKey},
			true
		);
		if (ret.status==200) {
			addNotification(ret.o.pseudo+" enregistré");
 			storeIt("pseudo",ret.o.pseudo); pseudo=ret.o.pseudo;
			if (newPseudo!=ret.o.pseudo)
				newInfoPopup("Note bien ton pseudo","Le pseudo "+newPseudo+" est déjà attribué, je t'ai donc assigné le pseudo "+ret.o.pseudo);
			init();
		}
		else
		if (ret.status==403) {
			newInfoPopup("Contacte Kikiadoc sur Discord","Un joueur identique existe déjà dans mon Grimoire de Sécurité, tu as peut-être effacé les données de ton appareil ou changé d'appareil","Impossible d'enregistrer ton pseudo");
		}
		else {
			addNotification(ret.erreur+"("+ret.status+")","red",60 );
			newInfoPopup("ATTENTION",
									 [
										 "il y a eu un soucis lors de l'enregistrement de ton Pseudo",
										 "Info: "+ret.msg
									 ],
									 "Si besoin, contacter Kikiadoc sur Discord");
		}
	}
	
	/////////////////////////////////////////////////////////////////////
	// Popup mutijoueurs et gestion du chat
	/////////////////////////////////////////////////////////////////////
	let dspMultiPopup=$state(false);
	let messageText = $state(null); // via bind
	let messageScrollArea = $state(null); // via bind sur le domElement
	let chatMsgList=$state([]); // liste des messages recus
	let flagChat=$state(false); // indique le blink du flag de chat

	// gestion changement de la liste de chat
	// $: if(chatMsgList && messageScrollArea) { console.log("autoscoll updated values") ; scrollToBottom(messageScrollArea) }
  async function scrollToBottom(node) {
		// await tick();
		node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
	};
	
	// reception d'un message de notification (depuis le WS)
	function chatNotif(m) {
		// console.log("chatNotif",m)
		if (m.fromPseudo) {
			flagChat=true;
			addNotification(m.fromPseudo+": "+m.texte, "orange", m.duree, m.mp3 || "Ding");
		}
		else
			addNotification(m.texte, m.couleur, m.duree, m.mp3)
		if (m.admin) { 
			dspAdminMsg = m.texte;
			playDing("call-to-attention");
		}
		if (m.toPseudo == pseudo) {
			newInfoPopup("Message personnel de "+((m.fromPseudo)? m.fromPseudo : "la Grande Peluche"),m.toTexte,"")
			playDing("call-to-attention");
		}	
		chatMsgList.push(m);
		if (chatMsgList.length > 100) chatMsgList.slice(50)
		// chatMsgList = chatMsgList; // forece refresh inutile en runes5
		// console.log("chatNotifEnd",m)
	}
	
	// envoi d'un message
	function sendMsg() {
		if (messageText) {
			apiCall("/chatMsg","POST", {texte: messageText} );
			playSound("BlaBlaBla");
			messageText=null;
		}
	}
	
	// envoi d'un message d'admin
	function sendAdmin() {
		if (messageText) apiCall("/adminMsg","POST", {texte: messageText, admin:true} ) ;
		messageText=null;
	}

	/////////////////////////////////////////////////////////////////////
	// gestion de la liste des challenges
	/////////////////////////////////////////////////////////////////////
	const timerStart = 24* 3600000; // 24H
	const timerEnd = 24* 3600000; // 24H
	
	// clic dans la liste
	function listClick(infoPage) {
		playSound(infoPage.music || "Amelie"); // dans tous les cas bascule sur la musique de la lsite
		const dthNow = Date.now();
		if ( (pseudo.startsWith("Kikiadoc") || pseudo.startsWith("Grande")) && confirm("AccèsAdmin?") )
			return page=infoPage.n;
		if (infoPage.always )
			return page=infoPage.n;
		if (!infoPage.betaActive && (infoPage.start==0 || infoPage.end==0)) {
			audioAmbiance=true
			playSound(infoPage.music || "Amelie")
			return dspInfo = { back: "papier", titre: infoPage.texte, body: ["Patiente en écoutant la musique d'ambiance..."], trailer: "Pas de date de début annoncée" }
		}
		if (!infoPage.betaActive && dthNow <= infoPage.start)
			return dspInfo = { back: "papier", titre: infoPage.texte, body: ["Ce n'est pas encore commencé","Patiente en écoutant la musique d'ambiance..."] }
		if (!infoPage.viewAfter && dthNow >= infoPage.end)
			return newInfoPopup(infoPage.texte,"C'est terminé","Trop tard pour participer !!")
		// Si prerequis...
		if ( (infoPage.preReq>0) && (pageDone.find( (e) => e==infoPage.preReq) == undefined) )
			return newInfoPopup("Accès après prérequis","Pour accéder à ce challenge, tu dois avoir terminé "+infoPage.preLbl)
		// Ici le challenge est donc possible 
		page=infoPage.n
		if (infoPage.betaActive)
				return newInfoPopup("Accès en avant-première",
										 ["Tout n'est pas encore finalisé pour "+infoPage.texte,
											"Si remarque ou soucis, mp @kikiadoc ou message sur #discussions sur discord",
											"Ce que tu feras en avant-première pourra être réinitialisé si besoin mais tes gains éventuels resteront acquis"
										 ],
										  "Amuses-toi bien!");
	}

	//setup timer de la liste
	let timerIdList = null;
	function setupTimerList() {
		const dthNow = Date.now();
		let timer = 60000; // 1 minute
		for (const infoPage of pageList) {
			// clcul du libele de l'item de la liste
			infoPage.lbl = "Heu... ya un bug !";
			if (infoPage.start == 0 || infoPage.end == 0) {
				infoPage.cls= (infoPage.start)? "near" : "future";
				infoPage.lbl = "Masqué par une brume éthérée";
			}
			else if ( (dthNow <= infoPage.start-timerStart)) {
				infoPage.cls="near";
				infoPage.lbl = "Débute "+ jjmmhhmmss(infoPage.start);
			}
			else if ( (dthNow > infoPage.start-timerStart) && (dthNow <= infoPage.start)) {
				infoPage.cls="near";
				infoPage.lbl = "Débute dans " + countDownTo(infoPage.start) ;
				timer = 1000;
			}
			else if ( (dthNow > infoPage.end-timerEnd)  && (dthNow <= infoPage.end)) {
				infoPage.cls="active";
				infoPage.lbl = "Se termine dans " + countDownTo(infoPage.end) ;
				timer = 1000;
			}
			else if ( (dthNow >= infoPage.start)  && (dthNow <= infoPage.end)) {
				infoPage.cls="active";
				infoPage.lbl = "Se termine " + jjmmhhmmss(infoPage.end);
			}
			else if ( (dthNow >= infoPage.end) ) {
				infoPage.cls="past";
				infoPage.lbl = "Terminé " + jjmmhhmmss(infoPage.end);
			}
			// beta active ?
			infoPage.betaActive = infoPage.betaTest && (infoPage.start==0 || dthNow <= infoPage.start)
		}
		timerIdList = setTimeout(setupTimerList,timer);
		// refresh list
		pageList = pageList;
	}

	/////////////////////////////////////////////////////////////////////
	// Gestion des tags countdown
	/////////////////////////////////////////////////////////////////////
	// gestion des countdown
	let timerCountdownId = null
	function timerCountDown() {
		// console.log("timerCoundDownStart")
		let tblElt = document.getElementsByTagName('countdown')
		let nb = tblElt.length
		// console.log('countdown #elt in dom:',nb)
		for (let i = 0; i<nb; i++) {
			let elt = tblElt.item(i)
			let dth = parseInt(elt.getAttribute("dth"),10)
			// si timer echu, ne fait rien
			if (dth==0) continue
			if (dth>Date.now())
				elt.innerHTML = countDownTo(dth)
			else {
				elt.setAttribute('dth',0)
				elt.innerHTML = elt.getAttribute('txtTimeout') || "00:00:00"
				// propage l'event timeout
				console.log("event cdTimeout...")
				const event = new Event("cdTimeout",{ bubbles: true} );
				elt.dispatchEvent(event);
			}
		}
		// console.log("timerCoundDownEnd")
	}
	function startCountDown() {
		timerCountdownId = setInterval(timerCountDown,1000)
		timerCountDown()
		console.log("startCountdown")
	}
	function stopCountDown() {
		clearInterval(timerCountdownId)
		console.log("stopCountdown")
		timerCountdownId = null
	}
	/////////////////////////////////////////////////////////////////////
	// Gestion des clics avec attribute gphelp, popup info, divers popupinfo, bandeau clignotant etc...
	/////////////////////////////////////////////////////////////////////
	let dspInfo = $state(null)
	let dspObject = $state(null)
	let dspAdminMsg = $state(null); // affichage fenetre d'admin (contient direct le texte admin)
	function unknownClic(e) {
		// console.log(e)
		let gpHelp = e.target.getAttribute("gphelp")
		if (!gpHelp) gpHelp=e.gpHelpMark
		if (gpHelp) dspInfo={titre: "Explication", body: [gpHelp], trailer:"Ferme ce popup", img: "ff-7/ff-7-help.gif", back:"papier" }
		let gpImg = e.target.getAttribute("gpImg")
		if (!gpImg) gpImg=e.gpImgMark
		if (gpImg) dspInfo={ titre:"", body: [], trailer: "Ferme ce popup", imgTop: gpImg, back:"papier" }
		let gpVideo = e.target.getAttribute("gpVideo")
		if (!gpVideo) gpVideo=e.gpVideoMark
		if (gpVideo) playVideo(gpVideo)
	}
	function buildDspInfo(e) {
		// console.log(e)
		dspInfo = e.detail
		if (dspInfo.ding) { playDing(dspInfo.ding) }
		if (dspInfo.mp3) { playSound(dspInfo.mp3) }
	}
	function startBlinkGlobal() {
		const elt=document.getElementById('blinkGlobal')
		if (!elt) return console.log("blinkGlobal non défini dans le dom")
		elt.style.setProperty('display',"block")
		elt.style.setProperty('animation-play-state',"running")
		setTimeout(()=>{
			elt.style.setProperty('animation-play-state',"paused")
			elt.style.setProperty('display',"none")
		},3000)
	}

</script>


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
		vertical-align: top; 
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 3em;
		cursor: pointer;
		font-size: 1em;
		z-index:5000;
	}
	blinkGlobal {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 3em;
	 	z-index:9999;
		animation-duration: 0.2s;
		animation-name: blinkGlobalFrames;
		animation-iteration-count: 15;
		animation-play-state: paused;
		display:none
	}
	@keyframes blinkGlobalFrames {
		from { background-color: red; opacity: 100%}
		50% { background-color: red; opacity: 0%}
		to { background-color: red; opacity: 100%}
	}

	audio {
		width: 100%;
		height: 1.5em;
		background-color: grey;
		position: fixed;
		left: 0px;
		bottom: 0px;
		text-shadow: none ;
		font-family: "Times New Roman", Times, serif;
		z-index:5000;
	}
	back {
		background-image: url("https://cdn.adhoc.click/Oracle.png");
		width: 100%;
		height: 100%;
		background-color: pink;
		background-position: center;
		background-size: cover;
		position: fixed;
		z-index: -1;
		margin: 0;
		padding: 0;
		border:0;
		left: 0;
		top: 1.8em;
	}

	label { cursor: pointer; }
	:global(input) {	font-family: "Times New Roman";	font-size: 0.8em; cursor: pointer	}
	select {	font-family: "Times New Roman";	font-size: 1em;	}

	.pseudo { top: 0px; right: 0%; height: 2em; background-size:cover;	position: fixed; z-index: 1000; 	cursor: pointer; }
	.wsClass { top: 1.1em; right: 0px; height: 3%; position: fixed; z-index: 1000; 	cursor: pointer; }
	.wsClass0 { color: red }
	.wsClass1 { color: lightgreen }
	.wsClass2 { color: red }

	.future { color: red; font-style: italic; }
	.near { color: orange; font-style: italic; }
	.past { color: lightgrey; font-style: italic; }
	.active { color: lightgreen}
	.dejaFaite { color:orange; text-decoration: underline;  }

	/* popup de multi - envoi de messages */
	.messageCadre { border: 5px solid black; }
	.messageButton {  font-family: "Times New Roman"; font-size: 1em; width: 20%; cursor: pointer     }
	.messageText {  font-family: "Times New Roman"; font-size: 1em; width: 75%      }

	.beta { color:white; background-color: green;
					border: 2px solid white; border-radius: 5px;
				  font-size: 0.6em;
				  padding: 0.1em; 
	}
	
	.divVideo { display: none; z-index: 6000; position: fixed; top:0; left: 0;
						height: 80%; max-height: 80%; width: 80%; max-width: 80%; transform: translate(10%,10%); }
	.video { border: 0.2em solid white; height: 100%; max-height: 100%; width: 100%; max-width: 100%;  }

	.scrollbar { scrollbar-color: white green; scrollbar-width: thin; overflow-y: auto }

	.blinkFlag {
		color: white;
		outline: 2px solid white;
		border-radius: 25%;
		animation-duration: 2s;
		animation-name: blinkFlagFrames;
		animation-iteration-count: infinite;
	}
	@keyframes blinkFlagFrames {
		from { outline-color: black; }
		to { outline-color: white; }
	}

	/* Elt partagé */
	div :global(.adminCadre) { border: 2px solid red; background-color: black; margin: 2px }
	div :global(.papier) {
		background-color: grey;
		background-image: url("https://cdn.adhoc.click/texture-papier-noir.jpg");
		background-position: center;
	}
	div :global(.stars)  {
		background-color: grey;
		background-image: url("https://cdn.adhoc.click/stars.gif");
		background-position: center;
	}
	div :global(.popupCadre) {
		z-index: 7000;
		position: fixed;
		border: 2px outset red;
		border-radius: 10%;
		border-width: 5%;
		top: 20%;
		left: 20%;
    transform: translate(-10%, 0%);
		overflow: visible;
	}
	div :global(.popupZone) {
		padding: 1.5em 0.5em 1.0em 1.0em;
	}
	div :global(.popupContent) {
		max-height: 59vh; 
		min-height: 4em;
		min-width: 10em;
		scrollbar-color: white grey;
		scrollbar-width: thin;
		overflow-y: auto;
	}
	div :global(.close) {
		position: absolute;
		z-index: 5001;
		right: -0.3em;
		top: -0.5em;
		font-size: 2em;
		background: #E2E8F0;
		color: #64748B;
		border-radius: 6px;
		border: 2px outset yellow;
		cursor: pointer;
		display: block;
		overflow: visible;
		text-shadow: none;
	}
	div :global(.reveal) {
		border: 0.1em solid white;
		padding: 0.2em;
		margin-top: 0.5em;
		background-position: center;
		background-repeat: no-repeat; 
		background-size: cover; 
		background-color: black;
		background-image: url('https://cdn.adhoc.click/texture-papier-noir.jpg');
		color: white;
		animation-duration: 10s;
		animation-name: revealFrames;
		animation-iteration-count: 1;
	}
	@keyframes revealFrames {
	  from { color: black; }
		50% {color: #C0C0C0 }
	  to { color: white; }
	}
	:global(a) {color:lightgreen; text-decoration: unset; cursor: pointer}
	/* :global(a::hover) {!important color: red} */
	:global(a::after) {content: "🔎"; color: lightgreen}
	div :global(.br) { min-height: 0.4em; }
	:global(.videoLink) {color: lightgreen; text-decoration: unset; cursor: pointer}
	:global(.videoLink::after) {content: "📽"; color: lightgreen}
	:global(.imgLink) {color: lightgreen; text-decoration: unset; cursor: pointer}
	:global(.imgLink::after) {content: "📷"; color: lightgreen}
	:global(.parchemin) {
	  border: 0.5em 1em;
		padding: 1em 1em;
		margin: auto;
		max-width: 80%;
	  border-image-source: url("https://cdn.adhoc.click/ff-7/parchemin.png");
		border-image-repeat: stretch;
		border-image-slice: 2% 2% fill;
		text-align: center;
	}
	:global(.info) { font-style: italic; font-size: 0.8em }
	:global(.gpHelp) { color: lightgreen; cursor: pointer }
	:global(.selOui) { border: 4px inset red; cursor: pointer }
	:global(.selNon) { border: 4px outset #404040; cursor: pointer }
	:global(.selBad) { border: 4px solid #303030; color: #404040 }
	:global(sup) { color:lightblue }
	:global(.blinkMsg) {
		text-decoration-line: underline;
		text-decoration-style: double;
		text-decoration-color: black;
		animation-duration: 2s;
		animation-name: msgFrames;
		animation-iteration-count: infinite;
	}
	@keyframes -global-msgFrames {
		from { text-decoration-color: black; }
		to { text-decoration-color: white; }
	}

</style> 

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag -->


<div class="body" id="topPage" role="none" ondspObject={(e)=>dspObject=e.detail} ondspInfo={(e)=>buildDspInfo(e)} onclick={(e)=>unknownClic(e)}>
	<back>&nbsp;</back>
	<notifications id="notifications"></notifications>
	<titre>
		<div onclick={() => { page = 0; window.scroll(0,0); }} role="button" tabindex="0">
			<div style="font-size: 1.0em">La Grande Peluche</div>
			<div style="font-size: 0.6em">Enjoy ({version || 'DEV'})</div>
		</div>
		<div class="pseudo">
			{#if wsStatus==1}
				<span style="color: lightgreen" onclick={toggleDspPseudo} role="button" tabindex=0>
					{pseudo}
				</span>
			{:else}
				<span style="color: red;" onclick={toggleDspPseudo}  role="button" tabindex=0>
					{pseudo || "pseudo"} non validé
				</span>
			{/if}
			<span onclick={() => audioAmbiance=!audioAmbiance} role="button" tabindex=0>
				{#if audioAmbiance}🔊{:else}🔇{/if}
			</span>
		</div>
		<div class="wsClass wsClass{wsStatus}" id="syncStatus" onclick={() => {dspMultiPopup = true}} role="button" tabindex=0 >
			{#if flagChat}<span class="blinkFlag">💬</span>{/if}
			multijoueurs
		</div>
	</titre>
	<blinkGlobal id="blinkGlobal" />

	<audio style="visibility: hidden" id="ding"></audio>
	<audio style="visibility: hidden" id="musique"></audio>
	<audio style="visibility: hidden" id="tts" onended={()=>tryTTS(true)} onerror={(e)=>erreurTTS(e)}></audio>
	<div id="divVideo" class="divVideo">
		<div class="close" onclick={closeVideo} role="button" tabindex=0>X</div>
		<video id="video" class="video stars" width="1920" height="1080" controls preload="auto" >
			<track kind="captions" />
		</video>
	</div>

	<div id="contenu" class="contenu">
		{#if pseudo.startsWith("Kikiadoc")}
			<div class="adminCadre" style="font-size: 0.4em">
				<input type="button" value="show/hide Admin" onclick={() => showAdmin=!showAdmin} />
			</div>
			{#if showAdmin}
				<P0 wsCallComponents={wsCallComponents} pseudo={pseudo} initWS={init} bind:dspObject={dspObject} ></P0>
			{/if}
		{/if}
		{#if page == 0}
			<p>Bienvenue {pseudo}</p> 
			<p>Je suis la Grande Peluche Oracle Des Savoirs du Bois Bandé.</p>
			{#if !pseudo}
					<div>Pour participer, tu dois m'indiquer EXACTEMENT tes prénom, nom et monde InGame:</div>
					<div>
						<label>
							<input type="text" placeholder="prénomIG" id="pseudoRequest" maxlength=15>
						</label>
						<label>
							<input type="text" placeholder="nomIG" id="nomRequest" maxlength=15>
						</label>
						<select id="mondeRequest">
							<option>Cerberus</option>	<option>Louisoix</option>	<option>Moogle</option>	<option>Omega</option>
							<option>Phantom</option> <option>Ragnarok</option> <option>Sagittarius</option>	<option>Spriggan</option>
							<option>Alpha</option> <option>Lich</option> <option>Odin</option> <option>Phoenix</option>
							<option>Raiden</option>	<option>Shiva</option> <option>Twintania</option> <option>Zodiark</option>
						</select>
						<label>
							<input type="button" value="Valider ►" id="enregistrerPseudo" onclick={registerPseudo}>
						</label>
					</div>
			{:else}
				<div>Voici la liste de tes Possibles:</div>
				<div>
					<a class="active" target="_blank" 
						href="https://docs.google.com/spreadsheets/d/1_hho3TD2dr0kqIE-XBVhf6OW62lo2s3RAz_xc_Tkd2Y/edit?usp=sharing"
						onclick={() => playSound("Money")}	>
						👉 Consulter le grimoire des gains et plannings
					</a>
				</div>
				{#each pageList as page, i}
					{#if !page.hidden || pseudo.startsWith("Kikiadoc")}
						<div class="{page.cls}" >
								<span style="cursor: pointer" onclick={() => listClick(page)} role="button" tabindex=0>
									👉
									{#if page.hidden}<span class="beta">hidden</span>{/if}
									{#if page.betaActive}<span class="beta">Avant-première</span>{/if}
									{page.texte}
								</span>
								<br />
									{#if !page.always}
										{#if (pageDone.find((e) => e==page.n)!=undefined)}<span class="dejaFaite">Déjà faite</span>{/if}
										({page.lbl})
									{/if}
						</div>
					{/if}
				{/each}
			{/if}
			<hr/>
			<div style="cursor: pointer; color:lightgreen" onclick={() => dspAssistance = !dspAssistance} role="button" tabindex=0>
				👉 Assistance technique	{#if dspAssistance}⏫{:else}⏬{/if}
			</div>
			{#if dspAssistance}
				<div class="adminCadre">
					<div>Si tu as des "errreurs imprévues" ou un soucis d'accès au site:</div>
					<div>
						👉
						<a class="active" href={urlRaw+'securite/index.html'} target="_blank">
							Affichage de la page de diagnostic et assistance du site
						</a>
					</div>
					<hr />
					<!-- BUGGE
					<div>
						Utilise l'option suivante si des vidéos, des images ou des musiques
						ne semblent pas se télécharger normalement
					</div>
					<div>
						👉
						<a class="active" href="/adminTest/clearClientCache">
							Affichage de la page de purge du cache de ton navigateur
						</a>
					</div>
					<hr />
					-->
					<div>N'utilise l'option suivante qu'en cas de soucis et après avoir contacté Kikiadoc sur discord</div>
					<div>
						👉 <span style="cursor: pointer; color: red" onclick={clearStorage} role="button" tabindex=0>
						Effacer les données stockées sur ton appareil et liées à ce site: ff14.adhoc.click</span>
					</div>
				</div>
			{/if}
			{#if pseudo}
				<div style="cursor: pointer; color:lightgreen" onclick={() => dspCredits = !dspCredits} role="button" tabindex=0>
					👉 Crédits {#if dspCredits}⏫{:else}⏬{/if}
				</div>
			{/if}
			{#if dspCredits}
				<div class="adminCadre" style="font-size: 0.7em; font-style: italic;">
					<div>
						<a class="active" href={urlImg+'Architecture et conception du site ff14.adhoc.click.pdf'} target="_blank">
							Le code du site	et sa documentation technique
						</a>
						sont publiques, copiables et libres de droits.
						Licenses:
						<a class="active" href="https://fr.wikipedia.org/wiki/Licence_publique_g%C3%A9n%C3%A9rale_GNU" target="_blank">GPL</a>
						et
						<a class="active" href="https://fr.wikipedia.org/wiki/Licence_CC0" target="_blank">CC0</a>
					</div>
					<div>Ce site utilise différentes ressources lors de l'éxécution ou pendant la phase de développement:</div>
					<div>Des polices de caractères téléchargeables <a class="active" href="https://fonts.google.com/" target="_blank">Google Fonts</a></div>
					<div>Des samples de musiques et vidéos remixées depuis différentes sources dont
						<a class="active" href="https://youtube.com/" target="_blank">Youtube</a>
					</div>
					<div>Des fragments de code refactorés depuis
						<a class="active" href="https://github.com/" target="_blank">Github</a>
						ou
						<a class="active" href="https://stackoverflow.com/" target="_blank">Stackoverflow</a>
					</div>
					<div>
						Mention spéciale à Dale Harvey dont plusieurs centaines de lignes de code sont incluses dans le Kiki's Event IX:
						<a class="active" href="https://github.com/daleharvey/pacman" target="_blank">https://github.com/daleharvey/pacman</a>.
					</div>
					<div>
						Des informations sont récupérées dynamiquement depuis les sites
						<a class="active" href="https://fr.finalfantasyxiv.com/lodestone/playguide/db" target="_blank">Lodestone FF14</a>,
						<a class="active" href="https://www.garlandtools.org" target="_blank">Garland</a>
						<a class="active" href="https://ipinfo.io" target="_blank">ipinfo.io</a>
						et
						<a class="active" href="https://www.ipify.org" target="_blank">ipify.org</a>
					</div>
				</div>
			{/if}
			<div style="font-size: 0.7em; font-style: italic;">
				Sur ce site, ta vie privée est préservée au maximum:
				aucun cookie tiers, pas de lien avec d'autres sites, pas de publicite, pas de traçage. 
				Le stockage des informations nécessaires privilégie le stockage local sur ton appareil, 
				le serveur ne conserve que ton pseudo IG, ta clé publique pour vérifier tes requêtes
				et les infos strictement liées aux challenges, ta sécurité et celle du site.
				<div class="br"></div>
				Pour assurer ta sécurité, tout en restant simple d'usage, tes transactions sont protégées
				contre l'usurpation d'identité par des clés éphémères et signées par
				une clé privée élliptique stockée uniquement sur ton appareil.
				Ces clés sont générées de façon transparente et sans action de ta part, 
				afin que tu ne puisses pas réutiliser 
				un mot de passe utilisé sur un autre site et ne pas t'obliger à utiliser 
				tes identifiants Google, Discord, FesseLivre, TikToqué ou autres...
			</div>
		{/if}
		{#if page != 0}
			{#if PageComponent !== null}
				<PageComponent
					wsCallComponents={wsCallComponents}
					pageDesc={pageDesc}
					pseudo={pseudo}
					pseudoList={pseudoList}
					etatTTS={etatTTS}
					bind:page={page}
					bind:pageDone={pageDone} 
					bind:audioBack={audioBack}
					bind:audioAmbiance={audioAmbiance}
					bind:audioVolume={audioVolume}
					bind:dspObject={dspObject}
				/>
			{:else}
				<div>
					Le contenu de page n'est pas disponible dans cette configuration
				</div>
			{/if}
		{/if}
		
		<div style="min-height: 2em"></div>
	</div>

	{#if dspMultiPopup}
		<div class="popupCadre papier">
			<div class="close" onclick={() => { dspMultiPopup = false; flagChat=false}} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div style="font-size: 0.8em">
						{pseudoList.length} connecté{#if pseudoList.length > 1}s{/if} :
						{#each pseudoList as name, i}
							{name} &nbsp;
						{/each}
					</div>
					<div bind:this={messageScrollArea} class="messageCadre scrollbar" style="height: 7em" >
						{#each chatMsgList as o,i}
							<div style="font-size: 0.8em">{hhmmss(o.dth)} ({(o.fromPseudo)? o.fromPseudo : "Grande Peluche"}) {o.texte}</div>
						{/each}
					</div>
					<div>
						<input class="messageText" bind:value={messageText} type="text" maxlength="140" onkeypress={(e) => e.key=="Enter" && clickSur('sendMsgBtn')}/>
						<input class="messageButton" type="button" id="sendMsgBtn" value="►" onclick={sendMsg} />
						{#if pseudo=="Kikiadoc"}
							<input class="messageButton" type="button" value="AdminAlert" onclick={sendAdmin} />
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
			<div class="close" onclick={toggleDspPseudo} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Ton pseudo est {pseudo} ({desc.prenom} {desc.nom} @{desc.monde})</div>
					{#if es.jwkPrivateKey}
						<div>
							Tu as une 
							<a href="https://fr.wikipedia.org/wiki/Cryptographie_sur_les_courbes_elliptiques" target="_blank">
								clé cryptographique elliptique
							</a>
							valide sur cet appareil.
							<span style="color:lightgreen">Tes échanges sont cryptés, signés et vérifiés.</span>
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
					{#if ! audioAmbiance}
						<div style="color:red">
							Pour vérifier ou modifer les volumes sonores, active la musique d'ambiance
							en cliquant sur 🔊 en haut à droite de ton écran.
						</div>
					{/if}
					<div class="br"></div>
					<div>
						Mon volume audio général est actuellement de {audioVolume}% avant mixage par ton appareil.
						{#if audioVolume < 10 || audioVolume > 80}
							<span style="color:red">(conseillé entre 10% et 80%)</span>
						{:else}
							<span style="color:lightgreen">(conseillé entre 10% et 80%)</span>
						{/if}
					</div>
					<div><input style="width:80%" bind:value={audioVolume} id="newVolumeAudio" type="range" min=0 max=100 /></div>
					<div class="br">
						Le volume audio de ma
						<a href="https://fr.wikipedia.org/wiki/Synth%C3%A8se_vocale" target="_blank">
							voix
						</a>
						est actuellement de {audioTTS}% avant mixage par ton appareil.
						{#if audioTTS < 80}
							<span style="color:red">(conseillé entre 80 et 100%)</span>
						{:else}
							<span style="color:lightgreen">(conseillé entre 80 et 100%)</span>
						{/if}
						<input type="button" value="Je veux tester ta voix" onclick={(e)=>tts({o:{statique:true, file:"mavoix.mp3"}})} />
					</div>
					<div><input style="width:80%" bind:value={audioTTS} id="newVolumeTTS" type="range" min=0 max=100 /></div>
					<div>
						<label>
							<input bind:checked={audioBack} type="checkbox" />
							le son continue même si la fenêtre est minimisée ou cachée
						</label>
						{#if !audioBack}
							<div class="info">
								Par défaut, AudioBlaster coupe le son si la fenêtre de ton navigateur est masquée.
								Cela ne fonctionne pas automatiquement si tu utilises le site sur smartphone
								ou avec plusieurs écrans sur PC.
								Dans ce cas, sur windows, minimise la fenêtre de ton navigateur, 
								sur smartphone, repasse sur l'écran d'accueil.
							</div>
						{/if}
					</div>
					<hr />
					<div style="font-size: 0.8em">
						Les éléments ci-dessous sont pour information.
					</div>
					{#if dynMetro && dynMetro.srv} 
						{@const latence=Math.floor(1000*(( (dynMetro.cliRes - dynMetro.cliReq) - (dynMetro.srv.load + dynMetro.srv.run + 1.0) ) / 2.0))/1000}
						<div style="font-size: 0.8em">
							<div>Synchro temps réel:<input type="button" onclick={()=>newInfoPopup("debug",JSON.stringify(dynMetro,null,2))} value="🛈" /></div>
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
						<div style="color:yellow">Je n'ai pas encoré vérifié la synchronisation temporelle entre ton équipement et le serveur</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspInfo}
		<div id="dspInfo" class="popupCadre {dspInfo.back}" style="z-index:99998">
			<div class="close" onclick={()=>dspInfo=null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					{#if dspInfo.img}
						<img src={urlImg+dspInfo.img} style="float: right; width: 50%" alt="">
					{/if}
					{#if dspInfo.imgTop}
						<img src={urlImg+dspInfo.imgTop} style="width: 100%" alt="">
					{/if}
					<div class="info">{dspInfo.titre}</div>
					{#each dspInfo.body as p}
						<div>{p}</div>
					{/each}
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
	{/if}

	{#if dspAdminMsg}
		<div class="popupCadre papier" style="z-index:99999">
			<div class="close" onclick={()=>dspAdminMsg=null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent" style="color:red; font-size:1.2em">
					<div>Message important:</div>
					<div class="blinkMsg">
						{dspAdminMsg}
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspObject}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspObject=null} onkeypress={null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent" style="font-size:0.7em">
					<div>
						localDth: {mmssms(Date.now())} ({getEpsilon()}ms)
						<br/>
						<input bind:value={dspObject.dth2local} type="number" />
						<br/>
						{mmssms(dspObject.dth2local)}
						<countdown dth={dspObject.dth2local} txtTimeout="passé" />
					</div>
					<div><pre style="white-space: pre-wrap">{JSON.stringify(dspObject,null,2)}</pre></div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- page +page.svelte -->
