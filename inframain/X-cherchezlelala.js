const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');

// nom de la collection
const COLNAME="X-cherchezlelala"

const LALANOM = "raraKiya"
const Q_ORTHO = "L'Ortho-Temps"
const Q_KIKIADOC = "Kikiadoc"
const Q_DIMQUANT = "Deux Physiques"
const Q_GOMJABBAR = "Gom Jabbar"
const Q_INTRIQ = "L'Intrication Quantique"
const Q_OMEGA = "Station Oméga"
const Q_BUNBUKU = "Boulier Bunbuku"
const Q_Tatooine = "Tatooine"
const Q_LASOURCE = "La Source"
const Q_BOISBANDE = "Le Bois Bandé"
const Q_CARNETCIEUX = "Carnet des Cieux"
const Q_Sennacherib = "Sennachérib"
const Q_CARNETTEMPS = "Carnet du Temps"
const Q_LaLaLanternes = "LaLa-Lanternes"
const Q_Indices = "IndiceS"
const Q_Objets = "NombreuX ObjetS"
const Q_Innatendus = "ObjetS Innatendus"

// ﹇
const QUESTIONS = [
	{ t: "txt", ph: gbl.alphanum2placer(Q_Objets), q: "Rend-toi dans la maison de CL de Kikiadoc (Moogle, Brumée, secteur 19, slot 5) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_Objets, mp4: "ff-3-youki.mp4" /// Lepetiot cl
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_Innatendus), q: "Rend-toi dans la maison personnelle de Kikiadoc (Moogle, Shirogane, secteur 22, slot 46) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_Innatendus, mp4: "ff-1-quinzaine-gogodancer"  /// Lepetiot Perso
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_Indices), q: "Rend-toi dans la Garçonnière de Kiki (Un appartement de Moogle, Brumée, secteur 5) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_Indices, mp4: "ff-4-distraire" /// Lepetiot
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_LaLaLanternes), q: "Rend-toi dans le Kiki's Sauna (une chambre) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_LaLaLanternes, mp4: "ff-2-lalanternes" /// Lepetiot
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_Sennacherib), q: "Rend-toi dans les Jardins Suspendus (Un appartement de Moogle, Lavandière, secteur 24) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_Sennacherib, mp4: "ff-6-teaser3" /// Lestockeur
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_CARNETTEMPS), q: "Rend-toi dans la chambre du Temps et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_CARNETTEMPS, mp4:"ff-3-temps" /// Lestockeur
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_BOISBANDE), q: "Rend-toi dans le Bois Bandé (Un appartement de Moogle, La Coupe, secteur 16) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_BOISBANDE, mp4: "ff-3-robin" /// L'explo
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_CARNETCIEUX), q: "Rend-toi dans la chambre du Labyrinthe et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_CARNETCIEUX, mp4:"ff-3-dedale" /// L'explo
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_LASOURCE), q: "Rend-toi sur la station Alpha (Un appartement de Moogle, Brumée, secteur 3) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_LASOURCE, /// Le mignon
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_Tatooine), q: "Rend-toi dans la chambre du Pont de l'Enterprise et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_Tatooine, /// Le mignon
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_OMEGA), q: "Rend-toi dans les Trésors de l'Hégémonie (Un appartement de Moogle, Empyrée, secteur 9) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_OMEGA, mp4: "ff-7/ff-7-omega-final",	/// lebogosse
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_BUNBUKU), q: "Rend-toi dans la chambre du 4ème Pouvoir et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_BUNBUKU, mp4: "ff-7/ff-7-boulier",	/// lebogosse
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_GOMJABBAR), q: "Rend-toi dans le temple des Bene Gesserit (Un appartement de Moogle, La Coupe, secteur 15) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_GOMJABBAR,	mp4: "ff-4-benegesserit",	/// Lecalin
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_INTRIQ), q: "Rend-toi dans la chambre de la Force et indique moi le mot de passe indiqué sur le livre de correspondance (le livre est caché)",
		r: Q_INTRIQ ,	mp4: "ff-4-laforce",	/// Lecalin
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_DIMQUANT), q: "Rend-toi dans le Temple des Dimensions (Un appartement de Moogle, Lavandière, secteur 5) et indique moi le mot de passe indiqué sur le livre de correspondance",
		r: Q_DIMQUANT, mp4: "ff-5-rapidite"	/// Lejoli
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_KIKIADOC), q: "Rend-toi dans ma chambre, l'Oracle des Savoirs et indique moi le mot de passe indiqué sur mon livre de correspondance.",
		r: Q_KIKIADOC  , mp4: "ff-5-teaser1"	/// Lejoli
	},
	{ t: "txt", ph: gbl.alphanum2placer(Q_ORTHO), q: "Rend-toi dans le chronogyre (Moogle, La coupe, secteur 8, appartement 69) et indique moi le mot de passe indiqué sur le livre de correspondance.",
		r: Q_ORTHO, mp4: "ff-10/ff-10-metropolis-3d.mp4"		/// Lecoquin
	},
	{ t: "txt", ph: "﹇﹇", q: "Rend-toi dans la chambre du Dirac des Dimensions et indique moi le mot de passe indiqué sur le livre de correspondance.",
		r: "34" ,	mp4: "ff-6-epilogue.mp4"	/// Lecoquin
	},
]
const CONF= {
	NBL: 6, NBC: 3,	// pour les 18 carnets disponibles
	PROBA: 10,			// probabilité initiale, prochaine par random, trouvé si arrivé a 1
	NBPIOCHEINIT: 3,				// nombre de de possible (regen apres 5 minutes)
	DETACHANTTIMER: 20000,	// 5*60000, // 5 minutes
	UNLOCKTIMER: 30000,	// 60*60000, // 1 heure
	LALAPH: gbl.alphanum2placer(LALANOM)

}
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.slots ??= new Array(CONF.NBL*CONF.NBC)
	for (let i=0; i < CONF.NBL*CONF.NBC; i++) {
		e.slots[i] ??= { proba:1 }
	}
	e.pseudos ??= {}
	return e
}
function resetSlot(idx) {
	// reset tout sauf soluce
	etat.slots[idx].proba = 1
	etat.slots[idx].unlockPseudo = null
	etat.slots[idx].unlockEcheance = null
	etat.slots[idx].enigme = null
}
function recalcEtat() {
	const now = Date.now()
	for (let i=0; i < CONF.NBL*CONF.NBC; i++) {
		// Si echeance de unlock dépassée
		if (etat.slots[i].unlockPseudo && etat.slots[i].unlockEcheance < now) {
			resetSlot(i)
		}
	}
	return etat
}
// Reset global du mini-jeu
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	etat = normalize(collections.reset(COLNAME))
	syncClients()
}
// synch clients
function syncClients(texte,couleur) {
	collections.save(etat)
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	if (texte) wsserver.broadcastSimpleText(texte, "Ding" , couleur, 10)
}

