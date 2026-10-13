
const crypto = require('crypto');
const gbl = require( '../infraback/gbl.js');
const vault = require( '../infraback/vault.js');
const embDiscord = require( '../infraback/embDiscord.js');
const Mutex = require( '../infraback/mutex.js');
const pseudos = require( '../infraback/pseudos.js');


const DISCORDURLPREFIX="https://discord.com/api/v10/"
const DISCORDHEADERS = {
			"User-Agent": "DiscordBot (https://ff14.adhoc.click), 1.0.1)",
			"Content-Type": "application/json; charset=UTF-8",
			"Authorization": 'Bot ' + vault.get('discord_token') 
}
const MPKIKIADOC = "<@"+vault.get('mpKikiadoc')+">"
const MASTERLOG = vault.get("whMasterLog")

/*
const idKikiadoc = '289493566278074368'
const idGrandePeluche='1188482855026839583';
const genericDiscordTrailer="\n-\n"+((gbl.isProd())?"":"**(STAGING)**")+"Signé: *Hildiscord, assistant Discord de la Grande Peluche*" +
                  "\nSoucis? MP "+MPKIKIADOC
*/

const WHURLSTART = "https://discord.com/api/webhooks/"
const DISCORDDELAI = 200	// max 5 requetes par secondes

const HILDISCORDTRAILER = {
	title: "/gp pour participer",
	description: "Souci? MP "+MPKIKIADOC,
	footer: { text: ( (gbl.isProd()) ?	"" : "(STAGING) " ) + "Signé: Hildiscord, assistant de la Grande Peluche" } ,
	color: 0x808080,
}

//////////////////////////////////////////////////////////////////////////////////
// contextes des instances des apps
//////////////////////////////////////////////////////////////////////////////////
const ASN = Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]) // Préambule ASN.1 pour Ed25519
const APPCONTEXT = {
	"1523960774723375206" : {
		nom: "GP FF14 STAGING",
		publicKeyStr: null, // calculée juste en dessous
		botTokenStr: null, // calculée juste en dessous
		publicKey : null, // calculée juste en dessous
		headers : null, // calculée juste en dessous
		addCommandes: [], // [ {name: "gp", description: "Invoque la Grande Peluche (STAGING)", type: 1} ] , // commande associée
		delCommandes: [], // [ {id: "1557728153424896102" } ] ,
	},
	"1523699928701075677" : {
		nom: "GP FF14 PROD",
		publicKeyStr: null, // calculée juste en dessous
		botTokenStr: null, // calculée juste en dessous
		publicKey : null, // calculée juste en dessous
		headers : null, // calculée juste en dessous
		addCommandes: [], //[ {name: "gp", description: "Invoque la Grande Peluche", type: 1} ] , // commande associée
		delCommandes: [], //[ {id: "1557728153424896102" } ] ,
	}
}
// complement lors de l'init: clef crypto.. enregistrement de commande etc
Object.entries(APPCONTEXT).forEach( ([appId,obj]) => {
	obj.publicKeyStr = vault.get("whDiscordPublicKey_"+appId)
	obj.botTokenStr = vault.get("whDiscordBotToken_"+appId)
	// calcule la publicKey
	const publicKeyBuffer = Buffer.from(obj.publicKeyStr,"hex")
	obj.publicKey = crypto.createPublicKey({ key: Buffer.concat([ ASN, publicKeyBuffer ]), format: 'der', type: 'spki' })
	// headers a utiliser
	obj.headers = { 'Authorization': 'Bot '+obj.botTokenStr, 'Content-Type': 'application/json' }
	// endpoint api pour l'app
	const url = DISCORDURLPREFIX+"applications/"+appId+"/commands"
	// affiche les commandes définies
	gbl.apiCallExtern(url,'GET',null,obj.headers,"json") . then( (r)=> {console.log("****** whDiscord liste des commandes",appId,url,r) } )
	// enregistre / delete la commande si besoin
	obj.addCommandes.forEach ( (a) => {
		gbl.apiCallExtern(url,'POST',a,obj.headers,"json") . then( (r)=> {console.log("****** whDiscord Init, cmd register:",url,r) } )
	})
	obj.delCommandes.forEach ( (d) => {
		gbl.apiCallExtern(url+"/"+d.id,'DELETE',obj.addCommande,obj.headers,"json") . then( (r)=> {console.log("****** whDiscord Init, cmd delete:",url,r) } )
	})
})

//////////////////////////////////////////////////////////////////////////////////
// recup contextes d'une appId
//////////////////////////////////////////////////////////////////////////////////
function getContext(appId) {
	return APPCONTEXT[appId]
}

//////////////////////////////////////////////////////////////////////////////////
// VERIF CRYPTO
//////////////////////////////////////////////////////////////////////////////////
function verifyDiscordHeaders(ctx,req,rawBodyStr) {
	// X-Signature-Ed25519 as a signature
	// X-Signature-Timestamp as a timestamp
	try {
		const signature = req.headers['x-signature-ed25519'];
		const timestamp = req.headers['x-signature-timestamp'];
  	if (!signature || !timestamp) {
			console.log("Headres discord manquant")
			return 401
		}
		// verif timestamp
		const now = Math.floor(Date.now() / 1000);
		if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
			console.log("verifyDiscordHeaders bad timestamp",timestamp)
			return 401
		}
		// construction du payload
		const payload = Buffer.from(timestamp + rawBodyStr);
  	const signatureBuffer = Buffer.from(signature, 'hex');
	
		// verif crypto
		const isValid = crypto.verify(undefined, payload, ctx.publicKey, signatureBuffer);
		if (!isValid) {
			console.log("verifyDiscordHeaders crypto invaide")
			return 401
		}
	}
	catch(e) {
			console.log("verifyDiscordHeaders exception", e)
			return 400
	}
	// requete valide
	return 200
}

