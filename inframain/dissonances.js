const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const tts = require('../infraback/tts.js');

// le COLNAME doit être celui dans le client "ROOTAPI" pour la synchro WS
const COLNAME="X-dissonances"


// contexte:  
// mu est le numéro de musique - le itemId pas l'indice
// X et Y sont l'entrée du donjon ou le lieu d'achat
// tip est une info complémentaire en plus du libellé en cas d'ambiguité sur le lieu
const MUSIQUES = [
	/*
	{ i: 0,	mu: 14222, x: 0.0, y: 0.0, tip: "" },
	{ i: 1,	mu: 14223, x: 0.0, y: 0.0, tip: "" },
	{ i: 2,	mu: 14225, x: 1.0, y: 0.0, tip: "" },
	{ i: 3,	mu: 14226, x: 2.0, y: 0.0, tip: "" },
	*/
	 { i: 0, mu: 14249, x:19.2, y:22.0, tip: "Le fléau d'Ultima" } // 28 : Ultima Thanalan septentrional X : 19.2 / Y : 22.0 
	,{ i: 1, mu: 14253, x:24.3, y: 8.9, tip: "Titan" } // 32 : Titan Nocéa extérieure X : 24.3 / Y : 8.9 
	,{ i: 2, mu: 15809, x: 3.0, y:21.2, tip: "Manteneige" } // 58 : Manteneige : Coert:has Hautes terres du Coerthas central : X : 3.0 / Y : 21.2
	,{ i: 3, mu: 16828, x:22.1, y:27.9, tip: "Dravania" } // 113 : Rise : Dravania X 22.1 Y 27.9
	,{ i: 4, mu: 17633, x:11.1, y: 7.1, tip: "La voûte" } // 130 : La voûte : Coerthas X : 11.1 Y :  7.1
	,{ i: 5, mu: 21281, x:12.6, y: 6.1, tip: "Le château de kugane" } // 176 : Le château de kugane : X : 12.6 Y : 6.1
	,{ i: 6, mu: 23319, x:21.4, y: 9.2, tip: "Le pilier des cieux" } // 222 : Le pilier des cieux - Mer de Rubis (X 21.4,Y 9.2)
	,{ i: 7, mu: 27906, x:24.1, y:30.5, tip: "Dhon mheg" } // 306 : Norvrandt Dhon mheg : X 24.1 y 30.5
	,{ i: 8, mu: 28878, x: 9.9, y:11.2, tip: "Cristarium" } // 324 : Cristarium X : 9.9 Y : 11.2
	,{ i: 9, mu: 33844, x:35.3, y:18.2, tip: "Tour de la contingence" } // 425 : Tour de la contingence X : 35.3 Y : 18.2 Kholusia
	,{ i:10, mu: 37423, x:31.2, y:28.1, tip: "Ultima Thule" } // 494 : Ultimatulé Etherite principale (X : 31.2 Y : 28.1)
	,{ i:11, mu: 44300, x:21.4, y:28.6, tip: "Alexandrie - Mémoire vivante" } // 637 : Alexandrie - Mémoire vivante  (X : 21.4 Y : 28.6)
	,{ i:12, mu: 36348, x:10.9, y: 7.8, tip: "Tour de babil" } // 453 : Tour de babil- garlemald - (X : 10.9 Y : 7.8)
	,{ i:13, mu: 17624, x:26.6, y:25.8, tip: "Port-aux-Ales" } // 117 : Porto ales - Nocea (X : 26.6 Y : 25.8)
	,{ i:14, mu: 22604, x: 9.7, y: 8.9, tip: "Kugane A VERIFIER" } // 216 : Kugane	X : 9.7 Y : 8.9
	,{ i:15, mu: 28878, x:12.8, y:10.6, tip: "Macle de syrus" } // 324 :  Macle de syrus - Cristarium X : 12.8  Y : 10.6
	,{ i:16, mu: 21286, x:12.1, y:10.5, tip: "Kugane A VERIFIER" } // 175 : Sunrise - Kugane X : 12.1 Y : 10.5
	,{ i:17, mu: 36353, x:21.4, y:11.2, tip: "Mare Lamentorum" } // 458 : Mare lomentum : X 21.4 y 11.2
	,{ i:18, mu: 37436, x: 6.1, y: 6.1, tip: "Gold saucer" } // 507 : Gold saucer X : 6.1 Y : 6.1
	,{ i:19, mu: 38641, x: 9.8, y:11.1, tip: "Les deux vipères" } // 548 : les deux vipères X : 9.8 Y : 11.1
	,{ i:20, mu: 44296, x:13.1, y:32.7, tip: "Worqor Zormor" } // 633 : Worqor Zormor X 13.1 Y 32.7
	,{ i:21, mu: 44307, x:19.6, y:21.3, tip: "Poids mi-lourds CCA - match 3" } // 670 : Burning souls : S96 - X 19.6 Y 21.3
	,{ i:22, mu: 39598, x:30.7, y:35.8, tip: "Lapis Manalis" } // 544 : Deep blue (X 30.7 Y 35.8)
	,{ i:23, mu: 17625, x:13.1, y:12.0, tip: "Ishgard" } // 118 : Ishgard (X 13.1 Y 12.0)
	,{ i:24, mu: 48210, x:21.9, y:13.2, tip: "Expédition cosmique" } // 733 : Marelomentum expedition cosmique X 21.9 Y 13.2
]
const TIMERSUCCES = 70000 // la musique change toutes les 5 minutes
const TIMERWAIT = 30000 // delai d'attente apres decouverte
const TIMERAIDE = 7*60000 // delai d'attente pour aider les autres
const NBDISSONANCES = 25 // nombre de dissonances a identifier

