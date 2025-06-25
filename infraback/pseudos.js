
const gbl = require('../infraback/gbl.js');
const lodestone = require('../infraback/lodestone.js');
const discord = require('../infraback/discord.js');
const fs = require('fs');
const https = require('https');
const { subtle } = require('node:crypto').webcrypto;

let pseudos = {};

function initPseudos() {
	console.log("--- init pseudos ---");
	fs.readdirSync(gbl.staticFsPath).forEach(file => {
  		const radical = file.split('.');
  		if (radical[1]=='pseudo') {
      			const rawUser = fs.readFileSync(gbl.staticFsPath+file);
      			pseudos[radical[0]]=JSON.parse(rawUser);
      			console.log("User loaded: ",file);
  		}
	});
	console.log("--------------------");
}

function get(pseudo) {
	return pseudos[pseudo];
}
function exist(pseudo) {
	return pseudos[pseudo] != null;
}

/* OBSOLETE!!!!
// recherche de pseudo par nick (xx yy @monde)
function getByNick(nick) {
	if (!nick) { console.error("***** getByNick Syntax",nick); return null; }
	let atPos = nick.indexOf('@');
	if (atPos <=2) { console.error("***** getByNick Syntax",nick); return null; }
	let fullName = nick.substring(0,atPos-1)
	let monde = nick.substring(atPos+1)
	for (let pseudo in pseudos) {
		console.log("fn",pseudos[pseudo].fullName,"==",fullName,"monde",pseudos[pseudo].monde,"==",monde)
		if (pseudos[pseudo].fullName==fullName && pseudos[pseudo].monde==monde) {
			console.log("nick2pseudo:", nick, "->", pseudo);
			return pseudo;
		}
	}
	console.error("***** getByNick NotFound",nick,fullName,monde)
	return null;
}
*/

// recherche de pseudo par prenom, nom, monde
function getByPNM(prenom,nom,monde) {
	for (let pseudo in pseudos) {
		if (pseudos[pseudo].prenom==prenom && pseudos[pseudo].nom==nom && pseudos[pseudo].monde==monde) {
			console.log("nick2pseudo:", prenom, nom, monde, "->", pseudo);
			return pseudo;
		}
	}
	console.error("***** getByPNM NotFound",prenom,nom,monde)
	return null;
}

// recherche de pseudo par prenom, nom et sans le monde !!
function getByPN(prenom,nom) {
	for (let pseudo in pseudos) {
		if (pseudos[pseudo].prenom==prenom && pseudos[pseudo].nom==nom ) {
			console.log("nick2pseudo:", prenom, nom, "->", pseudo);
			return pseudo;
		}
	}
	console.error("***** getByPN NotFound",prenom,nom)
	return null;
}

function savePseudo(desc) {
	fs.writeFileSync(gbl.staticFsPath+desc.pseudo+".pseudo", JSON.stringify(desc));
}

// admin pour upgrade version sans FF14ID ver version avec FF14ID
function forceId(pseudo,ff14Id) {
	let desc = pseudos[pseudo]
	if (!desc) gbl.exception("Pseudo not found:"+pseudo,404);
	desc.ff14Id = ff14Id;
	savePseudo(desc);
	return desc;
}

// fonction de crypto eliptic
const ecKeyImportParams = { name: "ECDSA", namedCurve: "P-384" }
const ecdsaParams = { name: "ECDSA", hash: "SHA-256" }
async function pseudoCheckSignature(pseudo,newPwd,jwkPublicKey,hexSignature) {
	try {
		let signature = gbl.hexToUint8Array(hexSignature);
		let importedKey = await subtle.importKey( "jwk", jwkPublicKey, ecKeyImportParams, false, ["verify"] )
		return await subtle.verify( ecdsaParams, importedKey, signature, new TextEncoder().encode(pseudo+newPwd))
	}
	catch (e) {
		console.log(e);
		return false;
	}
}