// 
// Augmente la proba d'une case e
function detachantUtilise(pseudo,idx) {
	let msg = null
	let slot = etat.slots[idx]
	let ep = etat.pseudos[pseudo]
	if (!ep) gbl.exception("detachantUtilise: etat invalide "+pseudo,400)
	if (ep.detachantNb <= 0) gbl.exception("detachantUtilise impossible ep.detachantNb<=0 slot="+idx,400)
	if (slot.proba >= CONF.PROBA) gbl.exception("detachantUtilise impossible proba>=CONF.PROBA slot="+idx,400)
	if (slot.soluceDth) gbl.exception("detachantUtilise impossible deja soluce slot="+idx,400)
	// ajoute un up pour le pseudo
	ep.upNb++
	ep.detachantNb--
	ep.detachantEcheance = (ep.detachantNb<=0)? Date.now()+CONF.DETACHANTTIMER : null
	// determine le prochain niveau de proba
	slot.proba += Math.max(1,Math.floor(Math.random()*(CONF.PROBA - slot.proba))) // nombre de step d'augmentation
	if (slot.proba >=  CONF.PROBA) {
		// C'est pseudo est decouvreur de l'indice et il doit être découvert dans les délais
		slot.proba =  CONF.PROBA
		slot.unlockPseudo = pseudo
		slot.unlockEcheance = Date.now() + CONF.UNLOCKTIMER
		slot.enigme = Object.assign({},QUESTIONS[idx%QUESTIONS.length])
		delete slot.enigme.r // pas la reponse dans le client
		msg = pseudo+" a révélé une partie du parchemin"
	}
	else {
		msg = pseudo+" a utilisé du détachant"
	}
	syncClients(msg,"green")
}
// recalc le nb de detachant retourne fals ou true si detachantNb mis a jour
function detachantCalc(ep) {
	if (!ep) { console.log("detachantCalc: etat invalide ",ep); return false }
	if ( ep.detachantNb > 0) { console.log("detachantCalc: detachantNb > 0",ep); return false }
	if ( ep.detachantEcheance > Date.now() ) { console.log("detachantAdd, detachantEcheance unsync",ep); return false }
	ep.detachantNb = 1
	ep.detachantEcheance = null
	return true
}
// demande client de d'ajout d'une detachant car timeout
function detachantAdd(pseudo) {
	let ep = etat.pseudos[pseudo]
	if (!detachantCalc(ep)) gbl.exception("detachantAdd, client unsync",400)
	syncClients()
}
// propose une réponse pour le nom du lala
function nomLala(pseudo,json) {
	let ep = etat.pseudos[pseudo]
	if (!ep) gbl.exception("nomLala: etat invalide "+pseudo,400)
	if (etat.lalaTrouve) gbl.exception("nomLala: lala deja trouve",400)
	if (json.reponse.toLowerCase() != LALANOM.toLowerCase()) {
		// mauvaise  réponse
		syncClients(pseudo+" s'est trompé","red")
	}
	else {
		// bonne réponse
		etat.lalaTrouve = { pseudo: pseudo, dth: Date.now(), nom: LALANOM.toLowerCase() }
		syncClients(pseudo+" a trouvé le lala","lightgreen")
	}
	
}
// propose une réponse
function reponse(pseudo,idx,json) {
	let slot = etat.slots[idx]
	let ep = etat.pseudos[pseudo]
	if (!ep) gbl.exception("reponse: etat invalide "+pseudo,400)
	if (!slot.unlockPseudo) gbl.exception("reponse: pas unlock slot "+idx,400)
	if ( slot.unlockEcheance < Date.now() ) gbl.exception("reponse: echeance unlock slot"+idx,400)
	if (!slot.enigme) gbl.exception("reponse: enigme manquante slot"+idx,400)
	if (!json?.reponse) gbl.exception("reponse: reponse manquante slot"+idx,400)
	if (json.reponse.toLowerCase() != QUESTIONS[idx%QUESTIONS.length].r.toLowerCase()) {
		// mauvaise  réponse
		resetSlot(idx)
		syncClients(pseudo+" s'est trompé","orange")
	}
	else {
		// bonne réponse
		ep.soluceNb++
		resetSlot(idx) // pour retirer les elements inutiles
		slot.solucePseudo = pseudo
		slot.soluceDth = Date.now()
		syncClients(pseudo+" a indiqué une bonne réponse","lightgreen")
	}
}