//////////////////////////////////////////////////////////////////////////////////
// Gestion des requetes Discord (max 5/req par seconde)
//////////////////////////////////////////////////////////////////////////////////
let discordLock = new Mutex();
async function apiCallDiscord (url,method,body,headers,parsing) {
	let ret = null
	try {
		await discordLock.P()
		await discordLock.D(DISCORDDELAI)
		ret = await gbl.apiCallExtern(url,method,body,headers,parsing)
		if (ret.status != 200) console.log('*** apiCallDiscord ERREUR:',url,ret,body)
	}
	finally {
		discordLock.V()
	}
	return ret
}
//////////////////////////////////////////////////////////////////////////////////
// faciliteur de message sur un WH
//////////////////////////////////////////////////////////////////////////////////
function whCheckUrl(url) {
  if (!url || !url.startsWith(WHURLSTART) ) gbl.exception("Url WebHook invalide",400)
  return url
}
function whCheckRich(r) {
	let eh = (typeof r == "object")? Object.assign({},r) : { embeds: [ { description: r} ] }
	if (! eh.embeds ) gbl.exception("whCheckRich richMsg invalide",400)
	eh.embeds.push(HILDISCORDTRAILER)
	eh.username="Grande Peluche"
	return eh
}
async function whPostMessage(wh,richMsg,noMaster) {
	whCheckUrl(wh)
	let msg = whCheckRich(richMsg)
	if (!noMaster && wh != MASTERLOG) gbl.promIndep( apiCallDiscord(MASTERLOG+"?wait=true",'POST',msg,DISCORDHEADERS,'json') )
	return await apiCallDiscord(wh+"?wait=true",'POST',msg,DISCORDHEADERS,'json')
}
function whPostMasterLog(richMsg) {
	let msg = whCheckRich(richMsg)
	gbl.promIndep( apiCallDiscord(MASTERLOG+"?wait=true",'POST',msg,DISCORDHEADERS,'json') )
}
//////////////////////////////////////////////////////////////////////////////////
// lancemene de l'activité
//////////////////////////////////////////////////////////////////////////////////
const ACTIVOK = JSON.stringify( {type: 12, data: { content: "Bonjour ! "}} ) 
const ACTIVBANNI = JSON.stringify( {type: 4, data: { content: "Je ne souhaite pas communiquer avec toi."}} ) 
function lanceActivite(res,oBody) {
	let discordId = oBody.member?.user?.id
	if (!discordId || pseudos.isBannedId(discordId)) {
		res.statusCode = 200
		res.end(ACTIVBANNI)
		gbl.exception(null,999)
	}
	// enregistre le membre/nick utilisé
	embDiscord.setDiscordMembre(discordId,oBody.member)
	res.statusCode = 200
	res.end(ACTIVOK)
	gbl.exception(null,999)
}
////////////////////////////////////////////
////////////////////////////////////////////
// webhook HTTP
////////////////////////////////////////////
////////////////////////////////////////////
const PINGACK = JSON.stringify( {type:1} )
const BADCRYPTO = JSON.stringify( {m:"cryptographie invalide"} )
const BADAPPID = JSON.stringify( {m:"url non conforme"} )
const BADOP = JSON.stringify( {m:"requete invalide"} )
const IGNORE = JSON.stringify( {m:"ignore"} )

async function httpCallback (req, res, method, reqPaths, body, pseudo, pwd, rawBodyBuffer) {
	// les urls de webhook doivent indiquer une appId
	let appContext = getContext(reqPaths[2])
	if (!appContext) {
		res.statusCode=401
    res.end(BADAPPID)
		gbl.exception(null,999)
	}
	// dans tous les cas, vérif de sécurité
	let verifCode = verifyDiscordHeaders(appContext,req,rawBodyBuffer)
	if (verifCode != 200) {
		res.statusCode=verifCode
    res.end(BADCRYPTO)
		gbl.exception(null,999)
	}
	// parse le body
	let oBody = JSON.parse(body)
	console.log("whDiscord oBody:",oBody)
	// si dans la requete on a un token
	// stockage dans le appContext (volatile)
	if (oBody.token) appContext.token = oBody.token

	switch (method) {
		case 'POST': {
			if (oBody.type==1) {
				// Ping
				// res.statusCode=204
        // res.end()
        res.statusCode = 200
				res.end(PINGACK)
				gbl.exception(null,999)
			}
			if (oBody.type==2) {
				lanceActivite(res,oBody)
			}
			res.statusCode=200
      res.end( IGNORE )
			gbl.exception(null,999)
		}
	}
	
	res.statusCode=400
  res.end(BADOP)
	gbl.exception("bad op",999);
}


exports.WHURLSTART = WHURLSTART
exports.whPostMessage = whPostMessage
exports.whPostMasterLog = whPostMasterLog
exports.apiCallDiscord = apiCallDiscord
exports.httpCallback = httpCallback
