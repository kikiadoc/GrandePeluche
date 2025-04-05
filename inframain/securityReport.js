//
// SecurityReport se charge de transmettre à discord
// les rapport de sécurité.
// Il ne sont pas stockés sur le server.
//
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const discord = require('../infraback/discord.js');

async function securityCSP(pseudo,body) {
	const msg = "## "+pseudo+", je te relaie un message de DeepCheckSec, la Peluche en charge de la cyber-sécurité dans ton navigateur depuis le site https://ff14.adhoc.click."+
							"\nElle a détecté un comportement inapproprié de ton navigateur."+
							"\n### Contacte immédiatement Kikiadoc pour analyse."+
							"\nVoici le détail technique de son message:\n"+
							JSON.stringify(JSON.parse(body),null,1)
	await Promise.all([discord.mpKiki(msg),discord.mpPseudo(pseudo,msg)])
}

exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	// auth
	pseudos.check(pseudo,pwd);

	switch(method) {
		case "POST": 
			switch(reqPaths[2]) {
				case "csp": // alerte sur CSP du pseudo
					await securityCSP(pseudo,body)
			}
	}
	gbl.exception("inv http op securityReport",400);
}

console.log("securityReport loaded")
