const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');
const lodestone = require('../infraback/lodestone.js');

// nom de la collection dans le datastore
const COLNAME="S-codex"
const HISTONAME="S-codex_histo"

const	WEBHOOKLOG= "https://discord.com/api/webhooks/1502645242304925746/mM6nbL066u5qGrIXeZZrfdsv4eu6rrvYkmdLZxR47WRjRY3A-4tm4WxIYigEA4okUyC6"
const WEBHOOKTRAILERLOVE = { color: 0x21908D , description: "[Final Fantasy XIV - France](https://discord.gg/FFXIVFR) et [La Grande Peluche](https://discord.gg/WvRSN8Wshe)\n**Si tu as aimé, ajoute un ❤️ en réaction**" }
const WEBHOOKTRAILER = {  color: 0x21908D, description: "[Final Fantasy XIV - France](https://discord.gg/FFXIVFR) et [La Grande Peluche](https://discord.gg/WvRSN8Wshe)" }
const THUMBALERT = gbl.cdnUrlStatic + "attention.gif"
const CDNPSEUDO =	"https://cdn.adhoc.click/AI-Generated/pseudo-"

const HISTOSYNCDELAI = 30000 // delai de l'histoSync si delayed par lag discord

const CONF= {
	DIFNBMAX: 100,			// max diffusions
	DIFITERMAX: 31,			// iterations
	DIFITERTYPE: [ {t:'J',lbl:'Jours'}, {t:'S',lbl:'Semaines'}, {t:'M',lbl:'Mois'} ],		// type iteraction
	CATNBMAX: 15,			// max categories
	CATTAGLEN: 3,			// taille d'un tag
	CATDESCLEN: 20,		// max taille d'un desc de categorie
	CATTYPES: [ {t:"R",d:"Envoi en random parmi les non envoyés"},{t:"D",d:"Envoi le dernier disponible (répétable)"},{t:"P",d:"Envoi le premier disponible (répétable)"} ],
	ABONBMAX: 200,		// max abonnes
	ABOURLSTART: "https://discord.com/api/webhooks/",
	ABOTAGLENMAX: 15,	// taille max d'un tag de guilde
	ABOTAGLENMIN: 5,	// taille min d'un tag de guilde
	MSGNBMAX: 400,		// max message
	MSGNBBYCAT: 100,		// max message par catégorie
	MSGSZLEN: 3000,		// max taille unitaire d'un message
	MSGDESCLEN: 20,		// max taille description d'un message
	PROTIMER: 60000,	// delai entre now et le post d'un diffusion
	ALEMAX: 5,				// nombre de messages pour alerte sur catégorie
	DISCORDDELAI: 100,		// delai entre chaque requete discord client
	DISCORDGARDE: 20000,	// delai de garde dans tous les cas
	HISTOMAXLEN: 100,			// taille max d'un historique
}
const CONFJSON = JSON.stringify(CONF)

// Reset global
function globalReset() {
	console.warn("Collection reset pour",COLNAME,HISTONAME)
	let oldMasterIdx = etat?.idx || 0 // Le master index est conserve
	etat = normalize(collections.reset(COLNAME))
	etat.idx = oldMasterIdx
	histo = normalizeHisto(collections.reset(HISTONAME))
	etatSync()
	histoSync()
}
// Etat global
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.idx ??= 0
	e.diffusions ??= []
	e.abonnes ??= []
	e.categories ??= []
	e.messages ??= []
	e.webHookLog ??= WEBHOOKLOG // Second webhook de log
	// upgrade dep -> deps
	e.categories.forEach( (cat) => {
		cat.deps ??= []
		if (cat.dep) cat.deps.push(cat.dep)
		delete cat.dep
	})
	// upgrade role -> roleType et roleId
	// suppression des anciens roles si définis
	e.abonnes.forEach( (abo) => {
		if (abo.role && abo.role.startsWith('@')) {
			delete abo.role
		}
	})
	// retourn l'etat normalizé
	return e
}
// Sauvegarde de l'etat (sans synchro multijoueurs)
function etatSync() {
	collections.save(etat)
}
///////////////////////////////////////////////////////////////////////////////
// configuration / administration
// configuration / administration
// configuration / administration
///////////////////////////////////////////////////////////////////////////////
function checkWebHookUrl(url) {
	if (!url || !url.startsWith(CONF.ABOURLSTART) ) gbl.exception("Ton Url WebHook est invalide",202)
	return url
}
function checkTag(tag) {
	if (typeof tag != "string" ) gbl.exception("CodexNick invalide",400)
	if (tag.length<CONF.ABOTAGLENMIN || tag.length>CONF.ABOTAGLENMAX) gbl.exception("CodexNick invalide",400)
	if (!gbl.isPseudoValid(tag)) gbl.exception("CodexNick invalide",400)
	return tag
}
// verif du role selon les parametres retourne le role null || "everyone" || "roleid" si ok
function checkCalcRole(roleType,roleId) {
	let roleCalc = null
	switch (roleType) {
		case "0": {	// Aucun
			break
		}
		case "1": { // Everyone
			roleCalc =  "everyone"
			break
		}
		case "2": { // RoleId
			if (typeof roleId != "string" || !gbl.isNumeric(roleId) ) gbl.exception("roleId non numerique",400)
			if (roleId.length <= 9) gbl.exception("roleId snowflake invalide",400)
			roleCalc = roleId
			break
		}
		default: gbl.exception("Type de role invalide",400)
	}
	return roleCalc
}
async function configUpdate(pseudo,json) {
	etat.webHookLog = checkWebHookUrl(json.webHookLog)
	etatSync()
	await discordDualLog({content: "# Modication config:\nwebHookLog:"+etat.webHookLog } )
	return etat
}
// verif du message d'admin, si ok retoune l'objet du contenu
function admMsgCheck(pseudo,oBody) {
	if (!getCategorieByTag(oBody.cat)) gbl.exception("admMsgCheck categorie invalide",400)
	return contenuVerify(oBody.contenu)
}
function admMsgTest(pseudo,oBody) {
	let vJson = admMsgCheck(pseudo,oBody)
	vJson.content = "**TEST** Messsage administrateur ("+pseudo+")"
	discordAdd( { type: "admLog", contenu: vJson } )
	return "ok"
}
function admMsgSend(pseudo,oBody) {
	let vJson = admMsgCheck(pseudo,oBody)
	let text =  "Messsage administrateur ("+pseudo+")"
	vJson.content = text
	// balayage des abonnées à la catégorie
	let nbWebHook = 0
	let algoStart= process.hrtime() // chrono début
	discordAdd( { type: "admLog", contenu: vJson } )
	etat.abonnes.forEach( (abo) => {
		if (abo.cat!=oBody.cat) return // abonné non concerné
		nbWebHook++
		discordAdd( { type: "webHookDirect", abo: abo, contenu: vJson } )
	} )
	let algoEndDelta= process.hrtime(algoStart) // chrono traitement
	discordAdd( { type: "Resume", text: text,  algoStart: algoStart, algoEndDelta: algoEndDelta, nbDem: nbWebHook } )
	return "ok"
}
///////////////////////////////////////////////////////////////////////////////
// Historique
// Historique
// Historique
///////////////////////////////////////////////////////////////////////////////
let histo = normalizeHisto(collections.get(HISTONAME,true))
let histoSyncPendingNb = 0 // nombre de requetes discord non terminée --> histoSync devra attendre
let histoSyncEcheance = 0 // echeance du processus de resync sur famine discord
let histoSyncTimerId = null // si besoin timer de reshedule de l'histoSync
function normalizeHisto(h) {
	h.envByAbo ??= new Map()	// liste des envoi indexé par les abonnemnets, le contenu est la liste ordonnées des messages par id
	return h
}
// return true si effectue ou false si resheduled
function histoSync() {
	console.log("histoSync début")
	if (histoSyncTimerId) { clearTimeout(histoSyncTimerId); histoSyncTimerId = null }
	if (histoSyncPendingNb && !histoSyncEcheance) {
		// la synchro datastore doit être différe en attente des résultats discord
		console.log("********************* histoSync différe", histoSyncPendingNb)
		histoSyncEcheance = Date.now() + HISTOSYNCDELAI
		histoSyncTimerId = setTimeout(histoSync, HISTOSYNCDELAI)
		return false
	}
	// Sync normal ou apres delai de garde
	collections.save(histo)
	// Alert si sync réalisé avec échéance
	if (histoSyncEcheance) {
		console.log("********************* ALERTE SUR HISTOSYNC", histoSyncPendingNb)
		if (histoSyncPendingNb)
			discordAdd( { type: "Erreur", txt:"ERREUR: histoSync en différé, reste histoSyncPendingNb="+histoSyncPendingNb } )
		else
			discordAdd( { type: "Erreur", txt:"ATTENTION, histoSync en différé car lags discord mais au final commits discord OK" } )
	}
	histoSyncEcheance = 0 // indique synch résalisé
	console.log("histoSync fin")
	return true
}

