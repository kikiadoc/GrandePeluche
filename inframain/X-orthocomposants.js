const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

const COLNAME="X-orthocomposants"

const SIZE=6
const GILS=50
const QUANTITE=4000000
const TIMERQUESTIONRESOLU=5*60000 // temps avant de pouvoir utiliser la question apres résolution  x nbUtilise
const TIMERQUESTIONFAIL=12*60000 // temps avant de pouvoir retenter la question apres erreur
const TIMERQUESTIONSUCCES=6*60000 // temps avant de pouvoir retenter la question apres succes
const TIMERQUESTIONECHEANCE=30*60000 // temps pour répondre à une question
const TIMERELIXIR=10*60000 // Timer apres une conversion x nbConvertis
const LIEUX=[
	{i:0,		lbl:"Sauna"}, // Le petiot - livre OK
	{i:1,		lbl:"Le Labyrinthe"}, // L'explorateur - livre ok
	{i:2,		lbl:"Chambre du temps"}, // Le stockeur - livre OK
	{i:3,		lbl:"Le pont de L'enterprise"}, // le mignon - livre ok
	{i:4,		lbl:"Chambre du 4ème pouvoir"}, // lebogosse - livre ok
	{i:5,		lbl:"Chambre de la force"}, // le calin - libre ok
	{i:6,		lbl:"Oracle des Savoirs"}, // lejoligarcon - livre ok
	{i:7,		lbl:"Dirac des Dimensions"}, // lecoquin - livre ok
	{i:8,		lbl:"Maison de cl, sous-sol"},
	{i:9,		lbl:"Maison de cl, rez-de-chaussée"},
	{i:10,	lbl:"Maison de cl, étage"}
]
const QUESTIONS = [
	{l: 0,	x: 6.0, y: 6.1, d:0.0, lbl: "des coussins des tabourets", q:"Bien qu'alcoolisés, ils appuient sur leurs champignons. Où sont-ils?" },
	{l: 0,	x: 6.0, y: 6.0, d:0.0, lbl: "des oreillers du lit du soupirant", q:"Où est le repos de Daniela? (Ref: Elmer food beat, 1990)" },
	{l: 1,	x: 6.1, y: 5.9, d:0.0, lbl: "d'une goutte d'éther de la lampe cénote", q:"Sa lumière bleutée éclaire un peu la mezzanine d'Icare et de Dédale. Où est-ce?" }, 
	{l: 1,	x: 6.2, y: 6.2, d:0.0, lbl: "un hameçon de canne à pêche", q:"Fans d'ichtyogramme ils exposent aussi leur outillage. Où est-il?" }, 
	{l: 2,	x: 6.0, y: 6.0, d:0.0, lbl: "d'une plume d'Alpha", q:"Au milieu des 4 peluches éclairées dans l'après midi (Heure Eorzéenne). Où est-ce?" }, 
	{l: 2,	x: 6.1, y: 6.2, d:0.0, lbl: "d'une horloge de table", q:"Alors que s'y touvent de nombreuses horloges, c'est l'unique horloge de table. Où est-elle?" },
	{l: 3,	x: 6.0, y: 6.2, d:0.0, lbl: "d'une écaille de peinture du moteur de l'Enterprise", q:"Dans l'enceinte la plus radioactive de tous les lieux. Où est-ce?" },
	{l: 3,	x: 6.0, y: 6.1, d:0.0, lbl: "d'une portion du gâteau roulé de la fête des étoiles", q:"Uhura la gourmande send l'odeur de ce gâteau et elle résiste, résiste... Où se trouve ce gâteau??" },
	{l: 4,	x: 6.2, y: 6.2, d:0.0, lbl: "du tableau d'Hâtegel", q:"Anakin, quand il était enfant, était terrorisé par Castrum Marinum. Il se réfugiait dans un coin pour ne pas le voir, même en peinture. Où est-ce?" },
	{l: 4,	x: 6.2, y: 6.0, d:0.0, lbl: "de poils de Bunbuku", q:"Il s'est caché dans un recoin alors que des dizaines de ses congénères sont possitinnés au millimètre. Où est-il?" },
	{l: 5,	x: 6.1, y: 6.1, d:0.0, lbl: "du tapis à fleurs", q:"Il cultive sa force sur une sorte de tatami de fleurs. Où est-ce?" },
	{l: 5,	x: 6.1, y: 6.0, d:0.0, lbl: "de la reluire du livre de correspondance", q:"Un livre de correspondance mentionne les caractéristiques de l'élixir. Où est-il?" }, 
	{l: 6,	x: 6.1, y: 6.2, d:0.0, lbl: "l'horloge Korpokkur", q:"La grande Peluche est toujours à l'heure. Ou se trouve son horloge préférée?" },
	{l: 6,	x: 6.1, y: 5.9, d:0.0, lbl: "de pièces d'or", q:"La Grande Peluche possède un coffre du mort dans son bureau secret. Où est-il?" },
	{l: 7,	x: 6.0, y: 5.9, d:0.0, lbl: "de la veste de Brina", q:"Elle est toujours dans la matrice, en tenue bleue. C'est la veste de sa copine rouge qui est intéressante. Où est-elle?" },
	{l: 7,	x: 6.1, y: 6.1, d:0.0, lbl: "du couvercle du chaudron du Bunbuku", q:"Dans un chaudron au milieu des carpes. Où est-ce?" },
	{l: 8,	x: 6.0, y: 6.3, d:0.0, lbl: "de l'ADN des reliques du sarcophage de la trour de cristal", q:"C'est dans le coffre contenant les reliques des Héros morts dans la tour de cristal. Où est-il?" },
	{l: 8,	x: 6.2, y: 6.3, d:0.0, lbl: "de l'ADN des reliques du le sarcophage de Pierrechantantes", q:"C'est dans le coffre contenant les reliques des Héros tombés du coté de Pierrechantantes. Où est-il?" },
	{l: 8,	x: 5.8, y: 5.9, d:0.0, lbl: "d'un caillou au fond de l'aquarium", q:"Quatre poissons et un décor de cristal. Où est-ce?" },
	{l: 9,	x: 5.9, y: 6.3, d:0.0, lbl: "d'un éclat du catapoultor de cristal", q:"El señor Pampa s'envoie en l'air. S'il s'éclate, tu pourras récupérer des cristaux. Où est-il.?" }, // recup une peluche pampa pour difficulté
	{l: 9,	x: 5.8, y: 6.2, d:0.0, lbl: "de la tunique de Gilg-a-moche", q:"Gilg-a-moche se fait toujours repousser. Où est-il?" },
	{l: 9,	x: 6.3, y: 6.0, d:0.0, lbl: "de la robe de bure de Yaouanck", q:"Une grande robe de bure légèrement maculée. Où est-elle?" },
	{l: 9,	x: 5.7, y: 6.1, d:0.0, lbl: "de plumes de la Souffleuse de rafales", q:"On peut y mater de jolis culs et ne pas y laisser de plumes. Où est-ce?" },
	{l:10,	x: 6.3, y: 6.3, d:0.0, lbl: "de la peau du timbale du manoir", q:"Il ne peut pas boire dans sa timbale. Où est-elle?" },
	{l:10,	x: 5.8, y: 5.9, d:0.0, lbl: "du set de table", q:"Il va se goinfrer. C'est un dessert gargantuesque. Où est ce dessert?" }
]
const MAP= [
	{ nb: 3000000 }, { nb: 3000000 }, { nb: 4000000 }, { nb: 5000000 }, { nb: 4000000 }, { nb: 5000000 },
	{ nb: 3000000 }, { nb: 4000000 }, { nb: 6000000 }, { nb: 7000000 }, { nb: 6000000 }, { nb: 6000000 },
	{ nb: 4000000 }, { nb: 5000000 }, { nb: 9000000 }, { nb: 9000000 }, { nb: 7000000 }, { nb: 7000000 },
	{ nb: 5000000 }, { nb: 6000000 }, { nb: 9000000 }, { nb: 9000000 }, { nb: 6000000 }, { nb: 4000000 },
	{ nb: 5000000 }, { nb: 5000000 }, { nb: 6000000 }, { nb: 5000000 }, { nb: 3000000 }, { nb: 3000000 },
	{ nb: 4000000 }, { nb: 3000000 }, { nb: 5000000 }, { nb: 4000000 }, { nb: 3000000 }, { nb: 3000000 }
]
const CONF = {
	SIZE: SIZE, GILS: GILS,
	TIMERQUESTIONRESOLU: TIMERQUESTIONRESOLU,
	TIMERQUESTIONECHEANCE:TIMERQUESTIONECHEANCE,
	TIMERQUESTIONSUCCES:TIMERQUESTIONSUCCES,
	TIMERQUESTIONFAIL:TIMERQUESTIONFAIL,
	TIMERELIXIR:TIMERELIXIR,
	LIEUX: LIEUX, QUESTIONS: QUESTIONS, MAP: MAP
 }
