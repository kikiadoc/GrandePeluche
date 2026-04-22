const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');
const lodestone = require('../infraback/lodestone.js');

// nom de la collection
const COLNAME="S-codex"

const	WEBHOOKTEST= "https://discord.com/api/webhooks/1493973792840486935/5BrfiNPt8o-7qhIhkcbQnhG97Q0Q7-ynYkxjAJ-fnFkj0PPNO4OrZGscw-uIhFB0e9MV?wait=true"
const CONF= {
	DIFNBMAX: 150,			// max diffusions
	DIFITERMAX: 31,			// iterations
	DIFITERTYPE: [ {t:'J',lbl:'Jours'}, {t:'S',lbl:'Semaines'}, {t:'M',lbl:'Mois'} ],		// type iteraction
	CATNBMAX: 10,			// max categories
	CATTAGLEN: 3,			// taille d'un tag
	CATDESCLEN: 20,		// max taille d'un desc de categorie
	CATTYPES: [ {t:"P",d:"Envoi le premier non envoyé"}, {t:"R",d:"Envoi en random parmi les non envoyés"} ],
	ABONBMAX: 50,			// max abonnes
	ABOURLSTART: "https://discord.com/api/webhooks/",
	ABOROLELEN: 15,		// taille d'un role
	MSGNBMAX: 500,		// max message
	MSGSZLEN: 3000,		// max taille unitaire d'un message
	MSGDESCLEN: 20,		// max taille description d'un message
	PROTIMER: 60000,	// delai entre now et le post d'un diffusion
}
const CONFJSON = JSON.stringify(CONF)

// Avancement
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.idx ??= 0
	e.diffusions ??= []
	e.abonnes ??= []
	e.categories ??= []
	e.messages ??= []
	return e
}
// Sauvegarde de l'etat (sans synchro multijoueurs)
function syncEtat() {
	collections.save(etat)
}
// Reset global
// Attention, l'idx des objets à creer est conservé
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	let oldIdx = etat?.idx || 0
	etat = normalize(collections.reset(COLNAME))
	etat.idx = oldIdx
	syncEtat()
}

// diffusions
// diffusions
// diffusions
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
	syncEtat()
	return etat
}
function diffusionAddValidee() {
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
	if (json.dth < Date.now()+CONF.PROTIMER) gbl.exception("diffusionAdd Date dépassée ou presque",400)
	// Verif DTH de répétition
	json.rep.forEach ( (rDth) => { if (!Number.isInteger(rDth)) gbl.exception("diffusionAdd rep dth invalide",400) } )
	// Verif crenaeau de diffusion non utilisé
	if (isDiffusionExist(json.dth)) gbl.exception("diffusionAdd Creneau horaire déjà utilisé",400)
	// commit
	let repIdx = (json.rep.length)? ++etat.idx : null // id de répétition si besoin
	// ajoute la diffusion
	etat.diffusions.push( { id: ++etat.idx, pseudo: pseudo, dth:json.dth , cat:json.cat, rep:repIdx })
	// ajoute les répétitions
	json.rep.forEach ( (r) => { etat.diffusions.push( { id: ++etat.idx, pseudo: pseudo, dth:r , cat:json.cat, rep:repIdx }) })
	diffusionsSortByDth()
	syncEtat()
	return etat
}

