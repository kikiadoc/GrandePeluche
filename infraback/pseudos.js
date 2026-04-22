
const gbl = require('../infraback/gbl.js');
const lodestone = require('../infraback/lodestone.js');
const discord = require('../infraback/discord.js');
const fs = require('fs');
const https = require('https');
const { subtle, getRandomValues } = require('node:crypto').webcrypto;
const { Buffer } = require('node:buffer');

const ECKEYIMPORTPARAMS = { name: "ECDSA", namedCurve: "P-384" }
const ECDSAPARAMS = { name: "ECDSA", hash: "SHA-256" }
const DELAIRENEW = 8*24*3600*1000 // 1 semaine

const WEBAUTHDEBUG = true
const DELAIEPHEMERE= 5*60000 // minutes
const URLDEV = "svelte.dev"
const URLSITE= "ff14.adhoc.click"
const ORIGINDEV = "https://"+URLDEV
const ORIGINSITE = "https://"+URLSITE

// Constante à initialiser selon promises
let B64UEXPECTEDRPIDDEV= null
let B64UEXPECTEDRPID= null
async function initPromises () {
	B64UEXPECTEDRPIDDEV = u8_b64u(await sha256(str_u8(URLDEV)))
	B64UEXPECTEDRPID = u8_b64u(await sha256(str_u8(URLSITE)))
}
initPromises()

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
function getPseudoDescByFf14Id(ff14Id) {
	for (let pseudo in pseudos) {
		if (pseudos[pseudo].ff14Id == ff14Id) return pseudos[pseudo]
	}
	return null
}
// Recherche un descripteur de pseudo selon le pseudo OU les nom/prenom/monde
function getDesc(pseudo,prenom,nom,monde) {
	if (pseudo && pseudos[pseudo]) return pseudos[pseudo]
	let p = getByPNM(prenom,nom,monde)
	if (p) return pseudos[p]
	return null
}

// recherche de pseudo par prenom, nom, monde
function getByPNM(prenom,nom,monde) {
	if (!prenom || !nom || !monde) return null
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

// validation du pwd ephémère de session du pseudo
function validatePwd(pseudoDesc,metadata) {
	pseudoDesc.pwd = "enmemoire"
	pseudoDesc.lastLogin = Date.now();
	pseudoDesc.ip = metadata?.ip
	savePseudo(pseudoDesc);
	pseudoDesc.pwd = metadata?.id
}
// Invalidation du pwd ephémère de session du pseudo
function invalidatePwd(pseudo) {
	const pseudoDesc = pseudos[pseudo]
	if ( !pseudoDesc ) return console.log("** Erreur d'invalisation session de",pseudo) 
	pseudoDesc.pwd = "close"	// pas de danger, le pwd ne passera pas le filtrage sémantique
	console.log("*** Password ephémère invalidé pour",pseudo);
}
// verification du mot de passe de session
function checkPseudo(pseudo,password, reqAdmin, reqPriv) {
	if (!pseudo || !password) gbl.exception("Pseudo ou clef furtive non défini, contacte Kikiadoc", 403);
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) gbl.exception("Pseudo introuvable, contacte Kikiadoc", 403);
	if ( pseudoDesc.pwd != password ) gbl.exception("Mauvaise clef furtive, contacte Kikiadoc", 403);
	if ( reqAdmin && pseudo!="Kikiadoc" && pseudo!="Althea" ) gbl.exception("Tu n'es pas server admin", 403);
	if ( reqPriv && !(pseudoDesc.privilege & reqPriv) ) gbl.exception("Tu n'es pas privilege: "+reqPriv, 403);
	return pseudoDesc;
}

function deletePseudo (pseudo) {
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) gbl.exception("pseudo introuvable", 403);
	try { pseudo && fs.unlinkSync(gbl.staticFsPath+pseudo+".pseudo"); } catch(e) { console.log(e) }
	delete pseudos[pseudo] ;
	console.log("deletePseudo ok:",pseudo)
	return pseudoDesc;
}

function deletePseudoByFf14Id (ff14Id) {
	const pseudoDesc = getPseudoDescByFf14Id(ff14Id)
	if ( !pseudoDesc ) { console.log('deletePseudoByFf14Id not found', ff14Id); return null } 
	return deletePseudo(pseudoDesc.pseudo)
}

