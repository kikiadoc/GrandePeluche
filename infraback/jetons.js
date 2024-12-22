
const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');

const jetons = collections.get("jetons");

function getStructJetons(pseudo) {
	if (!jetons) gbl.exception("Collection jetons introubale",404);
	if (!pseudos.exist(pseudo)) gbl.exception("Pseudo introuvable",400);
	jetons.data[pseudo] ??= { dth: Date.now() };
	jetons.data[pseudo].solde  ??= 0;
	jetons.data[pseudo].dthGratuitNext  ??= 0;
	return jetons.data[pseudo];
}

function incJetons (pseudo, val) {
	getStructJetons(pseudo).solde += val;;
	collections.save(jetons);
	wsserver.broadcastCollection(jetons);
	return jetons;
}
exports.inc = incJetons;

// retourn true/false si le credit de pseudo est supérieur ou egal a val
exports.check = (pseudo, val) => {
	return (getStructJetons(pseudo).solde >= val)? true: false;
}

exports.get = (pseudo) => {
	return jetons;
}


function moveJeton (pseudo,dest) {
	let o = getStructJetons(pseudo);
	let d = getStructJetons(dest);
	if (o.solde <= 0) gbl.exception("credit client unsynch ",409);
	o.solde-- ;
	d.solde++ ;
	collections.save(jetons);
	wsserver.broadcastCollection(jetons);
	return jetons;
}

function getGratuit (pseudo) {
	let o = getStructJetons(pseudo);
	// vérif de la date
	if (o.dthGratuitNext > Date.now()) return "Impossible, tu ne pourras obtenir ton jeton quotidien que dans "+gbl.countDownTo(o.dthGratuitNext);
	// inc jeton gratuit
	o.dthGratuitNext = Date.now() + 23*60*60*1000;
	incJetons(pseudo,1);
	return "Tu as obtenu un jeton gratuit, tu pourras en obtenir un autre demain, dans "+gbl.countDownTo(o.dthGratuitNext);
}

function admResetGratuit(pseudo) {
	getStructJetons(pseudo).dthGratuitNext = 0;
	collections.save(jetons);
	wsserver.broadcastCollection(jetons);
}

function admClear(pseudo) {
 	delete jetons.data[pseudo];
	collections.save(jetons);
	wsserver.broadcastCollection(jetons);
}


exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	if (method=="OPTIONS") {
		res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
		gbl.exception("AllowedCORS",200);
	}
	if (method=="PUT") {
		pseudos.check(pseudo,pwd);
		ret = moveJeton(pseudo,reqPaths[2]);
		gbl.exception("Tu as donné un jeton à "+reqPaths[2],200);
	}
	if (method=="GET") {
		switch ( reqPaths[2] ) {
			case "getGratuit":
				pseudos.check(pseudo,pwd);
				gbl.exception(getGratuit(pseudo),200);
			case "admInc":
				pseudos.check(pseudo,pwd,true);
				ret=incJetons(reqPaths[3],1);
				gbl.exception(ret,200);
			case "admDec":
				pseudos.check(pseudo,pwd,true);
				ret=incJetons(reqPaths[3],-1);
				gbl.exception(ret,200);
			case "admQuery":
				pseudos.check(pseudo,pwd,true);
				ret=incJetons(reqPaths[3],0);
				gbl.exception(ret,200);
			case "admResetGratuit":
				pseudos.check(pseudo,pwd,true);
				admResetGratuit(reqPaths[3]);
				gbl.exception("ok",200);
			case "admClear":
				pseudos.check(pseudo,pwd,true);
				admClear(reqPaths[3]);
				gbl.exception("ok",200);
			default:
				gbl.exception("inv op Jetons",400);
		}
	}
	gbl.exception("inv op Jetons",400);
}

console.log("jetons loaded");
