
const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');
const jetons = require('../infraback/jetons.js');

const sizeMatrix = 6;

let foretStatusInit = {
	name: "broceliande",
	challenge: 0, /* 0 pas ouvert, 1, en cours, 2, terminé */
	participants: {}, /* .pseudo et .nextDth */
	emissaire: {l:5, c:0 },
	cases: [ 
		/* ok:0|1 , lock: 0|1, pseudo:xx, dth: xx, pseudoLock:xx dthLock: xx */
		{},{},{},{},{},{ok:1, pseudo:"la Grande Peluche"},
		{},{},{},{},{},{},
		{},{},{},{},{},{},
		{},{},{},{},{},{},
		{},{},{},{},{},{},
		{ok:1, pseudo:"la Grande Peluche"},{},{},{},{},{}
	]
};

let foretMapInit = [
	/* 0-0 */ { h:0, g: 0, d:1, b:0, t:5, o:false, p:false, ck:"95", q: "Quel est le nom des grosses tortues dans la foret du sud ?", r: "adamankhélone" },
	/* 0-1 */ { h:0, g: 0, d:0, b:1, t:3, o:false, p:false },
	/* 0-2 */ { h:0, g: 1, d:0, b:0, t:5, o:false, p:false, ck:"95", q:"Selon Bloisirant, quelle est la juridiction des Mille Gueules de Toto-Rak?", r:"La 5e Lance des Vigiles Sombres" },
	/* 0-3 */ { h:0, g: 0, d:1, b:0, t:4, o:true , p:true  },
	/* 0-4 */ { h:0, g: 0, d:1, b:0, t:2, o:true , p:true },
	/* 0-5 */ { h:0, g: 0, d:0, b:0, t:1, o:false, p:false, info: "C'est le château de Camelot, la destination du voyage" },
	/* 1-0 */ { h:1, g: 0, d:0, b:0, t:3, o:false, p:false },
	/* 1-1 */ { h:0, g: 0, d:0, b:1, t:6, o:false, p:false, info: "C'est un distributeur de jetons gratuits de Camelot" },
	/* 1-2 */ { h:1, g: 0, d:0, b:0, t:5, o:false, p:false, ck:"95", q: "Selon Alphene, la cité d'Amdapor prospérait au temps de la ...", r:"5e ère astrale" },
	/* 1-3 */ { h:1, g: 0, d:1, b:0, t:5, o:true , p:true , ck:"  ", q: "Pour apaiser le Monstre Gardien de la Porte, indique la première lettre des 6 réponses ayant appaisées les monstres en 0-0 0-2 2-0 3-0 4-2 4-3", r:"alrnmt" },
	/* 1-4 */ { h:1, g: 0, d:1, b:0, t:3, o:true , p:true },
	/* 1-5 */ { h:0, g: 0, d:0, b:0, t:4, o:false, p:false },
	/* 2-0 */ { h:1, g: 0, d:0, b:0, t:5, o:false, p:false, ck:"95", q:"Que gère Juliembert au moulin de la carrière? les ...", r:"ressources" },
	/* 2-1 */ { h:0, g: 0, d:1, b:0, t:3, o:false, p:false },
	/* 2-2 */ { h:1, g: 0, d:0, b:0, t:4, o:false, p:false },
	/* 2-3 */ { h:1, g: 1, d:1, b:0, t:5, o:true , p:true , ck:"95", q: "Chez Buscarron, tout est bon! Que peut-on commander à la serveuse pour 39 gils?", r:"muffin au miel" },
	/* 2-4 */ { h:0, g: 0, d:1, b:0, t:2, o:false, p:false },
	/* 2-5 */ { h:1, g: 0, d:0, b:0, t:5, o:false, p:false, ck:"95", q:"Au ranch de Brancharquée, un habitant s'occupe des courses de chocobos et un autre des fourrages, quels sont leurs noms", r:"Katering ET Maquignonne" },
	/* 3-0 */ { h:1, g: 0, d:0, b:0, t:5, o:false, p:false, ck:"95", q: "Sur la rosace des douze, quelle divinité occupe la place à 9heures?", r:"nymeia" },
	/* 3-1 */ { h:0, g: 1, d:0, b:0, t:2, o:false, p:false },
	/* 3-2 */ { h:1, g: 0, d:0, b:0, t:5, o:false, p:false, ck:"95", q:"Quand on est sur le toit de la tour d'Eugenia, un pouillème au sud de la flèche du toit de la tour, qu'indique la boussole?", r:"X:22.8 Y:24.1 Z:1.0" },
	/* 3-3 */ { h:1, g: 1, d:0, b:0, t:2, o:true , p:true  },
	/* 3-4 */ { h:1, g: 1, d:0, b:0, t:5, o:true , p:true , ck:"95", q: "Selon un habitant du Refuge, les Sylphes sont des créatures d'un tempérament...", r:"Joyeux de nature" },
	/* 3-5 */ { h:1, g: 1, d:0, b:0, t:3, o:true , p:true  },
	/* 4-0 */ { h:1, g: 0, d:1, b:0, t:3, o:true , p:true  },
	/* 4-1 */ { h:1, g: 0, d:1, b:0, t:5, o:true , p:true , ck:"95", q:"Selon un habitant de l'écurie des Murmures, les chocobos sont des animaux...", r:"délicats ET timides" },
	/* 4-2 */ { h:1, g: 0, d:0, b:1, t:5, o:true , p:true , ck:"95", q:"Seule la musique Serenity peut m'apaiser, à quel pnj puis-je l'acheter?", r:"Maisenta" },
	/* 4-3 */ { h:0, g: 0, d:0, b:1, t:5, o:false, p:false, ck:"95", q:"J'adore les tournesols, à quel pnj puis-je acheter un bouquet? ", r:"Tanie" },
	/* 4-4 */ { h:0, g: 0, d:0, b:1, t:6, o:false, p:false, info: "C'est un distributeur de jetons gratuits de Camelot" },
	/* 4-5 */ { h:1, g: 0, d:0, b:0, t:5, o:true , p:true , ck:"95", q:"J'adore fabriquer mon pain, croustillant, moelleux et fabriqué avec 3 farines différentes, à quel pnj puis-je les acheter", r:"Littlejhon" },
	/* 5-0 */ { h:1, g: 0, d:1, b:0, t:0, o:false, p:true , info: "C'est la Grande Bibliothèque du Bois Bandé, le lieu de départ du voyage"},
	/* 5-1 */ { h:1, g: 0, d:0, b:0, t:2, o:true , p:true  },
	/* 5-2 */ { h:0, g: 0, d:1, b:0, t:5, o:true , p:true , ck:"95", q:"Un quartier de Gridania est interdit d'accès au public et aux aventuriers, quel est son nom?", r:"Illustres Combattants De Gridania" },
	/* 5-3 */ { h:1, g: 0, d:1, b:0, t:4, o:true , p:true  },
	/* 5-4 */ { h:1, g: 0, d:1, b:0, t:5, o:true , p:true , ck:"95", q:"Du coté des Chutes de l'Apkallu, un panneau indicateur indique la directions de deux guildes, celles... ?", r:"DES tanneurs ET DES botanistes" },
	/* 5-5 */ { h:1, g: 0, d:0, b:0, t:2, o:true , p:true },
	/* 6 arbres, 6 coffres, 4 bombes, 16 monstres, 2jetons, 2 spéciales
	gridania: 5
	centrale: 1
	est: 2
	sud: 5
	nord: 2
	*/
];

