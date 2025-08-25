
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const gbl = require('../infraback/gbl.js');
const vault = require('../infraback/vault.js');

const pCloudUrl = "https://eapi.pcloud.com/"
const pCloudDigest = "https://eapi.pcloud.com/getdigest"
const pCloudLoginUrl = "https://eapi.pcloud.com/userinfo?device=aws-ff14.adhoc.click&getauth=1&logout=1"
// const pCloudPublicFolderId=0; // root folder
// const pCloudPublicFolderId=1352966824; // Public folder
const pCloudPublicFolderId=8973403405; // AI-generated (public)
const pCloudPrivateFolderId=13412774075; // Grande Peluche (privé)
const pCloudTtsFolderId=17640900074; // ff-tts-static (public)

// Charge le vault
const pCloudUser = vault.get("pCloud_usr")
const pCloudPw = vault.get("pCloud_pw")
const pCloudVaultAuthKey="pCloud_auth";
let pCloudAuth = vault.get(pCloudVaultAuthKey,true); // let car le auth token peut être modifié

function getSha1(txt) {
	let w = crypto.createHash('sha1');
	w.update(txt);
	return w.digest('hex');
}

async function pCloudLogin() {
	let ret;
	let json;
	// digest
	ret = await fetch(pCloudDigest);
	if (ret.status != 200) gbl.exception("Erreur sur pCloudDigest",ret.status);
	json = await ret.json();
	if (json.result != 0 || !json.digest) {
		console.log("json:",json);
		gbl.exception("bad response pCloudDigest",500);
	}
	// login
	let pwDigest = getSha1( pCloudPw + getSha1( pCloudUser.toLowerCase() ) + json.digest )
	let loginUrl = pCloudLoginUrl + "&username=" + pCloudUser +"&digest=" + json.digest + "&passworddigest=" + pwDigest
	ret = await fetch(loginUrl);
	if (ret.status != 200) gbl.exception("Erreur sur pCloudLogin",ret.status);
	json = await ret.json();
	if (json.result != 0 || !json.auth) {
		console.log("json:",json);
		gbl.exception("bad response pCloudLogin",500);
	}
	// save auth
	pCloudAuth = vault.put(pCloudVaultAuthKey,json.auth);
	console.log("pCloud login ok, auth stored");
	return pCloudAuth;
}

// Execute une requete pCloud et retourne le result pCloud (ou un http Status, formatté pCloud)
async function pCloudDirect(op,prm,method,body) {
	let url = pCloudUrl+op+"?auth="+pCloudAuth
	if (prm) url = url + prm;
	let len = 0
	if (typeof body == "string") len=body.length
	if (typeof body == "object" && body.size) len=body.size // cas d'un Blob
	if (typeof body == "object" && body.length) len=body.length // cas d'un Buffer
	console.log("pCloudDirect:",url,method,body,"len=",len)
	let ret = await fetch(url, {
		method: method? method:'GET',
		body: (body)? body:null,
		headers: { "Content-Length": len },
		mode: "cors",
		cache: "no-cache"
	});
	if (ret.status != 200) return { result: ret.status }
	// recup le résultat
	console.log("pCloudDirect GetJson:",url,method)
	return await ret.json();
}

// Execute une requete pCloud et retourne le result pCloud (ou un http Status, formatté pCloud)
// test si l'auth est ok, et si callpi avec un soucis d'auth, retente le login
// prm si indiqué doit commencer par un "&";
async function pCloudApiCall(op,prm,method,body) {
	let json = null;
	// si pas d'auth... login
	if (!pCloudAuth) await pCloudLogin();
	// si pas d'auth apres login, fail !
	if (!pCloudAuth) gbl.exception("no auth after pCloud retry login",500);
	// execute la requete...
	console.log("pCloud Api:",op,prm,method);
	try {
		json = await pCloudDirect(op,prm,method,body);
	}	
	catch (e) {
		console.log("pCloudDirect Erreur:",e)
	}
	// si le retourne indique un soucis de login, retente le login puis le call
	if (!json || json.result==1000 || json.result==2000) {
		// login
		console.log("pCloud LOGIN RETRY !!");
		if (! await pCloudLogin()) gbl.exception("no auth after pCloud retry login after auth fail",500);
		// retry 
		console.log("pCloud RETRY CALL !!");
		json = await pCloudDirect(op,prm,method,body);
	}
	console.log("pCloud Api Result:",op,prm,method,json);
	return json;
}

/*
// force un toekn d'auth 
function pCloudForceAuth(localFilename,targetFilename,folderId) {
	// vérify le login et recupere un token si besoin
	await pCloudApiCall("userinfo");
!!!!	
	let fnUri = encodeURIComponent(targetFilename || path.basename(localFilename));
	// si pas d'auth... login
	if (!pCloudAuth) await pCloudLogin();
	// si pas d'auth apres login, fail !
	if (!pCloudAuth) gbl.exception("no auth after pCloud retry login",500);
}
*/

// Dépose un fichier sur le folder (utilise targetFileName si indiqué)
async function pCloudPutFile(localFilename,targetFilename,folderId) {
	let fnUri = encodeURIComponent(targetFilename || path.basename(localFilename));
	console.log("pCloud file available:",localFilename, process.memoryUsage());
	let contenu = await fs.promises.readFile(localFilename,null);
	console.log("pCloud upload file (data available):",localFilename, contenu, "lenght:",contenu.length, process.memoryUsage());
	let ret = await pCloudApiCall("uploadfile","&filename="+fnUri+"&folderid="+folderId+"&nopartial=1",'PUT',contenu);
	contenu=null
	console.log("pCloud upload file (done):",localFilename, process.memoryUsage());
	return ret
}
// Dépose un BLOB sur le folder
async function pCloudPutBlob(bodyBlob,targetFilename,folderId) {
	let fnUri = encodeURIComponent(targetFilename)
	let ret = await pCloudApiCall("uploadfile","&filename="+fnUri+"&folderid="+folderId+"&nopartial=1",'PUT',bodyBlob);
	console.log("pCloud upload blob (done):",targetFilename, process.memoryUsage());
	return ret
}

// affiche l'info du dossier public folder utilisé
async function pCloudInfoPublicDir(folderId) {
		return await pCloudApiCall("listfolder","&folderid="+ (folderId || pCloudPublicFolderId) );
}

// recupere une url pour faire un upload
async function pCloudGetUrl(targetFilename) {
	// vérification de l'acces, avec login eventuel
	let json = await pCloudApiCall("listfolder","&folderid="+pCloudPrivateFolderId);
	if (json.result != 0) gbl.exception("Erreur sur pCloudListPrivateFolder",500);
	return pCloudUrl+"uploadfile?auth="+pCloudAuth+"&filename="+encodeURIComponent(targetFilename)+"&folderid="+pCloudPrivateFolderId+"&nopartial=1"
}

////////////////////////////////////////////////////////////////////////////////////////////////
exports.apiCall = pCloudApiCall
exports.putPublicFile = async (local,target) => { return await pCloudPutFile(local,target,pCloudPublicFolderId) }
exports.putPrivateFile = async (local,target) => { return await pCloudPutFile(local,target,pCloudPrivateFolderId) }
exports.putPublicBlob = async (blobObject,target) => { return await pCloudPutBlob(blobObject,target,pCloudPublicFolderId) }
exports.putTtsBlob = async (blobObject,target) => { return await pCloudPutBlob(blobObject,target,pCloudTtsFolderId) }
exports.infoPublicDir = pCloudInfoPublicDir
exports.getUrl = pCloudGetUrl

console.log("pCloudTools loaded");
