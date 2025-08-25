const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

const COLNAME="orthocerberus"

const OBJETSDESC = [
	{ t:"t", cx:-2,  cy:0, cz:0, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise de la Malvenue" }
]
const OBJ3DDESC = {
	gpBombRouge:		{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kikiBomb-rouge13.glb"},
	gpBombVert:			{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kikiBomb-vert2.glb"},
	gpBombOrange:		{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kikiBomb-orange.glb"},
	gpBoy:					{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kiki-boy3.glb"},
	gpGirl:					{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kiki-girl2.glb"},
	gpTabCheck:			{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kiki-tableauNoir-check.glb"},
	gpTabUnCheck:		{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kiki-tableauNoir-uncheck.glb"},
	gpGoaRing:			{ cx: 0.0, cy:0.0, cz:0.0, rx:-Math.PI/2, ry: 0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kiki-GoaRing.glb"},
	gpHarmonique:		{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"kiki-harmonique2.glb"},
	gpGlaceMog:			{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"glacemog.glb"},
	gpEdgeMiniature:{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"edgeminiature.glb"},
	gpEnkidu:				{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 0.1, sy: 0.1, sz: 0.1, glb:"enkidu.glb"},
	gpCidMiniature:	{ cx: 0.0, cy:0.0, cz:0.0, rx:0.0, ry:0.0, rz: 0.0, sx: 2.1, sy: 2.1, sz: 2.1, glb:"cidminiature.glb"}
}
const WORLD3DDESC = { 
	PATH:"expansion/",
	WORLDSIZE: 100,
	CAM:{ x:0, y:0.1, z:0, speed:0.2, minZ:0.2, maxZ:250, minY:0.8, elipsX:0.19, elipsY:0.19, elipsZ:0.19 },
	LIGHT:{ x:0, y: 10, z:0, colorR:0.8, colorG:0.3, colorB:0.6 },
	SKYBOX: "space",
	ROOTDESC:{ glb:"city_rtx.glb" },
	OBJ3DDESC:OBJ3DDESC
}

const CONF = { COLNAME:COLNAME, OBJETSDESC:OBJETSDESC, WORLD3DDESC:WORLD3DDESC }
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
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
	// A FAIRE 
	syncClients()
}
// recupere l'etat actualisé
function getEtat() {
	return etat
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
			/*
			switch(reqPaths[2]) {
				case "propositionQuestion":
					propositionQuestion(pseudo,reqPaths,body)
					// gbl.exception( "ok via ws" , 200) 
				case "propositionComposant":
					propositionComposant(pseudo,reqPaths,body)
					// gbl.exception( "ok via ws" , 200) 
			}
			*/
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
