const { writeFile }  = require('node:fs/promises');

const gbl = require('../infraback/gbl.js');

// telecharge un fichier, retourne null si erreur, ou le local path téléchargé
async function url2file(url,filename) {
	try {
		// check param
		if (filename.indexOf('/') >=0) { console.log("****************** dowloadError/filename"); return null }
		// fetch le fichier
		let ret = await fetch(url);
		if (ret.status != 200) { console.log("Erreur sur download:",ret.status," url=",url); return null }
		let buff = await ret.arrayBuffer();
		let fn = gbl.grimoireFsPath+filename
		let rc = await writeFile(fn, new DataView(buff));
		return fn;
	}
	catch(e) {
		console.log("***********UPLOAD ECEPTION",e);
		return null;
	}
}

exports.url2file = url2file;

console.log("download loaded");