function histoClear() {
	histo = normalizeHisto(collections.reset(HISTONAME))
	collections.save(histo)
}

// retourne le tableau ordonné des messages envoyé à l'abo avec creation si besoin
function histoGetEnvByAboId(aboId) {
	// return histo.envByAbo.getOrInsert(aboId,[]) // PAS ENCORE SUPPORTE
	let tbl = histo.envByAbo.get(aboId)
	if (tbl) return tbl
	histo.envByAbo.set(aboId,[])
	return histo.envByAbo.get(aboId)
}
// insere pour un abo un message, respectant l'ordre monkey cliber du tableau de l'abo
// d est le disponible du pool, r est le reste du pool, sId est l'id de message envoyé sur le webhook
function histoAddAboIdMsgId(aboId,msgId,catId,d,r,sId) {
	let tblEnv = histoGetEnvByAboId(aboId)
	// Attention, il faut que le tblEnv reste croissant pour le MONKEY CLIMBER
	// le tblEnv d'un abo ne contient que des id de messages croissants (pas les messages)
	// Recherche la position
	let idx = tblEnv.findLastIndex( (env) =>  env.m <= msgId )
	// insert
	tblEnv.splice(idx+1, 0, { d: Date.now(), c:catId, m: msgId, dis:d, res:r, sId: sId } )
	while (tblEnv.length > CONF.HISTOMAXLEN) tblEnv.splice(0,1) // truncate l'histo
	histoJson = null // invalide le cache
}
// d est le disponible du pool, r est le reste du pool, sId est l'id de message envoyé sur le webhook
function histoAddAboMsg(abo,msg,d,r,sId) {
	histoAddAboIdMsgId(abo.id,msg?.id,0,d,r,sId) // msg null si plus de dispo 
	console.log("***** histoAddAboMsg GERER LE CATID QUI EST A 0 pour l'instant")
}
function histoDeleteByAboId(aboId) {
	histo.envByAbo.delete(aboId)
}
// retourne la synthses
function histoGetAllAsString() {
	return collections.getJsonString(histo)
}

///////////////////////////////////////////////////////////////////////////////
// contenu
// contenu
// contenu
///////////////////////////////////////////////////////////////////////////////
// contenuVerify - verif de syntaxe de jsonContenu (STRING) retourne l'objet contenu
function contenuVerify(jsonContenu) {
	if (!jsonContenu) gbl.exception("contenuVerify pas de contenu",400)
	if (jsonContenu.length > CONF.MSGSZLEN) gbl.exception("contenuVerify message trop long",400)
	let vJson
	try { vJson = JSON.parse(jsonContenu) }
	catch(e) { gbl.exception("contenuVerify exception e="+e.message,400) }
	if (typeof vJson !== "object") gbl.exception("contenuVerify json non valide",400)
	if (vJson.content) gbl.exception("contenuVerify ne doit pas contenir un content",400)
	if (vJson.attachments) gbl.exception("contenuVerify ne doit pas contenir un attachment ",400)
	if (vJson.components) gbl.exception("contenuVerify ne doit pas contenir un component ",400)
	if (!vJson.embeds) gbl.exception("contenuVerify doit contenir un embeds",400)
	return vJson
}
///////////////////////////////////////////////////////////////////////////////
// diffusions
// diffusions
// diffusions
///////////////////////////////////////////////////////////////////////////////
function getDiffusionIdxById(id) {
	return etat.diffusions.findIndex( (e) => e.id==id)
}
function getDiffusionById(id) {
	return etat.diffusions.find( (e) => e.id==id)
}
function isDiffusionExist(dth) {
	return etat.diffusions.find( (e) => e.dth==dth)
}
function diffusionsSortByDth() {
	etat.diffusions.sort( (a,b) => a.dth - b.dth )
}
function diffusionDelete(pseudo,id) {
	// Suppression selon l'id de diffusion ou l'id de rep de  diffusion
	let idx=0
	while (idx< etat.diffusions.length) {
		let e=etat.diffusions[idx]
		if (e.id == id || e.rep == id)
			etat.diffusions.splice(idx,1)
		else
			idx++
	}
	etatSync()
	diffusionsReschedule()
	return etat
}
function diffusionAdd(pseudo,json) {
	// prereq
	if (! Array.isArray(json.rep) ) gbl.exception("diffusionAdd bad param rep",400)
	if (json.rep.length > CONF.DIFITERMAX) gbl.exception("diffusionAdd trop de répétitions",400)// iterations
	if ( (etat.diffusions.length + json.rep.length) >= CONF.MSGNBMAX) gbl.exception("diffusionAdd trop de diffusions",400)
	let idxCat = getCategorieIdxByTag(json.cat)
	if (idxCat < 0) gbl.exception("diffusionAdd categorie invalide",400)
	// Verif DTH de duffusion
	if (!Number.isInteger(json.dth)) gbl.exception("diffusionAdd Date invalide",400)
	if (json.dth < Date.now()+CONF.PROTIMER) gbl.exception("diffusionAdd Date dépassée ou trop proche",400)
	// Verif DTH de répétition
	json.rep.forEach ( (rDth) => { if (!Number.isInteger(rDth) || rDth< Date.now()+CONF.PROTIMER ) gbl.exception("diffusionAdd rep dth invalide",400) } )
	// Verif crenaeau de diffusion non utilisé
	if (isDiffusionExist(json.dth)) gbl.exception("diffusionAdd Creneau horaire déjà utilisé",400)
	// commit
	let repId = (json.rep.length)? ++etat.idx : null // id de répétition si besoin
	// ajoute la diffusion
	etat.diffusions.push( { id: ++etat.idx, pseudo: pseudo, dth:json.dth , cat:json.cat, rep:repId })
	// ajoute les répétitions
	json.rep.forEach ( (r) => { etat.diffusions.push( { id: ++etat.idx, pseudo: pseudo, dth:r , cat:json.cat, rep:repId }) })
	diffusionsSortByDth()
	etatSync()
	diffusionsReschedule()
	return etat
}

