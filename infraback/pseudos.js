const fs = require('fs');
const https = require('https');
const { subtle, getRandomValues } = require('node:crypto').webcrypto;
const { Buffer } = require('node:buffer');

const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const lodestone = require('../infraback/lodestone.js');
const discord = require('../infraback/discord.js');
const embDiscord = require('../infraback/embDiscord.js');
const whDiscord = require('../infraback/whDiscord.js');
const wsserver = require('../infraback/wsserver.js');

const ECKEYIMPORTPARAMS = { name: "ECDSA", namedCurve: "P-384" }
const ECDSAPARAMS = { name: "ECDSA", hash: "SHA-256" }
const DELAIRENEW = 8*24*3600*1000 // 1 semaine

const WEBAUTHDEBUG = true
const DELAIEPHEMERE= 5*60000 // 5 minutes

// LES ELEMENTS SUIVANTS DOIVENT ETRE DEFINIS ET COHERENTS DANS le ground du client
// Les droits 0xFFFFFF sont pour des cas de challenges et les opérations "délégables"
const PRIVCODEX =		 0x00000001 // fonction d'admin "CODEX"
const PRIVENIGME =	 0x00000002 // fonction d'admin "ENIGME"
const PRIVACCES =		 0x00800000 // possibilité d'acces aux pages clients meme verouillées
const PRIVBAN = 		 0x00400000 // possibilité ban
// Les droits 0x3F000000 sont les privileges de superadmin
const PRIVDROITS =	 0x01000000 // gestion des droits < 0xFFFFFF
const PRIVDELETE =	 0x02000000 // delete pseudo sur le serveur
// Les droits 0x70000000 sont les privileges de superadmin ou admin server
const PRIVSADMIN =	 0x40000000 // privilege equivalent admin server
// ATTENTION ne pas affecter 0x80000000 (pour les opertions logiques binaires qui sont signées)

///////////////////////////////////////////////////////////////
// Gestion des ORIGIN et RPID
///////////////////////////////////////////////////////////////
const ORIGIN2RPID = {
	"https://svelte.dev": 													{ auth:"webauthn"	, n: "svelte.dev" } ,
	"svelte.dev":																		{ auth:"webauthn"	, n: "svelte.dev" } ,
	"https://ff14.adhoc.click":											{ auth:"webauthn"	, n: "ff14.adhoc.click" } ,
	"ff14.adhoc.click":															{ auth:"webauthn"	, n: "ff14.adhoc.click" } ,
	"https://1523960774723375206.discordsays.com":	{ auth:"discord"	, n: "1523960774723375206.discordsays.com" },
	"1523960774723375206.discordsays.com":					{ auth:"discord"	, n: "1523960774723375206.discordsays.com" },
	"https://1523699928701075677.discordsays.com":	{ auth:"discord"	, n: "1523699928701075677.discordsays.com" },
	"1523699928701075677.discordsays.com":					{ auth:"discord"	, n: "1523699928701075677.discordsays.com" }
}
async function initOrigin() {
	for (const [k,v] of Object.entries(ORIGIN2RPID)) {
		v.b64uRpid =  u8_b64u(await sha256(str_u8(v.n)))
	}
}
initOrigin()

// pour vérif des données d'un authenticator webauthn
function isValidRpidHash(b64uRpid) {
	return	b64uEquals(b64uRpid,ORIGIN2RPID["svelte.dev"].b64uRpid) ||
		 			b64uEquals(b64uRpid,ORIGIN2RPID["ff14.adhoc.click"].b64uRpid)
}
// pour vérif des données d'un authenticator webauthn
function isValidOrigin(origin) {
	return ORIGIN2RPID[origin] && true
}
function getRpIdDescFromOrigin(origin) {
	return ORIGIN2RPID[origin] || gbl.exception("fuckO",404)
}
function getRpIdDescFromReferer(referer) {
	const refSplit = (referer || "prout").split('/')
	console.log("getRpIdDescFromReferer",refSplit)
	if (refSplit[0]!="https:") gbl.exception("fuckR0",404)
	if (refSplit[1]!="") gbl.exception("fuckR1",404)
	return getRpIdDescFromOrigin(refSplit[2])
}

///////////////////////////////////////////////////////////////
// Gestion des PSEUDOS
///////////////////////////////////////////////////////////////
let pseudos = {};
let bannedIds = collections.get("bannedIds",true) // recupere tous les identifiants bannis
bannedIds.ids ??= new Map()

