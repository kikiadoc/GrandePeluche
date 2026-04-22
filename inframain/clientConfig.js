const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');
const lodestone = require('../infraback/lodestone.js');
const tts = require('../infraback/tts.js');

let gblContext= collections.get("clientConfig",true) 

// flag un pseudo dans un element
function setFlag(elt,pseudo,n) {
	let cn = collections.get("challenge_"+n,true)
	cn[elt] ??= {}
	if (! cn[elt][pseudo]) {
		cn[elt][pseudo]=Date.now()
		collections.save(cn)
		gblContext[elt] ??= {}
		gblContext[elt].nb = Object.keys(cn[elt]).length
		collections.save(gblContext)
	}
}
// 
function getFlags(n) {
	return collections.get("challenge_"+n,true)
}

exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd) // auth
	switch (method) {
		case "GET":
			switch(reqPaths[2]) {
				case "metadata":
					let md = wsserver.getMetadata(pseudo)
					gbl.exception(md, (md)? 200: 404)
				case "ttsLodestoneRefresh":
					let fn = await tts.pubCdnTTS(pseudo)
					if (!fn) gbl.exception("erreur synthse vocale "+pseudo, 500)
					let pf = await lodestone.publishFace(pseudo)
					if (!pf) gbl.exception("erreur publication depuis lodestone "+pseudo, 500)
					gbl.exception("Ok",200);
				case "getChallenge":
					gbl.exception(getFlags(gbl.checkInt(reqPaths[3],0,999)),200)
				case "getContext":
					gbl.exception(gblContext,200)
			}
			gbl.exception("bad get clientConfig ",400);
		case "POST":
			switch(reqPaths[2]) {
				case "intentions":
					setFlag('intentions',pseudo,gbl.checkInt(reqPaths[3],0,999))
					gbl.exception("ok",200)
				case "confirmations":
					setFlag('confirmations',pseudo,gbl.checkInt(reqPaths[3],0,999))
					gbl.exception("ok",200)
			}
			gbl.exception("bad get clientConfig ",400);
	}
	gbl.exception("inv http op clientConfig",400);
}


console.log("clientConfig loaded");
