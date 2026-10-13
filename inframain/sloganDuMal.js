const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');


// le slogan
// Posséder les âmes pour notre hégémonie.

// liste des questions/reponses
const lstQR = [
	{ z: "zone0", q: "question0", r: 0, o: ["r0","r1","r2","r3"] },
	{ z: "zone1" ,q: "question1", r: 1, o: ["r0","r1","r2","r3"] },
	{ z: "zone2" ,q: "question2", r: 2, o: ["r0","r1","r2","r3"] },
	{ z: "zone4" ,q: "question3", r: 3, o: ["r0","r1","r2","r3"] }
]

// equilibrage
const RELAXNOUVELLE = 5 * 60000 // 5 minutes

// etat du challenge
let etat= normalize(collections.get("nommerMal", true))

function normalize(t) {
	t.RELAX = RELAXNOUVELLE
	t.lettres ??= new Array(lstQR.length)   	// contien des { sol: lettre, solBy: pseudo, soldDth: dth, solLock: pseudo, solLockDth: dth }
	return t
}

// retourne l'etat actuel
function getEtat() {
	return etatTorches
}

function admReset() {
	etat= normalize(collections.reset("nommerMal"))
}

// sycnho les clients
function syncClients(pseudo) {
	// broadcast sur le WS
	wsserver.broadcastSimpleOp("nommerMal",getEtat())
}

// propose reponse (200 reponse OK, 201 ok challenge terminé, 202 mauvaise réponse, 400 erreur de synch)
function proposeReponse(pseudo,reqPaths) {
	const now = Date.now()
	// si mauvaise reponse
	if (parseInt(reqPaths[3],10) != lstQR[etatTorches.question.idx].r ) {
		etatTorches.relaxDthByPseudo[pseudo] = now + RELAXBYERREUR
		collections.save(etatTorches)
		gbl.exception(getEtat(),202)
	}
	// reponse OK
	etatTorches.historique.push( { pseudo: pseudo, idx: etatTorches.question.idx, dth: now } )
	etatTorches.question = nouvelleQuestion(etatTorches)
	etatTorches.relaxDthByPseudo[pseudo] = now + RELAXBYREPONSE * getCountReponse(pseudo)
	collections.save(etatTorches)
	wsserver.broadcastSimpleText(pseudo+" a envoyé la Torchère dans les limbes",true)
	syncClients(pseudo)
	// retourne 200 ou 201 selon que le challenge est terminé
	gbl.exception("synch by WS", (etatTorches.question)? 200:201)
}


exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// GET etat retourne état courant
					gbl.exception( getEtat() , 200) 
			}
			gbl.exception("torches get",400);
		case "PUT": 
			switch(reqPaths[2]) {
				case "propose":
					proposeReponse(pseudo,reqPaths);
			}
			gbl.exception("torches put",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "admReset":
					admResetTorches()
					syncClients(null)
					gbl.exception("torches clear ok",200);
			}
			gbl.exception("torches patch",400);
	}
	gbl.exception("inv http op toches",400);
}

console.log("torches loaded")
