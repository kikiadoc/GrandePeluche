const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');

const COLOMEGANAME = "omega_etat"
const NBRUNES = 25
const NBVISPARRUNE = 4
const GAINMAX=10000 // en KGils
const GAINMIN=1000 // en KGils
const DECOTEPARMIN=30 // 60 K par minute, donc 3.6M par heure - un multiple de 60 evite le blink sur timer client
const NBMAXVISPARPSEUDO=18 // nombre de vis devissee max pr peudo
const REDUCAMEPARRUNE=2  // % de reduction d'ame par rune


// EQUILIBRAGE DE LA PHASE DES VIS
const DELAIVISINIT = 20000 // Delai pour la premier vis sauf si recalcul
const DELAIACTIF = 5*60000 // Delai pour être considéré comme actif en ms
const DELAIALEA = 5000 // Facteur aleatoire en ms (gigue du temps pour vis)
const DELAILAST = 30000 // Delai pour le dernier
const DELAISTD = 15000 // Delai en cas standard
const DELAIELU = 5000 // Delai si elu
const DELAIMALUSREDUC = 20000 // reduction du Delai de malus

const MALUS_AUCUN={ t: -30000, txt: null }  // si Ok, entraine une reduc du malus
const MALUS_TIMER={ t: 20000, txt: "tu n'es pas assez reposé" } 
const MALUS_NBVISTOTAL={ t: 25000, txt: "ton niveau d'ame est inquiétant" } 
const MALUS_NBVISPARRUNE={ t: 0, txt: "toutes les vis de cette rune sont déjà dévissées" } 
const MALUS_DEJADEVISSE={ t: 15000, txt: "tu as déjà dévissé une vis de cette rune" } 
const MALUS_MAXMALUS=1*60000 // maximum du malus

//									24			17			34
const CODE_LIST = [ "Désa", "ctiv", "ation" ]
const CLEF_DELAI = 4000 // délai d'activation d'une clef

// etat du challenge
let etatOmega = normalizeEtat(collections.get(COLOMEGANAME, true))

// normalize etat
function normalizeEtat(v) {
	v.nbVisDevissees ??= 0
	v.lastDevisseeDth ??= 0
	v.malus ??= 0 // malus actuel en ms
	v.dthStart ??= null // dth de debut idu challenge ou null pas pas commencé
	v.etape ??= 0 // etape actuelle synchronisee
	v.nbVisTotal = NBRUNES * NBVISPARRUNE
	v.codesOmega = [ null, null, null ]
	v.NBRUNES = NBRUNES
	v.NBVISPARRUNE = NBVISPARRUNE
	v.GAINMAX = GAINMAX
	v.GAINMIN = GAINMIN
	v.DECOTEPARMIN =  DECOTEPARMIN
	v.NBMAXVISPARPSEUDO =  NBMAXVISPARPSEUDO
	v.REDUCAMEPARRUNE =  REDUCAMEPARRUNE
	v.runes ??= new Array(NBRUNES) // indexé par le numero de rune
	for (let i=0; i < NBRUNES; i++) {
		v.runes[i] ??= new Object()
		v.runes[i].pseudos ??= new Array()
	}
	v.pseudos ??= new Object() // indexé par les pseudos
	return v
}

// get etat d'un pseudo dans le challenge (et normalize)
function getEtatPseudo(p) {
	etatOmega.pseudos[p] ??= new Object()
	let ps = etatOmega.pseudos[p]
	ps.nbVisDevissees ??= 0
	ps.dthVis ??= 0
	ps.dthStart ??= Date.now()
	ps.oeuil ??= 0
	return ps
}

// sycnho les clients sur l'état des vis
function syncClientEtat() {
	collections.save(etatOmega)
	// broadcast sur le WS
	wsserver.broadcastSimpleOp(COLOMEGANAME,etatOmega)
}


// determine le facteur de participation
function getFacteurParticipation(nbActifs) {
	return 1
	// trop difficile return (nbActifs >5)? 1 :(nbActifs >3 )? 2 : 3
}

