// constante de description de l'environnement d'execution
// TODO A REFACTORER (DOUBLE EMPLOI AVEC ground.svelte.js)
const typeDeviceSM = window.matchMedia("(pointer: coarse)").matches
const typeDeviceAndroid = /(android)/i.test(navigator.userAgent)
const typeDevicePWA= window.matchMedia('(display-mode: standalone)').matches

import {AUDIODESCS, VIDEODESCS } from './media.js'
import { urlCdn, urlCdnAI, urlCdnTTS, urlApi, wsUrl, rawConsole, isDiscord } from "./ground.svelte.js"
import { addReportError } from "./privacy.js"

///////////////////////////////////////////////////////////////////////////////////////
// FORMATTAGE ET TEST REGEX
///////////////////////////////////////////////////////////////////////////////////////
function p2(v) { return v.toString().padStart(2,"0")}
function p3(v) { return v.toString().padStart(3,"0")}

export function isPseudoValid(str) { return /^['\-A-Za-z]+$/g.test(str); }
export function isLowerNumeric(str) { return /^[a-z0-9]+$/g.test(str); }
export function isNumeric(str) { return /^[0-9]+$/g.test(str); }
export function alphanum2placer(str) { return (str)? str.replace(/[a-z0-9]/g,"﹇") : str; } 
export function capitalizeFirstLetter(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
export function lowerFirstLetter(str) { return str.charAt(0).toLowerCase() + str.slice(1); }
// arrondi un float selon f (f::= 10,100,1000...)
export function roundFloat(v,f) { return Math.floor(v*(f||10)) / (f||10) }

function checkNbCharInTemplate(ch,str1,str2) {
	// if (str1.length!=str2.length) return false
	let nb1=0,nb2=0
	for (let i=0; i<str1.length; i++) { if (str1.charAt(i)==ch) nb1++ }
	for (let i=0; i<str2.length; i++) { if (str2.charAt(i)==ch) nb2++ }
	return nb1==nb2
}
export function checkTemplate(str,template) {
	if (!str || !template) return false
	if (!checkNbCharInTemplate(" ",template,str)) return false
	if (!checkNbCharInTemplate("'",template,str)) return false
	if (!checkNbCharInTemplate(".",template,str)) return false
	if (!checkNbCharInTemplate("-",template,str)) return false
	if (!checkNbCharInTemplate(",",template,str)) return false
	if (!checkNbCharInTemplate("/",template,str)) return false
	if (!checkNbCharInTemplate("_",template,str)) return false
	return true
}

// return le dth d'une string JJ/MM HH:MM, ou 0 si bad format
export function parseJJMMHHMM(s) {
	if (!s) return 0;
	let slash= s.indexOf('/');
	let spc = s.indexOf(' ');
	let dp = s.indexOf(':');
	// si pas les séparateurs dans le bon ordre, return 0
	if (slash < 0 || spc < slash || dp < spc) return 0;
	let jj = parseInt(s.substring(0,slash),10)
	if (jj<=0 || jj>31) return 0;
	let mo = parseInt(s.substring(slash+1,spc),10)
	if (mo<=0 || mo>12) return 0;
	let hh = parseInt(s.substring(spc+1,dp),10)
	if (hh<0 || hh>23) return 0;
	let mm = parseInt(s.substring(dp+1),10)
	if (mm<0 || mm>59) return 0;
	// la chaine semble ok...
	// si le mois est avant 2 mois de la date actuelle, alors l'année est la suivante
	let yy = new Date().getFullYear();
	if ( mo < new Date().getMonth()-1 ) yy++; 
	return new Date(yy, mo-1, jj, hh, mm).valueOf();
}

export function aaaammjjThhmm(dth) {
	let date = new Date(dth)
	return date.getFullYear()+"-"+p2(date.getMonth()+1)+"-"+p2(date.getDate())+"T"+p2(date.getHours())+":"+p2(date.getMinutes())
}
export function aaaammjj(dth) {
	let date = new Date(dth)
	return date.getFullYear()+"-"+p2(date.getMonth()+1)+"-"+p2(date.getDate())
}
// ms est un nombre de millisecond
export function hhmmss(ms) {
	if (ms) {
		let dth = new Date(ms);
		return p2(dth.getHours())+":"+p2(dth.getMinutes())+":"+p2(dth.getSeconds());
	}
	return "--:--:--";
}
// ms est un nombre de millisecond
export function jjmm(ms) {
	if (ms) {
		let dth = new Date(ms);
		return p2(dth.getDate())+"/"+p2(dth.getMonth()+1)
	}
	return "--/--";
}

// ms est un nombre de millisecond si Nosep, pas de fioritures
export function jjmmhhmmss(ms,noSep) {
	if (ms) {
		let dth = new Date(ms);
		let ret = (noSep)? "" : "le "
		ret += p2(dth.getDate())+"/"+p2(dth.getMonth()+1)
		ret += (noSep)? " " : " à "
		ret += p2(dth.getHours())+":"+p2(dth.getMinutes())+":"+p2(dth.getSeconds());
		return ret;
	}
	return "...";
}
// ms est un nombre de millisecond
export function jjmmhhmm(ms) {
	if (ms) {
		let dth = new Date(ms);
		let ret = ""
		ret += p2(dth.getDate())+"/"+p2(dth.getMonth()+1)
		ret += " "
		ret += p2(dth.getHours())+":"+p2(dth.getMinutes())
		return ret;
	}
	return "...";
}

// ms est un nombre de millisecond --> jj@hh:mm
const tblJours=["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."]
export function jjhhmm(ms,forceJour) {
	if (ms) {
		const dth = new Date(ms);
		const dayNow = new Date().getDay();
		const day = dth.getDay();
		return ((dayNow!=day || forceJour)? tblJours[day] : "") + p2(dth.getHours()) + ":" + p2(dth.getMinutes());
	}
	return "...";
}

// ms est un nombre de millisecond --> durée 
export function duree(ms) {
	let delta = Math.floor(ms/60000); // nombre de minutes
	let j= Math.floor(delta / 1440); // 24*60
	let h= Math.floor( (delta - j*1440) / 60);
	let m= delta % 60;
	// rawConsole.log("duree:",delta,j,h,m) 
	let ret="";
	if (j>0) ret = j+"j, ";
	if (delta >= 60) ret = ret.concat(h+"h, ");
	ret = ret.concat(m.toString(),"m");
	return ret;
}

// ms est un nombre de millisecond
export function ssms(ms) {
	if (ms>0) return p2(Math.floor(ms/1000))+"."+p3(ms%1000)
	if (ms<0) return "-"+p2(Math.floor((-ms)/1000))+"."+p3((-ms)%1000)
	return "00.000";
}
// ms est un nombre de millisecond
export function mmssms(ms) {
	if (!ms) return "--:--.---"
	return p2(Math.floor((ms/60000)%60))+":"+p2(Math.floor((ms/1000)%60))+"."+p3(ms%1000);
}

export function hhmmssms(ms) {
	if (!ms) return "--:--:--.---";
	const dth = new Date(ms);
	return p2(dth.getHours())+":"+p2(dth.getMinutes())+":"+p2(dth.getSeconds())+"."+p3(dth.getMilliseconds());
};

export function countDownTo(dth) {
	if (dth==null || dth==undefined)
		return "--:--:--"
	const nbSec = Math.floor( (dth- Date.now()) / 1000)
	if (nbSec <= 0) return "00:00:00"
	const h = Math.floor(nbSec/3600)
	const m = Math.floor( (nbSec - h*3600) / 60)
	const s = Math.floor( nbSec % 60)
	return p2(h) + ":" + p2(m) + ":" + p2(s)
}
export function nbSecTo(dth) {
	if (dth==null || dth==undefined) return 0
	return Math.floor( (dth- Date.now()) / 1000)
}

export function getUtcMsFrom(y,m,d,hh,mm,ss) {
	return Date.UTC(y, m-1, d, hh, mm, ss)
}

// !! Attention, la fonction suivante doit être exactement la copie de celle du server
const ESCAPETEXTREGEXP =  /[^A-Za-z0-9', ]/g
export function escapeTexte(str) {
  return str.replace( ESCAPETEXTREGEXP, "_" )
}

export function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

/* Obsolete
// Conversion d'un buffer en chaine HEXA
const LUT_HEX_4b = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
const LUT_HEX_8b = new Array(0x100);
for (let n = 0; n < 0x100; n++) {
  LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xF]}${LUT_HEX_4b[n & 0xF]}`;
}
function uint8ArrayToHex(buffer) {
  let out = '';
	let dv = new DataView(buffer)
  for (let idx = 0, edx = buffer.byteLength; idx < edx; idx++) {
    out += LUT_HEX_8b[dv.getUint8(idx)];
  }
  return out;
}
*/
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function sortCmp(a,b) {
	// rawConsole.log("cmp",a,b)
	return (a<b)? -1: (a>b)? 1 : 0
}

// return true/false selon la distance quadratique
export function isDistance(x,y,tX,tY,d) {
  return (x>=tX-d && x<=tX+d && y>=tY-d && y<=tY+d)
}

// retourne le nombre de bits dans un int de 32 bits max.
export function intCountBits32(n) {
	// https://stackoverflow.com/questions/43122082/efficiently-count-the-number-of-bits-in-an-integer-in-javascript
	n = n - ((n >> 1) & 0x55555555)
	n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
	return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}
export function intCountBits(n) {
  var bits = 0
  while (n !== 0) {
    bits += intCountBits32(n | 0)
    n /= 0x100000000
  }
  return bits
}
///////////////////////////////////////////////////////////////
// Fonction replacer/reviver pour parse des map dans un json
///////////////////////////////////////////////////////////////
export function replacer(key, value) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}
export function reviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}


///////////////////////////////////////////////////////////////////////////////////////
// Détection du type d'équipement / capacité
///////////////////////////////////////////////////////////////////////////////////////
export function getTypeEquipement() {
	return (typeDeviceSM)? "SM" : "PC";
}
export function isEquipementSmartphone() {
	return typeDeviceSM
}
export function isEquipementPC() {
	return ! typeDeviceSM
}
export function isSM() {
	return typeDeviceSM
}
export function isPC() {
	return ! typeDeviceSM
}
export function isAndroid() {
	return typeDeviceAndroid
}
export function isPWA() {
	return typeDevicePWA
}
// isAdmin est obsolete, utiliser isPrivilege 
export function isAdmin(pseudo) {
	// pas de soucis de cybersecu, le serveur fera la différence si besoin
	return pseudo.startsWith('Kikiadoc') || pseudo=='Eleana' || pseudo=='Althea'
}
export function isAdminServer(pseudo) {
	// pas de soucis de cybersecu, le serveur fera la différence si besoin
	return pseudo.startsWith('Kikiadoc')
}
export function isPrivilege(webAuth,privNum) {
	// pas de soucis de cybersecu, le serveur fera la différence si besoin
	return webAuth?.privilege & (privNum || 0)
}
///////////////////////////////////////////////////////////////////////////////////////
// AFFICHAGE
///////////////////////////////////////////////////////////////////////////////////////
// scroll a au debut/fin d'un node (usage avec use:)
export function scrollPageToTop(node) {
	setTimeout(()=>document.getElementById("scrollTopPage").scroll({top:0, left:0, behavior:'smooth'}), 200)
}
export function scrollNodeToTop(node) { 
	setTimeout(()=>node.scrollIntoView({ behavior:"smooth", block:"top", container:"nearest" }),200)
}
export function scrollNodeToMiddle(node) { 
	setTimeout(()=>node.scrollIntoView({ behavior:"smooth", block:"center", container:"nearest" }),200)
}
export function scrollNodeToBottom(node) {
	setTimeout(()=>node.scroll({ top: node.scrollHeight, left:0, behavior: 'smooth' }),200)
}
///////////////////////////////////////////////////////////////////////////////////////
// notificationn, affichage debug object et displayInfo
///////////////////////////////////////////////////////////////////////////////////////
export function addNotification(text,color,timeout,ding) {
	const domNotifs = document.getElementById("notifications");
	if (!domNotifs) return rawConsole.log("dom id notifications not found: ",text)
	const div = document.createElement("div");
	const styleAttr = document.createAttribute("style");
	styleAttr.value = "font-size: 0.7em; cursor: pointer; background-color: "+ (color || "green") +"; border-radius: 5px; padding: 5px; margin: 5px; text-align: right";
	div.setAttributeNode(styleAttr);
	div.appendChild(document.createTextNode(text+" ⊗"));
	domNotifs.appendChild(div);
	const timeoutId = setTimeout(() => {  div.remove() } , (timeout) ? timeout*1000 : 5000 );
	div.onclick= function() { div.remove(); clearTimeout(timeoutId) }
	if (ding)	playDing(ding)
	return null
}

// affichae debug d'un object par propagation du dom (si dspObject non passé en props)
function dispatchCustomEvent(type,o) {
	document.dispatchEvent(new CustomEvent(type, { type:type, detail: o }))
}
export function displayObject(o) {
	dispatchCustomEvent("dspObject",o)
}
export function displayInfo(o) {
	dispatchCustomEvent("dspInfo",o)
}
export function displayError(o) {
	o.ding ??="explosion" /// force l'alarme si besoin
	dispatchCustomEvent("dspError",o)
}
/////////////////////////////////////////////////////////////////////
// Gestion des mecanismes de crypto 
/////////////////////////////////////////////////////////////////////
const ecKeyGenParams = { name: "ECDSA", namedCurve: "P-384" }
const ecKeyImportParams = { name: "ECDSA", namedCurve: "P-384" }
const ecdsaParams = { name: "ECDSA", hash: "SHA-256" }
export function hexToUint8Array(hexStr) {
	return Uint8Array.fromHex(hexStr)
}
export function b64_b64u(b64) {
		return b64.replaceAll('+', '-').replaceAll('/', '_')
}
export function b64u_b64(b64u) {
		return b64u.replaceAll('-', '+').replaceAll('_', '/') // base64url -> base64
}
export function u8_b64u(u8) { 
		return new Uint8Array(u8).toBase64({alphabet:"base64url"})
}
export function b64u_u8(b64u) {
		return Uint8Array.fromBase64(b64u, {alphabet:"base64url"} )
}
export function b64u_str(b64u) {
		return atob(b64u_b64(b64u))
}
export function str_b64u(txt) {
		return b64_b64u(btoa(txt))
}
export function str_u8(txt) {
		return Uint8Array.fromBase64(btoa(txt))
}
// creation d'une paire de clefs, retourne la clef ou null
export async function cryptoNewElliptic() {
		addNotification("Création clef cryto éphémère","lightgreen",3)
		const keyPair = await crypto.subtle.generateKey(ecKeyGenParams, true,  ["sign", "verify"] )
		const oKey = {
			jwkPublicKey: await crypto.subtle.exportKey("jwk",keyPair.publicKey),
			jwkPrivateKey: await crypto.subtle.exportKey("jwk",keyPair.privateKey)
		}
		return oKey
	}

// signe un texte avec l'eliptic en parametre et retourne un array buffer 
export async function abElipticSignature(texte,es) {
	if (!es) throw new Error("abElipticSignature, clef eliptique es non définie")
	let ret = await crypto.subtle.sign( 
		ecdsaParams,
		await crypto.subtle.importKey("jwk", es.jwkPrivateKey, ecKeyImportParams, false, ["sign"]),
		new TextEncoder().encode(texte))
	if (!ret) throw new Error("abElipticSignature, impossible de crypto.subtle.sign")
	rawConsole.log("abElipticSignature",ret)
	return ret
}
// signe un texte avec l'eliptic en parametre et retourne une chaine HEX
export async function hexElipticSignature(texte,es) {
	return new Uint8Array(await abElipticSignature(texte,es)).toHex()
}
////////////////////////////////////////////////////////////////////
// auth generic retourne un webAuth 
////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////
// Websocket 
///////////////////////////////////////////////////////////////////////////////////////
let ws = null;
let wsLastClose = null; // code du dernier close du ws
let wsTimerError = null; // prochain timer de "timeout erreur" du ws
let wsTimerPing = null; // prochain timer pour emission d'un ping
let wsStatus = 0; // etat du websocket
let apiWaiting = [] // promise pour attente de l'API sur connexion WS
let msgWaiting = [] // promise pour attente d'envoi de message ws sur connexion WS

// Attente du WS pour des api (indexe par l'url)
async function waitWsForAPI(url) {
	let prom = new Promise((ok, ko) => {
		apiWaiting.push( {u: url, o: ok, k: ko})
		rawConsole.log("API queued en attention validation crypto:",url)
	})
	return prom;
}
// Attente du WS pour des msg (indexe par le msg)
async function waitWsForMSG(msg) {
	let prom = new Promise((ok, ko) => {
		msgWaiting.push( {m: msg, o: ok, k: ko})
		rawConsole.log("MSG queued en attention validation crypto:",msg)
	})
	return prom;
}

// envoi un objet via websocket, attente du ws connecté si besoin
// pour etre interpréter coté serveur, o doit contenir un champ op
export async function wsSend(o) {
	if (wsStatus != 1) 
		await waitWsForMSG(o)
	ws.send( JSON.stringify(o) )
	return true
}
export function disconnectFromServer() {
	if (ws) {
		rawConsole.log("force disconnect: ws close en cours");
		try { ws.close(); ws = null }
		catch(e) { rawConsole.log("Erreur close ws:", e) }
	}
}
function wsTimeout() {
	rawConsole.log("wsTimeout")
}
function wsPing() {
	// rawConsole.log("wsPing",Math.floor(Date.now()/1000))
	clearTimeout(wsTimerPing)
	clearTimeout(wsTimerError)
	if (ws) ws.send( JSON.stringify({op: "ping"} ));
	wsTimerError = setTimeout(wsTimeout, 90000)
}

export function getPseudoFromStorage() {
	return loadIt("pseudo",null);
}

// Reception de la demande d'init depuis le server 
async function wsAuthInit(ws,mBody,clientVersion,webAuth) {
	const es = loadIt("elipticSecurity",null)
	if (!webAuth.pseudo || !es?.jwkPrivateKey || !es?.jwkPublicKey) {
		addNotification("Erreur de logique client dans wsAuthInit","red",60)
		ws.close(4100,"Erreur de logique client: pseudo ou clef elliptique non défini")
		return
	}
	rawConsole.log("iam... Envoi signature elliptique au serveur",mBody.challenge)
	let b64uSignature = u8_b64u(await abElipticSignature(mBody.challenge,es))
	ws.send( JSON.stringify( 
		{
			op: "iam",
			pseudo: webAuth.pseudo,
			prenom: webAuth.prenom,
			nom: webAuth.nom,
			monde: webAuth.monde,
			lastClose: wsLastClose,
			clientVersion: clientVersion,
			// newPwd: es.newPwd, 
			// publicKey: es.jwkPublicKey,
			b64uSignature: b64uSignature
		} ));
}
export async function connectToServer(cbStatus, cbMessage,clientVersion,webAuth) { 
	disconnectFromServer()
	const wsId=Date.now()
	rawConsole.log("WS connecting...id=",wsId) 
	webAuth.etat="ws"
	cbMessage("Demande connection...") 
	try {
		ws = new WebSocket(wsUrl)
		cbMessage("Connection en cours...")
		ws.onmessage = async (webSocketMessage) => {
			try {
				// rawConsole.log("webSocketMessage",webSocketMessage)
				const mBody = JSON.parse(webSocketMessage.data);
				// traitement des messages standards
				switch(mBody.op) {
					case "init" :
						cbMessage("Init Authentication...")
						await wsAuthInit(ws,mBody,clientVersion,webAuth)
						break;						
					case "pong" :
						cbMessage("ping/pong "+ (mBody.ephemere||webAuth.ephemere))
						// Reception d'un pong, emission d'un ping sur timer
						clearTimeout(wsTimerError); // annule le timeout d'erreur 
						wsTimerPing = setTimeout(wsPing, 45000); // ping prochain
						rawConsole.log("Pong reqVer=",mBody.clientVersion,"cliVer=",clientVersion)
						if (mBody.clientVersion && clientVersion && mBody.clientVersion>clientVersion) {
							addNotification("Nouvelle version disponible, Ferme et relance","red",60);
							playDing("call-to-attention")
						}
						break
					case "elipticKeyOk" :
						rawConsole.log("iam... crypto ephemere signée acceptée par le serveur")
						cbMessage("crypto éphemere signée acceptée par serveur")
						// stocke la clef pour le call api 
						webAuth.ephemere = mBody.pwd
						storeIt('webAuth',webAuth) // On force l'écriture car le storeIt dans l'effet peut être lent 
						wsPing(); // Démarrage de la sequence ping/pong  
						cbStatus(wsStatus=1)
						// si apicall en attente, libere l'apicall
						let tmpApiWaiting = apiWaiting
						apiWaiting=[];
						rawConsole.log("Release API call en attente de validation crypto ephemere:",tmpApiWaiting.length)
						tmpApiWaiting.forEach( (e) => {rawConsole.log("Release APICALL",e.u); e.o()} )
						// si msg en attente, libere les msg
						let tmpMsgWaiting = msgWaiting
						msgWaiting=[];
						rawConsole.log("Release MSG call en attente de validation crypto ephemere:",tmpMsgWaiting.length)
						tmpMsgWaiting.forEach( (e) => {rawConsole.log("Release MSG",e.m); e.o()} )
						break;
					case "erreur" :
						cbMessage("message d'erreur autoritaire du serveur")
						let dspMsg = "" 
						if (mBody.texte) dspMsg += mBody.texte
						if (mBody.msg) dspMsg += mBody.msg
						if (mBody.name) dspMsg += " ("+mBody.name+")"
						if (mBody.code) dspMsg += " ("+mBody.code+")"
						addNotification(dspMsg,"red",60);
						break;
					default :
						cbMessage(mBody);
				}
			}
			catch(e) {
				rawConsole.log("Exception/ws message", e);
				cbMessage("exception traitement")
				addNotification("Erreur: " + wsUrl + " e=" + e.toString(), "red");
				ws.close()
			}
		};
		ws.onopen = async (ev) => {
			rawConsole.log('WS connecté id=',wsId,'ephemere:',webAuth.ephemere)
		};
		ws.onclose = (ev) => {
			wsLastClose = ev.code;
			rawConsole.log("WS close (id,code,msg):",wsId,wsLastClose,ev);
			clearTimeout(wsTimerPing)
			cbStatus(wsStatus=0);
			// Si la connexion est perdu...
			displayInfo({
				titre:"Déconnecté du server multijoueurs "+wsUrl+ " (code:"+wsLastClose+")",
				body: [
					"Tu as été déconnecté de SyncServer, le serveur de synchronisation multi-joueurs de la Grande Peluche",
					"Raison: "+ ev.code + " ("+ (ev.reason || "sans libellé")+")" ,
					(ev.code==4000)?
						{ cls:"blinkMsg cOrange",
							txt: "Si tu as changé d'équipement ou de navigateur, clique sur 🆘 en bas à droite"}
					:
					(ev.code==4900)?
						{ cls:"blinkMsg cRed",
							txt: "Je ne souhaite plus communiquer avec toi."}
					:							
					(ev.code==4999)?
						{ cls:"blinkMsg",
							txt: "Le server va redémarrer (mise à jour, upgrade système, patch de sécurité urgent...). Quitte puis relance dans quelques secondes."}
					:							
						{ cls:"blinkMsg cRed", 
							txt: "Erreur technique, quitte puis relance. Tu peux voir le détail en cliquant sur 🆘 en bas à droite (etat)" }
				],
			});
		};
		ws.onerror = (ev) => {
			clearTimeout(wsTimerPing)
			cbStatus(wsStatus=2)
			addNotification("Erreur avec "+wsUrl+", utilise le bouton 🆘","red",60);
		}; 
	}
	catch(e) {
		console.log("*****  connectToServer",e)
	}
};


///////////////////////////////////////////////////////////////////////////////////////
// API management
///////////////////////////////////////////////////////////////////////////////////////

// Retourne toujours un objet ou null
export async function apiCallExtern(url,method,body,quiet)
{
	try {
		const res = await fetch(url, {
			method: method? method: 'GET', 	
			mode: "cors",
			cache: "no-cache",
			body: (body)? JSON.stringify(body) : null
		});
		if (res.status >= 300) {
			rawConsole.log("Erreur sur "+url+" : "+ res.status)
			if (!quiet)
				addNotification("Erreur sur "+url+ ": ("+ res.status+ ")", "red", 60);
			addReportError({ dth: Date.now(), msg: "Erreur sur "+url+" : "+ res.status})
			return null
		}
		let r = await res.json()
		r.status = res.status
	  return r
	}
	catch(e) {
		rawConsole.log(e);
		if (!quiet)	addNotification("Erreur imprévue sur "+url,"red",60);
		addReportError({ dth: Date.now(), msg: "Erreur imprévue (exception) sur "+url})
		return null
	}
}

// Metrologie dynamique
let dynMetro = {} // métrologie du dernier apiCall
export function getDynMetro() { return dynMetro }
export function getEpsilon() { return Math.round(dynMetro.epsilon || 0.0) }
export function getLatence() { return dynMetro.srv && (Math.round(Math.floor(1000*(( (dynMetro.cliRes - dynMetro.cliReq) - (dynMetro.srv.load + dynMetro.srv.run + 1.0) ) / 2.0))/1000))
}


// appel api de la grande peluche: url, mehod, body,
// noWaitWS: ne pas attendre le WS pour l'api call
// forcePseudo: force l'usage d'un pseudo "transiant"
export async function apiCall(url,method, body, noWaitWs, forcePseudo)
{
	try {
		// le WS doit être connecte pour disposer de la clef crypto éphémère... sauf demande exlicite
		if (wsStatus!=1 && !noWaitWs) {
			// si besoin attente de la synchro avec la clef signée et queue la requete API et await le dequeue
			await waitWsForAPI(url) 
		}
		// rawConsole.log("API Call",url);
		const user = forcePseudo || loadIt("pseudo","-nondefini-")
		const wa = loadIt("webAuth",null)
		// clef éphémère ou précedent ou init, permet l'appel si nowait sur WS
		// const pwd = loadIt("pseudoPwd", "00000000-0000-4000-8000-000000000000")
		dynMetro.cliReq = performance.now()
		const res = await fetch(urlApi+url+
														"?u="+user+
														"&p="+(wa.ephemere || "00000000-0000-4000-8000-000000000000"), {
			method: method? method: 'GET', mode: "cors", cache: "no-store",
			body: (body)? JSON.stringify(body) : null 
		});

		dynMetro.cliRes = performance.now()
		dynMetro.cliDth = Date.now()
	  let json = JSON.parse(await res.text(),reviver) // parse reponse serveur - usge de text pour json avec reviver
		// gestion du cas ou l'objet est déjà sérilisé dans le message 
		if (json.msgIsJson && json.o==null) json.o = JSON.parse(json.msg,reviver)
		// metrologie depuis le serveur
		dynMetro.srv = json.tr || {load: 1.0, run:1.0, dth:Date.now() } // load: lecture requete, run: exécution requete, dth: timestamp serveur
		// calcul ecart temporel dynamique - disponible par import getEpsilon() ou getMetro()
		// TODO: prévoir un lissage statistique local pour éviter les pics de latence ??
		dynMetro.epsilon = dynMetro.cliDth -
			( ( (dynMetro.cliRes - dynMetro.cliReq) - (dynMetro.srv.load + dynMetro.srv.run + 1.0) ) / 2.0 )
			- dynMetro.srv.dth
		// si erreur
		if (res.status >= 300) {
			addNotification("Erreur sur "+urlApi+url+ ": "+json.msg+ "("+ res.status+ ")", "red", 60);
			addReportError({ dth: Date.now(), msg: "Erreur sur "+urlApi+url+" : "+ res.status})
		}
		// force le status hhtp disponible directement dans le json.
		json.status = res.status
		return json
	}
	catch(e) {
		rawConsole.log(e);
		addNotification("Erreur imprévue sur "+urlApi+url,"red",60);
		addReportError({ dth: Date.now(), msg: "Erreur (exception) sur "+urlApi+url})
		return { status: 503 };
	}
}

///////////////////////////////////////////////////////////////////////////////////////
// GESTION DU STOCKAGE
///////////////////////////////////////////////////////////////////////////////////////
export function loadIt(cle,defaut)
{
	// rawConsole.log("loadIt:", cle,defaut)
	let valeur = localStorage.getItem(cle)
	if (valeur==null) return defaut
	try { return JSON.parse(valeur) }
	catch(e) {
		rawConsole.log("loadIt erreur: ",cle,defaut,e)
		return defaut
	}
}

export function storeIt(cle,valeur)
{
	let xVal = JSON.stringify(valeur)
	// rawConsole.log("storeIt:", cle);
	localStorage.setItem(cle, xVal)
	return valeur
}

export function removeIt(cle)
{
	localStorage.removeItem(cle)
}

export function clearStorage()
{
	if (confirm("Attention, si tu effaces tes données locales, "+
							"tu devras contacter Kikiadoc sur discord pour "+
							"t'autoriser une nouvelle identification sécurisée "+
							"\nTu devras resaisir tout ce que tu as déjà indiqué "+
							"pour continuer un challenge en cours!  Es-tu sûr ?")) {
		localStorage.clear()
		location.reload()
		alert("Tes données locales ont été effacées")
	}
	return;
}

/////////////////////////////////////////////////////////////////////
// gestion des haut fait
/////////////////////////////////////////////////////////////////////
// positionne un haut fait
export async function setHautFait(hf,lvl) {
	if (hf && lvl) {
		const ret = await apiCall("/hautsFaits/"+hf+"/"+lvl,'PUT');
		const lbl = (ret.o && ret.o.libelle) || hf
		if (ret.status==200) addNotification("Haut fait "+lbl+" dejà obtenu","lightgreen",5)
		if (ret.status==201) addNotification("Haut fait "+lbl+" obtenu","yellow",10)
	} 
}
// recupere un haut fait avec les pseudos l'ayant obtnue
export async function getHautFait(hf) {
	const ret = await apiCall("/hautsFaits/"+hf,'GET');
	if (ret.status==200) return ret.o
	// si introuvable dans tous les cas, liste vide
	return null
}

/////////////////////////////////////////////////////////////////////
// gestion des clic dynamiques
/////////////////////////////////////////////////////////////////////
// appele sur onclick d'un element parent d'une cible qui n'a pas l'attribut
// pour usage lors du bubble de l'event
export function markClick(e) {
	// rawConsole.log("markclick",e.toString())
	e.gpHelp ??= e.currentTarget.getAttribute("gphelp")
	e.gpImg ??= e.currentTarget.getAttribute("gpImg")
	e.gpImgClass ??= e.currentTarget.getAttribute("gpImgClass")
	e.gpVideo ??= e.currentTarget.getAttribute("gpVideo")
	e.gpNotif ??= e.currentTarget.getAttribute("gpNotif")
	e.gpLink ??= e.currentTarget.getAttribute("gpLink")
	e.gpColor ??= e.currentTarget.getAttribute("gpColor")
	e.gpTimeout ??= e.currentTarget.getAttribute("gpTimeout")
	e.gpDing ??= e.currentTarget.getAttribute("gpDing")
}
/////////////////////////////////////////////////////////////////////
// fonction nop (usage dans les callbacks)
/////////////////////////////////////////////////////////////////////
function nop(e) { rawConsole.log('e=',e) }

/////////////////////////////////////////////////////////////////////
// Gestion des tags countdown
/////////////////////////////////////////////////////////////////////
// gestion des countdown
let timerCountdownId = null
// countDownInit usage avec use: sur countdown
export function countDownInit(node) {
	let dth = parseInt(node.getAttribute("dth"),10)
	node.innerHTML = countDownTo(dth)
}
// triement périodique pour les coundown sur timer ou sur compteur
// dans le cas d'un compteur, on peut récup la valeur actuelle dans l'attribut curval
// curval peut-être >0, 0 ou <0
function timerCountDown() {
	// rawConsole.log("timerCoundDownStart")
	let tblElt = Array.from(document.getElementsByTagName('countdown'))
	// rawConsole.log("tblElt",tblElt)
	let nb = tblElt.length
	// rawConsole.log('countdown #elt in dom:',nb)
	for (let elt of tblElt) {
		let tDth=elt.getAttribute("dth")
		if (tDth) {
			// cas du timer
			let dth = parseInt(tDth,10)
			// si timer deja echu, ne fait rien
			if (dth==0) continue // countdown suivant
			if (dth>Date.now())
				elt.innerHTML = countDownTo(dth)
			else {
				elt.setAttribute('dth',"0")
				elt.innerHTML = elt.getAttribute('txtTimeout') || "00:00:00"
				// propage l'event timeout
				// rawConsole.log("event cdTimeout (dth):", dth)
				elt.dispatchEvent(new Event("cdTimeout",{ bubbles: true} ))
			}
			continue // countdown suivant
		}
		let tCnt=elt.getAttribute("cnt")
		if (tCnt) {
			// cas du compteur
			let cnt = parseInt(tCnt,10)
			let step = parseInt(elt.getAttribute("cntstep"),10) || 1
			let tStart = parseInt(elt.getAttribute("cntdth"),10) || 1
			// calcul de la valeur : Date.now()-tStart est le nombre de ms a prendre en compte
			let current= cnt - ((step * (Date.now()-tStart) / 1000))
			elt.setAttribute('curval',current)
			if (current > 0) {
				elt.innerHTML = String(Math.floor(current))
			}
			else if (elt.getAttribute('over')) {
					// le compteur est deja "over" on ne fait rien
			}
			else {
				elt.setAttribute('over',1)
				elt.innerHTML = elt.getAttribute('txtTimeout') || "0"
				elt.dispatchEvent(new Event("cdTimeout",{ bubbles: true} ))
			}
			continue // countdown suivant
		}
	}
	// rawConsole.log("timerCoundDownEnd")
}
export function startCountDown() {
	timerCountdownId = setInterval(timerCountDown,1000)
	timerCountDown()
	rawConsole.log("startCountdown")
}
export function stopCountDown() {
	clearInterval(timerCountdownId)
	rawConsole.log("stopCountdown")
	timerCountdownId = null
}

//////////////////////////////////////////////
// changement de l'orientation (pour smarphone)
//////////////////////////////////////////////
export function orientationChange(e) {
	let type = e?.target?.type
	let angle = e?.target?.angle
	rawConsole.log("orientationChange",type,angle)
	// if (type?.startsWith("portrait")) {	exitFullScreen() }
	// if (type?.startsWith("landscape")) {	enterFullScreen()	}
}
export function enterFullScreen() {
	let divVideo = document.getElementById("divVideo")
	let divFull = document.getElementById("kikiFullArea")
	if (divFull)
		divFull.requestFullscreen().then(nop).catch(nop)
	else if (window.getComputedStyle(divVideo).getPropertyValue("display") != "none")
		divVideo.requestFullscreen().then(nop).catch(nop)
}
export function exitFullScreen() {
	document.exitFullscreen().then(nop).catch(nop)	
}
/////////////////////////////////////////////////////////////////////
// Gestion du wakelock / visibility 
/////////////////////////////////////////////////////////////////////
let myWakeLock = null
async function requestWakeLock() {
	try {
		if (! navigator.wakeLock) return rawConsole.warn("WakeLock non disponible dans le navigateur")
		if (isDiscord) return rawConsole.warn("WakeLock non disponible dans discord embedded")
		if (myWakeLock) return rawConsole.log("*** Wakelock deja actif")
		rawConsole.log("requestWakeLock");
		myWakeLock = await navigator.wakeLock.request();
		myWakeLock.addEventListener('release', (e)=>{rawConsole.log('*** WakeLock released:',e,myWakeLock.released);myWakeLock=null } )
		rawConsole.log('WakeLock activé')
	}
	catch (err) { rawConsole.log("Erreur WakeLock", err) }
}
export function visibilityChange() {
	rawConsole.log('visibilityChange', document.visibilityState);
	let tblElt = document.getElementsByTagName('audio')
	let nb = tblElt.length
	switch(document.visibilityState) {
		case "visible":
			audioResume()
			requestWakeLock()
			for (let i = 0; i<nb; i++) {
				let elt = tblElt.item(i)
				if (elt.getAttribute("gpMute")) mediaPlay(elt)
			}
			break;
		case "hidden":
			// myWakeLock?.release()
			if (!document.getElementById("musique")?.gpBack) audioPause()
			for (let i = 0; i<nb; i++) {
				let elt = tblElt.item(i)
				if (elt.getAttribute("gpMute")) elt.pause()
			}
			break;
	}
}

/////////////////////////////////////////////////////////////////////
// Gestion du serviceWorke
/////////////////////////////////////////////////////////////////////
let swcReady = false
let swcCtx = { id:0, queue:[]}
// Activation Reception des messages depuis le service worker
export function swcSetup() {
	// rawConsole.log("serviceWorker in navigator",("serviceWorker" in navigator))
	if (! ("serviceWorker" in navigator) ) {
		rawConsole.log("swcSetup annule, serviceWorker non disponinle")
		addNotification("Métacache: Ton navigateur ne permet pas l'usage d'un service worker","red",20)
		return false
	}
	// rawConsole.log("swcSetup actif:",)
	if (! navigator.serviceWorker.controller ) {
		if (isDiscord)
			rawConsole.log("isDiscord: pas d'activation métacache")
		else
			addNotification("Métacache non activée, recharge par F5, si soucis utilise le bouton 🆘","red",60)
		return false
	}
	// rawConsole.log("swc Listener Setup", navigator.serviceWorker.controller)
	navigator.serviceWorker.addEventListener("controllerchange", (e) => {
		rawConsole.log("swcSetup controllerchange",e)
	})
	navigator.serviceWorker.addEventListener("messageerror", (e) => {
		rawConsole.log("swc messageerror",e)
	})
	navigator.serviceWorker.addEventListener("message", (m) => {
		// dispatch du message
		// rawConsole.log("swc Received:",m)
		// rechercche la transaction selon l'id
		let i = swcCtx.queue.findIndex( (q) => q.id==m.data.id )
		if (i<0) { console.error("wsc: id recu non prevu",m.data.id); return }
		// supprime de la queue et resoud la promesse associé a l'id
		// rawConsole.log("swc: premise ok:",i,swcCtx,m,typeof swcCtx.queue[i].ok)
		swcCtx.queue[i].ok(m.data)
		swcCtx.queue = swcCtx.queue.toSpliced(i,1)
		// rawConsole.log("swv: dequeue",i,swcCtx)
	})
	// marque le ready pour l'IHM
	swcReady = true
	rawConsole.log("swcSetup setup:",swcReady,navigator.serviceWorker.controller.scriptURL)
	return swcReady
}
// Envoi d'un message sur le swc, 
// retourne null (si pas de timeout) ou une promesse de reponse (si timeout, reponse=null)
// pour être traité, o doit contenir un champ op indiquant l'opération
async function swcSend(o,timeout) {
	if (!swcReady) return addNotification("serviceWorker non disponible","red",20)
	let swc=navigator.serviceWorker.controller
	swcCtx.id++
	rawConsole.log("swcSend",swcCtx.id,o)
	let p = (!timeout)? null :
		new Promise((ok) => {
			swcCtx.queue.push({ id: swcCtx.id, ok: ok, o: o})
			setTimeout(ok, timeout, null)
		})
	swc.postMessage({id: swcCtx.id, o: o})
	return p
}
/////////////////////////////////////////////////////////////////////
// Gestion du meta-cache
/////////////////////////////////////////////////////////////////////
export async function metaCacheTest() {
	displayObject(await swcSend({op:"metaCacheTest"},10000) || "Metacache non disponible ou Timeout")
	rawConsole.log("metaCacheTest End")
}
export async function metaCacheList() {
	displayObject(await swcSend({op:"metaCacheList"},10000) || "Timeout MetaCacheList")
	rawConsole.log("metaCacheList End")
}
export async function metaCacheClear() {
	if (!confirm('Effacer le cache de MétaCache?')) return
	displayObject(await swcSend({op:"metaCacheClear"},10000) || "Timeout MetaCacheClear")
	rawConsole.log("metaCacheClear End")
}
// retourne la liste des éléments non résolus
// pas de return direct pour evioter les références aux premies
export function swcGetWaitingIds() {
	let waiting = []
	swcCtx.queue.forEach( (e) => waiting.push({ id: e.id, o: e.o}))
	return { msg:"idReq en attente de synchro:", waiting: waiting }
}

/////////////////////////////////////////////////////////////////////
// clignotement de la bannière
/////////////////////////////////////////////////////////////////////
export function startBlinkGlobal() {
		const elt=document.getElementById('blinkGlobal')
		if (!elt) return rawConsole.log("blinkGlobal non défini dans le dom")
		elt.style.setProperty('display',"block")
		elt.style.setProperty('animation-play-state',"running")
		setTimeout(()=>{
			elt.style.setProperty('animation-play-state',"paused")
			elt.style.setProperty('display',"none")
		},3000)
	}

/////////////////////////////////////////////////////////////////////
// Gestion des médias Audio, Video, Ding et TTS.
/////////////////////////////////////////////////////////////////////
// Handler/dump d'une erreur media
function mediaError(e) {
	console.error("media onerror/abort event",e)
	displayError({
		titre:'FAIT UN SCREEN puis utilise le bouton 🆘',
		back:'rouge', ding:'explosion',
		body:[
			'Erreur media imprevue eventType='+e.type,
			e.srcElement?.src,e.srcElement?.error?.code,e.srcElement?.error?.message,
			e.target?.src,e.target?.currentSrc,e.target?.error?.code,e.target?.error?.message
		]
	})
}
// media play sur le dom, si pas resume, reset le pipeline de lecture
export function mediaPlay(dom,resume) {
	const domSrc=dom.src
	const domId=dom.id
	rawConsole.log("mediaPlay",domId,domSrc)
	// gestion du bug pour reset pipeline en cas de pipeline broken sur error video
	if (!resume) {
		rawConsole.log('Pipeline reset pour',domId,domSrc)
		dom.pause() // gestion du cas de media en cours, par précaution (noop si pas playing)
		dom.load() // reset du pipeline pour éviter les abort error 
	}
	dom.play()
		.then((e)=>rawConsole.log("mediaPlayOk",domId,domSrc)) 
		.catch((e)=> {
			const msg = e.toString()
			if (msg.indexOf('NotAllowedError')>=0) {
				// le play n'est pas encore possible
				if (domId=="video") {
					displayError({ titre:"Protection par ton navigateur",
												body:["La lecture vidéo automatique n'est pas possible au chargement du site",
															"Il faut que tu cliques sur la vidéo pour la visionner",
														 ],
												trailer:"Ferme ce popup et clique sur la vidéo"
											})
				}
				else if (domId=="musique") {
					rawConsole.log("** mediaPlay: NotAllowedError Musique désactivée avant clic")
				}
				else {
					rawConsole.log("** mediaPlay: NotAllowedError sur:",domId)
				}
				return
			}
			if (msg.indexOf('AbortError')>=0) {
				// le play a ete interrompu 
				rawConsole.log("*** AbortError (domId,msg)",domId,msg)
				return
			}
			if (msg.indexOf('NotSupportedError')>=0) {
				// erreur de media 
			}
			displayError({
				titre:'FAIT UN SCREEN ET utilise le bouton 🆘',
				back:'rouge', ding:'explosion', 
				body:[
					'Erreur media imprevue dans mediaPlay().catch:',
					msg,
					'domId: '+domId,
					'media: '+domSrc
				]
			})
		})
}
export function firstClick() {
	document.premierClickOk = true
	if (! document.getElementById("musique")?.gpAmbiance)
		addNotification("Musique d'ambiance désactivée, clic sur 🔇 en haut à droite pour la réactiver","orange",5)
	playMusic()
}

/////////////////////////////////////////////////////////////////////
// Gestion des parametres audio
/////////////////////////////////////////////////////////////////////
// Mofif des options audios (init ou sur effet)
export function audioInit(gState) {
	rawConsole.log('audioInit')
	gState.audioVolume= loadIt('audioVolume',30)
	gState.audioBack= loadIt('audioBack', false)
	gState.audioAmbiance= loadIt('audioAmbiance', true)
	gState.audioTTS= loadIt('audioTTS', 100)
}
export function audioSetup(vol,back,ambiance,tts) {
	rawConsole.log("setupAudio (vol,playBackground,ambiance,tts):",vol,back,ambiance,tts)
	const domMusique=document.getElementById("musique");
	const domDing=document.getElementById("ding");
	const domTTS=document.getElementById("tts");
	const domVideo = document.getElementById("video");
	if (!domMusique || !domDing || !domTTS || !domVideo)
		return console.error("setupAudio, dom not ready")
	// sauvegarde le contexte dans le DOM
	storeIt('audioVolume', vol)
	storeIt('audioTTS', tts)
	storeIt('audioBack', back)
	storeIt('audioAmbiance', ambiance)
	domMusique.gpVolume = vol/100
	domMusique.gpAmbiance = ambiance
	domMusique.gpBack = back
	domDing.gpVolume = vol/100
	domVideo.gpVolume = vol/100
	domTTS.gpVolume = tts/100
	domTTS.volume = tts/100
	if (ambiance)
			audioResume()
	else
			audioPause()
	return ambiance
}


// test si un DOM e est en cours de media playing
export function isPlaying(e) {
	return e && e.currentTime > 0 && !e.paused && !e.ended && e.readyState > 2;
}

// pause l'audio, audioDom facultatif
export function audioPause() {
	let ap= document.getElementById("musique")
	if (!ap) return rawConsole.log("dom Musique not ready")
	rawConsole.log("audioPause (ambiance,vol): ",ap.gpAmbiance, ap.gpVolume)
	if (ap.src?.indexOf("mp3")>0) ap.pause()
}

// resume l'audio si pas de video en cours
export function audioResume() {
	const ap= document.getElementById("musique");
	const vp= document.getElementById("video");
	if (!ap) return rawConsole.log("dom Musique not ready")
	if (!vp) return rawConsole.log("dom Video not ready")
	// si video en cours ne pas resume l'audio
	if (isPlaying(vp)) return rawConsole.log('audioResume: Video playing, no resume')
	// recalc le volume car il ests peut être modifié
	if (ap?.src?.indexOf("mp3")>0 && ap?.gpAmbiance) {
		ap.volume = Math.min(1.0,ap.gpDesc.vol*ap.gpVolume)
		rawConsole.log("audioResume (ambiance,vol,src):",ap.gpAmbiance, ap.gpVolume, ap.src)
		mediaPlay(ap,true)
	}
}

// recup les caractéristiques d'une audio
function getDescAudioByName(nom) {
	const desc = AUDIODESCS[nom]
	if (desc) return desc
	addNotification("AudioBlaster: pas équalisée: "+nom,"yellow",10)
	return null
};

export function soundEnded() {
	rawConsole.log("event Musique ended");
	const ap=document.getElementById("musique");
	playMusic((ap.gpDesc?.repeat)? ap.gpDesc?.nom : loadIt('lastMusic',"peergynt"))
}

export function playMusic(music,force) {
	const ap=document.getElementById("musique")
	if (!ap)	return addNotification("playMusic DOM not ready")
	// setup handler si besoin
	if (!ap.onerror) ap.onerror = function(e) {	 mediaError(e) }
	if (!ap.onended) ap.onended = soundEnded
	const nom = music || loadIt('lastMusic',"intro")
	let desc = getDescAudioByName(nom) || AUDIODESCS.oracle
	if (desc.repeat) storeIt('lastMusic',nom) // pour reprise
	// si pas force et meme musique et encore en cours...
	let oldURI = ap.gpDesc?.mp3
	let newURI = desc.mp3
	rawConsole.log("old music:",oldURI,"new:",newURI)
	if (!force && (oldURI == newURI ) && isPlaying(ap) )
		return rawConsole.log("playMusic: Musique inchangée",newURI)
	// sauvegarde des trucs dans le dom element
	ap.gpDesc=desc
	ap.volume = Math.min(1.0,desc.vol*ap.gpVolume || 0)
	ap.src = urlCdn+encodeURI(desc.mp3)
	// si ambiance et premier clic...
	const canPlay = ap.gpAmbiance && document.premierClickOk
	rawConsole.log("playMusic: (canPlay,ambiance,locVol,gblVol,calcVol,src)",canPlay,ap.gpAmbiance,ap.gpDesc.vol,ap.gpVolume,ap.volume,ap.src)
	if (ap.gpAmbiance) mediaPlay(ap) // le cas du first click sera traite par exeception
}

export function playDing(mp3) {
	let ap=document.getElementById("ding")
	if (!ap) return addNotification("playDing dom not ready","red",10)
	let desc= getDescAudioByName(mp3) || AUDIODESCS.Ding
	// setup handler si besoin
	if (!ap.onerror) ap.onerror = function(e) {	 mediaError(e) }
	if (desc.ifDingPause) {
		ap.onended = audioResume
		audioPause()	
	}
	else {
		ap.onended = null
	}
	ap.gpDesc= desc
	ap.src= urlCdn+desc.mp3
	ap.volume = Math.min(1.0,desc.vol*ap.gpVolume || 1)
	mediaPlay(ap)
}

let videoMp4=null // nom logique du m4 en cours
let videoCbClose=null // callback actuelle de la video appelé on close de la fenetre video
let videoCbLue=null // callback actuelle de la video appelé si toute la vidéo a été lue
let videoDuree=null // duree de la video
let videoLastStart=null // dth demarrage
let videoTotal=0 // durée de visionnage
function videoInitTrack(mp4,cb,cbLu) {
	videoMp4 = mp4
	videoCbClose=cb
	videoCbLue=cbLu
	videoDuree=null
	videoLastStart=null
	videoTotal=0
}
function videoCumul(e) {
	if (!videoLastStart) return // rien à cumuler
	videoTotal += Date.now() - videoLastStart
	videoLastStart = null
	rawConsole.log("Duree lecture actuelle",videoMp4,videoTotal)
}
function videoPauseEvt(e) {
	rawConsole.log("video onpause evt")
	videoCumul(e)
	audioResume()
}
function videoEndEvt(e) {
	rawConsole.log("video onend evt",e)
	videoDuree=e.srcElement?.duration*1000 || 999999
	videoCumul(e)
	rawConsole.log("video onend tracking (cb,duree,total):",videoMp4!=null,videoDuree,videoTotal)
	if (videoCbLue) videoCbLue(videoMp4,videoDuree,videoTotal)
	videoInitTrack(null,null,null) // reset lle tracking
	audioResume()	
}
function videoPlayEvt(e) {
	videoLastStart = Date.now()
	rawConsole.log("video onplay evt")
	audioPause()
}
function videoDurationEvt(e) {
}


// cb sera appeleé lors du close video, cbLu en fin de lecture
// tTime == "d,e" ou d est le début et e la fin (tTime optionnel)
export function playVideo(mp4,cb,tTime,cbLu) {
	let divVideo = document.getElementById("divVideo")
	let video = document.getElementById("video")
	if (!mp4 || !divVideo || !video) return rawConsole.log("ERREUR: tag introuvable ou pas de mp4",mp4)
	if (!divVideo.gpInit) {
		// init des handler
		divVideo.gpInit=true
		video.oncanplay = function(e) { rawConsole.log("video canplay evt") }
		video.oncanplaythrough = function(e) { rawConsole.log("video canplaythrough evt") }
		video.onemptied = function(e) { rawConsole.log("video emptied evt") }
		video.onloadedmetadata = function(e) { rawConsole.log("video loadedmetadata evt") }
		video.onloadeddata = function(e) { rawConsole.log("video loadeddata evt") }
		video.onstalled = function(e) { rawConsole.log("video onstalled evt") }
		// video.onsuspend = function(e) { rawConsole.log("video onsuspend evt") }
		video.onwaiting = function(e) { rawConsole.log("video onwaiting evt") }
		video.ondurationchange = videoDurationEvt
		video.onplay = videoPlayEvt
		video.onended = videoEndEvt
		video.onpause = videoPauseEvt 
		video.onerror = mediaError
		// video.onabort = mediaError
		// video.onabort = function(e) { rawConsole.log("video onabort evt") }
	}
	const desc = VIDEODESCS[mp4]
	if (!desc) {
		rawConsole.log("***** video sans normalized: ",mp4)
		addNotification("Audioblaster: Pas équalisée: "+mp4,"yellow",10)
	}
	//setup des callback sur la video
	videoInitTrack(mp4,cb,cbLu)
	// affichage, calul volume et src
	divVideo.style.display="block"
	video.volume= Math.min(1.0, (video?.gpVolume && desc?.vol) ? (video.gpVolume*desc.vol) : 2 ) // calcul du volume video
	video.src=urlCdn+ ( (desc)? desc.mp4 : mp4 ) +".mp4" + "?v=" + desc?.v + ((tTime)? "#t="+tTime :"#t=0") ;
	rawConsole.log("playVideo",video.src,"desc",desc,
							"videoVolume",video.gpVolume,"volCalcul",video.volume,
							"premierClick",document.premierClickOk)
	// Play la video, la gestion de la propriété premierClickOk est dans mediaplay
	mediaPlay(video)
}

export function closeVideo() {
	//ne doit être appelée que si le dom a un divVideo et un video
	let divVideo = document.getElementById("divVideo");
	let video = document.getElementById("video");
	video.pause()
	divVideo.style.display="none";
	audioResume();
	if (videoCbClose) videoCbClose()
	videoInitTrack(null,null,null) // reset lle tracking
}

	// ordre de jouer un truc multimedia (depuis le serveur)
export function wsMedia(o) {
	switch(o.type) {
		case 'mp4': 
			if (o.delai)
				setTimeout(playVideo,1000*o.delai,o.mp4,null,null, (o.autoclose)? closeVideo:null )
			else
				playVideo(o.mp4,null,null, (o.autoclose)? closeVideo:null)
			return
		default: console.error ("bad wsMedia:",o)
	}
}
/////////////////////////////////////////////////////////////////////
// TTS
/////////////////////////////////////////////////////////////////////
let etatTTS = { dth:0, files: [] }
// ajouote en TTS les infos recues du server (m)
export function tts(m,force) {
	rawConsole.log("tts:",m)
	if (force) etatTTS.files = []
	etatTTS.dth=Date.now()
	if (Array.isArray(m.o))
		m.o.forEach((e)=>etatTTS.files.push(e))
	else
		etatTTS.files.push(m.o)
	tryTTS(force)
}
// ajoute en TTS un texte qui doit déjà être stocké sur le CDN 
// le nom du fichier utilisé sera le texte encode facon URI 
export function addTexteTTS(texte, force) {
	etatTTS.files.push({ statique: true, file: escapeTexte(texte)+".mp3" })
	tryTTS(force)
}
export function tryTTS(force) {
	try {
		let elt = document.getElementById('tts')
		let now = Date.now()
		// attend si pas force, playing et que playing depuis moins de 15 seconde
		if (!force && elt.gpPlaying && (elt.gpPlaying+15000>now)) return rawConsole.log("TTS playing") // attente erreur ou end
		elt.gpPlaying=0
		let next = etatTTS.files.shift()
		if (!next) return rawConsole.log("TTS: no file in queue")
		elt.gpPlaying=now
		elt.gpRef=next.file
		if (next.statique)
			elt.src = urlCdnTTS+next.file
		else
			elt.src = "https://ff14.adhoc.click/grimoire/"+next.file
		if (next.flash) startBlinkGlobal()
		mediaPlay(elt)
	}
	catch(e) {
		console.error('try tts',e)
	}
}
/////////////////////////////////////////////////////////////////////
// Ajout dynamique de script (surveillé par le CSP) 
/////////////////////////////////////////////////////////////////////
// ajoute un tag script, retourne la promise
export function addScriptTag(id,url) {
	return new Promise((ok)=>{
		// la promise retourne null si ok ou le nom de l'ID si erreur
		// verifie si deja chargé
		if (document.getElementById(id)) { 
			rawConsole.log(id+" déja chargé")
			// addNotification(id+" déja chargé","green",2)
			ok(null);
			return
		}
		const heads = document.getElementsByTagName("HEAD")
		if (heads.length != 1) return alert("nb HEAD invalide != 1")
		const newScript = document.createElement('script')
		newScript.id = id
		newScript.crossorigin = true
		// append avant les autres attributs
		heads[0].appendChild(newScript)
		// gestion des events AVANT le src
		newScript.onload = function () {
			newScript.gpDthLoad = Date.now()
			rawConsole.log("addScriptTag: onload(id,ms):",id,ssms(newScript.gpDthLoad-newScript.gpDthStart))
			// addNotification(id+" chargé","green",2)
			ok(null) // close promise
		}
		newScript.onerror = function (e) {
			newScript.gpDthError = Date.now()
			rawConsole.log("Erreur Load Script:",id,e)
			addNotification("Erreur chargement "+id,"red",30)
			// supprime le tag du DOM
			newScript.remove()
			ok(id) // close promise ok meme en erreur
		}
		// chargement du script
		newScript.gpDthStart=Date.now()
		newScript.src = url
		// rawConsole.log(".src ok",id, Date.now()) 
	})
}

/////////////////////////////////////////////////////////////////////
// Gestion du CSP
/////////////////////////////////////////////////////////////////////
export function securitypolicyviolation(e) {
	try {
		rawConsole.log("Gestion de la securitypolicyviolation: ",e)
		displayError({
			titre:"DEEPCHECKSEC: ALERTE SECURITE, PAS DE PANIQUE", back: "rouge",
			trailer:"Après le screen et le mp Kikiadoc, recharge le site",
			body: [
				null,
				"DeepCheckSec a interrompu un comportement inapproprié de ton navigateur.",
				"IMPORTANT: FAIT UN SCREEN ET CONTACTE IMMEDIATEMENT KIKIADOC",
				null,
				"Stratégie sécurité concernée: "+e?.effectiveDirective,
				"URI non valide: "+e?.blockedURI,
				"DocumentURI: "+e?.documentURI,
				"Source @l,c: "+e?.sourceFile+" @"+e?.lineNumber+","+e?.columnNumber,
				"Stratégie sécurité active:"+e?.originalPolicy
			],
			ding: "AlarmeSecurite"
		})
		const body = {
			effectiveDirective: e?.effectiveDirective,
			blockedURI: e?.blockedURI,
			documentURI: e?.documentURI,
			sourceFile: e?.sourceFile,
			lineNumber: e?.lineNumber,
			columnNumber: e?.columnNumber,
			originalPolicy: e?.originalPolicy
		}
		apiCall("/securityReport/csp","POST",body)
		
	}
	catch(err) {
		console.error('Erreur dans securitypolicyviolation', err)
	}
}
/*
export function generateSecurityAlert(type) {
	if (!confirm("Je vais faire provoquer un test de cybersécurité du site en conditions réelles mais sans risque, tu dois entendre une alerte stridente de 20 secondes, et tu devras peut-être recharger le site par F5.\nPS: Si l'alerte se déclenche, inutile de contacter Kikiadoc, mais si elle ne se déclenche pas, alors contacte immédiatement Kikiadoc\nTu es OK?"))
				return
	switch (type) {
		case 1:
			addScriptTag("checkSecTestScript","https://pipotruc.com/deepCheckSecSecurityTest.js")
			break
		case 2:
			const heads = document.getElementsByTagName("HEAD")
			if (heads.length != 1) return alert("nb HEAD invalide != 1")
			const newScript = document.createElement('script')
			const txtNode = document.createTextNode("alert('DEEPCHECKSEC EST DEFAILLANT, CONTACTE KIKIADOC IMMEDIATEMENT')")
			newScript.appendChild(txtNode)
			// append avant les autres attributs
			heads[0].appendChild(newScript)
			break
		case 3:
		default:
			const div = document.getElementById("topPage")
			const img = document.createElement("img");
			const styleAttr = document.createAttribute("style")
			styleAttr.value = "z-index:9999999; top:0px; left:0px; position:fixed; width: 100%; height: 100%"
			const srcAttr = document.createAttribute("src")
			srcAttr.value = "https://www.gstatic.com/images/branding/searchlogo/ico/favicon.ico"
			img.setAttributeNode(styleAttr)
			img.setAttributeNode(srcAttr)
			div.appendChild(img)
			break
	}
}
*/
/*
/////////////////////////////////////////////////////////////////////
// Metrologie 
/////////////////////////////////////////////////////////////////////
async function metrologieSend() {
	let metro = {}
	infoPopup({titre: "Analyse en cours", body: "Je collecte quelques donnes de ton équipement", trailer: "Patiente un peu", back: "papier"})
	metro['typeDevice'] = getTypeEquipement()
	metro['navigator.maxTouchPoints'] = navigator.maxTouchPoints
	metro['navigator.hardwareConcurrency'] = navigator.hardwareConcurrency
	metro['navigator.deviceMemory'] = navigator.deviceMemory
	if (navigator.storage?.estimate)
		metro['navigator.storage.estimate'] = await navigator.storage.estimate()
	else
		metro['navigator.storage.estimate'] = false
	if (performance?.measureUserAgentSpecificMemory)
		metro['performance.measureUserAgentSpecificMemory'] = await performance.measureUserAgentSpecificMemory()
	else		
		metro['performance.measureUserAgentSpecificMemory'] = false
	metro['DeepCheckSecActif'] = window.crossOriginIsolated
	metro['MetaCacheActif'] = swcReady
	let rc = await apiCall('/metrologie/navigateur','PUT',metro)
	infoPopup({body: "Merci "+pseudo})
}
async function metrologieDisplay() {
	let rc = await apiCall('/metrologie/etat')
	if (rc.status==200) dspObject = rc.o
}
async function metrologieClear() { 
	if (!confirm('Supprimer toutes les données de métrologie?')) return
	let rc = await apiCall('/metrologie/etat','DELETE')
	if (rc.status==200) dspObject = rc.o
}
*/


/////////////////////////////////////////////////////////////////////
// Fonctions DEPRECATED, 
// conservées pour faiire fonctionner les pages avant refactoring
/////////////////////////////////////////////////////////////////////
export function clickSur(idName) { console.error("DEPRECATED clickSur") } // plus d'usage
export function scrollTop(domId) { console.error("DEPRECATED scrollTop") } // utilisation de use:
export function playSound(music,force) { console.error("DEPRECATED playSound"); playMusic(music,force)} // usage de playMusic a la place
export function newdisplayInfo(titre,body,trailer,opt) {
	console.error("DEPRECATED newdisplayInfo - utiliser displayInfo(obj)") // version legacy a ne plus utiliser
	let o = (typeof opt=="string")? { img: opt } : (opt || {})
	o.titre=titre; o.body=body; o.trailer=trailer
	displayInfo(o)
}

rawConsole.log("Chargé: common.js")
// common.js
