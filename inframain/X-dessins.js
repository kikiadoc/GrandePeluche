const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

// nom de la collection
const COLNAME="X-dessins"

const REVEALDELAI = 60000 // delai par nombre de reveal
const CLICDELAI = 30000 // delai minimum entre clics
const NBDESSINS = 24
const REVEALS_DEF =  { l:3, c:3, o:[ 7,9,8,4,6,5,2,3,1 ] }  // #0 ordre par niveau de révélation

const CONF = {
	SM: { C:3, L:8 },
	PC: { C:6, L:4 },
	GOAL: NBDESSINS, // nombre de decouverte pour le challenge
	GILS: 50, // gils maximum
	REVEALDELAI: REVEALDELAI,
	CLICDELAI: CLICDELAI,
	DESSINS: [
			{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x:34.1, y:11.3, reveal: REVEALS_DEF, png: "X-dessins/Cirina_X31.4_Y11.3.png",			loc: "Steppes d'Azim" } // zone nord ouest apres les quêtes
		,	{ x: 6.1, y: 5.9, reveal: REVEALS_DEF, png: "X-dessins/Tataru.png"				,					loc: "Refuge des Roches" }
		,	{ x: 6.1, y: 5.9, reveal: REVEALS_DEF, png: "X-dessins/fortemps.png",								loc: "Manoir des Fortemps" } // hisgard
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/Kiki-lebogosse.png",					loc: "Brumée" }		// coor a faire
		,	{ x: 6.0, y: 6.1, reveal: REVEALS_DEF, png: "X-dessins/Hancock_6.0_6.1.png",				loc: "Kugane" }	// salle d'accueil du bazar de rubis kugane
		,	{ x:11.9, y: 6.3, reveal: REVEALS_DEF, png: "X-dessins/Sphene_11.9_6.3.png",				loc: "Solution neuf" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
		,	{ x: 0.0, y: 0.0, reveal: REVEALS_DEF, png: "X-dessins/test-khloe-raw.gif",					loc: "Idyllée" }
 	]
}
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.dessins ??= Array(NBDESSINS)
	e.pseudos ??= {}
	for (let i=0;  i < NBDESSINS; i++) {
		e.dessins[i] ??= { revealNb: 0, revealEcheance: 0, decouvertPseudo: null, decouvertDth: 0 }
	}
	return e
}
// synch clients
function syncClients(texte,ding) {
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	collections.save(etat)
	if (texte) wsserver.broadcastSimpleText(texte, ding ,null, 10)
}
// Reset global du mini-jeu
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	etat = normalize(collections.reset(COLNAME))
	syncClients(COLNAME+": Admin reset")
}
// Force un positionnement presque termine (debug)
function setAll(pseudo) {
	console.warn("Collection setAll pour",COLNAME)
	for (let i=0; i < NBDESSINS; i++) {
		etat.dessins[i].ratio = 100
		etat.dessins[i].revealNb = 9
		etat.dessins[i].decouvertPseudo ??= pseudo
		etat.dessins[i].decouvertDth ??= Date.now()
	}
	syncClients("Admin: setAll !! PAS TERMINE "+COLNAME)
}

// get etat par un pseudo
function getPseudo(pseudo) {
	etat.pseudos[pseudo] ??= { pseudo: pseudo }
	return etat.pseudos[pseudo]
}

// revelation dessin i, les prerequis sont vérifiés sur le client
function reveal(pseudo,i) {
	let d = etat.dessins[i]
	if (d.revealNb<9) {
		d.revealNb++
		d.revealEcheance = Date.now() +  REVEALDELAI * (d.revealNb+1)
	}
}
// reponse dessin i, les prerequis sont vérifiés sur le client
function reponse(pseudo,i) {
	etat.dessins[i].decouvertPseudo = pseudo
	etat.dessins[i].decouvertDth = Date.now()
}

// API Calls
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// init le pseudo si besoin
					getPseudo(pseudo)
					syncClients()
					gbl.exception( "via ws" , 200) 
       case "config":
          // retroune les zones en JSON direct
          gbl.exception( CONFJSON , 200, true)
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "reveal":
					reveal(pseudo,gbl.checkInt(reqPaths[3],0,NBDESSINS-1))
					syncClients()
					gbl.exception( "ok via ws" , 200) 
				case "reponse":
					reponse(pseudo,gbl.checkInt(reqPaths[3],0,NBDESSINS-1))
					syncClients()
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