// execution d'une duffusion par id
async function diffusionExecuteById(id) {
	// recupere la diffusion et la supprime pour eviter les boucles & race
	let idx = getDiffusionIdxById(id)
	if (idx<0) gbl.exception("diffusionExecuteById diffusion id invalide",400)
	let dif = etat.diffusions[idx]
	etat.diffusions.splice(idx,1)
	syncEtat() // securité pour si bug sur diffusion
	let rDif = await diffusionExecute(dif)
	console.log("diffusionExecuteById",rDif)
	return rDif
}
// Execution d'une diffusion (elle ne doit plus etre dans etat pour async pour eviter les races conditions)
// retourne un objet systhèse de l'éx&cution
async function diffusionExecute(dif) {
	// !!!!!!!!!!!!!!! REFLECHIR A METTRE DANS LE THREADPOOL DES WORKERS
	// !!!!!!!!!!!!!!! REFLECHIR A METTRE DANS LE THREADPOOL DES WORKERS
	//
	let algoStart= process.hrtime() // chrono début
	let tblEmi = []	// sera populé par les demandes d'émission message discord
	// Recupère la categorie de la dif
	let cat = getCategorieByTag(dif.cat)
	if (!cat) return { rc: 1, txt: "Categorie invalide" }
	// recupère les messages potentiels concernés (normalement, par id croissant)
	let tblPot = [] // tableau des potentiels contient des messages avec id
	etat.messages.forEach( (m) => { if (m.cat==cat.tag) tblPot.push(m) } )
	if (tblPot.length==0) return { rc: 1, txt: "Categorie vide" }
	// balayage des abonnes
	etat.abonnes.forEach( (abo) => {
		// si abonné non concerné par la diffusion, passe a l'abonné suivant
		if (abo.cat!=dif.cat) return	// abo suivant
		// associé a l'abonné, on a la liste des messages diffusés (tblEnv)
		// il faut prendre la liste des messages dispo, supprimer les envoyés et choisir
		// balaye le tbl potentiel, vérifie que ce n'est pas dans le tblEnv des envoyés
		let tblEnv = abonneGetTblEnvoye(abo) // aka abo.tblEnv
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
				vPot = (iPot < tblPot.length)? tblPot[iPot].id : Infinity // optim possible si infinity: plus de dispos
				vEnv = (iEnv < tblEnv.length)? tblEnv[iEnv].id : Infinity // optim possible, tous les tblPot restant sont des dispos
				if (vPot == Infinity && vEnv == Infinity) break;
				if (vPot < vEnv ) { tblDispo.push(tblPot[iPot]); iPot ++; continue } // le potentiel doit être conserve car pas envoyé
				if (vPot > vEnv ) { iEnv ++; continue } // le potentiel est plus grand que l'envoye, on passe a l'envoyé suivant
				iPot++; iEnv++; // meme poteniel qu'envoye, on passe aux suivants
			}
		}
		// On a les messages disponibles dans tblDispo pour l'abonné
		if (tblDispo.length <= 0) {
			// aucun message disponinle
			tblEmi.push( { abo: abo, msg: null } )
			return	// abo suivant
		}
		// Choix d'un message dans les dispos selon l'alogrithe R pour random dans les disponibles et P pour le premier disponible
		let iChoix = (cat.type=="R")? Math.floor(Math.random() * tblDispo.length) : 0
		let msg = tblDispo[iChoix] 
		// empile l'emission dans la file d'emission prevue
		tblEmi.push( { abo: abo, msg: msg } )
	})
	let algoEnd= process.hrtime(algoStart) // chrono traitement
	console.log("diffusionExecute traitement calcul (en micro secondes)", algoEnd[0] * 1000000 + algoEnd[1] / 1000)
	// Affichage prévision d'Emission des messages & enqueue Discord
	tblEmi.forEach( (emi) => {
		console.log("diffusionExecute Prevision Discord: abonne=", emi.abo?.id," msg=", emi.msg?.id)
		if (emi.msg) {
			// XREF
			abonneAjouteMsgEnvoye(emi.abo,emi.msg) // ajoute dans l'abonné le message envoyé
			messageAjouteMsgEnvoye(emi.abo,emi.msg) // ajoute dans message l'abonné envoyé
			discordAdd( { type: "webhook", url: emi.abo.url, msg: null, msgObjName: getMessageObjectNameById(emi.msg.id) } )
		}
	})
	// force le traitement discord
	discordTimer()
	// retourne la synthèse
	return { rc: 0, txt: "ok", tblEmi: tblEmi }
}

