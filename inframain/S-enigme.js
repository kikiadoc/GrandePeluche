const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');
const pCloud = require('../infraback/pCloudTools.js');
const imageTools = require('../infraback/imageTools.js');
const whDiscord = require('../infraback/whDiscord.js');
const Mutex = require('../infraback/mutex.js');

// URL utilisasé dans les embed vers discord
const UNIVERSALISURL = "https://universalis.app/market/"
const TEAMCRAFTURL = "https://ffxivteamcraft.com/db/fr/item/"

// nom de la collection dans le datastore
const COLNAME="S-enigme"

const CONF= {
	NBPSEUDOMAX: 10, // nombre max de pseudos postant des énigmes
	NBENIGMEMAX: 10, // nombre max d'enigmes par pseudo
	NBENIGMETOT: 30, // nombre max d'enigmes au total
	NBCHARMIN: 20, // nombre char min par énigme
	NBCHARMAX: 1000, // nombre char max par énigme
	DTHMIN: 3600000, // 1 heure
	DTHMAX: 30*24*3600000, // 30 jours
	DTHDUR: 24*3600000, // 1 jour
	GILSMIN: 1000,
	GILSMAX: 1000000,
	COORDMAX: 50,
	INCERTMAX: 1,
	OIDMIN: 0,
	OIDMAX: 1000000,
	PRIVMSK:  pseudos.PRIVENIGME,
	TIMERREP: 30*60000, // 30 minutes
}
const CONFJSON = JSON.stringify(CONF)

// Reset global
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	let oldMasterIdx = etat?.idx || 0 // Le master index est conserve
	etat = normalize(collections.reset(COLNAME))
	etat.idx = oldMasterIdx
	etat.p_admin ??= {}
	etatSync()
}
// Etat global
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.idx ??= 0
	e.pseudos ??= {} // enigmes indexées par le pseudo
	e.p_admin ??= {} // champ prive non diffusé
	// retourn l'etat normalizé
	return e
}
// Timer locaux pour delta de réponse (non sauvegardé en datastore)
let timersReponse = {}  // indexé par pseudo

// Sauvegarde de l'etat (sans synchro multijoueurs)
function etatSync() {
	// console.log("etatSync",etat)
	collections.save(etat)
}
// client Sync avec sauvegarde de l'etat
function clientsSync(texte,ding) {
	etatSync()
  wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
  if (texte) wsserver.broadcastSimpleText(texte, "lightgreen", ding, 10)
}
// retourne un tableau de toutes les enigmes définies
function etatGetAll() {
	let tblEnigmes = []
	Object.keys(etat.pseudos).forEach ( (p) => {
		tblEnigmes = tblEnigmes.concat(etat.pseudos[p].enigmes)
	} )
	return tblEnigmes
}

