
const crypto = require('crypto');

const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');
const pCloud = require('../infraback/pCloudTools.js');
const discord = require('../infraback/discord.js');

const FILE_FWRULES_JSON = "/home/ec2-user/checksec/datastore/gp-firewall.json"
const FILE_YUMUPDATE = "/home/ec2-user/checksec/datastore/yumUpdate.txt"
const FILE_REPORT = "/home/ec2-user/checksec/datastore/report.txt"
const FILE_YUMUPDATE_JSON = "/home/ec2-user/checksec/datastore/yumUpdate.json"
const FILE_REPORT_JSON = "/home/ec2-user/checksec/datastore/report.json"
const FILE_SAVETGZ = "/home/ec2-user/.sauvegarde.tgz"
const FILE_SAVE_JSON = "/home/ec2-user/.sauvegarde.json"
const PUB_REPORT = gbl.pCloudUrl+"AI-Generated/report.txt"
const PUB_YUMUPDATE = gbl.pCloudUrl+"AI-Generated/yumUpdate.txt"
const PUB_FWRULES = gbl.pCloudUrl+"AI-Generated/gp-firewall.json"

const STRESS_SIZE = 100000

let benchmarkReactivite = collections.get("benchmarkReactivite",true)

// modifie un path avec la date
function avecJourDuMois(str) {
	let dateNow = new Date();
	dateNow.setTime(Date.now())
	return str.replace("%JOUR%",dateNow.getUTCDate())
}

