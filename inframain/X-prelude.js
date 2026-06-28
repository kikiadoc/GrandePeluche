const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');

// nom de la collection
const COLNAME="X-prelude"

const AA=2026
const MM= (gbl.isProd())? 5 : 5 // mois-1
const JJ= (gbl.isProd())? 1 : 3
function discordMemoriaTxt(tbl) {
	let txt = ""
	tbl.forEach( (e) => {
		if (e.img) txt += "\n> ["+e.t+"](<"+gbl.cdnUrl+e.img+">) "
		if (e.url) txt += "\n> ["+e.t+"](<"+e.url+">) "
		if (e.mp3) txt += "\n> ["+e.t+"](<"+gbl.cdnUrl+e.mp3+">) "
		if (e.mp4) txt += "\n> ["+e.t+"](<"+gbl.cdnUrl+e.mp4+">) "
	})
	return txt
}
const PRIV = [
	// J
	{ dth: Date.UTC(AA,MM,JJ+0,17,00, 0), gils: 1,
		q: "Quel est le nom de l'assistant Discord de la Grande Peluche et porte parole de Kikiadoc?" , r: "HildiscorD", c:"La réponse était en bas de la question sur Discord!",
		memoria: discordMemoriaTxt([ {t: "Lors d'un prochain mini-jeu, Un lieu secret sera le refuge d'Hildiscord et de toute l'équipe de la Grande Peluche", img:"X-cherchezlelala/grande-peluche-team.jpg"} ]) ,
		discord: "Lis attentivement mon message",
		site: "Indice: Lis attentivement mes messages sur Discord",
	} ,
	{ dth: Date.UTC(AA,MM,JJ+0,17,11, 0), gils: 1,
		q: "Que signifie IPA?" , r: "Institut Peluchique de l'Audiovisuel", c: "La réponse se trouvait dans la liste des Possibles (le menu) du site!",
		memoria: discordMemoriaTxt([ {t: "Tu peux participer, si ce n'est pas déjà fait, au challenge de Bienvenue à l'IPA", mp4:"X-ipa/cabaret.mp4"} ]) ,
		discord: "La réponse est sur le site de la Grande Peluche",
		site: "Indice: Retourne sur la liste des Possibles en cliquant sur Grande Peluche, en haut à gauche de ton écran, lis attentivement et tu auras la solution" ,
  } ,
	{ dth: Date.UTC(AA,MM,JJ+0,17,35, 0), gils: 2,
		q: "En lisière du ranch de Brancharquée, quel est le nom d'un des Vigiles Sombres se terminant par 'D' ?" , r: "ewmonD", c:"Il se trouve en 21.5 21.0 dans la forêt centrale",
		discord: "Voyage IG pour l'identifier",
		site: "Voyage IG pour l'identifier",
	} ,
	{ dth: Date.UTC(AA,MM,JJ+0,17,55, 0), gils: 3,
		q: "De nombreux monuments sont de véritables oeuvres d'art. En Noscea, il y en a de remarquables. L'un d'eux est associé à un valeureux paysan, quel est son nom?" , r: "aerghaemR", c:"La tombe se trouve en 23.2 20.1 en Nocea occidentale",
		memoria: discordMemoriaTxt( [ {t:"Revoir le monument", img:"X-prelude-rapidite/tombe.jpg"} ] ),
		screens: [ {t:"Voir le monument", img:"X-prelude-rapidite/tombe.jpg"} ],
		discord: "Tu trouveras un screen indice sur le site",
		site: "Regarde le screen du lieu.",
	} ,
	{ dth: Date.UTC(AA,MM,JJ+0,18,20, 0), gils: 3,
		q: "Le Coin tranKill, la maison de cl de Kikiadoc (Moogle, Brumée, secteur 19, parcelle 5) est emplie d'Histoire. Moi, la Grande Peluche, je n'étais pas née alors que Kikiadoc y posait la première pierre. Sauras-tu m'indiquer un élément de la première heure et toujours présent aujourd'hui?" , r: "le mythique plongeoir de l'océan", c:"Le mythique plongeoir de l'océan a traversé les ages!",
		memoria: discordMemoriaTxt( [ { t:"Visite vintage du coin tranKill",url:"https://cdn.adhoc.click/V10a/X-prelude-rapidite/visite-maison-cl.mp4" }] ) ,
		screens: [ {t:"Panneau d'information", img:"X-prelude-rapidite/panneau-cl.jpg"} ],
		videos: [ {t:"Vidéo vintage", mp4:"X-prelude-rapidite/visite-maison-cl"} ],
		discord: "Tu trouveras un indice sur le site",
		site: "Rends-toi au coin trainKill et consulte le Panneau d'information. Regarde alors la vidéo vintage et compare ces éléments de la première heure avec le coin tranKill d'aujourd'hui.",
	} ,
	// J+1
	{ dth: Date.UTC(AA,MM,JJ+1,17,20, 0), gils: 3,
		q: "L'ambiance sonore actuelle du site ff14.adhoc.click est un extrait d'un tube vintage d'un duo célèbre, en quelle année est sorti le vinyle?" , r: "1970", c:"El cóndor pasa, Simon & Garfunkel, 1970",
		memoria: discordMemoriaTxt( [{ t:"Leo Rojas Remix", url:"https://www.youtube.com/watch?v=8kQZHYbZkLs" }] ),
		discord: "Va sur le site et écoute l'ambiance sonore du Prélude de la Rapidité",
		site: "Si tu n'entends rien, active l'ambiance audio du site (en haut à droite de ton écran). Pour cette question, Internet est ton ami:",
		urls: [ {t:"youtube", u:"https://www.youtube.com/watch?v=8kQZHYbZkLs"},
						{t:"Wikipedia",u:"https://fr.wikipedia.org/wiki/Simon_and_Garfunkel"},
						{t:"Mistral AI",u:"https://chat.mistral.ai/chat"},
						{t:"ChatGPT",u:"https://chatgpt.com"} ] ,
	} ,
	{ dth: Date.UTC(AA,MM,JJ+1,17,50, 0), gils: 3,
		q: "Dans les chambres de la maison de cl de Kikiadoc (Moogle, Brumée, secteur 19, parcelle 5), des peintres immortalisent des challenges passés, quel est mon préféré?" , r: "paul-cezanne 6.0 5.9",
		c:"Paul Cezanne est dans le bureau de la Grande Peluche.\nChanson Cézanne peint (France Gall, Michel Bergé, 1985)",
		memoria: discordMemoriaTxt( [{ t:"Musique et peinture", url:"https://www.youtube.com/watch?v=ZD3QsZkYg1Y" }] ),
		audios: [ {t:"Ecouter l'indice 🔊", mp3:"X-prelude-rapidite/cezanne-peint"} ],
		discord: "Tu trouveras un **indice audio** sur le site.",
		site: "Réponds sous la forme 'prenom-nom x.x y.y' où prénom-nom est le nom du peintre tel qu'il apparait IG et x.x et y.y sont les coordonnées PRECISES de boussole de l'endroit exact de mon peintre préféré" ,
		noph: "prénom-nom x.x y.y" ,
	} ,
	{ dth: Date.UTC(AA,MM,JJ+1,18,30, 0), gils: 2,
		q: "Qui est responsable des linkshells dans l'allée du Rubis?" , r: "ninishA", c:"Elle se trouve en 10.6 9.7 dans le faubourg de Nald ",
		discord: "Voyage IG pour l'identifier",
		site: "Voyage IG pour l'identifier",
	} ,
	{ dth: Date.UTC(AA,MM,JJ+1,18,45, 0), gils: 1,
		q: "Quel est le nom du PNJ permettant d'obtenir de l'équipement 380 en échange des objets lootés dans les raids? " , r: "gelFradus", c:"Il se trouve dans l'étendue de Rhalgr",
		discord: "Voyage IG pour l'identifier",
		site: "Voyage IG pour l'identifier",
	} ,
	// J+2
	{ dth: Date.UTC(AA,MM,JJ+2,17,10, 0), gils: 3,
		q: "De nombreux poissons vivent dans les aquariums de la Crypte des Valeureux et celui près du joli garçon." , r: "7,9,7,1", c:"Total: 7 aquariums et 17 poissons. Certains sont commestibles, d'autres mortels!",
		discord: "Regarde l'indice vidéo **vintage** sur le site pour localiser les lieux. Une **exploration du nouvel agencement** des lieux est nécessaire.",
		videos: [ {t:"Découverte des lieux", mp4:"X-prelude-rapidite/visite-maison-cl"} ],
		site: "Attention, la vidéo est vintage. Explore attentivement le nouvel agencement. Ta réponse doit être n,p,m,g. n est le nombre total d'aquariums (crypte et joli garçon), p est le nombre total de petits poissons, m est le nombre total de poissons moyens, et g le nombre total de grands pour l'ensemble des aquariums concernés (ie crypte et joli garçon). N.B: il n'y a pas de très grand poisson.",
	} ,
	{ dth: Date.UTC(AA,MM,JJ+2,17,40, 0), gils: 2,
		q: "Quel est le nom de l'éboueur du 789ème ordre le plus près du feu de camp?" , r: "bo bu", c:"Le 789ème ordre est une tribu kobold en Noscéa extérieure",
		discord: "Voyage IG pour l'identifier",
		site: "Voyage IG pour l'identifier",
	} ,
	{ dth: Date.UTC(AA,MM,JJ+2,17,55, 0), gils: 3,
		q: "Robin, le protecteur du Bois Bandé a maîtrisé une sorcière lors du Kiki's Event V. Quel est le nom de cette sorcière?" , r: "MortiannA", c:"Le Bois Bandé (Moogle, La Coupe, secteur 16, appart 5) est un lieu de mémoire des Kiki's Events",
		memoria: discordMemoriaTxt( [{ t:"Souviens-toi de Mortianna (Kikis's Event V)", mp4:"ff-3-trailer.mp4" }, {t:"Souviens-toi des Templiers", mp4:"ff-3-templiers.mp4"}] ),
		videos: [ {t:"Le Bois Bandé🎥", mp4:"X-prelude-rapidite/remix-robin"} , {t:"Event V: final🎥", mp4:"ff-3-trailer" }, {t:"Event V: Les Templiers🎥", mp4:"ff-3-templiers"  },  ],
		discord: "Le Bois Bandé est le nom d'un appartement sur le monde Moogle. Tu peux le découvrir en explorant toi-même ou regarder différentes vidéos vintage du Kiki's Event V",
		site: "Le Bois Bandé est le nom d'un appartement sur le monde Moogle. Tu peux le découvrir en explorant toi-même ou regarder différentes vidéos vintage du Kiki's Event V",
	} ,
	{ dth: Date.UTC(AA,MM,JJ+2,18,30, 0), gils: 2,
		q: "Dans la grotte du chant marin, quel est le nom des monstres lvl 7 à combattre?" , r: "épouvantôme", c:"La grotte du chant marin est dans la Noscea centrale",
		discord: "Voyage IG dans une zone bas-niveau",
		site: "Voyage IG dans une zone bas-niveau",
	} ,
	// J+3
	{ dth: Date.UTC(AA,MM,JJ+3,17, 5, 0), gils: 1,
		q: "Le Choc des Mascottes est un peu long, à quel jeu ultra-rapide peut-on jouer juste à coté? " , r: "attrap'mog", c:"Ok, ça ne rapporte rien, mais c'est ultra-rapide!",
		discord: "Voyage IG",
		site: "Voyage IG",
	} ,
	{ dth: Date.UTC(AA,MM,JJ+3,17,25, 0), gils: 3,
		q: "La Grande Peluche a deux passions: les affiches d'événements et les poissons. Combien d'affiches ou ichtyogrammes sont accrochés dans son bureau?" , r: "15,11", c:"La Grande Peluche collectionne aussi les grimoires des Savoirs",
		discord: "La Grande Peluche se trouve dans sa chambre (maison de cl de Kikiadoc (Moogle, Brumée, secteur 19, parcelle 5)" ,
		site: "Indique ta réponse sous la forme 'aa,cc' ou aa est le nombre d'affiches et cc le nombre de cadres d'ichtyogramme" ,
	} ,
	{ dth: Date.UTC(AA,MM,JJ+3,18, 0, 0), gils: 4,
		q: "Le rucher de Pleinefleur n'a pas été décimé par les frelons asiatiques. Combien y-a-t-il de ruches selon leur taille (petite,moyenne,grande) ?" , r: "9,6,4", c:"Bientôt une belle récolte de miel!",
		site: "Il y a 19 ruches en tout, la taille d'une ruche est déterminée par le nombre de hausses la composant (1,2 ou 3)" ,
		discord: "Il y a 19 ruches en tout" ,
	} ,
	{ dth: Date.UTC(AA,MM,JJ+3,18,20, 0), gils: 2,
		q: "Deux pnjs surveillent les alentours depuis une tour de Sombrelinceul. Quels sont leurs noms?" , r: "maximiloiX, matheomI", c:"Dur dur d'être un PNJ!",
		site: "Un vigile sombre est en bas de la tour et un sergent du serpent est en haut de la tour" ,
		discord: "Un vigile sombre est en bas de la tour et un sergent du serpent est en haut de la tour" ,
	} ,
	{ dth: Date.UTC(AA,MM,JJ+3,18,50, 0), gils: 2,
		q: "Un pnj permet d'explorer la gorge de Syrcus. Quel est son nom?" , r: "guide de saint-coinach", c:"Trop facile de se rendre dans le premier reflet!",
		discord: "Pour cette dernière enigme... débrouille-toi!" ,
		site: "Pour cette dernière enigme... débrouille-toi!" ,
		noph: "nom du pnj" ,
	} ,
]

