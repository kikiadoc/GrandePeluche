const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');
const lodestone = require('../infraback/lodestone.js');

// nom de la collection dans le datastore
const COLNAME="S-codex-challenge"

const CONF= {
}
const CONFJSON = JSON.stringify(CONF)

// Reset global
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	etat = normalize(collections.reset(COLNAME))
	etat.idx = oldMasterIdx
	etatSync()
}
// Etat global
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	// e.idx ??= 0
	return e
}
// Sauvegarde de l'etat
function etatSync(texte) {
	collections.save(etat)
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	if (texte) wsserver.broadcastSimpleText(texte, "Ding" , "lightgreen", 10)
}


///////////////////////////////////////////////////////////////////////////////
// API Calls
// API Calls
// API Calls
///////////////////////////////////////////////////////////////////////////////
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd) // auth par defaut
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// retroune l'état global
					gbl.exception( etat , 200) 
       case "conf":
          // retroune la conf en JSON direct
          gbl.exception( CONFJSON , 200, true)
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "challengeDef":
					// TEST POUR L5INSTANT
					const json = JSON.parse(body)
					etat.challenge = { Q: json.Q, R: json.R, echeance: Date.now()+120000 }
					etatSync()
          gbl.exception( etat , 200, true)
			}
			gbl.exception(COLNAME+" post",400);
		case "PATCH": 
			gbl.exception(COLNAME+" patch",400);
		case "DELETE":
			switch(reqPaths[2]) {
				case "all":
					pseudos.check(pseudo,pwd,true) // adm only
					globalReset()
					gbl.exception( etat , 200) 
			}
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
