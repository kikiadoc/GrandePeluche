const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

const COLNAME="orthocomposants"

const LIEUX=[
	{i:0,		lbl:"Sauna"},
	{i:1,		lbl:"Chambre du temps"},
	{i:2,		lbl:"Le Labyrinthe"},
	{i:3,		lbl:"L'enterprise"},
	{i:4,		lbl:"Chambre du 4ème pouvoir"},
	{i:5,		lbl:"Chambre de la force"},
	{i:6,		lbl:"Bureau de la Grande Peluche"},
	{i:7,		lbl:"Chambre de **TBD** lecoquin"},
]
const OBJETS = [
	/* 0-0  */ {l: 0,	x: 0.0, y: 0.0, lbl: "nomObj0", q:"Question...0" },
	/* 0-1  */ {l: 1,	x: 0.0, y: 0.0, lbl: "nomObj1", q:"Question...1" },
	/* 0-2  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj2", q:"Question...2" },
	/* 0-3  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 0-4  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 0-5  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 1-0  */ {l: 0,	x: 0.0, y: 0.0, lbl: "nomObj0", q:"Question...0" },
	/* 1-1  */ {l: 1,	x: 0.0, y: 0.0, lbl: "nomObj1", q:"Question...1" },
	/* 1-2  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj2", q:"Question...2" },
	/* 1-3  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 1-4  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 1-5  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 2-0  */ {l: 0,	x: 0.0, y: 0.0, lbl: "nomObj0", q:"Question...0" },
	/* 2-1  */ {l: 1,	x: 0.0, y: 0.0, lbl: "nomObj1", q:"Question...1" },
	/* 2-2  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj2", q:"Question...2" },
	/* 2-3  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 2-4  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 2-5  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 3-0  */ {l: 0,	x: 0.0, y: 0.0, lbl: "nomObj0", q:"Question...0" },
	/* 3-1  */ {l: 1,	x: 0.0, y: 0.0, lbl: "nomObj1", q:"Question...1" },
	/* 3-2  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj2", q:"Question...2" },
	/* 3-3  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 3-4  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 3-5  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 4-0  */ {l: 0,	x: 0.0, y: 0.0, lbl: "nomObj0", q:"Question...0" },
	/* 4-1  */ {l: 1,	x: 0.0, y: 0.0, lbl: "nomObj1", q:"Question...1" },
	/* 4-2  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj2", q:"Question...2" },
	/* 4-3  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 4-4  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 4-5  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 5-0  */ {l: 0,	x: 0.0, y: 0.0, lbl: "nomObj0", q:"Question...0" },
	/* 5-1  */ {l: 1,	x: 0.0, y: 0.0, lbl: "nomObj1", q:"Question...1" },
	/* 5-2  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj2", q:"Question...2" },
	/* 5-3  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 5-4  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
	/* 5-5  */ {l: 2,	x: 0.0, y: 0.0, lbl: "nomObj3", q:"Question...3" },
]
const MAP= [
	{ nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 },
	{ nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 },
	{ nb: 3000000 }, { nb: 3000000 }, { nb: 9000000 }, { nb: 9000000 }, { nb: 3000000 }, { nb: 3000000 },
	{ nb: 3000000 }, { nb: 3000000 }, { nb: 9000000 }, { nb: 9000000 }, { nb: 3000000 }, { nb: 3000000 },
	{ nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 },
	{ nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }, { nb: 3000000 }
]
const CONF = { lieux: LIEUX, objets: OBJETS, MAP: MAP, SIZE: 6, TIMERPSEUDO: 8*3600000, TIMERELIXIR: 3600000 }
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.questions ??= new Array(OBJETS.length)
	for (let i=0; i < OBJETS.length; i++)
		e.questions[i] ??= { i: i, pseudo: null, pseudoEcheance: 0, premierPseudo: null, premierDth: null  }
	e.composants ??= new Array(CONF.SIZE*CONF.SIZE)
	for (let i=0; i < CONF.SIZE*CONF.SIZE; i++)
		e.composants[i] ??= { i:i, elixirPseudo: null, elixirDth: 0  }
	recalcElixirsNb(e,0)
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
function setAll(pseudo) {
	for (let i=0; i < CONF.SIZE*CONF.SIZE; i++) {
		etat.composants[i].elixirPseudo = pseudo
		etat.composants[i].elixirDth = Date.now()
	}
	syncClients()
}
// recalc elixirsNb de l'etat e et ajoute ajout
function recalcElixirsNb(e,ajout) {
	// let delta=(lastRecalcElixirsNbDth) ? now-lastRecalcElixirsNbDth : 0
	let now=Date.now()
	e.elixirsNb??=0
	e.elixirsDth??=now // si aucun calcul précedent
	e.elixirsNb = Math.max(e.elixirsNb - ( now-e.elixirsDth ) , 0) + ajout
	e.elixirsDth = now
}
// recupere l'etat actualisé
function getEtat() {
	return etat
}
// proposition de reponse à une question
// 200 si ok, 201 si pas assez d'élixir
function propositionQuestion(pseudo,reqPaths,body) {
  let idx = gbl.checkInt(reqPaths[3],0,OBJETS.length -1)
  // verification de la proposition (precond sur le client pour le dth)
  let obj = OBJETS[idx]
	let jBody = JSON.parse(body)
	if ( (obj.l != jBody.l) || !gbl.isDistance(jBody.x,obj.x,jBody.y,obj.y,0.1) ) gbl.exception("mauvaise coordonnées",400)
	etat.questions[idx].pseudo=pseudo
	etat.questions[idx].pseudoEcheance=Date.now() + CONF.TIMERPSEUDO
	etat.questions[idx].elixirEcheance=Date.now() + CONF.TIMERELIXIR
	etat.questions[idx].premierPseudo??=pseudo
	etat.questions[idx].premierDth??=Date.now()
	let nb = Math.floor(3200000 * (0.9+0.2*Math.random() )) // +/- 10%
	recalcElixirsNb(etat,nb) // ajout d'elixir
  syncClients(pseudo+" a extrait "+nb+" rmol d'élixir")
	/*
	// notif discord de disponibilité d'un elixir
	discord.postMessage("expansion",
		"Coucou c'est Hildiscord.\n\n"+
		pseudo+" a extrait des molécules d'élixir à utiliser rapidement car elles se desintrègrent au fil du temps."
		true)
	*/
	gbl.exception( "ok via ws" , 200) 
}
// proposition de reponse à un composant
// 200 si ok, 201 si pas assez d'élixir
function propositionComposant(pseudo,reqPaths,body) {
  let idx = gbl.checkInt(reqPaths[3],0,etat.composants.length -1)
  // verification de la proposition (precond sur le client pour le dth)
  let c = etat.composants[idx]
	if (c.elixirPseudo) gbl.exception("composant trouvé, client unsynch",400)
	let nb=MAP[idx].nb
	recalcElixirsNb(etat,0) // recalc elixirsNb au dth now
	if (etat.elixirsNb < nb)  gbl.exception("elixirsNb insuffisant",201)
	c.elixirPseudo = pseudo
	c.elixirDth = Date.now()
	recalcElixirsNb(etat,-nb) // retrait d'elixir
  syncClients(pseudo+" a utilisé "+nb+" rmol d'élixir et phasé un composant")
	gbl.exception( "ok via ws" , 200) 
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
					// retroune la config globale
					gbl.exception( CONFJSON , 200, true) 
				case "etat":
					// retroune l'état global
					gbl.exception( getEtat() , 200) 
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "propositionQuestion":
					propositionQuestion(pseudo,reqPaths,body)
					// gbl.exception( "ok via ws" , 200) 
				case "propositionComposant":
					propositionComposant(pseudo,reqPaths,body)
					// gbl.exception( "ok via ws" , 200) 
			}
			gbl.exception(COLNAME+" post",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			switch(reqPaths[2]) {
				case "resetAll":
					globalReset()
					gbl.exception( getEtat() , 200) 
				case "setAll":
					setAll(pseudo)
					gbl.exception( getEtat() , 200) 
			}
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