// ajoute un pseudo, ipFor est le bypass discord si ip
async function definePseudo(body, ipFor) {
	// recupere les options..
	const o = JSON.parse(body);
	const pseudo = gbl.capitalizeFirstLetter(gbl.stripBlank(o.pseudo))
	const nom = gbl.capitalizeFirstLetter(gbl.stripBlank(o.nom))
	const monde = gbl.capitalizeFirstLetter(gbl.stripBlank(o.monde))
  const jwkPublicKey = o.jwkPublicKey
	if (! gbl.isPseudoValid(pseudo)) gbl.exception("Prenom IG invalide", 400);
	if (! gbl.isPseudoValid(nom)) gbl.exception("Nom IG invalide", 400);
	if (! gbl.isPseudoValid(monde)) gbl.exception("Monde IG invalide", 400);
	try { await subtle.importKey( "jwk", jwkPublicKey, ecKeyImportParams, false, ["verify"] ) }
	catch (e) { gbl.exception("Cle publique invalide", 400) }

	// check lodestone
	const ff14Id = await lodestone.getFF14Id(pseudo,nom,monde)
	if (!ff14Id) gbl.exception(pseudo+" "+nom+" @"+monde+" introuvable sur le lodestone", 400);
	if (ff14Id != o.ff14Id) gbl.exception("FF14ID mismatch entre client et serveur",400);

	// verification selon le ff14id que le pseudo n'existe pas encore
	const pseudoExist = Object.values(pseudos).find ( (pseudo) => pseudo.ff14Id == ff14Id);
	if (pseudoExist) gbl.exception("Joueur déjà enregistré via ff14Id",403);

	// verification que le FF14Id est défini sur discord (bypass si ip admin)
	const discordRec = discord.getDiscordByFf14Id(ff14Id)
	if (!discordRec && ipFor!=gbl.ipAdmin) gbl.exception("Tu n'es pas validé sur le Discord des Kiki's Events",400);
	// if (!discordRec) gbl.exception("Tu n'es pas validé sur le Discord des Kiki's Events",400);

	// construit le pseudo
	let suffixe = "";
	while (pseudos[pseudo+suffixe])
		suffixe = (suffixe!="")? suffixe+1 : 1;
	const newUser = pseudo+suffixe;

	// creation du nouvel user
	const newUserDesc = { pseudo: newUser, ff14Id: ff14Id, jwkPublicKey: jwkPublicKey, dth: Date.now(), prenom: pseudo, nom: nom, monde: monde };
	console.log("New User! ", newUserDesc);
	pseudos[newUser] = newUserDesc;
	savePseudo(newUserDesc);
	return newUserDesc;
}

// definition du pwd de session en validant par la clef eliptic
// metadata sont les metadata du ws ou null
// si pas de clef proposée, retourne null
async function asyncSetPwdSession(pseudo,newPwd,hexSignature,newPublicKey,metadata) {
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) gbl.exception("pseudo introuvable, contacte Kikiadoc", 403);
	// si pas de clef proposée, problème de version
	if (!newPublicKey) return null;
	// verification du pseudo+newPwd selon le signature
	if (! await pseudoCheckSignature(pseudo, newPwd, pseudoDesc.jwkPublicKey, hexSignature)) gbl.exception("Signature crypto elliptique invalide, contacte Kikiadoc", 403);
	// Note le login et ip eventuel (save pseudo AVANT maj du pwd de session)
	pseudoDesc.lastLogin = Date.now();
	pseudoDesc.pwd = "transient" // pas de danger, le pwd ne passera pas le filtrage sémantique
	pseudoDesc.ip = metadata && metadata.ip
	savePseudo(pseudoDesc);
	// commit du pwd de session
	pseudoDesc.pwd = newPwd
	return pseudoDesc
}

// Invalidation du pwd ephémère du pseudo
function invalidatePwd(pseudo) {
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) 
		console.log("** Erreur d'invalisation session de",pseudo) 
	else {
		pseudoDesc.pwd = "close"	// pas de danger, le pwd ne passera pas le filtrage sémantique
		console.log("*** Password ephémère invalidé pour",pseudo);
	}
}

