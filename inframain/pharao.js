const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

// nom de la collection
const COLNAME="pharao"
const SIZE=6 // 6x6 lieux et objets
const ZONES = {
	ENIGMES: [
		// vente de materiaux dans les villes de bases
		{ l:"Un fragment de Pharao est tombé dans l'échoppe de vente de matériaux de Limsa Lominsa, quel le nom du propriétaire de l'échoppe?",
			x:0.0, y: 0.0, r:2, o:["Vral","Domitien","Engerrand","Walter"] }, // "Engerrand" lvl 50
		{ l:"Un fragment de Pharao est tombé dans l'échoppe de vente de matériaux de Vieille Gridania, quel le nom du propriétaire de l'échoppe?",
			x:0.0, y: 0.0, r:3, o:["Bango Zango","Domitien","Vral","O'rhoyod","Walter"] }, // "O'rhoyod" 
		{ l:"Un fragment de Pharao est tombé dans l'échoppe de vente de matériaux du Crystarium, quel le nom du propriétaire de l'échoppe?",
			x:0.0, y: 0.0, r:1, o:["Maisenta","Vral","Walter","Roarich"] }, // "Vral"
		// vente d'armures dans les villes de bases
		{ l:"Un fragment de Pharao est tombé dans l'échoppe de vente d'armures de Limsa Lomisa, quel le nom du propriétaire de l'échoppe?",
			x:0.0, y: 0.0, r:3, o:["Vral","Domitien","Engerrand","Iron Thunder","Maisenta"] }, // "Iron Thunder" lvl 50
		{ l:"Un fragment de Pharao est tombé dans l'échoppe de vente d'armures de Vieille Gridanie, quel le nom du propriétaire de l'échoppe?",
			x:0.0, y: 0.0, r:4, o:["Maisenta","Vral","Walter","Roarich","Domitien"] }, // "Domitien"
		{ l:"Un fragment de Pharao est tombé dans l'échoppe de vente d'armures d'Ul'dah, quel le nom du propriétaire de l'échoppe?",
			x:0.0, y: 0.0, r:0, o:["Gwalter","Bango Zango","Domitien","Vral","O'rhoyod"] }, // "Gwalter" - lvl50
		// consortium dans les villes de bases
		{ l:"Un fragment de Pharao est tombé du coté du Consortium de Brugaire, quel est le nom du vendeur de Légumes de Gysahl?",
			x:0.0, y: 0.0, r:3, o:["Maisenta","Vral","Walter","Bango Zango","Maisenta","Roarich"] }, // "Bango Zango" lvl 50
		{ l:"Un fragment de Pharao est tombé dans une échoppe des Lièvres Noirs, quel est le nom de la tenancière vendant des Légumes de Gysahl?",
			x:0.0, y: 0.0, r:3, o:["Vral","Domitien","Engerrand","Maisenta","Walter","Roarich"] }, // "Maisenta" - lvl 100,50
		{ l:"Un fragment de Pharao est tombé du coté du **independantimporter-ul'dah**, quel est le nom du vendeur de Légumes de Gysahl?",
			x:0.0, y: 0.0, r:0, o:["Roarich","Vral","Domitien","Engerrand","Maisenta","Walter"] }, // "Roarich"
		//
		{ l:"Un Capitaine des tempêtes, garde du Maelstrom, a récemment entendu un 'plouf' dans la mer. Ce pourrait être un fragment de Pharao, quel est le nom de ce Capitaine?",
			x:0.0, y: 0.0, r:1, o:["pipo1","Ghimthota"] }, // "Ghimthota"
		{ l:"Tu peux lui demander de te rendre compte de tes Hauts Faits, mais il ignore que sous le banc de bois derrière lui se trouve un fragement de Pharao. Quel est son nom?",
			x:0.0, y: 0.0, r:1, o:["pipo1","Jonathas"] }, // Jonathas - lvl 100,50
		{ l:"Non loin des immortels, elle garde l'entrée des salles de jeu du Mirage de Platine, sans savoir qu'un fragment de Pharao est sous son comptoir. Quel est son nom?",
			x:0.0, y: 0.0, r:1, o:["pipo1","Essylt"] }, // essylt - lvl50
		{ l:"Il surveille les cuves de teinture du cuir, mais il ignore qu'au fond de l'une d'elle se trouve un fragment de Pharao. Quel est son nom?",
			x:0.0, y: 0.0, r:1, o:["pipo1","Gratcant"] }, // Gratcant - lvl50
		// liftier
		{ l:"Elle est tellement focus sur son ascenseur permettant d'accéder au bastingage ou l'aérodrome qu'elle n'a pas remarqué le fragment de Pharao dans sa poche. Quel est son nom?",
			x:0.0, y: 0.0, r:1, o:["pipo1","Skaenrael"] }, // skaenrael limsa - lvl50
		//
		{ l:"enigme3",
			x:0.0, y: 0.0, r:0, o:["pipo1","pipo2"] }
	]
}
const ZONESJSON = JSON.stringify(ZONES)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	if (!e.size) {
		e.size = SIZE
		e.elts = new Array(SIZE*SIZE)
		for (let i=0; i < SIZE*SIZE; i++)
			e.elts[i] ??= { trouvePseudo: null, trouveDth: null, posePseudo: null, poseDth: null, targetIdx: i }
		gbl.shuffle(e.elts)
	}
	return e
}
// synch clients
function syncClients(texte,ding) {
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	collections.save(etat)
	if (texte) wsserver.broadcastSimpleText(texte, ding ,null, 10)
}
// Reset global du mini-jeu
function globalReset() {
	console.warn("Collection reset pour phareo")
	etat = normalize(collections.reset(COLNAME))
	syncClients()
}
// Force un positionnement presque termine (debug)
function setAll() {
	console.warn("Collection setAll pour phareo")
	// les deux premiers sont à échanger, le reste est bien positionné
	etat.elts[0] = { trouvePseudo: "Kikiadoc", trouveDth: Date.now(), posePseudo: "Kikiadoc", poseDth: Date.now(), targetIdx: 1 }
	etat.elts[1] = { trouvePseudo: "Kikiadoc", trouveDth: Date.now(), posePseudo: "Kikiadoc", poseDth: Date.now(), targetIdx: 0 }
	for (let i=2; i < SIZE*SIZE; i++)
			etat.elts[i] = { trouvePseudo: "Kikiadoc", trouveDth: Date.now(), posePseudo: "Kikiadoc", poseDth: Date.now(), targetIdx: i }
	syncClients()
}
// analyse une proposition
function proposition(pseudo,reqPaths) {
	// verification de la proposition
	console.warn("******************* Verif proposition a faire")
	// proposition ok
	// recherche d'un elt non découvert
	let tblPossibles = []
	for (let i=0; i < SIZE*SIZE; i++) {
		if ( ! etat.elts[i].trouvePseudo ) tblPossibles.push(i)
	}
	if (tblPossibles.length == 0) gbl.exception("Aucune proposition possible",400)
	// choix d'un element parmi les possibles
	let choix = tblPossibles[Math.floor(tblPossibles.length*Math.random() )]
	// maj de l'etat
	etat.elts[choix].trouvePseudo = pseudo
	etat.elts[choix].trouveDth = Date.now()
	// etat.elts[choix].posePseudo = pseudo
	// etat.elts[choix].poseDth = Date.now()
	syncClients(pseudo+" a découvert un composant de Pharao *** Controle server de la réponse à faire", "Ding")
}
// echange de deux elements
function swapElt(pseudo,reqPaths) {
	let pFrom = gbl.checkInt(reqPaths[3],0,SIZE*SIZE - 1)
	let pTo = gbl.checkInt(reqPaths[4],0,SIZE*SIZE - 1)

	etat.elts[pFrom].posePseudo = pseudo
	etat.elts[pFrom].poseDth = Date.now()
	etat.elts[pTo].posePseudo = pseudo
	etat.elts[pTo].poseDth = Date.now()
	let t = etat.elts[pFrom]
	etat.elts[pFrom] = etat.elts[pTo]
	etat.elts[pTo] = t
	syncClients(pseudo+" a echangé deux composants de Pharao","Ding")
}

// API Calls
exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// retroune l'état global
					gbl.exception( etat , 200) 
       case "zones":
          // retroune les zones
          gbl.exception( ZONESJSON , 200, true)
			}
			gbl.exception("phareo get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "proposition":
					proposition(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
				case "swap":
					swapElt(pseudo,reqPaths)
					gbl.exception( "ok via ws" , 200) 
			}
			gbl.exception("phareo post",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			switch(reqPaths[2]) {
				case "etat":
					globalReset()
					gbl.exception( etat , 200) 
				case "setAll":
					setAll()
					gbl.exception( etat , 200) 
			}
			gbl.exception("phareo delete",400);
	}
	gbl.exception("inv phareao http op",400);
}

console.log("phareo loaded")
