const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const tts = require('../infraback/tts.js');

// nom de la collection
const COLNAME="X-tranquilite"

const CONF = {
	GOAL: 40, // nombre de decouverte pour le challenge
	GILS: 50, // gils maximum
	TIMERBATON:	  4*60*1000, // timer d'échenace de reponse quand baton
	DELAIBONNE: 		20*1000, // delai pour bonne réponse
	DELAIMAUVAISE: 180*1000, // delai pour mauvaise réponse
	QUESTIONS: [
			{ q:"Quelle Grande Compagnie réside en Gridania?", r: 2, o:["Le Maelstrom","Les Immortels","Les Deux Vipères"] } 
		,	{ q:"Quelle Grande Compagnie réside en Uld'ah?", r: 1, o:["Le Maelstrom","Les Immortels","Les Deux Vipères"] } 
		,	{ q:"Quelle Grande Compagnie réside en Limsa Lominsa?", r: 0, o:["Le Maelstrom","Les Immortels","Les Deux Vipères"] } 
		,	{ q:"Quelle est la capitale de la Noscea?", r: 0, o:["Limsa Lominsa","Gridania","Ul'dah","Ishgard"] } 
		,	{ q:"Quelle est la capitale de Sombrelinceul?", r: 1, o:["Limsa Lominsa","Gridania","Ul'dah","Ishgard"] } 
		,	{ q:"Quelle est la capitale du Thanalan?", r: 2, o:["Limsa Lominsa","Gridania","Ul'dah","Ishgard"] } 
		,	{ q:"Quelle est la capitale du Coerthas?", r: 3, o:["Limsa Lominsa","Gridania","Ul'dah","Ishgard"] } 
		,	{ q:"Dans quelle instance se trouve Zurvan?", r: 3, o:["R2D2","S1P7","P1P6","Z1P9","C3PO","P1P9","ailleurs"] }  // zurvan Z1P9
		,	{ q:"Quel sort utilise Zurvan pour terminer de casser la plateforme?", r: 1, o:["Glace et Feu","Purge","Astre flamboyant","Métaillade"] }  // zurvan Z1P9 purge
		,	{ q:"Shiva aime utiliser la poussière de?", r: 1, o:["Glace","Diamant","Rubis","Verre","Poil","Feu"] }  // shiva diamant

		,	{ q:"Quel sort lance Moogle Mog XII pour appeler ses compagnons?", r: 0, o:["Aux armes","Marche des Mogs","Lumière Mog","Oeuil de Mog","Venez à moi"] }  // aux armes
		,	{ q:"Le peintre prolifique est un?", r: 4, o:["Elezen","Lalafell","Miqo'te","Roegadyn","Hyur"] }  // hyur
		,	{ q:"En contrebas d'Au Bord du Gouffre, une fontaine est au centre de?", r: 4, o:["la Limace","l'araignée","l'écurie","le port qu'épique","l'escargot"] }  // l'escargot
		,	{ q:"Lui seul permet d'échanger des débris d'exoblindage de Proto-Ultima, c'est?", r: 4, o:["Slipslix","Stickqix","Krystrymm","Goldwox","Slimthix","Fohcwyda"] } // slimthix
		,	{ q:"Firmalbert d'Ishgard garde l'entrée de? ", r: 4, o:["La carrière de Lesteplume","Le chevalier oublié","Brouillasse","La manufacture de Cielacier","Le Palais de l'Ordre du Temple"] } // Palais de l'Ordre du Temple
		,	{ q:"Les Neuf-Nuages sont réputés, quel est le nom de l'aubergiste?", r: 1, o:["Ushitora","Bamponcet","Ansaulme","Haimirich","Ardolain"] } // Bamponcet
		,	{ q:"Le Perchoir est réputé, quel est le nom de l'aubergiste?", r: 0, o:["Antoinaut","Miounne","Ushitora","Leandryne","Mytesyn"] } // Antoinaut
		,	{ q:"Le Sablier est réputé, quel est le nom de l'aubergiste?", r: 3, o:["Momodi","Bamponcet","Miounne","Otopa Pottopa","Adalhard"] } // Otopa Pottopa
		,	{ q:"L'Artimon est réputé, quel est le nom de l'aubergiste?", r: 2, o:["Antoinaut","Bamponcet","Mytesyn","Otopa Pottopa","Adalhard"] } // Mytesyn
		,	{ q:"Le Bokairo est réputé, quel est le nom de l'aubergiste?", r: 1, o:["Antoinaut","Ushitora","Mytesyn","Otopa Pottopa","Bamponcet"] } // Ushitora

		,	{ q:"Festus garde l'entrée d'un batiment de Kugane lequel?", r: 3, o:["Consulat de Radz-at-Han","Sources thermales de Bokaisen","Mujikoza","Consulat de Garlemald"] } // Consulat de Garlemald
		,	{ q:"Mulnith garde l'entrée d'un batiment de Kugane lequel?", r: 0, o:["Consulat de Radz-at-Han","Sources thermales de Bokaisen","Mujikoza","Consulat de Garlemald"] } // Consulat de Radz-at-Han"
		,	{ q:"Un garde surveille le consulat de Garlemald en Kugane, quel est son nom?", r: 0, o:["Festus","Mulnith","Kikimo","Rodney","Ikazuchi"] } // Festus
		,	{ q:"Un garde surveille le consulat de Radz-at-Han en Kugane, quel est son nom?", r: 1, o:["Festus","Mulnith","Kikimo","Rodney","Ikazuchi"] } // Mulnith
		,	{ q:"Dans quelle instance acessible depuis Kugane peut-on affronter Yojimbo et Gilgamesh?", r: 2, o:["Katakana","Le château de Kugane","Le pont Ohashi","La turlute orientale"] } // Le pont Ohashi
		,	{ q:"Dans quelle instance acessible depuis Kugane peut-on affronter Zuiko Maru?", r: 1, o:["Katakana","Le château de Kugane","Le pont Ohashi","La turlute orientale"] } // Le chateau de Kugane
		,	{ q:"Quelle instance n'est pas acessible depuis le pont du Prima Vista?", r: 3, o:["La cité royale de Rabanastre","Le phare de Ridorana","Le monastère d'Orbonne","Le pont Ohashi"] } // Le pont Ohashi
		,	{ q:"En Kugane, comment s'appelle le Guide d'Eureka?", r: 3, o:["Ikazuchi","Botan","Kikimo","Rodney"] } // Rodney
		,	{ q:"Où peut-on combattre Amikiri?", r: 2, o:["Chambre d'Akashio","Shisui Gokagura","Porte de Harutsuge","Domaine de Kelpie"] } // Porte de Harutsuge (temple violet)
		,	{ q:"Pour explorer le Diadème, il faut demander à?", r: 2, o:["Flopassant","Aurvael","Rodney","Ludovraint"] } // Aurvael

		,	{ q:"A dos d'amaro, combien de temps faut-il pour rejoindre Serpentige depuis l'impératif d'Ostall ?", r: 1, o:["1","2","3","4"] } // 2 min
		,	{ q:"Pour se rendre dans la salle de répétition du Prima Vista, il faut utiliser les services de?", r: 3, o:["Chihaya","Yamagumo","Nagatsuki","Pilote de navette"] } // pilote
		,	{ q:"Quelle est la caractéristique unique des chambres proposées par Peshekwa?", r: 2, o:["Pas de sonnette","Grande baie vitrée","Vue sur la mer","L'échelle contre le mur"] } // on voir la mer
	]
}
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.pseudos ??= {}
	e.qPseudo ??= null
	e.qEcheance ??= 0
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
	console.warn("Collection reset pour",COLNAME)
	etat = normalize(collections.reset(COLNAME))
	syncClients(COLNAME+": Admin reset")
}
// Force un positionnement presque termine (debug)
function setAll() {
	console.warn("Collection setAll pour",COLNAME)
	for (let i=0; i < 12; i++) {
		let p = getPseudo("Pipo"+i)
		p.nbOk=i
		p.nbErreur=(12-i)
		p.batonEcheance=Date.now()
	}
	syncClients("Admin: setAll "+COLNAME)
}