/* analyse de la map:
 * il faut 32 jetons pour l'itinéraire optimal
 * consideration: 6 participants
 * option avoir 6 jetons par participant
 * 12 monstres + 6 bombes + 6 coffres --> 24, manque 8 jetons
 */

// DOIT ETRE LA MEME CHOSE QUE DANS LE CLIENT
const foretType = [
	/* 0 */ {icon: "iconBoisBande"},
	/* 1 */ {icon: "iconCamelot"},
	/* 2 */ {icon: "iconArbre"},
	/* 3 */ {icon: "iconCoffre"},
	/* 4 */ {icon: "iconPiege"},
	/* 5 */ {icon: "iconMonstre"},
	/* 6 */ {icon: "iconJeton"},
	/* 7 */ {icon: "iconError"},
	/* 8 */ {icon: "iconError"},
	/* 9 */ {icon: "iconError"},
];


// INIT
let foretMap= collections.init(foretMapInit);
function normalizeMap() {
	foretMap.forEach( e => { if (e.r) e.tip=gbl.alphanum2placer(e.r) });
}
normalizeMap();
let foretStatus= collections.init(foretStatusInit);

const delaiSans = 10*1000;
const delaiNormal = 180*60*1000;
const delaiMalus = 22*3600*1000;


function decouvrir(idx,pseudo) {
	if (foretStatus.cases[idx].ok) {
		// déjà découvert
		gbl.exception("Cette zone a déjà été découverte",200);
	}
	switch(foretMap[idx].t) {
		case 2: /* arbre */
			foretStatus.cases[idx].ok = 1;
			foretStatus.cases[idx].pseudo = pseudo;
			foretStatus.cases[idx].dth = Date.now();
			nextStepAt(pseudo,delaiNormal);
			refreshClients();
			gbl.exception("Cette zone est très apaisante, repose toi quelques heures dans la verdure",200);
		case 3: /* coffre */
			foretStatus.cases[idx].ok = 1;
			foretStatus.cases[idx].pseudo = pseudo;
			foretStatus.cases[idx].dth = Date.now();
			nextStepAt(pseudo,delaiSans);
			jetons.inc(pseudo,1);
			refreshClients();
			gbl.exception("Super, un coffre magique! Tu as gagné un jeton, et tu vas pouvoir découvrir une autre zone dans quelques secondes",200);
		case 4: /* piege */
			foretStatus.cases[idx].ok = 1;
			foretStatus.cases[idx].pseudo = pseudo;
			foretStatus.cases[idx].dth = Date.now();
			nextStepAt(pseudo,delaiMalus);
			jetons.inc(pseudo,1);
			refreshClients();
			gbl.exception("Un piège t'a piégé! Repose-toi longtemps afin que tes blessures se cicatrisent totalement, mais ta bravoure est récompensée par un Jeton de Camelot",200);
		case 5: /* monstre */
			foretStatus.cases[idx].lock = 1;
			foretStatus.cases[idx].pseudo = pseudo;
			foretStatus.cases[idx].dth = Date.now();
			nextStepAt(pseudo,delaiNormal);
			refreshClients();
			wsserver.broadcastNotification("J'ai découvert un lieu gardé par un monstre, aidez-moi",pseudo);
			gbl.exception("Tu as découvert la zone, mais un monstre en protège l'accès. Pour l'apaiser, résoudre une énigme, tu dois. Clique à nouveau sur cette zone pour faire apparaitre l'énigme, toi et tous les participants peuvent la résoudre sans délai",200);
		case 6: /* jeton */
			foretStatus.cases[idx].ok = 1;
			foretStatus.cases[idx].pseudo = pseudo;
			foretStatus.cases[idx].dth = Date.now();
			nextStepAt(pseudo,delaiNormal);
			refreshClients();
			wsserver.broadcastNotification("J'ai découvert un distributeur de jetons. Profitez-en!!", pseudo);
			gbl.exception("Tu as découvert un distributeur de jeton de Camelot. En cliquant sur cette zone, tous les participants peuvent obtenir un jeton gratuit par jour, commence par toi-même",200);
		default:
			gbl.exception("Bizarre... Contactez Kikiadoc sur discord",200);
	}

}

