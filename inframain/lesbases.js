const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

const COLNAME="lesbases"
const L=10 // 10x4
const C=4 // 10x4
const LOCKTIMER=60000 

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	if (!e.L) {
		e.L = L
		e.C = C
		e.LOCKTIMER = LOCKTIMER
		e.elts = new Array(L*C)
		for (let i=0; i < L*C; i++)
			e.elts[i] ??= { i: i, trouvePseudo: null, trouveDth: 0, tryPseudo: null, tryEcheance: 0  }
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
	console.warn("Collection reset pour lesbases")
	etat = normalize(collections.reset(COLNAME))
	syncClients()
}
// Force persque termine
function setAll() {
	console.warn("Collection setAll pour lesbases")
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
	syncClients()
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
				case "tentative":
					tentative(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
				case "proposition":
					proposition(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
			}
			gbl.exception("phareo post",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			switch(reqPaths[2]) {
				case "etat":
					globalReset()
					gbl.exception( etat , 200) 
			}
			gbl.exception("phareo delete",400);
	}
	gbl.exception("inv lesbases http op",400);
}

console.log("phareo loaded")
