const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');
const discord = require('../infraback/discord.js');

const TRADUCTIONS = [
		{ nbAsc: 0, nbEor: 0, chEor: " " }, 																			// tbl: [] },
		{ nbAsc: 1, nbEor: 1, chEor: "A" }, 																			// tbl: [1] },
		{ nbAsc: 2, nbEor: 2, chEor: "B" }, 																			// tbl: [2,1] }, 
		{ nbAsc: 4, nbEor: 3, chEor: "C" }, 																			// tbl: [4,2,1] }, --> chiffre du secteur 3
		{ nbAsc: 8, nbEor: 4, chEor: "D",			phrase: "Pêcheur" }, 								// tbl: [8,4,2,1] }, 
		{ nbAsc: 16, nbEor: 5, chEor: "E",    phrase: "Station Alpha" },					// tbl: [16,8,4,2,1] },
		{ nbAsc: 5, nbEor: 6, chEor: "F",     phrase: "Appartement" }, 						// tbl: [5,16,8,4,2,1] },
		{ nbAsc: 10, nbEor: 7, chEor: "G",		phrase: "La Source" }, 							// tbl: [10,5,16,8,4,2,1] },
		{ nbAsc: 3, nbEor: 8, chEor: "H",     phrase: "Secteur" }, 								// tbl: [3,10,5,16,8,4,2,1] },
		{ nbAsc: 6, nbEor: 9, chEor: "I",     phrase: "nommé" }, 									// tbl: [6,3,10,5,16,8,4,2,1] },
		{ nbAsc: 12, nbEor: 10, chEor: "J",		phrase: "Guilde" }, 								// tbl: [12,6,3,10,5,16,8,4,2,1] },
		{ nbAsc: 24, nbEor: 11, chEor: "K" }, 																		// tbl: [24,12,6,3,10,5,16,8,4,2,1] },
		{ nbAsc: 48, nbEor: 12, chEor: "L",   phrase: "Brumée" },									// tbl: [48,24,12,6,3,10,5,16,8,4,2,1] },
		{ nbAsc: 17, nbEor: 13, chEor: "M" }, 																		// tbl: [17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 34, nbEor: 14, chEor: "N" }, 																		// tbl: [34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 11, nbEor: 15, chEor: "O" }, 																		// tbl: [11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 22, nbEor: 16, chEor: "P" }, 																		// tbl: [22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 7, nbEor: 17, chEor: "Q" }, 																			// tbl: [7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 14, nbEor: 18, chEor: "R" }, 																		// tbl: [14,7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 28, nbEor: 19, chEor: "S" }, 																		// tbl: [28,14,7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 9, nbEor: 20, chEor: "T" }, 																			// tbl: [9,28,14,7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 18, nbEor: 21, chEor: "U" }, 																		// tbl: [18,9,28,14,7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 36, nbEor: 22, chEor: "V" }, 																		// tbl: [36,18,9,28,14,7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 72, nbEor: 23, chEor: "W" }, 																		// tbl: [72,36,18,9,28,14,7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 25, nbEor: 24, chEor: "X" }, 																		// tbl: [25,76,38,19,58,29,88,44,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 49, nbEor: 25, chEor: "Y" }, 																		// tbl: [49,148,74,37,112,56,28,14,7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] },
		{ nbAsc: 98, nbEor: 26, chEor: "Z" }	 																		// tbl: [98,49,148,74,37,112,56,28,14,7,22,11,34,17,52,26,13,40,20,10,5,16,8,4,2,1] }
]
const TRADUCTIONS_JSON = JSON.stringify(TRADUCTIONS)

// retourne la traduction actuelle d'un pseudo avec normalisation eventuelle
function getEtat(pseudo) {
	let tmpEtat = collections.get("asciens_"+pseudo, true )
	tmpEtat.tradTrouves ??= []
	return tmpEtat
}

// propose un traduction reqpath[3]=nbAsc reqPath[4]=nbEor
// 200: ok 201: mauvaise traduction
// retourne la tradTrouve actuelle du pseudo
function putTraduction(reqPaths,pseudo) {
	const nbAsc = gbl.checkInt(reqPaths[3],1,99)
	const nbEor = gbl.checkInt(reqPaths[4],1,26)
	// vérification de la validité de la proposition
	if (TRADUCTIONS[nbEor].nbAsc != nbAsc) gbl.exception('mauvaise réponse',400)
	// ajoute le traduction pour le pseudo
	let etat = getEtat(pseudo)
	etat.tradTrouves[nbEor] = nbAsc
	collections.save(etat)
	gbl.exception(etat,200);
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	// auth
	pseudos.check(pseudo,pwd);

	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "traductions":
					gbl.exception( getEtat(pseudo) ,200);
				case "tradsEtSoluces":
					gbl.exception( { etat: getEtat(pseudo), tradsString: TRADUCTIONS_JSON } ,200);
			}
			gbl.exception("anciens get",400);
		case "PUT": 
			switch(reqPaths[2]) {
				case "traduction":
					putTraduction(reqPaths,pseudo);
			}
			gbl.exception("anciens put",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "admClearTrad":
					let etat = getEtat(pseudo)
					delete etat.tradTrouves
					collections.save(etat)
					gbl.exception("ok trad pseudo cleared",200);
			}
			gbl.exception("anciens patch",400);
	}
	gbl.exception("inv http op anciens",400);
}

console.log("anciens loaded")
