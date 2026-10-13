const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');
const discord = require('../infraback/discord.js');


const INNOMMABLE="mephistopheles"
const NB_LINES=17
const MID_LINE=(NB_LINES-1)/2

const DISCORD_CHANNEL= (gbl.isProd())? "innommable" : "test"

/* pour tests
const ENIGME_DELAY = 3*60*1000
const ENIGME_BAD_DELAY = 2*60*1000
const SHIFT_DELAY = 3*60*1000
const DELAY_GIFT_BAD=1*60*1000
const DELAY_GIFT_GOOD=3*60*1000
const DELAY_PROPOSITION=5*60*1000
*/
const ENIGME_DELAY = 44*3600*1000				// 44H
const ENIGME_BAD_DELAY = 20*3600*1000		// 20H
const SHIFT_DELAY = 11*3600*1000				// 11H
const DELAY_GIFT_BAD=15*60*1000					// 15 min
const DELAY_GIFT_GOOD=2*30*60*1000 			// 1h00
const DELAY_PROPOSITION=18*3600*1000		// 18H
 
// liste des reponses
// n: locution, s: shift, t:target pos, r: reponse, q:question, e: explication
const lstReponses = [
	/* m */ { 
						n: "Llymlaen la navigatrice", s: 0, t: MID_LINE-3, r:"draconide du soleil", z:"Thanalan",  // Thanalan méridional 23.0 38.4
						q: "Dans ce lieu sablonneux se trouvent des petits dragons recouverts d'écailles. Quel est le nom de ces petits dragons?",
						e: "j'ai trouvé un ruban dissimulé sous une écaille d'un draconide du soleil"
					},
	/* e */ { 
						n: "Althyk le contemplateur", s: 0, t:MID_LINE-14, r:"grosse vesse-de-fléau", z:"Sombrelinceul", // Forêt de l'est 29.6 11.4
						q: "Aux confins de ces terres tribales, de grosses plantes sont recouvertes d'orifices diffusant des spores. Quel le nom de cette plante?",
						e: "j'ai trouvé un ruban en curant les orifices d'une grosse vesse-de-fléau, mais c'est degeu!"
				  },
	/* p */ {
						n: "Menphina la bien-aimante", s: 0, t:MID_LINE-3, r:"chigoe", z:"Sombrelinceul", // foret centrale 23.6 22.3
						q: "De petits insectes finement ailés attaquent les cow-boys débutants. Quel est le nom de ces insectes?",
						e: "en écartant les ailes d'un chigoe, j'ai trouvé un ruban"
				  },
	/* h */ { 
						n: "Le commerçant Nald'thal", s: -6, t: MID_LINE-20, r:"loup de garde", z:"Sombrelinceul", // foret du nord 19.3 19.7
						q: "Dans le septentrional du nord, des loups portent des colliers et des bracelets à chaque patte. Ces bijoux sont ornés de pointes. Quel est le nom de ces loups?",
						e: "en détroussant un loup de garde de ses bijoux, j'ai trouvé un ruban"
					},
	/* i */ { 
						n: "La mere Nophica", s: 0, t:MID_LINE-12, r:"grenado", z:"Thanalan", // Thanalan septentrional 25.6 23.4
						q: "Dans une mine abandonnée, des monstres au contenu incandescent flottent dans l'air. Quel est le nom de ces montres?",
						e: "en raclant le fond d'un grenado avec une écumoire, j'ai trouvé un ruban"
				  },
	/* s */ { 
						n: "Le vagabond Oshon", s: 0, t:MID_LINE-13, r:"ninki nanka d'eau douce", z:"Dravania", // avant pays dravanien 27.6 25.3 !!!!!!!! SWAP
						q: "Traversant la zone du nord au sud, une grande rivière est le biotope de ce gecko à queue courte et dont le dos est recouvert de protubérances sphériques bleutées. Quel est le nom de ce grand lézard?",
						e: "j'ai percé quelques protubérances de ninki nanka d'eau douce, et j'ai récupété un ruban"
				  },
	/* t */ { 
						n: "Thaliak l'érudit", s: 0, t: MID_LINE-0, r:"coccinelle", z:"Noscea", // noscea centrale 22.1 23.5
						q: "Des insectes se protègent par des élytres rouges tachetées de noir. Ils attaquent les aventuriers inexpérimentés. Quel est leur nom?",
						e: "j'ai récupété un ruban en écartant les élytres d'une coccinelle"
					},
	/* o */ { 
						n: "Halone la conquérante", s: 0, t:MID_LINE-3, r:"endymion", z:"Abalathia", // écume des cieux d'abalathia 14.5 11.1     !!!!!!!! ambigue
						q: "Dans les cieux, on peut croiser des oiseaux pourvus de cornes démesurées en spirale. Quel est le nom de cet oiseau?",
						e: "j'ai récupété un ruban entre deux cornes d'un endymion"
				  },
	/* p */ { 
						n: "Kikiadoc lepetiot", s: 0, t:MID_LINE-11, r:"feu fugace", z:"Coerthas", // hautes terres du coerthas central 33.8 13.5
						q: "Cernée par les neiges, grande est la caverne où de toutes petites flammes peuvent vivoter et virevolter. Quel est le nom de ces petites flammes?",
						e: "j'ai récupéré un ruban dans le halo d'un feu fugace, un si petit mob!"
				  },
	/* h */ { 
						n: "Rhalgr le destructeur", s: 0, t:MID_LINE-1, r:"chevalier miroir", z:"Thanalan", // Thanalan oriental 27.7 24.0
						q: "Dans ce lieu incandescent, ces créatures noires, mi-hommes mi-oiseaux, ne savent pas voler. Quel est le nom de ces chimères?",
						e: "en fouillant les bottes d'un chevalier miroir, j'ai trouvé un ruban"
				  },
	/* e */ { 
						n: "Azeyma la gardienne", s: 0, t: MID_LINE-15, r:"zoblyn de névasse", z:"Coerthas", //  hautes terres du coerthas occidental 26.6 9.5
						q: "Non loin d'un navire pris dans les glaces, ils ressemblent à des araignées, mais n'ont que 6 longues pattes fines et leur dos est recouvert de cristaux. Quel est le nom de ces insectes?",
						e: "en écartant les cristaux d'un zoblyn de névasse, j'ai trouvé un ruban"
					},
	/* l */ {
						n: "Nymela la fileuse", s: 0, t:MID_LINE-4, r:"cocatrix", z:"Dravania",// Arriere pays dravanien 20.3 38.2
						q: "En contrebas d'un pont partiellement détruit, on peut croiser ce volatile réputé pour ses cuisses. Quel est le nom de ce dodo?",
						e: "j'ai trouvé un ruban dissimulé sous une aile d'un cocatrix"
				  },
	/* e */ { 
						n: "Hydaelyn la source", s: 0, t:MID_LINE-4, r:"hapalit", z:"Mor Dhona", // mor dhona 31.1 5.1
						q: "Ils ne cessent de se frapper la poitrine pour démontrer leur force au nord de leur trouvaille. Quel est le nom de ces ogres à cornes incandescentes?",
						e: "j'ai trouvé un ruban ignifugé entre les cornes incandescentes d'un hapalit"
					},
	/* s */ { 
						n: "Byregot l'artisan", s: 0, t:MID_LINE-14, r:"poroggo", z:"Dravania", // arrière pays dravanien 12.3 35.3 
						q: "Non loin d'une caverne épique, ces grenouilles vertes se tiennent sur leurs deux pattes arrières à l'aide d'une canne. Quel est le nom de ces grenouilles?",
						e: "j'ai trouvé un ruban enroulé autour de la canne d'un poroggo"
				  }
]

