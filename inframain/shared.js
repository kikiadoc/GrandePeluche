//
// Un share est un tableau de moins de 20 éléments contenant une valeur entre 0 et 20
// Il est brocasté à tous les clients lors d'une modification (share.nom sur le WS)
// chaque indice contient le pseudo et le dth du drenier ayant modifié le share
//
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');

// liste des shared autorisés
SHARED=[
	{nom:"metropolis",len:10}
]

// contient les shared indexés par le nom
let shared = {}

// diffuse un share
function broadcastShare(share) {
	wsserver.broadcastSimpleOp('shared.'+share.nom,share)
	collections.saveSimpleObject('shared_'+share.nom,share)
	return share
}
// recupere un share
function getShare(nom) {
	if (shared[nom]) return shared[nom] // share deja init
  const desc = SHARED.find( (t) => t.nom==nom ) // cherche la description
	if (! desc) gbl.exception("bad nom share",400) // share non autorisé
	// charge l'objet associé si il existe ou l'init a vide
	let curr = collections.loadSimpleObject('shared_'+nom)
	// normalize
	curr.nom ??= nom
	curr.valeurs ??= Array(desc.len).fill(null)
	for (let i=0;i<desc.len;i++) {
		console.log('share',i,curr.valeurs[i])
		curr.valeurs[i] ??= {valeur:null}
	}
	shared[nom]=curr
	return curr
}
// reinit un share
function clearShare(pseudo,reqPaths) {
	const nom=reqPaths[2]
	const curr = getShare(nom)
	console.log('** clearShare',nom)
	delete shared[nom]
	collections.deleteSimpleObject('shared_'+nom)
	return broadcastShare(getShare(nom))
}
// positionne un share
function setShare(pseudo,reqPaths) {
	const share = getShare(reqPaths[2])
	const idx= gbl.checkInt(reqPaths[3],0,20)
	const val= gbl.checkInt(reqPaths[4],0,20)
	share.valeurs[idx] = { valeur:val, pseudo: pseudo, dth: Date.now() }
	return broadcastShare(share)
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	// auth
	pseudos.check(pseudo,pwd);

	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			gbl.exception( getShare(reqPaths[2]),200)
		case "POST": 
			gbl.exception( setShare(pseudo,reqPaths), 200)
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // auth admin
			gbl.exception( clearShare(pseudo,reqPaths), 200)
	}
	gbl.exception("inv http op shared",400);
}

console.log("shared loaded")
