const gbl = require('../infraback/gbl.js')
const wsserver = require('../infraback/wsserver.js')
const pseudos = require('../infraback/pseudos.js')

exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd) // auth
	switch ( method ) {
		case "POST":
			const bodyData=JSON.parse(body)
			if (bodyData.admin==true) pseudos.check(pseudo,pwd,true) // admin
			wsserver.broadcastNotification(bodyData.texte,pseudo,null,null,null,bodyData.admin==true)
			gbl.exception("Message envoyé", 200)
	}
	gbl.exception("Err chat param",400)
}

console.log("chat loaded")