function initPseudos() {
	console.log("--- init pseudos ---");
	fs.readdirSync(gbl.staticFsPath).forEach(file => {
  	const radical = file.split('.');
  	if (radical[1]=='pseudo') {
  		const rawUser = fs.readFileSync(gbl.staticFsPath+file);
  		let o = JSON.parse(rawUser);
			// normalize pour migration plus de pw
			if (o.pwd) delete o.pwd
			// normalize pour migration ip est une donnée privée
			if (o.ip) { o.p_ip = o.ip; delete o.ip }
			// normalize pour migration avec ban
			if (!o.isBan) { o.isBan=0 }
			// normalize privilege
			if (!o.privilege) { o.privilege=0 }
			// normalize FF14ID doit être un int
			if (typeof o.ff14Id == "string") o.ff14Id = parseInt(o.ff14Id,10)
			
			// stoakce mémoire 
  		pseudos[radical[0]] = o
  		console.log("User loaded: ",file);
  	}
	});
	console.log("--------------------");
}

function isBannedId(id) {
	return bannedIds.ids.has(id)
}
function get(pseudo) {
	return pseudos[pseudo] || null
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
	// Usage de gbl.jsonReplaceReorderKeys pour sauvegarder l'objet afin de permettre l'optimisation runtime lors du reboot serveur
	fs.writeFileSync(gbl.staticFsPath+desc.pseudo+".pseudo", JSON.stringify(desc,gbl.jsonReplaceReorderKeys))
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
	// pseudoDesc.pwd = "enmemoire"
	pseudoDesc.lastLogin = Date.now();
	pseudoDesc.p_ip = metadata?.ip
	// savePseudo(pseudoDesc);
	// pseudoDesc.pwd = metadata?.id
}
// Invalidation du pwd ephémère de session du pseudo
function invalidatePwd(pseudo) {
	const pseudoDesc = pseudos[pseudo]
	if ( !pseudoDesc ) return console.log("** Erreur d'invalisation session de",pseudo) 
	pseudoDesc.ephemere = "close"	// pas de danger, le pwd ne passera pas le filtrage sémantique
	console.log("*** ephémère invalidé pour",pseudo);
}
// verification du mot de passe de session
function checkPseudo(pseudo,password, reqAdmin=false, reqPriv=0) {
	if (!pseudo || !password) gbl.exception("Pseudo ou clef furtive non défini", 403);
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) gbl.exception("Pseudo introuvable", 403);
	if ( pseudoDesc.ephemere != password ) gbl.exception("Mauvaise clef furtive", 403);
	if ( reqAdmin && pseudo!="Kikiadoc") gbl.exception("Tu n'es pas server admin", 403);
	if ( reqPriv && !(pseudoDesc.privilege & reqPriv) ) gbl.exception("privilege insuffisant: "+reqPriv, 403);
	return pseudoDesc;
}
// verification simple d'un privilege
function checkPrivilege(pseudo,priv) {
	const pseudoDesc = pseudos[pseudo];
	if ( !pseudoDesc ) gbl.exception("Pseudo introuvable", 403);
	return pseudoDesc.privilege & priv
}

// ne pas appeler directement sans check privilege
function rawDeletePseudo (pseudo) {
	const pseudoDesc = get(pseudo) || gbl.exception("pseudo introuvable", 403)
	try { fs.unlinkSync(gbl.staticFsPath+pseudo+".pseudo"); } catch(e) { console.log(e) }
	// supprime les id de bans eventuels
	bannedIds.ids.delete(pseudoDesc.ff14Id)
	bannedIds.ids.delete(pseudoDesc.discordId)
	bannedIds.ids.delete(pseudoDesc.b64uRawId)
	delete pseudos[pseudo]
	collections.save(bannedIds)
	console.log("rawDeletePseudo ok:",pseudo)
	return pseudoDesc;
}

function deletePseudoByFf14Id (ff14Id) {
	const pseudoDesc = getPseudoDescByFf14Id(ff14Id)
	if ( !pseudoDesc ) { console.log('deletePseudoByFf14Id not found', ff14Id); return null } 
	return deletePseudo(pseudoDesc.pseudo)
}

// fonction réservée adminserver a tester par l'appelant pour les droits
function rawSetPrivilege(pseudo,privilege) {
	const pseudoDesc = get(pseudo)
	if ( !pseudoDesc ) gbl.exception("pseudo introuvable", 403)
	pseudoDesc.privilege = parseInt(privilege,16) || 0
	savePseudo(pseudoDesc)
	return pseudoDesc
}

