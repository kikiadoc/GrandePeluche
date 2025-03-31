const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');
const discord = require('../infraback/discord.js');


// le nom et descritioin initiale des rubans pouvant être utilisés
RUBANS=[
	{ nom: "metropolis", img:"ff-10/metroChronoIcon-", mp4Final:"ff-10/chevron-8", mp4Inter:"ff-10/chevron", texte:"le chevron", taille: 10, init:[-3,4,5,2,-2,2,5,2], soluce:[4,7,3,7,4,9,3,8], solPos:5 }
]

// contient les rubans indexés par le nom
let rubans = {}

// diffuse un ruban + sync FS
function broadcastRuban(ruban) {
	wsserver.broadcastSimpleOp('ruban.'+ruban.nom,ruban)
	collections.saveSimpleObject('ruban_'+ruban.nom,ruban)
}
// discord lorsque le ruban est termine pour la 1ere fois
function discordRubanTermine(ruban) {
	discord.postMessage(DISCORD_CHANNEL,"\nruban termine",true)
}
// recup la description d'un ruban
function getRubanDesc(nom) {
	const desc = RUBANS.find( (r) => r.nom==nom ) // cherche la description
	if (! desc) gbl.exception("bad nom ruban",400) // ruban non autorisé
	return desc
}
// recupere un ruban
function getRuban(nom) {
	if (rubans[nom]) return rubans[nom] // deja init
	const desc = getRubanDesc(nom) // recupere la description si ruban possible
	// charge l'objet associé si il existe ou l'init a vide
	curr = collections.loadSimpleObject('ruban_'+nom)
	// retourne l'element charge si deja init
	if (curr.init) return rubans[nom]=curr
	// init
	curr.nom = desc.nom
	curr.taille = desc.taille
	curr.soluce = desc.soluce
	curr.solPos = desc.solPos
	curr.texte = desc.texte
	curr.img = desc.img
	curr.pseudos = {}
	// init positions actuelles
	curr.pos = new Array(curr.soluce.length)
	for (let i=0; i < curr.soluce.length; i++) curr.pos[i] = desc.init[i]
	curr.termine = isRubanTermine(curr)
	console.log('init Ruban',curr)
	return rubans[nom]=curr
}
// verifie si une bandelette est a la bonne position
function isRubanPosOk(ruban,c) {
	return (ruban.solPos-ruban.pos[c]==ruban.soluce[c])
}
// verifie si un ruban complet est fini
function isRubanTermine(ruban) {
	return ruban.termine = ruban.soluce.find( (s,c) => !isRubanPosOk(ruban,c) )? false : true
}

// deplace un ruban reqPaths [nom,index,sens]
// 200: ok 201 ruban deja terminé 202 mouvmeent impossible
function deplaceRuban(reqPaths,pseudo) {
	const nom = reqPaths[2] // nom du ruban
	ruban = getRuban(nom)
	if (isRubanTermine(ruban)) gbl.exception("ruban termine",201)
	const c = gbl.checkInt(reqPaths[3],0,ruban.soluce.lenght-1) // numéro du bandelette du ruban
	const s = gbl.checkInt(reqPaths[4],0,1) // sens de deplacement 
	ruban.pos[c] += (s)? -1 : 1	 // deplacement
	ruban.pseudos[pseudo] ??= {}	// normalize
	ruban.pseudos[pseudo].moveDth = Date.now()
	if (isRubanPosOk(ruban,c)) {
		const desc=getRubanDesc(nom)
		if (isRubanTermine(ruban)) {
			if (desc.mp4Final) wsserver.broadcastVideo(desc.mp4Final)
		}
		else {
			if (desc.mp4Inter) wsserver.broadcastVideo(desc.mp4Inter)
		}
	}
	broadcastRuban(ruban)
	gbl.exception('via ws',200)	
}
// efface un ruban pour reinit
// 200: reinit ok
function clearRuban(reqPaths) {
	const nom = reqPaths[2]
	delete rubans[nom]
	collections.deleteSimpleObject('ruban_'+nom)
	const ruban = getRuban(nom)
	broadcastRuban(ruban)
	gbl.exception('ruban reinit',200)
}	

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE')
			gbl.exception("AllowedCORS",200)
		case "GET": 
			gbl.exception(getRuban(reqPaths[2]),200)
		case "POST": 
			deplaceRuban(reqPaths,pseudo)
		case "DELETE": 
			pseudos.check(pseudo,pwd,true) // auth admin
			clearRuban(reqPaths)
	}
	gbl.exception("inv http op ruban",400)
}

console.log("ruban loaded")