const CONF = { MUSIQUES:MUSIQUES, TIMERWAIT: TIMERWAIT, TIMERSUCCES: TIMERSUCCES, NBDISSONANCES:NBDISSONANCES, TIMERAIDE:TIMERAIDE }
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.nbDissonances ??= 0
	e.pseudos ??= {}
	return e
}
// synch clients
function syncClients(texte) {
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	collections.save(etat)
	if (texte) wsserver.broadcastSimpleText(texte, "Ding" ,null, 10)
}
// Reset global du mini-jeu
function globalReset() {
	etat = normalize(collections.reset(COLNAME))
	syncClients()
}
// Force persque termine
function setAll() {
	syncClients()
}
// recupere l'etat actualisé
function getEtat() {
	return etat
}
// recupere un etat de pseudo avec init si besoin
function getEtatPseudo(pseudo) {
	etat.pseudos[pseudo] ??= { pseudo: pseudo, solIdx: null, muIdx: 0, muDth: 0, score: 0 }
	return etat.pseudos[pseudo]
}
// reinitialise les indices de l'etat du pseudo
// NB: pas touche aux timers d'indice
function initIndices(e) {
	e.iNom=null
	e.iLieu=null
	e.m1=null
	e.m2=null
	e.m3=null
}
// recupere une musique dans les musiques possibles
// TODO
// A FAIRE: choisir selon un tirage des non proosé + round robbin
function getNextMusique() {
	return Math.floor(Math.random()*MUSIQUES.length)
}
//
// place en mode d'attente de l'éta du pseudo
function modeWait(e) {
	e.solIdx = null
	e.muIdx = 0
	e.muDth = Date.now()
	initIndices(e)
}
// place en mode de musique de l'éta du pseudo
function modeMusique(e,i) {
	e.solIdx = i
	e.muIdx = MUSIQUES[i].mu
	e.muDth = Date.now()
	initIndices(e)
}
// recalcul de l'etat d'un pseudo
function recalcEtatPseudo(pseudo){
	let e = getEtatPseudo(pseudo)
	console.log("recalcEtatPseudo",pseudo,e)
	// si pas de musique en cours et que timerrenew échu
	if ( (e.muIdx==0) && (e.muDth + TIMERWAIT <= Date.now()) ) {
		// il faut une nouvelle musique pour le joeur
		modeMusique(e,getNextMusique())
		syncClients()
		return
	}
	// si musique en cours et que timersucces échu
	if ( (e.muIdx!=0) && (e.muDth + TIMERSUCCES <= Date.now()) ) {
		// pas de musique en cours
		modeWait(e)
		syncClients()
		return
	}
}
// proposition d'une dissonance
// 200: ok, 201: erreur
function proposition(pseudo,reqPaths) {
  let x = gbl.checkFloat(reqPaths[3],0,100)
  let y = gbl.checkFloat(reqPaths[4],0,100)
	let e = getEtatPseudo(pseudo)
	if (e.muIdx && gbl.isDistance(x,y,MUSIQUES[e.solIdx].x,MUSIQUES[e.solIdx].y,0.1) ) {
		// bonne proposition
		e.score++
		etat.nbDissonances++
		modeWait(e)
		syncClients()
		gbl.exception( "ok via ws" , 200) 
	}
	else {
		// mauvaise  proposition
		gbl.exception( "mauvais proposition" , 201) 
	}
}
// ajout d'un indice
// 200 indice ajouté, 201 indice déjà inciqué
async function ajoutIndice(pseudo,reqPaths,body) {
	let indice = JSON.parse(body)
	let e = getEtatPseudo(indice.to) // pseudo ciblé
	let o = getEtatPseudo(pseudo) // pseudo origine
	switch(indice.t) {
		case "n": // nom de partition
			if (e.iNom) gbl.exception("iNom deja défini",201)
			e.iNom=pseudo
			o.iDth=Date.now()
			break
		case "l": // lieu de partition
			if (e.iLieu) gbl.exception("iLieu deja défini",201)
			e.iLieu=pseudo
			o.iDth=Date.now()
			break
		case "m": // message perso
			e.m3=e.m2
			e.m2=e.m1
			e.m1={ p: pseudo, m: indice.m}
			o.mDth=Date.now()
			break
		default: gbl.exception ("Erreur type indice",400)
			break
	}
	// incrémente le muDth d'une ms pour provoquer une synchro client (oui je sais c'est crade)
	e.muDth++
	o.muDth++
	syncClients()
	// post traitement pour le TTS
	switch(indice.t) {
		case "n":
		case "l":
			tts.sendTTS (null,[
				{statique:true,  file: ( gbl.escapeTexte(pseudo) )+'.mp3' },
				{statique:true,  file: ( gbl.escapeTexte("a matérialisé un indice pour") )+'.mp3' },
				{statique:true,  file: ( gbl.escapeTexte(e.pseudo) )+'.mp3'  }
			])
			break
		case "m":
			tts.sendTTS (null,[
				{statique:true,  file: ( gbl.escapeTexte(pseudo) )+'.mp3' },
				{statique:true,  file: ( gbl.escapeTexte("a crafté une tunique temporelle pour ") )+'.mp3' },
				{statique:true,  file: ( gbl.escapeTexte(e.pseudo) )+'.mp3'  },
				{statique:true,  file: ( gbl.escapeTexte("et lui a dit") )+'.mp3' },
				{statique:false, file: await tts.pubSrvTTS(indice.m) }
			])
			break
	}
	gbl.exception ("via ws",200)
}
//
// API Calls
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "config":
					// retroune la config globale
					gbl.exception( CONFJSON , 200, true) 
				case "etat":
					recalcEtatPseudo(pseudo)
					// retroune l'état global
					gbl.exception( getEtat() , 200) 
				case "reqUpdate":
					recalcEtatPseudo(pseudo)
					gbl.exception( getEtatPseudo(pseudo) , 200) 
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "proposition":
					proposition(pseudo,reqPaths)
					// gbl.exception( "ok via ws" , 200) 
				case "indice":
					await ajoutIndice(pseudo,reqPaths,body)
					// gbl.exception( "ok via ws" , 200) 
			}
			gbl.exception(COLNAME+" post",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			switch(reqPaths[2]) {
				case "etat":
					globalReset()
					gbl.exception( getEtat() , 200) 
				case "setAll":
					setAll()
					gbl.exception( getEtat() , 200) 
			}
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
