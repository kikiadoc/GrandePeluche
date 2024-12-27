const fs = require('fs');
const http = require('http');
const Tail = require('./tail.js').Tail;
const ws = require('./wsClient.js')
const readline = require('readline');

//////////////////////////////////////////////////
// Parametre à modifier si besoin en fonction version act
//////////////////////////////////////////////////
const LOGPREFIX="D:\\ActFf14\\Network_27202_"

// Mode de fonctionnement
if (process.argv[2] != "STAGING" && process.argv[2] != "PROD") { console.error("Indiquer STAGING OU PROD"); process.exit(1) }
const isProd = process.argv[2] == "PROD"

// lien vers le WS de prod/staging
const wsUrl= (isProd)? "wss://api.adhoc.click/ws/" : "wss://api.adhoc.click/wstest/"

// calcul du nom du log ACT/FF14
const START = new Date()
function pad(i) {
	return ("00"+i).slice(-2)
}
const ffLog=LOGPREFIX+START.getFullYear()+pad(START.getMonth()+1)+pad(START.getDate())+".log"

console.log("WS:",wsUrl)
console.log("Parsing log:",ffLog)

// const DISTANCE=1.4 // semble être une demi-dalle du sol
const DISTANCE=2.0 // semble être un peu moins d'une dalle du sol
const ZONEMAISON="11C" // numero de zone de la maison

const elts = {} // liste de tous les elements détectés
const eltsNearsPossibles = {} // pour recherche des nears (uniquement les joueurs et pnjs cliquable)
const lasts = {} // liste des derniers element selon leur code interne, pour debug et exhaustivité
let eltVous = null	// element pour Kikiadoc ou la Grande Peluche quand détectée
let zoneActive = false // flag indiquant que le pisteur est dans la bonne zone de jeu

let traceAll=false
let quiet=true
let traceZapWorld=true

// Pour faciliter le traitement, element globaux de la line de log FF14 en cours d'analyse
let line = null
let items = []

////////////////////////////////////////////////////
// debug divers
////////////////////////////////////////////////////
// affiche en console.error dans tous les cas
function erreur(...args) {
	try {
		let msg = ""
		for (const arg of args) {
			msg+=','
			if (typeof arg == "object")
				msg+= JSON.stringify(arg)
			else
				msg+= arg
		}
		console.error(msg.substring(1))
	}
	catch(e) {
		console.error(args)
	}
	return null
}
// debug: construit le detail d'un elet
function detailStr(elt) {
	if (!elt) return ""
	return	"Id:"+ (elt.gpId || "noId") +
			" Type:" + (elt.Type || "noType") +
			" Name:" + (elt.Name || "noName") +
			" gpMonde:" + (elt.gpMonde || "noWorld") +
			" gpX:"+ elt.gpX +
			" gpY:"+ elt.gpY +
			" gpZ:"+ elt.gpZ +
			" Target:"+ (elt.gpTarget) +" "+ (elts[elt.gpTarget] && elts[elt.gpTarget].Name)
}
// debug
function dumpConnus(sel) {
	console.log("***** Début des connus")
	for (const [key, value] of Object.entries(elts)) {
		if (!sel || (value.Name && (value.Name.indexOf(sel) >=0)))
			console.log("tous:",key, value.Name, "h=", value.historique.length, "c=",value.casts.length, detailStr(value));
	}
	console.log("***** Fin des connus")
}
// debug
function dumpNears(sel) {
	console.log("***** Début des nearspossibles")
	for (const [key, value] of Object.entries(eltsNearsPossibles)) {
		if (!sel || (value.Name && (value.Name.indexOf(sel) >=0)))
			console.log("nears:",key, value.Name, "h=", value.historique.length, "c=",value.casts.length, detailStr(value));
	}
	console.log("***** Fin des connus")
}
// debug
function dumpId(eltId) {
	const elt = elts[eltId]
	if (!elt) return console.log('id',eltId,"introuvable")
	console.log("***** Début Détail",eltId)
	console.log(elt)
	console.log("***** Fin Détail",eltId)
}
// debug
function dumpByLast() {
	console.log("***** Début des types d'element")
	for (const [key, value] of Object.entries(lasts)) {
		console.log("Key:",key, value);
	}
	console.log("***** Fin des types d'elements")
}
// debug
function addHistorique(eltId) {
	let elt = elts[eltId]
	if (elt) elt.historique.push(line)
}
// debug
function addByType() {
	lasts[items[0]]=line
}
////////////////////////////////////////////////////
// positionne des infos dans un élément
////////////////////////////////////////////////////
function setPos(elt,x,y,z) {
	const nX= parseFloat(x), nY= parseFloat(y), nZ=parseFloat(z)
	// si soucis
	if (isNaN(nX) || isNaN(nY) || isNaN(nZ)) return erreur("badpos:",elt.id,"xyz",x,y,z,"line:",line) // coordonnees invalides
	elt.gpX = nX
	elt.gpY = nY
	elt.gpZ = nZ
	if (!quiet) console.log('NewPos:',detailStr(elt))
}
function setName(elt,nom) {
	if (!elt || !nom) return
	if (elt.Name && elt.Name != nom) return console.error(line,"soucis coherence sur le nom")
	if (elt.gpPrenom) return // deja identifié
	const i = nom.indexOf(' ')
	// si non d'un seul mot, ignore, c'est une mascotte ou un bidule
	if (i < 2) return
	elt.gpPrenom = nom.substring(0,i)
	elt.gpNom = nom.substring(i+1)
	// si Kikiadoc ou Grande Peluche, positionne le "Vous"
	if (elt.gpPrenom=="Kikiadoc" || (elt.gpPrenom=="Grande" && elt.gpNom=="Peluche"))
		eltVous = elt
	// besoin d'informer le serveur ?
	if (elt.gpIsJoueur) toServer(elt, { type: "newPlayer" })
}
function setType(elt,type) {
	let t = parseInt(type,10)
	if (t!=1 && t!=3) return
	elt.gpType=t
	eltsNearsPossibles[elt.gpId] = elt
}
// ajoute les proprietes à l'elt depuis items[4.n-2] et recalcule la pos et le type si présent avec l'indexation rapide
function addProperties(elt) {
	let flagPos=false
	for (i=4; i< items.length; i+=2) {
		let n = items[i]
		elt[n]=items[i+1]
		if (n.startsWith("Pos")) flagPos=true
		if (n=="Type") setType(elt,items[i+1])
		if (n=="PCTargetID") elt.gpTarget=items[i+1]
	}
	if (flagPos) setPos(elt,elt.PosX,elt.PosY,elt.PosZ || elt.gpZ || 0)
	return elt
}

