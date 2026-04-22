const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

// nom de la collection
const COLNAME="X-pharao"
const SIZE=6 // 6x6 lieux et objets
const CONF = {
	SIZE: SIZE,
	GILS: 50, // nombre de gils pour le challenge
	ENIGMETIMER: 10*60000, // timer de renouvellement d'énigme
	ENIGMES: [
		// vente de materiaux dans les villes de bases // 
		{ l:"Un fragment de Pharao est tombé dans une échoppe de vente de matériaux tenue par un hyur portant une toque.", // ok difficulte
			x:0.0, y: 0.0, r:2, o:["Vral","Domitien","Engerrand","Gwalter"] }, // "Engerrand" lvl 50
		{ l:"Un fragment de Pharao est tombé dans une échoppe de vente de matériaux tenue par une miqo'te", // ok difficulte
			x:0.0, y: 0.0, r:3, o:["Bango Zango","Domitien","Vral","O'rhoyod","Gwalter"] }, // "O'rhoyod" 
		{ l:"Un fragment de Pharao est tombé dans une échoppe de vente de matériaux tenue par un elezen", // ok difficulte
			x:0.0, y: 0.0, r:1, o:["Maisenta","Vral","Gwalter","Roarich"] }, // "Vral"
		// vente d'armures dans les villes de bases // 
		{ l:"Un fragment de Pharao est tombé dans une échoppe de vente d'armures tenue par un Roegadyn", // ok difficulte
			x:0.0, y: 0.0, r:3, o:["Vral","Domitien","Engerrand","Iron Thunder","Maisenta"] }, // "Iron Thunder" lvl 50
		{ l:"Un fragment de Pharao est tombé dans une échoppe de vente d'armures tenue par un elezen masquant sa chevelure", // ok difficulté
			x:0.0, y: 0.0, r:4, o:["Maisenta","Vral","Gwalter","Roarich","Domitien"] }, // "Domitien"
		{ l:"Un fragment de Pharao est tombé dans une échoppe de vente d'armures tenue par un Hyur", // ok difficulté
			x:0.0, y: 0.0, r:0, o:["Gwalter","Bango Zango","Domitien","Vral","O'rhoyod"] }, // "Gwalter" ul'dah - lvl50
		// consortium dans les villes de bases // 
		{ l:"Un fragment de Pharao est tombé du coté du Consortium de Brugaire, quel est le prénom du vendeur de Légumes de Gysahl?",
			x:0.0, y: 0.0, r:3, o:["Maisenta","Vral","Walter","Bango Zango","Maisenta","Roarich"] }, // "Bango Zango" lvl 50
		{ l:"Un fragment de Pharao est tombé dans une échoppe des Lièvres Noirs, quel est le nom de la tenancière vendant des Légumes de Gysahl?",
			x:0.0, y: 0.0, r:3, o:["Vral","Domitien","Engerrand","Maisenta","Walter","Roarich"] }, // "Maisenta" - lvl 100,50
		{ l:"Un fragment de Pharao est tombé du coté des Comptoirs d'Ashgana, quel est le nom du vendeur de Légumes de Gysahl?",
			x:0.0, y: 0.0, r:0, o:["Roarich","Vral","Domitien","Engerrand","Maisenta","Walter"] }, // "Roarich"
		// // 
		{ l:"Un Capitaine des tempêtes, garde du Maelstrom, a récemment entendu un 'plouf' dans la mer. Ce pourrait être un fragment de Pharao, quel est le nom de ce Capitaine?",
			x:0.0, y: 0.0, r:2, o:["Roarich","Domitien","Ghimthota","Iron Thunder","Maisenta"] }, // "Ghimthota"
		{ l:"Tu peux lui demander de te rendre compte de tes Hauts Faits, mais il ignore que sous le banc de bois derrière lui se trouve un fragement de Pharao. Quel est son nom?",
			x:0.0, y: 0.0, r:1, o:["Vral","Jonathas","Gwalter","Bango Zango","Iron Thunder","Maisenta","Essylt"] }, // Jonathas - lvl 100,50
		{ l:"Non loin des immortels, elle garde l'entrée des salles de jeu du Mirage de Platine, sans savoir qu'un fragment de Pharao est sous son comptoir. Quel est son nom?",
			x:0.0, y: 0.0, r:3, o:["Skaenrael","Gratcant","Engerrand","Essylt","Iron Thunder","Maisenta"] }, // essylt - lvl50
		{ l:"Il surveille les cuves de teinture du cuir, mais il ignore qu'au fond de l'une d'elle se trouve un fragment de Pharao. Quel est son nom?",
			x:0.0, y: 0.0, r:0, o:["Gratcant","Roarich","Domitien","Ghimthota","Iron Thunder","Maisenta"] }, // Gratcant - lvl50
		// liftier // 
		{ l:"Il n'a pas remarqué le fragment de Pharao sur le plancher de son ascenseur menant à l'aérodrome ou à la guilde. Quel est son nom?",
			x:0.0, y: 0.0, r:0, o:["Grehfarr","Skaenrael","Blanmhas","Willahelm","Lolomaya","Nanahomi","Simcock"] }, // Grehfarr limsa - lvl50
		{ l:"Elle n'a pas remarqué le fragment de Pharao sur le plancher de son ascenseur menant au Bastingage ou l'aérodrome. Quel est son nom?",
			x:0.0, y: 0.0, r:1, o:["Grehfarr","Skaenrael","Blanmhas","Willahelm","Lolomaya","Nanahomi","Simcock"] }, // skaenrael limsa - lvl50
		{ l:"Il n'a pas remarqué le fragment de Pharao sur le plancher de son ascenseur menant au Bastingage ou à la guilde. Quel est son nom?",
			x:0.0, y: 0.0, r:2, o:["Grehfarr","Skaenrael","Blanmhas","Willahelm","Lolomaya","Nanahomi","Simcock"] }, // "Blanmhas" limsa - lvl50
		{ l:"Il n'a pas remarqué le fragment de Pharao sur le plancher de son ascenseur menant à l'aérodrome ou au District. Quel est son nom?",
			x:0.0, y: 0.0, r:3, o:["Grehfarr","Skaenrael","Blanmhas","Willahelm","Lolomaya","Nanahomi","Simcock"] }, // "Willahelm" uld'ha - lvl50
		{ l:"Il n'a pas remarqué le fragment de Pharao sur le plancher de son ascenseur menant à l'aérodrome ou au Marché. Quel est son nom?",
			x:0.0, y: 0.0, r:4, o:["Grehfarr","Skaenrael","Blanmhas","Willahelm","Lolomaya","Nanahomi","Simcock"] }, // "Lolomaya" uld'ha - lvl50
		{ l:"Il n'a pas remarqué le fragment de Pharao sur le plancher de son ascenseur menant au District ou au Marché. Quel est son nom?",
			x:0.0, y: 0.0, r:5, o:["Grehfarr","Skaenrael","Blanmhas","Willahelm","Lolomaya","Nanahomi","Simcock"] }, // "Nanahomi" uld'ha - lvl50
		{ l:"Il n'a pas remarqué le fragment de Pharao dans le bassin derrière lui, trop occupé à orienter les accros aux PGS au sortir de l'ascenseur. Quel est son nom?",
			x:0.0, y: 0.0, r:6, o:["Grehfarr","Skaenrael","Blanmhas","Willahelm","Lolomaya","Nanahomi","Simcock"] }, // "Simcock" gold saucer salle course chocobo
		// divers // 
		{ l:"Il est tellement fier de son titre de colonel du serpent qu'il n'a pas remarqué le fragment de pharao tombé dans sa poche. Quel est son prénom?",
			x:0.0, y: 0.0, r:0, o:["Vorsaile","Cingur","Antoinaut","L'khonebb","Alderan","Djole","Shichito"] }, // Vorsaile Heuloix grande compagnie serpents
		{ l:"Il n'a pas remarqué le fragment de Pharao tombé dans la sacoche de son chocobo lorsque ce dernier a transporté un Aventurier en Gridania. Quel est le nom de ce palefrenier?",
			x:0.0, y: 0.0, r:1, o:["Vorsaile","Cingur","Antoinaut","L'khonebb","Alderan","Djole","Shichito"] }, // palefremier 
		{ l:"Son auberge des Serpents est réputée. Lors du ménage il a découvert un fragment de Pharao. Quel est son nom?",
			x:0.0, y: 0.0, r:2, o:["Vorsaile","Cingur","Antoinaut","L'khonebb","Alderan","Djole","Shichito"] }, // aubergiste 
		{ l:"C'est le guide permettant de se rendre sur la Fenêtre Bleue, endroit où un fragment de Pharao est tombé. Quel est son nom?",
			x:0.0, y: 0.0, r:3, o:["Vorsaile","Cingur","Antoinaut","L'khonebb","Alderan","Djole","Shichito"] }, // khonebb", ishgard
		{ l:"Il permet de spécialiser un métier de craft à l'aide d'une rune. Il n'a pas remarqué qu'il en avait une en trop, un fragment de Pharao. Quel est son nom?",
			x:0.0, y: 0.0, r:4, o:["Vorsaile","Cingur","Antoinaut","L'khonebb","Alderan","Djole","Shichito"] }, // alderan, ishgard
		{ l:"Il propose discrètement un fragment de Pharao en plus d'échanger des équipements de raids des Limbes. Quel est son nom?",
			x:0.0, y: 0.0, r:5, o:["Vorsaile","Cingur","Antoinaut","L'khonebb","Alderan","Djole","Shichito"] }, // Djole, radz
		{ l:"Il est seul en Hingashi à croire que le fragment de Pharao qu'il a trouvé est un appat de pêche. Quel est son nom?",
			x:0.0, y: 0.0, r:6, o:["Vorsaile","Cingur","Antoinaut","L'khonebb","Alderan","Djole","Shichito"] }, // Shichito, vendeur d'outil - kugane
		// divers // 
		{ l:"Elle est la seule à vendre des huîtres crues dans une auberge au milieu de la forêt. Quel est le nom du propriétaire de l'auberge? (ce n'est pas un pnj)",
			x:0.0, y: 0.0, r:0, o:["Buscarron","Eylgar","Mutamix","Dominiac","Eloin","Leih","Maquignonne"] }, // buscarron, via la serveuse
		{ l:"Membre des Vigiles Sombres, il indique qu'il faut se méfier des coups de pattes des chocobos du ranch. Il n'a pas remarqué le fragment de Pharao dans le tonneau à coté de lui. Quel est son nom?",
			x:0.0, y: 0.0, r:1, o:["Buscarron","Eylgar","Mutamix","Dominiac","Eloin","Leih","Maquignonne"] }, // Eylgar ranch branchar, foret centrale
		{ l:"C'est le spécialiste autoproclamé de la transmatérialisation. Son dernier échec a été, tel un aimant, d'attirer un fragment de Pharao des versants des fumerolles. Quel est son prénom?",
			x:0.0, y: 0.0, r:2, o:["Buscarron","Eylgar","Mutamix","Dominiac","Eloin","Leih","Maquignonne"] }, // mutamix
		{ l:"Perdu au milieu de terres enneigées, il propose de jouer à Triple Triade sans remarquer qu'une de ses cartes est un fragment de Pharao. Quel est son nom?",
			x:0.0, y: 0.0, r:3, o:["Buscarron","Eylgar","Mutamix","Dominiac","Eloin","Leih","Maquignonne"] }, // dominiac, haute terre coerthas
		{ l:"Non loin d'une collectionneuse d'ambre rare, il propose des mandats, un fragment de Pharao dans sa poche. Quel est son nom?",
			x:0.0, y: 0.0, r:4, o:["Buscarron","Eylgar","Mutamix","Dominiac","Eloin","Leih","Maquignonne"] }, // Eloin, ishgard
		{ l:"De la famille Aliapoh, elle n'est pas la plus célèbre. Elle aime s'exercer en forêt et surtout mater les chasseurs. Dernièrement, sa flèche a touché un fragment de Pharao. Quel est son prénom?",
			x:0.0, y: 0.0, r:5, o:["Buscarron","Eylgar","Mutamix","Dominiac","Eloin","Leih","Maquignonne"] }, // Leih Aliapoh, guilde chassous
		{ l:"Elle vend de nombreux fourrages pour chocobos dans son ranch. Elle n'a pas remarqué le fragment de Pharao, tel une aiguille dans une de ses bottes de foin. Quel est son nom?",
			x:0.0, y: 0.0, r:6, o:["Buscarron","Eylgar","Mutamix","Dominiac","Eloin","Leih","Maquignonne"] }, // maquignonne, ranch branchar, foret centrale
		// billet d'aerodome
		{ l:"Elle a dissimulé un fragment de Pharao sous son comptoir. On peut lui acheter des billets pour Gridania, Limsa, Ishgard... Quel est son nom?",
			x:0.0, y: 0.0, r:0, o:["Elyenora","Lionnellais","L'nophlo","Imshayra","Chihaya","Agent","Employé"] }, // "Elyenora" ul'dah
		{ l:"Il a dissimulé un fragment de Pharao sous son comptoir. On peut lui acheter des billets pour Ul'dah, Limsa, Ishgard... Quel est son nom?",
			x:0.0, y: 0.0, r:1, o:["Elyenora","Lionnellais","L'nophlo","Imshayra","Chihaya","Agent","Employé"] }, // "Lionnellais" gridania
		{ l:"Elle a dissimulé un fragment de Pharao sous son comptoir. On peut lui acheter des billets pour Ul'dah, Gridania, Ishghard, le Gold Saucer, Radz-at-han. Quel est son nom?",
			x:0.0, y: 0.0, r:2, o:["Elyenora","Lionnellais","L'nophlo","Imshayra","Chihaya","Agent","Employé"] }, // ""L'nophlo""Limsa
		{ l:"Elle a dissimulé un fragment de Pharao sous son comptoir. On peut lui acheter des billets pour Ul'dha, Gridania, Limsa, Ishgard, Kugane... Quel est son nom?",
			x:0.0, y: 0.0, r:3, o:["Elyenora","Lionnellais","L'nophlo","Imshayra","Chihaya","Agent","Employé"] }, // "Imshayra", radz-ad-khan
		{ l:"Elle a dissimulé un fragment de Pharao sous son comptoir. On peut lui acheter des billets pour Radz-at-han. Quel est son nom?",
			x:0.0, y: 0.0, r:4, o:["Elyenora","Lionnellais","L'nophlo","Imshayra","Chihaya","Agent","Employé"] }, // "Chihaya", kugane
		{ l:"Il a dissimulé un fragment de Pharao sous son comptoir. C'est le seul à pouvoir nous amener au camp des cîmes-des-nuages en aéronef. C'est?",
			x:0.0, y: 0.0, r:5, o:["Elyenora","Lionnellais","L'nophlo","Imshayra","Chihaya","Agent","Employé"] }, // Agent des aéronefs coerthas contreforts
		{ l:"Il a dissimulé un fragment de Pharao dans sa poche. On peut lui acheter des billets pour Ul'dah, Gridania, Limsa ou Ishgard. C'est?",
			x:0.0, y: 0.0, r:6, o:["Elyenora","Lionnellais","L'nophlo","Imshayra","Chihaya","Agent","Employé"] }	// Employé des aéronefs - gold saucer
	]
}
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	if (e.elts) return e
	e.elts = new Array(SIZE*SIZE)
	for (let i=0; i < SIZE*SIZE; i++)
		e.elts[i] = { trouvePseudo: null, trouveDth: null, posePseudo: null, poseDth: null, targetIdx: i }
	gbl.shuffle(e.elts)
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
	syncClients(COLNAME+": Admin reset")
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
	syncClients(pseudo+" a découvert un composant de Pharao", "Ding")
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
       case "config":
          // retroune les zones en JSON direct
          gbl.exception( CONFJSON , 200, true)
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

if (CONF.ENIGMES.length < SIZE*SIZE)
	throw new Error("phareo CONF.ENIGMES.length < SIZE*SIZE")
console.log(COLNAME+" loaded")
