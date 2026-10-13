
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const lodestone = require('../infraback/lodestone.js');
const vault = require('../infraback/vault.js');
const download = require('../infraback/download.js');
const WebSocket = require('ws');


const discordUrlPrefix="https://discord.com/api/v10"
const discordHeaders = {
			"User-Agent": "DiscordBot (https://ff14.adhoc.click), 1.0.1)",
			"Content-Type": "application/json; charset=UTF-8",
			"Authorization": 'Bot ' + vault.get('discord_token') 
};

const DISCORDKICK = 3600*1000	// delai pour accepter

const mpKikiadoc = "<@289493566278074368>"
const idKikiadoc = '289493566278074368'
const idGrandePeluche='1188482855026839583';
const genericDiscordTrailer="\n-\n"+((gbl.isProd())?"":"**(STAGING)**")+"Signé: *Hildiscord, assistant Discord de la Grande Peluche*" +
                  "\nSoucis? MP "+mpKikiadoc

// Channels disponibles pour les posts de la grande peluche (pour sécurité)

// Selon le discord
const gpProd={
	guildId: '934449346655715378', // discord kiki's event
	linkSite: true, // discord lié au site
	discordName: "Kiki's Event",
	siteName: "https://ff14.adhoc.click/enjoy",
	introductionMsgId : '1193712182010060860',	// message d'intoduction
	roleId: '1193328520416477294', // role aventurier
	testChanId:	"1039491017017143356",	// KIKIPROD
	infoChanId:	"1491928340679102535",	// Kiki's event, canal info a lire
	annoncesChanId:	"1151925290570874951",	// Kiki's event, canal public annonces
	discussionChanId:	"1143946654270111785",  // discussion
	checksecChanId:	"1280101334586097795",  // checksec
	welcomeId: '991283998389174272', // kiki's event welcome chan
	hegemonieChanId: '1279762365075951646', // channel de l'hegemonie de prod
	hegemonieRoleId: '1279762907701186624', // roleId de l'hegemonie de prod
	metropolisChanId: '1347534666453745725', // channel de métropolis de prod
	expansionChanId: '1384125294717435916', 
	expansionRoleId: '1384125351604649984',
	preludeRapiditeChanId: '1476916819036999872', // channel de prod
	bienvenueRoleId: '1476961182739857489', // role de bienvenue de prod
	discordTrailer: "\n-\nSigné: *Hildiscord, assistant Discord de la Grande Peluche et porte parole de Kikiadoc*" + 
									"\nGrande Peluche: <https://ff14.adhoc.click/enjoy>"+
									"\nDiscussion: <#1143946654270111785>"+
									"\nSoucis? MP "+mpKikiadoc
}
const gpStaging={
	guildId: '573082763641618432', // discord kiki's perso
	linkSite: true, // discord lié au site
	discordName: "Kiki's Perso",
	siteName: "https://ff14.adhoc.click/enjoyTest",
	introductionMsgId : '1278263907156492409', // '1193157704714289222',
	roleId: '1193326340250808330', // role aventurier
	testChanId:	"1039491017017143356",	// KIKITEST
	infoChanId:	"1279857314261766214",	// Kiki's perso, canal info a lire = annonces
	annoncesChanId:	"1279857314261766214",	// KIKITEST
	discussionChanId:	"1279859331386314793",  // discussion
	checksecChanId:	"1280101334586097795",  // checksec
	welcomeId: '1071753391262416957', // '573082763641618434', // kiki's perso welcome chan
	hegemonieChanId: '1279764642234761258', // channel de l'hegemonie de test
	hegemonieRoleId: '1279764689936449620', // roleId de l'hegemonie de test
	metropolisChanId: '1347535273281458216', // channel de métropolis de test
	expansionChanId: '1384128315056722001', 
	expansionRoleId: '1384128358039683132',
	preludeRapiditeChanId: '1039491017017143356', // channel de test
	bienvenueRoleId: '1476952656755953857', // role de bienvenue de test
	discordTrailer: "\n-\nSigné: *(STAGING) Hildiscord, assistant Discord de la Grande Peluche et porte parole de Kikiadoc*" + 
									"\nGrande Peluche: <https://ff14.adhoc.click/enjoyTest>"+
									"\nDiscussion: <#1143946654270111785>"+
									"\nSoucis? MP "+mpKikiadoc
}
const clTrankill={
	guildId: '1378777976929517649', // discord cl trankill
	linkSite: false, // discord non lié au site
	discordName: "CL Trankill",
	introductionMsgId : '1379753516364599306',	// message d'intoduction
	roleId: '1378902627143778384', // role aventurier
	welcomeId: '1378897642897014904', // welcome chan
	discordTrailer: "\n-\nSigné: *Hildiscord, assistant Discord de la Grande Peluche, porte parole deos administeurs*" + 
									"\nSoucis? MP "+mpKikiadoc
}

const tblCtxProd= {
	'934449346655715378': gpProd,
	'1378777976929517649': clTrankill,
}
const tblCtxStaging= {
	'573082763641618432': gpStaging, 
	// '1378777976929517649': clTrankill,
}

////////////////////////////////////////////
// Escape un texte pour discord
////////////////////////////////////////////
function escapeText(t) {
	return t.
		replaceAll("*"," ").
		replaceAll("_"," ").
		replaceAll("|"," ").
		replaceAll("("," ").
		replaceAll(")"," ").
		replaceAll("["," ").
		replaceAll("]"," ")
}
////////////////////////////////////////////
// contexte d'execution 
// selection la description à utiliser
////////////////////////////////////////////
function getRunCtx(guildId) {
	if (gbl.isProd())
		return (guildId && tblCtxProd[guildId]) || gpProd
	else
		return (guildId && tblCtxStaging[guildId]) || gpStaging
}

