const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const pseudos = require('../infraback/pseudos.js');
const vault = require('../infraback/vault.js');
const wsServer = require('../infraback/wsserver.js');

const deepAiUrl = "https://api.deepai.org/"
// Charge le vault
const deepAiApiKey = vault.get("deepai_apikey")

////////////////////////////////////////////////////////////////////////////////////////////////
// gestion API de DeepAI
////////////////////////////////////////////////////////////////////////////////////////////////
// imageCompare: retourne un objet avec un { score: }
async function imageCompare(url1,url2) {
	const url = deepAiUrl+"api/image-similarity";
	const headers = { "Content-type":"application/json", "api-key":deepAiApiKey }
	const body = { image1: url1, image2: url2 }
	console.log("deepAi: image compare req@",Date.now(),url,body,headers);
	// let ret= { test: "aucun appel a DeepAI", output: { distance:0 }}
	let ret= { test: "aucun appel a DeepAI" }
	// appel de DeepAI uniquement en prod
	if (gbl.isProd()) ret = await gbl.apiCall(url, 'POST' , body, headers );
	if (ret.status != 200) console.log("********** Erreur DeeapAI:",ret);
	ret.score = ret && ret.output && ret.output.distance
	ret.score ??= 1000+Math.floor(Math.random()*1000)/10 ;
	console.log("deepAi: image compare ret@",Date.now(),ret);
	return ret;
}
exports.imageCompare = imageCompare

////////////////////////////////////////////////////////////////////////////////////////////////
// gestion du mini-jeu deepAI
////////////////////////////////////////////////////////////////////////////////////////////////
const deepAiCatLst = ["cl","perso","autre" ]
const deepAiCatLbl = { cl: "Maison de cl de Kikiadoc", perso: "Maison personnelle de Kikiadoc", autre: "Screen Pourri (maison de cl)" }
const deepAiCatVal = { cl: "le + bas est le mieux", perso: "le + bas est le mieux", autre: "le + haut est le mieux" }
const deepAiCatSrt = { cl: true, perso: true, autre: false }
const deepAiCatRef = { cl: gbl.pCloudUrl+"deepAI/ref-cl.png",
											 perso: gbl.pCloudUrl+"deepAI/ref-perso.png",
											 autre: gbl.pCloudUrl+"deepAI/ref-cl.png" }

// init depuis datastore + constantes
let deepAiResults = collections.get("deepAI",true)
deepAiResults.catLst = deepAiCatLst;
deepAiResults.catLbl = deepAiCatLbl;
deepAiResults.catVal = deepAiCatVal;
deepAiResults.catSrt = deepAiCatSrt;
deepAiResults.pseudos ??= {};

exports.catLst = deepAiCatLst;
exports.catLbl = deepAiCatLbl;
exports.catVal = deepAiCatVal;
exports.catRef = deepAiCatRef;

// put un résultat dans la collection avec score et url du screen
exports.setResult = (pseudo,type,score, url) => {
	if (! deepAiCatLst.includes(type) ) { console.log("******** deepAiSetResult badType",pseudo,type) ; return }
	deepAiResults.pseudos[pseudo] ??= { }
	deepAiResults.pseudos[pseudo][type] ??= []
	if ( deepAiResults.pseudos[pseudo][type].length >=2 ) { console.log("******** deepAiSetResult overflow",pseudo,type) ; return }
	deepAiResults.pseudos[pseudo][type].push ( { score: score, url: url } )
	collections.save(deepAiResults); // synch datastore
	wsServer.broadcastSimpleOp("deepAI");
	wsServer.broadcastNotification(pseudo+" a proposé un screen pour DeepAI")
}

// recupere le tableau des screens possibles
exports.getPossibles = (pseudo) => {
	const pDone = deepAiResults.pseudos[pseudo] || {}
	let ret = []
	deepAiCatLst.forEach( (cat) => { 
		// si acun screen de la cat
		if ( !pDone[cat] ) { ret.push(cat); ret.push(cat+"-2") }
		else
		// si un screen uniquement
		if ( pDone[cat] && pDone[cat].length < 2 ) ret.push(cat+"-2") 
	})
	return ret;
}

// delete result d'un pseudo (admin)
function delResults(pseudo) {
	delete deepAiResults.pseudos[pseudo]
	collections.save(deepAiResults); // synch datastore
	wsServer.broadcastSimpleOp("deepAI");
}


exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd);
	if (method=="OPTIONS") {
		res.setHeader('Access-Control-Allow-Methods', 'DELETE');
		gbl.exception("AllowedCORS",200);
	}
	if (method=="DELETE") {
		pseudos.check(pseudo,pwd,true); // admin
		delResults(reqPaths[2])
		wsServer.broadcastSimpleOp("deepAI");
		gbl.exception(deepAiResults,200);
	}
	if (method=="GET") {
		switch ( reqPaths[2] ) {
			case "resultats":
				gbl.exception(deepAiResults,200);
		}
	}
	gbl.exception("inv op DeepAI",400);
}

////////////////////////////////////////////////////////////////////////////////////////////////
// TEST UNIQUEMENT
////////////////////////////////////////////////////////////////////////////////////////////////
const urlImg = 'https://filedn.eu/lxYwBeV7fws8lvi48b3a3TH/ff14-6-AI-images/';
async function test() {
	console.log("deepai test start");
	// 24: await imageCompare(urlImg+"gpose-cl-9.2-11.6-jour.png",urlImg+"gpose-cl-9.2-11.6-jour-angle-perso.png");
	// 20: await imageCompare(urlImg+"gpose-cl-9.2-11.6-jour.png",urlImg+"gpose-cl-9.2-11.6-nuit-angle.png");
	// 14: await imageCompare(urlImg+"gpose-cl-9.2-11.6-jour.png",urlImg+"gpose-cl-9.2-11.6-nuit-angle-perso.png");
	// 22: await imageCompare(urlImg+"gpose-cl-9.2-11.6-jour.png",urlImg+"gpose-cl-10.8-9.2-jour-angle-autre-maison.png");
	// 28: await imageCompare(urlImg+"gpose-cl-9.2-11.6-jour.png",urlImg+"gpose-cl-12.3-8.6-jour-angle-non-colombage.png");
	// 28: await imageCompare(urlImg+"gpose-cl-9.2-11.6-jour.png",urlImg+"gpose-cl-x.x-y.y-nuit-angle-hors-vision.png");
	// 30: await imageCompare(urlImg+"gpose-cl-9.2-11.6-jour.png",urlImg+"gpose-cl-x.x-y.y-nuit-angle-brumee-totalement-different.png");
	// gpose-cl-x.x-y.y-nuit-angle-hors-vision
	// gpose-cl-x.x-y.y-nuit-angle-brumee-totalement-different
	console.log("deepai test ended");
}

// setTimeout(test,5000)

console.log("deepAI loaded");

