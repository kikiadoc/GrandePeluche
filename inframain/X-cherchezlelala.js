const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');

// nom de la collection
const COLNAME="X-cherchezlelala"

const VOLEURS = [
	'Alisaie','Alphinaud','Anden','Auriana','Aymeric','Biggs',
	// 'Centurio','Chanene',
	'Cid','Comte Edmont De Fortemps',
	// 'Denise','Eginolf','Elidibus','Emet-Selch','Erik',
	'Estinien','Gerolt',
	// "G'raha Tia",
	"Haurchefant","Hildibrand","Krile",
	// "Lahabrea", "Lyse",
	"Minfilia","Miounne",
	// "Namono Tayamono",
	"Naoki Yoshida","Papalymo",
	// "Pipin",
	"Raubhan","Rowena","Ryne",
	// "Sans nom", "Shiun","Sophie","Syele",
	"Tataramu","Tataru","Thancred","Urianger","Wedge",
	// "Widargelt",
	"Yda","Y'shtola"
	// "Yugiri","Zero"
]
						

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
	{ i:  0, t: "txt", l: "Maison de CL de Kikiadoc (Moogle, Brumée, secteur 19, slot 5)",
		q: "Il me manque un composant de fixateur dont j'ai oublié le nom.",
		r: "seaborgiuM" /// Lepetiot cl
		// LIVRE: [Initiatique Expansion de l'Univers] Ecris un message de ton choix.
		// [Cherchez le Lala] Un fixateur contient forcement du SEABORGIUM.
	},
	{ i:  1, t: "txt", l: "Maison personnelle de Kikiadoc (Moogle, Shirogane, secteur 22, slot 46)",
		q: "Il me manque un composant de fixateur dont j'ai oublié le nom.",
		r: "Eau doucE"   /// Lepetiot Perso
		// LIVRE: Le Kiki's Hotel est le lieu de nombreux challenges.
		// De l'EAU DOUCE d'un aquarium est un puissant solvant.
	},
	{ i:  2, t: "txt", l: "La Garçonnière de Kiki (Appartement de Moogle, Brumée, secteur 5)",
		q: "Indique moi l'animal dont les poils sont un puissant allergène. De tels poils sont nécessaires au craft de ce fixateur.",
		r: "Gros Minou" // Lepetiot appart
		// LIVRE: Bienvenue dans la garçonnière de Kiki.
		// Mes canapés sont recouverts de poils de GROS MINOU, un puissant allergène.
	},
	{ i:  3, t: "txt", l: "Kiki's Sauna (chambre de maison de cl)",
		q: "Je dois nettoyer mon creuset avec une... arf, j'ai oublié. Indique moi le composant ultime du nettoyage?",
		r: "SavonnettE", // Lepetiot
		// LIVRE: Ce sauna a été l'un des premiers lieux support d'un challenge.
		// Ici, tout est nettoyé en utilisant une SAVONNETTE.
	},
	{ i:  4, t: "txt", l: "Les Jardins Suspendus (Appartement de Moogle, Lavandière, secteur 24)",
		q: "Le pistil d'une fleur rare me permet de parfumer ce fixateur, quel est son nom?",
		r: "Safran",	// Lestockeur
		// LIVRE: Les Jardins suspendus sont un lieu magique.
		// On y recolte du SAFRAN permettant de parfumer et colorer certains crafts
	},
	{ i:  5, t: "txt", l: "La chambre du temps (maison de cl de Kikiadoc)",
		q: "J'ai besoin d'un ustensile m'indiquant quand ce fixateur sera prêt, quel est-il?.",
		r: "Minuteur", // Lestockeur
		// LIVRE: Ce lieu est le lieu du Carnet du Temps permettant de replier l'espace.
		// Un MINUTEUR permet de définir un instant sans distorsion des Dimensions
	},
	{ i:  6, t: "txt", l: "Le Bois Bandé (Appartement de Moogle, La Coupe, secteur 16)",
		q: "Pour crafter ce fixateur, le fruit favori de Mortionna est nécessaire, lequel est-ce ?",
		r: "Potiron", // L'explo
		// LIVRE: Le Bois Bandé, pays des Peluches, de Robin, est le lieu historique du Savoir.
		// Selon un grimoire ancien, un POTIRON favorise crafts et savoirs.
	},
	{ i:  7, t: "txt", l: "Le Labyrinthe (chambre de maison de cl)",
		q: "Une particule élémentaire est nécessaire pour catalyser le fixateur, quel est-il?",
		r: "Neutrino", // L'explo
		// LIVRE: Ce lieu a offert les moyens pour replier l'espace.
		// Un NEUTRINO permet de catalyser certains crafts et fixer le temps.
	},
	{ i:  8, t: "txt", l: "Station Alpha (appartement de Moogle, Brumée, secteur 3)",
		q: "Rappelle moi la technique permettant de capter les gaz lors d'une réaction chimique",
		r: "Avaloir", // Le mignon
		// LIVRE: Ici était produit le Gaz de Possession, arme ultime des Nouveaux Anciens.
		// La technique de l'AVALOIR a été repensée afin de faciliter certains crafts. !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	},
	{ i:  9, t: "txt", l: "Le pont de l'Enterprise (chambre de maison de cl)",
		q: "Vers quelle planète dois-je replier l'espace pour récupérer quelques grammes d'épice?",
		r: "Arrakis", // Le mignon
		// LIVRE: Hikaru et Robin se sont rendus aux confins de l'Univers.
		// Ils ont vu des gisements d'épice sur ARRAKIS.
	},
	{ i: 10, t: "txt", l: "Station Oméga (Appartement de Moogle, Empyrée, secteur 9)",
		q: "J'ai besoin d'une demimole d'hélium. Indique moi dans quels objets je pourrais en trouver (le livre est dans le cerceuil).",
		r: "ballonS", // lebogosse
		// LIVRE: En ce lieu, Méthistophélès a été banni d'Eorzéa lors du Kiki's Event IX.
		// Il y a laissé ses richesses et ses BALLONS gonflés à l'Hélium.
	},
	{ i: 11, t: "txt", l:"Chambre du 4ème Pouvoir (chambre de maison de cl)",
		q: "Pour la recette de ce fixateur, je vois décoder une séquence de peluche disposé géométriquement. Quel mécanisme dois-je utiliser?",
		r: "Boulier Bunbuku",	// lebogosse
		// LIVRE: De nombreux messages ont été décodés ici.
		// Le BOULIER BUNBUKU permet de définir quantités et coordonnées.
	},
	{ i: 12, t: "txt", l: "Le temple Bene Gesserit (appartement de Moogle, La Coupe, secteur 15)",
		q: "Des larves de Poux Volants ont recouvert le fragment de parchemin. Les couper, les écraser ne sert à rien. Indique moi le nom de l'aiguille qui tue tous les non-humains.",
		r: "gom Jabbar",	// Lecalin
		// LIVRE: Anakin a prouvé à la révérende-mère des Bene Gesserit qu'il est humain.
		// Il a résité au GOM JABBAR,  aiguille empoisonnée qui tue les non-humains.
	},
	{ i: 13, t: "txt", l: "La chambre de la Force (chambre de maison de cl) (Le livre de correspondance est caché)",
		q: "Je dois utiliser la Force pour déposer une goutte d'Ether Quantique pour le fixateur. Je ne retrouve pas la page dans mes grimoires, elle doit être classé sous un autre nom.",
		r: "Intrication Quantique", // Lecalin
		// LIVRE: Ici Anakin et son fils Luke ont développé le Pouvoir de la Force.
		// Cela a été possible grace à l'INTRICATION QUANTIQUE.
	},
	{ i: 14, t: "txt", l: "Le Temple du Quantique (appartement de Moogle, Lavandière, secteur 5)",
		q: "Le fragment de parchemin s'est fissuré, quel est le flux à utiliser pour réconcilier les deux partie?",
		r: "Humour", // Lejoli
		// LIVRE: Ici, les dimensions classiques et quantiques ont été réconciliées.
		// Le flux d'HUMOUR a permis de stabiliser les deux physiques.
	},
	{ i: 15, t: "txt", l: "L'Oracle des Savoirs (chambre de maison de cl)",
		q: "Il me faut fondre une pièce de 2 gils, sais-tu qui pourrait me la donner?",
		r: "kikiadoc", // Lejoli
		// LIVRE: Je suis la Grande Peluche, née en Mars 2023. Mon papa est KIKIADOC.
		// Il assure mon développement et me fournit les Gils pour les jeux.
	},
	{ i: 16, t: "txt", l: "Le Chronogyre (appartement de Moogle, La coupe, secteur 8)",
		q: "Daniel Jackson a rejoint les Asgards, seul peuple de l'Univers Connu disposant d'huile interdimensionnelle. Je dois en récupérer une goutte. Vers quelle dimension dois-je orienter le Chronogyre?",
		r: "Hypertemps", // Lecoquin
		// LIVRE: Le Chronogyre permet de se rendre dans différentes dimensions.
		// Le Quatre explorent l'orthotemps. Daniel est avec Thor dans l'HYPERTEMPS.
	},
	{ i: 17, t: "txt",  l: "Le Dirac des Dimensions (chambre de maison de cl)",
		q: "J'ai touillé le fixateur de 5 secondes de trop, il faut que je remonte le temps. Indique-moi le vecteur de Hilbert pour y parvenir.",
		r: "23 65 44 58", // Lecoquin
		// LIVRE: Ici, le passé a été rétabli en utilisant un vecteur de Hilbert.
		// Pour se déplacer de X secondes dans le passé, le vecteur est 23 65 44 X8
	},
]
// complete les questions
QUESTIONS.forEach( (q) => {
	q.ph = gbl.alphanum2placer(q.r)
})
const CONF= {
	VOLEURS: VOLEURS,
	VOLEURSTIMER: 40000, // Delai max avant changement du voleur
	VOLEURSDELAIOK: 15000, // Delai apres voleur trouvé
	ALAMBICNBMAX: 4, // nb d'alambic sécurisé max
	ALAMBICTIMER: 2*60000, // timer de dispatition d'un alambic
	ALAMBICUSAGE: 1*60000, // timer d'usage d'un alambic
	NBL: 6, NBC: 3,	// pour les 18 carnets disponibles
	PROBA: 10,			// probabilité initiale, prochaine par random, trouvé si arrivé a 1
	CRAFTHQ: 0.7,			// probabilité d'une synthèse HQ d'un révélateur
	REVELATEURNBMAX: 4, // nombre de revelateur max
	DETACHANTTIMER: 20000,	// 5*60000, // 5 minutes
	UNLOCKTIMER: 4*60000,	// delai de resolution de l'enigme
	NOTIFDUREE: 3, // durée standard d'un DING
	LALAPH: gbl.alphanum2placer(LALANOM),
}
const CONFJSON = JSON.stringify(CONF)