const lstGifts = [
	{ q: "Limsa Lominsa est la capitale de?"					,	r:0, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Gridania est la capitale de?"								, r:1, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Ul'dah est la capitale de?"									,	r:2, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Ishgard est la capitale de?"								, r:3, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Où se trouve la guilde des mineurs?"				, r:2, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des botanistes?"			, r:1, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des pêcheurs?"				, r:0, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la forge de diamant?"					, r:4, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des menuisiers?"			, r:1, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des forgerons?"			, r:0, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des armuriers?"			, r:0, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des orfèvres?"				, r:2, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des tanneurs?"				, r:1, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des couturiers?"			, r:2, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des alchimistes?"		, r:2, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Où se trouve la guilde des cuisiniers?"			, r:0, o: [ "Limsa Lominsa", "Gridania", "Ul'dah", "Ishgard", "Mor Dhona" ] },
	{ q: "Quel est le nom du quartier de Brumée où se trouvent les appartements?"					, r:0, o: [ "Le Mât de hune", "Plaine-aux-lys", "Le souffle de la Sultane", "Le Coin de l'Atre" ] },
	{ q: "Quel est le nom du quartier de Lavandière où se trouvent les appartements?"			, r:1, o: [ "Le Mât de hune", "Plaine-aux-lys", "Le souffle de la Sultane", "Le Coin de l'Atre" ] },
	{ q: "Quel est le nom du quartier de La Coupe où se trouvent les appartements?"				, r:2, o: [ "Le Mât de hune", "Plaine-aux-lys", "Le souffle de la Sultane", "Le Coin de l'Atre" ] },
	{ q: "Quel est le nom du quartier d'Empyrée où se trouvent les appartements?"					, r:3, o: [ "Le Mât de hune", "Plaine-aux-lys", "Le souffle de la Sultane", "Le Coin de l'Atre" ] },
	{ q: "Dans quelle région se trouve le donjon de Sastasha?"															,	r:0, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon de l'Hypogée de Tam-Tara?"									,	r:1, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon des Mines de Clochecuivre?"								,	r:2, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon d'Halatali?"																,	r:2, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon des Mille Gueules de Toto-Rak?"						,	r:1, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Manoir des Haukke?"											,	r:1, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Bivouac de Brayflox?"										,	r:0, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Temple enseveli de Qarn?"								,	r:2, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Gouffre hurlant?"												,	r:2, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Vigile de Pierre?"											,	r:3, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon de la Forteresse de Dzemael?"							,	r:3, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Val d'Aurum?"														,	r:3, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Palais du Vagabond?"										,	r:0, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Castrum Meridianum?"										,	r:2, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Praetorium?"														,	r:2, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Château d'Amdapor?"											,	r:1, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon du Phare de Sirius?"												,	r:0, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon de l'île de Crèvecarène?"									,	r:0, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Dans quelle région se trouve le donjon de Manteneige?"														,	r:3, o: [ 'Noscea', 'Sombrelinceul', 'Thanalan', 'Coerthas' ] },
	{ q: "Qui est le plus gentil des Lalas?"																							, r:0, o: [ 'Kikiadoc','Iznogoud ','Gargamel','Cruella' ] }
]

let statusDamier = collections.get("innommable", true)

function normalizeDamier() {
	statusDamier.name ??= "innommable"
	statusDamier.enigmeNextDthByPseudo ??= {}
	statusDamier.shiftNextDthByPseudo ??= {}
	statusDamier.shiftCountByPseudo ??= {}
	statusDamier.giftNextDthByPseudo ??= {}
	statusDamier.giftDefinedByPseudo ??= {}
	statusDamier.giftCountByPseudo ??= {}
	statusDamier.propositionNextDthByPseudo ??= {}
	statusDamier.enigmes ??= new Array(lstReponses.length)
}

// verifi l'index d'une enigme avec la chain index strEnigme
function checkEnigmeIndex(strEnigme) {
	const iEnigme = parseInt(strEnigme,10)
	if (isNaN(iEnigme) || iEnigme < 0 || iEnigme>= lstReponses.lenght) gbl.exception("bab enigme num",400);
	return iEnigme;
}

// retourn le nombre de rubans verouilles
function countVerouillesReduce(a,e) {
	return (e && e.locker)? a+1 : a
}
function countVerouilles() {
	return statusDamier.enigmes.reduce( countVerouillesReduce , 0 )
}

// resoudre une enigme
// 200 mauvaise réponse, 201 bonne reponse, 202 unsyncha/deja trouvé
function resoudre(reqPaths,pseudo) {
	// proposition d'un résolution d'énigme
	const iEnigme = checkEnigmeIndex(reqPaths[3])
	const reponse = decodeURI(reqPaths[4])
	const zone = decodeURI(reqPaths[5])
	const now = Date.now()
	// verificaiton du delai de decalage autorisé
	console.log('********',pseudo, statusDamier.enigmeNextDthByPseudo[pseudo], now, 'test', statusDamier.enigmeNextDthByPseudo[pseudo] > now )
	if (statusDamier.enigmeNextDthByPseudo[pseudo] && statusDamier.enigmeNextDthByPseudo[pseudo] > now) gbl.exception('dth non respectee, unsynch client',400)
	// verification de pas encore trouve
	if (statusDamier.enigmes[iEnigme]) gbl.exception ( statusDamier , 202) 
	// si mauvaise réponse 
	if ( (reponse.toLowerCase() != lstReponses[iEnigme].r.toLowerCase()) || (zone != lstReponses[iEnigme].z) ) {
		statusDamier.enigmeNextDthByPseudo[pseudo] = now + ENIGME_BAD_DELAY
		gbl.exception ( statusDamier , 200) 
	}
	// la reponse est correcte
	statusDamier.enigmes[iEnigme] = { n: lstReponses[iEnigme].n, s: lstReponses[iEnigme].s, finder: pseudo, finderDth: now, e: lstReponses[iEnigme].e  }
	statusDamier.enigmeNextDthByPseudo[pseudo] = now + ENIGME_DELAY
	// commit
	collections.save(statusDamier);
	wsserver.broadcastSimpleOp('innommable', statusDamier)
	wsserver.broadcastSimpleText(pseudo+' a découvert le ruban #'+iEnigme,true)
	discord.postMessage(DISCORD_CHANNEL,"\nGG !\nGrâce à **"+pseudo+"**, "+lstReponses[iEnigme].e+
		"\nIl faut maintenant le décaler pour le vérouiller dans sa bonne position, et ce sera plus facile si vous êtes plusieurs connectés en même temps.",true)
	gbl.exception ( "maj via ws", 201)
}

// décaler un ruban
// 202 imposible, 201 deveint vérouillé, 200 ok
function shiftRuban(reqPaths,pseudo) {
	// proposition de décalage d'un ruban
	const iEnigme = checkEnigmeIndex(reqPaths[3])
	const enigme = statusDamier.enigmes[iEnigme]
	const shift = (reqPaths[4]=='up')? -1:1
	const now = Date.now()
	// verificaiton du delai de decalage autorisé
	if (statusDamier.shiftNextDthByPseudo[pseudo] > now) gbl.exception('dth non respectee, client unsynch',400)
	// verification d'un ruban non verouillé
	if (enigme.locker) gbl.exception('deja verouille',202)
	// verification qu'il reste au moins une lettre affichable du ruban
	if (enigme.s + enigme.n.length + shift < 0) gbl.exception('shift up impossible',202)
	if (enigme.s + shift >= NB_LINES ) gbl.exception('shift down impossible',202)
	// decalage du ruban
	enigme.s += shift
	statusDamier.shiftCountByPseudo[pseudo] ??= 0
	statusDamier.shiftCountByPseudo[pseudo] ++
	statusDamier.shiftNextDthByPseudo[pseudo] = now + SHIFT_DELAY

	let rc=500
	// test si ruban devient vérouillé
	if (enigme.s == lstReponses[iEnigme].t) {
		enigme.locker= pseudo
		enigme.lockerDth = now;
		wsserver.broadcastSimpleText(pseudo+' a vérouillé le ruban '+(iEnigme+1),true)
		rc=201
	}
	else {
		wsserver.broadcastSimpleText(pseudo+' a décalé le ruban '+(iEnigme+1),true)
		rc=200
	}
	// commit
	collections.save(statusDamier);
	wsserver.broadcastSimpleOp('innommable', statusDamier)
	// Discord si tout trouve avec le dernier shift !
	if ( countVerouilles() == statusDamier.enigmes.length ) {
		discord.postMessage(DISCORD_CHANNEL,"\nGG !\n**Bravos à tous!**\n\nTous les rubans du Damier sont vérouillés, le nom de l'innomable est confirmé"+
			"\n\nLa résolution du Damier à Rubans nous interroge sur l'Avenir...\nhttps://filedn.eu/lxYwBeV7fws8lvi48b3a3TH/ff14-innommable-trailer.mp4",true)
	}
	gbl.exception ( 'ok maj via ws' , rc)
}

// demande une enigme de gift
function souhaitGift(reqPaths,pseudo) {
	// verification de la dth du gift possible
	if (statusDamier.giftNextDthByPseudo[pseudo] > Date.now()) gbl.exception("dth invalide, synchr client?",400)
	// selection d'un gift si pas de gift actuel
	let giftIdx = statusDamier.giftDefinedByPseudo[pseudo]
	if (! giftIdx) giftIdx = Math.floor(Math.random() * lstGifts.length)
	// reponse
	statusDamier.giftDefinedByPseudo[pseudo] = giftIdx
	gbl.exception ( { n: giftIdx, q: lstGifts[giftIdx].q, o: lstGifts[giftIdx].o, giftNextDthByPseudo: statusDamier.giftNextDthByPseudo  } , 200)
}

// resoud une enigme de gift
// 202: crediteur ne peut pas shift, 201: bonne réponse, 200: mauvaise réponse
function reponseGift(reqPaths,pseudo) {
	let now = Date.now()
	// verification de la dth du gift possible
	if (statusDamier.giftNextDthByPseudo[pseudo] > now) gbl.exception("dth invalide, synch?",400)
	// verification qu'une enigme est en cours
	const giftIdx = statusDamier.giftDefinedByPseudo[pseudo]
	if (!giftIdx) gbl.exception("pas de gift en cours, synch?",400)
	// verification que le crediteur existe
	const crediteur = reqPaths[3]
	if ( !pseudos.exist(crediteur) ) gbl.exception(crediteur+" bad crediteur, synch? acking?",400);
	// verification que le credieur ne peux pas shift
	if ( statusDamier.shiftNextDthByPseudo[crediteur] < now ) gbl.exception('shift available',202)
	// verification du résultat correct
	const reponse = decodeURI(reqPaths[4])
	let rc
	if (lstGifts[giftIdx].r != reponse) {
		// mauvaise réponse
		statusDamier.giftNextDthByPseudo[pseudo] = now + DELAY_GIFT_BAD
		rc = 201
	}
	else {
		// bonne reponse
		statusDamier.giftDefinedByPseudo[pseudo] = null
		statusDamier.giftNextDthByPseudo[pseudo] = now + DELAY_GIFT_GOOD
		statusDamier.giftCountByPseudo[pseudo] ??= 0
		statusDamier.giftCountByPseudo[pseudo]++
		statusDamier.shiftNextDthByPseudo[crediteur] = 0 // now
		wsserver.broadcastSimpleText(pseudo+' a dévérouillé un décalage pour '+crediteur,true)
		rc = 200
	}
	// synch client
	collections.save(statusDamier)
	wsserver.broadcastSimpleOp('innommable', statusDamier)
	gbl.exception ( 'gift ok/ko, maj via ws' , rc)
}

// proposition du nom
// retourn 200 si erreur, 201 si trouvé
function proposition(reqPaths,pseudo) {
	if ( !reqPaths[3] ) gbl.exception( 'bad syntax de proposition', 400)
	let now = Date.now()
	let proposition=reqPaths[3].toLowerCase()
	statusDamier.propositionNextDthByPseudo[pseudo] = now + DELAY_PROPOSITION
	// si pas trouvé
	if (proposition != INNOMMABLE) gbl.exception( statusDamier ,200)
	// nom trouvé
	statusDamier.nomTrouve = { pseudo: pseudo, dth: now, nom: INNOMMABLE  } 
	collections.save(statusDamier)
	discord.postMessage(DISCORD_CHANNEL,"\nGG !\n**"+pseudo+" a découvert le nom de l'Innommable!**\nPeut-être que ce secret sera rendu public!\nPeut-être que tu peux lui demander!",true)
	wsserver.broadcastSimpleOp('innommable',statusDamier)
	wsserver.broadcastSimpleText(pseudo+" a découvert le nom de l'innommable",true)
	gbl.exception('maj via ws',201)
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	// auth
	pseudos.check(pseudo,pwd);

	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// GET retourne état courant pour le pseudo
					gbl.exception( statusDamier , 200) 
				case "enigme":
					// demande d'une énigme
					let iEnigme = checkEnigmeIndex(reqPaths[3])
					gbl.exception( { i: iEnigme, q: lstReponses[iEnigme].q, h: gbl.alphanum2placer(lstReponses[iEnigme].r) }, 200);
			}
			gbl.exception("innommable get",400);
		case "PUT": 
			switch(reqPaths[2]) {
				case "resoudre":
					resoudre(reqPaths,pseudo);
				case "shiftRuban":
					shiftRuban(reqPaths,pseudo);
				case "souhaitGift":
					souhaitGift(reqPaths,pseudo);
				case "reponseGift":
					reponseGift(reqPaths,pseudo);
				case "proposition":
					proposition(reqPaths,pseudo);
			}
			gbl.exception("innommable put",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "clearAll":
					statusDamier={}
					normalizeDamier()
					// commit
					collections.save(statusDamier);
					wsserver.broadcastSimpleOp('innommable', statusDamier)
					gbl.exception("innommable clearall ok",200);
				case "clearTimer":
					delete statusDamier.enigmeNextDthByPseudo[pseudo]
					delete statusDamier.shiftNextDthByPseudo[pseudo]
					delete statusDamier.giftNextDthByPseudo[pseudo]
					delete statusDamier.propositionNextDthByPseudo[pseudo]
					delete statusDamier.nomTrouve
					// commit
					collections.save(statusDamier);
					wsserver.broadcastSimpleOp('innommable',statusDamier)
					gbl.exception("innommable clearatimer ok",200);
				case "deleteFirst":
					statusDamier.enigmes[0]=null
					// commit
					collections.save(statusDamier);
					wsserver.broadcastSimpleOp('innommable',statusDamier)
					gbl.exception("innommable clearatimer ok",200);
				case "unlockFirst":
					delete statusDamier.enigmes[0].locker
					delete statusDamier.enigmes[0].lockerDth
					// commit
					collections.save(statusDamier);
					wsserver.broadcastSimpleOp('innommable',statusDamier)
					gbl.exception("innommable clearatimer ok",200);
			}
			gbl.exception("innommable patch",400);
	}
	gbl.exception("inv http op innommable",400);
}

normalizeDamier()
console.log("innommable loaded")