// verification du mot de passe de session
function checkPseudo(pseudo,password, reqAdmin) {
	if (!pseudo || !password) gbl.exception("Pseudo ou clef furtive non défini, contacte Kikiadoc", 403);
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) gbl.exception("Pseudo introuvable, contacte Kikiadoc", 403);
	if ( pseudoDesc.pwd != password ) gbl.exception("Mauvaise clef furtive, contacte Kikiadoc", 403);
	if ( reqAdmin && (pseudo != "Kikiadoc") ) gbl.exception("Not admin", 403);
	return pseudoDesc;
}

function getPseudoDescByFf14Id(ff14Id) {
	for (let pseudo in pseudos) {
		if (pseudos[pseudo].ff14Id == ff14Id) return pseudos[pseudo]
	}
	return null
}

function deletePseudo (pseudo) {
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) gbl.exception("pseudo introuvable", 403);
	delete pseudos[pseudo] ;
	fs.unlinkSync(gbl.staticFsPath+pseudo+".pseudo");
	return pseudoDesc;
}

function deletePseudoByFf14Id (ff14Id) {
	const pseudoDesc = getPseudoDescByFf14Id(ff14Id)
	if ( !pseudoDesc ) { console.log('deletePseudoByFf14Id not found', ff14Id); return null } 
	console.log("deletePseudoByFf14Id", ff14Id,pseudoDesc)
	const pseudo = pseudoDesc.pseudo
	try {
		pseudo && fs.unlinkSync(gbl.staticFsPath+pseudo+".pseudo");
	}
	catch(e) {
		console.log(e)
	}
	delete pseudos[pseudo] ;
	return pseudoDesc;
}

function clearServerPublicKey(pseudo) {
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) gbl.exception("pseudo introuvable", 403);
	if ( !pseudoDesc.jwkPublicKey ) gbl.exception("jwkPublicKey introuvable", 403);
	delete pseudoDesc.jwkPublicKey
	savePseudo(pseudoDesc);
}

async function httpCallback(req, res, method, reqPaths, body, pseudo, pwd) {
	if (method=="OPTIONS") {
		res.setHeader('Access-Control-Allow-Methods', 'DELETE, PUT, PATCH');
		gbl.exception("AllowedCORS",200);
	}
	else
	if (method=="DELETE") {
		checkPseudo(pseudo,pwd,true);
		let ret= deletePseudo(reqPaths[2]);
		gbl.exception(ret,200);
	}
	else
	if (method=="PUT") {
		const ipFor=req.headers['x-forwarded-for'];
		let ret= await definePseudo( body, ipFor );
		gbl.exception(ret,200);
	}
	else
	if (method=="POST") {
		// cas particullier de modif admin du ff14ID d'un pseudo
		checkPseudo(pseudo,pwd,true);
		let ret= forceId( reqPaths[2], parseInt(reqPaths[3],10) );
		gbl.exception(ret,200);
	}
	else
	if (method=="GET") {
		checkPseudo(pseudo,pwd,true);
		gbl.exception(pseudos,200);
	}
	else
	if (method=="PATCH") {
		checkPseudo(pseudo,pwd,true);
		Object.keys(pseudos).forEach( (pseudo) => {
			let pseudoDesc = pseudos[pseudo]
			if (pseudoDesc.fullName) {
				// normalize fullName vers prenom/nom
				let idx = pseudoDesc.fullName.indexOf(" ")
				let prenom = pseudoDesc.fullName.substring(0,idx);
				let nom = pseudoDesc.fullName.substring(idx+1);
				console.log("Normalize:",pseudoDesc.fullName,"->",prenom,nom);
				pseudoDesc.prenom = prenom;
				pseudoDesc.nom = nom;
				delete pseudoDesc.fullName
				savePseudo(pseudoDesc);
			}
		})
		gbl.exception(pseudos,200);
	}
	gbl.exception("bad op pseudos",400);
}

initPseudos();

exports.get = get
exports.exist = exist
exports.getByPNM = getByPNM
exports.getByPN = getByPN
exports.check = checkPseudo; 
exports.asyncSetPwdSession = asyncSetPwdSession; 
exports.httpCallback = httpCallback;
exports.clearServerPublicKey = clearServerPublicKey;
exports.deletePseudoByFf14Id = deletePseudoByFf14Id
exports.invalidatePwd = invalidatePwd

console.log("Pseudos loaded");

