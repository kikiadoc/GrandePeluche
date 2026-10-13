////////////////////////////////////////////////////////////
// Varaible constante globales et variables à state globales
////////////////////////////////////////////////////////////
export const SVELTEVERSION=null // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
export const CLIENTVERSION=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
export const VITEVERSION=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
export const WEBPATH=null  // SERA MODIFIE LORS DU COMMIT EN STAGING OU PROD ne pas changer
export const APITYPE='test' // SERA MODIFIE LORS DU COMMIT selon environnement
const CDNVER="V10a" // A Modifier manuellement lors d'un basculement de version
										// ne pas oublier de modifier aussi dans la page d'assistance


console.log("window.location",window.location)

// discordClientId est l'identifiant pour le bot discord Embedded, ce n'est pas le
// bot avec gateway websocket qui est indépendant
const hostDescription = {
	'' : {
		public: false, discord:false, discordClientId: null, skin: "FF",
		rpId: "svelte.dev", rpName: "La Grande Peluche", typeAuth: "webauthn",
		skin: { titreLbl: "La Grande Peluche" },
		PAGEASSISTANCE: "https://help.adhoc.click/HELP/index.html",
		URLPRIVE: "https://ff14.adhoc.click/enjoyTest",
	}, 
	'ff14.adhoc.click': {
		public: false, discord:false, discordClientId: null, skin: "FF",
		rpId: "ff14.adhoc.click", rpName: "La Grande Peluche", typeAuth: "webauthn",
		skin: { titreLbl: "La Grande Peluche" },
		PAGEASSISTANCE: "https://help.adhoc.click/HELP/index.html",
		URLPRIVE: "https://ff14.adhoc.click/enjoy",
	},
	'1523960774723375206.discordsays.com': { 
		public: true, discord:true, discordClientId: '1523960774723375206', skin: "FF",
		rpId: "1523960774723375206.discordsays.com", rpName: "La Grande Peluche", typeAuth: "discord",
		skin: { titreLbl: "La Grande Peluche - Staging Discord " },
		PAGEASSISTANCE: "https://help.adhoc.click/HELP/index.html",
		URLPRIVE: "https://ff14.adhoc.click/enjoyTest",
	},
	'1523699928701075677.discordsays.com': {
		public: true, discord:true, discordClientId: '1523699928701075677', skin: "FF",
		rpId: "1523699928701075677.discordsays.com", rpName: "La Grande Peluche", typeAuth: "discord",
		skin: { titreLbl: "La Grande Peluche" },
		PAGEASSISTANCE: "https://help.adhoc.click/HELP/index.html",
		URLPRIVE: "https://ff14.adhoc.click/enjoy",
	},
}
// Description du host
export const hostDesc = hostDescription[window.location.host]
if (! hostDesc) throw new Error("ground.svelte.js: URL PREFIX HOST INVALIDE, ABORT DE TOUT")

// faciliteurs
const tIsDiscord= hostDesc.discord || false
export const GBLSTATIC = {
	host: window.location.host || "n/a",
	isDiscord: tIsDiscord,
	isProd: (APITYPE!='test'),
	isPC: ! window.matchMedia("(pointer: coarse)").matches,
	isSM: window.matchMedia("(pointer: coarse)").matches,
	isAndroid: /(android)/i.test(navigator.userAgent),
	isPWA: window.matchMedia('(display-mode: standalone)').matches,
	envName: (APITYPE=='test')? "Staging" : "Prod",
	urlApi: (tIsDiscord)? 'urlApi'+APITYPE : 'https://api.adhoc.click/api'+APITYPE,
	wsUrl: (tIsDiscord)? 'urlWss'+APITYPE+'/' : 'wss://api.adhoc.click:443/ws'+APITYPE+'/',
	urlImg: (tIsDiscord)? 'urlCdn/' : 'https://cdn.adhoc.click/'+CDNVER+'/',
	urlCdn: (tIsDiscord)? 'urlCdn/' : 'https://cdn.adhoc.click/'+CDNVER+'/',
	urlMp3: (tIsDiscord)? 'urlCdn/' : 'https://cdn.adhoc.click/'+CDNVER+'/',
	urlCdnAI: (tIsDiscord)? 'urlAI/' : 'https://cdn.adhoc.click/AI-Generated/',
	urlCdnSTATIC: (tIsDiscord)? 'urlStatic/' : 'https://cdn.adhoc.click/STATIC/',
	urlCdnTTS: (tIsDiscord)? 'urlTTS/' :'https://cdn.adhoc.click/FF-TTS-STATIC/',
	GARLAND : (tIsDiscord)? "garland/" : "https://www.garlandtools.org/",
	UNIVERSALIS : (tIsDiscord)? "universalis/" : "https://universalis.app/",
	TEAMCRAFT : (tIsDiscord)? "teamcraft/" : "https://ffxivteamcraft.com/",
	XIVAPI : (tIsDiscord)? "xivapi/" : "https://v2.xivapi.com/",
	hostDesc: hostDesc, 
}
export const isDiscord=GBLSTATIC.isDiscord
export const isProd=GBLSTATIC.isProd
export const isPC=GBLSTATIC.isPC
export const isSM=GBLSTATIC.isSM
export const isAndroid=GBLSTATIC.isAndroid
export const isPWA=GBLSTATIC.isPWA
export const envName=GBLSTATIC.envName
export const urlApi=GBLSTATIC.urlApi
export const wsUrl=GBLSTATIC.wsUrl
export const urlImg=GBLSTATIC.urlImg
export const urlCdn=GBLSTATIC.urlCdn
export const urlMp3=GBLSTATIC.urlMp3
export const urlCdnAI=GBLSTATIC.urlCdnAI
export const urlCdnSTATIC=GBLSTATIC.urlCdnSTATIC
export const urlCdnTTS=GBLSTATIC.urlCdnTTS

