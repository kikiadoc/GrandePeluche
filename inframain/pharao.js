const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

// nom de la collection
const COLNAME="pharao"
const SIZE=6 // 6x6 lieux et objets

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	if (!e.size) {
		e.size = SIZE
		e.elts = new Array(SIZE*SIZE)
		for (let i=0; i < SIZE*SIZE; i++)
			e.elts[i] ??= { trouvePseudo: null, trouveDth: null, posePseudo: null, poseDth: null, targetIdx: i }
		gbl.shuffle(e.elts)
	}
	return e
}
// synch clients
function syncClients() {
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	collections.save(etat)
}
// Reset global du mini-jeu
function globalReset() {
	console.warn("Collection reset pour phareo")
	etat = normalize(collections.reset(COLNAME))
	syncClients()
}
// Force un positionnement presque termine (debug)
function setAll() {
	console.warn("Collection setAll pour phareo")
	// les deux premiers sont à échanger, le reste est bien positionné
	etat.elts[0] = { trouvePseudo: "Kikiadoc", trouveDth: Date.now(), posePseudo: "Kikiadoc", poseDth: Date.now(), targetIdx: 1 }
	etat.elts[1] = { trouvePseudo: "Kikiadoc", trouveDth: Date.now(), posePseudo: "Kikiadoc", poseDth: Date.now(), targetIdx: 0 }
	for (let i=2; i < SIZE*SIZE; i++)
			etat.elts[i] = { trouvePseudo: "Kikiadoc", trouveDth: Date.now(), posePseudo: "Kikiadoc", poseDth: Date.now(), targetIdx: i }
	syncClients()
}
// analyse une proposition
function proposition(pseudo,reqPaths) {
	// verification de la proposition
	console.warn("******************* Verif proposition a faire")
	// proposition ok
	// recherche d'un elt non découvert
	let tblPossibles = []
	for (let i=0; i < SIZE*SIZE; i++) {
		if ( ! etat.elts[i].trouvePseudo ) tblPossibles.push(i)
	}
	if (tblPossibles.length == 0) gbl.exception("Aucune proposition possible",400)
	// choix d'un element parmi les possibles
	let choix = tblPossibles[Math.floor(tblPossibles.length*Math.random() )]
	// maj de l'etat
	etat.elts[choix].trouvePseudo = pseudo
	etat.elts[choix].trouveDth = Date.now()
	// etat.elts[choix].posePseudo = pseudo
	// etat.elts[choix].poseDth = Date.now()
	syncClients()
}
// echange de deux elements
function swapElt(pseudo,reqPaths) {
	let pFrom = gbl.checkInt(reqPaths[3],0,SIZE*SIZE - 1)
	let pTo = gbl.checkInt(reqPaths[4],0,SIZE*SIZE - 1)

	etat.elts[pFrom].posePseudo = pseudo
	etat.elts[pFrom].poseDth = Date.now()
	etat.elts[pTo].posePseudo = pseudo
	etat.elts[pTo].poseDth = Date.now()
	let t = etat.elts[pFrom]
	etat.elts[pFrom] = etat.elts[pTo]
	etat.elts[pTo] = t
	syncClients()
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
				case "etat":
					// retroune l'état global
					gbl.exception( etat , 200) 
			}
			gbl.exception("phareo get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "proposition":
					proposition(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
				case "swap":
					swapElt(pseudo,reqPaths)
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
					setAll()
					gbl.exception( etat , 200) 
			}
			gbl.exception("phareo delete",400);
	}
	gbl.exception("inv phareao http op",400);
}

console.log("phareo loaded")