// API Calls
exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	recalcEtat()		// car les timers ont pu echoir
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// Si le pseudo est nouveau, on initialise l'état pour ce pseudo
					etat.pseudos[pseudo] ??= { initDth: Date.now(), upNb: 0, soluceNb: 0, detachantNb: CONF.NBPIOCHEINIT }
					// recalc si reload ou init page
					detachantCalc(etat.pseudos[pseudo])
					// retroune l'état global
					gbl.exception( etat, 200) 
       case "config":
          // retroune les zones en JSON direct
          gbl.exception( CONFJSON , 200, true)
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "detachantUtilise":
					// clic sur case, maj par WS
					detachantUtilise(pseudo,gbl.checkInt(reqPaths[3],0,CONF.NBL*CONF.NBC-1))
          gbl.exception( "ok" , 200)
				case "detachantAdd":
					// timer selon client, recalcule les detachants
					detachantAdd(pseudo)
          gbl.exception( "ok" , 200)
				case "reponse":
					reponse(pseudo,gbl.checkInt(reqPaths[3],0,CONF.NBL*CONF.NBC-1),JSON.parse(body))
          gbl.exception( "ok" , 200)
				case "nomLala":
					nomLala(pseudo,JSON.parse(body))
          gbl.exception( "ok" , 200)
			}
			gbl.exception(COLNAME+" post",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "admFill":
					etat.pseudos[pseudo].detachantNb=10
					syncClients()
          gbl.exception( "ok" , 200)
				case "admMove": {
					let idx = gbl.checkInt(reqPaths[3],0,CONF.NBL*CONF.NBC-1)
					etat.slots[idx].unlockPseudo = "*AUTRE*"
					etat.slots[idx].unlockEcheance = Date.now() + CONF.UNLOCKTIMER
					syncClients()
          gbl.exception( "ok" , 200)
				}
			}
			gbl.exception(COLNAME+" patch",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // auth admin
			globalReset()
      gbl.exception( "ok" , 200)
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