// diffusion forcée depuis l'IHM
async function diffusionNow(pseudo,id) {
	console.log("diffusionNow par:",pseudo,"id=",id)
	let rDif = await diffusionExecuteById(id)
	return etat
}

// categories
// categories
// categories
function getCategorieIdxByTag(tag) {
	return etat.categories.findIndex( (e) => e.tag==tag)
}
function getCategorieByTag(tag) {
	return etat.categories.find( (e) => e.tag==tag)
}
function categorieAdd(pseudo,json) {
	if (!json.tag || json.tag.length!=CONF.CATTAGLEN) gbl.exception("categoriesAdd tag invalide",400)
	if (!json.desc || json.desc.length>CONF.CATDESCLEN) gbl.exception("categoriesAdd desc invalide ou trop longue",400)
	if (!json.type || json.type.length>1) gbl.exception("categoriesAdd type invalide ou trop longue",400)
	if (getCategorieIdxByTag(json.tag) >= 0) gbl.exception("categoriesAdd tag existant",400)
	etat.categories.push( { tag: json.tag, desc: json.desc, type: json.type, dth: Date.now(), pseudo: pseudo } )
	syncEtat()
	return etat
}
function categorieDelete(pseudo,json) {
	if (!json.tag || json.tag.length!=CONF.CATTAGLEN) gbl.exception("categoriesDelete tag invalide",400)
	let idx = getCategorieIdxByTag(json.tag)
	if (idx < 0)  gbl.exception("categoriesDelete tag introuvable",400)
	etat.categories.splice(idx,1)
	syncEtat()
	return etat
}
// abonnes
// abonnes
// abonnes
function getAbonneIdxById(id) {
	return etat.abonnes.findIndex( (e) => e.id==id)
}
async function abonneAdd(pseudo,json) {
	// Url check
	if (! json.url.startsWith(CONF.ABOURLSTART) ) gbl.exception("url invalide",400)
	console.log("***** abonneAdd -- manque REGEXP pour URL CHeck")
	console.log("***** abonneAdd -- manque UNICITE pour URL CHeck")
	console.log("***** abonneAdd -- manque Verif snowflake URL CHeck")
	// Role Check
	if (json.role && json.role.length > CONF.ABOROLELEN) gbl.exception("role invalide",400)
	console.log("***** abonneAdd -- manque Verif ROLE")
	// categorie check
	let cat = getCategorieByTag(json.cat) // categorie check
	if (!cat) gbl.exception("categorie introuvable",400)
	// taille check abonnés
	if (etat.abonnes.length > CONF.ABONBMAX ) gbl.exception("limite max nb abonné",400)
	// Recup caracteristiques du webhook
	let caractWh = await gbl.apiCallExtern(json.url,null,null, discord.headers ,"json")
	if (caractWh.status != 200) gbl.exception("URL webhook invalide (erreur get)",400)
	let nomHook = caractWh.json.name
	// Verif que le nom du webhook est unique pour les abonements
	console.log("***** abonneAdd -- peut-on forcer un nom unique pour le hook ?")
	//
	// Poste un message de bienvenue
	ret = await gbl.apiCallExtern(json.url+"?wait=true",'POST',{ content: (json.role)? "@"+json.role: "" + "\nAbonnement " + cat.desc }, discord.headers ,"json")
	if (ret.status != 200) gbl.exception("URL webhook invalide (erreur post welcome)",400)
	// commit
	etat.idx ++
	etat.abonnes.push( { id: etat.idx, dth: Date.now(), url: json.url, cat: cat.tag, role: json.role, nomHook: nomHook, tblEnv: [] } )
	syncEtat()
	return etat
}
function abonneDelete(pseudo,id) {
	let idx = getAbonneIdxById(id)
	if (idx < 0)  gbl.exception("abonne idx introuvable",400)
	// commit
	etat.abonnes.splice(idx,1)
	syncEtat()
	return etat
}
function abonneGetTblEnvoye(abo) { // aka abo.tblEnv
	console.log("abonneGetTblEnvoye *********************** GESTION PREFETCH A FAIRE")
	return abo.tblEnv
}
function abonneAjouteMsgEnvoye(abo,msg) {
	// Attention, il faut que le tblEnv reste croissant pour le MONKEY CLIMBER
	let tblEnv = abonneGetTblEnvoye(abo)
	let idx = tblEnv.findLastIndex( (env) =>  env.id < msg.id )
	// insert
	tblEnv.splice(idx+1, 0, { id: msg.id, dth: Date.now() } )
}

