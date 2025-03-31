const gbl = require('../infraback/gbl.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');


exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd) // auth
	switch (method) {
		case "GET":
			switch(reqPaths[2]) {
				case "metadata":
					let md = wsserver.getMetadata(pseudo)
					gbl.exception(md, (md)? 200: 404)
				default:
					gbl.exception("bad get clientConfig ",400);
			}
	}
	gbl.exception("inv http op clientConfig",400);
}


console.log("clientConfig loaded");
