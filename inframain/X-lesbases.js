const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');

const COLNAME="X-lesbases"
const LOCKTIMER=20*60000 
const GILS=50

const ZONES = [
		/* 0-0 */ { x:21.3, y:21.2, l:"Xak Tural" },							// 0 solution neuf
		/* 0-1 */ { x:22.0, y: 5.1, l:"Splendeurs" },							// 1 Mor dhona
		/* 0-2 */ { x:12.5, y: 9.7  , l:"Gyr Abania" },						// 2 etendue de rahlg
		/* 0-3 */ { x:11.7, y: 11.2 , l:"Norvrandt" },						// 3
		/* 1-0 */ { x:22.7, y: 21.2 , l:"Steppes d'Azim" },				// 4
		/* 1-1 */ { x:18.4, y: 26.8 , l:"Alabathia", c:1 },				// 5
		/* 1-2 */ { x:18.0, y:13.3, l:"Thanalan", c:1 },					// 6 Thanalan méridonal
		/* 1-3 */ { x: 9.3, y:23.5, l:"Norvrandt" },							// 7 Norrandt la tempete
		/* 2-0 */ { x:22.4, y: 7.9, l:"Yok Tural" },							// 8 Yak tel
		/* 2-1 */ { x:14.1, y:17.3, l:"Thanalan", c:1 },					// 9 Thanalan oriental
		/* 2-2 */ { x:26.0, y:37.6, l:"Noscea", c:1 },						// 10 noscea basse
		/* 2-3 */ { x:26.8, y:22.5, l:"Gyr Abania" },							// 11 Les marges
		/* 3-0 */ { x:14.4, y:30.5, l:"Sombrelinceul" },					// 12 Foret du sud
		/* 3-1 */ { x:21.4, y: 7.9, l:"Espace" },									// 13 Mare lamentorium
		/* 3-2 */ { x: 4.9, y:38.4, l:"Norvrandt" },							// 14 Kholusia
		/* 3-3 */ { x:34.4, y:25.1, l:"Coerthas" },								// 15 Haute terre du coerthas
		/* 4-0 */ { x: 3.8, y: 2.3, l:"Othard", c:2 },						// 16 Doma
		/* 4-1 */ { x:12.1, y:12.5, l:"Coerthas", c:2 },					// 17 Coerthas - empyree
		/* 4-2 */ { x:37.3, y:17.4, l:"Norvrandt" },							// 18 Norvrandt rak'tika
		/* 4-3 */ { x:34.0, y:30.2, l:"Norvrandt" },							// 19 Norvrandt la tempete
		/* 5-0 */ { x:11.3, y:21.7, l:"Thanalan", c:2 },					// 20 Thanalan oriental
		/* 5-1 */ { x:20.8, y:26.3, l:"Sombrelinceul", c:2 },			// 21 Foret du nord
		/* 5-2 */ { x:21.9, y:26.8, l:"Gyr Abania" },							// 22 Les Marges
		/* 5-3 */ { x:30.6, y:32.9, l:"Yok Tural" },							// 23 Yak tel
		/* 6-0 */ { x:21.5, y:18.2, l:"Espace" },									// 24 Mare lamentorum
		/* 6-1 */ { x: 4.6, y: 8.6, l:"Mers du nord" },						// 25 Mers du nord sharlayan
		/* 6-2 */ { x:17.6, y:18.7, l:"Sombrelinceul" },					// 26 Foret de l'est
		/* 6-3 */ { x:21.7, y:30.9, l:"Gyr Abania" },							// 27 Les pics
		/* 7-0 */ { x:26.0, y:23.1, l:"Thanalan" },								// 28 Thanalan septentrional
		/* 7-1 */ { x: 7.9, y:27.5, l:"Mers du Nord" },						// 29 Mers du Nord- labyrinthos
		/* 7-2 */ { x: 6.7, y:11.3, l:"Sombrelinceul", c:3 },			// 30 Vielle gridania 
		/* 7-3 */ { x:34.1, y:35.7, l:"Xak Tural", c:3 },					// 31 L'hoirie recouvrée
		/* 8-0 */ { x:22.2, y:36.5, l:"Inéphémère" },							// 32 mémoire vivante
		/* 8-1 */ { x: 8.7, y:11.1, l:"Gyr Abania" },							// 33 Les marges
		/* 8-2 */ { x: 7.9, y: 5.6, l:"Othard", c:3 },						// 34 Doma
		/* 8-3 */ { x:33.1, y: 5.7, l:"Isalbard", c:3 },					// 35 Garlemald
		/* 9-0 */ { x:28.6, y:37.3, l:"Isalbard" },								// 36 Thavnair
		/* 9-1 */ { x: 8.5, y:15.1, l:"Oriental" },								// 37 Shirogane - 
		/* 9-2 */ { x:32.6, y:24.6, l:"Dravania" },								// 38 Dravania - ecume des cieux
		/* 9-3 */ { x:20.1, y:21.0, l:"Noscea" }									// 39 Noscea orientale
]
const NBLIEUX = ZONES.length
const NBSONDES = 3

