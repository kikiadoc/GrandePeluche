const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');

const COLOMEGANAME = "omega_vis"
const NBRUNES = 25
const NBVISPARRUNE = 4
const GAINMAX=10000 // en KGils
const GAINMIN=1000 // en KGils
const DECOTEPARMIN=60 // 60 K par minute, donc 3.6M par heure - un multiple de 60 evite le blink sur timer client
const NBMAXVISPARPSEUDO=10 // nombre de vis devissee max pr peudo
const REDUCAMEPARRUNE=2  // % de reduction d'ame par rune



// etat du challenge
let etatOmega = normalizeVis(collections.get(COLOMEGANAME, true))

// normalize etat
function normalizeVis(v) {
	v.nbVisDevissees ??= 0
	v.lastDevisseeDth ??= 0
	v.malus ??= 0 // malus actuel en ms
	v.dthStart ??= null // dth de debut idu challenge ou null pas pas commencé
	v.etape ??= 0 // etape actuelle synchronisee
	v.nbVisTotal = NBRUNES * NBVISPARRUNE
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
function syncClientsEtatVis() {
	collections.save(etatOmega)
	// broadcast sur le WS
	wsserver.broadcastSimpleOp(COLOMEGANAME,etatOmega)
}

// reinitialize le challenge
function admResetVis() {
  etatOmega = normalizeVis(collections.reset(COLOMEGANAME))
	syncClientsEtatVis()
}

// EQUILIBRAGE DE LA PHASE DES VIS
const DELAIVISINIT = 20000 // Delai pour la premier vis sauf si recalcul
const DELAIACTIF = 5*60000 // Delai pour être considéré comme actif en ms
const DELAIALEA = 5000 // Facteur aleatoire en ms (gigue du temps pour vis)
const DELAILAST = 30000 // Delai pour le dernier
const DELAISTD = 15000 // Delai en cas standard
const DELAIELU = 8000 // Delai si elu
const DELAIMALUS = 20000 // Delai de malus unitaire

// determine le facteur de participation
function getFacteurParticipation(nbActifs) {
	return (nbActifs >9)? 1 :(nbActifs >7 )? 2 : (nbActifs > 5)? 3 : (nbActifs > 1)? 6 : 10
}

// recalcule les dth de possibilité de devissage des vis pour chaque pseudo
// lastPseudo est l'objet pseudo qui était le dernier a faire un devissage
function updateDthVis(lastPseudo) {
	const now = Date.now()
	const actifDth = now-DELAIACTIF // les joueurs actifs sont apres ce dth
	const tPseudos = Object.values(etatOmega.pseudos)
	// compte le nombre de joueurs actifs les derniers minutes et calcul le facteur de rapidité
	const nbActifs =  tPseudos.reduce( (nb,p) => nb + (p.dthVis >= actifDth)? 1:0 , 0) 
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
		let tDth
		if (p==elu)							{ p.nextVisDth = now + DELAIELU*facteur  + (Math.random()*DELAIALEA) + etatOmega.malus; p.oeuil=1 }
		else if (p==lastPseudo)	{ p.nextVisDth = now + DELAILAST*facteur + (Math.random()*DELAIALEA) + etatOmega.malus; p.oeuil=2 }
		else										{ p.nextVisDth = now + DELAISTD*facteur  + (Math.random()*DELAIALEA) + etatOmega.malus; p.oeuil=3 }
	})
}

// demande le retrait d'une vis d'une rune 
// 200 ok, 400 erreur synchro client
// toutes les conditions de succes sont vérifiée par le client avant access server
// sauf celle entrainant un malus
function devisser(pseudo,iVis) {
	const i = gbl.checkInt(iVis,0,NBRUNES-1)
	const p = getEtatPseudo(pseudo) // pseudo
	const r = etatOmega.runes[i] // rune
	const now = Date.now()
	// verifie le timer du joueur (malus+retour)
	if (p.nextVisDth > now) gbl.exception("erreur timing",400)
	// verifie que nombre devisse du pseudo (malus+continue)
	if (p.nbVisDevissees >= NBMAXVISPARPSEUDO) gbl.exception("limite devissage",400)
	// verifie que pas tout devisse sur la rune (erreur sans malus)
	if (r.pseudos.length >= NBVISPARRUNE) gbl.exception("tout devisse",400)
	// verifie que pas encore devisser une vis de cette rune (erreur sans malus)
	r.pseudos.forEach( (r) =>  { if (r.pseudo == pseudo) gbl.exception("deja devisse",400) } )
	// ok, ajoute le devissage
	r.pseudos.push( { pseudo: pseudo, dth: now } )
	p.nbVisDevissees++
	etatOmega.nbVisDevissees++
	etatOmega.lastDevisseeDth = now
	etatOmega.malus = Math.max(etatOmega.malus-DELAIMALUS,0)
	// recalcule les dth des devissages
	updateDthVis(p)
	// sync
	syncClientsEtatVis()
	wsserver.broadcastSimpleText(pseudo+" a retiré une vis de la rune #"+(i+1),true)
	gbl.exception("devissage vis ok ",200);
}

function etape(pseudo,iEtape) {
	const i = gbl.checkInt(iEtape,1,3)
	// si le challenge n'est pas commencé, marque le debut du challenge pour le timer
	if (!etatOmega.dthStart) etatOmega.dthStart = Date.now()
	// indique l'étape si supérieure a l'etape actuelle
	if (i>etatOmega.etape) {
		etatOmega.etape=i
		syncClientsEtatVis()
	}
	gbl.exception( "via ws", 200) 
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
					// dans tous les cas, initialise l'etat du pseudo et marque la présence pour les vis
					let p = getEtatPseudo(pseudo)
					p.nextVisDth = Date.now() + DELAIVISINIT // apres reset/reload il y a un delai
					// retourne l'etat du challenge
					gbl.exception( etatOmega , 200) 
				case "debut":
						wsserver.broadcastSimpleText(pseudo+" a démarré la phase de dévissage!"),true)
						syncClientsEtatVis()
					}
					gbl.exception( "via ws", 200) 
			}
			gbl.exception("omega get",400);
		case "PUT": 
			switch(reqPaths[2]) {
				case "vis":
					devisser(pseudo,reqPaths[3])
				case "etape":
					etape(pseudo,reqPaths[3])
			}
			gbl.exception("omega put",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "admResetVis":
					admResetVis()
					gbl.exception("admResetVis",200);
			}
			gbl.exception("bad adm patch",400);
	}
	gbl.exception("inv http op",400);
}

console.log("omega loaded")
