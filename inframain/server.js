// main
const process = require('node:process');
const serverTiming = {}
serverTiming.boot = { Uptime: process.uptime(), Time: process.hrtime(), Memory: process.memoryUsage() }

const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const httpserver = require('../infraback/httpserver.js');
const wsserver = require('../infraback/wsserver.js');
const hautsFaits = require('../infraback/hautsFaits.js');
///////////////
serverTiming.midRequires1 = { Time: process.hrtime(serverTiming.boot.Time), Memory: process.memoryUsage() }
///////////////
const discord = require('../infraback/discord.js');
const adminTest = require('../infraback/adminTest.js');
const lodestone = require('../infraback/lodestone.js');
///////////////
serverTiming.midRequires2 = { Time: process.hrtime(serverTiming.boot.Time), Memory: process.memoryUsage() }
///////////////
const tts = require('../infraback/tts.js');
///////////////
serverTiming.midRequires3 = { Time: process.hrtime(serverTiming.boot.Time), Memory: process.memoryUsage() }
///////////////
const chat = require('../infraback/chat.js');
const uploadFile = require('../inframain/uploadFile.js');
const securityReport = require('../inframain/securityReport.js');
const metrologie = require('../inframain/metrologie.js');
const root3D = require('../inframain/root3D.js');
///////////////
serverTiming.midRequires4 = { Time: process.hrtime(serverTiming.boot.Time), Memory: process.memoryUsage() }
///////////////
// const innommable = require('../inframain/innommable.js');
// const torches = require('../inframain/torches.js');
// const asciens = require('../inframain/asciens.js');
// const pnjs = require('../inframain/pnjs.js');
// const doctrineDuMal = require('../inframain/doctrineDuMal.js');
// const usinesGaz = require('../inframain/usinesGaz.js');
// const spartaci = require('../inframain/spartaci.js');
// const omega = require('../inframain/omega.js');
// const metropolis = require('../inframain/metropolis.js');
const ventesprivees = require('../inframain/X-ventesprivees.js');
const prelude = require('../inframain/X-prelude.js');
const cherchezlelala = require('../inframain/X-cherchezlelala.js');
const pharao = require('../inframain/X-pharao.js');
const lesbases = require('../inframain/X-lesbases.js');
const dissonances = require('../inframain/X-dissonances.js');
const barathym = require('../inframain/X-barathym.js');
const orthocomposants = require('../inframain/X-orthocomposants.js');
const tranquilite = require('../inframain/X-tranquilite.js');
const dessins = require('../inframain/X-dessins.js');
// inutile const votation = require('../infraback/votation.js');
// inutile const webAuth = require('../infraback/webAuth.js');
// Elements pour les privilieges
const codex = require('../inframain/S-codex.js');
// Elements pour des tests
const clientConfig = require('../inframain/clientConfig.js');
const rubans = require('../inframain/rubans.js');
const shared = require('../inframain/shared.js');
///////////////
serverTiming.endRequires = { Time: process.hrtime(serverTiming.boot.Time), Memory: process.memoryUsage() }
///////////////

async function httpCallback(req, res, method, reqPaths, body, pseudo, pwd) {
	switch(reqPaths[1]) {
		case "pseudos": await pseudos.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "collections": await collections.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "contextes": await collections.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "lodestone": await lodestone.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "hautsFaits": hautsFaits.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "discord": await discord.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "adminTest": await adminTest.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "uploadFile": await uploadFile.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "tts": await tts.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "chat": await chat.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "metrologie": await metrologie.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "securityReport": await securityReport.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// eleents liés aux test
		case "clientConfig": await clientConfig.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "rubans": await rubans.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "shared": await shared.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// eleents liés aux activités présentes
		case "X-ventesprivees": await ventesprivees.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "X-prelude": await prelude.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "X-cherchezlelala": await cherchezlelala.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// eleents liés aux evenements
		case "X-pharao": await pharao.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "X-lesbases": await lesbases.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "X-orthocomposants": await orthocomposants.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "X-dissonances": await dissonances.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "X-barathym": await barathym.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "X-tranquilite": await tranquilite.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "X-dessins": await dessins.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// eleents liés aux activités anciennes
		// case "metropolis": await metropolis.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// case "innommable": innommable.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// case "torches": torches.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// case "asciens": asciens.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// case "pnjs": await pnjs.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// case "doctrineDuMal": await doctrineDuMal.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		// case "usinesGaz": await usinesGaz.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
	 	// case "spartaci": await spartaci.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
	 	// case "omega": await omega.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
		case "S-codex": await codex.httpCallback(req, res, method, reqPaths, body, pseudo, pwd); break;
	}
	gbl.exception( { m: method, rp: reqPaths, body: body, pseudo: pseudo, pwd: pwd  } ,400);
}


function wsCallback(pseudo,m) {
	if (m.op.startsWith('root3D.'))
		root3D.wsMsg(pseudo,m)
	else
		gbl.exception("ERREUR FATALE: Bad ws op",400);
	/*
	switch (m.op) {
		case "metro.sync":
			metropolis.syncPseudo(pseudo,m)
			return
		case "metro.emote":
			metropolis.emote(pseudo,m)
			return
	}
	*/
};


/////////////
// Verification de l'intégrité des trucs bancales
/////////////
async function checkBeforeStart() {
	// vérification du parse du lodestone si maj de son contennu
	try {
		const ff14Id = await lodestone.getFF14Id("Kikiadoc","Lepetiot","Moogle")
		const ff14ImgId = await lodestone.publishFace("Kikiadoc",true)
		if (ff14Id != 12945273 || ff14ImgId != 12945273)
			discord.mpKiki("serveur restart, lodetsone issue (idKiki=12945273) found ff14id="+ff14Id+", ff14ImgId="+ff14ImgId)
		else
			console.log('***** Pas de modif struture du lodestone, PARSEUR OK')
	}
	catch(e) {
		console.log('***** CHECKBEFORESTART ***',e)
	}
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

serverTiming.start = { Time: process.hrtime(serverTiming.boot.Time), Memory: process.memoryUsage() }

const HTTPPORT = gbl.isProd() ? 7070 : 7072
const WSPORT = gbl.isProd() ? 7071 : 7073
checkBeforeStart()
console.log("HTTPPORT=",HTTPPORT)
console.log("WSPORT=",WSPORT)
discord.start(null)
wsserver.start(wsCallback, WSPORT)
httpserver.start(httpCallback, HTTPPORT)

serverTiming.running = { Time: process.hrtime(serverTiming.boot.Time), Memory: process.memoryUsage() }

console.log("SERVERBOOT",serverTiming)
// console.log("PROCESS",process)