const CONFIG = {
	COLNAME:COLNAME,
	NBLIEUX: NBLIEUX,
	NBSONDES: NBSONDES,
	PC: { C:4, L: NBLIEUX/4 },
	SM: { C:2, L: NBLIEUX/2 },
	GILS:GILS,
	LOCKTIMER:LOCKTIMER,
	ZONESCIBLESNB: ZONES.reduce( (a,v) => (v.c)? a+1:a , 0),
	ZONES:ZONES
}

const CONFIGJSON=JSON.stringify(CONFIG)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.elts ??= new Array(NBLIEUX)
	for (let i=0; i < NBLIEUX; i++)
		e.elts[i] ??= { i: i, trouvePseudo: null, trouveDth: 0, tryPseudo: null, tryEcheance: 0, confirmPseudo: null, confirmDth: 0, nbSondes:0, radiations: 0  }
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
	console.warn("Collection reset pour lesbases")
	etat = normalize(collections.reset(COLNAME))
	syncClients()
}
// Force persque termine
function setAll(pseudo) {
	console.warn("Collection setAll pour lesbases")
	etat.elts.forEach( (ee) => {
		ee.tryPseudo=null
		ee.tryEcheance=null
		ee.trouvePseudo??=pseudo
		ee.trouveDth??=Date.now()
		ee.nbSondes =  NBSONDES
		if (ZONES[ee.i].c) { // si zone cible
			ee.confirmPseudo??=pseudo
			ee.confirmDth??=Date.now()
		}
	})
	syncClients()
}
// une zone est trouvée doit être par le lock
function proposition(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,NBLIEUX - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (e.trouvePseudo) gbl.exception("idx deja trouve:"+idx,400)
	if (e.tryDth<Date.now()) gbl.exception("timeout de reservation:"+idx,400)
	if (e.tryPseudo!=pseudo) gbl.exception("idx lock par un autre:"+idx,400)
	// trouve
	e.trouvePseudo=pseudo
	e.trouveDth=Date.now()
	e.tryPseudo=null
	e.tryEcheance=0
	syncClients(pseudo+" a découvert le lieu #"+(idx+1))
}
// une zone est en tentative
function tentative(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,NBLIEUX - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (e.trouvePseudo) gbl.exception("idx deja trouve:"+idx,400)
	if (e.tryPseudo && e.tryDth>Date.now() ) gbl.exception("idx deja en try:"+idx,400)
	// reset des tentatives précédentes
	etat.elts.forEach( (ee) => {
		if (ee.tryPseudo==pseudo) {
			ee.tryPseudo=null
			ee.tryEcheance=0	
		}
	})
	// pseudo en tentative
	e.tryPseudo=pseudo
	e.tryEcheance=Date.now() + LOCKTIMER
	syncClients()
}
// une sond est envoyée 
function sonde(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,NBLIEUX - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (! e.trouvePseudo) gbl.exception("zone non trouvee: "+idx,400)
	if (e.nbSondes >= NBSONDES) gbl.exception("trop de sondes: "+idx,400)
	// ajoute une sonde
	e.nbSondes++
	// ajout aléatoire selon nature de la zone
	// CAP: < 60 ou > 60 si sismique
	e.radiations += 10 + Math.random() * ( (ZONES[idx].c)? 10:15)
	// capping inférieur dans le cas ou la zone de sismicité est insuffisante et derniere sonde
	if (e.nbSondes>=NBSONDES && !ZONES[idx].c && e.radiations < 65) {
		e.radiations = 66 + Math.random() * 4
	}
	syncClients(pseudo+" a envoyé une sonde vers le lieu #"+(idx+1))
}
// une demande de confirmation
function confirmation(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,NBLIEUX - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (! e.trouvePseudo) gbl.exception("zone non trouvee: "+idx,400)
	if (e.confirmPseudo) gbl.exception("zone deja validée "+idx,400)
	e.confirmPseudo=pseudo
	e.confirmDth=Date.now()
	syncClients(pseudo+" a indiqué le lieu #"+(idx+1)+" comme propice à une base Pharao")
}
// une demande d'infirmation
function infirmation(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,NBLIEUX - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (! e.trouvePseudo) gbl.exception("zone non trouvee: "+idx,400)
	if (! e.confirmPseudo) gbl.exception("zone non validée "+idx,400)
	// MANQUE LA VERIF DU PSEUDO - pas grave
	e.confirmPseudo=null
	e.confirmDth=0
	syncClients(pseudo+" ne considère plus le lieu #"+(idx+1)+" comme propice à une base Pharao")
}
// pas d'accord sur ce lieu
function pasdaccord(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,NBLIEUX - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (! e.trouvePseudo) gbl.exception("zone non trouvee: "+idx,400)
	if (! e.confirmPseudo) gbl.exception("zone non validée "+idx,400)
	const dF = discord.getDiscordByPseudo(pseudo)
	const dT = discord.getDiscordByPseudo(e.confirmPseudo)
	const dFrom = (dF)? "<@"+dF.usrId+">" : "**"+pseudo+"(erreur discord ID)**"
	const dTo		= (dT)? "<@"+dT.usrId+">" : "**"+e.confirmPseudo+"(erreur discord ID)**"
	wsserver.broadcastSimpleText(pseudo+" ne pense pas, contrairement à "+(e.confirmPseudo)+", que le lieu #"+(idx+1)+" soit un lieu propice à une base Pharao", "Ding" ,null, 10)
	discord.postMessage("expansion",
		"Coucou c'est Hildiscord.\n\n"+
		"Ceci est un message de "+dFrom+" à destination de "+dTo+":\n\n"+
		dFrom+" pense que le lieu #"+(idx+1)+", choisi par"+dTo+", n'est pas un lieu propice à l'établissement d'une base Pharao.\n\n"+
		"**Echangez dans le canal de discussion ou en vocal pour vous mettre d'accord**.\n\n"+
		"PS: "+dTo+", tu peux annuler ta validation en cliquant sur le lieu #"+(idx+1)+" puis cliquer sur le bouton 'infirmer' pour infirmer ta sélection.\n",
		false)
}

// API Calls
exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "config":
					// retroune les zones
					gbl.exception( CONFIGJSON , 200, true) 
				case "etat":
					// retroune l'état global
					gbl.exception( etat , 200) 
			}
			gbl.exception("phareo get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "tentative":
					tentative(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
				case "proposition":
					proposition(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
				case "sonde":
					sonde(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
				case "confirmation":
					confirmation(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
				case "infirmation":
					infirmation(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
				case "pasdaccord":
					pasdaccord(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
			}
			gbl.exception(COLNAME+" post",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			switch(reqPaths[2]) {
				case "etat":
					globalReset()
					gbl.exception( etat , 200) 
				case "setAll":
					setAll(pseudo)
					gbl.exception( etat , 200) 
			}
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