// check si usrId est la GranPeluche
function isGrandePeluche(authorId) {
	return (authorId == idGrandePeluche)
}

////////////////////////////////////////////
// Contexte transactionnel par usrId non sauvegardé
////////////////////////////////////////////
let ctxTransactions = {}
function setTransaction(usrId, prop, val) {
	ctxTransactions[usrId] ??= {}
	if (val==null)
		delete ctxTransactions[usrId][prop] 
	else
		ctxTransactions[usrId][prop] = val 
}
function getTransaction(usrId, prop) {
	ctxTransactions[usrId] ??= {}
	return ctxTransactions[usrId][prop]
}
function isTransactionActive(usrId) {
	ctxTransactions[usrId] ??= {}
	return Object.keys(ctxTransactions[usrId]).length > 0
}
////////////////////////////////////////////
// Gestion des associations FF14ID, userId discord etc... (sauvegardé)
////////////////////////////////////////////
let discordPseudos = collections.get('discordPseudos',true);

function getDiscordPseudoByGuidFf14(guildId,ff14Id) {
	discordPseudos[guildId] ??= {}
	return discordPseudos[guildId][ff14Id]
}
function getDiscordPseudoByGuildUsr(guildId,usrId) {
	discordPseudos[guildId] ??= {}
	for (let ff14Id in discordPseudos[guildId]) {
		let e = discordPseudos[guildId][ff14Id]
		if (e.usrId==usrId) return e
	}
	return null
}
function getDiscordByFf14Id(ff14Id) {
	const runCtx = getRunCtx(null)
	return getDiscordPseudoByGuidFf14(runCtx.guildId,ff14Id)
}
function getDiscordByPseudo(pseudo) {
	const ff14Id = pseudos.get(pseudo)?.ff14Id
	if (!ff14Id) return null
	return getDiscordByFf14Id(ff14Id)
}

function setDiscordPseudo(guildId,usrId,ff14Id,prenom,nom,monde) {
	discordPseudos[guildId] ??= {}
	discordPseudos[guildId][ff14Id] = {usrId:usrId, guildId:guildId, ff14Id:ff14Id, prenom:prenom, nom:nom, monde:monde }
	collections.save(discordPseudos);
}

async function deleteDiscordPseudo(guildId,usrId) {
	// recup du ff14Id
	const runCtx = getRunCtx(guildId)
	const e = getDiscordPseudoByGuildUsr(guildId,usrId)
	const ff14Id = e?.ff14Id
	console.log('DeleteDiscordPseudo: (guildId,usrId,ff14Id)',guildId,usrId,ff14Id)
	if (ff14Id) {
		// supprime le FF4Id
		delete discordPseudos[guildId][ff14Id]
		collections.save(discordPseudos);
	}
	// supprime le pseudo du site si besoin
	if (runCtx.linkSite) {
		const delSite = pseudos.deletePseudoByFf14Id(ff14Id)
	}
	/*
	await discordPostPrive(usrId,
		"Coucou!\nJ'ai noté que tu as quitté le discord **" + runCtx.discordName + "**" +
		"\nSi tu souhaites te reinscrire, suis la procédure sur le canal de bienvenue"
	);
	*/
}

