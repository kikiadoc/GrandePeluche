const APITYPE='test';

// constante de description de l'environnement d'execution
export const isProd = (APITYPE!='test')
export const envName = (APITYPE=='test')? "Staging" : "Prod"

export const urlRaw = 'https://filedn.eu/lxYwBeV7fws8lvi48b3a3TH/'
export const urlImg = 'https://cdn.adhoc.click/V10/'
export const urlCdn = 'https://cdn.adhoc.click/V10/'
export const urlMp3 = 'https://cdn.adhoc.click/V10/'
const urlApi = 'https://api.adhoc.click/api'+APITYPE
const wsUrl = 'wss://api.adhoc.click:443/ws'+APITYPE+'/'

///////////////////////////////////////////////////////////////////////////////////////
// FORMATTAGE ET TEST REGEX
///////////////////////////////////////////////////////////////////////////////////////
function p2(v) { return (v>99)? v.toString() : "00".concat(v).slice(-2) }
function p3(v) { return (v>999)? v.toString() :"000".concat(v).slice(-3) }

export function isPseudoValid(str) { return /^['\-A-Za-z]+$/g.test(str); }
export function isLowerNumeric(str) { return /^[a-z0-9]+$/g.test(str); }
export function alphanum2placer(str) { return (str)? str.replace(/[a-z0-9]/g,"﹇") : str; } 
export function capitalizeFirstLetter(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
export function lowerFirstLetter(str) { return str.charAt(0).toLowerCase() + str.slice(1); }
// arrondi un float selon f (f::= 10,100,1000...)
export function roundFloat(v,f) { return Math.floor(v*(f||10)) / (f||10) }

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

// ms est un nombre de millisecond
export function hhmmss(ms) {
	if (ms) {
		let dth = new Date(ms);
		return p2(dth.getHours())+":"+p2(dth.getMinutes())+":"+p2(dth.getSeconds());
	}
	return "--:--:--";
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
	// console.log("duree:",delta,j,h,m)
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
		return "--:--:--";
	const nbSec = Math.floor( (dth- Date.now()) / 1000);
	if (nbSec <= 0) return "00:00:00";
	const h = Math.floor(nbSec/3600);
	const m = Math.floor( (nbSec - h*3600) / 60);
	const s = Math.floor( nbSec % 60);
	return p2(h) + ":" + p2(m) + ":" + p2(s);
}

export function geUtcMsFrom(y,m,d,hh,mm,ss) {
	return Date.UTC(y, m-1, d, hh, mm, ss)
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
export function hexToUint8Array(hexStr) {
	var bytes = new Uint8Array(Math.ceil(hexStr.length / 2));
	for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
	return bytes
}
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function sortCmp(a,b) {
	// console.log("cmp",a,b)
	return (a<b)? -1: (a>b)? 1 : 0
}

///////////////////////////////////////////////////////////////////////////////////////
// Détection du type d'équipement
///////////////////////////////////////////////////////////////////////////////////////
export function getTypeEquipement() {
	return (window.matchMedia("(pointer: coarse)").matches)? "SM" : "PC";
}
export function isEquipementSmartphone() {
	return (window.matchMedia("(pointer: coarse)").matches)
}
export function isEquipementPC() {
	return ! (window.matchMedia("(pointer: coarse)").matches )
}
///////////////////////////////////////////////////////////////////////////////////////
// AFFICHAGE
///////////////////////////////////////////////////////////////////////////////////////
// scroll a au debut/fin d'un node (usage avec use:)
export function scrollPageToTop(node) {
	// console.log("scroll Page top:",node && node.nodeName)
	// node.scroll({ top: 0, left:0, behavior: 'smooth' })
	setTimeout(()=>document.getElementById("contenu").scroll({top:0, left:0, behavior:'smooth'}), 200);
}
export function scrollNodeToTop(node) {
	console.log("scroll node Tot:",node.nodeName)
	node.scroll({ top: 0, left:0, behavior: 'smooth' })
}
export function scrollNodeToBottom(node) {
	console.log("scroll Node Bot:",node.nodeName)
	node.scroll({ top: node.scrollHeight, left:0, behavior: 'smooth' })
}
///////////////////////////////////////////////////////////////////////////////////////
// notificationn, affichage debug object et infopopup
///////////////////////////////////////////////////////////////////////////////////////
export function addNotification(text,color,timeout,ding) {
	const notifs = document.getElementById("notifications");
	if (notifs==null) { console.log("dom id notifications not found: ",text); return; }
	const div = document.createElement("div");
	const styleAttr = document.createAttribute("style");
	styleAttr.value = "font-size: 0.7em; cursor: pointer; background-color: "+ (color || "green") +"; border-radius: 5px; padding: 5px; margin: 5px; text-align: right";
	div.setAttributeNode(styleAttr);
	div.appendChild(document.createTextNode(text+" ⊗"));
	notifs.appendChild(div);
	const timeoutId = setTimeout(() => {  div.remove() } , (timeout) ? timeout*1000 : 5000 );
	div.onclick= function() { div.remove(); clearTimeout(timeoutId) }
	if (ding)	playDing(ding)
	return null
}

// affichae debug d'un object par propagation du dom (si dspObject non passé en props)
export function newDspObject(o) {
	document.dispatchEvent(new CustomEvent("dspObject", { detail: o }))
}

// popup d'info - refactoring: tout dans l'objet + bubble event
export function infoPopup(o) {
	// titre: string, body: string ou [], trailer: string, back: class
	// img: basename (float 50%), imgFull: basename (top 100%)
	// ding, mp3, autoClose: #sec
	document.dispatchEvent(new CustomEvent("dspInfo", { detail: o }))
}
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
		console.log("API queued en attention validation crypto",url)
	})
	return prom;
}
// Attente du WS pour des msg (indexe par le msg)
async function waitWsForMSG(msg) {
	let prom = new Promise((ok, ko) => {
		msgWaiting.push( {m: msg, o: ok, k: ko})
		console.log("MSG queued en attention validation crypto",msg)
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
export function disconnectFromServer(user) {
	if (ws) {
		console.log("force disconnect: ws close en cours");
		try { ws.close(); ws = null }
		catch(e) { console.log("Erreur close ws", e) }
	}
	else
		console.log("force disconnect: ws non connecté");
}
function wsTimeout() {
	console.log("wsTimeout, soucis de mode background naviateur")
}
function wsPing() {
	// console.log("wsPing",Math.floor(Date.now()/1000))
	clearTimeout(wsTimerPing)
	clearTimeout(wsTimerError)
	if (ws) ws.send( JSON.stringify({op: "ping"} ));
	wsTimerError = setTimeout(wsTimeout, 90000)
}

export async function connectToServer(cbStatus, cbMessage,clientVersion) {
		disconnectFromServer();
		console.log("WS init connect");
    ws = new WebSocket(wsUrl);
		console.log("WS connecting");
		ws.onmessage = (webSocketMessage) => {
			try{
				// console.log("webSocketMessage",webSocketMessage);
  		  const mBody = JSON.parse(webSocketMessage.data);
	      // console.log("MsgFromWs:", mBody);
				// traitement des messages standards
				switch(mBody.op) {
					case "pong" :
						// Reception d'un pong, emission d'un ping sur timer
						clearTimeout(wsTimerError); // annule le timeout d'erreur
					  wsTimerPing = setTimeout(wsPing, 45000); // ping prochain
						console.log("Pong reqVer=",mBody.clientVersion,"cliVer=",clientVersion)
						if (mBody.clientVersion && clientVersion && mBody.clientVersion>clientVersion) {
							addNotification("Nouvelle version disponible, recharge la page (F5)","red",60);
							playDing("call-to-attention")
						}
						break;
					case "elipticKeyOk" :
						console.log("iam...crypto ephemere signée acceptée pat serveur")
						// password temporaire accepté
						storeIt("pseudoDesc",mBody.pseudoDesc)
						let es = loadIt("elipticSecurity",{})
						storeIt("pseudoPwd", mBody.pseudoDesc.pwd);
						wsPing(); // Démarrage de la sequence ping/pong
						cbStatus(wsStatus=1);
						// si apicall en attente, libere l'apicall
						let tmpApiWaiting = apiWaiting
						apiWaiting=[];
						console.log("Release API call en attente de validation crypto ephemere:",tmpApiWaiting.length)
						tmpApiWaiting.forEach( (e) => {console.log("Release APICALL",e.u); e.o()} )
						// si msg en attente, libere les msg
						let tmpMsgWaiting = msgWaiting
						msgWaiting=[];
						console.log("Release MSG call en attente de validation crypto ephemere:",tmpMsgWaiting.length)
						tmpMsgWaiting.forEach( (e) => {console.log("Release MSG",e.m); e.o()} )
						break;
					case "erreur" :
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
	      console.log("Exception/ws message", e);
				addNotification("Erreur: " + wsUrl + " e=" + e.toString(), "red");
			}
	  };
		ws.onopen = async (ev) => { 
			const pseudo = loadIt("pseudo","nondefini");
			const pwd = loadIt("pseudoPwd", "00000000-0000-4000-8000-000000000000");
			let es = loadIt("elipticSecurity", {})
			if (es.jwkPrivateKey==null || es.jwkPublicKey==null) {
				addNotification("Erreur: crypto eliptic root key non définie","red",60)
				ws.close()
				return
			}
			es.newPwd = uuidv4() 
			es.signature = await cryptoSign(pseudo+es.newPwd)
			console.log("iam... creation crypto ephemere signée selon crypto eliptic root")
			ws.send( JSON.stringify(
				{
					op: "iam",
					pseudo: pseudo,
					pwd: pwd,
					lastClose: wsLastClose,
					clientVersion: clientVersion,
					newPwd: es.newPwd,
					publicKey: es.jwkPublicKey,
					signature: es.signature
				} ));
			console.log("iam... demande validation crypto ephemere signée sur server")
		};
		ws.onclose = (ev) => {
			wsLastClose = ev.code;
			console.log("WS close:",wsLastClose);
			clearTimeout(wsTimerPing)
			cbStatus(wsStatus=0);
			// Si la connexion est perdu....
			infoPopup({
				titre:"Déconnecté du server multijoueurs "+wsUrl+ " (code:"+wsLastClose+")",
				body: [
					"Il faut recharger la page ou fermer/ouvrir ta fenêtre du navigateur.",
					"Ce message peut-être normal si tu t'es connecté depuis une autre fenêtre "+
					"ou si ton équipement passe en veille"
				],
				trailer: "En cas de souci, contacte Kikiadoc sur discord"
			});
		};
		ws.onerror = (ev) => {
			clearTimeout(wsTimerPing)
			cbStatus(wsStatus=2);
			addNotification("Erreur avec "+wsUrl+", contacter Kikiadoc sur discord","red",60);
		}; 
  };


///////////////////////////////////////////////////////////////////////////////////////
// API management
///////////////////////////////////////////////////////////////////////////////////////

// Retourne toujours un objet avec un champ status de code http
export async function apiCallExtern(url,method,body)
{
	try {
		const res = await fetch(url, {
			method: method? method: 'GET', 	
			mode: "cors",
			cache: "no-cache",
			body: (body)? JSON.stringify(body) : null
		});
	  const json = await res.json();
		json.status = res.status;
		if (res.status >= 300)
				addNotification("Erreur sur "+url+ ": ("+ res.status+ ") -- contactez Kikiadoc sur discord", "red", 60);
		return json;
	}
	catch(e) {
		console.log(e);
		addNotification("Erreur imprévue sur "+url+ ", contactez Kikiadoc sur discord","red",60);
		return { status: 503 };
	}
}

// Metrologie dynamique
let dynMetro = {} // métrologie du dernier apiCall
export function getDynMetro() { return dynMetro }
export function getEpsilon() { return Math.round(dynMetro.epsilon || 0.0) }

// appel api de la grande peluche: url, mehod, body, noWaitWS: ne pas attendre le WS pour l'api call
export async function apiCall(url,method, body, noWaitWs)
{
	try {
		// le WS doit être connecte pour disposer de la clef crypto éphémère... sauf demande exlicite
		if (wsStatus!=1 && !noWaitWs) {
			// si besoin attente de la synchro avec la clef signée et queue la requete API et await le dequeue
			await waitWsForAPI(url)
		}
		// console.log("API Call",url);
		const user = loadIt("pseudo","nondefini");
		// clef éphémère
		const pwd = loadIt("pseudoPwd", "00000000-0000-4000-8000-000000000000")
		dynMetro.cliReq = performance.now()
		const res = await fetch(urlApi+url+"?u="+user+"&p="+pwd, {
			method: method? method: 'GET', mode: "cors", cache: "no-store",
			body: (body)? JSON.stringify(body) : null
		});

		dynMetro.cliRes = performance.now()
		dynMetro.cliDth = Date.now()
	  let json = await res.json() // reponse serveur
		// const cliJson = performance.now() // inutile pour le calcul
		// metrologie depuis le serveur
		dynMetro.srv = json.tr || {load: 1.0, run:1.0, dth:Date.now() } // load: lecture requete, run: exécution requete, dth: timestamp serveur
		// calcul ecart temporel dynamique - disponible par import getEpsilon() ou getMetro()
		// TODO: prévoir un lissage statistique local pour éviter les pics de latence ??
		dynMetro.epsilon = dynMetro.cliDth -
			( ( (dynMetro.cliRes - dynMetro.cliReq) - (dynMetro.srv.load + dynMetro.srv.run + 1.0) ) / 2.0 )
			- dynMetro.srv.dth
		// si erreur
		if (res.status >= 300) addNotification("Erreur sur "+urlApi+url+ ": "+json.msg+ "("+ res.status+ "), contacte Kikiadoc sur discord", "red", 60);
		// force le status hhtp disponible directement dans le json.
		json.status = res.status
		return json
	}
	catch(e) {
		console.log(e);
		addNotification("Erreur imprévue sur "+urlApi+url+ ", contacte Kikiadoc sur discord","red",60);
		return { status: 503 };
	}
}

/////////////////////////////////////////////////////////////////////
// Gestion des mecanismes de crypto
/////////////////////////////////////////////////////////////////////
const ecKeyGenParams = { name: "ECDSA", namedCurve: "P-384" }
const ecKeyImportParams = { name: "ECDSA", namedCurve: "P-384" }
const ecdsaParams = { name: "ECDSA", hash: "SHA-256" }
// creation d'une paire de clefs, retourne la publique ou null
export async function crypoCreateKeyPair() {
	try {
		let keyPair = await crypto.subtle.generateKey(ecKeyGenParams, true,  ["sign", "verify"] );
		let jwkPublicKey = await crypto.subtle.exportKey("jwk",keyPair.publicKey);
		let jwkPrivateKey = await crypto.subtle.exportKey("jwk",keyPair.privateKey);
		// stockage des clefs
		storeIt("elipticSecurity", {jwkPublicKey: jwkPublicKey, jwkPrivateKey: jwkPrivateKey})
		return jwkPublicKey;		
	}
	catch(e) {
		console.log(e)
		return null
	}
}
async function cryptoSign(texte) {
	try {
		let es = loadIt("elipticSecurity", {} )
		let jwkPrivateKey = await crypto.subtle.importKey(
			"jwk", es.jwkPrivateKey, ecKeyImportParams, false, ["sign"]
		)
		let signature = await crypto.subtle.sign(
			 ecdsaParams, jwkPrivateKey, new TextEncoder().encode(texte)
		)
		let ret = uint8ArrayToHex(signature);
		// console.log("signed",signature,"ret",ret)
		return ret;
	}
	catch (e) {
		addNotification("Erreur cryptoSign elipticCurve, contactez Kikiadoc","red,60")
		console.log(e)
		return null;
	}
}
async function cryptoVerify(texte, hexString) {
	try {
		console.log("hexString=",hexString)
		let signature = hexToUint8Array(hexString);
		let es = loadIt("elipticSecurity", {} )
		let jwkPublicKey = await crypto.subtle.importKey(
			"jwk", es.jwkPublicKey, ecKeyImportParams, false, ["verify"]
		)
		let verified = await crypto.subtle.verify(
			 ecdsaParams, jwkPublicKey, signature, new TextEncoder().encode(texte)
		)
		console.log("verified",verified)
		return verified;
	}
	catch (e) {
		addNotification("Erreur cryptoVerify elipticCurve, contactez Kikiadoc","red",60)
		console.log(e)
		return null;
	}
}
async function cryptoClearKey() {
		storeIt("elipticSecurity", null)
}

///////////////////////////////////////////////////////////////////////////////////////
// GESTION DU STOCKAGE
///////////////////////////////////////////////////////////////////////////////////////
export function loadIt(cle,defaut)
{
	// console.log("loadIt:", cle);
	let valeur = localStorage.getItem(cle);
	if (valeur==null) return defaut
	try { return JSON.parse(valeur) }
	catch(e) {
		console.log("loadIt error: ",cle,e);
		return defaut;
	}
}

export function storeIt(cle,valeur)
{
	let xVal = JSON.stringify(valeur);
	// console.log("storeIt:", cle);
	localStorage.setItem(cle, xVal);
}

export function removeIt(cle)
{
	localStorage.removeItem(cle);
}

export function clearStorage()
{
	if (confirm("Attention, si tu effaces tes données locales, "+
							"tu devras contacter Kikiadoc sur discord pour "+
							"t'autoriser une nouvelle identification sécurisée "+
							"\nTu devras resaisir tout ce que tu as déjà indiqué "+
							"pour continuer un challenge en cours!  Es-tu sûr ?")) {
		localStorage.clear();
		location.reload();
		alert("Tes données locales ont été effacées");
	}
	return;
}
///////////////////////////////////////////////////////////////////////////////////////
// GESTION DE L'AUDIO
///////////////////////////////////////////////////////////////////////////////////////
const audioDescs = {
	"oracle" : { mp3: urlMp3+"oracle.mp3#t=00:00:00", vol: 0.6 },
	"peergynt" : { mp3: urlMp3+"Peer-gynt.mp3#t=00:00:50", vol: 1.1, repeat:1 },
	"Help" : { mp3: urlMp3+"Help.mp3#t=00:00:00", vol: 1.0 },
	"QueenMagic" : { mp3: urlMp3+"QueenMagic.mp3#t=00:00:00", vol: 1.1 },
	"Camelot" : { mp3: urlMp3+"Camelot.mp3#t=00:00:00", vol: 0.9, repeat: 1 },
	"BlaBlaBla": { mp3: urlMp3+"BlaBlaBla.mp3#t=00:00:00", vol: 0.8, transient: 1 },
	"Patience": { mp3: urlMp3+"Patience.mp3#t=00:00:00", vol: 0.7 },
	"Amelie": { mp3: urlMp3+"Amelie.mp3#t=00:00:00", vol: 0.7 },
	"call-to-attention": { mp3: urlMp3+"call-to-attention.mp3#t=00:00:00", vol: 0.7 },
	"phrase-suivante": { mp3: urlMp3+"phrase-suivante.mp3#t=00:00:00", vol: 0.7 },
	"Wonderful": { mp3: urlMp3+"Wonderful.mp3#t=00:00:00", vol: 0.8, transient: 1 }, 
	"May": { mp3: urlMp3+"May.mp3#t=00:00:16", vol: 1.2, repeat:1 },
	"Wald": { mp3: urlMp3+"Waldschrein.mp3#t=00:00:10", vol: 0.5, repeat:1 },
	"Benabar-foret-extrait":  { mp3: urlMp3+"Benabar-foret-extrait.mp3#t=00:00:00", vol: 0.5, repeat: 1 },
	"Ding":  { mp3: urlMp3+"Ding.mp3#t=00:00:00", vol: 3.0 },
	"ding-ding":  { mp3: urlMp3+"ding-ding.mp3#t=00:00:00", vol: 1.5 },
	"prout-long":  { mp3: urlMp3+"prout-long.mp3#t=00:00:00", vol: 1.5 },
	"prout-court":  { mp3: urlMp3+"prout-court.mp3#t=00:00:00", vol: 1.5 },
	"Shame":  { mp3: urlMp3+"Shame.mp3#t=00:00:42", vol: 1.5 },
	"Memory":  { mp3: urlMp3+"Memory.mp3#t=00:00:00", vol: 2.0, transient: 1 },
	"Mauvaise":  { mp3: urlMp3+"Mauvaise.mp3#t=00:00:00", vol: 3.0, transient: 1 },
	"Au revoir":  { mp3: urlMp3+"Au revoir.mp3#t=00:00:00", vol: 1.0, transient: 1 },
	"Viens":  { mp3: urlMp3+"Viens.mp3#t=00:00:30", vol: 1.0, transient: 1 },
	"Come":  { mp3: urlMp3+"Come.mp3#t=00:00:00", vol: 2.0, transient: 1 },
	"Money":  { mp3: urlMp3+"Money.mp3#t=00:00:47", vol: 1.0, transient: 1 },
	"Alice":  { mp3: urlMp3+"Alice.mp3#t=00:00:00", vol: 1.0 },
	"Alex-nes":  { mp3: urlMp3+"Alex-nes.mp3#t=00:00:00", vol: 1.0, repeat: 1 },
	"Demons":  { mp3: urlMp3+"Demons.mp3#t=00:00:00", vol: 1.0, repeat: 1 },
	"BienMal":  { mp3: urlMp3+"BienMal.mp3#t=00:00:00", vol: 1.0, repeat: 1 },
	"CitesDor":  { mp3: urlMp3+"CitesDor.mp3#t=00:00:00", vol: 1.0, repeat: 1 },
	"SweetDreams":  { mp3: urlMp3+"SweetDreams.mp3#t=00:00:00", vol: 1.2, repeat: 0 },
	"Muppet":  { mp3: urlMp3+"Muppet.mp3#t=00:00:00", vol: 0.9, repeat: 0 },
	"celebrations": {mp3: urlMp3+"indochine-nos-celebrations-clip-officiel.mp3#t=00:00:19", vol: 0.8, repeat: 1 },
	"ForeverYoung": {mp3: urlMp3+"ForeverYoung.mp3#t=00:00:00", vol: 1.0, repeat: 1 },
	"Hauser-Adagio": {mp3: urlMp3+"Hauser-Adagio.mp3#t=00:00:00", vol: 1.3, repeat: 1 },
	"Paradise-Vangelis": {mp3: urlMp3+"Paradise-Vangelis.mp3#t=00:00:00", vol: 0.7, repeat: 1 },
	"DontGiveUp": {mp3: urlMp3+"DontGiveUp.mp3#t=00:00:43", vol: 1.0, repeat: 1 },
	"outfoxing": {mp3: urlMp3+"outfoxing.mp3#t=00:00:00", vol: 0.9, repeat: 1 },
	"FarmerBelleJournee": {mp3: urlMp3+"FarmerBelleJournee.mp3#t=00:02:25", vol: 1.1, repeat: 1 },
	"Depasse": {mp3: urlMp3+"Depasse.mp3#t=00:00:33", vol: 0.7, repeat: 1 },
	"FrontTitles": {mp3: urlMp3+"FrontTitles.mp3#t=00:00:12", vol: 0.8, repeat: 1 },
	"Extravaganza": {mp3: urlMp3+"Extravaganza.mp3#t=00:00:00", vol: 1.0, repeat: 1 },
	"MythsSword": {mp3: urlMp3+"MythsSword.mp3#t=00:00:00", vol: 1.1, repeat: 1 },
	"Applaudissements": {mp3: urlMp3+"Applaudissements.mp3#t=00:00:00", vol: 1.0, repeat: 0 },
	"SonOfSon": {mp3: urlMp3+"Argy, Son Of Son - Faust.mp3#t=00:00:00", vol: 1.0, repeat: 1 },
	"LOTR-connaissances": {mp3: urlMp3+"LOTR-connaissances.mp3#t=00:00:00", vol: 3.0, repeat: 1 },
	"KanAnErer": {mp3: urlMp3+"ff-7/KanAnErer-extrait.mp3#t=00:00:00", vol: 1.0, repeat: 1 },
	"ShadowArgonath": {mp3: urlMp3+"ff-7/ShadowArgonath.mp3#t=00:00:25", vol: 1.0, repeat: 1 },
	"pacmanStart": { mp3: urlMp3+"pacman/FuyezPauvresFous.mp3", vol: 10.0, repeat: 0},
	"pacmanDie": { mp3: urlMp3+"pacman/die.mp3", vol: 1.0, repeat: 0},
	"pacmanEatGhost": { mp3: urlMp3+"pacman/eatghost.mp3", vol: 1.0, repeat: 0},
	"pacmanEatPill": { mp3: urlMp3+"pacman/eatpill.mp3", vol: 1.0, repeat: 0},
	"pacmanEating": { mp3: urlMp3+"pacman/eating.short.mp3", vol: 1.0, repeat: 0},
	"pacmanEating2": { mp3: urlMp3+"pacman/eating.short.mp3", vol: 1.0, repeat: 0},
	"X-Files": { mp3: urlMp3+"ff-7/X-Files.mp3", vol: 1.0, repeat: 1},
	"Artemis": { mp3: urlMp3+"ff-7/Artemis.mp3", vol: 0.5, repeat: 1},
	"Propaganda": { mp3: urlMp3+"ff-7/Propaganda.mp3", vol: 0.8, repeat: 1},
	"Gift": { mp3: urlMp3+"ff-7/Gift.mp3", vol: 0.8, repeat: 1},
	"BlindingLights": { mp3: urlMp3+"ff-7/BlindingLights.mp3", vol: 0.5, repeat: 1},
	"medium": { mp3: urlMp3+"ff-7/Medium.mp3", vol: 0.9, repeat: 1},
	"guardians": { mp3: urlMp3+"ff-7/Guardians.mp3", vol: 0.9, repeat: 1},
	"godofwar": { mp3: urlMp3+"ff-7/GodOfWar.mp3", vol: 0.8, repeat: 1},
	"mission-impossible": { mp3: urlMp3+"ff-7/mission-impossible.mp3", vol: 3.0, repeat: 1},
	"like-a-melody": { mp3: urlMp3+"ff-7/like-a-melody.mp3", vol: 3.0, repeat: 1},
	"le-jeu": { mp3: urlMp3+"ff-10/le-jeu.mp3", vol: 1.0, repeat: 1},
	"explosion": { mp3: urlMp3+"ff-7/sf_explosion_01.mp3", vol: 4.0},
	"orthoTempsMission":  { mp3: urlMp3+"ff-10/orthoTempsMission.mp3", vol: 3.0 },
	"orthoTempsTableau":  { mp3: urlMp3+"ff-10/orthoTempsTableau.mp3", vol: 3.0 },
};

// Handler/dump d'une erreur media
function mediaError(e) {
	console.error("media onerror event",e)
	infoPopup({
		titre:'Erreur media imprevue',trailer:'Fais un screen et contacte Kikiadoc', back:'rouge', ding:'explosion',
		body:[
		 e.srcElement?.src,e.srcElement?.currentSrc,e.srcElement?.error?.code,e.srcElement?.error?.message,
		 e.target?.src,e.target?.currentSrc,e.target?.error?.code,e.target?.error?.message
		]
	})
}
// test si un DOM e est en cours d'audio playing
export function isPlaying(e) {
	return e && e.currentTime > 0 && !e.paused && !e.ended && e.readyState > 2;
}

// pause l'audio, audioDom facultatif
export function audioPause(audioDom) {
	let ap= audioDom || document.getElementById("musique");
	console.log("audioPause (ambiance,vol): ",ap.audioAmbiance, ap.audioVolume)
	if (ap?.src?.indexOf("mp3")>0) ap.pause()
}

// resume l'audio si pas de video en cours, audioDom facultatif
export function audioResume(audioDom) {
	const ap= audioDom || document.getElementById("musique");
	const vp=document.getElementById("video");
	// si video en cours ne pas resume l'audio
	if (isPlaying(vp)) return console.log('audioResume: Video playing, no resume')
	// recalc le volume car il ests peut être modifié
	if (ap?.src?.indexOf("mp3")>0 && ap?.audioAmbiance) {
		ap.volume = Math.min(1.0,ap.audioMp3Vol*ap.audioVolume)
		console.log("audioResume (ambiance,vol,src):",ap.audioAmbiance, ap.audioVolume, ap.src)
		ap.play()
	}
}

// recup les caractéristiques d'une audio
function getSpecAudioByName(nom) {
	const desc = audioDescs[nom]
	if (desc) return desc
	addNotification("Erreur mixer:"+nom)
	return audioDescs.oracle
};

export function soundEnded() {
	console.log("event Musique ended");
	const ap=document.getElementById("musique");
	playMusic((ap.audioRepeat)? ap.audioMusic : 'peergynt')
}

export function playMusic(music,force) {
	const ap=document.getElementById("musique")
	if (!ap)	return addNotification("playMusic DOM not ready")
	// setup handler si besoin
	if (!ap.onerror) ap.onerror = function(e) {	 mediaError(e) }
	if (!ap.onended) ap.onended = soundEnded
	const nom = music || loadIt('lastMusic',"oracle");
	let newAudio = getSpecAudioByName(nom);
	if (! newAudio.transient)  storeIt('lastMusic',nom);
	// si pas force et meme musique et encore en cours...
	let newURI = encodeURI(newAudio.mp3)
	if (!force && (ap.src == newURI ) && isPlaying(ap) )
		return console.log("playMusic: Musique inchangée",ap.src)
	// sauvegarde des trucs dans le dom element
	ap.audioMusic = nom
	ap.audioRepeat = newAudio.repeat
	ap.audioTransient = newAudio.transient
	ap.audioMp3Vol = newAudio.vol
	ap.volume = Math.min(1.0,ap.audioMp3Vol*ap.audioVolume)
	// si changement de musique
	if (ap.src != newURI) ap.src = newAudio.mp3
	// si ambiance et premier clic...
	const canPlay = ap.audioAmbiance && document.premierClickOk
	console.log("playMusic: (enable,locVol,gblVol,val,src)",canPlay,ap.audioMp3Vol,ap.audioVolume,ap.volume,ap.src)
	if (canPlay) ap.play()
}

export function playDing(mp3) {
	let ap=document.getElementById("ding")
	if (!ap) return addNotification("playDing dom not ready","red",10)
	// setup handler si besoin
	if (!ap.onerror) ap.onerror = function(e) {	 mediaError(e) }
	let ding= getSpecAudioByName(mp3 || "Ding")
	ap.src=ding.mp3;
	ap.volume = Math.min(1.0,ding.vol*ap.audioVolume)
	ap.play()
}
///////////////////////////////////////////////////////////////////////////////////////
// GESTION DE LA VIDEO
///////////////////////////////////////////////////////////////////////////////////////
const videoDesc = {
	"ff-6-trailer": { mp4: "ff-6-trailer", vol: 1.5},
	"ff14-innommable-trailer": { mp4: "ff14-innommable-trailer", vol: 1.0},
	"ff-7-teaser1": {mp4: "ff-7/ff-7-teaser1", vol: 1.0},
	"ff-7-teaser0c": { mp4: "ff-7/ff-7-teaser0c", vol: 1.5},
	"ff-7-epique-1": { mp4: "ff-7/ff-7-epique-1", vol: 3.0},
	"ff-7-epique-2": { mp4: "ff-7/ff-7-epique-2", vol: 2.0},
	"ff-7-epique-3": { mp4: "ff-7/ff-7-epique-3", vol: 3.0},
	"ff-7-escapeprison": { mp4: "ff-7/ff-7-escapeprison", vol: 3.0},
	"ff-7-portemagique": { mp4: "ff-7/ff-7-portemagique", vol: 3.0},
	"ff-7-runetrouvee": { mp4: "ff-7/ff-7-runetrouvee", vol: 1.0},
	"ff-7-boulier": { mp4: "ff-7/ff-7-boulier", vol: 2.0},
	"ff-7-maitrepecheur": { mp4: "ff-7/ff-7-maitrepecheur", vol: 2.0},
	"ff-7-torches-1": { mp4: "ff-7/ff-7-torches-1", vol: 2.0},
	"ff-7-torches-2": { mp4: "ff-7/ff-7-torches-2", vol: 2.0},
	"ff-7-spartaci-1": { mp4: "ff-7/ff-7-spartaci-1", vol: 2.0},
	"ff-7-spartaci-2": { mp4: "ff-7/ff-7-spartaci-2", vol: 2.0},
	"ff-7-doctrine-1": { mp4: "ff-7/ff-7-doctrine-1", vol: 0.9},
	"ff-7-doctrine-2": { mp4: "ff-7/ff-7-doctrine-2", vol: 1.0},
	"ff-7-alan-decryptage": { mp4: "ff-7/ff-7-alan-decryptage", vol: 2.0},
	"ff-7-stationalpha-intermediaire": { mp4: "ff-7/ff-7-stationalpha-intermediaire", vol: 1.0},
	"ff-7-stationalpha-final": { mp4: "ff-7/ff-7-stationalpha-final", vol: 1.0},
	"ff-7-usines-intro-1": { mp4: "ff-7/ff-7-usines-intro-1", vol: 1.4},
	"ff-7-omega-final": { mp4: "ff-7/ff-7-omega-final", vol: 1.4},
	"ff-7/ff-7-trailer": { mp4: "ff-7/ff-7-trailer", vol: 1.4},
	"ff-5-chronogyre": { mp4: "ff-5-chronogyre", vol: 3.0},
	"ff-5-trailer": { mp4: "ff-5-trailer", vol: 2.0},
	"ff-10/chevron": { mp4: "ff-10/chevron", vol: 3.0},
	"ff-10/chevron-8": { mp4: "ff-10/chevron-8", vol: 3.0},
	"ff-10/ff-10-metropolis-c": { mp4: "ff-10/ff-10-metropolis-c", vol: 1.5},
	"ff-10/ff-10-tunnelmetropolis": { mp4: "ff-10/ff-10-tunnelmetropolis", vol: 1.5},
	"ff-10/ff-10-ortho-ring": { mp4: "ff-10/ff-10-ortho-ring", vol: 2},
	"ff-10/ff-10-metro-trailer": { mp4: "ff-10/ff-10-metro-trailer", vol: 2},
}

let videoCb=null; // callback actuelle de la video

// cb sera appeleé lors du close video, 
// tTime == "d,e" ou d est le début et e la fin (e optionnel)
export function playVideo(mp4,cb,tTime) {
	if (mp4==null) return
	let divVideo = document.getElementById("divVideo")
	let video = document.getElementById("video")
	if (!divVideo || !video) return console.log("ERREUR: tag video introuvable")
	if (!video.oncanplay) video.oncanplay = function(e) { console.log("video canplay event") }
	if (!video.oncanplaythrough) video.oncanplaythrough = function(e) { console.log("video canplaythrough event") }
	if (!video.onemptied) video.onemptied = function(e) { console.log("video emptied event") }
	if (!video.onloadedmetadata) video.onloadedmetadata = function(e) { console.log("video loadedmetadata event") }
	if (!video.onloadeddata) video.onloadeddata = function(e) { console.log("video loadeddata event") }
	if (!video.onstalled) video.onstalled = function(e) { console.log("video onstalled event") }
	// if (!video.onsuspend) video.onsuspend = function(e) { console.log("video onsuspend event") }
	if (!video.onwaiting) video.onwaiting = function(e) { console.log("video onwaiting event") }
	
	if (!video.onplay) video.onplay = function(e) { audioPause() }
	if (!video.onended) video.onended = function(e) { audioResume() }
	if (!video.onpause) video.onpause = function(e) { audioResume() }
	if (!video.onerror) video.onerror = function(e) {	 mediaError(e) }
	const desc = videoDesc[mp4]
	if (!desc) addNotification("video sans normalized: "+mp4,"orange",10)
	
	videoCb=cb;
	divVideo.style.display="block";
	console.warn('Kiki peut-être un cas bug (uniquement getter dans certains cas??????')
	video.volume= Math.min(1.0, video.audioVolume * ( (desc)? desc.vol : 1 ) ) // calcul du volume video
	video.src=urlImg+ ( (desc)? desc.mp4 : mp4 ) +".mp4" + ((tTime)? "#t="+tTime :"") ;

	console.log("playVideo",video.src,"desc=",desc,
							"audioVolume=",video.audioVolume,"volCalcul=",video.volume)
	
	// si aucune intéraction sur le site, la video ne part pas
	// donc gestion de la propriété premierClickOk
	if (document.premierClickOk)
		video.play()
	else
		addNotification("Clique sur la vidéo pour la voir","yellow",10)
	console.warn(('kiki videoplayok'))
}

export function closeVideo() {
	let divVideo = document.getElementById("divVideo");
	let video = document.getElementById("video");
	video.pause();
	divVideo.style.display="none";
	audioResume();
	if (videoCb) videoCb();
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
	// console.log("markclick",e.toString())
	e.gpHelp ??= e.currentTarget.getAttribute("gphelp")
	e.gpImg ??= e.currentTarget.getAttribute("gpImg")
	e.gpVideo ??= e.currentTarget.getAttribute("gpVideo")
	e.gpNotif ??= e.currentTarget.getAttribute("gpNotif")
	e.gpLink ??= e.currentTarget.getAttribute("gpLink")
	e.gpColor ??= e.currentTarget.getAttribute("gpColor")
	e.gpTimeout ??= e.currentTarget.getAttribute("gpTimeout")
	e.gpDing ??= e.currentTarget.getAttribute("gpDing")
}

/////////////////////////////////////////////////////////////////////
// Fonctions DEPRECATED, 
// conservées pour faiire fonctionner les pages avant refactoring
/////////////////////////////////////////////////////////////////////
export function clickSur(idName) { console.error("DEPRECATED clickSur") } // plus d'usage
export function scrollTop(domId) { console.error("DEPRECATED scrollTop") } // utilisation de use:
export function playSound(music,force) { console.error("DEPRECATED playSound"); playMusic(music,force)} // usage de playMusic a la place
export function newInfoPopup(titre,body,trailer,opt) {
	console.error("DEPRECATED newInfoPopup - utiliser infoPopup(obj)") // version legacy a ne plus utiliser
	let o = (typeof opt=="string")? { img: opt } : (opt || {})
	o.titre=titre; o.body=body; o.trailer=trailer
	infoPopup(o)
}

// storage.js