function setPrivilege(pseudo,privilege) {
	const pseudoDesc = pseudos[pseudo]
	if ( !pseudoDesc ) gbl.exception("pseudo introuvable", 403)
	pseudoDesc.privilege = gbl.checkInt(privilege,0,65535)
	savePseudo(pseudoDesc)
	return pseudoDesc
}

///////////////////////////////////////////////////
// webauthm
///////////////////////////////////////////////////
function b64_b64u(b64) {
   return b64.replaceAll('+', '-').replaceAll('/', '_')
}
function b64u_b64(b64u) {
	return b64u.replaceAll('-', '+').replaceAll('_', '/') // base64url -> base64
}
function u8_b64u(u8) {
	return Buffer.from(u8).toString('base64url')
}
function b64u_u8(b64u) {
  return Buffer.from(b64u,'base64url')
}
function b64u_str(b64u) {
	return atob(b64u_b64(b64u))
}
function str_b64u(txt) {
	return b64_b64u(btoa(txt))
}
function str_u8(txt) {
	return Buffer.from(txt)
}

function b64uEquals(a,b) {
	let aa = a?.replaceAll('=','')
	let bb = b?.replaceAll('=','')
	return a && b && (aa==bb)
}
async function sha256(buffer) {
	return Buffer.from(await crypto.subtle.digest('SHA-256', buffer))
}

