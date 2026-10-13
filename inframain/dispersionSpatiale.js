
const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const ws = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');

let initStatus = [
	{ x: 5.8, y: 6.0, pub: { zone: "maison de cl"      , lbl: "l'étoile du dragon aux marrons"               , img:0, lodestone: "03d5c833317"  } },
	{ x: 6.4, y: 5.8, pub: { zone: "maison de cl"      , lbl: "le panier de beignets de la fête des étoiles" , img:1, lodestone: "736aab3111a"  } },
	{ x: 5.7, y: 6.3, pub: { zone: "maison de cl"      , lbl: "la grande glace pilée"                        , img:2, lodestone: "0ce10b43ca3"  } },
	{ x: 6.5, y: 5.9, pub: { zone: "maison de cl"      , lbl: "le homard de la Valention"                    , img:3, lodestone: "2386c45acfb"  } },
	{ x: 6.3, y: 6.3, pub: { zone: "maison de cl"      , lbl: "le panier de pommes pixies"                   , img:4, lodestone: "3ef90ae5f46"  } },
	{ x: 6.4, y: 6.2, pub: { zone: "maison perso"      , lbl: "le panier de pains divers"                    , img:5, lodestone: "d615a02992e"  } },
	{ x: 6.2, y: 6.2, pub: { zone: "maison perso"      , lbl: "l'omelette"                                   , img:6, lodestone: "a121568a070"  } },
	{ x: 5.9, y: 6.0, pub: { zone: "maison perso"      , lbl: "la fondue au fromage"                         , img:7, lodestone: "6b90dd50b7d"  } },
	{ x: 5.8, y: 6.3, pub: { zone: "maison perso"      , lbl: "le saladier d'oeuf mimosa"                    , img:8, lodestone: "cf282c79495"  } },
	{ x: 5.9, y: 5.8, pub: { zone: "maison perso"      , lbl: "le coeur-de-sorbet"                           , img:9, lodestone: "e6d12643053"  } }

];

// infosStatiques diffusables
const infosStatiques= { lieux: [] }
for (let i=0; i < initStatus.length; i++) {
	infosStatiques.lieux[i] = {};
	infosStatiques.lieux[i] = Object.assign(infosStatiques.lieux[i],initStatus[i].pub);
}

// Contexte
const ctx = collections.get("dispersionSpatiale",true)
ctx.lieux ??= [];
for (let i=0; i < initStatus.length; i++) {
	ctx.lieux[i] ??= { pseudos: {} }
}

// retourne un TABLEAU des lieux découverts par le pseudo
function getStatus(pseudo) {
	let ret = []
	for (let i=0; i < initStatus.length; i++) {
		ret[i] = ctx.lieux[i].pseudos[pseudo]
	}
	return ret;
}

// positinne un truc trouvé, exception 200 si trouve ou 202 si pas a la bonne place
function setTrouve(i,x,y,pseudo) {
	if (!gbl.isDistance(x,y,initStatus[i].x,initStatus[i].y, 0)) gbl.exception("mauvais x/y",202)
	ctx.lieux[i].pseudos[pseudo]= { dth: Date.now() }
	collections.save(ctx);
	ws.broadcastSimpleText(pseudo+" a trouvé "+initStatus[i].pub.lbl,true)
  gbl.exception(getStatus(pseudo),200)
}
// efface les trouves (admin)
function clearTrouves() {
	for (let i=0; i < initStatus.length; i++) {
		ctx.lieux[i] = { pseudos: {} }
	}
	collections.save(ctx);
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd);
	switch (method) {
		case "OPTIONS":
			res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET":
			switch(reqPaths[2]) {
				case "static":
					gbl.exception(infosStatiques,200)
				case "dynamic":
					gbl.exception(getStatus(pseudo),200)
				case "recap":
					gbl.exception(ctx,200)
			}
			gbl.exception("bad op",400)
		case "PUT":
			switch(reqPaths[2]) {
				case "trouve":
					setTrouve(gbl.checkInt(reqPaths[3],0,initStatus.length-1),gbl.checkFloat(reqPaths[4]),gbl.checkFloat(reqPaths[5]),pseudo)
					break;
			}
			gbl.exception("bad op",400)
		case "DELETE":
			pseudos.check(pseudo,pwd,true); // admin
			switch(reqPaths[2]) {
				case "trouvesAll":
					clearTrouves()
					gbl.exception("ok",200)
			}
			gbl.exception("bad op",400)
	}
	gbl.exception("bad op",400)
}

console.log("dispersionspatiale loaded");