export const rawConsole = { // permet de faire des console.log sans hook pourri de discord
	log: console.log,
	info: console.info, 
	warn: console.info,
	error:console.info
}
export const GBLSTATE = $state({
	swcReady: false, // etat du service worker 
	audioVolume: 30,
	audioBack: false,
	audioTTS: 100,
	audioAmbiance: true,
});

export const GBLCONST = {
	// LES ELEMENTS SUIVANTS DOIVENT ETRE DEFINIS ET COHERENTS DANS LE SERVEUR 
	PRIVCODEX  : 0x00000001, // spécifique admin codex
	PRIVENIGME : 0x00000002, // spécifique admin enigme
	
	PRIVACCES  : 0x00800000, // acces au page de menu vérouillées 
	PRIVBAN    : 0x00400000, // possibilite de ban
	
	PRIVDROITS : 0x01000000, // gestion des droits < 0xFFFFFF 
	PRIVDELETE : 0x20000000, // delete pseudo coté serveur
	PRIVSADMIN : 0x40000000, // placebo serveur admin

	CONTACTS: [
		{ nom:"Kikiadoc @discord FF XIV - France (accès public)", url: "https://discord.gg/FFXIVFR" },
		{ nom:"Kikiadoc @discord La Grande Peluche (accès privé, sécurisé)", url: "https://discord.gg/WvRSN8Wshe" }
	],
	EQUILIBRAGE: {
		NB: 10, // nombre de joueurs 
		EVENTGILS: 400, // nombre de gils de l'événement
		COEFPOW: 50 // Coef d'exponentielle de la cagnotte
	},
	GENRES: [
		{val: null, lbl:"Inconnu", notif: "Je vais accorder mon discours au masculin"},
		{val:"M", lbl:"Masculin", notif: "Je vais accorder mon discours au masculin"},
		{val:"F", lbl:"Féminin", notif: "Je vais accorder mon discours au féminin"},
		{val:"N", lbl:"Non-binaire", notif: "Je vais accorder mon discours au masculin ou au féminin, selon ma propre humeur"}
	],
	SKINS: [
		{val:"SKINGP", lbl:"Historique", notif: null},
		{val:"SKINFF", lbl:"Modernisé", notif: null},
	],
	CHOIXAI: [
		{val: 0, lbl: "Mistral (FR)", url:"https://chat.mistral.ai/chat"},
		{val: 1, lbl: "gemini (US)", url:"https://google.com/search"},
	],
	DATACENTERS: [
		{val: 0, lbl: "Chaos"},
		{val: 1, lbl: "Light"}
	]
};
///////////////////////////////////////////////////////////
// Discord Embedded
///////////////////////////////////////////////////////////
let discordSdk = null // sera mis à jour lors de l'init
// Authentification si discordEmbedded
export async function discordSdkInit(apiCall,webAuth) {
	if (!isDiscord) return null
	rawConsole.log("discordSdkInit Chargement Discord...")
	// impor dynamic
	webAuth.discordSdk="import en cours"
	const { DiscordSDK } = await import('@discord/embedded-app-sdk')
	// rawConsole.log("DiscordSDK",DiscordSDK)
	webAuth.discordSdk="instanciation en cours"
	discordSdk = new DiscordSDK(hostDesc.discordClientId)
	rawConsole.log("discordSdkInit Synchro Discord...")
	webAuth.discordSdk="attente discord Ready"
	await discordSdk.ready()
	rawConsole.log("discordSdkInit Authent Discord...")
	webAuth.discordSdk="autorisation en cours"
	const {code} = await discordSdk.commands.authorize({
        client_id: hostDesc.discordClientId,
        response_type: "code",
        state: null, // crypto.randomUUID(), 
        prompt: "none",
        scope: [ "identify"  ] // [ "identify", "guilds" ]
    })
	if (!code) throw new Error("Erreur Discord Authorize pour cliendId="+hostDesc.discordClientId)
	webAuth.discordSdk="validation par Grande Peluche"
	const ret = await apiCall("/embDiscord/validation", "POST",
															   { clientId: hostDesc.discordClientId, code: code },
																 true,'-discord-')
	if (ret.status!=200) throw new Error("Acces token refusé par le serveur Grande Peluche")
	const access_token = ret.o.access_token
	webAuth.discordSdk="authentification en cours"
	const auth = await discordSdk.commands.authenticate({ access_token });
	// ajout du code dans l'auth discord pour revalidation sur le serveur
	auth.discordCode = code
	rawConsole.log("discordSdk Auth:",auth)
	webAuth.discordSdk="Autorisation/authentification OK"
	webAuth.discordAuth=auth

	rawConsole.log("discordSdkInit fini")
	return { discordSdk:discordSdk, discordAuth: auth }
}
///////////////////////////////////////////////////////////
// webAuthn
///////////////////////////////////////////////////////////
// recup contexte serveur, retourne un webAuth, necessite apiCall loadIt et displayInfo car dans ground.
export async function authContexte(wAuth,dAuth,apiCall,loadIt,displayInfo) { 
	// rawConsole.log("authContexte",wa)
	const dId = dAuth?.user?.id
	const def = {
			rpId: GBLSTATIC.hostDesc.rpId,
			rpName: GBLSTATIC.hostDesc.rpName,
			typeAuth: GBLSTATIC.hostDesc.typeAuth,
			etat:"new",
			step: "authContexte, normalisePNML", 
			discordId: dId,
	}

	// nécessite les infos de base
	if (!wAuth.nom || !wAuth.prenom || !wAuth.monde || !wAuth.ff14Id) return def

	// requete
	const ctx = {
		prenom: wAuth.prenom,
		nom: wAuth.nom,
		monde: wAuth.monde,
		ff14Id: wAuth.ff14Id,
		discordId: dId,
		discordToken: dAuth?.access_token
	}
	// demande la vision serveur
	let ret = await apiCall("/pseudos/contexte","POST",ctx,true,'-verifCtx-' )
	// verif de la cohérence de l'etat client avec l'etat serveur
	let tWebAuth = ret.o
	if (ret.status != 200) {
		switch (ret.status) {
			case 498: /* erreur de nick */
				localStorage.clear()
				displayInfo({ titre:"Cohérence Discord/FF14", ding: 'explosion', back: "rouge",
					trailer:"Quitte l'activité Discord",
					body: ["Ton nickName Discord ne mentionne pas ton prénom de FF14.",
								 {cls: "blinkMsg", txt: "Change ton nick en faisant un /nick sur Discord"},
								 {cls: "petit", txt: "Par exemple:"},
								 {cls: "petit", txt: "/nick "+wAuth.prenom+" "+wAuth.nom+" @"+wAuth.monde},
								 {cls: "petit", txt: "/nick Le gentil "+wAuth.prenom},
								 {cls: "petit", txt: "/nick "+wAuth.prenom+" la féroce"},
								]
				})
				return null
			default:
				throw new Error("authContexte: Souci de cybersécurité indiquée par le serveur: "+ret.msg)
		}
	}

	// verif de la cohérence de l'etat client avec l'etat serveur
	tWebAuth.ff14Id = wAuth.ff14Id // la réponse server ne contient pas le FF14ID, on complete
	tWebAuth.discordId = dId // la réponse server ne contient pas le dId, on complete
	switch (tWebAuth.etat) {
		case "new" : // si le serveur demande new, pas de soucis
		case "renew" : // si le serveur demande renew, pas de soucis
			return tWebAuth
		case "ok" : // si le serveur est ok, mais si pas d'elliptic faut forcer un renew
			if (!loadIt("elipticSecurity",null)) tWebAuth.etat="renew"
			return tWebAuth
	}
	
	throw new Error("authContexte: Erreur de logique entre état serveur et client")
}	