const CONF= {
	GAGNANTDELAI: 2*60000,
	REPONSEDELAI: 5*60000,
	MALUSDELAI: 45000,			// 45 secondes par bonne réponse
	QUESTIONSNB: PRIV.length,
	TIPDTH : new Array(PRIV.length).fill(0).map( (p,i) => PRIV[i].dth - (PRIV[i].dth % 3600000) )
}
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	// e.pseudos ??= { }
	e.etapes ??= []
	// marque les questions en cours
	for (let i=0; i < PRIV.length; i++) {
		e.etapes[i] ??= { dth: 0, gagnant: null, q: null, ph: null, gils: PRIV[i].gils } 
	}
	return e
}
// Reset global du mini-jeu
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	etat = normalize(collections.reset(COLNAME))
	syncClients()
	scheduleDiscord()
}
// synch clients
function syncClients(texte) {
	collections.save(etat)
	wsserver.broadcastSimpleOp(COLNAME+".etat", etat )
	if (texte) wsserver.broadcastSimpleText(texte, "Ding" ,null, 10)
}

// debut d'une étape et publication discord
function discordNotif(i) {
	console.log("X-prelude: discordNotif",i)
	etat.etapes[i].dth = Date.now()
	etat.etapes[i].gils = PRIV[i].gils
	etat.etapes[i].audios = PRIV[i].audios
	etat.etapes[i].videos = PRIV[i].videos
	etat.etapes[i].screens = PRIV[i].screens
	etat.etapes[i].c = PRIV[i].c
	etat.etapes[i].site = PRIV[i].site
	etat.etapes[i].q = PRIV[i].q
	etat.etapes[i].urls = PRIV[i].urls
	etat.etapes[i].noph = PRIV[i].noph
	etat.etapes[i].ph = gbl.alphanum2placer(PRIV[i].r).toLowerCase()
	
	// emission discord (sans attente de la fin du post)
	discord.postMessage(
		"preludeRapidite",
		"**Le Prélude de la Rapidité "+(i+1)+"/"+PRIV.length+"**"+
		"\n__Le plus rapide à répondre gagne "+PRIV[i].gils+" million"+((PRIV[i].gils>1)?"s":"")+" de Gils__"+
		"\n## "+PRIV[i].q+
		( (PRIV[i].discord)? "\n__"+PRIV[i].discord+"__" : "")+
		"\n**Indique ta réponse sur le site**"
		// "\n(format: "+(etat.etapes[i].noph || etat.etapes[i].ph)+")"
		,true)
	syncClients()
	scheduleDiscord()
}
let scheduleDiscordTimerId = null
const SCHEDULEMAX = 24 * 3600 * 1000
function scheduleDiscord() {
	if (scheduleDiscordTimerId) clearTimeout(scheduleDiscordTimerId)
	const now = Date.now()
	console.log("X-prelude: scheduleDiscord")
	for (let i=0; i < etat.etapes.length; i++) {
		// si message deja envoyé, passe au suivant
		if (etat.etapes[i].q) continue
		const delta = PRIV[i].dth - now
		console.log("X-prelude: Next=",i,delta)
		if (delta > SCHEDULEMAX) {
			console.log("X-prelude: scheduleDiscord delay > 10H, rescheduled i=",i)
			scheduleDiscordTimerId = setTimeout(scheduleDiscord,SCHEDULEMAX)
		}
		else {
			console.log("X-prelude: scheduleDiscord delay ",i,delta)
			scheduleDiscordTimerId = setTimeout(discordNotif,delta,i)
		}
		return
	}
	scheduleDiscordTimerId = null
	console.log("X-prelude: Toutes les étapes ont été déclenchées")
}
scheduleDiscord()