const CONFJSON = JSON.stringify(CONF)

// recalc elixirsNb de l'etat e et ajoute ajout
function recalcElixirsNb(e,ajout) {
	let now = Date.now()
	e.elixirsNb ??= 0
	e.elixirsDth ??= now // si aucun calcul précedent
	e.elixirsNb = Math.max(e.elixirsNb - ( now-e.elixirsDth ) , 0) + ajout
	e.elixirsDth = now
}
// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.pseudos ??= {}	// contien les masks des questions du pseudo
	e.questions ??= [] // contien les dths de derniere réponse ok d'une question
	e.composants ??= [] // contien qui a phasé le composants
	for (let i=0; i < QUESTIONS.length; i++)
		e.questions[i] ??= { i:i, nbResolu: 0, nextEcheance: 0, lastPseudo: null, lastDth: 0, firstPseudo: null, firstDth: 0 }
	for (let i=0; i < CONF.SIZE*CONF.SIZE; i++)
		e.composants[i] ??= { i:i, elixirPseudo: null, elixirDth: 0  }
	recalcElixirsNb(e,0)
	return e
}
// synch clients
function syncClients(texte) {
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	collections.save(etat)
	if (texte) wsserver.broadcastSimpleText(texte, "Ding" ,null, 10)
}
// Reset global du mini-jeu
function globalReset() {
	etat = normalize(collections.reset(COLNAME))
	syncClients()
}
// Force termine
function setAll(pseudo) {
	for (let i=0; i < CONF.SIZE*CONF.SIZE; i++) {
		etat.composants[i].elixirPseudo ??= pseudo
		etat.composants[i].elixirDth ??= Date.now()
	}
	syncClients()
}
// recupere l'etat actualisé (avec init du pseudo si besoin)
function getEtat(pseudo) {
	etat.pseudos[pseudo] ??= { qMask:0, qLastDth:0 }
	return etat
}