// report admin quotidien
function admDiscordReport() {
	// chargment des json
	const reportJson = collections.loadJsonFile(FILE_REPORT_JSON)
	const yumUpdateJson = collections.loadJsonFile(FILE_YUMUPDATE_JSON)
	const sauvegardeJson = collections.loadJsonFile(FILE_SAVE_JSON)
	// cumul et synthèse
	// message sur discord
	const message = "Rapport quotidien CheckSec v5 ("+  gbl.jjmmhhmmss(reportJson.dthSecond*1000) +" UTC)"+
									"\n"+
									"\nFirewall #2: "+ 0 + " tentatives illégales en sortie"+
									"\nFirewall #3: "+ reportJson.nbFwRules + " règles de ban automatique à analyser"+
									"\nReverse Proxy: "+ reportJson.nbFiltered + " URL mauvaise sémantique"+
									"\nCheckSec: "+ (reportJson.nbIp-reportJson.nbAlert) + " IP considérées scanner internet whiteHat"+
									"\nCheckSec: "+ reportJson.nbAlert + " IP ban dans le honeypot"+
									"\nDernier patch Securité système: "+ gbl.jjmmhhmmss(yumUpdateJson.dthSecond*1000) +" UTC"+
									"\nDerniere sauvegarde: "+ gbl.jjmmhhmmss(sauvegardeJson.dthSecond*1000) +" UTC (md5="+sauvegardeJson.md5+")"+
									"\n"+
									"\nDernier Security Report:\n<"+PUB_REPORT+">"+
									"\nDernier Patch Système:\n<"+PUB_YUMUPDATE+">"+
									"\nDernieres règles de FW:\n<"+PUB_FWRULES+">"+
									"\nHistorique 30 jours CheckSec:\n<https://my.pcloud.com/#page=filemanager&folder=8973403405&tpl=folderlist>"+
									"\nHistorique 30 jours Sauvegardes:\n<https://my.pcloud.com/#page=filemanager&folder=13412774075&tpl=folderlist>"+
									"\n"+
									"\nFin du rapport quotidien"+
									"\n"+
									"\nRAW:"+
									"\n"+JSON.stringify(reportJson)+
									"\n"+JSON.stringify(yumUpdateJson)+
									"\n"+JSON.stringify(sauvegardeJson)
	discord.postMessage( "checksec",message,true)
}
async function checkSecAlert1() {
	const message = "# C'est CHECKSEC, je vous informe avoir enclenché une procédure de mise en sécurité du serveur de la Grande Peluche\n"+
									"Raison: Saturation de l'analyseur temps réel des requêtes invalides.\n"+
									"Action: blocage de tous les acces par vérouillage du firewall externe, arret du proxy interne, purge des files d'attente de traitement\n"+
									"Kikiadoc vous informera sur Discord\n"
	discord.postMessage( "annonces",message,true)
}
async function checkSecAlert2() {
	const message = "# C'est CHECKSEC, je vous informe avoir enclenché une procédure de mise en sécurité du serveur de la Grande Peluche\n"+
									"Raison: Cause inconnue\n"+
									"Action: Arret du serveur\n"+
									"Kikiadoc vous informera sur Discord\n"
	discord.postMessage( "annonces",message,true)
}
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	switch (method) {
		case "OPTIONS":
			pseudos.check(pseudo,pwd,true); // adm only
			res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH, DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET":
			switch(reqPaths[2]) {
				case "clearClientCache":
					res.setHeader('Clear-Site-Data', '"cache"');
					gbl.exception("Requete Clear Cache Data dans Header OK",200);
				case "forceClientVersion":
					// public acess en admin local
					if (pseudo || pwd) gbl.exception( "Not local admin" ,400)
					const v = wsserver.forceClientVersion();
					gbl.exception("ok clientVersionReq="+v,200);
				case "pCloudUrlSave":
					// public acess en admin local
					if (pseudo || pwd) gbl.exception( "Not local admin" ,400)
					let url = await pCloud.getUrl("sauvegarde.tgz")
					gbl.exception(url,200);
				case "stress":
					pseudos.check(pseudo,pwd); // auth
					// cs du stress 0 qui ne fait pas de load coté serveur
					let rnd = Math.random()
					if (reqPaths[3]=="0") gbl.exception("ok stress=0 r="+rnd,200);
					// charge le serveur par un map/reduce
					let tbl=[...Array(STRESS_SIZE).keys()]
					let s=tbl.reduce( (a,v) => a + v, 0,);
					gbl.exception("ok stress="+(2*STRESS_SIZE+" r="+rnd),200);
				case "benchmark":
					pseudos.check(pseudo,pwd); // auth
					gbl.exception(benchmarkReactivite,200);
				case "benchmarkSynthese":
					pseudos.check(pseudo,pwd,true); // adm only
					const synthese = collections.loadSimpleObject("benchmark_"+reqPaths[3])
					gbl.exception(synthese,200);
				case "forcegc":
					// public acess en admin local
					if (pseudo || pwd) gbl.exception( "Not local admin" ,400)
					let mem=""
					for (const [key,value] of Object.entries(process.memoryUsage())) mem += " "+key+"="+Math.floor(value/1000000)
					console.log("*** beforeGc",mem)
					global.gc()
					mem=""
					for (const [key,value] of Object.entries(process.memoryUsage())) mem += " "+key+"="+Math.floor(value/1000000)
					console.log("*** afterGc",mem)
					gbl.exception("gc done",200);
				default:
					gbl.exception("adminTest GET invalide",400);
			}
		case "POST":
			switch(reqPaths[2]) {
				case "benchmark":
					pseudos.check(pseudo,pwd); // auth
					// parse le body
					const jsonBody = JSON.parse(body)
					if (jsonBody.name!="benchmark_"+pseudo) gbl.exception("Benchmark Malformed",400)
					// stocke le résultat
					collections.saveSimpleObject("benchmark_"+pseudo,jsonBody);
					benchmarkReactivite.pseudos ??= {}
					if ( !benchmarkReactivite.pseudos[pseudo] || !benchmarkReactivite.pseudos[pseudo].score || benchmarkReactivite.pseudos[pseudo].score > jsonBody.synthese.statsHu.moyenne  ) {
						benchmarkReactivite.pseudos[pseudo] = {device: jsonBody.synthese.device, score: jsonBody.synthese.statsHu.moyenne, badDetect: jsonBody.synthese.badDetect }
						collections.save(benchmarkReactivite)
					}
					gbl.exception(benchmarkReactivite,200);
				default:
					gbl.exception("adminTest POST invalide",400);
			}
		case "PATCH":
			pseudos.check(pseudo,pwd,true); // adm only
			switch(reqPaths[2]) {
				case "gotoPage":
					wsserver.targetSimpleOp(reqPaths[3],"admGotoPage", { pseudo: reqPaths[3], page: parseInt(reqPaths[4],10)})
					gbl.exception("admGotoPage envoyé",200);
				default:
					gbl.exception("adminTest PUT invalide",400);
			}
			
		case "PUT":
			// public acess en admin local
			if (pseudo || pwd) gbl.exception( "Not local admin" ,400)
			switch(reqPaths[2]) {
				case "pCloudUploadFirewallRules":
					await pCloud.putPublicFile(FILE_FWRULES_JSON);
					gbl.exception( "pCloudUploadFirewallRules" ,200);
				case "pCloudUploadYumUpdate":
					await pCloud.putPublicFile(FILE_YUMUPDATE);
					gbl.exception( "pCloudUploadYumUpdate" ,200);
				case "pCloudUploadCheckSecReport":
					await pCloud.putPublicFile(FILE_REPORT);
					gbl.exception( "pCloudUploadCheckSecReport" ,200);
				case "pCloudUploadSauvegarde":
					await pCloud.putPrivateFile(FILE_SAVETGZ,"sauvegarde.tgz");
					gbl.exception( "pCloudUploadSauvegarde" ,200);
				case "discordReport":
					await admDiscordReport()
					gbl.exception( "discordReport" ,200);
				case "pCloudInfo":
					let pCloudInfo = await pCloud.infoPublicDir();
					console.log(pCloudInfo.metadata.contents);
					let metaFiltered = pCloudInfo.metadata.contents.filter((e) => e.name=="AI-Generated");
					console.log(metaFiltered);
					gbl.exception("pCloudInfo" ,200);
				case "checkSecAlert1":
					await checkSecAlert1()
					gbl.exception( "ok" ,200);
				case "checkSecAlert2":
					await checkSecAlert2()
					gbl.exception( "ok" ,200);
				default:
					gbl.exception("adminTest PUT invalide",400);
			}
		case "DELETE":
			pseudos.check(pseudo,pwd,true); // adm only
			switch(reqPaths[2]) {
				case "clearServerPublicKey":
					pseudos.clearServerPublicKey(pseudo);
					gbl.exception("ok",200);
				case "benchmark":
					benchmarkReactivite.pseudos = {}
					collections.save(benchmarkReactivite)
					gbl.exception("ok",200);
				default:
					gbl.exception("adminTest DELETE invalide",400);
			}
	}
	gbl.exception("inv http op adminTest",400);
}


console.log("adminTest loaded");
