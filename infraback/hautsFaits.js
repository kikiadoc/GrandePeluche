
const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const pseudos = require('../infraback/pseudos.js');
const ws = require('../infraback/wsserver.js');

const hautsFaits = collections.get("hautsFaits", true);

const hautsFaitsDesc = {
		broceliandeInitiatique: { },
		uchronieInitiatique:	{ broadcast: " rejoint le noviciat de l'Uchronie" },
		geographeJardins:	{ },
		Teotihuacan:	{ broadcast: " a découvert Teotihuacan" },
		mineralogistes:	{ broadcast: " est Minéralogiste de l'Uchronie" },
		dirac:	{ broadcast: " a activé le Dirac de Quatre" },
		hegemonieInitiatique:	{ broadcast: " rejoint le noviciat de l'Hégémonie" },
		hegemonieEvade:	{ broadcast: " s'est évadé de la Prison des Ames" },
		hegemonieExplorateur:	{ broadcast: " a exploré Eorzéa", libelle: "Futur Indiana Jones" },
		decouvreurDeLaSource:	{ broadcast: " a découvert la Station Alpha", libelle: "Découvreur de La Source" },
		traducteurDesAnciens:	{ libelle: "Traducteur du Langage des Anciens" },
		Kiki_X_initiatique:	{ libelle: "Novice de XXX", broadcast: " rejoint le noviciat de XXX" },
		metropolisNovice:	{ libelle: "Novice de Métropolis", broadcast: " rejoint le noviciat de Métropolis" },
		metropolisPadawan:	{ libelle: "Padawan de Métropolis", broadcast: " rejoint les Padawans de Métropolis" },
		metropolisMaitre:	{ libelle: "Maître de Métropolis", broadcast: " rejoint les Maîtres de Métropolis" }
};
// init/normalize de la collection si besoin
function init() {
	hautsFaits.id ??= {};
	Object.keys(hautsFaitsDesc).forEach( p => {
		hautsFaits.id[p] ??= { }
		hautsFaits.id[p].pseudos ??= { }
		hautsFaits.id[p].broadcast ??= hautsFaitsDesc[p].broadcast
		hautsFaits.id[p].libelle ??= hautsFaitsDesc[p].libelle
	});
}

// test si hautFait marqué pour le pseudo
function isDone(pseudo, hautFait) {
	if (!hautsFaits.id[hautFait]) gbl.exception("hautFait non valide:"+hautFait,400);
	return (hautsFaits.id[hautFait].pseudos[pseudo]) ? true : false;
}
// marque le haut fait retourne 200 si deja fait, 201 si marqué, broadcast texte si besoin, boradcast le hautfait
function flagIt(pseudo,hautFait, lvl) {
	if ( isDone(pseudo, hautFait) ) return 200;
	hautsFaits.id[hautFait].pseudos[pseudo] = { dth: Date.now(), lvl: parseInt(lvl,10) || 0 };
	collections.save(hautsFaits);
	if (hautsFaitsDesc[hautFait].broadcast) ws.broadcastSimpleText(pseudo+hautsFaitsDesc[hautFait].broadcast,true);
	ws.broadcastSimpleOp("hf_"+hautFait, hautsFaits.id[hautFait]);
	return 201;
}

exports.flagIt = flagIt;

// return null ou le haut fait
exports.get = (hautFait) => {
	return hautsFaits.id[hautFait]
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd);
	if (method=="OPTIONS") {
		res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE');
		gbl.exception("AllowedCORS",200);
	}
	if (method=="PUT") {
		gbl.exception(hautsFaits.id[reqPaths[2]] || "bad hautfait", flagIt(pseudo,reqPaths[2],reqPaths[3]) );
	}
	if (method=="GET") {
		switch ( reqPaths[2] ) {
			case "":
			case null:
			case undefined:
				pseudos.check(pseudo,pwd,true); // admin only
				gbl.exception(hautsFaits,200);
			default: 
				const hf = hautsFaits.id[reqPaths[2]]
				if (!hf) gbl.exception("bad hautsFaits",400);
				gbl.exception(hf,200);
		}
	}
	if (method=="DELETE") {
		pseudos.check(pseudo,pwd,true); // admin
		const hautFait = reqPaths[2];
		const hf = hautsFaits.id[hautFait]
		if (!hf) gbl.exception("bad hautsFaits",400);
		hf.pseudos = {}
		collections.save(hautsFaits);
		ws.broadcastSimpleOp("hf_"+hautFait, hf);
		gbl.exception(hf,200);
	}
	gbl.exception("bad op",400);
}

init();
console.log("hautsFaits loaded");