function deplacer(direction,pseudo) {
	if (! jetons.check(pseudo,2)) gbl.exception("Tu n'as pas assez de jeton de Camelot",200);
	// si emissaire en camelot, impossible
	if ( (foretStatus.emissaire.l == 0) && (foretStatus.emissaire.c == sizeMatrix-1) )
		gbl.exception("Mon émissaire est déjà arrivé en Camelot",200);
	// Recuperation de la zone de l'émissaire
	let targetL = foretStatus.emissaire.l;
	let targetC = foretStatus.emissaire.c;
	let emissaireCase = foretMap[targetL*sizeMatrix + targetC];
	if (direction=="h" && emissaireCase.h)
		targetL--;
	else
	if (direction=="b" && emissaireCase.b)
		targetL++;
	else
	if (direction=="d" && emissaireCase.d)
		targetC++;
	else
	if (direction=="g" && emissaireCase.g)
		targetC--;
	else
	if (direction=="r") {
		targetL=5;
		targetC=0;
	}
	else
		gbl.exception("bad direction",400);
	// la nouvelle case de l'émissaire est définie
	// verification de la case de l'émissaire
	if (! foretStatus.cases[targetL*sizeMatrix + targetC].ok) {
		// non découvert
		gbl.exception("Cette zone n'a pas été découverte",200);
	}
	// La case cible est découverte, deplacement
	foretStatus.emissaire.l = targetL;
	foretStatus.emissaire.c = targetC;
	nextStepAt(pseudo,delaiNormal);		
	jetons.inc(pseudo,-2);
	refreshClients();
	wsserver.broadcastNotification("L'émissaire s'est déplacé selon ma directive",pseudo);
	// Si l'émissaire arrive en camelot.....
	if ( (foretStatus.emissaire.l == 0) && (foretStatus.emissaire.c == sizeMatrix-1) )
		wsserver.broadcastNotification("L'émissaire a découvert un Grand Grimoire de la Magie");
	

	gbl.exception("Je me suis déplacé selon ta directive",200);
}

