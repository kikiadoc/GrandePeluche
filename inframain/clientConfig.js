const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');

// Retourne différentes informations de configuration pour le client

function getConfig(pseudo,req) {
	let ip = req.headers['x-forwarded-for']
	return { pseudo: pseudo, ip: ip }
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		// case "OPTIONS": 
			// res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH');
			// gbl.exception("AllowedCORS",200);
		case "GET": 
			gbl.exception(getConfig(pseudo,req),200);
	}
	gbl.exception("inv http op cientConfig",400);
}

console.log("clientConfig loaded")