// messages
// messages
// messages
function messageVerify(jsonContenu) {
	if (!jsonContenu) gbl.exception("messageVerify pas de contenu",400)
	if (jsonContenu.length > CONF.MSGSZLEN) gbl.exception("messageVerify message trop long",400)
	let vJson
	try { vJson = JSON.parse(jsonContenu) }
	catch(e) { gbl.exception("messageVerify exception e="+e.message,400) }
	if (typeof vJson !== "object") gbl.exception("messageVerify json non valide",400)
	if (!vJson.embeds) gbl.exception("messageVerify embeds requis",400)
	console.log("***** messageVerify -- manque analyse structure complete")
	return vJson
}
function getMessageObjectNameById(id) {
	return COLNAME+"/msg-"+id
}
function getMessageIdxById(id) {
	return etat.messages.findIndex( (e) => e.id==id)
}
async function messageTest(pseudo,json) {
	let vJson = messageVerify(json.contenu)
	if (!vJson) gbl.exception("messageTest syntaxe message invalide",400)
	// publication sur canal de test
	vJson.content = "## Pour vérification du message AVANT mise en pool\nDesc:"+json.desc+" Catégorie:"+json.cat+" Messages:"+etat.messages.length+"/"+CONF.MSGNBMAX
	let ret = await gbl.apiCallExtern(WEBHOOKTEST,"POST",vJson, discord.headers ,"json")
	if (ret.status != 200) gbl.exception("messageTest error",400)
	console.log("messageTest",ret)
	// /channels/{channel.id}/messages/{message.id}/reactions/{emoji.id}/@me
	let url = "/channels/"+ret.json.channel_id+"/messages/"+ret.json.id+"/reactions/❤/@me
	console.log("messageTest",url)
	//let urlRet = await gbl.apiCallExtern(URL,"PUT",url, discord.headers ,"raw")
	console.log("messageTest",urlRet)
	return etat
}
async function messageAdd(pseudo,json) {
	if (etat.messages.length >= CONF.MSGNBMAX) gbl.exception("messageAdd trop de messages en pool",400)
	if (!json.desc || json.desc.length >= CONF.MSGDESCLEN) gbl.exception("messageAdd desc trop longue ou invalide",400)
	let vJson = messageVerify(json.contenu)
	if (!vJson) gbl.exception("messageAdd syntaxe message invalide",400)
	etat.idx++
	// sauvegarde de l'objet complet selon son index
	let name = getMessageObjectNameById(etat.idx)
	let simpleObj = { name: name, id: etat.idx , cat: json.cat, desc: json.desc, contenu: vJson }
	etat.messages.push( { id: etat.idx , cat: json.cat, desc: json.desc, tblEnv: [] } )
	collections.saveSimpleObject(name,simpleObj)
	syncEtat()
	// publication sur canal de test sauf si disable
	if (!json.noDiscord) {
		vJson.content = "## Message AJOUTE dans pool\nDesc:"+json.desc+" Catégorie:"+json.cat+" Messages:"+etat.messages.length+"/"+CONF.MSGNBMAX
		discordAdd( { type: "webHook", url: WEBHOOKTEST, msg: vJson, msgObjName: null } )
	}
	return etat
}
function messageDelete(pseudo,id) {
	let objName = getMessageObjectNameById(id)
	let idx = getMessageIdxById(id)
	if (idx<0) gbl.exception("messageDelete id introuvable",400)
 	// suppression du datastore et de l'état
	etat.messages.splice(idx,1)
	collections.deleteSimpleObject(objName)
	return etat
}
function messageGetTblEnvoye(msg) { // aka msg.tblEnv
	console.log("messageGetTblEnvoye *********************** GESTION PREFETCH A FAIRE")
	return msg.tblEnv
}
function messageAjouteMsgEnvoye(abo,msg) { // ajoute dans message l'abonné envoyé
	// Attention, il n'est pas neccessaire que le tblEnv du message soit MONKEY CLIMBER compliant
	let tblEnv = messageGetTblEnvoye(msg)
	tblEnv.push( { id: abo.id, dth: Date.now() } )
}

