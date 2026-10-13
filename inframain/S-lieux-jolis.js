const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const discord = require('../infraback/discord.js');

// nom de la collection dans le datastore
const COLNAME="S-lieu-joli"


const CONF= {
	NBLIEUXMIN: 3,				// nombre minimal de lieux pour faire un challenge
	NBLIEUXMAX: 10,				// nombre max de lieux pour faire un challenge
	NBVOTESMIN: 3,				// nombre minimal de votes pour valider un challenge
	MONDES: gbl.MONDES,		// tableau des mondes
	HOUSING: gbl.HOUSING,	// tableau des leux de housing
}
const CONFJSON = JSON.stringify(CONF)

// Reset global
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	let oldIdx = etat.idx
	etat = normalize(collections.reset(COLNAME))
	etat.idx = oldIdx // conserve l'idx meme apes un reset global
	etatSync()
}
// Etat global
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	// retourn l'etat normalizé
	e.histo	??= {}	// liste des lieux déjà reconnus comme "Lieu-Joli" indexe par leur clef
	e.pool	??= {}	// liste des lieux à proposer pour la compétitioa indexe par leur clef
	e.idx ??= 0
	return e
}
// Sauvegarde de l'etat (sans synchro multijoueurs)
function etatSync() {
	collections.save(etat)
}
// clef d'indexation
function getClef(json) {
	gbl.checkInt(json.lieuType,1,4)
	gbl.checkInt(json.lieuMonde,1,CONF.MONDES.LENGTH)
	gbl.checkInt(json.lieuLoc,1,CONF.HOUSING.LENGTH)
	gbl.checkInt(json.lieuSlot,0,60)
	gbl.checkInt(json.lieuChambre,0,999)
	gbl.checkInt(json.lieuAppart,0,9999)
	return json.lieuType+"-"+json.lieuMonde+"-"+json.lieuLoc+"-"+json.lieuSlot+"-"+json.lieuChambre+"-"+json.lieuAppart
}
function lieuIn(obj,clef) {
	return obj[clef] || null 
}
// Ajoute ou modifie une proposition
function lieuxProposition(pseudo,jsonBody) {
	// calcul de la clef de localisation
	let clef = getClef(jsonBody)
	// la clef existe déjà ?
	if (lieuIn(etat.histo,clef)) gbl.exception("Impossible, le lieu "+clef+" est déjà dans l'historique",400)
	let lieu = lieuIn(etat.pool,clef) // recupere le lieu si dans le pool
	
}
///////////////////////////////////////////////////////////////////////////////
// API Calls
// API Calls
// API Calls
///////////////////////////////////////////////////////////////////////////////
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd) // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE');
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
			gbl.exception(COLNAME+" post",400);
		case "PATCH": 
			gbl.exception(COLNAME+" patch",400);
		case "DELETE":
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