///////////////////////////////////////////////////////////////////////////////
// Construction d'un rich msg depuis une enigme
///////////////////////////////////////////////////////////////////////////////
function enigmeRich(en) {
	return {
		username: "Grande Peluche",
		// avatar_url: imageGP
		embeds : [
			{
				title: "Enigme de "+en.pseudo,
				description:	"⏱️<t:" + Math.floor(en.finDth/1000) + ">\n" +
											( (en.gils) ? "💰"+en.gils : "" ) +
											( (en.objetNom) ? "🎁"+en.objetNom+" [🔎]("+TEAMCRAFTURL+en.objetId+") [📈]("+UNIVERSALISURL+en.objetId+")" : "" ) +
											"\n\n**" + en.enigme + "**\n" +
											( (en.indice)? "\nIndice texte:\n"+en.indice : "" ) +
											( (en.CDN)? "\n[Indice image🔎](<"+gbl.cdnUrlAI+en.CDN+">)" : "") 
											,
				color: 0x00FFFF,
				footer: { text: 'idx:'+en.idx },
				image: (en.CDN)? { url: gbl.cdnUrlAI + en.CDN } : null,
			}
		]
	}
}
///////////////////////////////////////////////////////////////////////////////
// configuration / administration
///////////////////////////////////////////////////////////////////////////////
async function adminParams(pseudo,body) {
	let o = JSON.parse(body)
	// requete admin...
	if (o.whAnnonce && o.whAnnonce != etat.p_admin.whAnnonce) {
		// test le nouveau wh
		let ret = await whDiscord.whPostMessage(o.whAnnonce,"Ceci est le nouveau channel d'annonces des Enigmes\n(défini par "+pseudo+")" )
		if (ret.status != 200) gbl.exception("Nouveau webook d'annonce invalide",400)
		// annonce le changement
		if (etat.p_admin.whAnnonce) gbl.promIndep(whDiscord.whPostMessage(etat.p_admin.whAnnonce,"Un nouveau channel d'annonces Enigmes a été défini par "+pseudo)) 
		etat.p_admin.whAnnonce = o.whAnnonce
	}
	if (o.whModo && o.whModo != etat.p_admin.whModo) {
		// test le nouveau wh
		let ret = await whDiscord.whPostMessage(o.whModo,"Ceci est le nouveau channel de modération des Enigmes\n(défini par "+pseudo+")" )
		if (ret.status != 200) gbl.exception("Nouveau webook de modération invalide",400)
		// annonce le changement
		if (etat.p_admin.whModo) gbl.promIndep(whDiscord.whPostMessage(etat.p_admin.whModo,"Un nouveau channel de modération des Enigmes a été défini par "+pseudo)) 
		etat.p_admin.whModo = o.whModo
	}
	etatSync()
}
///////////////////////////////////////////////////////////////////////////////
// diffusion des énigmes sur discord
///////////////////////////////////////////////////////////////////////////////
let periodiqueTimerId = null
let periodiqueMutex = new Mutex() 
// Annonce simple sur webhook anonce ou modo
function enigmeAnnonceWebhook(texte,en, isModo=false) {
	let rt = enigmeRich(en)
	rt.content= ".\n### "+texte
	// console.log('enigmeAnnonceWebhook',rt)
	// Queue le webhook mais continue directement
	gbl.promIndep( whDiscord.whPostMessage((isModo)? etat.p_admin.whModo : etat.p_admin.whAnnonce,rt) )
}
// Annonce de modération

// verification périodique nosync indique de ne pas faire le clientsSync
async function enigmesAnalyse() {
	try {
		await periodiqueMutex.P()
		// efface le timer si existant
		if (periodiqueTimerId) clearTimeout(periodiqueTimerId)
		const now = Date.now()
		let nextEcheance = Infinity
		let syncReq = false
		tEnigmes = etatGetAll()
		tEnigmes.forEach( (en) => {
			// si pas encore dispo
			if ( en.debDth > now ) nextEcheance = Math.min(nextEcheance, en.debDth) // prochaine analyse a debDth
			// si pas finie et pas résolue
			if ( en.finDth > now && !en.resolueDth) nextEcheance = Math.min(nextEcheance, en.finDth) // prochaine analyse a finDth
			// si dth dev echu et non publiee ou dth fin échue et non résolues, delete
			if ( (now >= en.debDth && !en.publieeDth) || (now >= en.finDth && !en.resolueDth) ) {
				// deleteTech supprimer dans état mais on a un getAll
				enigmeSupprimerTech(en.pseudo,en.idx)	
				syncReq = true
				if (en.publieeDth) enigmeAnnonceWebhook("Holala, une énigme a disparu de mon Grimoire des Enigmes car personne n'en a trouvé la solution à temps",en)
				return
			}
			// Si enigme publiée, de dth de début echu, publication et marque la publication discord
			if ( en.publieeDth && en.debDth <= now && !en.publieeDiscord ) {
				en.publieeDiscord = true
				nextEcheance = Math.min(nextEcheance, en.finDth) // prochaine analyse a finDth
				enigmeAnnonceWebhook(en.pseudo+" a ajouté une énigme dans mon Grimoire des Enigmes, qui saura la résoudre ?",en)
				syncReq = true
				return
			}
		} )
		// Prochaine écheance si necessaire
		console.log("*********************** Attention, enigmesAnalyse, timer de renew trop rapide")
		if (nextEcheance != Infinity && nextEcheance > now ) setTimeout( enigmesAnalyse, Math.min(nextEcheance-now, 60000) )
		//
		if (syncReq) clientsSync()
	}
	finally {
		periodiqueMutex.V()
	}
}