// recalcule les dth de possibilité de devissage des vis pour chaque pseudo
// lastPseudo est l'objet pseudo qui était le dernier a faire un devissage
function updateDthVis(lastPseudo) {
	const now = Date.now()
	const actifDth = now-DELAIACTIF // les joueurs actifs sont apres ce dth
	const tPseudos = Object.values(etatOmega.pseudos)
	// compte le nombre de joueurs actifs les derniers minutes et calcul le facteur de rapidité
	const nbActifs =  tPseudos.reduce( (nb,p) => nb + (p.tentativeVisDth >= actifDth)? 1:0 , 0) 
	// calcul le facteur lié à la participation
	const facteur = getFacteurParticipation(nbActifs)
	// determine l'elu (un objet pseudo ou undefined)
	const elu = tPseudos[Math.floor(Math.random() * tPseudos.length)]
	// calcul du nextVisDth de chacun des pseudos
	tPseudos.forEach( (p) => {
		// si c'est le pseudo elu, temps min
		// si c'est le dernier pseudo a avoir dévissé, temps max
		// sinon cas standard
		// calcul le dth cible avec un alea de quelqies secondes (0-5 secondes) et le malus global
		// p.nextVisDth est la date objectif pour le prochain devissage
		// p.oeuil indique le niveau de focus de Mephistopheles
		if (p==elu)							{ p.nextVisDth = now + DELAIELU*facteur  + Math.floor((Math.random()*DELAIALEA)) + etatOmega.malus; p.oeuil=1 }
		else if (p==lastPseudo)	{ p.nextVisDth = now + DELAILAST*facteur + Math.floor((Math.random()*DELAIALEA)) + etatOmega.malus; p.oeuil=3 }
		else										{ p.nextVisDth = now + DELAISTD*facteur  + Math.floor((Math.random()*DELAIALEA)) + etatOmega.malus; p.oeuil=2 }
	})
}


// demande le retrait d'une vis d'une rune 
// 200: avec un objet malus en resultat
// toutes les conditions de succes sont vérifiée par le client avant access server
// sauf celle entrainant un malus
function devisser(pseudo,iVis) {
	const i = gbl.checkInt(iVis,0,NBRUNES-1)
	const p = getEtatPseudo(pseudo) // pseudo
	const r = etatOmega.runes[i] // rune
	const now = Date.now()
	let rcVis = MALUS_AUCUN;
	// dans tous les cas, marque le pseudo dans les actifs
	p.tentativeVisDth = now
	// Verifie les preconds
	if (p.nextVisDth > now) {
		// erreur de timer du joueur
		rcVis = MALUS_TIMER
	}
	else if (r.pseudos.length >= NBVISPARRUNE) {
		// toutes les vis de la rune sont devissées
		rcVis = MALUS_NBVISPARRUNE
	}
	else {
		// ok, ajoute le devissage
		// flag indique que le pseudo a deja dévissé sur cette rune
		const flagDeja = r.pseudos.some( (rr)=> rr.pseudo == pseudo )
		// ajoute le pseudo, le nbDevisse etc...
		r.pseudos.push( { pseudo: pseudo, dth: now } )
		p.nbVisDevissees++
		etatOmega.nbVisDevissees++
		etatOmega.lastDevisseeDth = now
		wsserver.broadcastSimpleText(pseudo+" a retiré une vis de la rune #"+(i+1),true)
		if (etatOmega.nbVisDevissees >= NBRUNES*NBVISPARRUNE)
			setEtape(pseudo,3)
		// Ok ou avec malus si trop de vis devissees ou deja devisse
		rcVis = (flagDeja)? MALUS_DEJADEVISSE : (p.nbVisDevissees > NBMAXVISPARPSEUDO)? MALUS_NBVISTOTAL : MALUS_AUCUN
	}
	// connerie ?
	if (rcVis.t > 0) wsserver.broadcastSimpleText( "😈 a perçu une action de "+pseudo+" (malus)", true, "yellow" )
	// maj du malus global (pas de message en cas de cap)
	etatOmega.malus = Math.max( Math.min(etatOmega.malus+rcVis.t, MALUS_MAXMALUS), 0)
	// recalcule les dth des devissages
	updateDthVis(p)
	// sync
	syncClientEtat()
	gbl.exception( rcVis ,200);
}