// depose d'une demande d'un pseudo
function tryQuestion(pseudo,reqPaths,body) {
	let now = Date.now()
  let idx = gbl.checkInt(reqPaths[3],0,QUESTIONS.length -1)
	let q = etat.questions[idx]
	etat.questions.forEach( (qq,ii) => { if (qq.tryPseudo==pseudo) { qq.tryPseudo=null; qq.tryEcheance=0 } } ) 
	q.tryPseudo = pseudo
	q.tryEcheance = now + TIMERQUESTIONECHEANCE
	q.nextEcheance = 0
	syncClients()
}
// proposition de reponse à une question
// les precond sont faite par le client
function propositionQuestion(pseudo,reqPaths,body) {
  let idx = gbl.checkInt(reqPaths[3],0,QUESTIONS.length -1)
	let p = etat.pseudos[pseudo]
	let q = etat.questions[idx]
	let now = Date.now()
	if ( !p ) gbl.exception("Synch client etat.pseudos[pseudo]",400)
	if ( p.qMask & (1<<idx) ) gbl.exception("Synch client OBJMASK",400)
	if ( q.tryPseudo!=pseudo || q.tryEcheance<now ) gbl.exception("Synch client try",400)
	let nb = Math.floor(QUANTITE * (0.8+0.4*Math.random() )) // +/- 20%
	p.qMask |= 1<<idx
	p.qLastDth = now
	q.nbResolu++
	q.lastPseudo = pseudo
	q.lastDth = now
	q.firstPseudo ??= pseudo
	q.firstDth ??= now
	q.tryPseudo = null
	q.tryEcheance = 0
	q.nextEcheance = now+ q.nbResolu*CONF.TIMERQUESTIONRESOLU
	recalcElixirsNb(etat,nb) // ajout d'elixir
  syncClients(pseudo+" a extrait "+nb+" rmol d'élixir")
}
// proposition de reponse à un composant
// 200 si ok, 201 si pas assez d'élixir
function propositionComposant(pseudo,reqPaths,body) {
  let idx = gbl.checkInt(reqPaths[3],0,etat.composants.length -1)
  // verification de la proposition (precond sur le client pour le dth)
  let c = etat.composants[idx]
	if (c.elixirPseudo) gbl.exception("composant trouvé, client unsynch",400)
	let nb= MAP[idx].nb * (0.95 + 0.1*Math.random())
	recalcElixirsNb(etat,-nb) // retrait d'elixir
	if (etat.elixirsNb > 0) {
		c.elixirPseudo = pseudo
		c.elixirDth = Date.now()
  	syncClients(pseudo+" a utilisé "+nb+" rmol d'élixir et phasé un composant")
		gbl.exception( "ok via ws" , 200) 
	}
	else {
  	syncClients(pseudo+" a utilisé toute la réserve d'élixir mais n'a pas réussi à phaser un composant")
		gbl.exception( "ok via ws" , 201) 
	}
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
				case "config":
					// retroune la config globale
					gbl.exception( CONFJSON , 200, true) 
				case "etat":
					// retroune l'état global
					gbl.exception( getEtat(pseudo) , 200) 
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "tryQuestion":
					tryQuestion(pseudo,reqPaths,body)
					gbl.exception( "ok via ws" , 200) 
				case "propositionQuestion":
					propositionQuestion(pseudo,reqPaths,body)
					gbl.exception( "ok via ws" , 200) 
				case "propositionComposant":
					propositionComposant(pseudo,reqPaths,body)
					// gbl.exception( "ok via ws" , 200) 
			}
			gbl.exception(COLNAME+" post",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			switch(reqPaths[2]) {
				case "resetAll":
					globalReset()
					gbl.exception( getEtat(pseudo) , 200) 
				case "setAll":
					setAll(pseudo)
					gbl.exception( getEtat(pseudo) , 200) 
			}
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