///////////////////////////////////////////////////////////////////////////////
// enigmes
///////////////////////////////////////////////////////////////////////////////
function enigmeGet(pseudo,idx) {
	let enigmes = etat.pseudos[pseudo]?.enigmes
	if (!enigmes) return null
	return enigmes.find( (e) => e.idx == idx) || null
}
// retourne 200 si OK, ou 400 si taille d'image trop importante
async function enigmeDefinir(pseudo,body) {
	// TODO définition enigmes uniquement si pas de résolue et non honorée
	console.log('enigmeDefinir: ********************* définition enigmes uniquement si pas de résolue et non honorée')
	let jBody = JSON.parse(body)

	// precond globales
	let enigmes = etat.pseudos[pseudo]?.enigmes
	if (enigmes && (enigmes.length >= CONF.NBENIGMEMAX)) gbl.exception("Trop d'énigmes CONF.NBENIGMEMAX="+CONF.NBENIGMEMAX,400)
	if (!enigmes && (Object.keys(etat.pseudos).length >= CONF.NBPSEUDOMAX) ) gbl.exception("Trop de pseudos CONF.NBPSEUDOMAX="+CONF.NBPSEUDOMAX,400)

	// precond specifiques
	if (jBody.enigme?.length >= CONF.NBCHARENIGME) gbl.exception("Texte enigme trop long CONF.NBCHARENIGME="+CONF.NBCHARENIGME,400)
	if (jBody.typeGain != "o" && jBody.typeGain != "g") gbl.exception("TypeGain invalide",400)
	if (jBody.objetId && !gbl.checkInt(jBody.objetId,CONF.OIDMIN,CONF.OIDMAX)) gbl.exception("ObjetId invalide",400)
	if (jBody.objetId && (!jBody.objetNom || typeof jBody.objetNom != "string") ) gbl.exception("ObjetNom requis si objtId",400)
	if (jBody.gils && !gbl.checkInt(jBody.gils,CONF.GILSMIN,CONF.GILSMAX)) gbl.exception("Gils invalide",400)
	if (jBody.typeRep != "t" && jBody.typeRep != "c") gbl.exception("TypeRep invalide",400)
	if (jBody.repT && (typeof jBody.repT != "string" || jBody.repT.length > CONF.NBCHARREPONSE)) gbl.exception("repT invalide",400)
	if (jBody.repX && !gbl.checkFloat(jBody.repX,0,CONF.COORDMAX)) gbl.exception("repX invalide",400)
	if (jBody.repY && !gbl.checkFloat(jBody.repY,0,CONF.COORDMAX)) gbl.exception("repY invalide",400)
	if (jBody.repI && !gbl.checkFloat(jBody.repI,0,CONF.INCERTMAX)) gbl.exception("repI invalide",400)
	if (jBody.debDth < Date.now() + CONF.DTHMIN && !pseudos.checkPrivilege(pseudo,pseudos.PRIVENIGME))  gbl.exception("Début trop proche",400)
	if (jBody.finDth > Date.now() + CONF.DTHMAX)  gbl.exception("Fin trop éloignée",400)

	// def enigme
	let nEnigme = {
		idx: etat.idx++,
		pseudo: pseudo,
		dth: Date.now(),
		publieeDth: null, // enigme a pblier
		debDth: jBody.debDth,
		finDth: jBody.finDth,
		enigme: jBody.enigme,
		typeGain: jBody.typeGain,
		gils: (jBody.typeGain == "g" )? jBody.gils : null,
		objetId: (jBody.typeGain == "o" )? jBody.objetId : null,
		objetNom: (jBody.typeGain == "o" )? jBody.objetNom : null,
		typeRep: jBody.typeRep,
		indice: (jBody.typeRep == "t" )? jBody.repIndice : null,
		repI: (jBody.typeRep == "c" )? jBody.repI : null,
		// données priviees non transmises aux clients
		p_repT: jBody.repT,
		p_repX: jBody.repX,
		p_repY: jBody.repY,
	}

	// publication de l'iamge si besoin
	if (jBody.flagImage && jBody.rawImage) {
		const imgObjRaw = imageTools.decodeImageBase64(jBody.rawImage)
		if (!imgObjRaw) gbl.exception("erreur decodeImageBase64",500)

		nEnigme.CDN = ( gbl.isProd()? "Prod":"Staging" ) + "_S-Enigme_" + (new String(nEnigme.idx)).padStart(8,'0') + "." + imgObjRaw.ext
		let ret = await pCloud.putPublicBlob(imgObjRaw.buffer,nEnigme.CDN)
		if (!ret || ret.result != 0) gbl.exception("Erreur upload pCloud/CDN voir log server",500)
	}

	// commit 
	etat.pseudos[pseudo] ??= {}
	etat.pseudos[pseudo].enigmes ??= []
	etat.pseudos[pseudo].enigmes.push (nEnigme)

	// force un délai client de 10 secondes pour replication pCloud
	if (jBody.flagImage) await gbl.sleep(10)

	clientsSync()
	// moderation
	let modoTxt="Nouvelle enigme prévue, à moderer si souci."
	if (nEnigme.CDN) modoTxt += "\nUtiliser le lien indice image si l'image n'est pas affichée"
	enigmeAnnonceWebhook(modoTxt,nEnigme, true)
	
	await enigmesAnalyse() // contient un clientsync qui ne se fait que si delete d'enigme
}
// 200 bonne réponse, 201 mauvaise réponse, 202 delai non respecté
// dans tous les 2XX, on doit aussi renvoyer le dth de delai de prochaine réponse
async function enigmeRepondre(pseudo,body) {
	let jBody = JSON.parse(body)
	// recupere l'enigme
	let en= enigmeGet(jBody.pseudo,jBody.idx)
	if (!en) gbl.exception("Enigme introuvable",400)
	// precond
	// verif timer de réponse ou admin
	if ( timersReponse[pseudo] > Date.now() && !pseudos.checkPrivilege(pseudo,pseudos.PRIVENIGME) ) gbl.exception( { reponseEcheanceDth: timersReponse[pseudo] } ,202) 

	// selon le type de réponse
	let ok= ( en.typeRep=="t" && jBody.T && jBody.T.toLowerCase()==en.p_repT?.toLowerCase() ) ||
					( en.typeRep=="c" && gbl.isDistance(en.p_repX,en.p_repY,jBody.X,jBody.Y,en.repI) )

	// dans tous les cas, on reset le timer du pseudo pour prochaine réponse
	timersReponse[pseudo] = Date.now() + CONF.TIMERREP

	if (!ok) gbl.exception({ reponseEcheanceDth: timersReponse[pseudo] },201) // mauvaise réponse

	// bonne réponse
	en.resoluePseudo = pseudo	
	en.resolueDth = Date.now()	
	en.resolueSoluce =	( en.typeRep=="t" && (en.p_repT?.toLowerCase() ) ) ||
          						( en.typeRep=="c" && ("X:"+jBody.X+"Y:"+jBody.Y+"≅:"+en.repI) )

	// commit
	clientsSync(en.resoluePseudo+" a répondu à une énigme de "+en.pseudo)

	// blabla
	let fr = pseudos.getDesc(en.pseudo)?.discordId 
	let to = pseudos.getDesc(en.resoluePseudo)?.discordId
	fr = (fr)? "<@"+fr+">" : en.pseudo
	to = (to)? "<@"+to+">" : en.resoluePseudo
	
	enigmeAnnonceWebhook(pseudo+" a trouvé la solution de l'énigme de "+en.pseudo+"\n"+fr+" doit maintenant remettre le lot à "+to,en)
	gbl.exception({ reponseEcheanceDth: timersReponse[pseudo] },200)
}
// fin de transaction pour un pseudo
async function enigmeOk(pseudo,p,i) {
	let idx = gbl.checkInt(i,0,etat.idx)
	let en = enigmeGet(p,idx)
	if (!en) gbl.exception("Enigme introuvable",400)
	// precond
	if (! en.resolueDth)gbl.exception("Enigme non resolue",400)	

	// commit selon le demandeur
	if (en.pseudo == pseudo) en.donneDth = Date.now()
	if (en.resoluePseudo == pseudo) en.recuDth = Date.now()
	if (en.donneDth && en.recuDth) {
		// supprime l'énigme si echange terminée
		enigmeSupprimerTech(en.pseudo,idx)
		clientsSync()
		enigmeAnnonceWebhook(en.pseudo + " a remis le lot à "+en.resoluePseudo,en)
	}	
	else
		clientsSync()
}
async function enigmePublier(pseudo,pwd,p,i) {
	let en = enigmeGet(p,gbl.checkInt(i,0,etat.idx))
	if (!en) gbl.exception("Enigme introuvable",400)
	// precond
	if ( en.pseudo!=pseudo ) gbl.exception("Enigme non owned",400)
	
	// commit
	en.publieeDth = Date.now()
	clientsSync()
	await enigmesAnalyse() // contient un clientsync qui ne devrait pas se declencher
}
// supprimer une enigme technique !! sans sync
function enigmeSupprimerTech(p,i) {	
	// calcule l'index de l'enigme
	let idxE = etat.pseudos[p].enigmes.findIndex( (e) => e.idx == i )
	if (idxE < 0) gbl.exception("Erreur logique interne serveur sur enigmeSupprimer",500)
	console.log("enigmeSupprimerTech",p,i)

	// commit
	etat.pseudos[p].enigmes.splice(idxE,1)
}
async function enigmeSupprimer(pseudo,pwd,p,i) {
	let en = enigmeGet(p,gbl.checkInt(i,0,etat.idx))
	if (!en) gbl.exception("Enigme introuvable",400)
	// precond
	if ( pseudo!=p && !pseudos.check(pseudo,pwd,null,pseudos.PRIVENIGME) ) gbl.exception("Enigme non owned",400)
	// supprime l'enigme de l'etat
	enigmeSupprimerTech(p,en.idx)
	clientsSync()
	if (en.publieeDth && en.debDth < Date.now() ) 
		enigmeAnnonceWebhook("Enigme supprimée par "+pseudo,en) 
}
///////////////////////////////////////////////////////////////////////////////
// API Calls
// API Calls
// API Calls
///////////////////////////////////////////////////////////////////////////////
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd) // auth standard
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "conf":
					gbl.exception( CONFJSON , 200, true) 
				case "etat":
					gbl.exception( etat , 200) 
				}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "enigmeDefinir":
					await enigmeDefinir(pseudo,body)
					gbl.exception( "ok" , 200) 
				case "enigmePublier":
					await enigmePublier(pseudo,pwd,reqPaths[3],reqPaths[4])
					gbl.exception( "ok" , 200) 
				case "enigmeRepondre":
					await enigmeRepondre(pseudo,body)
					gbl.exception( "ok" , 200) 
				case "enigmeOk":
					await enigmeOk(pseudo,reqPaths[3],reqPaths[4])
					gbl.exception( "ok" , 200) 
				case "adminParams":
					pseudos.check(pseudo,pwd,null,pseudos.PRIVENIGME)
					await adminParams(pseudo,body)
					gbl.exception( "ok" , 200) 
			}
			gbl.exception(COLNAME+" post",400);
		case "DELETE":
			switch(reqPaths[2]) {
				case "enigmeSupprimer":
					await enigmeSupprimer(pseudo,pwd,reqPaths[3],reqPaths[4])
					gbl.exception( "ok" , 200) 
				case "all":
					pseudos.check(pseudo,pwd,true) // server admin
					globalReset()
					gbl.exception( "ok" , 200) 
			}
			gbl.exception(COLNAME+" delete",400);
		}
	gbl.exception(COLNAME+" inv http op",400);
}

setTimeout(enigmesAnalyse,1000)
console.log(COLNAME+" loaded")
