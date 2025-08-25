const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

// nom de la collection
// pas de collectin, uniquement en mémoire


// etat des persos doans le monde3D
let etat = normalize({})

function normalize(e) {
	e.pseudos ??= {}
	return e
}
// Reset global du monde3D
function globalReset() {
	console.warn("reset root3D")
	etat = normalize({})
}
// WS msgs (op=root3D.sync)
function syncPseudo(pseudo,m) {
	console.log(pseudo,m)
	etat.pseudos[pseudo] ??= { p: pseudo }
	if (m.loc) etat.pseudos[pseudo].loc = m.loc
	if (m.enter) etat.pseudos[pseudo].pre = true
	if (m.leave) etat.pseudos[pseudo].pre = false
	wsserver.broadcastSimpleOp("root3D.sync", etat.pseudos[pseudo])
}
// WS msgs (op=root3D.sync)
exports.wsMsg = (pseudo,m) => {
	switch(m.op) {
		case "root3D.sync": return syncPseudo(pseudo,m)
	}
}
//
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
					gbl.exception( { etat: etat } , 200) 
			}
			gbl.exception("root3D get",400);
		case "POST": 
			switch(reqPaths[2]) {
			}
			gbl.exception("metropolis post",400);
		case "DELETE": 
			switch(reqPaths[2]) {
				case "all":
					pseudos.check(pseudo,pwd,true); // auth admin
					globalReset()
					gbl.exception("root3D delete all ok",200);
			}
			gbl.exception("root3D delete",400);
	}
	gbl.exception("inv root3D http op",400);
}

console.log("root3D loaded")