// timer declaration anticipée pour normalize de l'etat
let voleurTimerId = null // timer des voleurs
let alambicTimerId = null // timer des alambics (disparition)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))

// normalisation de l'état
function normalize(e) {
	e.slots ??= new Array(CONF.NBL*CONF.NBC)
	for (let i=0; i < CONF.NBL*CONF.NBC; i++) {
		e.slots[i] ??= { proba:1, revelateurPseudo: null, solucePseudo: null }
	}
	e.pseudos ??= {}
	e.cagnotte ??= 0
	e.voleurPseudo ??= null			// dernier identifiant du voleur
	e.alambicPseudo ??= null		// dernier utilisateur d'alambic
	e.unlockPseudo ??= null			// dernier utilisateur unlock d'un slot
	e.solucePseudo ??= null				// dernier utilisateur fixeur d'un slot
	e.alambicNb ??= 0						// nb alambic en stocl
	e.challengeTermine = isChallengeTermine(e)
	voleurReschedule(e,true) // marque par decision, pour ne pas sync client à l'init du server
	alambicReschedule(e)
	return e
}

/*
function recalcEtat() {
	const now = Date.now()
	etat.slots.forEach( (s)=> { 
		if (s.unlockPseudo && s.unlockEcheance < now) slotReset(s) }
	)
	return etat
}
*/
// Reset global du mini-jeu
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	etat = normalize(collections.reset(COLNAME))
	syncClients()
}
// synch clients
function syncClients(texte,ding,couleur,duree) {
	collections.save(etat)
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	if (texte) wsserver.broadcastSimpleText(texte, ding || "Ding" , couleur || "red", duree || CONF.NOTIFDUREE)
}
// recupere un etat d'un pseudo
function getEp(pseudo) {
	etat.pseudos[pseudo] ??= {}
	let ep = etat.pseudos[pseudo]
	ep.voleurGetNb ??= 0
	ep.alambicGetNb ??= 0
	ep.upNb ??= 0
	ep.revelateurNb ??= 0
	ep.soluceNb ??= 0
	return ep
}