////////////////////////////////////////////
// recupere la description d'une guild (mise en cache mémoire)
////////////////////////////////////////////
let guilds = {}
async function discordGetGuildDesc(guildId) {
	if (!guilds[guildId]) {
		const discordUrl=discordUrlPrefix+"/guilds/"+guildId
		let ret = await gbl.apiCall(discordUrl,'GET',null,discordHeaders);
		if (ret.status != 200) { console.log("DiscordGetGuild ERROR url:",discordUrl,"ret:",ret); return null; }
		guilds[guildId] = ret;
	}
	return guilds[guildId];
}
////////////////////////////////////////////
// postMessage sur un channel nommé de discord (test si le chan est un autorisé)
////////////////////////////////////////////
async function discordPostMessage(runCtx,chan,texte,everyone,type) {
	let channelId = runCtx[chan+"ChanId"];
	if (!channelId ) gbl.exception("discord bad chan",400);
	const discordUrl=discordUrlPrefix+"/channels/"+channelId+"/messages"
	let	postBody = { content:	((everyone)? ".@everyone\n" : ".\n" ) +texte, tts: false }
	switch (type) {
		case "tts": postBody.tts = true
			break;
		case "noTrailer":
			break;
		default: postBody.content += runCtx.discordTrailer
			break;
	}
	console.log("discordPostMessage:",discordUrl,'POST','body:',postBody);
	let ret = await gbl.apiCall(discordUrl,'POST',postBody,discordHeaders);
	// console.log("discordPostMessage ret=:",ret);
	return ret.id;
}
// fonction exportée
async function exportDiscordPostMessage(chan,texte,everyone,type) {
	try {
		await discordPostMessage(getRunCtx(null),chan,texte,everyone,type)
	}
	catch(e) {
		console.error("exportDiscordPostMessage Exception:",e)
	}
}
////////////////////////////////////////////
// postMessage privé
// retourne { msgId: , chanId: } du message posté (ou null si erreur)
////////////////////////////////////////////
async function discordPostPrive(usrId,texte) {
	let discordUrl, postBody, ret
	discordUrl=discordUrlPrefix+"/users/@me/channels"
	postBody = { recipient_id: usrId }
	ret = await gbl.apiCall(discordUrl,'POST',postBody,discordHeaders);
	console.log("Creation DM avec usrId:",usrId," ret=", ret.status, ret.id)
	if (ret.status != 200) return console.log("***** discordPostPrive, get DM chann ERROR ret=:",ret), null
	const chanId = ret.id;
	//
	discordUrl=discordUrlPrefix+"/channels/"+chanId+"/messages"
	postBody = { content:	".\n" + texte + genericDiscordTrailer, tts: false }
	// console.log("discordPostPrive chanId:",chanId,"texte:",postBody);
	ret = await gbl.apiCall(discordUrl,'POST',postBody,discordHeaders);
	if (ret.status != 200) console.log("discordPostPrive ERROR ret=:",ret);
	// retourn le msgId publié
	return { msgId: ret.id, chanId: chanId }
}
////////////////////////////////////////////
// Post un message prive selon un pseudo
////////////////////////////////////////////
async function discordMpPseudo(pseudo,texte) {
	const runCtx = getRunCtx(null)
	const guildId = runCtx.guildId
	const pseudoDesc = pseudos.get(pseudo)
	const ff14Id = pseudoDesc.ff14Id
	const discordUsr = getDiscordPseudoByGuidFf14(guildId,ff14Id)
	if (!discordUsr) return console.log('*** Erreur discordUsr not found (pseudo,guildId,ff14Id)',pseudo,guildId,ff14Id)
	discordPostPrive(discordUsr.usrId,texte)
}
////////////////////////////////////////////
// Post un message prive direct Kikiadoc
////////////////////////////////////////////
async function discordMpKiki(texte) {
	return await discordPostPrive(idKikiadoc,texte);
}
////////////////////////////////////////////
// update un message de la GP existant
////////////////////////////////////////////
async function discordUpdateMessage(runCtx,chanId,msgId,texte, components, noSignature) {
	const discordUrl=discordUrlPrefix+"/channels/"+chanId+"/messages/"+msgId
	const postBody = { content:	"\n" + texte + ( (noSignature)? "" : runCtx.discordTrailer), components: components }
	// console.log("PATCH:",discordUrl,postBody);
	let ret = await gbl.apiCall(discordUrl,'PATCH',postBody,discordHeaders);
	if (ret.status != 200) console.log("discordUpdateMessage ERROR url:",discordUrl,"ret:",ret);
	return ret.id
}
////////////////////////////////////////////
// delete un message (204=succes)
////////////////////////////////////////////
async function discordDeleteMessage(chanId,msgId) {
	// /channels/{channel.id}/messages/{message.id}
	const discordUrl=discordUrlPrefix+"/channels/"+chanId+"/messages/"+msgId
	// usage de apiCallExtern car pas de json résultat.
	let ret = await gbl.apiCallExtern(discordUrl,'DELETE',null,discordHeaders);
	if (ret.status != 204) console.log("discordDeleteMessage ERROR url:",discordUrl,"ret:",ret);
	return ret;
}
////////////////////////////////////////////
// ajoute un role à un usrid (204 = succes)
////////////////////////////////////////////
async function addRole(runCtx,usrId,roleId) {
	// PUT /guilds/{guild.id}/members/{user.id}/roles/{role.id}
	const guildId = runCtx.guildId
	const discordUrl=discordUrlPrefix+"/guilds/"+guildId+"/members/"+usrId+"/roles/"+roleId
	console.log("Discord : addRole", discordUrl);
	// usage de apiCallExtern car pas de json résultat.
	let ret = await gbl.apiCallExtern(discordUrl,'PUT',null,discordHeaders);
	if (ret.status != 204) console.log("discordAddRole ERROR url:",discordUrl,"ret:",ret);
	return ret
}
////////////////////////////////////////////
// retire un role à un usrid (204 = succes)
////////////////////////////////////////////
async function removeRole(runCtx,usrId,roleId) {
	// DELETE /guilds/{guild.id}/members/{user.id}/roles/{role.id}
	const guildId = runCtx.guilId
	const discordUrl=discordUrlPrefix+"/guilds/"+guidId+"/members/"+usrId+"/roles/"+roleId
	console.log("Discord : removeRole", discordUrl);
	// usage de apiCallExtern car pas de json résultat.
	let ret = await gbl.apiCallExtern(discordUrl,'DELETE',null,discordHeaders);
	if (ret.status != 204) console.log("discordRemoveRole ERROR url:",discordUrl,"ret:",ret);
	return ret
}
////////////////////////////////////////////
// update discord apres inscription sur le site
// return true/false
////////////////////////////////////////////
async function newSiteUser(pseudo) {
	const runCtx = getRunCtx(null)
	const desc = getDiscordByPseudo(pseudo)
	if (!desc) return false
	await addRole(runCtx,desc.usrId,runCtx.roleId)
	await discordPostPrive(desc.usrId,
		"### C'est cool, tu as terminé ton inscription"+
		"\n## Profite du challenge de bienvenue sur le site, tu pourras gagner jusque 2.5 Millions de Gils en regardant des vidéos"+
		"\nTu as maintenant accès au Discord "+runCtx.discordName+", clique sur <#"+runCtx.infoChanId+">")
}


////////////////////////////////////////////
////////////////////////////////////////////
// Gestion du WS DISCORD
////////////////////////////////////////////
////////////////////////////////////////////

let connectionInfo = {} // info de connexion vers discord
let wsc = null // websocket vers discord
let wsCallback = null // callback a appeler si besoin
let timerId = null // timer de hello du ws
let connTimerId = null // timer de reconnexion du ws


