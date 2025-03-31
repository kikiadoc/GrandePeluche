

throw new Error("Taquin non termine")


const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');
const discord = require('../infraback/discord.js');


// le nom et descritioin initiale des taquins pouvant être utilisés
// attention, le contenu valide commence a l'index 1, la case null est la case vide du taquin
// ok est le tableau pour la reussite, ok.p est la position et ok.v est la valeur de la case
TAQUINS=[
	{ nom: 'metropolis', size: 5, init:[1,2,3,4,null,6,7,8,9,10,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], ok:[{p:7,v:1},{p:8,v:2},{p:9,v:4} ] }
]

// contient les taquins indexés par le nom
let taquins = {}

// diffuse un taquin + sync FS
function broadcastTaquin(taquin) {
	wsserver.broadcastSimpleOp('taquin.etat',taquin)
	collections.saveSimpleObject('taquin_'+taquin.nom,taquin)
}
// discord lorsque le taquin est termine pour la 1ere fois
function discordTaquinTermine(taquin) {
	discord.postMessage(DISCORD_CHANNEL,"\nPeut-être que tu peux lui demander!",true)
}
// recupere un taquin
function getTaquin(nom) {
	if (taquins[nom]) return taquins[nom] // taquin deja init
  const desc = TAQUINS.find( (t) => t.nom==nom ) // cherche la description
	if (! desc) gbl.exception("bad nom taquin",400) // taquin non autorisé
	// charge l'objet associé si il existe ou l'init a vide
	let curr = collections.loadSimpleObject('taquin_'+nom)
	// normalize
	curr.nom ??= desc.nom
	curr.size ??= desc.size
	curr.etat ??= desc.init
	curr.last ??= Array(desc.size*desc.size).fill(null) // contient le pseudo/dth de dernier action
	curr.ok ??= desc.ok
	curr.termine = isTaquinTermine(curr)
}
function clearTaquin(taquin) {
  const desc = TAQUINS.find( (t) => t.nom==taquin.nom ) // cherche la description
	taquin.size = desc.size
	taquin.etat = desc.init
	taquin.last = Array(desc.size*desc.size).fill(null) // contient le pseudo/dth de dernier action
	taquin.ok = desc.ok
	taquin.termine = isTaquinTermine(taquin)
}
// verifie si un taquin est fini
function isTaquinTermine(taquin) {
	if (taquin.termine) return true
	// teste les positions devant être ok
	taquin.termine = taquin.ok.findIndex( (o) => taquin.etat[o.i] != o.v }} < 0
	return taquin.termine
}
// teste si la position pos est dans la soluce
function isTaquinPosSoluce(taquin,pos) {
	return taquin.ok.findIndex( (o) => o.pos==pos && taquin.etat[pos]==o.v ) >=0
}
// demande de deplacement dans un taquin
// le test d'intégrite n'est pas suffisant, mais bon, le client le fait déja
// 200: mvt ok 201 mvt non valilde 400 erreur de synchro?
function moveTaquin(reqPaths,pseudo) {
	let taquin = getTaquin(reqPaths[3])
	let org = gbl.checkInt(reqPaths[4],0,taquin.size*taquin.size-1)
	if (isTaquinPosSoluce(taquin,org)) gbl.exception("Dans la solution",201) // tentative de deplacemnt d'un truc en soluce
	let dst = gbl.checkInt(reqPaths[5],0,taquin.size*taquin.size-1)
	let o = taquin.etat[org]	
	let d = taquin.etat[dst]	
	if (!o) gbl.exception("case vide",400) // tentative de deplacemnt du vide
	if (d) gbl.exception("case non vide",400) // tentative de deplacemnt vers un non vide
	taquin.etat[org] = d
	taquin.etat[dst] = o
	taquin.last[dst] = { p: pseudo, dth: Date.now() }
	gbl.exception("via ws",200) // 
}


	discord.postMessage(DISCORD_CHANNEL,"\nGG !\n**"+pseudo+" a découvert le nom de l'Innommable!**\nPeut-être que ce secret sera rendu public!\nPeut-être que tu peux lui demander!",true)
	wsserver.broadcastSimpleOp('innommable',statusDamier)
	wsserver.broadcastSimpleText(pseudo+" a découvert le nom de l'innommable",true)
	gbl.exception('maj via ws',201)
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	// auth
	pseudos.check(pseudo,pwd);

	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// GET retourne état courant pour le pseudo
					gbl.exception( statusDamier , 200) 
				case "enigme":
					// demande d'une énigme
					let iEnigme = checkEnigmeIndex(reqPaths[3])
					gbl.exception( { i: iEnigme, q: lstReponses[iEnigme].q, h: gbl.alphanum2placer(lstReponses[iEnigme].r) }, 200);
			}
			gbl.exception("innommable get",400);
		case "PUT": 
			switch(reqPaths[2]) {
				case "resoudre":
					resoudre(reqPaths,pseudo);
				case "shiftRuban":
					shiftRuban(reqPaths,pseudo);
				case "souhaitGift":
					souhaitGift(reqPaths,pseudo);
				case "reponseGift":
					reponseGift(reqPaths,pseudo);
				case "proposition":
					proposition(reqPaths,pseudo);
			}
			gbl.exception("innommable put",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "clearAll":
					statusDamier={}
					normalizeDamier()
					// commit
					collections.save(statusDamier);
					wsserver.broadcastSimpleOp('innommable', statusDamier)
					gbl.exception("innommable clearall ok",200);
				case "clearTimer":
					delete statusDamier.enigmeNextDthByPseudo[pseudo]
					delete statusDamier.shiftNextDthByPseudo[pseudo]
					delete statusDamier.giftNextDthByPseudo[pseudo]
					delete statusDamier.propositionNextDthByPseudo[pseudo]
					delete statusDamier.nomTrouve
					// commit
					collections.save(statusDamier);
					wsserver.broadcastSimpleOp('innommable',statusDamier)
					gbl.exception("innommable clearatimer ok",200);
				case "deleteFirst":
					statusDamier.enigmes[0]=null
					// commit
					collections.save(statusDamier);
					wsserver.broadcastSimpleOp('innommable',statusDamier)
					gbl.exception("innommable clearatimer ok",200);
				case "unlockFirst":
					delete statusDamier.enigmes[0].locker
					delete statusDamier.enigmes[0].lockerDth
					// commit
					collections.save(statusDamier);
					wsserver.broadcastSimpleOp('innommable',statusDamier)
					gbl.exception("innommable clearatimer ok",200);
			}
			gbl.exception("innommable patch",400);
	}
	gbl.exception("inv http op innommable",400);
}

normalizeDamier()
console.log("innommable loaded")