// testt si challenge termine
function isChallengeTermine(e=etat) {
	let i=0
	while (i < CONF.NBL*CONF.NBC) {
		if (!e.slots[i].solucePseudo) return false
		i++;
	}
	return true
}
//////////////////////////////////////////////////////////////
// Etape du nom du lala
//////////////////////////////////////////////////////////////
//
// propose une réponse pour le nom du lala
function lalaNom(pseudo,json) {
	let ep = getEp(pseudo)
	if (!ep) gbl.exception("lalaNom: etat invalide "+pseudo,400)
	if (etat.lalaTrouve) gbl.exception("lalaNom: lala deja trouve",400)
	if (json.reponse.toLowerCase() != LALANOM.toLowerCase()) {
		// mauvaise  réponse
		wsserver.broadcastSimpleText(pseudo+" s'est trompé","Ding","orange",CONF.NOTIFDUREE)
	}
	else {
		// bonne réponse
		etat.cagnotte++
		etat.lalaTrouve = { pseudo: pseudo, dth: Date.now(), nom: LALANOM.toLowerCase() }
		// marques les pseudos présents
		wsserver.getPseudoList().forEach ( (p) => { let ep=getEp(p); ep.lalaPresent = true } )
		syncClients(pseudo+" a trouvé le lala",null,"lightgreen",CONF.NOTIFDUREE*2)
		// lance le popup des voleurs
		voleurReschedule(etat)
	}
}
//////////////////////////////////////////////////////////////
//  Gestion des "voleurs"
//////////////////////////////////////////////////////////////
function voleurReschedule(et=etat,isDecision) {
	console.log("***** voleurReschedule")
	if (voleurTimerId) { clearTimeout(voleurTimerId); voleurTimerId=null }
	if (!et.lalaTrouve) return console.log("voleurReschedule canceled, pas de lalaTrouve")
	if (et.challengeTermine) return console.log("voleurReschedule, challenge termine")
	et.voleurIdx = Math.floor(Math.random()*CONF.VOLEURS.length)
	et.voleurEcheance = Date.now() + CONF.VOLEURSTIMER
	// si timer et non decision, update client
	if (!isDecision) syncClients(CONF.VOLEURS[et.voleurIdx]+" m'a dérobé un alambic",null,"lightgreen")
	voleurTimerId = setTimeout(voleurReschedule,CONF.VOLEURSTIMER)
}
// Click sur pnj, verifie si c'eset le voleur
// 200 si voleur OK, 201 si voleur pas OK 299 unsync
function voleurTentative(pseudo,i) {
	// verif tentative valide
	if (etat.alambicNb >= CONF.ALAMBICNBMAX) gbl.exception("Mon coffre d'alambic éthéré est totalement rempli",299)
	if (!etat.voleurEcheance) gbl.exception("Je ne vois aucun esprit d'ascien dans mon bureau",299)
	if (!etat.voleurPseudo == pseudo) gbl.exception("Tu as trouvé un mirage en dernier, passe la main",299)
	if (etat.voleurIdx == i) {
		let ep = getEp(pseudo)
		// tentative voleur ok
		etat.alambicNb++
		ep.voleurGetNb++
		etat.voleurPseudo = pseudo
		// plus de mirage pendant un delai
		etat.voleurIdx = null
		etat.voleurEcheance = null
		// relance les voleur apres un delai de garde
		if (voleurTimerId) clearTimeout(voleurTimerId)
		voleurTimerId = setTimeout(voleurReschedule,CONF.VOLEURSDELAIOK)
		// reset le timer de dissipation d'alambic
		alambicReschedule(etat,true)
		syncClients("Grâce à "+pseudo+" j'ai récupéré un alambic éthéré","ding-ding","lightgreen",CONF.NOTIFDUREE*2)
		gbl.exception("ok",200)
	}
	else {
		// tentative voleur ratée
		wsserver.broadcastSimpleText(pseudo+" n'a pas réussi à toucher "+VOLEURS[etat.voleurIdx], "Ding" , "orange", CONF.NOTIFDUREE)
		gbl.exception("ko",201)
	}
}

