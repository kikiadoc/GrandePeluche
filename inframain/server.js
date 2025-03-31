#!/usr/bin/env node

const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const httpserver = require('../infraback/httpserver.js');
const wsserver = require('../infraback/wsserver.js');
const hautsFaits = require('../infraback/hautsFaits.js');
const discord = require('../infraback/discord.js');
const adminTest = require('../infraback/adminTest.js');
const lodestone = require('../infraback/lodestone.js');
const tts = require('../infraback/tts.js');
const chat = require('../infraback/chat.js');
const metrologie = require('../inframain/metrologie.js');
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
const metropolis = require('../inframain/metropolis.js');
const rubans = require('../inframain/rubans.js');
const shared = require('../inframain/shared.js');
// inutile const votation = require('../infraback/votation.js');
// inutile const webAuth = require('../infraback/webAuth.js');

async function httpCallback(req, res, method, reqPaths, body, pseudo, pwd) {
	switch(reqPaths[1]) {
		case "pseudos": await pseudos.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "collections": collections.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "lodestone": await lodestone.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "hautsFaits": hautsFaits.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "discord": await discord.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "adminTest": await adminTest.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "innommable": innommable.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "clientConfig": await clientConfig.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "uploadFile": await uploadFile.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "tts": await tts.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "chat": await chat.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "metrologie": await metrologie.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "rubans": await rubans.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "shared": await shared.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// eleents liés aux activités présentes
		case "metropolis": await metropolis.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// eleents liés aux activités anciennes
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
function wsCallback(pseudo,m) {
	switch (m.op) {
		case "metro.sync":
			metropolis.syncPseudo(pseudo,m)
			return
		case "metro.emote":
			metropolis.emote(pseudo,m)
			return
	}
	gbl.exception("ERREUR FATALE: Bad ws op",400);
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
let lastMemTick = 0
function diagnosticMemory() {
	let mem=""
	lastMemTick++;
	let usage=process.memoryUsage()
	if (usage.external > 50000000 && lastMemTick > 5) {
		lastMemTick=0
		if (global.gc) {
			console.log("*** Force GC *** external > 50M")
			global.gc()
		}
		else
			console.log("*** Force GC *** Non autorisé --expose-gc manqunt")
	}
	for (const [key,value] of Object.entries(process.memoryUsage())) {
		mem += " "+key+"="+Math.floor(value/1000000)
	}
	if (lastMem != mem) {
		lastMem = mem
		console.log("Memory (MB):" + mem)
	}
}
function diagnostic() {
	diagnosticMemory()
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