function resoudre(idx,reponse,pseudo) {
	let statusCase = foretStatus.cases[idx];
	let mapCase = foretMap[idx];
	if (statusCase.lock != 1)
		gbl.exception("Le monstre gardien semble déjà apaisé",200);

	if ( typeof(reponse) == "string" && gbl.stripBlank(decodeURI(reponse).toLowerCase()) == gbl.stripBlank(mapCase.r.toLowerCase()) ) {
		statusCase.lock = 0;
		statusCase.ok = 1;
		statusCase.pseudoLock = pseudo;
		statusCase.dthLock = Date.now();
		jetons.inc(pseudo,1);
		refreshClients();
		wsserver.broadcastNotification("j'ai apaisé un monstre", pseudo);
		gbl.exception("Tu as la bonne réponse, je suis apaisé, et tu as gagné un jeton de Camelot",200);
	}
	else
		gbl.exception("Ta réponse, c'est de la merde de puceron",202);
}

function mark(idx,pseudo) {
	let statusCase = foretStatus.cases[idx];
	if (statusCase.ok != 1)
		gbl.exception("Ce lieu n'est pas encore découvert",200);
	if (statusCase.mark) {
		statusCase.mark = false;
		refreshClients();
		wsserver.broadcastNotification("j'ai modifié l'itinéraire optimal de l'émissaire", pseudo);
		gbl.exception("Tu as supprimé ce lieu de l'itinéraire optimal vers Camelot ",200);
	}
	else {
		statusCase.mark = true;
		// C'st le premier qui dit qui est !!
		let msgComp="";
		if (!statusCase.markPseudo)
			statusCase.markPseudo = pseudo;
		else
			msgComp=", mais " + statusCase.markPseudo + " l'avais déjà mentionné précédemment";
		refreshClients();
		wsserver.broadcastNotification("j'ai modifié l'itinéraire optimal de l'émissaire", pseudo);
		gbl.exception("Tu as indiqué ce lieu comme passage optimal vers Camelot"+msgComp,200);
	}

}

