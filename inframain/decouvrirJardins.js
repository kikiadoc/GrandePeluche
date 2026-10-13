const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const indicesDecouvrir = require('../infraback/indicesDecouvrir.js');
const tictactoes = require('../infraback/tictactoes.js');
const jetons = require('../infraback/jetons.js');
const wsserver = require('../infraback/wsserver.js');

const decouvrirJardinsIndices = [
	"Les Jardins ",
	"Suspendus ",
	"ne sont pas à ",
	"Shrirogane ",
	"ni à ",
	"Brumée",
	" ni à ",
	"Empyrée, ",
	"mais dans l'une des deux ",
	"autres zones. ",
	"C'est ",
	"l'appartement numéro ",
	"7",
	"+",
	"(1",
	"0",
	"x",
	"Zorro)",
	" dans ",
	"le secteur ",
	"numéro ",
	"(",
	"9",
	"x",
	"Zorro)",
	"-(",
	"5",
	"x",
	"5",
	")",
	"-",
	"5,",
	" et ",
	"Zorro est ",
	"la valeur ",
	"6. ",
	"Vas-y et consulte le livre de correspondance, ",
	"puis laisse un message 'Uchronie...' sur le livre ",
	"pour valider tes gains."
	// "Lavendière secteur 24, appart 67"
];

let indices = new indicesDecouvrir(decouvrirJardinsIndices,"decouvrirJardins");

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	// auth
	pseudos.check(pseudo,pwd);

	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			// GET retourne état courant
			gbl.exception(indices.get(),200);
		case "PUT": 
			switch(reqPaths[2]) {
				case "admClearAll":
					// ADMI PURGE all indices
					pseudos.check(pseudo,pwd,true);
					indices.adminReset();
					wsserver.broadcastSimpleOp("decouvrirJardins");
					gbl.exception("ok",200);
				case "admSetAll":
					// ADMIN SET ALL INDICES
					pseudos.check(pseudo,pwd,true);
					indices.adminSetAll(pseudo);
					wsserver.broadcastSimpleOp("decouvrirJardins");
					gbl.exception("ok",200);
				case "admSetPartiel":
					// ADMIN SET ALL INDICES
					pseudos.check(pseudo,pwd,true);
					indices.adminSetPartiel(pseudo);
					wsserver.broadcastSimpleOp("decouvrirJardins");
					gbl.exception("ok",200);
				default:
					// PUT demande un indice, en vérifiant l'état de la résolution du tictactoe
					// retourn le toctactoe du pseudo
					let ok = tictactoes.isHumanWinnerOrPat(pseudo,2)
					if (ok) {
						// decouvre un indice
						let indice = indices.discoverByRandom(pseudo);
						if (indice !== false) {
							// reset le tictactoe du pseudo avec reset des compteurs + timer
							let jeu= tictactoes.reset(pseudo,true)
							// ajoute un jeton au pseudo
							jetons.inc(pseudo,1);
							// broadcast request des indices
							wsserver.broadcastSimpleOp("decouvrirJardins");
							wsserver.broadcastNotification("Révélation!!", pseudo);
						}
						else {
						}
						// retoune le status du jeu
						gbl.exception(tictactoes.getStatus(pseudo),200);
					}
			}
			gbl.exception("desynchro decouvrirJardins/tictatoe",400);
	}
	gbl.exception("inv http op decouvrirJardins",400);
}

console.log("decouvrirJardins loaded");
