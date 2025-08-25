const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');

const COLNAME="lesbases"
const L=10 // 10x4
const C=4 // 10x4
const LOCKTIMER=20000 

const ZONES = [
		/* 0-0 */ { x: 0.0  , y: 0.0  , l:"zone???" },
		/* 0-1 */ { x: 0.0  , y: 0.0  , l:"zone???" },
		/* 0-2 */ { x: 0.0  , y: 0.0  , l:"zone???" },
		/* 0-3 */ { x: 11.7 , y: 11.2 , l:"Norvrandt" },
		/* 1-0 */ { x: 22.7 , y: 21.2 , l:"Steppes d'Azim" },
		/* 1-1 */ { x: 18.4 , y: 26.8 , l:"Alabathia", c:1 },
		/* 1-2 */ { x: 0.0  , y: 0.0, l:"zone???", c:1 },
		/* 1-3 */ { x: 0.0  , y: 0.0, l:"zone???" },
		/* 2-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 2-1 */ { x: 0.0, y: 0.0, l:"zone???", c:1 },
		/* 2-2 */ { x: 0.0, y: 0.0, l:"zone???", c:1 },
		/* 2-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 3-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 3-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 3-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 3-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 4-0 */ { x: 0.0, y: 0.0, l:"zone???", c:2 },
		/* 4-1 */ { x: 0.0, y: 0.0, l:"zone???", c:2 },
		/* 4-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 4-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 5-0 */ { x: 0.0, y: 0.0, l:"zone???", c:2 },
		/* 5-1 */ { x: 0.0, y: 0.0, l:"zone???", c:2 },
		/* 5-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 5-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 6-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 6-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 6-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 6-3 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 7-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 7-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 7-2 */ { x: 0.0, y: 0.0, l:"zone???", c:3 },
		/* 7-3 */ { x: 0.0, y: 0.0, l:"zone???", c:3 },
		/* 8-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 8-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 8-2 */ { x: 0.0, y: 0.0, l:"zone???", c:3 },
		/* 8-3 */ { x: 0.0, y: 0.0, l:"zone???", c:3 },
		/* 9-0 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 9-1 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 9-2 */ { x: 0.0, y: 0.0, l:"zone???" },
		/* 9-3 */ { x: 0.0, y: 0.0, l:"zone???" }
]
const ZONESJSON=JSON.stringify(ZONES)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	if (!e.L) {
		e.L = L
		e.C = C
		e.LOCKTIMER = LOCKTIMER
		e.elts = new Array(L*C)
		for (let i=0; i < L*C; i++)
			e.elts[i] ??= { i: i, trouvePseudo: null, trouveDth: 0, tryPseudo: null, tryEcheance: 0, confirmPseudo: null, confirmDth: 0, nbSondes:0, radiations: 0  }
	}
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
		if (ZONES[ee.i].c) { // si zone cible
			ee.confirmPseudo??=pseudo
			ee.confirmDth??=Date.now()
		}
	})
	syncClients()
}
// une zone est trouvée doit être par le lock
function proposition(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,L*C - 1)
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
	let idx = gbl.checkInt(reqPaths[3],0,L*C - 1)
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
	let idx = gbl.checkInt(reqPaths[3],0,L*C - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (! e.trouvePseudo) gbl.exception("zone non trouvee: "+idx,400)
	if (e.nbSondes >= 3) gbl.exception("trop de sondes: "+idx,400)
	// ajoute une sonde
	e.nbSondes++
	// incrément
	let rad = e.nbSondes * Math.random()*30
	// ajoute un petit random pour que ce soit toujours incremntal
	e.radiations += Math.random()
	// ajoute la rad si en dessous du plafond
	if (e.radiation+rad < (ZONES[idx].c)? 95.0 : 300.0) e.radiations += rad
	// si derniere sonde assure qu'un non cible soit > 105
	if ((e.nbSondes) >= 3 && (!ZONES[idx].c) && (e.radiations < 105) ) {
			// ajuste a 105 et ajoute un random
			e.radiations += (105-e.radiations) + Math.floor(Math.random()*30)
	}
	syncClients(pseudo+" a envoyé une sonde vers le lieu #"+(idx+1))
}
// une demande de confirmation
function confirmation(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,L*C - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (! e.trouvePseudo) gbl.exception("zone non trouvee: "+idx,400)
	if (e.confirmPseudo) gbl.exception("zone deja validée "+idx,400)
	e.confirmPseudo=pseudo
	e.confirmDth=Date.now()
	syncClients(pseudo+" a indiqué le lieu #"+(idx+1)+" comme propice à un Pharao")
}
// une demande d'infirmation
function infirmation(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,L*C - 1)
	let e = etat.elts[idx]
	// les precond sont vérifiées sur le client
	if (! e.trouvePseudo) gbl.exception("zone non trouvee: "+idx,400)
	if (! e.confirmPseudo) gbl.exception("zone non validée "+idx,400)
	// MANQUE LA VERIF DU PSEUDO - pas grave
	e.confirmPseudo=null
	e.confirmDth=0
	syncClients(pseudo+" ne considère plus le lieu #"+(idx+1)+" comme propice à un Pharao")
}
// pas d'accord sur ce lieu
function pasdaccord(pseudo,reqPaths) {
	let idx = gbl.checkInt(reqPaths[3],0,L*C - 1)
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
				case "zones":
					// retroune les zones
					gbl.exception( ZONESJSON , 200, true) 
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
			gbl.exception("phareo post",400);
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
			gbl.exception("phareo delete",400);
	}
	gbl.exception("inv lesbases http op",400);
}

console.log("phareo loaded")