function refreshClients() {
	collections.save(foretStatus);
	wsserver.broadcastCollection(foretStatus);
}

function nextStepAt(pseudo,delai) {
	if (! foretStatus.participants[pseudo] ) foretStatus.participants[pseudo] = {};
	foretStatus.participants[pseudo].nextDth = Date.now() + delai;
}

function checkOpen() {
	if (foretStatus.challenge == 0)
		gbl.exception("Le challenge n'a pas commencé",200);
	if (foretStatus.challenge >= 2)
		gbl.exception("Le challenge est terminé",200);
}

function checkTimer(pseudo) {
	if (! foretStatus.participants[pseudo] )
		return true;
	if (foretStatus.participants[pseudo].nextDth <= Date.now())
		return true;
	gbl.exception("Patiente encore, ton delai de repos n'est pas échu",200);
}

function admResetZone(idx) {
	foretStatus.cases[idx] = {};
	refreshClients();
	gbl.exception("adm reset OK",200);
}

function admOkZone(idx) {
	foretStatus.cases[idx].ok = 1;
	foretStatus.cases[idx].lock = 0;
	foretStatus.cases[idx].pseudo = "administrator";;
	foretStatus.cases[idx].dth = Date.now();
	refreshClients();
	gbl.exception("adm reset OK",200);
}

function admClearPseudo(pseudo) {
	if (! foretStatus.participants[pseudo] )
		gbl.exception("adm clearTimer bad pseudo:"+pseudo,404);
	delete foretStatus.participants[pseudo];
	refreshClients();
	gbl.exception("adm clearTimer OK:"+pseudo,200);
}

function admChallenge(etat) {
	let s = parseInt(etat,10);
	if (isNaN(s)) gbl.exception("adm challenge err: "+etat,400);
	if ( (s<0) || (s>2)) gbl.exception("adm challenge err: "+etat,400);
	foretStatus.challenge = s;
	refreshClients();
	if (s==1)
		wsserver.broadcastNotification("Le challenge commence","La Grande Peluche",null,null,null,true);
	gbl.exception("adm challenge OK:"+etat,200);
}
  

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	switch ( reqPaths[2] ) {
		case "foretMap":
			pseudos.check(pseudo,pwd);
			gbl.exception(foretMap,200);
		case "foretStatus":
			pseudos.check(pseudo,pwd);
			gbl.exception(foretStatus,200);
		case "decouvrir":
			pseudos.check(pseudo,pwd);
			checkOpen();
			checkTimer(pseudo);
			decouvrir(parseInt(reqPaths[3],10),pseudo);
			gbl.exception("erreur dev logic",500);
		case "deplacer":
			pseudos.check(pseudo,pwd);
			checkOpen();
			checkTimer(pseudo);
			deplacer(reqPaths[3],pseudo);
			gbl.exception("erreur dev logic",500);
		case "resoudre":
			pseudos.check(pseudo,pwd);
			checkOpen();
			resoudre(parseInt(reqPaths[3],10),reqPaths[4],pseudo);
			gbl.exception("erreur dev logic",500);
		case "mark":
			pseudos.check(pseudo,pwd);
			checkOpen();
			mark(parseInt(reqPaths[3],10),pseudo);
			gbl.exception("erreur dev logic",500);
		case "admResetZone":
			pseudos.check(pseudo,pwd,true);
			admResetZone(parseInt(reqPaths[3],10));
			gbl.exception("notdev",500);
		case "admOkZone":
			pseudos.check(pseudo,pwd,true);
			admOkZone(parseInt(reqPaths[3],10));
			gbl.exception("notdev",500);
		case "admClearPseudo":
			pseudos.check(pseudo,pwd,true);
			admClearPseudo(reqPaths[3]);
			gbl.exception("notdev",500);
		case "admChallenge":
			pseudos.check(pseudo,pwd,true);
			admChallenge(reqPaths[3]);
			gbl.exception("notdev",500);
	}
}



console.log("broceliande loaded");