//////////////////////////////////////////////////////////////
// Gestion des alambics
//////////////////////////////////////////////////////////////

function alambicReschedule(et=etat) {
	console.log("***** alambicReschedule")
	if (alambicTimerId) clearTimeout(alambicTimerId)
	et.alambicEcheance = null
	alambicTimerId = null
	if (et.challengeTermine) return
	et.alambicEcheance = Date.now() + CONF.ALAMBICTIMER
	alambicTimerId = setTimeout(alambicRemove,CONF.ALAMBICTIMER)
}
// retrait d'un alambic du stock (sur timer avec notif ou par décision sans notif)
function alambicRemove() {
	console.log("***** alambicRemove")
	if (etat.alambicNb > 0) {
		etat.alambicNb--
		syncClients("Holala, un alambic éthéré inutilisé s'est vaporisé","pacmanDie","orange",CONF.NOTIFDUREE*3)
		alambicReschedule(etat)
	}
}
// demande de transofmration d'un alambic en révélateur
// 200 Récupéré 201 recupere HQ 400 Unsync
function alambicGet(pseudo) {
	if (etat.alambicNb <= 0) gbl.exception("Coffre d'alambic vide",400)
	if (etat.alambicPseudo==pseudo) gbl.exception("Usage alambic recent par toi",400)
	let ep = getEp(pseudo)
	if (ep.revelateurNb > CONF.REVELATEURNBMAX) gbl.exception("Tu ne peux plus obtenir de revelateur",400)
	// go
	let nb = (Math.random()>CONF.CRAFTHQ)? 3: 1
	etat.alambicNb--
	ep.alambicGetNb++
	ep.revelateurNb += nb
	etat.alambicPseudo = pseudo
	alambicReschedule(etat)
	if (nb>1) {
		syncClients( "CRAFT HQ de révélateurs pour "+pseudo,"pacmanEatGhost","lightgreen",CONF.NOTIFDUREE*2)
		gbl.exception("ok",201)
	}
	else {
		syncClients( "Craft d'un révélateur pour "+pseudo,"Ding","lightgreen")
		gbl.exception("ok",200)
	}
}
//
//////////////////////////////////////////////////////////////
// Getion des revelateurs
//////////////////////////////////////////////////////////////
let slotTimerId = setTimeout(slotReschedule,1000)
// balaye les slots pour déterminer le dth d'annulation de la tentative
function slotReschedule() {
	console.log("slotReschedule")
	if (slotTimerId) clearTimeout(slotTimerId)
	let dthMin = Infinity
	let now = Date.now()
	etat.slots.forEach( (s) => {
		if (s.unlockEcheance && s.unlockEcheance <= now) {
			syncClients( "Un fragment de parchemin n'a pas été fixé à temps","explosion","orange",CONF.NOTIFDUREE*4)
			slotReset(s)
		}
		if (s.unlockEcheance && s.unlockEcheance < dthMin) {
			dthMin=s.unlockEcheance
		}
	})
	// si aucun timer, ne relance pas
	if (dthMin != Infinity) slotTimerId = setTimeout(slotReschedule,Math.max(1,dthMin-now))
}
function slotReset(s) {
	// reset tout sauf soluce
	s.proba = 1
	s.revelateurPseudo = null
	s.unlockPseudo = null
	s.unlockEcheance = null
	s.enigme = null
}
// Augmente la proba d'une case idx
function revelateurUtilise(pseudo,idx) {
	let msg = null
	let slot = etat.slots[idx]
	let ep = getEp(pseudo)
	if (slot.solucePseudo) gbl.exception("revelateurUtilise impossible deja soluce slot="+idx,400)
	if (slot.revelateurPseudo == pseudo) gbl.exception("revelateurUtilise impossible ton pseudo est le dernier pour le slot: "+pseudo,400)
	if (slot.proba >= CONF.PROBA) gbl.exception("revelateurUtilise impossible proba>=CONF.PROBA slot="+idx,400)
	if (ep.revelateurNb <= 0) gbl.exception("revelateurUtilise impossible ep.revelateurNb<=0 slot="+idx,400)
	// ajoute un up pour le pseudo
	ep.upNb++
	ep.revelateurNb--
	slot.revelateurPseudo = pseudo
	// determine le prochain niveau de proba
	slot.proba += Math.max( Math.floor(Math.random()*2+1),Math.floor(Math.random()*(CONF.PROBA - slot.proba)*0.7) ) // nombre de step d'augmentation
	if (slot.proba >=  CONF.PROBA) {
		// pseudo est decouvreur de l'indice et il doit être découvert dans les délais
		slot.proba =  CONF.PROBA
		slot.unlockPseudo = pseudo
		slot.unlockEcheance = Date.now() + CONF.UNLOCKTIMER
		slot.enigme = Object.assign({},QUESTIONS[idx%QUESTIONS.length])
		delete slot.enigme.r // pas la reponse dans le client
		slotReschedule()
		msg = pseudo+" a révélé une partie du parchemin"
	}
	else {
		msg = pseudo+" a utilisé du révélateur"
	}
	syncClients(msg,null,"green")
	gbl.exception("ok",200)
}
// propose une réponse
function reponse(pseudo,idx,json) {
	let slot = etat.slots[idx]
	let ep = etat.pseudos[pseudo]
	if (!slot.unlockPseudo) gbl.exception("reponse: pas unlock slot="+idx,400)
	if (slot.unlockPseudo == pseudo) gbl.exception("reponse: impossible tu as unlock le slot="+idx,400)
	if ( slot.unlockEcheance < Date.now() ) gbl.exception("reponse: echeance unlock depassee slot="+idx,400)
	if (!slot.enigme) gbl.exception("reponse: enigme manquante slot"+idx,400)
	if (!json?.reponse) gbl.exception("reponse: reponse manquante slot"+idx,400)
	// ok, reponse possible, test
	if (json.reponse.toLowerCase() != QUESTIONS[idx%QUESTIONS.length].r.toLowerCase()) {
		// mauvaise  réponse
		slotReset(slot)
		syncClients(pseudo+" s'est trompé","pacmanDie","orange",CONF.NOTIFDUREE*2)
	}
	else {
		// bonne réponse
		slotReset(slot) // pour retirer les elements inutiles
		ep.soluceNb++
		slot.solucePseudo = pseudo
		slot.soluceDth = Date.now()
		etat.challengeTermine = isChallengeTermine()
		slotReschedule()
		syncClients(pseudo+" a indiqué une bonne réponse","pacmanEatGhost","lightgreen",CONF.NOTIFDUREE*2)
	}
}
//////////////////////////////////////////////////////////////
// ADMIN
//////////////////////////////////////////////////////////////
function admResetPseudo(pseudo) {
	etat.voleurPseudo = null
	etat.alambicPseudo = null
	etat.unlockPseudo = null
	etat.solucePseudo = null
	etat.slots.forEach( (s) => {
		if (s.revelateurPseudo) s.revelateurPseudo = null
	})
	syncClients( "ADM RESET pseudo",null,"orange")
}
function admFill(idx) {
	let s = etat.slots[idx]
	s.proba=10
	s.revelateurPseudo = "pipoRevelateur"
	s.unlockPseudo = "pipoUnlock"
	s.unlockEcheance = Date.now() + 60000
	s.enigme = Object.assign({},QUESTIONS[idx])
}
function admSoluce(idx) {
	let s = etat.slots[idx]
	s.proba=10
	s.revelateurPseudo = "pipoRevelateur"
	s.unlockPseudo = "pipoUnlock"
	s.unlockEcheance = 0
	s.solucePseudo = "pipoSoluce"
	s.enigme = null
}