// Scheduling
// Scheduling
// Scheduling
const DISCORDDELAISTART = 100	// delai de 1/10eme de seconde
const DISCORDDELAILOOP  = 400	// max tous les 4/10eme de secondes
let discordTimerId = null
let discordQueue = []	// non sauvegarde pour réentrance si bug en infinite loop et que pas de reponse checksec donc PLS serveur

async function discordProcess(proc) {
	console.log('discordProcess @',Date.now(),proc)
	// discordQueue.push( { type: "webHook", url: WEBHOOKTEST, msg: vJson, msgObjName: null } )
}
async function discordTimer() {
	if (discordTimerId) clearTimeout(discordTimerId)
	let proc = discordQueue.shift()
	if (proc) await discordProcess(proc)
	if (discordQueue.length > 0) {
		// Il reste un enqueue discord, traitement au prochain timer
		discordTimerId = setTimeout(discordTimer,DISCORDDELAILOOP)
	}
	else
		discordTimerId = null
}
// force le traitmenet discord
function discordAdd(proc){
	discordQueue.push(proc)
	if (!discordTimerId) discordTimerId = setTimeout(discordTimer,DISCORDDELAISTART)	
}

// API Calls
// API Calls
// API Calls
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd,null,pseudos.PRIVCODEX) // auth avec privilege
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
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
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "diffusions":	// Ajoute une diffusion
					gbl.exception( diffusionAdd(pseudo,JSON.parse(body)) , 200) 
				case "categories":	// Ajoute une categorie
					gbl.exception( categorieAdd(pseudo,JSON.parse(body)),200)
				case "msgTest":			// test d'un message
					gbl.exception( await messageTest(pseudo,JSON.parse(body)) , 200) 
				case "messages":		// ajout d"un message
					gbl.exception( await messageAdd(pseudo,JSON.parse(body)) , 200) 
				case "abonnes":			// Ajout abonné
					gbl.exception( await abonneAdd(pseudo,JSON.parse(body)),200)
			}
			gbl.exception(COLNAME+" post",400);
		case "PATCH": 
			gbl.exception(COLNAME+" patch",400);
		case "DELETE":
			switch(reqPaths[2]) {
				case "all":
					pseudos.check(pseudo,pwd,true) // adm only
					globalReset()
					gbl.exception( etat , 200) 
				case "diffusions":	// Supprime une diffusion
					gbl.exception( diffusionDelete(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx) ),200)
				case "categories":	// Supprimer une catagorie
					gbl.exception( categorieDelete(pseudo,JSON.parse(body)),200)
				case "messages":		// Suppression d'un message
					gbl.exception( messageDelete(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx) ) , 200) 
				case "abonnes":
					gbl.exception( abonneDelete(pseudo,gbl.checkInt(reqPaths[3],0,etat.idx) ),200)
				case "xrefs": {
					etat.messages.forEach( (m) => m.tblEnv = [] )
					etat.abonnes.forEach( (a) => a.tblEnv = [] )
					syncEtat()
					gbl.exception( etat , 200) 
				}
					
			}
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