// get etat par un pseudo
function getPseudo(pseudo) {
	etat.pseudos[pseudo] ??= { pseudo: pseudo, batonEcheance: 0, nbOk: 0, nbErreur: 0 }
	return etat.pseudos[pseudo]
}
//  recupere une question
let poolQuestions = []
function getQuestion() {
	if (poolQuestions.length < 3) {
			for (let i=0; i<CONF.QUESTIONS.length; i++)
				poolQuestions.push(i)
			gbl.shuffle(poolQuestions)
	}
	return poolQuestions.shift()
}

// demande du baton
function demandeBaton(pseudo) {
	let p = getPseudo(pseudo)
	// verfiication que demande valide
	if (etat.qEcheance > Date.now() ) gbl.exception("respect delai global, client unsynch",400)
	if (p.batonEcheance > Date.now() ) gbl.exception("respect delai perso, client unsynch",400)
	// demande valide
	etat.qPseudo = p.pseudo
	etat.qIdx = getQuestion()
	etat.qEcheance = Date.now() + CONF.TIMERBATON
	p.batonEcheance = etat.qEcheance
	tts.sendTTS (null,[
		{statique:true,  file: ( gbl.escapeTexte("J'ai donné le Bâton de Gils à") )+'.mp3' },
		{statique:true,  file: ( gbl.escapeTexte(pseudo) )+'.mp3' }
	])
}
// reponse
function reponse(pseudo,i) {
	let p = getPseudo(pseudo)
	if (etat.qPseudo!=pseudo) gbl.exception("pas proprio du baton",400)
	if (CONF.QUESTIONS[etat.qIdx].r==i) {
		// bonne réponse
		etat.qPseudo = null
		etat.qEcheance = Date.now() + CONF.DELAIBONNE
		p.batonEcheance = Date.now() + CONF.TIMERBATON
		p.nbOk++
		wsserver.broadcastVideo("X-tranquilite/gp-bravo",0,true)
		tts.sendTTS (null,[
			{statique:true,  file: ( gbl.escapeTexte(pseudo) )+'.mp3' },
			{statique:true,  file: ( gbl.escapeTexte("je te félicite") )+'.mp3' }
		])
	}
	else {
		// mauvaise réponse
		etat.qPseudo = null
		etat.qEcheance = Date.now() + CONF.DELAIMAUVAISE
		p.batonEcheance = Date.now() + CONF.TIMERBATON
		p.nbErreur++
		wsserver.broadcastVideo("X-tranquilite/gp-zut",0,true)
		tts.sendTTS (null,[
			{statique:true,  file: ( gbl.escapeTexte(pseudo) )+'.mp3' },
			{statique:true,  file: ( gbl.escapeTexte("tu es un boulet") )+'.mp3' }
		])
	}
}

// API Calls
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// init le pseudo si besoin
					getPseudo(pseudo)
					syncClients()
					gbl.exception( "via ws" , 200) 
       case "config":
          // retroune les zones en JSON direct
          gbl.exception( CONFJSON , 200, true)
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "demandeBaton":
					demandeBaton(pseudo)
					syncClients()
					gbl.exception( "ok via ws" , 200) 
				case "reponse":
					reponse(pseudo,gbl.checkInt(reqPaths[3],0,100))
					syncClients()
					gbl.exception( "ok via ws" , 200) 
			}
			gbl.exception(COLNAME+" post",400);
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
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