// Rechargement du contexte
let ctx = collections.get('discordWsStatus',true);
ctx.gatewayUrl ||= null // depuis READY
ctx.sessionId ||= null // depuis READY
ctx.discordSeq ||= null // derniere sequence depuis discord
ctx.canResume ||= false // selon le close
ctx.lastClose ||= false // RC du dernier close WS
ctx.lastConnexionType ||= 0 // 0: non défini, 1: resume, 2: new connexion
ctx.lastConnexionDth = 0 // dth de derniere connexion (toujours 0 au redemarrge serveur)

// envoi d'un message sur le WS discord
function discordSend(o) {
	let jsonMsg = JSON.stringify(o);
	// console.log("Discord send:",o);
	wsc.send(jsonMsg);
}

// send connexion identity
function discordIdentity() {
	const id = { op:2, d:
				 {	token: vault.get('discord_token') , intents: 0b001011011000000010, 
					 	properties: { os: "aws-linux", browser: "none", device:"bot@ff14.adhoc.click"}
				 }
	}
	console.log("Discord: Identity envoyee");
	discordSend(id);
}

// Discord timer sur le WS
function discordTimer() {
	// console.log("**Timer Discord");
	discordSend({ op: 1, d: ctx.discordSeq }); // ping/pong
}

////////////////////////////////////////////
// Gestion des messages de discord
////////////////////////////////////////////

////////////////////////////////////////////
// Message privé Je suis... Demande de maj du pseudo FF14
////////////////////////////////////////////
async function discordProcessSetupPseudo(usrId,tblMots) {
	// recupere la demande de pseudo en cours
	let reqId = getTransaction(usrId,"reqIdentificationMessage")
	// si pas de requete en cours
	if (!reqId || !reqId.msgId || !reqId.guildId) {
		await discordPostPrive(usrId,"Je ne t'ai pas demandé ton pseudo FF14! ");
		return;	
	}
	// recupere le contexte
	const runCtx = getRunCtx(reqId.guildId)

	// verif des parametres
	if (tblMots.length < 4) { discordPostPrive(usrId,"Tu n'as pas indiqué ton prenom nom et monde, recommence"); return; }
	if (tblMots[1].length > 20 || tblMots[2].length > 20 || tblMots[3].length > 20 ) {
		await discordPostPrive(usrId,"Ton prénom, nom et monde ne sont pas valides, recommence");
		return;
	}
	let prenom = gbl.capitalizeFirstLetter(tblMots[1]);
	let nom = gbl.capitalizeFirstLetter(tblMots[2]);
	let monde = gbl.capitalizeFirstLetter(tblMots[3]);
	if (prenom=="Kikiadoc" && nom=="Lepetiot" && tblMots[4]!="admin") {
				await discordPostPrive(usrId,"Non, tu n'es pas "+prenom+" "+nom+", je le connais bien, c'est mon Grand Patron!");
				return;
	}
	// poste le message d'attente
	let msgDesc = await discordPostPrive(usrId,"**Patiente un peu**,\nJe vérifie ton pseudo FF14 sur le lodestone et si tu es déjà connu de la Grande Peluche");
	if (!msgDesc) return console.error("Erreur discordPostPrive dans discordProcessSetupPseudo") , null
	// msgDesc: { msgId: ret.id, chanId: chanId }
	// recup depuis le lodestone
	let ff14Id = await lodestone.getFF14Id(prenom,nom,monde);
	if (!ff14Id) {
		await discordUpdateMessage(runCtx,msgDesc.chanId,msgDesc.msgId,
			"Je n'ai pas trouvé ton pseudo FF14 sur le lodestone.\n"+
			"J'ai cherché "+prenom+" "+nom+" sur le monde "+monde+", alors "+
			"peut-être l'as tu mal orthographié, vérifie bien que c'est ton exact pseudo sur FF14 (en particulier si tu as une apostrophe dans ton pseudo) et "+
			"redis-moi qui tu es par un message\n**je suis __prenom__ __nom__ __monde__**	");
		return
	}

	// verif que le FF14ID n'est pas déjà utilisé
	let exist = getDiscordPseudoByGuidFf14(reqId.guildId,ff14Id)
	if (exist) {
		// le FF14ID existe dans le discord
		await discordUpdateMessage(runCtx,msgDesc.chanId,msgDesc.msgId,
			"**__Ton pseudo FF14 (idFF14:"+ff14Id+") est déjà associé"+
			" à un Aventurier sur ce discord__**.\n"+
			"Je ne peux donc te l'attribuer ni te donner accès au reste de ce discord.\n"+
			"C'est une anomalie importante, la cause la plus grave étant que quelqu'un d'autre a déjà utilisé ton compte FF14.\n"+
			"Aussi, **__il FAUT que tu contactes__** "+mpKikiadoc );
		return
	}

	// le FF14ID n'est pas utilisé coté discord
	// on peut donc mettre à jour le discord concerné
	// PATCH /guilds/{guild.id}/members/{user.id} {nick: xxx, roles:[idrole]}
	// le nick ne doit pas dépasser 32 caractères
	let nick = prenom+" "+nom+" @"+monde 
	if (nick.length > 32) nick = nick.substring(0,30) + ".."
	const discordUrl=discordUrlPrefix+"/guilds/"+reqId.guildId+"/members/"+usrId
	// avant webauthn const discordBody= { nick: nick , roles: [runCtx.roleId] }
	const discordBody= { nick: nick , roles: [] } // modif du pseudo et raz de permissions
	console.log("PATCH:",discordUrl,"body:",discordBody);
	let ret = await gbl.apiCall(discordUrl,'PATCH',discordBody,discordHeaders);
	if (ret.status != 200) {
		console.log("***** Erreur discord:",ret);
		await discordPostPrive(usrId,"J'ai un soucis technique avec Discord pour honorer ta requête ("+ret.status+"/"+ret.code+"), refais ta tentative et si cela se reproduit, MP "+mpKikiadoc)
		if (tblMots[5]!="skip") return;
	}

	// efface le requete en cours
	setTransaction(usrId,"reqIdentificationMessage",null)
	
	// Sauvegarde l'association
	setDiscordPseudo(reqId.guildId,usrId,ff14Id,prenom,nom,monde)

	// Message de confirmation que tout est OK
	await discordUpdateMessage(runCtx,msgDesc.chanId,msgDesc.msgId,
		"J'ai eu confirmation du Lodestone de FF14 de l'existance de ton perso (FF14ID="+ff14Id+").\n"+
		"Je t'ai attribué le pseudo **"+nick+"** sur le discord **"+reqId.guildDesc.name+"**, mais sans aucun accès\n"+
		((runCtx.linkSite)? "## Tu dois maintenant t'inscrire sur le site de la Grande Peluche <https://ff14.adhoc.click/enjoy>\n":"")
	)
}


