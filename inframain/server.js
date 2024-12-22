#!/usr/bin/env node

const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const httpserver = require('../infraback/httpserver.js');
const wsserver = require('../infraback/wsserver.js');
const hautsFaits = require('../infraback/hautsFaits.js');
const jetons = require('../infraback/jetons.js');
const discord = require('../infraback/discord.js');
const adminTest = require('../infraback/adminTest.js');
const lodestone = require('../infraback/lodestone.js');
const voirVideos = require('../infraback/voirVideos.js');
const tts = require('../infraback/tts.js');
const clientConfig = require('../inframain/clientConfig.js');
const innommable = require('../inframain/innommable.js');
const torches = require('../inframain/torches.js');
const asciens = require('../inframain/asciens.js');
const pnjs = require('../inframain/pnjs.js');
const doctrineDuMal = require('../inframain/doctrineDuMal.js');
const uploadFile = require('../inframain/uploadFile.js');
const usinesGaz = require('../inframain/usinesGaz.js');
const spartaci = require('../inframain/spartaci.js');
const omega = require('../inframain/omega.js');
// inutile const votation = require('../infraback/votation.js');
// inutile const webAuth = require('../infraback/webAuth.js');

async function httpCallback(req, res, method, reqPaths, body, pseudo, pwd) {
	switch(reqPaths[1]) {
		case "pseudos": await pseudos.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "collections": collections.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "lodestone": await lodestone.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "jetons": jetons.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "hautsFaits": hautsFaits.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "voirVideos": voirVideos.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "discord": await discord.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "adminTest": await adminTest.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "innommable": innommable.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "clientConfig": clientConfig.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "uploadFile": await uploadFile.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "tts": await tts.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// eleents liés aux activités présentes
		case "torches": torches.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "asciens": asciens.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "pnjs": await pnjs.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "doctrineDuMal": await doctrineDuMal.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "usinesGaz": await usinesGaz.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
	 	case "spartaci": await spartaci.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
	 	case "omega": await omega.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
	}
	gbl.exception( { m: method, rp: reqPaths, body: body, pseudo: pseudo, pwd: pwd  } ,404);
}
function wsCallback(jsonMessage) {
	gbl.exception("Wscallback Bad opcode",400);
};


/////////////
// Verification de l'intégrité des trucs bancales
/////////////
async function checkBeforeStart() {
	// vérification du parse du lodestone si maj de son contennu
	const ff14Id = await lodestone.getFF14Id("Kikiadoc","Lepetiot","Moogle");
	if (ff14Id != 12945273)
		discord.mpKiki("serveur restart, lodetsone issue (idKiki=12945273) found ff14id="+ff14Id);
	else
		console.log('***** Pas de modif struture du lodestone, PARSEUR OK')
}

/////////////
// Diagnostic périodique
/////////////
let lastMem=null
function diagnostic() {
	let mem=""
	for (const [key,value] of Object.entries(process.memoryUsage())) {
		mem += " "+key+"="+Math.floor(value/1000000)
	}
	if (lastMem != mem) {
		lastMem = mem
		console.log("Memory (MB):" + mem)
	}
}
setInterval(diagnostic,1000)

/////////////
// Start service
/////////////
const HTTPPORT = gbl.isProd() ? 7070 : 7072
const WSPORT = gbl.isProd() ? 7071 : 7073
checkBeforeStart()
console.log("HTTPPORT=",HTTPPORT)
console.log("WSPORT=",WSPORT)
discord.start(null)
wsserver.start(wsCallback, WSPORT)
httpserver.start(httpCallback, HTTPPORT)