// diffusion forcée depuis l'IHM
function diffusionNow(pseudo,id) {
	console.log("diffusionNow par:",pseudo,"id=",id)
	let rDif = diffusionExecuteById(id)
	return etat
}

// execution d'une duffusion par id
function diffusionExecuteById(id) {
	// recupere la diffusion et la supprime pour eviter les boucles & race si bug
	let idx = getDiffusionIdxById(id)
	if (idx<0) gbl.exception("diffusionExecuteById diffusion id invalide",400)
	let dif = etat.diffusions[idx]
	etat.diffusions.splice(idx,1)
	etatSync() // securité pour si bug sur diffusion
	diffusionExecute(dif)
}
// Execution d'une diffusion (elle ne doit plus etre dans etat pour async pour eviter les races conditions)
function diffusionExecute(dif) {
	// OPTIM !!!!!!!!!!!!!!! REFLECHIR A METTRE DANS LE THREADPOOL DES WORKERS
	console.log("diffusionExecute debut pour dif:",dif)
	let algoStart= process.hrtime() // chrono début
	// Recupère la categorie de la dif
	let cat = getCategorieByTag(dif.cat)
	if (!cat) {
		discordAdd( { type: "Erreur", txt:"cat introuvable:"+dif.cat  } )
		return
	}
	// recupère les messages potentiels concernés (normalement, par id croissant)
	// OPTIM possible lors de l'ajout / retrait d'un message --> a faire si besoin, cela evite le scan de la table des messages
	let tblPot = [] // tableau des potentiels contient des messages avec id
	etat.messages.forEach( (m) => { if (m.cat==cat.tag) tblPot.push(m) } )
	if (tblPot.length==0) {
		discordAdd( { type: "Erreur", txt:"cat vide:"+cat.tag  } )
		return
	}
	let nbDem = 0
	switch(cat.type) {
		case 'R': 
			nbDem = diffusionExecuteTypeR(dif,cat,tblPot)
			break;
		case 'P': 
			nbDem = diffusionExecuteTypePD(dif,cat,tblPot,0)
			break;
		case 'D': 
			nbDem = diffusionExecuteTypePD(dif,cat,tblPot,tblPot.length-1)
			break;
		default:
			discordAdd( { type: "Erreur", txt:"type de categorie invalide:"+cat.type } )
	}
	let algoEndDelta= process.hrtime(algoStart) // chrono traitement
	discordAdd( { type: "Synthese", dif: dif, algoStart: algoStart, algoEndDelta: algoEndDelta, nbDem: nbDem } )
	// force le traitement discord asynchrone
	discordTimer()
}
// Alogorithme Premier/dernier dans tblPot des messages potentiels
function diffusionExecuteTypePD(dif,cat,tblPot,iChoix) {
	let nbDem = 0
	let msg = tblPot[iChoix]  // Premier ou dernier
	// balayage des abonnes
	etat.abonnes.forEach( (abo) => {
		// si abonné non concerné par la diffusion, passe a l'abonné suivant
		if (abo.cat!=dif.cat) return	// abo suivant
		discordAdd( { type: "webHookDif", abo: abo, msg: msg, d: tblPot.length, r: tblPot.length  } )
		nbDem++
	})
	return nbDem
}
// Alogorithme Random a choisir dans tblPot des messages potentiels
function diffusionExecuteTypeR(dif,cat,tblPot) {
	let nbDem = 0
	// balayage des abonnes
	etat.abonnes.forEach( (abo) => {
		// si abonné non concerné par la diffusion, passe a l'abonné suivant
		if (abo.cat!=dif.cat) return	// abo suivant
		// associé a l'abonné, on a la liste des messages diffusés (tblEnv)
		// il faut prendre la liste des messages dispo, supprimer les envoyés et choisir
		// balaye le tbl potentiel, vérifie que ce n'est pas dans le tblEnv des envoyés
		let tblEnv = histoGetEnvByAboId(abo.id) // aka tableau de messages trié par id de message
		let tblDispo = []	// tableau des disponibles apres calcul
		if (tblEnv.length==0) {
			// rien envoyé, le tblDispo est le tblPot potentiels
			tblDispo = tblPot.slice()
		}
		else {
			let iPot = 0
			let iEnv = 0
			let vPot = 0	// externe a la boucle pour optim GC
			let vEnv = 0	// externe a la boucle pour optim GC
			// au moins un message a été envoyé, on cherche les dispos
			while (true) {
				// algorithme du MONKEY CLIMBER simplifié
				// tblPot et tblEnv sont trié par id
				vPot = (iPot < tblPot.length)? tblPot[iPot].id : Infinity // optim possible si infinity: plus de dispos
				vEnv = (iEnv < tblEnv.length)? tblEnv[iEnv].m  : Infinity // optim possible, tous les tblPot restant sont des dispos
				if (vPot == Infinity) break; // plus de id potentiel
				if (vPot < vEnv ) { tblDispo.push(tblPot[iPot]); iPot ++; continue } // le potentiel doit être conserve car pas envoyé
				if (vPot > vEnv ) { iEnv ++; continue } // le potentiel est plus grand que l'envoye, on passe a l'envoyé suivant
				iPot++; iEnv++; // meme poteniel qu'envoye, on passe aux suivants
			}
		}
		// console.log("diffusionExecuteTypeR",abo,"tblPot",tblPot,"tblEnv",tblEnv,"tblDispo",tblDispo)
		// On a les messages disponibles dans tblDispo pour l'abonné
		// FAMINE ??
		if (tblDispo.length <= 0) {
			// aucun message disponinle abonnement en famine
			discordAdd( { type: "famine", abo: abo, d: tblPot.length, r: tblDispo.length  } )
			return	// abo suivant
		}
		// FAIM ??
		if (tblDispo.length <= cat?.ale) {
			// alerte sur niveau
			discordAdd( { type: "faim", abo: abo, d: tblPot.length, r: tblDispo.length  } )
		}
		// Choix d'un message dans les dispos selon l'alogrithe R
		let iChoix = Math.floor(Math.random() * tblDispo.length)
		let msg = tblDispo[iChoix] 
		// empile l'emission dans la file d'emission prevue
		discordAdd( { type: "webHookDif", abo: abo, msg: msg, d: tblPot.length, r: tblDispo.length  } )
		nbDem++
	})
	return nbDem
}
//////////////////////////////////////////////////////////////////////////////
// categories
// categories
// categories
///////////////////////////////////////////////////////////////////////////////
function getCategorieIdxByTag(tag) {
	return etat.categories.findIndex( (e) => e.tag==tag)
}
function getCategorieById(id) {
	return etat.categories.find( (e) => e.id==id)
}
function getCategorieByDesc(desc) {
	return etat.categories.find( (e) => e.desc==desc)
}
function getCategorieByTag(tag) {
	return etat.categories.find( (e) => e.tag==tag)
}
function isValidType(type) {
	return CONF.CATTYPES.find( (e) => e.t==type)
}
function categorieValidation(json,newCat) {
	if (!json.desc || json.desc.length>CONF.CATDESCLEN) gbl.exception("categorieValidation desc invalide ou trop longue",400)
	if (!json.tag || json.tag.length!=CONF.CATTAGLEN) gbl.exception("categorieValidation Le tag est invalide",400)
	if (!json.type || !isValidType(json.type)) gbl.exception("categorieValidation type invalide",400)
	if (newCat && getCategorieByDesc(json.desc)) gbl.exception("categorieValidation Description déjà existante",400)
	if (newCat && getCategorieByTag(json.tag)) gbl.exception("categorieValidation Tag de catégorie déjà existant",400)
	if (!newCat && !getCategorieByTag(json.tag)) gbl.exception("categorieValidation catégorie inexistante",400)
	if (json.dep && !getCategorieByTag(json.dep)) gbl.exception("categorieValidation abonnement dependant introuvable",400)
	if (!newCat && json.dep && json.dep==json.tag) gbl.exception("categorieValidation abonnement automatique recursif",400)
	json.ale = gbl.checkInt(json.ale,0,5) // dispose d'une exception sépcifique
	let vJson = contenuVerify(json.welcome)
	if (!vJson) gbl.exception("categorieValidation syntaxe message invalide",400)
	return vJson
}
async function categorieTest(pseudo,json) {
	let vJson = categorieValidation(json,true)
	// publication sur canal de test
	let content = "## Vérification du message de bienvenue pour "+json.desc+"\nTag:"+json.tag+" Dep:"+json.dep+ "("+etat.categories.length+"/"+CONF.CATNBMAX+")"
	discordAdd( { type: "admLog", contenu: { content: content, ...vJson } } )
}
async function categorieAdd(pseudo,json) {
	let vJson = categorieValidation(json,true)
	// vérification des dépendances
	if (! Array.isArray(json.deps) ) gbl.exception("categorieAdd deps n'est pas un array",400)
	json.deps.forEach( (tag) => { if (!getCategorieByTag(tag)) gbl.exception("categorieAdd dependance invalide:"+tag) } ) 
	// commit
	let c = { id: ++etat.idx, tag: json.tag, desc: json.desc, type: json.type, deps: json.deps, dth: Date.now(), pseudo: pseudo, welcome: vJson, ale: json.ale }
	etat.categories.push( c )
	etatSync()
	// publication sur canal de test
	let content = "## Catégorie ajoutée:"+json.desc+"\nTag:"+json.tag+" Deps:["+json.deps.toString()+ "]("+etat.categories.length+"/"+CONF.CATNBMAX+")"
	discordAdd( { type: "admLog", contenu: { content: content, ...vJson } } )
	return etat
}
function categorieDelete(pseudo,json) {
	if (!json.tag)  gbl.exception("categoriesDelete Catégorie invalide",400)
	let idx = getCategorieIdxByTag(json.tag)
	if (idx < 0)  gbl.exception("categoriesDelete catégorie introuvable",400)
	etat.categories.splice(idx,1)
	etatSync()
	return etat
}
///////////////////////////////////////////////////////////////////////////////
// abonnes
// abonnes
// abonnes
///////////////////////////////////////////////////////////////////////////////
function getAbonneIdxByRootId(id) {
	return etat.abonnes.findIndex( (e) => (e.root==id) || (e.id==id) )
}
function getAbonneIdxById(id) {
	return etat.abonnes.findIndex( (e) => e.id==id)
}
function getAbonneById(id) {
	return etat.abonnes.find( (e) => e.id==id)
}
function getAbonneByUrl(url) {
	return etat.abonnes.find( (e) => e.url==url)
}
function getAbonneByGuildCat(guild,cat) {
	return etat.abonnes.find( (e) => e.guild==guild && e.cat==cat)
}
function getAbonneByGuildTag(tag) {
	return etat.abonnes.find( (e) => e.tag==tag)
}
// retourne etat, 400 si anomalie, le message doit être lisibl, 500 si patch du nom de webhook impossible
async function abonneAdd(pseudo,json) {
	// Url check
	checkWebHookUrl(json.url)
	if (getAbonneByUrl(json.url) && !json.bypass) gbl.exception("URL de WebHook est déjà utilisée",400)
	// Role Check
	let roleCalc = checkCalcRole(json.roleType,json.roleId)
	// categorie check (main et dependante)
	let cat = getCategorieByTag(json.cat) // categorie check
	if (!cat) gbl.exception("La categorie est introuvable, contacte Kikiadoc",400) // normalement impossible
	cat.deps.forEach( (tag) => { if (tag==cat.tag || !getCategorieByTag(tag)) gbl.exception("categorie dependante "+tag+" est introuvable ou invalide, contacte Kikiadoc",400) } )
	// taille check abonnés
	if (etat.abonnes.length > CONF.ABONBMAX ) gbl.exception("Désole, la limite max du nombre d'abonnés est atteinte",400)
	// verifi que le tag de guilde n'est pas deja pris
	checkTag(json.tag)
	if (getAbonneByGuildTag(json.tag)) gbl.exception("Ce CodexNick est déjà utilisé, choisis un autre tag",400)
	// Recup caracteristiques du webhook
	let caractWh = await gbl.apiCallExtern(json.url+"?wait=true",null,null, discord.headers ,"json")
	if (caractWh.status != 200) gbl.exception("L'URL de ton WebHook est invalide",400)
	if (getAbonneByGuildCat(caractWh.json.guild_id,cat.tag) && !json.bypass) gbl.exception("Ton discord est déjà abonné à "+cat.desc,400)
	// Force le nom du webhook
	ret = await gbl.apiCallExtern(json.url+"?wait=true",'PATCH',{ name: cat.desc+" @"+json.tag }, discord.headers ,"json")
	if (ret.status != 200) gbl.exception("URL webhook erreur patch welcome, contacter Kikiadoc",500)
	// commit
	// creation de l'abonné, mais le tblEnv sera dans histo et dynamiquement cree lors de la premiere emission
	let idx = ++etat.idx
	let abo = { id: idx, root: idx, dth: Date.now(), url: json.url, cat: cat.tag, role: roleCalc, tag: json.tag, guild: caractWh.json.guild_id, channel: caractWh.json.channel_id }
	etat.abonnes.push( abo ) 
	// Si categorie dépendante, ajoute aussi la'bonnement dépendant
	cat.deps.forEach( (tag) => {
		let aboDep = { id: ++etat.idx, root: idx, dth: Date.now(), url: json.url, cat: tag, role: roleCalc, tag: json.tag, guild: caractWh.json.guild_id, channel: caractWh.json.channel_id }
		etat.abonnes.push( aboDep ) 
	} )
	etatSync()
	// Poste un message de bienvenue
	discordAdd( { type: "bienvenue", abo: abo, cat: cat } )
	return etat
}
function abonneUpdate(pseudo,id,json) {
	let abo = getAbonneById(id)
	if (!abo) gbl.exception("abonne id introuvable",400)
	// verif du tag
	let tag = checkTag(json.tag)
	if (abo.tag != tag && getAbonneByGuildTag(tag)) gbl.exception("Ce CodexNick est déjà utilisé, choisis un autre tag",400)
	// verif du role
	let role = checkCalcRole(json.roleType,json.roleId)
	// update role/tag de notif
	abo.role = role
	abo.tag = tag
	etatSync()
	return etat
}
function abonneDelete(pseudo,id) {
	let abo = getAbonneById(id)
	if (!abo)  gbl.exception("abonne id introuvable",400)
	// commit
	let idx
	while ( (idx=getAbonneIdxByRootId(id)) >=0) etat.abonnes.splice(idx,1)
	etatSync()
	discordAdd( { type: "desabonne", abo: abo, pseudo: pseudo } )
	return etat
}
async function abonneMessage(pseudo,body) {
	// op:"test", aboId:dspMessageSend.abo.id, texte:saisies.admMessageSend
	let abo = getAbonneById(body.aboId)
	let contenu = {
		content: "TBD",
		embeds: [ {
				color: 0xFF0000,
				thumbnail: { url:THUMBALERT },
				description: body.texte,
				author : { name: pseudo, icon_url : CDNPSEUDO+pseudo+".jpg" },
			} ]
	}
	switch (body.op) {
		case 'test':
			contenu.content = "# (TEST) Message d'administrateur @"+abo.tag
			discordAdd( { type: "admLog", contenu: contenu } )
			break
		case 'send':
			contenu.content = "# Message d'administrateur @"+abo.tag
			discordAdd( { type: "admLog", contenu: contenu } )
			discordAdd( { type: "webHookDirect", abo: abo, contenu: contenu } )
			break
		default: gbl.exception("abonneMessage impossible, mauvais op",400)
	}
}
// ATTENTION, FONCTION PUBLIQUE
function getSynthesePublique() {
	return { nbAbo: etat.abonnes.length , nbAboMax: CONF.ABONBMAX } 
}
// ATTENTION, FONCTION PUBLIQUE
async function abonneAddPublic(pseudo,json) { 
	// json.url // json.roleType json.roleId // json.cat // json.tag
	let abo = getAbonneByUrl(json.url)
	if (abo) gbl.exception("Abonnement impossible, URL de WebHook déjà utilisée",299)
	await abonneAdd(pseudo,json)
	gbl.exception( getSynthesePublique(), 290)
}
// ATTENTION, FONCTION PUBLIQUE
async function abonneUpdPublic(pseudo,json) { 
	// json.url // json.roleType json.roleId // json.cat // json.tag
	let abo = getAbonneByUrl(json.url)
	if (!abo) gbl.exception("Modification impossible, URL de webhook introuvable",299)
	// on peut modifier le tag -- 	if (abo.tag != json.tag) gbl.exception("Modification impossible, Tag de guilde incohérent",299)
	await abonneUpdate(pseudo,abo.id,json)
	gbl.exception( getSynthesePublique(), 292)
}
// ATTENTION, FONCTION PUBLIQUE
async function abonneDelPublic(pseudo,json) { 
	// json.url // json.roleType json.roleId // json.cat // json.tag
	let abo = getAbonneByUrl(json.url)
	if (!abo) gbl.exception("Suppression impossible, URL de webhook introuvable",299)
	if (abo.tag != json.tag) gbl.exception("Suppression impossible, Tag de guilde incohérent",299)
	await abonneDelete(pseudo,abo.id)
	gbl.exception( getSynthesePublique(), 293)
}