////////////////////////////////////////////
// generique, gestion d'un message privé
////////////////////////////////////////////
async function discordProcessMessagePrive(msg) {
	// si pas de contexte transactionnel, on ignore (cas du message broadcast recu en prod et en test)
	if (!isTransactionActive(msg.d.author.id)) {
		if (gbl.isProd()) discordPostPrive(msg.d.author.id,"Je n'ai pas de conversation en cours avec toi.")
		return console.log('Discord MP: Pas de transaction active, ignore pour usrId=',msg.d.author.id)
	}	
	// parse le message (msg.d.content)
	let tblMots = msg.d.content.trim().toLowerCase().split(/\s+/);

	// cas particulier "je suis" --> "suis"
	if (tblMots[0]=="je" && tblMots[1]=="suis") tblMots = tblMots.slice(1);

	// Analyse du message recu dans le cadre d'une transaction
	switch(tblMots[0]) {
		case "suis": // indication du pseudo du joueur
		case "jesuis": // indication du pseudo du joueur
				discordProcessSetupPseudo(msg.d.author.id,tblMots)
				return;
			break;
	}
	let msgTruncated = (msg.d.content)? msg.d.content.substring(0,10) : "rien";
	await discordPostPrive(msg.d.author.id,"je n'ai pas compris ce que tu m'as dit ("+msgTruncated+"...)");
}
////////////////////////////////////////////
// generique, gestion d'un message public
////////////////////////////////////////////
async function discordProcessMessagePublic(msg) {
	// console.log("Discord MessagePublic non traité id:", msg.d.id, " chan:",msg.d.channel_id);
}
////////////////////////////////////////////
// generique, gestion d'un message d'accueil
////////////////////////////////////////////
async function discordProcessMessageBienvenue(msg) {
	// console.log("Discord MessageBienvenue non traitée");
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gestion d'un ajout de message
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordProcessMessageCreate(msg) {
	// msg.d.id est l'id du message
	// msg.d.author.id est l'id de l'auteur
	// msg.d.author.username semble etre le nom par defaut
	// msg.d.author.global_name semble etre le nom attribué sur ce serveur discord
	// msg.d.guild_id est l'id du serveur discord concerné
	// msg.d.channel_id est l'id du channel du message
	// msg.d.mentions est un array d'objets des @usr mentionné

	// si callback de message de la GP, on ignore
	if (isGrandePeluche(msg.d.author.id)) return;

	switch(msg.d.type) {
		case 0: // message standard (privé ou pas)
			if (msg.d.guild_id)
				discordProcessMessagePublic(msg);
			else
				discordProcessMessagePrive(msg);
			return;
		case 7: // message de bienvenue sur l'ajout d'un utilisateur
			discordProcessMessageBienvenue(msg);
			return;
	}
	// console.log("Discord MessageCreate non traitée",msg.d.id);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gestion d'un update de message
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordProcessMessageUpdate(msg) {
	// console.log("Discord MessageUpdate non traitée",msg.d.id);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gestion d'un reaction sur un message
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordProcessMessageReactionAdd(msg) {
	// msg.d.user_id: id de l'auteur de la réaction
	// msg.d.message_id: id du message
	// msg.d.message_author_id: id de l'auteur du message
	// msg.d.channel_id: id channel
	// msg.d.guild_id: id du serveur
	const runCtx = getRunCtx(msg.d.guild_id)
	switch (msg.d.message_id) {
			// Ajout réaction sur un message de verif et promotion
			case runCtx.introductionMsgId : 
				const guildDesc = await discordGetGuildDesc(msg.d.guild_id);
				// stocke le contexte transactionnel
				setTransaction(msg.d.user_id,"reqIdentificationMessage", { msgId: msg.d.message_id, guildId: msg.d.guild_id, guildDesc: guildDesc } )
				// blabla
				await discordPostPrive(msg.d.user_id,
						"## Lis attentivement\nCoucou!\nIndique moi ton pseudo COMPLET dans FF14 par un message dans ce canal de MP entre nous deux " +
						"sous la forme **je suis *prénom* *nom* *monde* ** (exemple: je suis Kikiadoc Lepetiot Moogle, n'oublie pas le '__je suis__') " +  
						"afin que je t'autorise l'accès au discord **" + guildDesc.name +"**"
				);
				return;
	}
	// console.log("Discord ReactionAdd non traitée:",msg);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gestion d'un delete reaction sur un message
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordProcessMessageReactionDelete(msg) {
	// msg.d.user_id: id de l'auteur de la réaction
	// msg.d.message_id: id du message
	// msg.d.channel_id: id channel
	// msg.d.guild_id: id du serveur
	const runCtx = getRunCtx(msg.d.guild_id)
	switch (msg.d.message_id) {
			// Retrait réaction sur un message de verif et promotion
			case runCtx.introductionMsgId : 
				// PATCH /guilds/{guild.id}/members/{user.id} {nick: xxx, roles:[idrole]}
				/*
				const discordUrl=discordUrlPrefix+"/guilds/"+msg.d.guild_id+"/members/"+msg.d.user_id
				const discordBody= { nick: "RefusConditions@"+Date.now(), roles: [] }
				console.log("PATCH:",discordUrl,"body:",discordBody);
				let ret = await gbl.apiCall(discordUrl,'PATCH',discordBody,discordHeaders);
				if (ret.status != 200) console.log("***** Erreur discord:",ret);
				*/
				await deleteDiscordPseudo(msg.d.guild_id,msg.d.user_id)
				await kick(msg.d.guild_id,msg.d.user_id)
				return;
	}
	// console.log("Discord ReactionDelete non traitée",msg);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// gestion arrive d'un user sur discord
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordMemberAdd(msg) {
	const runCtx = getRunCtx(msg.d.guild_id)
	addRole(runCtx,msg.d.user.id,runCtx.bienvenueRoleId)
	console.log("discordMemberAdd",msg.d.user.id,msg.d.user.global_name)

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Reception d'une notification discord
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordDispatch(msg) {
	try {
		console.log("Discord Dispatch: ",msg.t);
		switch(msg.t) {
			case "READY": // Confirmation de connexion
				ctx.gatewayUrl = msg.d.resume_gateway_url
				ctx.sessionId = msg.d.session_id
				ctx.canResume = true;
				collections.save(ctx);
				break;
			case "MESSAGE_CREATE": // Message recu
				await discordProcessMessageCreate(msg);
				break;
			case "MESSAGE_UPDATE": // Message updat
				await discordProcessMessageUpdate(msg);
				break;
			case "MESSAGE_REACTION_ADD": // Ajout d'une réaction
				await discordProcessMessageReactionAdd(msg);
				break;
			case "MESSAGE_REACTION_REMOVE": // delete d'une réaction
				await discordProcessMessageReactionDelete(msg);
				break;
			case "GUILD_MEMBER_REMOVE": // user quitte le discord
				await deleteDiscordPseudo(msg.d.guild_id,msg.d.user.id)
				break;
			case "GUILD_MEMBER_ADD": // Nouvel usere discord
				await discordMemberAdd(msg)
				break;
			default: // notif non traitées
				console.log("Discord notif non traitée:");
		}
	}
	catch (e) {
		console.log("discordDispatch exception:",e);
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// recepetion d'un message depuis discord
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function discordMsg(m) {
	let msg = JSON.parse(m);
	// si il y a une sequnce dans le message, note cette sequence
	if (msg.s) { ctx.discordSeq = msg.s; collections.save(ctx); }
	// selon l'operation
	switch(msg.op) {
		case 0: // Dispatch message
			discordDispatch(msg);
			break;
		case 7: // reconnect please !
			console.log("Discord: reconnect please");
			ctx.canResume = true;
			if (wsc) wsc.close(1000);
			break;
		case 10: //hello message
			console.log("Discord: hello");
			let timerDelai = msg.d.heartbeat_interval * 0.9
			if (timerId) clearInterval(timerId);
			timerId = setInterval(discordTimer,timerDelai);
			discordIdentity();
			break;
		case 11: //heartbeat ACK
			// console.log("discord heartbeat");
			break;
		default: // autre info
			console.log("Discord msg:",msg);
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// reception d'un close du websocket discord
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function discordClose(e) {
	console.log("close DISCORD:",e)
	if (timerId) clearInterval(timerId);
	timerId = null;
	ctx.lastClose=e;
	if (e >= 1000 && e<4000) {
		ctx.canResume = true;
	}
	else {
		switch (e) {
			case 4000: 
			case 4001: 
			case 4002: 
			case 4003: 
			case 4006: 
			case 4007: 
			case 4008: 
			case 4009: 
				ctx.canResume = true;
				break;
			default:
				ctx.canResume = false;
				break;
		}
	}

	// init le timer de reco à 1 secondes
	clearTimeout(connTimerId)
	connTimerId = setTimeout(discordConnexion,1000);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// reception error du websocket discord
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function discordError(e) {
	console.log("error DISCORD:",e)
	if (wsc) wsc.close(1000);
	wsc=null;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// reception ack de l'open du websocket discord
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function discordOpen(e) {
	console.log("open DISCORD:",e)
	if (ctx.lastConnexionType == 1) {
		// C'est un resume, on envoie la demande de resume
		const gwResumeEvent = { op: 6, session_id: ctx.sessionId , d: { seq: ctx.discordSeq } };
		console.log("DiscordResume:",gwResumeEvent);
		discordSend(gwResumeEvent);
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// initialise la connexion
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordConnexion() {
	console.log("***Discord discordConnexion***");
	// fermeture du precédent si existant
	if (wsc) wsc.close(1000);
	wsc = null;
	// cancel timer si besoin
	if (connTimerId) clearTimeout(connTimerId)
	connTimerId = null;

	let ret = await gbl.apiCall('https://discord.com/api/gateway');
	if (ret.status != 200) { console.log("*** Erreur sur /gateway discord ***",ret); return; }
	connectionInfo = ret;
	console.log("***Discord URL:",connectionInfo);
	console.log("***ctx.gatewayUrl:",ctx.gatewayUrl);
	console.log("***ctx.sessionId:",ctx.sessionId);
	console.log("***ctx.canResume:",ctx.canResume);
	console.log("***ctx.lastClose:",ctx.lastClose);
	
	// pas de tentative de reco avant 10 secondes
	if (ctx.lastConnexionDth+10000 >= Date.now() ) {
		console.log("***DiscordConnexion dans 10 secondes");
		connTimerId=setTimeout(discordConnexion,10000);
		return;
	}

	if (ctx.canResume) {
		ctx.canResume = false;
		ctx.lastConnexionType = 1;
		ctx.lastConnexionDth = Date.now();
		collections.save(ctx);
		console.log("***DiscordResume");
  	wsc = new WebSocket(ctx.gatewayUrl+'?v=10&encoding=json');
	}
	else {
		ctx.canResume = false;
		ctx.lastConnexionType = 2;
		ctx.lastConnexionDth = Date.now();
		collections.save(ctx);
		console.log("***DiscordConnexion");
  	wsc = new WebSocket(connectionInfo.url+'?v=10&encoding=json');
	}

	if (wsc) {
  	wsc.on("error",discordError)
  	wsc.on("close",discordClose)
  	wsc.on('open', discordOpen)
  	wsc.on('message', discordMsg)
  	wsc.on('ping', (ws) => { console.log("*** DISCORD WS ping ***") } );
  	wsc.on('pong', (ws) => { console.log("*** DISCORD WS pong ***") } );
  	console.log("Websocket discord started:");
	}

};

////////////////////////////////////////////
////////////////////////////////////////////
// Gestion des actions en attente vers discord
////////////////////////////////////////////
////////////////////////////////////////////

// Liste des ations en attente
let discordActions = collections.get('discordActions',true);
discordActions.waiting ||= []; // liste des actions à réaliser (op, id, dth, txt, channel, all)
discordActions.nextId ||= 0; // id a indiquer pour identifier une action

let postTimerId = null // timer du futur post si existant

// recupere une action selon son id, retourne l'index ou -1 si pas trouvé
function discordActionsGetById(id) {
	return discordActions.waiting.findIndex( (e) => e.id == id )
}

// Gestion des actions discord en attente
async function discordActionsProcessQueue() {
	console.log("***DiscordProcessQueue");
	const runCtx = getRunCtx(null)
	if (postTimerId) clearTimeout(postTimerId);
	if (discordActions.waiting.length <=0) return; // plus rien à faire
	// tri des resquetes
	discordActions.waiting.sort((a,b) => { return (a.dth < b.dth)? -1 : (a.dth > b.dth)? 1 : 0 } );
	// tant que dth dépassée, on fait le process discord
	let tNow = Date.now();
	while (discordActions.waiting.length >0 && discordActions.waiting[0].dth <= tNow) {
		// recupere le first
		let first = discordActions.waiting.shift();
		// DO POST DISCORD
		try {
			switch (first.o.op) {
				case "msg":
						await discordPostMessage(runCtx,first.o.chan,first.o.txt,first.o.all)
						break;
				default:
					console.log("*** DiscordProcessQueue: bad op",first);
			}
		}
		catch (e) {
			console.log("*** DiscordProcessQueue: Exception",e);
		}
	}
	// sync la queue
	collections.save(discordActions);
	// et on se positionne pour le suivant si il existe
	if (discordActions.waiting.length <=0) return; // plus rien à faire
	// setup timer pour le post suivant
	let t = discordActions.waiting[0].dth
	let d = t - tNow
	if (d > 300000) d = 300000
	console.log("*** DiscordProcessQueue nexttimer:",d, "@targetDth", gbl.jjmmhhmmss(t));
	postTimerId = setTimeout(discordActionsProcessQueue, d)
}

// Ajoute une action à réaliser
function discordActionsAdd(dth, o) {
	discordActions.waiting.push( { id: discordActions.nextId++, dth: dth, o: o } );
	discordActionsProcessQueue();
}
// maj une action
function discordActionsUpdate(id, dth, o) {
	let idx = discordActionsGetById(id);
	if (idx < 0) gbl.exception("id not found:"+id, 400);
	if (dth) discordActions.waiting[idx].dth =dth
	if (o) discordActions.waiting[idx].o =o
	discordActionsProcessQueue();
}
// supprime une action
function discordActionsDelete(id) {
	let idx = discordActionsGetById(id);
	if (idx < 0) gbl.exception("id not found:"+id, 400);
	discordActions.waiting.splice(idx,1)
	discordActionsProcessQueue();
}

////////////////////////////////////////////
////////////////////////////////////////////
// Ménage périodique du discord
////////////////////////////////////////////
////////////////////////////////////////////
async function kick(guildId,userId) {
	// DELETE /guilds/{guild.id}/members/{user.id}
  console.log("Discord: KICK", guildId, userId)
  const discordUrl=discordUrlPrefix+"/guilds/"+guildId+"/members/"+userId
  const ret = await gbl.apiCallExtern(discordUrl,'DELETE',null,discordHeaders)
  if (ret.status != 204)
    console.log("discord menageNicks KICK ERROR",ret)
  else
    console.log("discord menageNicks KICK OK",ret)
	return ret.status
}


async function menageNicks(guildId) {
	// recupere la liste des membres
	// /guilds/{guild.id}/members
	console.log("Discord: Menage nicks démarré",guildId)
	const discordUrl=discordUrlPrefix+"/guilds/"+guildId+"/members?limit=999"
	const ret = await gbl.apiCall(discordUrl,'GET',null,discordHeaders);
	if (ret.status != 200) { console.log("discord menageNicks ERROR ret=",ret); return null }
	const now = Date.now()
	ret.forEach( async (e) => {
		const dth = new Date(e.joined_at).getTime()
		if ( !e.roles.length && (now-dth > DISCORDKICK) ) {
			const nom = e.user.global_name || e.user.username
			console.log("Discord: nick KO",nom,e.user.id,e.joined_at)
			await kick(guildId,e.user.id)
		}
		else
			console.log("Discord: nick OK",e.nick || e.user.global_name || e.user.username,e.user.id,e.joined_at)
	})
	console.log("Discord: Menage nick terminé",guildId)
	return "ok"
}

////////////////////////////////////////////
////////////////////////////////////////////
// Glocal & exports
////////////////////////////////////////////
////////////////////////////////////////////
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	const runCtx = getRunCtx(null)
	switch (method) {
		case "OPTIONS":
			pseudos.check(pseudo,pwd); // check pseudo
			res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE');
			gbl.exception("AllowedCORS",200);
		case 'GET':
			pseudos.check(pseudo,pwd,true); // req admin
			switch(reqPaths[2]) {
				case "admClose":
					if (wsc) wsc.close(1000);
					wsc = null
					gbl.exception("ok closed",200);
				case "admActions":
					gbl.exception(discordActions,200);
				case "admGetByFf14Id":
					const guildId = runCtx.guildId
					gbl.exception(getDiscordPseudoByGuidFf14(guildId,parseInt(reqPaths[3],10)) || { ff14Id: parseInt(reqPaths[3],10), msg:"pas d'info discord" },200);
				case "admGetRaw":
					gbl.exception(discordPseudos,200);
			}
			gbl.exception("bad op",400);
		case 'PUT':
			pseudos.check(pseudo,pwd); // check pseudo
			switch(reqPaths[2]) {
				case "reqGrant":
					// demande d'un grant discord par le pseudo actuel depuis le site
					// reqGrant/nomRole
					const guildId = runCtx.guildId
					const pseudoDesc = pseudos.get(pseudo)
					const discordUser = getDiscordPseudoByGuidFf14(guildId,pseudoDesc.ff14Id)
					if (!pseudoDesc || !discordUser) gbl.exception("bad pseudoDesc/discordUser",400);
					const discordUsrId = discordUser.usrId
					const discordRoleId = runCtx[reqPaths[3]+"RoleId"]
					const discordChanId = runCtx[reqPaths[3]+"ChanId"]
					if (!discordRoleId || !discordChanId) gbl.exception("bad role",400);
					let ret = await addRole(runCtx,discordUsrId,discordRoleId) 
					console.log(ret)
					if (ret.status!=204) gbl.exception('Err addRol/discord',400)
					await discordPostPrive(discordUsrId,
							"Bravo <@"+discordUsrId+">\nTu peux maintenant voir les messages dans <#"+discordChanId+">")
					gbl.exception('ok',200)
			}
			gbl.exception("bad op",400);
		case 'POST':
			pseudos.check(pseudo,pwd); // check pseudo
			switch(reqPaths[2]) {
				case "admActions":
					pseudos.check(pseudo,pwd,true); // req admin
					let o = JSON.parse(body);
					// verif du channel
					if (! runCtx[o.chan+"ChanId"] ) gbl.exception("discord bad chan",400);
					// Post sur le canal de test pour vérification
					await discordPostMessage(runCtx,"test",o.txt,o.all);
					if (o.id==0)
						discordActionsAdd(o.dth,o);
					else
						discordActionsUpdate(o.id,o.dth,o);
					gbl.exception(discordActions,200);
			}
			gbl.exception("bad op/post",400);
		case 'DELETE':
			switch(reqPaths[2]) {
				case "admActions":
					pseudos.check(pseudo,pwd,true) // req admin 
					discordActionsDelete(parseInt(reqPaths[3],10));
					gbl.exception(discordActions,200);
				case "ff14Id":
					pseudos.check(pseudo,pwd,true) // req admin 
					const guildId = runCtx.guildId
					const e = getDiscordPseudoByGuidFf14(guildId,parseInt(reqPaths[3],10)) 
					deleteDiscordPseudo(e.guildId,e.usrId) 
					gbl.exception(e,200);
				case "menageNicks":
					if (pseudo || pwd) gbl.exception( "Not local admin" ,400)
					await menageNicks(runCtx.guildId)
					gbl.exception("ok",200)
			}
			gbl.exception("bad op/delete",400);
	}
	gbl.exception("bad op",400);
}


exports.headers = discordHeaders
exports.mpKiki = discordMpKiki
exports.mpPseudo = discordMpPseudo
exports.postMessage = exportDiscordPostMessage;
exports.getDiscordByFf14Id = getDiscordByFf14Id
exports.getDiscordByPseudo = getDiscordByPseudo
exports.escapeText = escapeText
exports.newSiteUser = newSiteUser
exports.urlPrefix=discordUrlPrefix

exports.start = async (callback) => {
	wsCallback = callback
	discordConnexion();
	discordActionsProcessQueue();
}


console.log('discord loaded');


