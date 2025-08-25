const gbl = require('../infraback/gbl.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');
const lodestone = require('../infraback/lodestone.js');
const tts = require('../infraback/tts.js');


exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd) // auth
	switch (method) {
		case "GET":
			switch(reqPaths[2]) {
				case "metadata":
					let md = wsserver.getMetadata(pseudo)
					gbl.exception(md, (md)? 200: 404)
				case "refresh":
					let fn = await tts.pubCdnTTS(pseudo)
					if (!fn) gbl.exception("erreur synthse vocale "+pseudo, 500)
					let pf = await lodestone.publishFace(pseudo)
					if (!pf) gbl.exception("erreur publication depuis lodestone "+pseudo, 500)
					gbl.exception("Ok",200);
				default:
					gbl.exception("bad get clientConfig ",400);
			}
	}
	gbl.exception("inv http op clientConfig",400);
}


console.log("clientConfig loaded");