///////////////////////////////////////////////////////////////////////////////
// messages
// messages
// messages
///////////////////////////////////////////////////////////////////////////////
function getMessageObjectNameById(id) {
	return COLNAME+"/msg-"+id
}
function getMessageById(id) {
	return etat.messages.find( (e) => e.id==id)
}
function getMessageByDesc(desc) {
	return etat.messages.find( (e) => e.desc==desc)
}
function getMessageIdxById(id) {
	return etat.messages.findIndex( (e) => e.id==id)
}
function countMessageByCat(cat) {
	return etat.messages.reduce( (a,m) => (m.cat==cat)? a+1 : a , 0)
}
// messagevalidation json est un objet { desc: string, conenu: string cat:string } et retourne l'OBJET contenu
function messsageValidation(json,newMsg) {
	if (newMsg && etat.messages.length >= CONF.MSGNBMAX-1) gbl.exception("messageAdd trop de messages en pool",400)
	if (!newMsg && etat.messages.length >= CONF.MSGNBMAX) gbl.exception("messageAdd trop de messages en pool",400)
	if (!json.desc || json.desc.length >= CONF.MSGDESCLEN) gbl.exception("messsageValidation desc trop longue ou invalide",400)
	if (!newMsg && !getMessageById(json.id)) gbl.exception("messsageValidation message non existant",400)
	if (!getCategorieByTag(json.cat)) gbl.exception("messsageValidation categorie non existante",400)
	let msgDesc = getMessageByDesc(json.desc)
	if (newMsg && msgDesc) gbl.exception("messsageValidationi (new) description deja existante sur un message existant",400)
	if (!newMsg && msgDesc && msgDesc.id!=json.id) gbl.exception("messsageValidation (update) description existante sur un autre message",400)
	let vJson = contenuVerify(json.contenu)
	if (!vJson) gbl.exception("messsageValidation syntaxe message invalide",400)
	// verif que le nombre de message dans la categorie est OK
	let cnt = countMessageByCat(json.cat)
	if (newMsg && cnt >= CONF.MSGNBBYCAT-1) gbl.exception("messsageValidation trop de message dans la categorie",400)
	if (!newMsg && cnt >= CONF.MSGNBBYCAT) gbl.exception("messsageValidation trop de message dans la categorie",400)
	return vJson
}
async function messageTest(pseudo,json) {
	let vJson = messsageValidation(json,true)
	if (!vJson) gbl.exception("messageTest syntaxe message invalide",400)
	// publication sur canal de test
	vJson.content = "## Pour vérification du message AVANT mise en pool\nDesc:"+json.desc+" Catégorie:"+json.cat+" Messages:"+etat.messages.length+"/"+CONF.MSGNBMAX
	discordAdd( { type: "admLog", contenu: vJson } )

	// Ne fonctionne pas sans être un bot de guide discord
	/*
 	// Ajout de la reaction
	console.log("messageTest",ret)
	// /channels/{channel.id}/messages/{message.id}/reactions/{emoji.id}/@me
	let url = discord.urlPrefix+"/channels/"+ret.json.channel_id+"/messages/"+ret.json.id+"/reactions/❤/@me"
	console.log("messageTest",url)
	let urlRet = await gbl.apiCallExtern(url,"PUT",null,discord.headers ,"json")
	console.log("messageTest",urlRet)
	*/
	return "ok"
}
async function messageAdd(pseudo,json) {
	let vJson = messsageValidation(json,true)
	etat.idx++
	// sauvegarde de l'objet complet selon son index
	let name = getMessageObjectNameById(etat.idx)
	let simpleObj = { name: name, contenu: vJson }
	etat.messages.push( { id: etat.idx , cat: json.cat, desc: json.desc, pseudo:pseudo, dth: Date.now() } )
	collections.saveSimpleObject(name,simpleObj)
	etatSync()
	// publication sur canal de test sauf si disable
	if (!json.noDiscord) {
		vJson.content = "## Message AJOUTE dans pool\nId:#"+etat.idx+" Desc:"+json.desc+" Catégorie:"+json.cat+" Messages:"+etat.messages.length+"/"+CONF.MSGNBMAX
		discordAdd( { type: "admLog", contenu: vJson } )
	}
	return etat
}
async function messageUpdate(pseudo,id,json) {
	let msg = getMessageById(id)
	if (!msg) gbl.exception("messageUpdate id introuvable: #"+id,400)
	let name = getMessageObjectNameById(id)
	let vJson = messsageValidation(json,false)
	if (!vJson) gbl.exception("messageUpdate syntaxe message invalide",400)
	// commit
	msg.pseudo = pseudo
	msg.dth = Date.now()
	msg.desc = json.desc
	msg.cat = json.cat
	collections.saveSimpleObject(name,{ name: name, contenu: vJson } )
	etatSync()
	vJson.content = "## Message UPDATE dans pool\nId:#"+id+" Desc:"+json.desc+" Catégorie:"+json.cat+" Messages:"+etat.messages.length+"/"+CONF.MSGNBMAX
	discordAdd( { type: "admLog", contenu: vJson } )
	return etat
}
function messageDelete(pseudo,id) {
	let idx = getMessageIdxById(id)
	if (idx<0) gbl.exception("messageDelete id introuvable",400)
 	// suppression du datastore et de l'état
	let objName = getMessageObjectNameById(id)
	etat.messages.splice(idx,1)
	collections.deleteSimpleObject(objName)
	etatSync()
	return etat
}
// Recupere la totalité du message (inmemory && offload)
async function messageGet(pseudo,id) {
	let msg = getMessageById(id)
	if (!msg) gbl.exception("messageGet id introuvable: "+id,400)
	let name = getMessageObjectNameById(id)
	let offLoad = collections.loadSimpleObject(name)
	if (!offLoad.contenu) gbl.exception("messageGet offboard unsynch: "+name,500)
	// merge
	return Object.assign(offLoad,msg)
}
///////////////////////////////////////////////////////////////////////////////
// Scheduling
// Scheduling
// Scheduling
///////////////////////////////////////////////////////////////////////////////
const DIFFUSIONDELAIGARDE = 24*3600*1000 // si delai > 1 jour, on se reposera la question plus tard...
const DISCORDDELAISTART = 100	// delai de 1/10eme de seconde
const DISCORDDELAILOOP  = 400	// max tous les 4/10eme de secondes
let discordTimerId = null
let discordQueue = []	// non sauvegarde pour réentrance si bug en infinite loop et que pas de reponse checksec donc PLS serveur
let diffusionTimerId = null

