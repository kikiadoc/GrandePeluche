
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const lodestone = require('../infraback/lodestone.js');
const vault = require('../infraback/vault.js');
const download = require('../infraback/download.js');
const WebSocket = require('ws');


const discordUrlPrefix="https://discord.com/api/v10"
const discordHeaders = {
			"User-Agent": "DiscordBot (https://ff14.adhoc.click], 1.0.1)",
			"Content-Type": "application/json; charset=UTF-8",
			"Authorization": 'Bot ' + vault.get('discord_token') 
};
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
	introductionMsgId : '1193712182010060860',	// message d'intoduction
	roleId: '1193328520416477294', // role aventurier
	testChanId:	"1039491017017143356",	// KIKIPROD
	annoncesChanId:	"1151925290570874951",	// Kiki's event, canal public annonces
	discussionChanId:	"1143946654270111785",  // discussion
	checksecChanId:	"1280101334586097795",  // checksec
	welcomeId: '991283998389174272', // kiki's event welcome chan
	hegemonieChanId: '1279762365075951646', // channel de l'hegemonie de prod
	hegemonieRoleId: '1279762907701186624', // roleId de l'hegemonie de prod
	metropolisChanId: '1347534666453745725', // channel de métropolis de prod
	expansionChanId: '1384125294717435916', 
	expansionRoleId: '1384125351604649984',
	discordTrailer: "\n-\nSigné: *Hildiscord, assistant Discord de la Grande Peluche et porte parole de Kikiadoc*" + 
									"\nGrande Peluche: <https://ff14.adhoc.click/enjoy>"+
									"\nDiscussion: <#1143946654270111785>"+
									"\nSoucis? MP "+mpKikiadoc
}
const gpStaging={
	guildId: '573082763641618432', // discord kiki's perso
	linkSite: true, // discord lié au site
	discordName: "Kiki's Perso",
	introductionMsgId : '1278263907156492409', // '1193157704714289222',
	roleId: '1193326340250808330', // role aventurier
	testChanId:	"1039491017017143356",	// KIKITEST
	annoncesChanId:	"1279857314261766214",	// KIKITEST
	discussionChanId:	"1279859331386314793",  // discussion
	checksecChanId:	"1280101334586097795",  // checksec
	welcomeId: '1071753391262416957', // '573082763641618434', // kiki's perso welcome chan
	hegemonieChanId: '1279764642234761258', // channel de l'hegemonie de test
	hegemonieRoleId: '1279764689936449620', // roleId de l'hegemonie de test
	metropolisChanId: '1347535273281458216', // channel de métropolis de test
	expansionChanId: '1384128315056722001', 
	expansionRoleId: '1384128358039683132',
	discordTrailer: "\n-\nSigné: *(STAGING) Hildiscord, assistant Discord de la Grande Peluche et porte parole de Kikiadoc*" + 
									"\nGrande Peluche: <https://ff14.adhoc.click/enjoy>"+
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
	if (!ff14Id) return null
	// supprime le FF4Id
	delete discordPseudos[guildId][ff14Id]
	collections.save(discordPseudos);
	// supprime le pseudo du site si besoin
	if (runCtx.linkSite) {
		const delSite = pseudos.deletePseudoByFf14Id(ff14Id)
	}
	await discordPostPrive(usrId,
		"Coucou!\nJ'ai noté que tu as quitté le discord **" + runCtx.discordName + "**" +
		"\nSi tu souhaites te reinscrire, suis la procédure sur le canal de bienvenue"
	);
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
async function discordPostMessage(runCtx,chan,texte,everyone,ttsReq) {
	let channelId = runCtx[chan+"ChanId"];
	if (!channelId ) gbl.exception("discord bad chan",400);
	const discordUrl=discordUrlPrefix+"/channels/"+channelId+"/messages"
	const postBody = (ttsReq)?
		{ content:	texte, tts: true }
		:
		{ content:	((everyone)? ".@everyone\n" : ".\n" ) + texte + runCtx.discordTrailer, tts: false }
	console.log("discordPostMessage:",discordUrl,'POST','body:',postBody,'headers:',discordHeaders);
	let ret = await gbl.apiCall(discordUrl,'POST',postBody,discordHeaders);
	// console.log("discordPostMessage ret=:",ret);
	return ret.id;
}
// fonction exportée
async function exportDiscordPostMessage(chan,texte,everyone,ttsReq) {
	try {
		discordPostMessage(getRunCtx(null),chan,texte,everyone,ttsReq)
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
	// usage de apiCallExtern car pas de json résultat.
	let ret = await gbl.apiCallExtern(discordUrl,'DELETE',null,discordHeaders);
	if (ret.status != 204) console.log("discordRemoveRole ERROR url:",discordUrl,"ret:",ret);
	return ret
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
	const discordBody= { nick: nick , roles: [runCtx.roleId] }
	console.log("PATCH:",discordUrl,"body:",discordBody);
	let ret = await gbl.apiCall(discordUrl,'PATCH',discordBody,discordHeaders);
	if (ret.status != 200) {
		console.log("***** Erreur discord:",ret);
		await discordPostPrive(usrId,"J'ai un soucis technique avec Discord pour honorer ta requête ("+ret.status+"/"+ret.code+"), refais ta tentative et si cela se reproduit, MP "+mpKikiadoc)
		return;
	}

	// efface le requete en cours
	setTransaction(usrId,"reqIdentificationMessage",null)
	
	// Sauvegarde l'association
	setDiscordPseudo(reqId.guildId,usrId,ff14Id,prenom,nom,monde)

	// Message de confirmation que tout est OK
	await discordUpdateMessage(runCtx,msgDesc.chanId,msgDesc.msgId,
		"J'ai eu confirmation du Lodestone de FF14 de l'existance de ton perso (FF14ID="+ff14Id+").\n"+
		"Je t'ai attribué le pseudo **"+nick+"** sur le discord **"+reqId.guildDesc.name+"** "+
		"et nommé Aventurier, afin que tu puisses accéder à l'ensemble du discord.i\n"+
		((runCtx.linkSite)? "**__Tu peux, si tu le souhaites, t'inscrire sur le site de la Grande Peluche__**\n<https://ff14.adhoc.click/enjoy>\n":"")  +
		"Clic <#"+runCtx.welcomeId+"> pour retourner directement sur le discord."
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
	console.log("Discord MessagePublic non traité id:", msg.d.id, " chan:",msg.d.channel_id);
}
////////////////////////////////////////////
// generique, gestion d'un message d'accueil
////////////////////////////////////////////
async function discordProcessMessageBienvenue(msg) {
	console.log("Discord MessageBienvenue non traitée");
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
	console.log("Discord MessageCreate non traitée",msg.d.id);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gestion d'un update de message
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordProcessMessageUpdate(msg) {
	console.log("Discord MessageUpdate non traitée",msg.d.id);
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
						"Coucou!\nIndique moi ton pseudo COMPLET dans FF14 par un message dans ce canal de MP entre nous deux " +
						"sous la forme *jesuis __prénom__ __nom__ __monde__* (exemple: jesuis Kikiadoc Lepetiot Moogle) " +  
						"afin que je t'autorise l'accès complet du discord **" + guildDesc.name +"**"
				);
				return;
	}
	console.log("Discord ReactionAdd non traitée:",msg);
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
				const discordUrl=discordUrlPrefix+"/guilds/"+msg.d.guild_id+"/members/"+msg.d.user_id
				const discordBody= { nick: "RefusConditions@"+Date.now(), roles: [] }
				console.log("PATCH:",discordUrl,"body:",discordBody);
				let ret = await gbl.apiCall(discordUrl,'PATCH',discordBody,discordHeaders);
				if (ret.status != 200) console.log("***** Erreur discord:",ret);
				await deleteDiscordPseudo(msg.d.guild_id,msg.d.user_id)
				return;
	}
	console.log("Discord ReactionDelete non traitée",msg);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Reception d'une notification discord
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordDispatch(msg) {
	try {
		switch(msg.t) {
			case "READY": // Confirmation de connexion
				console.log("Discord READY notif:",msg);
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
			default: // notif non traitées
				console.log("Discord notif non traitée:",msg);
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
// Glocal & exports
////////////////////////////////////////////
////////////////////////////////////////////
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // check pseudo
	const runCtx = getRunCtx(null)
	switch (method) {
		case "OPTIONS":
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
			pseudos.check(pseudo,pwd,true); // req admin
			switch(reqPaths[2]) {
				case "admActions":
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
			pseudos.check(pseudo,pwd,true); // req admin
			switch(reqPaths[2]) {
				case "admActions":
					discordActionsDelete(parseInt(reqPaths[3],10));
					gbl.exception(discordActions,200);
				case "ff14Id":
					const guildId = runCtx.guildId
					const e = getDiscordPseudoByGuidFf14(guildId,parseInt(reqPaths[3],10)) 
					deleteDiscordPseudo(e.guildId,e.usrId) 
					gbl.exception(e,200);
			}
			gbl.exception("bad op/delete",400);
	}
	gbl.exception("bad op",400);
}


exports.mpKiki = discordMpKiki
exports.mpPseudo = discordMpPseudo
exports.postMessage = exportDiscordPostMessage;
exports.getDiscordByFf14Id = getDiscordByFf14Id
exports.getDiscordByPseudo = getDiscordByPseudo

exports.start = async (callback) => {
	wsCallback = callback
	discordConnexion();
	discordActionsProcessQueue();
}



console.log('discord loaded');


/*

// const deepAI = require('../infraback/deepAI.js');
	// deepAiChanId: '1194723860990398496', // channel de deepai
	// deepAiChanId: '1195463916776591370', // channel de deepai

			case "INTERACTION_CREATE": // intéraction style clic sur un button
				discordProcessMessageInteractionCreate(msg);
				break;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gestion d'un create reaction sur un bouton
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function discordProcessMessageInteractionCreate(msg) {
	// msg.d.type: type de l'intéraction
	// msg.d.id: id de l'intéraction
	// msg.d.token: token de l'intéraction
	// msg.d.guild_id: id du serveur
	// msg.d.message.id: id du message
	// msg.d.channel_id: id channel
	// msg.d.data: intéraction
	// msg.d.data.custom_id: intéraction en texte
	// msg.d.member.user.id: id de l'utilisateur qui provoque l'intéraction
	
	// Selon le message, récupère la callback associée
	let cb = getMsgCallback(msg.d.message.id)
	// si pas de CB, c'est peut être un race entre staging/prod
	if (!cb) { console.log("DiscordInteraction Nocallback:", msg.d.id, " message:",msg.d.message.id); return}
	// appelle la callback associée au message
	cb.cb(msg,cb.o);

}

////////////////////////////////////////////
// Contexte transactionnel par msgId et callback
////////////////////////////////////////////
let msgCallbacks = {}
function setMsgCallback(msgId, cb, o) {
	msgCallbacks[msgId] = {cb:cb, o:o};
}
function getMsgCallback(msgId) {
	let ret = msgCallbacks[msgId];
	if (ret) delete msgCallbacks[msgId]
	return ret
}

////////////////////////////////////////////
// post un message dans un chanId avec component eventuels
////////////////////////////////////////////
async function discordPostMessagePublic(chanId,texte, components, noSignature) {
	const discordUrl=discordUrlPrefix+"/channels/"+chanId+"/messages"
	const postBody = {
		content:	".\n" + texte + ( (noSignature)? "" : discordTrailer ),
		tts: false,
		components: components
	}
	let ret = await gbl.apiCall(discordUrl,'POST',postBody,discordHeaders);
	return ret;
}

////////////////////////////////////////////
// messsage sur le channel de DeepAI
////////////////////////////////////////////
const deepAiLogo = [ "○","🞂","✓","✕" ]
function deepAiMsg(usrId, cat, url, dl, pc, ai, sc, score ) {
	return msg = "<@"+usrId+">,\n" +
		( (dl>2 || pc>2 || ai>2 || sc>2)? "**__Une erreur s'est produite__, contacte** "+mpKikiadoc+"\n":"" ) +
		deepAiLogo[dl] + " Téléchargement depuis Discord\n" +
		deepAiLogo[pc] + " Anonymisation dans le Grimoire de la Grande Peluche\n" +
		deepAiLogo[ai] + " Scoring par DeepAI\n" +
		deepAiLogo[sc] + " Score ⯈⯈ **__"+( (score>=0)? score : "??.?") +"__** ⯇⯇ ("+deepAI.catVal[cat]+")\n" +
		"Tu peux consulter la synthèse des résultats auprès de la Grande Peluche " +
		"<https://ff14.adhoc.click/enjoy>\n"+
		( url || "") ;
}

// msg est le message discord, oCtx le contexte sauvegardé lors de la creation de la callback
async function discordProcessInteractionDeepAi(msg,oCtx) {
	// console.log("INTERACTION DeepAI!!!!!", msg);
	// console.log("membre interaction msg.d.member",msg.d.member);
	// msg.d.type: type de l'intéraction
	// msg.d.id: id de l'intéraction
	// msg.d.token: token de l'intéraction
	// msg.d.guild_id: id du serveur
	// msg.d.message.id: id du message
	// msg.d.channel_id: id channel
	// msg.d.data: intéraction
	// msg.d.data.custom_id: intéraction en texte
	// msg.d.member.user.id: id de l'utilisateur qui provoque l'intéraction
	const interactionId = msg.d.id
	const token = msg.d.token
	const msgId = msg.d.message.id
	const chanId = msg.d.channel_id
	const usrId = msg.d.member.user.id
	const nick = msg.d.member.nick
	const embeds = msg.d.message.embeds
	const mentions = msg.d.message.mentions
	const customId = msg.d.data.custom_id

	// on vérifie que le message est bien sur le bon canal
	// car il y a race entre STAGING ET PROD car la cb est appelée sur les 2
	if (chanId != runCtx.deepAiChanId) { console.log("Discord interaction: ignore deepAIChan - race ?", interactionId, chanId); return;}

	// das tous les cas, on ack l'intéraction
	const discordUrl=discordUrlPrefix+"/interactions/"+interactionId+"/"+token+"/callback"
	ret = await gbl.apiCallExtern(discordUrl,'POST',{type:7},discordHeaders);
	if (ret.status != 204) { console.log("***** Erreur discord/ack interaction:",discordUrl,ret); return }

	let url = embeds && embeds[0] && embeds[0].url

	let refUsrId = mentions && mentions[0] && mentions[0].id

	// test intégrité, l'auteur du clic doit etre celui indiqué ans le message
	if (refUsrId != usrId) {
		await discordPostPrive(usrId,null,"Tu ne dois pas répondre à un message qui ne t'es pas adressé");
		return
	}
	// test intégrite.. normalement le nick est ok
	let pseudo = pseudos.getByNick(nick)
	if (!pseudo) {
		await discordPostPrive(usrId,null,"J'ai un soucis entre ton nick Discord ("+nick+
					") et son référencement dans le grimoire de sécurité de la Grande Peluche."+
					"\nContacte "+mpKikiadoc);
		await discordDeleteMessage(chanId,msgId);
		return
	}
	// test intégrite.. on doit avoir une url
	if (!url) {
		await discordPostPrive(usrId,null,"J'ai perdu le lien avec ton screen, contacte "+mpKikiadoc);
		await discordDeleteMessage(chanId,msgId);
		return
	}
	// test intégrite.. on doit avoir un content-type valide
	imgSuffix = gbl.getImgSuffix(oCtx.contentType);
	if (!imgSuffix) {
		await discordPostPrive(usrId,null,"Je ne reconnais pas le type d'image de ton screen, contacte "+mpKikiadoc);
		await discordDeleteMessage(chanId,msgId);
		return
	}

	// selon le button selectionné
	if (customId=="non") {
		// Annulation du screen
		await discordDeleteMessage(chanId,msgId);
		return
	}
	
	// Si c'est un bouton de screens
	if (deepAI.catLst.includes(customId)) {
			let ret = null;

			// Telechargement depuis discord
			await discordUpdateMessage(chanId,msgId,deepAiMsg(usrId,customId,null,1,0,0,0),[],true);
			await gbl.sleep(2); // delai pour le CDN discord si besoin
			let localFile = "deepAi-"+gbl.uuidv4()+"."+imgSuffix
			ret = await download.url2file(url,localFile)
			if (!ret) { await discordUpdateMessage(chanId,msgId,deepAiMsg(usrId,customId,url,3,0,0,0),null,true); return }

			// stockage (etape inutile avec le download direct sur le FS)
			let gUrl = gbl.grimoireUrlPath+localFile
			await discordUpdateMessage(chanId,msgId,deepAiMsg(usrId,customId,gUrl,2,1,0,0),null,true);
			await gbl.sleep(2); // delai pour le CDN pCloud
			ret = true;
			if (!ret) { await discordUpdateMessage(chanId,msgId,deepAiMsg(usrId,customId,gUrl,2,3,0,0),null,true); return }

			// evaluation deepAI
			await discordUpdateMessage(chanId,msgId,deepAiMsg(usrId,customId,gUrl,2,2,1,0),null,true);
			await gbl.sleep(4); // delai simuler DeepAI
			ret = await deepAI.imageCompare(deepAI.catRef[customId],gUrl);
			if (!ret) { await discordUpdateMessage(chanId,msgId,deepAiMsg(usrId,customId,gUrl,2,2,3,0),null,true); return }

			// Note le score dans le résultat avec l'url du screen dans le cdn
			deepAI.setResult(pseudo,customId,ret.score,gUrl);
			await discordUpdateMessage(chanId,msgId,deepAiMsg(usrId,customId,gUrl,2,2,2,2,ret.score),null,true);


			return
	}

}


function deepAiBuildComponents(possibles) {
	let compo = [
		{ type: 1,
			components: [
				{ type: 2, label: "Maison de CL", style: (possibles.includes('cl'   ))? 3:1, disabled: ! possibles.includes('cl-2')    , custom_id: "cl" },
				{ type: 2, label: "Maison perso", style: (possibles.includes('perso'))? 3:1, disabled: ! possibles.includes('perso-2') , custom_id: "perso" },
				{ type: 2, label: "Screen Pourri", style: (possibles.includes('autre'))? 3:1, disabled: ! possibles.includes('autre-2') , custom_id: "autre" }
			]
		},
		{ type: 1, components: [ { type: 2, label: "Ooups, j'annule ce screen", style: 4, custom_id: "non" } ] }
	]
	return compo;
}

async function discordProcessMessageDeepAi(msg) {
	// console.log("DEEPAI:", msg);
	// console.log("DEEPAI.attachments", msg.d.attachments);
	const usrId = msg.d.author.id;
	const msgId = msg.d.id;
	const chanId = msg.d.channel_id;
	const text = gbl.stripBlank(msg.d.content.toLowerCase());
	const nick = msg.d.member.nick;

	// vérif que le compte est bien identifié sur le site
	const pseudo = pseudos.getByNick(nick);
	if (!pseudo) {
		await discordPostPrive(usrId,null,
			".\nCoucou <@"+usrId+">"+
			"\nJ'ai supprimé ton message de <#"+chanId+"> car "+nick+" n'est pas associé à un pseudo dans le grimoire de sécurité de la Grande Peluche" +
			"\nC'est une erreur importante, il faut que tu contactes "+mpKikiadoc+" pour analyse."
		);
		await discordDeleteMessage(chanId,msgId);
		return;
	}

	// si pas de screen attaché....
	if (msg.d.attachments.length != 1) {
		await discordPostPrive(usrId,null,
			".\nCoucou <@"+usrId+">"+
			"\nJ'ai supprimé ton message de <#"+chanId+"> car il n'etait pas valide:" +
			"\nTu dois associer un et un seul screen: " +
			"\nTu peux reposter un message valide dans <#"+chanId+">"
		);
		await discordDeleteMessage(chanId,msgId);
		return;
	}
	// vérification du type de l'attachement
	// données disponibles:
	// msg.d.attachments[0].content_type
	// msg.d.attachments[0].width
	// msg.d.attachments[0].height
	// msg.d.attachments[0].size
	if (!msg.d.attachments[0].content_type || !msg.d.attachments[0].content_type.startsWith('image/') ) {
		await discordPostPrive(usrId,null,
			".\nCoucou <@"+usrId+">"+
			"\nJ'ai supprimé ton message de <#"+chanId+"> car ce n'est pas un screen" +
			"\nTu peux reposter un message valide dans <#"+chanId+">"
		);
		await discordDeleteMessage(chanId,msgId);
		return;
	}

	// demande de spécifier si l'image est OK
	const qMsg= await discordPostMessagePublic(chanId,
		"Coucou <@"+usrId+">, j'ai capturé ton screen." +
		"\n\nVérifie que tu as bien effacé ton perso du /gpose, vérifie aussi que l'angle de vue et la position sont ok, etc..."+
		"\nBref, vérifie que tout est bien conforme aux instructions de la Grande Peluche."+
		"\nUn bouton vert indique que tu peux poster 2 screens, un bouton bleu, un dernier et si deactivé, plus de screen dans cette catégorie.." +
		"\nSi tout est ok, clique sur la catégorie pour ton screen.\n__Sinon, clique sur annuler (et tu pourras recommencer ton screen)__\n" +
		msg.d.attachments[0].url ,
		deepAiBuildComponents(deepAI.getPossibles(pseudo)), // buttons
		true // pas de signature
	);
	if (qMsg.status != 200) console.log("********** Erreur post DeepAi capture:",qMsg,JSON.stringify(qMsg,null,2) );

	// supprime le post origignal
	await discordDeleteMessage(chanId,msgId);

	console.log("msgId/postPublic",qMsg.id);
	// construit le contexte transactionnel
	setMsgCallback(qMsg.id,discordProcessInteractionDeepAi,{ contentType: msg.d.attachments[0].content_type } );
	return;
}
*/