// Test si challenge terminé
function checkTermine() {
	if (PRIV.length == etat.etapes.reduce ( (a,c) => (c.gagnant)? a+1 : a , 0) )
		discord.postMessage("preludeRapidite", "# Le Prélude de la Rapidité est terminé" ,true)
}
// ajout d'une réponse
// exception 200 en cas de bonne réponse, 202 sinon
function reponse(pseudo,pI,texte) {
	const i = gbl.checkInt(pI,0,etat.etapes.length-1)
	// vérfication de la possibilité de répose
	let now = Date.now()
	if (!etat.etapes[i].q ) gbl.exception("etape pas commencée",400)
	if (etat.etapes[i].gagnant) gbl.exception("etape dééjà gagnée",400)
	// reponse
	const bonneReponse = PRIV[i].r.toLowerCase() == texte.toLowerCase().trim()
	if (bonneReponse) {
		etat.etapes[i].gagnant = { p: pseudo, dth: now, r: PRIV[i].r }
		syncClients(pseudo+" vient d'indiquer la bonne réponse")
		discord.postMessage("preludeRapidite",
			"Le Prélude de la Rapidité "+(i+1)+"/"+PRIV.length+
			"\n**"+pseudo+" a indiqué la bonne réponse et gagne "+PRIV[i].gils+" million"+((PRIV[i].gils>1)?"s":"")+" de gils**"+
			"\nRéponse: *__"+PRIV[i].r.toLowerCase()+"__*"+
			"\n"+ (PRIV[i].c || "")+
			(PRIV[i].memoria || "")+
			"\n**Va sur le site pour connaitre la prochaine échéance**"
			,true)
		checkTermine()
		gbl.exception("Bonne réponse",200)
	}
	else
		gbl.exception("Mauvaise réponse",202)
}

// deverouillage admin d'un element
function adminUnlock(i) {
	discordNotif(i)
}

// API Calls
exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE');
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
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "reponse":
					const jsonBody = JSON.parse(body)
					reponse(pseudo,reqPaths[3],jsonBody.reponse) 
			}
			gbl.exception(COLNAME+" post",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // adm
			switch(reqPaths[2]) {
				case "adminUnlock":
					adminUnlock(gbl.checkInt(reqPaths[3],0,PRIV.length-1))
					gbl.exception( "OK" , 200) 
			}
			gbl.exception(COLNAME+" patch",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			globalReset()
			gbl.exception( etat , 200) 
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