// Lancement d'un traitement de diffusion Timer, ne dois être appelée qui si etat.diffusions n'est pas vide
function diffusionTimer() {
	// recupere la premiere diffusion et la supprime des diffusions prévues
	let dif = etat.diffusions.splice(0,1)[0]
	// syncEtat pour eviter les boucles en cas de crash server potentiel
	etatSync()
	diffusionExecute(dif)
}
// Calcule le scheduling des diffusions
function diffusionsReschedule() {
	try {
		// etat.diffusions est trié par dth
		// dans tous les cas, annule le precedent timer
		if (diffusionTimerId) { clearTimeout(diffusionTimerId); diffusionTimerId=null }
		// si pas de diffusion prévue, on ne fait rien
		if (etat.diffusions.length <= 0) { console.log("diffusionsReschedule - Liste de diffusion vide"); return }
		let dthDelta = etat.diffusions[0].dth - Date.now()
		// si diffusion pas encore d'actualité, on se reposera la question dans dthDelta ou au maximu DIFFUSIONDELAIGARDE pour gestion overflow setTimeout
		if (dthDelta > 0) { console.log("diffusionsReschedule dthDelta=",dthDelta); diffusionTimerId = setTimeout(diffusionsReschedule,Math.min(DIFFUSIONDELAIGARDE,dthDelta)); return }
		// dthDelta <= 0, on doit faire une diffusion sur timer
		diffusionTimer()
		// recalcule le scheduling
		diffusionsReschedule()
	}
	catch(e) {
		console.error("diffusionsReschedule",e)
	}
}

