//
// CECI EST LE WORKER INTERFACE OPENAI
// CECI EST LE WORKER INTERFACE OPENAI
// CECI EST LE WORKER INTERFACE OPENAI
//
const { isMainThread } = require('node:worker_threads'); 
const workerHelper = require('../infraback/workerHelperClass.js'); 
const vault = require('../infraback/workerHelperClass.js'); 

const apiKey = vault.get('openAI_apikey');
const headers = ["Authorization: Bearer "+apiKey, "Content-Type: application/json"]

// gestion du cache uniquement dans le main thread
const hashCacheClass = (isMainThread)? require('../infraback/hashCacheClass.js') : null; 
const mp3Cache = (isMainThread)? new hashCacheClass("mp3Cache") : null

//////////////////////////////////////////////////////////////////////////////////////////////
// WORKER
//////////////////////////////////////////////////////////////////////////////////////////////
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 

// Fonction TTS (context free)
async function workerTTS(req, id) {
	console.log("doTTS func:", req);
	await delay(Math.floor(10000*Math.random()));
	return { rc: 200, msg: "TTS Ok", id: id }
}

// function appelée par le worker (doit etre context free)
async function doTheJob(req, id) {
	switch (req.op) {
		case "tts":
				return workerTTS(req, id);
	}
	return { rc: 404, msg:"badWorkerOp", op: req.op, loc: __filename}
}
// function reception de la réponse (dans le mainthread)
function recevoirReponse(res, req) {
	console.log("ReponseWorker", res, req);
}

const wHelper = new workerHelper(__filename, recevoirReponse,doTheJob);

// export des fonctions worker dans le mainthread
if (isMainThread) {
	exports.asyncTts = (texte) => {
		let id = wHelper.sendRequest( {op: "tts", txt: texte, dth: Date.now() } );
		console.log("tts: reqid=",id);
	}
}


//////////////////////////////////////////////////////////////////////////////////////////////
// STANDARD
//////////////////////////////////////////////////////////////////////////////////////////////


// check GARLANDTOOLS : https://www.garlandtools.org/api/search.php?text=gav&lang=fr
// [{"type":"mob","id":"17810000001428","obj":{"i":17810000001428,"n":"Gavial","l":"35","z":63}},{"type":"npc","id":"1000193","obj":{"i":1000193,"n":"Gavin","l":52,"q":6}}]

//
//
//

// tts générique
async function tts(texte) {
	let key = mp3Cache.getKey(texte);
	let file = mp3Cache.get(key);
	// Si le fichier est disponible
	if (file != null) gbl.exception( { file: file } , 200 );
	// marque le fichier en cours de construction
	mp3Cache.lock(key);
	// genere le fichier résultat
	// post dans le cache
	mp3Cache.put(key,filename)
}

// export des fonctions dans le mainthread
if (isMainThread) {
	exports.tts = tts;
}

console.log("OpenAiTools loaded");