///////////////////////////////////////////////////
// IHM d'adminisatration
///////////////////////////////////////////////////
// verif fonction réservée admin accessible par pseudo sur qui
// retourne le pseudoDesc du "qui" ou exception 299/400
function verifDroitAccesFonctionAdmin(pseudo,qui,privRequis,txt) {
	// verif privileges du pseudo
	if (! checkPrivilege(pseudo,privRequis)) gbl.exception("Tu n'as pas le droit de "+txt,299)
	// recup le descQui
	let descQui = get(qui) || gbl.exception("pseudo cible introuvable",400)
	// verif que le qui n'ets pas superadmin et que c'est pas un admin server
	if (descQui.privilege >= 0x01000000 && !checkPrivilege(pseudo,PRIVSADMIN)) gbl.exception("Impossible sur un superadmin",299)
	return descQui
}
// change les privileges
function togglePrivilege(pseudo,qui,privMask) {
	let descQui = verifDroitAccesFonctionAdmin(pseudo,qui,PRIVDROITS,"modifier les droits")
	// verifie le niveau du privMask (interdt les 3 bits d'admin server)
	iMask = gbl.checkInt(privMask,0,0x0FFFFFFF)
	// verifie que c'est unseul bit à toggle
	if (gbl.countBits(iMask) != 1) gbl.exception("toggle bits != 1",400)
	// commit
	descQui.privilege ??= 0 // init privilege si besoin
	descQui.privilege ^= iMask // toggle bit
	savePseudo(descQui)
	// log
	let msg = "# ADMIN PRIVILEGE: "+pseudo+" a modifié "+qui+": privilege=0x"+ descQui.privilege.toString(16)
	console.log(msg)
	whDiscord.whPostMasterLog(msg)
	gbl.exception({ privilege: descQui.privilege} , 200)
}
// ban d'un user
function toggleBan(pseudo,qui) {
	let descQui = verifDroitAccesFonctionAdmin(pseudo,qui,PRIVBAN,"bannir un pseudo")
	descQui.isBan = (descQui.isBan) ? 0 : Date.now()
	if (descQui.isBan) {
		descQui.ff14Id    && bannedIds.ids.set(descQui.ff14Id,qui)
		descQui.discordId && bannedIds.ids.set(descQui.discordId,qui)
		descQui.b64uRawId && bannedIds.ids.set(descQui.b64uRawId,qui)
		wsserver.forceDisconnect(descQui.pseudo)
	}
	else {
		bannedIds.ids.delete(descQui.ff14Id)
		bannedIds.ids.delete(descQui.discordId)
		bannedIds.ids.delete(descQui.b64uRawId)
	}
	// commit datastore
	savePseudo(descQui)
	collections.save(bannedIds)
	// log
	let msg = "# ADMIN BAN: "+pseudo+" a modifié "+qui+": isBan="+ descQui.isBan
	console.log(msg)
	whDiscord.whPostMasterLog(msg)
	gbl.exception({ isBan: descQui.isBan} , 200)
}
// delete d'un user sur le serveur
function deletePseudo(pseudo,qui) {
	let descQui = verifDroitAccesFonctionAdmin(pseudo,qui,PRIVDELETE,"supprimer un pseudo sur le server")
	// commit
	rawDeletePseudo(qui)
	// log
	let msg = "# ADMIN DELETE: "+pseudo+" a supprimé "+qui+" du server"
	console.log(msg)
	whDiscord.whPostMasterLog(msg)
	gbl.exception({ pseudo: qui} , 200)
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
	// if (!authenticator.flags.userVerified) gbl.exception("Pas d'intération utilisateur pour valider (verified)",400)
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
	console.log(pseudoDesc,p)
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
/*
///////////////////////////////////////////////////
// NEW WEBAUTH
///////////////////////////////////////////////////
async function webauthnNew(pseudo,body,ipFor) {
	let p = JSON.parse(body)
	// console.log("webauthnNew",p)
	let ff14Id = await precondAuth(p)

	// verification que pas encore existant
	let pseudoDesc = getDesc(null,p.prenom,p.nom,p.monde)
	if (pseudoDesc) gbl.exception("Tu es déjà enregistré sur un autre équipement",202)

	// un NEW en webauthn necessite la présence sur discord de la Grande Peluche
	verifyDiscord(p.prenom,p.nom,p.monde,p.ff14Id)

	// nouveau pseudo
	let tPseudo = buildNewPseudo(p.prenom)

	// creation du pseudo
	let tPseudoDesc = {
		pseudo: tPseudo,
		ff14Id: ff14Id,
		typeAuth: "webauthn", 
		jwkPublicKey: p.jwkPublicKey,
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
// RENEW WEBAUTHN
///////////////////////////////////////////////////
async function webauthnRenew(pseudo,body,ipFor) {
	let p = JSON.parse(body)
	let ff14Id = await precondAuth(p)
	let pseudoDesc = getDesc(pseudo,p.prenom,p.nom,p.monde)
	if (!pseudoDesc) gbl.exception("webauthnRenew impossible, prenom/nom/mode invalide",400)
	if (!pseudoDesc.b64uRawId) gbl.exception("webauthnRenew impossible, b64uRawId inexistant",400)

	// un RENEW en webauthn necessite la présence sur discord de la Grande Peluche
	verifyDiscord(pseudoDesc.prenom,pseudoDesc.nom,pseudoDesc.monde,ff14Id)

	// vérification authenification
	await verifyVaultAuthentification(pseudoDesc,p)	

	// verification de l'ephemere par la nouvelle elliptique
	await verifyElipticSignature(pseudoDesc.ephemere,p.jwkPublicKey,p.b64uElipticSignature)

	// Commit du renew
	// Les données sont confirmées, on met à jour pseudoDesc avec les données recues
	pseudoDesc.jwkPublicKey = p.jwkPublicKey // Maj de la clef eliptique
	pseudoDesc.lastRenewDth = Date.now()
	pseudoDesc.ephemere = null // annule l'ephémere
	pseudoDesc.ephemereDthEcheance = 0 // annule l'ephémere
	pseudoDesc.typeAuth="webauthn" // on force la nature de l'auth comme cela a été validé par un vault sécurisé
	savePseudo(pseudoDesc)

	console.log("webauthnRenew PseudoDesc",pseudoDesc)
	return { pseudo: pseudoDesc.pseudo }
}
///////////////////////////////////////////////////
// WEBAUTHN contexte
///////////////////////////////////////////////////
/*
function webauthnContext(req,pseudo,prenom,nom,monde) {
	let rpId = (req.headers['referer'] == 'https://svelte.dev/')? "svelte.dev" : "ff14.adhoc.click"

	let pseudoDesc = getDesc(pseudo,prenom,nom,monde)
	if (!pseudoDesc)
		return {
			rpId: rpId,
			rpName: "La Grande Peluche via webauthn",
			etat: "new"
		}

	// TEST SI POSSIBLE DOUBLE AUTH
	// if (pseudoDesc.typeAuth != "webauthn") gbl.exception("webauthnContext: changement de chemin de sécurité",422)

	let etat=	( pseudoDesc.b64uRawId && (pseudoDesc.lastRenewDth||0) < Date.now()-DELAIRENEW )? "renew" :
						( pseudoDesc.b64uRawId && pseudoDesc.jwkPublicKey)? "ok" :
						gbl.exception("webauthnContext: securité obsolète non supporté",422)

	pseudoDesc.ephemere = gbl.uuidv4() // marque toujours le derier ephemere
	pseudoDesc.ephemereDthEcheance = Date.now() + DELAIEPHEMERE

	return {
		rpId: rpId,
		rpName: "La Grande Peluche via webauthn",
		ephemere: pseudoDesc.ephemere,
		ephemereDthEcheance: pseudoDesc.ephemereDthEcheance,
		typeAuth: "webauthn", 
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
//
///////////////////////////////////////////////////
// NEW DISCORD
///////////////////////////////////////////////////
async function discordNew(pseudo,body,ipFor) {
	let p = JSON.parse(body)

	// verification du challenge via l'oAuth Discord
	if (! embDiscord.isValidToken(p.discordToken,p.discordCode))
		gbl.exception("Token oAuth Discord invalide ou périmé",400)

	// verif du discord Id pour le NEW
	if (! gbl.isNumeric(p.discordId) )
		gbl.exception("discordId invalide ou non safe ",400)

	// verif nom et lodestone
	let ff14Id = await precondAuth(p)

	// verification que pas encore validé
	let pseudoDesc = getDesc(null,p.prenom,p.nom,p.monde)
	if (pseudoDesc) gbl.exception("Tu es déjà enregistré sur un autre équipement",202)

	// nouveau pseudo
	let tPseudo = buildNewPseudo(p.prenom)

	// creation du pseudo
	let tPseudoDesc = {
		pseudo: tPseudo,
		ff14Id: ff14Id,
		typeAuth: "discord", 
		discordId : p.discordId,
		jwkPublicKey: p.jwkPublicKey,
		lastRenewDth: Date.now(),
		ephemere: p.challengeUsed,
		ephemereDthEcheance: Date.now() + DELAIEPHEMERE,
		prenom: p.prenom,
		nom: p.nom,
		monde: p.monde,
		ip: ipFor
	}

	// commit auth site
	tPseudoDesc.ephemere = null
	tPseudoDesc.ephemereDthEcheance = 0
	pseudos[tPseudo]=tPseudoDesc
	savePseudo(tPseudoDesc)
	console.log("discordNew PseudoDesc",tPseudoDesc)

	// update discord pour role et acces (inutile avec oAuth discord)
	//discord.newSiteUser(tPseudo)

	return { pseudo: tPseudoDesc.pseudo }
}
///////////////////////////////////////////////////
// RENEW DISCORD
///////////////////////////////////////////////////
async function discordRenew(pseudo,body,ipFor) {
	let p = JSON.parse(body)

	console.log("discordRenew",p)
	// verification du challenge via l'oAuth Discord
	if (! embDiscord.isValidToken(p.discordToken,p.discordCode))
		gbl.exception("Token oAuth Discord invalide ou périmé",400)
	
	// verif nom et lodestone
	let ff14Id = await precondAuth(p)

	let pseudoDesc = getDesc(pseudo,p.prenom,p.nom,p.monde)
	if (!pseudoDesc) gbl.exception("discordRenew impossible, prenom/nom/mode introuvable",400)

	// verification de l'ephemere par la nouvelle elliptique
	await verifyElipticSignature(pseudoDesc.ephemere,p.jwkPublicKey,p.b64uElipticSignature)

	if (!pseudoDesc.discordId || typeof pseudoDesc.discordId !="string") {
		// cas d'un user en dernier acces webauthn mais en renew discord
		let { usrId } = verifyDiscord(pseudoDesc.prenom,pseudoDesc.nom,pseudoDesc.monde,ff14Id)
		pseudoDesc.discordId = usrId
	}

	// Commit du renew
	// Les données sont confirmées, on met à jour pseudoDesc avec les données recues
	pseudoDesc.typeAuth="discord" // on force la nature de l'auth comme cela a été validé par un vault sécurisé
	pseudoDesc.jwkPublicKey = p.jwkPublicKey // Maj de la clef eliptique
	pseudoDesc.lastRenewDth = Date.now()
	pseudoDesc.ephemere = null // annule l'ephémere
	pseudoDesc.ephemereDthEcheance = 0 // annule l'ephémere
	savePseudo(pseudoDesc)

	console.log("discordRenew PseudoDesc",pseudoDesc)
	return { pseudo: pseudoDesc.pseudo }
}
///////////////////////////////////////////////////
// DISCORD Contexte
///////////////////////////////////////////////////
function discordContext(req,pseudo,prenom,nom,monde) {
	let pseudoDesc = getDesc(pseudo,prenom,nom,monde)
	if (!pseudoDesc)
		return {
			rpId: "discord proxy",
			rpName: "La Grande Peluche via Discord",
			etat: "new"
		}

	// TEST SI POSSIBLE DOUBLE AUTH
	// if (pseudoDesc.typeAuth != "discord") gbl.exception("discordContext: changement de chemin de sécurité",299)

	if (! embDiscord.isValidNick(pseudoDesc.discordId,pseudoDesc.prenom,pseudoDesc.nom,pseudoDesc.monde))gbl.exception("discordContext: Discord Nick invalide",498)

	let etat=	
						( (pseudoDesc.lastRenewDth||0) < Date.now()-DELAIRENEW )? "renew" :
						( pseudoDesc.jwkPublicKey)? "ok" :
						gbl.exception("discordContext: Etat incoherent lastRenew, jwkPublicKey",499)

	pseudoDesc.ephemere = gbl.uuidv4() // marque toujours le derier ephemere
	pseudoDesc.ephemereDthEcheance = Date.now() + DELAIEPHEMERE

	return {
		rpId: "discord proxy",
		rpName: "La Grande Peluche via Discord",
		typeAuth: "discord", 
		discordId: pseudoDesc.discordId,
		ephemere: pseudoDesc.ephemere,
		ephemereDthEcheance: pseudoDesc.ephemereDthEcheance,
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
*/
///////////////////////////////////////////////////
// common entre DIscord et webauthn
///////////////////////////////////////////////////
function buildNewPseudo(prenom) {
	// détermination du pseudo non affecté pour l'instant
	let suffixe = ""
	while (pseudos[prenom+suffixe])
		suffixe = (suffixe!="")? suffixe+1 : 1
	return prenom+suffixe
}
// verif précond PNML (sans vérif lodestone)
function precondPNML(p,n,m,l) {
	if (!gbl.isPseudoValid(p)) gbl.exception("fuckP",404)
	if (!gbl.isPseudoValid(n)) gbl.exception("fuckN",404)
	if (!gbl.isPseudoValid(m)) gbl.exception("fuckM",404)
	if (!gbl.isNumeric(l)) gbl.exception("fuckL",404)
	return true
}
// verif précond PNMLD et eliptique (AVEC vérif lodestone et test ban/lodestone ou discordId)
// retourne le INT FF14ID validé depuis le lodestone
async function precondAuthEs(p,n,m,l,d,es) {
	precondPNML(p,n,m,l)
	// vérif de la validité de la clef elliptique
  try { await subtle.importKey( "jwk", es, ECKEYIMPORTPARAMS, false, ["verify"] ) }
	catch (e) { console.log("precondAuth",e); gbl.exception("precondAuth Cle publique elliptique invalide: "+e.message, 400) }
	// verfis lodestone server 
	console.log("precondAuthEs",p,n,m,l,d)
	const ff14Id = await lodestone.getFF14Id(p,n,m)
	console.log("precondAuthEs",p,n,m,l,d,ff14Id)
	if (ff14Id != parseInt(l,10)) gbl.exception("precondAuth FF14ID mismatch entre client et server",400)
	if (isBannedId(ff14Id)) gbl.exception("Tu es banni",403)
	if (d && isBannedId(d)) gbl.exception("Tu es banni",403)
	return ff14Id
}
///////////////////////////////////////////////////
// NEW
///////////////////////////////////////////////////
async function authNew(req,body,pseudo,p,n,m,l,d) {
	let rpIdDesc = getRpIdDescFromReferer(req.headers['referer'])
	let oBody = JSON.parse(body)
	let ff14Id = await precondAuthEs(p,n,m,l,d,oBody.newJwkPublicKey)

	getDesc(pseudo,p,n,m) && gbl.exception("new impossible, existant",400)

	// creation du pseudo temporaire
	let tPseudo = buildNewPseudo(p) // calcul nouveau pseudo
	let tPseudoDesc = {
		pseudo: tPseudo,
		prenom: p,
		nom: n,
		monde: m,
		ff14Id: ff14Id,
		discordId: d,
		typeAuth: rpIdDesc.auth,
		jwkPublicKey: oBody.newJwkPublicKey,
		b64uRawId: oBody.b64uRawId,
		b64uVaultPublicKey: oBody.b64uVaultPublicKey,
		vaultAlgorithm: oBody.vaultAlgorithm,
		vaultTransports: oBody.vaultTransports,
		lastRenewDth: Date.now(),
		ephemere: oBody.challengeUsed,
		ephemereDthEcheance: Date.now() + DELAIEPHEMERE,
		privilege: 0,
		p_ip: req.headers['x-forwarded-for']
	}

	switch (rpIdDesc.auth) {
		case "webauthn": {
			let dDesc = verifyDiscord(p,n,m,l) // un NEW en webauthn necessite la présence sur discord de la Grande Peluche
			await verifyVaultRegistration(tPseudoDesc,oBody)	
			tPseudoDesc.discordId = dDesc.usrId
			break
		}
		case "discord": {
			// TODO TOKEN DISCORD doit recup le discordId
			console.log("********************** MANQUE GESTION DU TOKEN DISCORD")
			if (! embDiscord.isValidNick(d,tPseudoDesc.prenom,tPseudoDesc.nom,tPseudoDesc.monde))
				gbl.exception("authRenew: nick mismatch",498)
			tPseudoDesc.discordId = d
			break
		}
		default: gbl.exception("typeAuth invalide",500)
	}

	tPseudoDesc.ephemere = null // ephemere a renégocier apres le new
	tPseudoDesc.ephemereDthEcheance = 0
	pseudos[tPseudo]=tPseudoDesc // commit pseudo
	savePseudo(tPseudoDesc)

	switch (rpIdDesc.auth) {
		case "webauthn": {
			discord.newSiteUser(tPseudo) // update discord grande Peluche pour role et acces
			break
		}
		case "discord": {
			break
		}
	}

	gbl.exception( { pseudo: tPseudoDesc.pseudo } , 200)
}

///////////////////////////////////////////////////
// RENEW
///////////////////////////////////////////////////
async function authRenew(req,body,pseudo,p,n,m,l,d) {
	let rpIdDesc = getRpIdDescFromReferer(req.headers['referer'])
	let oBody = JSON.parse(body)
	console.log("authRenew",oBody)
	let ff14Id = await precondAuthEs(p,n,m,l,d,oBody.newJwkPublicKey)

	let pseudoDesc = getDesc(pseudo,p,n,m) || gbl.exception("authRenew impossible, introuvable",400)

	if (pseudoDesc.isBan) gbl.exception("Tu es banni",403)
	if ( (pseudoDesc.prenom != p) || (pseudoDesc.nom != n) || (pseudoDesc.monde != m) || (pseudoDesc.ff14Id != ff14Id) ) gbl.exception("authRenew impossible, PNML incoherent",400)

	// Verification vault ou discord
	switch (rpIdDesc.auth) {
		case "webauthn":
			if (!pseudoDesc.b64uRawId) gbl.exception("b64uRawId inexistant",400)
			verifyDiscord(pseudoDesc.prenom,pseudoDesc.nom,pseudoDesc.monde,pseudoDesc.ff14Id)
			await verifyVaultAuthentification(pseudoDesc,oBody)	
			break
		case "discord":
			// TODO TOKEN DISCORD doit recup le discordId
			console.log("********************** MANQUE GESTION DU TOKEN DISCORD")
			if (! embDiscord.isValidNick(d,pseudoDesc.prenom,pseudoDesc.nom,pseudoDesc.monde))
				gbl.exception("authRenew: nick mismatch",498)
			break
		default: gbl.exception("authRenew: typeAuth invalide",400)
	}
	
	// verification de l'ephemere par la nouvelle elliptique
	await verifyElipticSignature(pseudoDesc.ephemere,oBody.newJwkPublicKey,oBody.b64uElipticSignature)

	// Commit du renew
	pseudoDesc.jwkPublicKey = oBody.newJwkPublicKey // Maj de la clef eliptique
	pseudoDesc.lastRenewDth = Date.now()
	pseudoDesc.ephemere = null // annule l'ephémere
	pseudoDesc.ephemereDthEcheance = 0 // annule l'ephémere
	savePseudo(pseudoDesc)

	// console.log("webauthnRenew PseudoDesc",pseudoDesc)
	gbl.exception( { pseudo: pseudoDesc.pseudo } , 200)
}
///////////////////////////////////////////////////
// Contexte attention, multiples code retour http
///////////////////////////////////////////////////
function getContexte(req,body,pseudo) {
	// console.log("************************** contexte headers",req.headers)
	let oBody = JSON.parse(body)
	let p = oBody.prenom
	let n = oBody.nom
	let m = oBody.monde
	let l = oBody.ff14Id
	let d = gbl.isNumeric(oBody.discordId) && oBody.discordId || null

	precondPNML(p,n,m,l)

	// isBan FF14ID ou DISCORDID?
	if (l && isBannedId(l)) gbl.exception("Tu es banni",403)
	if (d && isBannedId(d)) gbl.exception("Tu es banni",403)

	let rpIdDesc = getRpIdDescFromReferer(req.headers['referer'])
	let isDiscord = rpIdDesc.auth=="discord"
	let pseudoDesc = getDesc(pseudo,p,n,m)

	console.log("contexte",rpIdDesc,pseudoDesc)

	if (!pseudoDesc)
		gbl.exception( {
			rpId: rpIdDesc.n,
			rpName: "La Grande Peluche",
			step: "contexte server",
			typeAuth: rpIdDesc.auth,
			etat: "new",
			prenom: p,
			nom: n,
			monde: m,
		}, 200)

	// si isBan ou WEBAUTH ban
	if (pseudoDesc.isBan || (pseudoDesc.b64uRawId && isBannedId(pseudoDesc.b64uRawId))) gbl.exception("Tu es banni",403)

	if (pseudoDesc.ff14Id != l) gbl.exception("contexte: ffId mismatch",497)

	if (isDiscord && ! embDiscord.isValidNick(d,pseudoDesc.prenom,pseudoDesc.nom,pseudoDesc.monde))
		gbl.exception("contexte: nick mismatch",498)

	let etat=	( !isDiscord && pseudoDesc.b64uRawId && (pseudoDesc.lastRenewDth||0) < Date.now()-DELAIRENEW )? "renew" :
						( !isDiscord && pseudoDesc.b64uRawId && pseudoDesc.jwkPublicKey)? "ok" :
						( isDiscord && (pseudoDesc.lastRenewDth||0) < Date.now()-DELAIRENEW )? "renew" :
						( isDiscord && pseudoDesc.jwkPublicKey)? "ok" :
						gbl.exception("contexte: tech mismatch",499)

	pseudoDesc.ephemere = gbl.uuidv4() // nouvelle ephemere
	pseudoDesc.ephemereDthEcheance = Date.now() + DELAIEPHEMERE

	gbl.exception( {
		rpId: rpIdDesc.n,
		rpName: "La Grande Peluche",
		step: "contexte server",
		pseudo: pseudoDesc.pseudo,
		prenom: pseudoDesc.prenom,
		nom: pseudoDesc.nom,
		monde: pseudoDesc.monde,
		typeAuth: rpIdDesc.auth,
		b64uRawId: pseudoDesc.b64uRawId,
		// discordId: pseudoDesc.discordId,
		ephemere: pseudoDesc.ephemere,
		ephemereDthEcheance: pseudoDesc.ephemereDthEcheance,
		privilege: pseudoDesc.privilege,
		etat: etat
 }, 200)
}
//
///////////////////////////////////////////////////
// API
///////////////////////////////////////////////////
async function httpCallback(req, res, method, reqPaths, body, pseudo, pwd) {
	switch(method) {
		// TODO separer les public des auths pour mettre OPTIONS sur condition
		case "OPTIONS":
			res.setHeader('Access-Control-Allow-Methods', 'DELETE, PUT, PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET":
			switch (reqPaths[2]) {
				case 'admin' :
					// ADMIN SERVER
					checkPseudo(pseudo,pwd,true)
					gbl.exception(pseudos,200)
				case 'adminClient' :
					// ADMIN CLIENT
					checkPseudo(pseudo,pwd,false,0xFFFFFF)
					gbl.exception(pseudos,200)
				case 'getBannedIds' :
					// ADMIN CLIENT
					checkPseudo(pseudo,pwd,false,0xFFFFFF)
					gbl.exception([... bannedIds.ids],200)
				default: gbl.exception("get bad op "+reqPaths[2],400)
			}
		case "POST":
			switch (reqPaths[2]) {
				case 'contexte' :
					// sans auth
					getContexte(req,body,pseudo)
					gbl.exception("contexte erreur serveur",500);
				default: gbl.exception("post bad op "+reqPaths[2],400)
			}
		case "PUT":
			switch (reqPaths[2]) {
				case 'authnew' :
					// sans auth
					await authNew(req,body,pseudo,reqPaths[3],reqPaths[4],reqPaths[5],reqPaths[6],reqPaths[7])
					gbl.exception("new erreur serveur",500);
				case 'authrenew' :
					// sans auth
					await authRenew(req,body,pseudo,reqPaths[3],reqPaths[4],reqPaths[5],reqPaths[6],reqPaths[7])
					gbl.exception("renew erreur serveur",500);
				default: gbl.exception("put bad op "+reqPaths[2],400)
			}
		case "PATCH":
			// fonctions pour les admins
			switch (reqPaths[2]) {
				case 'togglePriv' :
					checkPseudo(pseudo,pwd,false,PRIVDROITS) // droits dupdate
					togglePrivilege(pseudo,reqPaths[3],reqPaths[4])
					gbl.exception("erreur togglePriv",500);
				case 'toggleBan' :
					checkPseudo(pseudo,pwd,false,PRIVBAN) // droits de ban
					toggleBan(pseudo,reqPaths[3])
					gbl.exception("erreur toggleBan",500);
				case 'deletePseudo' :
					checkPseudo(pseudo,pwd,false,PRIVDELETE) // droits de delete
					deletePseudo(pseudo,reqPaths[3])
					gbl.exception("erreur toggleBan",500);
				default: gbl.exception("bad patch "+reqPaths[2],400)
			}
		case "DELETE":
			// delete par server admin
			checkPseudo(pseudo,pwd,true)
			let ret= rawDeletePseudo(reqPaths[2]);
			gbl.exception(ret,200);
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
exports.checkPrivilege = checkPrivilege; 
exports.httpCallback = httpCallback;
exports.deletePseudoByFf14Id = deletePseudoByFf14Id
exports.validatePwd = validatePwd
exports.invalidatePwd = invalidatePwd
exports.verifyElipticSignature = verifyElipticSignature
exports.verifyElipticEcheance = verifyElipticEcheance
exports.rawSetPrivilege = rawSetPrivilege
exports.isBannedId = isBannedId
// LES ELEMENTS SUIVANTS DOIVENT ETRE DEFINIS ET COHERENTS DANS le ground du client
exports.PRIVCODEX =		 PRIVCODEX // fonction d'admin "CODEX"
exports.PRIVENIGME =	 PRIVENIGME // fonction d'admin "ENIGME"
exports.PRIVACCES =		 PRIVACCES // possibilité d'acces aux pages clients meme verouillées
exports.PRIVBAN = 		 PRIVBAN  // possibilité delete/ban
exports.PRIVDROITS =	 PRIVDROITS // gestion des droits < 0xFFFFFF
exports.PRIVSADMIN =	 PRIVSADMIN // superadmin

console.log("Pseudos loaded");