///////////////////////////////////////////////////////////
// Cagnotte 
///////////////////////////////////////////////////////////
// calcul cagnotte:
// curNb : nombre de contributions primaires
// maxGils: nom de gils total
// secNb: nombre de contributions secondaires (ou null)
// eqNb: nombre max de contributions pour equillibrage (ou null)
export function calcCagnotte(curNb,maxGils,secNb,eqNb) {
	if (curNb==0) return 0
	eqNb = eqNb || GBLCONST.EQUILIBRAGE.NB
	if (secNb !== undefined) curNb=Math.min(curNb,secNb)
	if (curNb>eqNb) return maxGils
	// ramene le ratio de participation entre -1 et 0 et applique l'exponentielle
	return maxGils * Math.pow( GBLCONST.EQUILIBRAGE.COEFPOW, (curNb/eqNb)-1 )
}
export function calcCagnotteNb(curNb,secNb,eqNb) {
	if (curNb==0) return 0
	eqNb = eqNb || GBLCONST.EQUILIBRAGE.NB
	if (secNb === undefined) return Math.floor(Math.min(curNb,eqNb))
	return Math.floor(Math.min(curNb,secNb,eqNb))
}

/*
// debug
for (let i=0; i<= GBLCONST.EQUILIBRAGE.NB; i++)
	console.log("***calcCagnotte",i,calcCagnotte(i,100) )
*/

// ground.svelte.js 