////////////////////////////////////////////////////
// recherche un élement
////////////////////////////////////////////////////
function isValidEltId(id) {
	return id && (id.startsWith('10') || id.startsWith('40') || id.startsWith('FF'))
}
// recupere un elt par son id avec creation si besoin, si doit exister, retourne null si inexistant
// si création et que bad Id exception
function getEltById(id,doitExister) {
	if (doitExister) return elts[id]
	if (elts[id]) return elts[id]
	if (!isValidEltId(id)) throw new Error("bad EltId:"+id)
	return elts[id] = { historique: [], casts: [], gpId: id, gpIsJoueur: id.startsWith('10'), gpIsObjet: id.startsWith('40')}
}
// recherche un elt selon son nom full IG depuis les elts
function getEltByFullName(name) {
	for (v of Object.values(elts)) {
		if (v.Name==name) return v
		// faut-il utiliser les autres name par les autres events?
	}
	return null
}

// tente le parse d'un nom si pas ok, tente le parse du texte
function getEltByParseNom(nom) {
	if (!quiet) console.log("getEltByParseNom",nom)
	if (!nom) return null
	// test si fullName ok direct
	let elt = getEltByFullName(nom)
	if (elt) return elt
	// parse le premier mot (iBlanc) et le suivant jusque un uppercase ou un blanc
	let iBlanc=nom.indexOf(' ')
	if (iBlanc < 0) return null
	let iUpper = iBlanc+1 // +1 pour commencer apres la 1ere letre du second mot
	let trouve=false
	while (!trouve && ++iUpper < nom.length) {
		const c = nom.charAt(iUpper)
		if ( (c>='A' && c<='Z') || (c==' ') ) trouve=true
	}
	// si pas d'uppercase dans le second mot, introuvable
	if (!trouve) return null
	const newNom = nom.substring(0,iUpper)
	if (!quiet || traceZapWorld) console.log("Avec Zap du world:",nom,newNom)
	return getEltByFullName(newNom)
}

// determine le nom depuis les mots d'une ligne et retourne l'elt ou null
function getEltByLine(mots) {
	let elt
	elt = getEltByParseNom(items[3]) // nom dans la ligne en position 3
	if (elt) return elt
	elt = getEltByParseNom(items[4]) // nom dans la ligne en debut de position 4
	if (elt) return elt
	// cas particulier du "vous"
	if (items[4].startsWith("Vous")) return eltVous
	console.error("getEltByLine impossible:",line)
	return null
}
////////////////////////////////////////////////////
// calcul de la proximité
////////////////////////////////////////////////////
// retourne la distance entre e1/e2 
function distance(e1,e2) {
	// calcul base sur le X et le Y uniquement
	return Math.max(Math.abs(e2.gpX-e1.gpX),Math.abs(e2.gpY-e1.gpY))
}
// recupere le tableau des noms des nears d'un elt
function getNearNames(elt) {
	const ret = []
	for (e of Object.values(eltsNearsPossibles)) {
		const d= distance(elt,e)
		if (!quiet) console.log("distance",elt.Name,e.Name,d)
		if ( d < DISTANCE ) ret.push( e.Name )
	}
	return ret
}