async function discordDualLog(contenu) {
	let ret
	try {
		ret  = await gbl.apiCallExtern(WEBHOOKLOG+"?wait=true",'POST',contenu, discord.headers ,"json")
		if (ret.status != 200) console.log("discordDualLog erreur notification:",WEBHOOKLOG,ret)
		ret = await gbl.apiCallExtern(etat.webHookLog+"?wait=true",'POST',contenu, discord.headers ,"json")
		if (ret.status != 200) console.log("discordDualLog erreur notification:",etat.webhookLog,ret)
	}
	catch(e) {
		console.log("discordDualLog exception interne a discordDualLog",e)
	}
}
async function discordSimpleError(txt,o1,o2) {
	console.log("discordSimpleError",txt,o1,o2)
 	let msg = { embeds: [ { thumbnail: { url:THUMBALERT }, description: "# Erreur\n"+txt } ] }
	await discordDualLog(msg)
}
// Ajoute le trailer dans le contenu, avec le coeur si flagLove
function discordContenuAddTrailer(contenu,flagLove) {
	let c= Object.assign({},contenu)
	c.embeds = structuredClone(contenu.embeds || [] )
	c.embeds.push((flagLove)? WEBHOOKTRAILERLOVE: WEBHOOKTRAILER)
	return c
}
// Ajoute en début du content avec le role si besoin Modification
// Attention, replace INPLACE de contenu
function discordContenuAddRole(contenu,abo) {
	// contenu.content = '@testrole <@&1505585397525385316>' // abo?.role
	// contenu.allowed_mentions = { "parse": ["roles","everyone"] }
	if (abo?.role) contenu.content = ((abo.role=="everyone") ? '@everyone\n' : '<@&'+abo.role+'>\n') + (contenu.content || "")
	return contenu
}
async function discordProcess(proc) {
	console.log('discordProcess @',Date.now(),proc.type)
	switch( proc.type) {
		case "webHookDif" : {
			// discordAdd( { type: "webHookDif", abo: abo, msg: msg, d: tblPot.length, r: tblDispo.length  } )
			let name = getMessageObjectNameById(proc.msg?.id)
			let vJson = collections.loadSimpleObject(name)
			if (!vJson.contenu) { await discordSimpleError("Erreur sur webHookDif offLoad invalide, voir log server",proc,name); break }
			// console.log("webHookDif1",vJson.contenu)
			let contenu = discordContenuAddTrailer(vJson.contenu,true)
			discordContenuAddRole(contenu,proc.abo)
			// console.log("webHookDif2",contenu)
			// marque que cette requete doit être terminée avant le histoSync
			histoSyncPendingNb++
			// await gbl.sleep(3) pour test LAG DISCORD uniquement
			let ret = await gbl.apiCallExtern(proc.abo.url+"?wait=true",'POST',contenu, discord.headers ,"json")
			if (ret.status != 200) { 
				await discordSimpleError("Erreur sur webHookDif post, voir log server",proc,ret)
			}
			else {
				// console.log("discordProcess",ret)
				console.log("discordProcess ************** Manque verif pour nom du hook et desabonnenment autoritaire")
				// Ajout dans l'historique (abo avec message)
				histoAddAboMsg(proc.abo,proc.msg,proc.d,proc.r,ret.json?.id)
			}
			// marque que cette requete comme terminée avant le histoSync
			histoSyncPendingNb--  
			break
		}
		case "webHookDirect" : {
			// discordAdd( { type: "webHookDirect", abo: abo, contenu: oContenu, flagLove: } )
			let contenu = discordContenuAddTrailer(proc.contenu, proc.flagLove)
			discordContenuAddRole(contenu,proc.abo)
			if (!proc?.abo?.url) { await discordSimpleError("Erreur sur WebHookDirect url:",proc); break }
			let ret = await gbl.apiCallExtern(proc.abo.url+"?wait=true",'POST',contenu, discord.headers ,"json")
			if (ret.status != 200) { await discordSimpleError("Erreur sur WebHookDirect post:",proc,ret); break }
			break
		}
		case "faim" : {
			// discordAdd( { type: "faim", abo: abo,  d: tblPot.length, r: tblDispo.length  } )
			let contenu = { embeds: [ { thumbnail: { url: THUMBALERT }, description: "# Attention,\nl'abonné "+proc.abo.tag+"("+proc.abo.id+") ne dispose plus que de "+proc.r+"/"+proc.d+" messages de la catégorie: "+proc.abo.cat } ] }
			await discordDualLog(contenu)
			break
		}
		case "famine" : {
			// discordAdd( { type: "famine", abo: abo,  d: tblPot.length, r: tblDispo.length  } )
			// Ajout dans l'historique (famine)
			histoAddAboMsg(proc.abo,null,proc.d,proc.r)
			// message d'alerte
			let contenu = { embeds: [ { thumbnail: { url: THUMBALERT }, description: "# Attention,\nl'abonné "+proc.abo.tag+"("+proc.abo.id+") est en famine sur la catégorie: "+proc.abo.cat } ] }
			await discordDualLog(contenu)
			break
		}
		case "bienvenue" : {
			// discordAdd( { type: "bienvenue", abo: abo, cat: cat } )
			let contenu = discordContenuAddTrailer(proc.cat.welcome,false)
			discordContenuAddRole(contenu,proc.abo)
			let ret = await gbl.apiCallExtern(proc.abo.url+"?wait=true",'POST',contenu, discord.headers ,"json")
			if (ret.status != 200) { await discordSimpleError("discordProcess bienvenue opcode erreur",proc,ret) }
			break
		}
		case "desabonne" : {
			// discordAdd( { type: "desabonne", abo: abo } )
			if (! proc.abo?.url)  { await discordSimpleError("discordProcess desabonne abo sans url",proc); break }
			let contenu = discordContenuAddTrailer( { content: "### Abonnement "+proc.abo?.cat+"@"+proc.abo?.tag+" résilié (DiscordId:"+proc.abo?.guild+")" } )
			let ret = await gbl.apiCallExtern(proc.abo.url+"?wait=true",'POST',contenu , discord.headers ,"json")
			if (ret.status != 200) { await discordSimpleError("discordProcess desabonne opcode erreur",proc,ret) }
			break
		}
		case "admLog" : {
			// discordAdd( { type: "admLog", contenu: vJson } )
			await discordDualLog(proc.contenu)
			break
		}
		case "Erreur" : {
			/// discordAdd( { type: "Erreur", txt:"cat introuvable:"+dif.cat  } )
			let contenu = { embeds: [ { thumbnail: { url:THUMBALERT }, description: "# Erreur ou Warning\n"+proc.txt } ] }
			await discordDualLog(contenu)
			break
		}
		case "Resume" : {
			// discordAdd( { type: "Resume", text: text,  algoStart: algoStart, algoEndDelta: algoEndDelta, nbDem: nbDem } )
			let diffusionEnd = process.hrtime(proc.algoStart) // chrono traitement
			let synthese = {
				content: "# Resumé: "+ proc.text +
					"\nWebhook sollicités: "+proc.nbDem+
					"\nTemps calcul de décision: "+ (proc.algoEndDelta[0] * 1000 + proc.algoEndDelta[1] / 1000000)+" ms"+
					"\nTemps de traitement dequeue Discord: "+(diffusionEnd[0] + diffusionEnd[1] / 1000000000)+" s"+
					"\nHeure de fin: "+gbl.hhmmssms(Date.now())+"(UTC)"
			}
			await discordDualLog(synthese)
			break
		}
		case "Synthese" : {
			// discordAdd( { type: "Synthese", dif: dif, algoStart: algoStart, algoEndDelta: algoEndDelta, nbDem: nbDem } )
			let diffusionEnd = process.hrtime(proc.algoStart) // chrono traitement
			let cat = getCategorieByTag(proc.dif?.cat)
			let synthese = {
				content: "# Synthèse diffusion: "+cat?.desc+
					"\nDiffusion: #"+ proc.dif?.id+" Cat: "+proc.dif?.cat+
					"\nWebhook sollicités: "+proc.nbDem+
					"\nTemps calcul de décision: "+ (proc.algoEndDelta[0] * 1000 + proc.algoEndDelta[1] / 1000000)+" ms"+
					"\nTemps de traitement dequeue Discord: "+(diffusionEnd[0] + diffusionEnd[1] / 1000000000)+" s"+
					"\nHeure de fin: "+gbl.hhmmssms(Date.now())+"(UTC)"+
					"\nRequetes en Discord Pending: "+histoSyncPendingNb+" (Si >0 histoSync en différé)"
			}
			await discordDualLog(synthese)
			histoSync() // Effectué uniquement ici pour optimiser les acces datastrore
			break
		}
		default: {
			let contenu = { embeds: [ { thumbnail: { url:THUMBALERT }, description: "# Erreur OPCODE dans discordProcess:"+proc.type } ] }
			await discordDualLog(contenu)
		}
	}
}
async function discordTimer() {
	try {
		console.log("discordTimer",discordQueue.length)
		if (discordTimerId) clearTimeout(discordTimerId)
		let proc = discordQueue.shift()
		if (discordQueue.length > 0) {
			// Il reste un enqueue discord, traitement au prochain timer
			discordTimerId = setTimeout(discordTimer,DISCORDDELAILOOP)
		}
		else {
			console.log("discordTimer file vide")
			// plus d'enqueue Discord
			discordTimerId = null
		}
		// Pour éviter les races conditions en cas de lag discord, le discordProcess est fait APRES gestion de enqueue et sera des pending promices
		// meme en cas d'erreur/exception Discord, le discordTimer est hyperstatique
		if (proc) await discordProcess(proc)
	}
	catch (e) {
		console.log("discordTimer",e)
	}
}
// force le traitmenet discord
function discordAdd(proc){
	// console.log("discordAdd",proc)
	discordQueue.push(proc)
	if (!discordTimerId) discordTimerId = setTimeout(discordTimer,DISCORDDELAISTART)	
}