//////////////////////////////////////////////////////////////
// API Calls
//////////////////////////////////////////////////////////////
exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// Si le pseudo est nouveau, on initialise l'état pour ce pseudo
					getEp(pseudo)
					// retroune l'état global
					gbl.exception( etat, 200) 
       case "config":
          // retroune les zones en JSON direct
          gbl.exception( CONFJSON , 200, true)
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "lalaNom":
					lalaNom(pseudo,JSON.parse(body))
          gbl.exception( "ok" , 200)
				case "voleurClick":
					// clic su run voleur pootentiel
					voleurTentative(pseudo,gbl.checkInt(reqPaths[3],0,VOLEURS.length-1))
          gbl.exception( "erreur" , 500)
				case "alambicGet":
					// clic su run voleur pootentiel
					alambicGet(pseudo)
          gbl.exception( "erreur" , 500)
				case "revelateurUtilise":
					// clic sur case, maj par WS
					revelateurUtilise(pseudo,gbl.checkInt(reqPaths[3],0,CONF.NBL*CONF.NBC-1))
          gbl.exception( "erreur" , 500)
				case "revelateurAdd":
					// timer selon client, recalcule les revelateurs
					revelateurAdd(pseudo)
          gbl.exception( "ok" , 200)
				case "reponse":
					reponse(pseudo,gbl.checkInt(reqPaths[3],0,CONF.NBL*CONF.NBC-1),JSON.parse(body))
          gbl.exception( "ok" , 200)
			}
			gbl.exception(COLNAME+" post",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "admResetPseudo":
					admResetPseudo(pseudo)
          gbl.exception( "ok" , 200)
				case "admFill": {
					let idx = gbl.checkInt(reqPaths[3],0,CONF.NBL*CONF.NBC-1)
					admFill(idx)
					slotReschedule()
					syncClients("ADM Fill slot")
   				gbl.exception( "ok" , 200)
				}
				case "admFillAll": {
					for (let idx = 0; idx < CONF.NBL*CONF.NBC-1; idx++)
						admSoluce(idx)
					slotReschedule()
					syncClients("ADM Fill ALL")
   				gbl.exception( "ok" , 200)
				}
				case "admUnlock": {
					let idx = gbl.checkInt(reqPaths[3],0,CONF.NBL*CONF.NBC-1)
					let s = etat.slots[idx]
					s.proba=10
					s.revelateurPseudo = null
					s.unlockPseudo = "*AUTRE*"
					s.unlockEcheance = Date.now() + CONF.UNLOCKTIMER
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