////////////////////////////////////////////////////
// dialogiue avec le server
////////////////////////////////////////////////////
// envoi une operation ig vers le serveur
function toServer(elt, action) {
	if (!elt) return erreur("toServer bad elt:",elt,action,line)
	if (!elt.gpPrenom || !elt.gpNom) return erreur("toServer, pseudo incomplet pour: ",elt,action)
	const nears = getNearNames(elt)
	const target = getEltById(elt.gpTarget,true)
	let msg = JSON.stringify({ op:"ig", p: elt.gpPrenom, n:elt.gpNom, nears: getNearNames(elt), target: target && target.Name, action: action })
	if (!zoneActive) {
		console.log("!!!PAS DANS LA ZONE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
		console.log("toServer trigger line",line)
		console.log("toServer message:",msg)
		console.log("*************************************************")
		return
	}
	console.log("***TO SERVER*************************************")
	console.log("toServer trigger line",line)
	console.log("toServer message:",msg)
	console.log("*************************************************")
	ws.queueMsg(msg)
}

////////////////////////////////////////////////////
// action spécifique identifiée
////////////////////////////////////////////////////


////////////////////////////////////////////////////
// Parse des logs
////////////////////////////////////////////////////
// CHAT!!
function parse00() {
	// position: 2=canal 3=pseudo 4=msg
	// 0003 info systeme
	// 000A /dire
	// 000B /hurler
	// 000C /murmurer ver
	// 000D /murmurer depuis
	// 000E /equipe
	// 000F /alliance
	// 0010..0017 linkshell
	// 0018 /cl
	// 001C émote ??
	// 001D émote
	// 001E /crier
	// 0025 linksell intermonde 1
	// 0039 message lié a des TP, diaporama etc... pas clair peut-etre du whisper
	// 0044 message systeme
	// 004A trucs style /dés
	// 004C musique d'ambiance orchestrion
	// 0065..006B linkshell intermond 2..8

	const chan = items[2].slice(-2) // seul le dernier octet semble être le channel
	const mots = items[4].split(' ')
	if (chan=="0A" || chan == "0B" || chan == "1E") {
		// dire
		return toServer( getEltByLine(mots), { type: "dire", mot: mots[0] } )
	}
	if (chan == "1D") {
		// émote
		if (items[4].indexOf(" panique") >0) return toServer( getEltByLine(mots), { type: "panique" } )
		if (items[4].indexOf("encourage") >0) return toServer( getEltByLine(mots), { type: "encourage" } )
		if (items[4].indexOf(" oui") >0) return toServer( getEltByLine(mots), { type: "oui" } )
		if (items[4].indexOf(" acquiesce") >0) return toServer( getEltByLine(mots), { type: "oui" } )
		if (items[4].indexOf(" non") >0) return toServer( getEltByLine(mots), { type: "non" } )
		if (items[4].indexOf(" regarde") >0) return toServer( getEltByLine(mots), { type: "scruter" } )
		if (items[4].indexOf(" donne") >0) return toServer( getEltByLine(mots), { type: "donner" } )
		if (items[4].indexOf(" questionne") >0) return toServer( getEltByLine(mots), { type: "questionner" } )
		if (items[4].indexOf(" somnole") >0) return toServer( getEltByLine(mots), { type: "somnoler" } )
		if (items[4].indexOf("étire") >0) return toServer( getEltByLine(mots), { type: "etirer" } )
		if (items[4].indexOf(" signe de la main") >0) return toServer( getEltByLine(mots), { type: "signe" } )
		if (items[4].indexOf(" montre du doigt") >0) return toServer( getEltByLine(mots), { type: "moi" } ) 
	}
	if (chan == "4A") {
		// /dés et autres commandes
		if (items[4].indexOf(" les dés ") >0) return toServer( getEltByLine(mots), { type: "dés", tirage: parseInt(mots[mots.length-1],10) } )
	}
	console.log("chat ignoré:",line)
	// console.log("Elt du chat",detailStr(getEltByLine(mots)))
}
// 01|2024-09-20T10:20:35.4840000+02:00|11C|Private Mansion - Mist|9d15d278f0bb1f3d
// changement de zone
function parse01() {
	zoneActive = (items[2]==ZONEMAISON)
	console.log("**CHANGEMENT DE ZONE***********************")
	console.log("zone(01):",items[2],"=",items[3])
	console.log("zoneActive:",zoneActive)
	console.log("*******************************************")
}

// 02|2024-09-20T10:20:35.4840000+02:00|106B5D24|Grande Peluche|e337767827f3563a
function parse02() {
	if (!items[2] || !items[3]) return console.error("bad format (02):",line)
	if (!quiet) {
		console.log("**NOMMAGE***********************")
		console.log("id(02):",items[2],"-->",items[3])
		console.log("********************************")
	}
	let elt = getEltById(items[2]) // creation si besoin
	setName(elt,items[3])
}

// 03|2024-09-20T10:20:35.4840000+02:00|106B5D24|Grande Peluche|03|1E|0000|190|Sagittarius|0|0|895|895|10000|10000|||0.11|7.49|0.00|-3.14|b0a67bda185b9d8d
function parse03() {
	if(!quiet) console.log("identification/monde",items[2],items[3],items[8])
	if (!items[2]) return console.error("bad format (03):",line)
	let elt = getEltById(items[2]) // creation si besoin
	setName(elt,items[3])
	setPos(elt,items[17],items[18],items[19])
	elt.gpMonde=items[8]	
}

// 04|2024-09-21T15:33:19.6450000+02:00|400737D9|Estime|00|64|107639A5|00||8229|10489|0|95142|0|10000|||-101.43|-2.30|18.20|-3.12|d90cd50ddfbb92aa
// 04|2024-10-06T13:33:42.0810000+02:00|10739E2C|Chan Chi|12|3F|0000|27|Omega|0|0|1560|1560|0|10000|||-89.25|1.57|18.80|1.87|0d49172c44330c97
function parse04() {
	if (!quiet) console.log("identification/monde",items[2],items[3],items[8])
	if (!items[2]) return console.error("bad format (04):",line)
	let elt = getEltById(items[2]) // creation si besoin
	setName(elt,items[3])
	setPos(elt,items[17],items[18],items[19])
}

// 20 20|2024-09-20T10:19:02.0490000+02:00|106AB87B|Fallin Tia|05|Téléportation|106AB87B|Fallin Tia|5.000|-89.31|7.00|18.80|0.62|db2513d8533dfaa8
// 20|2024-10-04T12:00:35.3790000+02:00|106C476B|Kikiadoc Lebogosse|04|Monture|106C476B|Kikiadoc Lebogosse|1.000|-430.88|207.69|-0.10|2.27|189e1d04c6b10c8b
function parse20() {
}

// 21|2024-09-20T10:20:19.5030000+02:00|106B5D24|Grande Peluche|03|Sprint|106B5D24|Grande Peluche|1E00000E|320000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|895|895|10000|10000|||-76.61|30.62|9.93|-1.96|895|895|10000|10000|||-76.61|30.62|9.93|-1.96|0000F59D|0|1|00||01|03|03|0.600|300D|
// 21|2024-10-04T12:00:36.3620000+02:00|106C476B|Kikiadoc Lebogosse|D000070|mount_70|106C476B|Kikiadoc Lebogosse|128|700000|1B|48000|0|0|0|0|0|0|0|0|0|0|0|0|74907|74907|10000|10000|||-430.88|207.69|-0.10|2.27|74907|74907|10000|10000|||-430.88|207.69|-0.10|2.27|00009BF0|0|1|00||0D|70|04|0.100|DC4A|1e4ed1fe072498b7
// 21|2024-10-04T12:39:11.0130000+02:00|107D9865|Kikiadoc Lestockeur|D000001|mount_1|107D9865|Kikiadoc Lestockeur|128|10000|1B|48000|0|0|0|0|0|0|0|0|0|0|0|0|13331|13331|0|10000|||-563.06|-160.06|13.53|2.85|13331|13331|0|10000|||-563.06|-160.06|13.53|2.85|00080701|0|1|00||0D|01|04|0.100|F408|3d21c026f9b87d28
// 21|2024-10-04T13:36:09.5150000+02:00|1069B8C4|Grande Peluche|07|Attaque|40000531|Mannequin d'entraînement|710003|80000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|11068|11068|0|10000|||-146.51|-77.50|36.00|-3.14|895|895|10000|10000|||-145.10|-78.22|36.00|-1.14|00015CA6|0|1|00||01|07|07|0.100|517F|a13af68e834ff1ab
function parse21() {
	// cast
}

// 23|2024-09-20T10:17:35.1390000+02:00|10662948|Raeyu Lunaris|05|Téléportation|Cancelled|19ff5728c8620a1d
function parse23() {
}

// 24|2024-09-21T14:50:00.2130000+02:00|1068B9DF|Lydius Grey|HoT|0|31BB|204690|204690|10000|10000|||-65.07|-6.14|17.99|-0.57|1068B9DF|Lydius Grey|0|204690|204690|10000|10000|||-65.07|-6.14|17.99|-0.57|817ffe476073ae23
function parse24() {
}


// 26|2024-09-20T10:20:35.4840000+02:00|32|Sprint|20.00|106B5D24|Grande Peluche|106B5D24|Grande Peluche|1E|895|895|e8a6d4728aa97d5b
function parse26() {
	if (!items[2]) return erreur("bad format (26):",line)
	let eltFrom = getEltById(items[5],true) // PAS de creation si besoin
	let eltTo = getEltById(items[7],true) // PAS de creation si besoin
	setName(eltFrom,items[6])
	setName(eltTo,items[8])
	let cast = { txt: "id="+items[2]+":"+items[3]+":from="+items[5]+":"+items[6]+":to="+items[7]+":"+items[8]+":reste="+items[4], line:line }
	if (eltFrom) eltFrom.casts.push(cast)
	if (eltTo && eltFrom!=eltTo) eltTo.casts.push(cast)
	if (!quiet) console.log('cast',cast)
}

// 37|2024-09-20T10:20:19.6360000+02:00|106B5D24|Grande Peluche|0000F59D|895|895|10000|10000|0||-77.16|30.39|9.94|-1.96|0300|0|0|01|01000032|1E|41A00000|106B5D24|d8bc166c1569db01
function parse37() {
	if (!items[2]) return erreur("bad format (37):",line)
	let elt = getEltById(items[2]) // creation si besoin
	setName(elt,items[3])
	elt.gpDth37 = Date.now()
	setPos(elt,items[11],items[12],items[13])
	// if (items[5]) elt.gpCurHP37 = items[5]
	// if (items[6]) elt.gpMaxHP37 = items[6]
	// if (items[7]) elt.gpCurMP37 = items[7]
	// if (items[8]) elt.gpMaxMP37 = items[8]
	// if (items[11]) elt.gpPosX37 = items[11]
	// if (items[12]) elt.gpPosY37 = items[12]
	// if (items[13]) elt.gpPosZ37 = items[13]
}

// 38|2024-10-06T13:38:06.7470000+02:00|1073ADB7||005A5A08|3413|3413|550|550|0||||||0|0|0|0A016F|41F00000|E0000000|0A0170|41F00000|E0000000|27E80030|0|1073ADB7|429e6274a214a4ce
// 38|2024-09-20T10:20:40.4490000+02:00|106B5D24|Grande Peluche|001E1E03|895|895|10000|10000|0||0.11|7.49|0.03|-3.14|0|0|0|0583|0|E0000000|bcb968ab73e9604d
function parse38() {
	if (!items[2]) return erreur("bad format (38):",line)
	let elt = getEltById(items[2]) // creation si besoin
	setName(elt,items[3])
	elt.gpDth38 = Date.now()
	setPos(elt,items[11],items[12],items[13])
	// if (items[3]) elt.gpName38 = items[3]
	// if (items[5]) elt.gpCurHP38 = items[5]
	// if (items[6]) elt.gpMaxHP38 = items[6]
	// if (items[7]) elt.gpCurMP38 = items[7]
	// if (items[8]) elt.gpMaxMP38 = items[8]
	// if (items[11]) elt.gpPosX38 = items[11]
	// if (items[12]) elt.gpPosY38 = items[12]
	// if (items[13]) elt.gpPosZ38 = items[13]
}

// 39|2024-09-20T10:19:37.6960000+02:00|106D2281|Ophelia Jones|8853|8853|10000|10000|||-70.97|5.28|18.60|1.21|1d452a1facd24df4
function parse39() {
	if (!items[2]) return erreur("bad format (39):",line)
	let elt = getEltById(items[2]) // creation si besoin
	setName(elt,items[3])
	elt.gpDth39 = Date.now()
	setPos(elt,items[10],items[11],items[12])
	// elt.gpName39 = items[3]
	// elt.gpCurHP39 = items[4]
	// elt.gpMaxHP39 = items[5]
	// elt.gpCurMP39 = items[6]
	// elt.gpMaxMP39 = items[7]
	// elt.gpPosX39 = items[10]
	// elt.gpPosY39 = items[11]
	// elt.gpPosZ39 = items[12]
}

// 40|2024-09-20T10:20:35.4840000+02:00|113|La Noscea|Private Mansion - Mist|Ground Floor|329c4c0783abc419
function parse40() {
	if (!quiet) console.log("zone(40):",items[2],"=",items[3],items[4],items[5])
}

// 261|2024-09-20T10:20:49.2960000+02:00|Change|400CE3C0|Name|Goûter ishgardais|728aa8a00426ff97
// status ggeneral : ADD/CHANGE/REMOVE
function parse261() {
	let elt = getEltById(items[3])
	switch (items[2]) {
		case "Add" :
			addProperties(elt,items)
			if (!quiet) console.log("Add:",items[3],elt && elt.Name)
			return
		case "Change" :
			addProperties(elt,items)
			if (!quiet) console.log("Change:",items[3],elt && elt.Name)
			return
		case "Remove" :
			if (!quiet) console.log("Remove:",items[3],elt && elt.Name)
			delete elts[items[3]]
			delete eltsNearsPossibles[items[3]]
			return
	}
	console.error("parse261 unkown:",line)
}

// analyse globale d'une ligne de log
function analyseFF(newLine) {
	try {
		// parse la ligne avec des '|'
		line = newLine
		items = line.split('|')
		if (traceAll) console.log("trace:",line)
		// vire le dernier, je ne sais pas ce que c'est...
		items.pop()
		switch(items[0]) {
			case '00':	// message de chat
				parse00()
				break;
			case '01':	// changment de zone
				parse01()
				break;
			case '02':	// identification
				parse02()
				break;
			case '03':	// identification
				parse03()
				break;
			case '04':	// identification
				parse04()
				break;
			case '20':	// ??
				parse20()
				break;
			case '21':	// ??
				parse21()
				break;
			case '23':	// ??
				parse23()
				break;
			case '24':	// ??
				parse24()
				break;
			case '26':	// cast ?
				parse26();
				break;
			case '37':	// changment de stats/pos perso ?
				parse37();
				break;
			case '38':	// changment de stats/pos perso ?
				parse38();
				break;
			case '39':	// changment de stats/pos mascotte ?
				parse39();
				break;
			case '40':	// changment de zone
				parse40();
				break;
			case '261': // update data
				parse261()
				break;
			// 22 ???
			// 22|2024-10-05T12:06:52.6240000+02:00|6C42E99D||2FFF|Portes de la mort|C171EBDF||DE55EB60|871ADC5|871FDF9|3871FDF9|93DF1390|50F4C74E|2A2D5611|3352E885|95D5CEC5|361EE7D2|D295D5EF|2A2D5651|7B52E885|50685BD2|E8856811|1E6A7152|||||||||||||||||||||71BA93C1|31|32|00||63|DC91432F|2FFF|0.000|6C42|a526a9117bb8d8f3
			// 30 - arret d'un bonus ?                  nom                                                                                        pv     pv
			// 30|2024-10-04T12:44:32.1440000+02:00|70A|Bénédiction de la nature|0.00|107D9865|Kikiadoc Lestockeur|107D9865|Kikiadoc Lestockeur|00|13331|13331|f1dc8837e1eca5a9
			// 30|2024-10-04T12:44:32.1440000+02:00|339|Bénédiction des Douze|0.00|107D9865|Kikiadoc Lestockeur|107D9865|Kikiadoc Lestockeur|00|13331|13331|8defc9958ad1aacb
			// 31 
			// 31|2024-10-04T11:53:18.2370000+02:00|106C476B|17|00|00|00|e1ecdf025de59df6
			// 41
			// 41|2024-10-04T12:14:34.6770000+02:00|37DA6|41E|02|09|0B|a3b30d837cbca664
			// 42:
			// 42|2024-10-04T11:53:19.0440000+02:00|106C476B|Kikiadoc Lebogosse|0|0|0|14016C|41F00000|E0000000|aacd29dd6924b68e
			// 251
			// 251 251|2024-10-05T12:06:52.6240000+02:00|ParseEffectEntry: Unknown Effect EntryType for [7B52E88550685BD2].|bc4af6886e0af335
			// 258:
			// 258|2024-10-04T11:53:16.8160000+02:00|Remove|0000|00000108|00000000|00000000|00000000|00000000|00000000|00000000|b8d3e556c7671a49
			// 260:
			// 260 260|2024-10-05T12:07:00.3470000+02:00|0|0|1|0|f79d85d2408a0350
			// 263 ?? coord ?
			// 263|2024-10-04T12:00:35.3790000+02:00|106C476B|0004|-430.891|207.679|-0.092|2.265|ec7852e3b5a8d308
			// 264 ??
			// 264|2024-10-04T12:00:36.3620000+02:00|106C476B|0070|00009BF0|0|||||86d359675db6e06d
			// 264|2024-10-05T12:06:52.6240000+02:00|6C42E99D|DC91432F|71BA93C1|1|-956.511|-299.570|-233.802|-0.485|5ca2ec63140e50e6
			// 265
			// 265|2024-10-04T11:53:18.3705211+02:00|41F|Unnamed Island|False|0|0|0|0|0|727c8b7f53b04e50
			// 265|2024-10-05T12:34:09.8967445+02:00|153|Mist|False|0|0|0|0|0|c93745be2e6fa662
			// 266
			// 266|2024-10-04T12:04:31.7270000+02:00|40148494|2D0B|3884|7d19ba54dc8df8ce
			// 269
			// 269|2024-10-05T12:33:11.6220000+02:00|6C02F579|124E||c3cede3368cdcecf
			// 270: position d'une mascotte/pnj       ID                         X         Y        Z
			// 270|2024-10-04T11:53:22.4820000+02:00|40148491|2,9315|0040|000A|-422,0710|301,9196|15,8086|b273340965bb0b24
			// 270|2024-10-07T18:47:42.6210000+02:00|40006D05|-0,6307|0000|003C|94,3632|90,8841|0,1526|509fd6cd139b7200
			// 272
			// 272|2024-10-04T12:16:55.2260000+02:00|4005DAC9|E0000000|0000|00|cea40258e33da969
			// 273 d'une mascotte ?                  ID
			// 273|2024-10-04T11:54:26.8850000+02:00|40148491|0197|4|0|0|0|d95c9a7733e1dcca
			default:
				if (!quiet) console.log("ignoré:",line)
		}
		// Ajoute dans l'historique si possible
		addHistorique(items[2],line)
		addHistorique(items[3],line)
		addHistorique(items[4],line)
		addHistorique(items[5],line)
		addByType(line,items)
	}
	catch(e) {
		console.error("*********************************************")
		console.error(line)
		console.error(e)
		console.error("*********************************************")
	}
}

////////////////////////////////////////////////////
// Démarrage de la lecture des logs
////////////////////////////////////////////////////
function initService() {
let tailFF = new Tail(ffLog,{fsWatchOptions:{interval:100}, useWatchFile: true} );
  tailFF.on("line", function(line) { analyseFF(line) });
  tailFF.on("blockEnd", function() { /* console.log("blockEnd"); */ });
  tailFF.on("error", function(error) { console.log("accessr_log ERROR: ", error); });
  console.log('Tail logs started:',ffLog);
}
////////////////////////////////////////////////////
// Geestion des commandes de debug
////////////////////////////////////////////////////
const readLineAsync = () => {
  const rl = readline.createInterface({
    input: process.stdin
  });
  return new Promise((resolve) => {
    rl.prompt();
    rl.on('line', (line) => {
      rl.close();
      resolve(line);
    });
  });
};
// parse des commandes
const readCmd = async () => {
	while(true) {
		console.log('Ready pour commande:');
		const line = await readLineAsync();
		const params = line.split(' ')
		switch(params[0]) {
			case '?':
				console.log("Help *: liste connus n: liste des pnj/joueurs l: dernier par type t:toggle trace <id>: dump le detail de l'Id");
				break
			case '*':
				dumpConnus(params[1])
				break
			case 'n':
				dumpNears(params[1])
				break
			case 'l':
				dumpByLast()
				break
			case 't':
				traceAll = !traceAll
				console.log('TraceAll:',traceAll)
				break
			case 'q':
				quiet = !quiet
				console.log('Quiet:',quiet)
				break
			default:
				dumpId(params[0])
		}
	}
}

////////////////////////////////////////////////////
// Init de kikiBridge
////////////////////////////////////////////////////
readCmd();
initService()
ws.connect(wsUrl)
 
console.log("kikiBridge started")

// ID 10***** --> joueur
// ID 40***** --> mobilier
// ID 00***** --> pnj ?
// Id Kikiadoc 1033557D - lodestone 12945273
// ID Grande Peluche Alpha -> 107CD872 - lodesone 
// ID Kikiadoc seconde connexion... 1033557D
// Id météorologue 4AD204 (cerberus/gridania)
// Id météorologue 4AD204 (moogle/gridania) --> garland 1009718
// Id météorologue 4AD204 (alpha/gridania)
// Id météorologue 4AD209 (moogle/limsa) --> garland 1009716
// nouvelle co: 4AD209 (moogle/limsa)
// poisson-miounne: lodestone 3722b673fb3 - garland 20058 - 
// https://xivapi.com/ENpcResident/1009716
// https://xivapi.com/BNpcName/9716

// 1074AC01 / 54837818-> Zay Zuc
// 1033557D / 12945273 -> Kikiadoc Lepetiot 
// 107CD872 / ?? Grande Peluche
// 4008ABE5 / Yaouanck
// 4008E18A / Yaouanck
// Type: 1 --> joueur
// Type: 2 --> pet de combat carbucle etc...
// Type: 3 --> objet avec intéraction (pas forcement dispo avec le perso)

// entrée dans une zone:
// 

// heading: sud: 0 ouest: -1.60 nord: 3.00 est: 1.50


// CAST notables:

// sprint: durée 20 secondes
// sprint: id=32:Sprint from=10754854:Elainah Gremory to=10754854:Elainah Gremory
// sprint: id=32:Sprint from=100653B9:Simo'lou Lyehga to=100653B9:Simo'lou Lyehga
// sprint: id=32:Sprint from=10702BA6:Ichida Alurea to=10702BA6:Ichida Alurea
// sprint: id=32:Sprint from=1033557D:Kikiadoc Lepetiot to=1033557D:Kikiadoc Lepetiot

// cast repu: peut etre multiple/relancé -- est aussi respawn de facon périodique
// repu: id=30:Repu from=1033557D:Kikiadoc Lepetiot to=1033557D:Kikiadoc Lepetiot
// repu: id=30:Repu from=107A35A4:Seraphin Rey to=107A35A4:Seraphin Rey
// 26|2024-09-15T13:28:58.3060000+02:00|30|Repu|1800.00|1033557D|Kikiadoc Lepetiot|1033557D|Kikiadoc Lepetiot|28FF|116924|116924|121455cf49f49827


// Info sur les mannequin et objets
/*
const tblObjs = [
	"400A7D3C": { Name:"Yaouanck", PosX: 9.8188, PosY: -5.5770, PosZ: 0.0000, Heading: 1.2343,    }
]
*/

//fonction moisie
/*
function isNear(elt) {
	// console.log('isNear start',elt.Name)
	for (e of Object.values(elts)) {
		// test les coordonnees
		if ( elt.Name && e.Name && (elt.Name!=e.Name) && distance(elt,e,DISTANCE)) {
			console.log('Near:',elt.gpId,"=",elt.Name,e.gpId,"=",e.Name,elt.gpX,e.gpX,elt.gpY,e.gpY,elt.gpZ,e.gpZ)
		}
	}
}
function chatAvecPseudo(elt,items,line) {
	// NPCTargetID target pnj
	// PCTargetID target joueur
	let NPCTarget = getEltById(elt.NPCTargetID,true)
	let PCTarget = getEltById(elt.PCTargetID,true)
	console.log(">>> Chat avec Pseudo:",detailStr(elt))
	console.log(">>> NPCTargetID",detailStr(NPCTarget))
	console.log(">>> PCTargetID",detailStr(PCTarget))
	console.log(">>> Chat:",line);
	// Emote...
	if (items[2]=="001D") {
		const dst = PCTarget || NPCTarget
		console.error("Emote de:",elt.gpId,elt.Name,"vers:", dst && dst.gpId, dst && dst.Name, "near:", distance(elt,dst,DISTANCE))
	}
	return 
}
*/

/*
function getEltIdByName(name) {
	for (const [key, value] of Object.entries(elts)) {
		if (value.Name==name) return key
		// faut-il utiliser les autres name par les autres events?
	}
	return null
}
*/
/*
// il y a une protetion contre les sendKeys dans le jeu
// a analyser plus en détail
const sendDire = (msg) => {
}
const sendMurmurer = (msg,id) => {
}
*/

/* from https://github.com/saaratrix/nuu-ffxiv-act-chat-extractor/blob/main/nuu-ffxiv-act-chat-extractor.html
const messageTypes = {
      '000a': { code: '000a', class: 'say', name: 'Say', color: '#ffffff', visible: true },
      '000b': { code: '000b', class: 'shout', name: 'Shout', color: '#eb9234', visible: true },
      '000e': { code: '000e', class: 'party', name: 'Party', color: '#1ecce3', visible: true },
      '000f': { code: '000f', class: 'alliance', name: 'Alliance', color: '#eb9234', visible: true },
      '0018': { code: '0018', class: 'free', name: 'Free Company', color: '#54b068', visible: true },
      // 001c and 001d seems to be emotes.
      '001c': { code: '001c', class: 'emote-custom', name: 'Custom Emote', color: '#df7423', visible: true },
      '001d': { code: '001d', class: 'emote', name: 'Emote', color: '#df7423', visible: true },
      '001e': { code: '001e', class: 'yell', name: 'Yell', color: '#c9c722', visible: true },

      // Tell from you to someone!
      '000c': { code: '000c', class: 'tell-to', name: 'Tell To', color: '#d439cc', prependSender: 'To ', suffixSender: '', visible: true },
      // Tell from someone to you.
      '000d': { code: '000d', class: 'tell-from', name: 'Tell From', color: '#d439cc', prependSender: 'From ', suffixSender: '', visible: true },
      '0039': { code: '0039', class: 'whisper', name: 'Whisper', color: '#d439cc', visible: true },

      '0010': { code: '0010', class: 'linkshell-1', name: 'Linkshell 1', color: '#31b56a', visible: true },
      '0011': { code: '0011', class: 'linkshell-2', name: 'Linkshell 2', color: '#2a8c9c', visible: true },
      '0012': { code: '0012', class: 'linkshell-3', name: 'Linkshell 3', color: '#296196', visible: true },
      '0013': { code: '0013', class: 'linkshell-4', name: 'Linkshell 4', color: '#2d509c', visible: true },
      '0014': { code: '0014', class: 'linkshell-5', name: 'Linkshell 5', color: '#5959b1', visible: true },
      '0015': { code: '0015', class: 'linkshell-6', name: 'Linkshell 6', color: '#7159b1', visible: true },
      '0016': { code: '0016', class: 'linkshell-7', name: 'Linkshell 7', color: '#7b51af', visible: true },
      '0017': { code: '0017', class: 'linkshell-8', name: 'Linkshell 8', color: '#9551af', visible: true },

      '0025': { code: '0025', class: 'cw-linkshell-1', name: 'Cross-World Linkshell 1', color: '#d5ff80', visible: true },
      '0065': { code: '0065', class: 'cw-linkshell-2', name: 'Cross-World Linkshell 2', color: '#cbf37c', visible: true },
      '0066': { code: '0066', class: 'cw-linkshell-3', name: 'Cross-World Linkshell 3', color: '#c2e779', visible: true },
      '0067': { code: '0067', class: 'cw-linkshell-4', name: 'Cross-World Linkshell 4', color: '#b7d47d', visible: true },
      '0068': { code: '0068', class: 'cw-linkshell-5', name: 'Cross-World Linkshell 5', color: '#aec978', visible: true },
      '0069': { code: '0069', class: 'cw-linkshell-6', name: 'Cross-World Linkshell 6', color: '#a6bf73', visible: true },
      '006a': { code: '006a', class: 'cw-linkshell-7', name: 'Cross-World Linkshell 7', color: '#9eb76c', visible: true },
      '006b': { code: '006b', class: 'cw-linkshell-8', name: 'Cross-World Linkshell 8', color: '#97b262', visible: true },

      // 0044: System messages, eg: "The limited-time event “Leap of Faith” is now underway in Round Square. All guests are encouraged to participate!"
    };
*/