///////////////////////////////////////////////////////////////////////////////
// API Calls
// API Calls
// API Calls
///////////////////////////////////////////////////////////////////////////////
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	switch(method) {
		case "OPTIONS": 
			pseudos.check(pseudo,pwd,null,pseudos.PRIVCODEX) // auth avec privilege
			res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			// cas des get publics
			switch(reqPaths[2]) {
				case "synthese":
					gbl.exception( getSynthesePublique() , 200) 
			}
			// le reste necessite une auth
			pseudos.check(pseudo,pwd,null,pseudos.PRIVCODEX) // auth avec privilege
			switch(reqPaths[2]) {
				case "etat":
					// retroune l'état global
					gbl.exception( etat , 200) 
       case "conf":
          // retroune la conf en JSON direct
          gbl.exception( CONFJSON , 200, true)
       case "diffusions":
          // provoque la diffusion immediate
					gbl.exception( await diffusionNow(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx)),200)
       case "messages":
					// recupere le message complet
					gbl.exception( await messageGet(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx)),200)
       case "report":
					// recupere le report
					gbl.exception( histoGetAllAsString(),200,true)
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			// cas des post publics
			switch(reqPaths[2]) {
				case "addWebHook":
					await abonneAddPublic(pseudo,JSON.parse(body))
				case "uptWebHook":
					await abonneUpdPublic(pseudo,JSON.parse(body))
				case "delWebHook":
					await abonneDelPublic(pseudo,JSON.parse(body))
			}
			// le reste necessite une auth
			pseudos.check(pseudo,pwd,null,pseudos.PRIVCODEX) // auth avec privilege
			switch(reqPaths[2]) {
				case "diffusions":	// Ajoute une diffusion
					gbl.exception( diffusionAdd(pseudo,JSON.parse(body)) , 200) 
				case "categories":	// Ajoute une categorie
					gbl.exception( await categorieAdd(pseudo,JSON.parse(body)),200)
				case "msgTest":			// test d'un message
					gbl.exception( await messageTest(pseudo,JSON.parse(body)) , 200) 
				case "catTest":			// test d'une catégorie
					gbl.exception( await categorieTest(pseudo,JSON.parse(body)) , 200) 
				case "messages":		// ajout d"un message
					gbl.exception( await messageAdd(pseudo,JSON.parse(body)) , 200) 
				case "abonnes":			// Ajout abonné
					gbl.exception( await abonneAdd(pseudo,JSON.parse(body)),200)
				case "abonneMessage":	// message d'admin a un abonné (test ou envoi réel)
					gbl.exception( await abonneMessage(pseudo,JSON.parse(body)),200)
				case "admMsgTest":	// test d'un message d'admin
					gbl.exception( admMsgTest(pseudo,JSON.parse(body)),200)
				case "admMsgSend":	// envoi d'un message d'admin
					gbl.exception( admMsgSend(pseudo,JSON.parse(body)),200)
				case "admHistoSync": { // force la flush de l'historique
					if (histoSync())
						gbl.exception( "histoSync OK",200)
					else
						gbl.exception( "histoSync DELAY voir log serveur",201)
				}
				case "configUpdate":	//modif de la config
					gbl.exception( await configUpdate(pseudo,JSON.parse(body)),200)
				case "admTestCompo": {		// test COMPO !! DANGEUREUX
					pseudos.check(pseudo,pwd,true) // SERVER ADMIN ONLY
					let json = JSON.parse(body)
					if (!json.url?.startsWith("https://discord.com/api/") ) gbl.exception("Ton Url WebHook est invalide",402)
					let ret = await gbl.apiCallExtern(json.url,'POST',json.body, discord.headers ,"json")
					gbl.exception( { json:json, ret:ret } , ret.status)
				}
			}
			gbl.exception(COLNAME+" post",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,null,pseudos.PRIVCODEX) // auth avec privilege
			switch(reqPaths[2]) {
				case "messages":			// modif du texte d'un message
					gbl.exception( await messageUpdate(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx),JSON.parse(body)),200)
			}
			gbl.exception(COLNAME+" patch",400);
		case "DELETE":
			pseudos.check(pseudo,pwd,null,pseudos.PRIVCODEX) // auth avec privilege
			switch(reqPaths[2]) {
				case "diffusions":	// Supprime une diffusion
					gbl.exception( diffusionDelete(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx) ),200)
				case "categories":	// Supprimer une catagorie
					gbl.exception( categorieDelete(pseudo,JSON.parse(body)),200)
				case "messages":		// Suppression d'un message
					gbl.exception( messageDelete(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx) ) , 200) 
				case "abonnes":
					gbl.exception( abonneDelete(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx) ),200)
				case "xrefs":
					gbl.exception( histoClear(),200)
				case "all":
					pseudos.check(pseudo,pwd,true) // adm only
					globalReset()
					gbl.exception( etat , 200) 
			}
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

diffusionsReschedule()
console.log(COLNAME+" loaded & diffusions recheduled")