// passage d'une étape par un joueur
// return tru si changement d'etape, false sinon
// broadcast le changement d'étape si besoin
// ne broadcast PAS le nouvel état
function setEtape(pseudo,i) {
	// si le challenge n'est pas commencé, marque le debut du challenge pour le timer
	if (!etatOmega.dthStart) etatOmega.dthStart = Date.now()
	// indique l'étape si supérieure a l'etape actuelle
	if (i>etatOmega.etape) {
		etatOmega.etape=i
		wsserver.broadcastSimpleOp("omega_etape", { etape: i, pseudo: pseudo })
		return true
	}
	return false
}

// joueur a trouve un code
// 200: via ws
// 201: mauvais code
// 400: client unsynch
function codeTrouve(pseudo,iCode,bodyRaw) {
	const i = gbl.checkInt(iCode,0,CODE_LIST.lenght-1)
	// code doit être pas encore indiqué
	if (etatOmega.codesOmega[i]) gbl.exception("synch client",400)	
	// code non indiqué, on parse
	let o = JSON.parse(bodyRaw)
	// vérification du code
	if (o.phrase != CODE_LIST[i]) gbl.exception("bad code deverrouillage", 201)
	// code OK
	etatOmega.codesOmega[i] = { pseudo: pseudo, phrase: o.phrase, dth: Date.now() }
	wsserver.broadcastSimpleText(pseudo + " a trouve le code Oméga #"+ (i+1) )
	syncClientEtat()
	gbl.exception( "via ws", 200) 
}

// joueur troune une clef
// 200: via ws
// 201: mauvaise clef (déj)à tourné)
// 400: client unsynch
function clefTry(pseudo,iCode) {
	const i = gbl.checkInt(iCode,0,CODE_LIST.lenght-1)
	const now = Date.now()
	// tous les codes doivent être connus
	if (etatOmega.codesOmega.includes(null)) gbl.exception("tous codes pas connus, synch client",400)	
	// si une dth est active, on ignore
	if (etatOmega.codesOmega[i].lastTryDth > now ) gbl.exception("Tourne par qqun",201)
	// Tourner clef ok
	etatOmega.codesOmega[i].lastTryDth = now + CLEF_DELAI
	// teste toutes les cleffs sont tournées actuellement
	// il suffit qu'une clef ne soit pas ok pour ne pas accepter
	const nonTournee = etatOmega.codesOmega.find( (c) => (!c) || (!c.lastTryDth) || (c.lastTryDth < now)) 
	console.log("nonTournee:",nonTournee)
	// si touteTorunées, passe l'etape 4
	if (nonTournee===undefined) setEtape(pseudo,4)
	// dans tous les cas,
	syncClientEtat()
	gbl.exception( "via ws", 200) 
}

// reinitialize le challenge
function admResetVis() {
  etatOmega = normalizeEtat(collections.reset(COLOMEGANAME))
}

// reset les timers
function admResetTimer() {
	const tPseudos = Object.values(etatOmega.pseudos)
	const now = Date.now()
	tPseudos.forEach( (p) => { p.nextVisDth = now } )
}
// remplis les runes
function admFullVis() {
	etatOmega.nbVisDevissees= NBVISPARRUNE * NBRUNES - 1
	etatOmega.lastDevisseeDth = Date.now()
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// dans tous les cas, initialise l'etat du pseudo et marque la présence pour les vis
					let p = getEtatPseudo(pseudo)
					p.nextVisDth = Date.now() + DELAIVISINIT // apres reset/reload il y a un delai
					// retourne l'etat du challenge
					gbl.exception( etatOmega , 200) 
			}
			gbl.exception("omega get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "vis":
					devisser(pseudo,reqPaths[3])
				case "etape":
					if (setEtape(pseudo,gbl.checkInt(reqPaths[3],1,3)))
						syncClientEtat()
					gbl.exception( "via ws", 200) 
				case "codeTrouve":
					codeTrouve(pseudo,reqPaths[3],body)
				case "clefTry":
					clefTry(pseudo,reqPaths[3])
			}
			gbl.exception("omega post",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "admResetVis":
					admResetVis()
					syncClientEtat()
					gbl.exception("admResetVis",200);
				case "admResetTimer":
					admResetTimer()
					syncClientEtat()
					gbl.exception("admResetTimer",200);
				case "admFullVis":
					admFullVis()
					syncClientEtat()
					gbl.exception("admFullVis",200);
			}
			gbl.exception("bad adm patch",400);
	}
	gbl.exception("inv http op",400);
}

console.log("omega loaded")
