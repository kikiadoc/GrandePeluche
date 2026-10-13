
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const discord = require('../infraback/discord.js');
const hautsFaits = require('../infraback/hautsFaits.js');


exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd);
	switch (method) {
		case "OPTIONS":
			res.setHeader('Access-Control-Allow-Methods', 'PUT');
			gbl.exception("AllowedCORS",200);
		case "PUT":
			let ho = Object.keys(hautsFaits.get("dirac").pseudos).length;
			let rc = hautsFaits.flagIt(pseudo,"dirac");
			let hn = Object.keys(hautsFaits.get("dirac").pseudos).length;
			if ( ho==0 && hn==1 ) {
				// disord...
				console.log( "***appel Discord");
				discord.postMessage((gbl.isProd())? "uchronie":"test",
					pseudo+" a aligné en premier les Peluches pour activer le Dirac des Dimensions\n"+
					"**Pour cela, il a positionné les Peluches selon leurs positions dans la Chambre du Dirac des Dimensions, "+
					"puis, au global, il a échangé l'ours en peluche et le baron ail en peluche**\n"+
					"\n__Réaligne toi aussi les Peluches pour activer le Dirac des Quatre__"
					, true);
			}
			gbl.exception("ok",rc)
	}
	gbl.exception("bad op",400)
}

console.log("dirac loaded");