function isValidRpidHash(b64uRpid) {
	console.log("isValidRpidHash",B64UEXPECTEDRPID,B64UEXPECTEDRPIDDEV)
	return b64uEquals(B64UEXPECTEDRPID,b64uRpid) || b64uEquals(B64UEXPECTEDRPIDDEV,b64uRpid) 
}
function isValidOrigin(origin) {
	return origin==ORIGINSITE || origin==ORIGINDEV 
}
// 
function getAlgoParams(algorithm) {
  switch (algorithm) {
    case 'RS256': return { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
    case 'ES256': return { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' };
    // case 'EdDSA': Not supported by browsers
    default: throw new Error("getAlgoParams algo invalide (RS256 OU ES256):"+algorithm)
  }
}
function getAlgoName(num) {
   switch(num) {
     case -7: return "ES256"
     case -8: return "EdDSA"
     case -257: return "RS256"
     default: throw new Error(`Unknown algorithm code: ${num}`)
	}
}
async function parseCryptoKey(algorithm, b64uPublicKey) {
	const algoParams = getAlgoParams(getAlgoName(algorithm))
	const buffer = b64u_u8(b64uPublicKey)
	return crypto.subtle.importKey('spki', buffer, algoParams, false, ['verify'])
}
function extractAaguid(u8AuthenticatorData) {
	// console.log('u8AuthenticatorData',u8AuthenticatorData)
	if (u8AuthenticatorData.length < 53) return "XXXXXXXX-0000-0000-0000-000000000000"
  const buffer = u8AuthenticatorData.subarray(37, 53) // 16 byte
  const hex = buffer.toString('hex')
  const aaguid = `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20,32)}`
  return aaguid // ex "d41f5a69-b817-4144-a13c-9ebd6d9254d6"
}
function parseAuthenticator(b64uAuthenticatorData) {
	let authenticatorData = b64u_u8(b64uAuthenticatorData)
  let flags = authenticatorData[32]
  return {
        b64uRpIdHash: u8_b64u(authenticatorData.subarray(0,32)),
        flags: {
                userPresent: !!(flags & 1),
                //reserved1: !!(flags & 2),
                userVerified: !!(flags &  4),
                backupEligibility: !!(flags & 8),
                backupState: !!(flags & 16),
                //reserved2: !!(flags & 32),
                attestedData: !!(flags & 64),
                extensionsIncluded: !!(flags & 128)
        },
        // signCount: new DataView(authenticatorData.slice(33,37)).getUint32(0, false),  // Big-Endian!
        signCount: authenticatorData.readInt32BE(33),
        aaguid: extractAaguid(authenticatorData),
        //credentialId: extractCredentialId() 
  }
}

// verify lodestone
async function verifyLodestone(prenom,nom,monde,ff14IdReq) {
	const ff14Id = await lodestone.getFF14Id(prenom,nom,monde)
	if (!ff14Id) gbl.exception(prenom+" "+nom+" @"+monde+" introuvable sur le lodestone", 400);
	if (ff14Id != ff14IdReq) gbl.exception("FF14ID mismatch entre client et serveur",400);
	return ff14Id
}
// verify Discord
function verifyDiscord(prenom,nom,monde,ff14IdReq) {
	const discordRec = discord.getDiscordByFf14Id(ff14IdReq)
	// console.log("verifyDiscord",prenom,nom,monde,ff14IdReq,discordRec)
	if (!discordRec) gbl.exception("Tu n'es pas validé sur le Discord des Kiki's Events",400);
	if ( (discordRec.prenom != prenom) || (discordRec.nom != nom) || (discordRec.monde != monde) ) gbl.exception("Identification discord mismatch",400)
	return discordRec
}
// precondition communes a registration et authentification reqtype est le type d'acces au vault
function verifyPrecond(pseudoDesc,clientJson,authenticator,reqType) {
  if (clientJson?.type !== reqType) gbl.exception("Mauvais clientJson type",400)
	if (Date.now() > pseudoDesc.ephemereDthEcheance) gbl.exception("Delai d'usage challenge dépassé, fait une nouvelle tentative",400)
	if (! b64uEquals(clientJson.challenge,str_b64u(pseudoDesc.ephemere) ) ) gbl.exception("Mauvais challenge, contacte Kikiadoc",400)
	if (!isValidRpidHash(authenticator.b64uRpIdHash)) gbl.exception('Mauvais RpIdHash:'+authenticator.b64uRpidHash,400)
	if (!isValidOrigin(clientJson.origin)) gbl.exception('Mauvaise origine:'+clientJson.origin,400)
	if (!authenticator.flags.userPresent) gbl.exception("Pas d'intération utilisateur pour valider (present)",400)
	if (!authenticator.flags.userVerified) gbl.exception("Pas d'intération utilisateur pour valider (verified)",400)
}
// verification des données d'enregistrement dans le vault
function verifyVaultRegistration(pseudoDesc,p) {
	const clientJson = JSON.parse(b64u_str(p.b64uClientDataJSON))
  const authenticator = parseAuthenticator(p.b64uAuthenticatorData)
	// precond
	verifyPrecond(pseudoDesc,clientJson,authenticator,"webauthn.create")

	// console.log('*** verifyVaultRegistration OK ***', pseudoDesc)
	return true
}
function convertASN1toRaw(signatureBuffer) {
    // Convert signature from ASN.1 sequence to "raw" format
    const rStart = signatureBuffer[4] === 0 ? 5 : 4;
    const rEnd = rStart + 32;
    const sStart = signatureBuffer[rEnd + 2] === 0 ? rEnd + 3 : rEnd + 2;
		return Buffer.concat([signatureBuffer.subarray(rStart, rEnd),signatureBuffer.subarray(sStart)])
}

// verification d'une signature du vaulte 
async function verifyVaultSignature({ algorithm, b64uVaultPublicKey, b64uAuthenticatorData, b64uClientJson, b64uVaultSignature }) {
	let cryptoKey = await parseCryptoKey(algorithm, b64uVaultPublicKey)
	let clientHash = await sha256(b64u_u8(b64uClientJson))
	let algoName = getAlgoName(algorithm)
	let comboBuffer = Buffer.concat([b64u_u8(b64uAuthenticatorData), clientHash])
	let signatureBuffer = b64u_u8(b64uVaultSignature)
  if(algoName == 'ES256') signatureBuffer = convertASN1toRaw(signatureBuffer)
  return crypto.subtle.verify(
		getAlgoParams(algoName),
		cryptoKey,
		signatureBuffer,
		comboBuffer)
	
}
// verification des données d'authentification par signature du vault
async function verifyVaultAuthentification(pseudoDesc,p) {
	const clientJson = JSON.parse(b64u_str(p.b64uClientDataJSON))
  const authenticator = parseAuthenticator(p.b64uAuthenticatorData)
	// précond
	if (! b64uEquals(p.b64uRawId,pseudoDesc.b64uRawId)) gbl.exception('RawId mismatch',400)
	verifyPrecond(pseudoDesc,clientJson,authenticator,"webauthn.get")
	// verif signature
	let isOk = await verifyVaultSignature({
    			algorithm: pseudoDesc.vaultAlgorithm,
					b64uVaultPublicKey: pseudoDesc.b64uVaultPublicKey,
					b64uAuthenticatorData: p.b64uAuthenticatorData,
					b64uClientJson: p.b64uClientDataJSON,
					b64uVaultSignature: p.b64uVaultSignature,
	})
	if (!isOk) gbl.exception('Signature du coffre invalide',400)
	return true
}

// verification de la signature d'un challenge avec un clef publique
async function verifyElipticSignature(challenge,jwkPublicKey,b64uSignature) {
	// console.log("verifyElipticSignature",challenge,jwkPublicKey,b64uSignature)
	let importedKey = await subtle.importKey( "jwk", jwkPublicKey, ECKEYIMPORTPARAMS, false, ["verify"] )
	let isOk = await subtle.verify( ECDSAPARAMS, importedKey, b64u_u8(b64uSignature), new TextEncoder().encode(challenge))
	if (!isOk) gbl.exception("signature elliptic invalide",400)
	return isOk
}
// verification de la durée de validite d'une clef elliptique d'un pseudo
function verifyElipticEcheance(pseudoDesc) {
	if (!pseudoDesc) gbl.exception("Pas de pseudoDesc avec clef élliptique",400)
	if ( (pseudoDesc.lastRenewDth||0) < Date.now()-DELAIRENEW) gbl.exception("Date de validité clef éllitique dépassée",400)
	return pseudoDesc
}
///////////////////////////////////////////////////
// NEW
///////////////////////////////////////////////////
async function webauthnNew(pseudo,body,ipFor) {
	let p = JSON.parse(body)
	// console.log("webauthnNew",p)

	if (! gbl.isPseudoValid(p.prenom)) gbl.exception("Prenom IG invalide", 400);
	if (! gbl.isPseudoValid(p.nom)) gbl.exception("Nom IG invalide", 400);
	if (! gbl.isPseudoValid(p.monde)) gbl.exception("Monde IG invalide", 400);

	// verification que pas encore validé
	let pseudoDesc = getDesc(pseudo,p.prenom,p.nom,p.monde)
	if (pseudoDesc) gbl.exception("Tu es déjà enregistré sur un autre équipement",202)

	// vérif de la validité de la clef elliptique
	try { await subtle.importKey( "jwk", p.newJwkPublicKey, ECKEYIMPORTPARAMS, false, ["verify"] ) }
	catch (e) { console.log("webauthnNew",e); gbl.exception("Cle publique elliptique invalide: "+e.message, 400) }

	// verfis lodestone server et discord
	const ff14Id = await lodestone.getFF14Id(p.prenom,p.nom,p.monde)
	if (ff14Id != p.ff14Id) gbl.exception("FF14ID mismatch entre client et server",400)
	verifyDiscord(p.prenom,p.nom,p.monde,p.ff14Id)

	// détermination du pseudo non affecté pour l'instant
	let suffixe = ""
	while (pseudos[p.prenom+suffixe])
		suffixe = (suffixe!="")? suffixe+1 : 1
	let tPseudo = p.prenom+suffixe

	// creation du pseudo
	let tPseudoDesc = {
		pseudo: tPseudo,
		ff14Id: ff14Id,
		jwkPublicKey: p.newJwkPublicKey,
		b64uRawId: p.b64uRawId,
		b64uVaultPublicKey: p.b64uVaultPublicKey,
		vaultAlgorithm: p.vaultAlgorithm,
		vaultTransports: p.vaultTransports,
		lastRenewDth: Date.now(),
		ephemere: p.challengeUsed,
		ephemereDthEcheance: Date.now() + DELAIEPHEMERE,
		prenom: p.prenom,
		nom: p.nom,
		monde: p.monde,
		ip: ipFor
	}
	// verification du challenge
	await verifyVaultRegistration(tPseudoDesc,p)	

	// commit auth site
	tPseudoDesc.ephemere = null
	tPseudoDesc.ephemereDthEcheance = 0
	pseudos[tPseudo]=tPseudoDesc
	savePseudo(tPseudoDesc)
	console.log("webauthnNew PseudoDesc",tPseudoDesc)

	// update discord pour role et acces
	discord.newSiteUser(tPseudo)

	// return { pseudo: tPseudoDesc.pseudo, ephemere: tPseudoDesc.ephemere }
	return { pseudo: tPseudoDesc.pseudo }
}
///////////////////////////////////////////////////
// RENEW
///////////////////////////////////////////////////
async function webauthnRenew(pseudo,body,ipFor) {
	let p = JSON.parse(body)
	let pseudoDesc = getDesc(pseudo,p.prenom,p.nom,p.monde)
	// console.log("webauthnRenew PseudoDesc",pseudoDesc)
	// console.log("webauthnRenew p",p)
	// precond
	if (!pseudoDesc) gbl.exception("webauthnRenew impossible, prenom/nom/mode invalide",400)
	if (!pseudoDesc.b64uRawId) gbl.exception("webauthnRenew impossible, b64uRawId inexistant",400)
	// vérification authenification
	await verifyVaultAuthentification(pseudoDesc,p)	
	// verification de l'ephemere par la nouvelle elliptique
	await verifyElipticSignature(pseudoDesc.ephemere,p.jwkPublicKey,p.b64uElipticSignature)
	await verifyLodestone(p.prenom,p.nom,p.monde,p.ff14Id)
	verifyDiscord(p.prenom,p.nom,p.monde,p.ff14Id)

	// Commit du renew
	// Les données sont confirmées, on met à jour pseudoDesc avec les données recues
	pseudoDesc.jwkPublicKey = p.jwkPublicKey // Maj de la clef eliptique
	pseudoDesc.lastRenewDth = Date.now()
	pseudoDesc.ephemere = null // annule l'ephémere
	pseudoDesc.ephemereDthEcheance = 0 // annule l'ephémere
	savePseudo(pseudoDesc)

	console.log("webauthnRenew PseudoDesc",pseudoDesc)
	return "webauthnRenew ok"
}
///////////////////////////////////////////////////
// UPGRADE ELLIPTIC -> WEBAUTHN
///////////////////////////////////////////////////
async function webauthnUpgrade(pseudo,body,ipFor) {
	let p = JSON.parse(body)
	let pseudoDesc = getDesc(pseudo,p.prenom,p.nom,p.monde)
	// console.log("webauthnUpgrade PseudoDesc",pseudoDesc)
	// console.log("webauthnUpgrade p",p)
	// precond
	if (!pseudoDesc) gbl.exception("webauthnUpdate impossible, prenom/nom/mode invalide",400)
	if (pseudoDesc.b64uRawId) gbl.exception("webauthnUpgrade impossible, b64uRawId existant",400)
	if (!pseudoDesc.jwkPublicKey) gbl.exception("webauthnUpgrade impossible, jwkPublicKey inexistante",400)
	verifyVaultRegistration(pseudoDesc,p)	
	await verifyLodestone(p.prenom,p.nom,p.monde,p.ff14Id)
	verifyDiscord(p.prenom,p.nom,p.monde,p.ff14Id)
	// vérification de la précédente clef eliptique est celle du serveur
	if (p.oldJwkPublicKey.x != pseudoDesc.jwkPublicKey.x || p.oldJwkPublicKey.y != pseudoDesc.jwkPublicKey.y) gbl.exception("webauthnUpgrade impossible, oldJwkPublicKey mismatch",400)
	// verification de l'ephemere par l'ancienne elliptique connue du serveur
	await verifyElipticSignature(pseudoDesc.ephemere,pseudoDesc.jwkPublicKey,p.b64uSignature)

	// Les données sont confirmées, on met à jour pseudoDesc avec les données recues
	pseudoDesc.b64uRawId = p.b64uRawId // Stocke le b64uRawId
	pseudoDesc.b64uVaultPublicKey = p.b64uVaultPublicKey // Stocke la clef publique du coffre
	pseudoDesc.vaultAlgorithm = p.algorithm
	pseudoDesc.vaultTransports = p.transports
	pseudoDesc.jwkPublicKey = p.newJwkPublicKey // Maj de la clef eliptique
	pseudoDesc.ephemere = null // annule l'ephémere

	// Commit de l'upgrade
	console.log("webauthnUpgrade PseudoDesc",pseudoDesc)
	savePseudo(pseudoDesc)

	return "webauthnUpgrade ok"
}
//
///////////////////////////////////////////////////
// retourne les elements permettant de dfinir le contexte webauthn
///////////////////////////////////////////////////
function webauthnContext(req,pseudo,prenom,nom,monde) {
	let rpId = (req.headers['referer'] == 'https://svelte.dev/')? "svelte.dev" : "ff14.adhoc.click"

	let pseudoDesc = getDesc(pseudo,prenom,nom,monde)
	if (!pseudoDesc)
		return {
			rpId: rpId,
			rpName: "La Grande Peluche",
			ephemere: gbl.uuidv4(),
			ephemereDthEcheance: Date.now() + DELAIEPHEMERE,
			etat: "new"
		}

	pseudoDesc.ephemere = gbl.uuidv4() // marque toujours le derier ephemere
	pseudoDesc.ephemereDthEcheance = Date.now() + DELAIEPHEMERE
	let etat=	( !pseudoDesc.b64uRawId && pseudoDesc.jwkPublicKey )? "upgrade" :
						( pseudoDesc.b64uRawId && (pseudoDesc.lastRenewDth||0) < Date.now()-DELAIRENEW )? "renew" :
						( pseudoDesc.b64uRawId && pseudoDesc.jwkPublicKey)? "ok" :
						null
	if (!etat) gbl.exception("Calcul Etat impossible",422)

	return {
		rpId: rpId,
		rpName: "La Grande Peluche",
		ephemere: pseudoDesc.ephemere,
		ephemereDthEcheance: pseudoDesc.ephemereDthEcheance,
		b64uRawId: pseudoDesc.b64uRawId,
		existJwkPublicKey: pseudoDesc.jwkPublicKey != null,
		lastRenewDth: pseudoDesc.lastRenewDth,
		pseudo: pseudoDesc.pseudo,
		prenom: pseudoDesc.prenom,
		nom: pseudoDesc.nom,
		monde: pseudoDesc.monde,
		privilege: pseudoDesc.privilege,
		etat: etat
	}
}

///////////////////////////////////////////////////
// UNIQUEMENT POUR DEBUG SUR DEV/STAGING
///////////////////////////////////////////////////
async function debugNewElliptic() {
	try {
		let keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-384" }, true,  ["sign", "verify"] );
		return {
			jwkPublicKey: await crypto.subtle.exportKey("jwk",keyPair.publicKey),
			jwkPrivateKey: await crypto.subtle.exportKey("jwk",keyPair.privateKey)
		}
	}
	catch(e) {
		console.log('*** debugNewElliptic',e)
		return null
	}
}
async function debugUndoUpgrade(pseudo,body) {
	let pseudoDesc = getDesc('Kikiadoc','Kikiadoc','Lepetiot','Moogle')
	if (!pseudoDesc) gbl.exception("debugUndoUpgrade kikiadoc introuvable",400)
	newEs = await debugNewElliptic()
	delete pseudoDesc.b64uRawId
	delete pseudoDesc.b64uVaultPublicKey
	delete pseudoDesc.vaultAlgorithm
	delete pseudoDesc.vaultTransports
	delete pseudoDesc.ephemere
	delete pseudoDesc.ephemereDthEcheance
	delete pseudoDesc.lastRenewDth
	pseudoDesc.jwkPublicKey = newEs.jwkPublicKey
	savePseudo(pseudoDesc)
	console.log("debugUndoUpgrade",pseudoDesc,newEs)
	return newEs
}
//
///////////////////////////////////////////////////
///////////////////////////////////////////////////
async function httpCallback(req, res, method, reqPaths, body, pseudo, pwd) {
	if (method=="OPTIONS") {
		res.setHeader('Access-Control-Allow-Methods', 'DELETE, PUT, PATCH, WEBAUTHN');
		gbl.exception("AllowedCORS",200);
	}
	else
	if (method=="GET") {
		switch (reqPaths[2]) {
			case 'webauthn' :
				// no auth
				gbl.exception(webauthnContext(req,pseudo,reqPaths[3],reqPaths[4],reqPaths[5]),200);
			case 'admin' :
				checkPseudo(pseudo,pwd,true); // ADMIN
				gbl.exception(pseudos,200);
			default : gbl.exception("get bad op"+reqPaths[2],400)
		}
	}
	else
	if (method=="DELETE") {
		checkPseudo(pseudo,pwd,true); // ADMIN
		let ret= deletePseudo(reqPaths[2]);
		gbl.exception(ret,200);
	}
	else
	if (method=="PUT") {
		const ipFor=req.headers['x-forwarded-for'];
		// no auth
		switch (reqPaths[2]) {
			case 'new' :
				gbl.exception(await webauthnNew(pseudo,body,ipFor),200);
			case 'renew' :
				gbl.exception(await webauthnRenew(pseudo,body,ipFor),200);
			case 'upgrade' :
				gbl.exception(await webauthnUpgrade(pseudo,body,ipFor),200);
			case 'debugUndoUpgrade':
				if (gbl.isProd()) gbl.exception("debugUndoUpgrade impossible en prod",400)
				gbl.exception(await debugUndoUpgrade(pseudo,body),200);
		}
		gbl.exception("put bad op"+reqPaths[2],400)
	}
	else
	if (method=="POST") {
		// cas particullier de modif admin du ff14ID d'un pseudo
		checkPseudo(pseudo,pwd,true);
		/* OBSOLETE
		let ret= forceId( reqPaths[2], parseInt(reqPaths[3],10) );
		*/
		gbl.exception(ret,400);
	}
	else
	if (method=="PATCH") {
		checkPseudo(pseudo,pwd,true);
		/* OBSOLETE
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
		*/
		gbl.exception("obsolete",400);
	}
	gbl.exception("bad op pseudos",400);
}

initPseudos();

exports.get = get
exports.getDesc = getDesc
exports.exist = exist
exports.getByPNM = getByPNM
exports.getByPN = getByPN
exports.check = checkPseudo; 
exports.httpCallback = httpCallback;
exports.deletePseudoByFf14Id = deletePseudoByFf14Id
exports.validatePwd = validatePwd
exports.invalidatePwd = invalidatePwd
exports.verifyElipticSignature = verifyElipticSignature
exports.verifyElipticEcheance = verifyElipticEcheance
exports.setPrivilege = setPrivilege
exports.PRIVCODEX = 1 // doit être un bit uniquement

console.log("Pseudos loaded");

/*
// fonction de crypto eliptic
async function pseudoCheckSignature(pseudo,newPwd,jwkPublicKey,hexSignature) {
	try {
		let signature = gbl.hexToUint8Array(hexSignature);
		let importedKey = await subtle.importKey( "jwk", jwkPublicKey, ECKEYIMPORTPARAMS, false, ["verify"] )
		return await subtle.verify( ECDSAPARAMS, importedKey, signature, new TextEncoder().encode(pseudo+newPwd))
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
	try { await subtle.importKey( "jwk", jwkPublicKey, ECKEYIMPORTPARAMS, false, ["verify"] ) }
	catch (e) { gbl.exception("Cle publique invalide", 400) }

	// check lodestone
	const ff14Id = await lodestone.getFF14Id(pseudo,nom,monde)
	if (!ff14Id) gbl.exception(pseudo+" "+nom+" @"+monde+" introuvable sur le lodestone", 400);
	if (ff14Id != o.ff14Id) gbl.exception("FF14ID mismatch entre client et serveur",400);

	// verification selon le ff14id que le pseudo n'existe pas encore
	const pseudoExist = Object.values(pseudos).find ( (pseudo) => pseudo.ff14Id == ff14Id);
	if (pseudoExist) gbl.exception("Joueur déjà enregistré via ff14Id",403);

	// verification que le FF14Id est défini sur discord
	const discordRec = discord.getDiscordByFf14Id(ff14Id)
	// if (!discordRec && ipFor!=gbl.ipAdmin) gbl.exception("Tu n'es pas validé sur le Discord des Kiki's Events",400);
	if (!discordRec) gbl.exception("Tu n'es pas validé sur le Discord des Kiki's Events",400);

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
*/
/*
function randomChallengeU8() {
	return crypto.getRandomValues(new Uint8Array(32))
}
function randomChallengeB64u() {
	return u8_b64u(randomChallengeU8())
}
async function parseCryptoKey(algoParams, publicKey ) {
  return crypto.subtle.importKey('spki', publicKey, algoParams, false, ['verify'])
}
function extractAaguid(authenticatorData) {
	console.log('authenticatorData.byteLength',authenticatorData.byteLength)
  if (authenticatorData.byteLength < 53) return null // "00000000-0000-0000-0000-000000000000"
  const buffer = authenticatorData.slice(37, 53) // 16 byte
  const hex = u8_hex(buffer)
  const aaguid = `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20,32)}`
  return aaguid // ex "d41f5a69-b817-4144-a13c-9ebd6d9254d6"
}
function parseAuthenticator(b64uAuthenticatorData) {
	let authenticatorData = b64u_u8(b64uAuthenticatorData).buffer
  let flags = new DataView(authenticatorData.slice(32,33)).getUint8(0)
  return {
        rpIdHash: u8_b64u(authenticatorData.slice(0,32)),
        flags: {
                userPresent: !!(flags & 1),
                //reserved1: !!(flags & 2),
                userVerified: !!(flags &  4),
                backupEligibility: !!(flags & 8),
                backupState: !!(flags & 16),
                //reserved2: !!(flags & 32),
                attestedData: !!(flags & 64),
                extensionsIncluded: !!(flags & 128)
        },
        signCount: new DataView(authenticatorData.slice(33,37)).getUint32(0, false),  // Big-Endian!
        aaguid: extractAaguid(authenticatorData),
        //credentialId: extractCredentialId() 
  }
}

async function verifySignature({ algorithm, b64uPublicKey, b64uAuthenticatorData,
																 b64uClientData, b64uSignature, verbose
															 }) {
	console.log('Algorithm: ', algorithm)
	console.log('b64uPublicKey:', b64uPublicKey)
	console.log('b64uSignature:', b64uSignature)
	console.log('b64uClientData:', b64uClientData)
  let clientHash = await sha256(b64u_u8(b64uClientData))
  // during "login", the authenticatorData is exactly 37 bytes
  let comboBuffer = concatenateBuffers(b64u_u8(b64uAuthenticatorData), clientHash)
	console.log('ComboBuffer: ', comboBuffer)
  let signatureBuffer = b64u_u8(b64uSignature)
	let algoName = getAlgoName(algorithm)
  if(algoName == 'ES256') signatureBuffer = convertASN1toRaw(signatureBuffer)
  const algoParams = getAlgoParams(algoName)
  let cryptoKey = await parseCryptoKey(algoParams, b64u_u8(b64uPublicKey) )
  console.log('CryptoKey:',cryptoKey)
  const isValid = await crypto.subtle.verify(algoParams, cryptoKey, signatureBuffer, comboBuffer)
  console.log('Signature: isValid:',isValid)
  return isValid
}

async function verifyAuthentication(toServerCreate, toServerGet, expected ){
  if (! b64uEquals(toServerGet.rawId,expected.rawId)) throw new Error(`Credential ID mismatch: ${toServerGet.rawId}, ${expected.rawId}`)
  const isValidSignature = await verifySignature({
        algorithm: toServerCreate.algorithm,
        b64uPublicKey: toServerCreate.publicKey,
        b64uAuthenticatorData: toServerGet.authenticatorData,
        b64uClientData: toServerGet.clientDataJSON,
        b64uSignature: toServerGet.signature
  })
  if (!isValidSignature) throw new Error(`Erreur signature: ${get.clientCredential.response.signature}`)
	const clientJson = JSON.parse(b64u_str(toServerGet.clientDataJSON))
	console.log('clientJson',clientJson)
  if (clientJson.type !== "webauthn.get") throw new Error(`Mauvais clientData type: ${clientJson?.type}`)
	if (clientJson.origin !== expected.origin) throw new Error(`Mauvais origine: ${clientJson?.origin},${expected?.origin}`)
	if (! b64uEquals(clientJson.challenge,expected?.challenge)) throw new Error(`Mauvais challenge: ${clientJson.challenge},${expected?.challenge}`)
	const expectedRpIdHash = u8_b64u(await sha256(str_u8(RPID)))
  const authenticator = parseAuthenticator(toServerGet.authenticatorData);
  if (authenticator.rpIdHash !== expectedRpIdHash) throw new Error(`Mauvais RpIdHash: ${authenticator.rpIdHash},${expectedRpIdHash}`)
	console.log('authenticator',authenticator)
	console.log('*** verifyAuthentication OK ***')
  if (!authenticator.flags.userPresent) throw new Error(`Unexpected authenticator flags: missing userPresent`)
  if (!authenticator.flags.userVerified && expected.userVerified) throw new Error(`Unexpected authenticator flags: missing userVerified`)
  if (expected.counter && authenticator.signCount <= expected.counter) throw new Error(`Unexpected authenticator counter: ${authenticator.signCount} (should be > ${expected.counter})`)
  return toAuthenticationInfo(authenticationJson, authenticator)
}
*/
/*
async function initWebAuthConst() {
	B64UEXPECTEDRPID= u8_b64u(await sha256(str_u8(URLSITE)))
	B64UEXPECTEDRPIDDEV= u8_b64u(await sha256(str_u8(URLDEV)))
	console.log("initWebAuthConst Finished",B64UEXPECTEDRPID,B64UEXPECTEDRPIDDEV)
}
initWebAuthConst()
*/
