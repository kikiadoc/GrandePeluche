const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');

const COLNAME="X-barathym"

// Constantes globales de l'environnement
const WORLDSIZE= 5
const ROOTDESC= {glb: "kiki-medieval.glb"}
const MINY= 0.51
const SCALE = WORLDSIZE/1000
const TIMERPROPOSITION=5*60000 // une proposition toutes les 5 minutes
const GILS=50 // en millions de gils

const OBJ3DDESC = {
	// gpBug:					{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"gpBug.glb"},
	// gpTest:					{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"minas_tirith.glb"},
	// gpBombRouge:		{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"kikiBomb-rouge13.glb"},
	// gpBombVert:			{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"kikiBomb-vert2.glb"},
	// gpBombOrange:		{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"kikiBomb-orange.glb"},
	// gpBoy:					{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"kiki-boy3.glb"},
	// gpGirl:					{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"kiki-girl2.glb"},
	// gpHarmonique:		{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"kiki-harmonique2.glb"},
	// gpEdgeMiniature:{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"edgeminiature.glb"},
	// gpEnkidu:				{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"enkidu.glb"},
	// gpCidMiniature:	{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"cidminiature.glb"},
	gpStar:							{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"star.glb"},
	gpTabCheck:					{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"kiki-tableauNoir-check-anim.glb"},
	gpTabCheckLarge:		{ rx:0.0,					ry:0.0,					rz: 0.0,				s:0.010, glb:"kiki-tableauNoir-check-anim.glb"},
	gpTabUnCheck:				{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.005, glb:"kiki-tableauNoir-uncheck-anim.glb"},
	gpTabUnCheckLarge:	{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"kiki-tableauNoir-uncheck-anim.glb"},
	gpGoaRing:					{ rx:-Math.PI/2,	ry:0.0, 				rz: 0.0,				s:0.005, glb:"kiki-GoaRing.glb"},
	gpGlaceMog:					{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.030, glb:"glacemog.glb"},
	gpScrollLock:				{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"kiki-scroll-lock-anim.glb"},
	gpScrollLockLarge:	{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.040, glb:"kiki-scroll-lock-anim.glb"},
	gpPelucheMog:				{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"peluchemog.glb"},
	gpBouleBall:				{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.100, glb:"bouleball.glb"},
	gpHorlogeEcole:			{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"horlogeecole.glb"},
	gpPelucheCalca:			{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"peluchecalca.glb"},
	gpTableauSuzaku:		{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"tableausuzaku.glb"},
	gpTableauHeritiers:	{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"kiki-tableauheritiers-anim.glb"},
	gpTropheeCristalJob:{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"trophee-cristal-job.glb"},
	gpTableauMural:			{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.020, glb:"kiki-tableau-anim.glb"},
	gpUFO:							{ rx:0.0,					ry:0.0, 				rz: 0.0,				s:0.500, glb:"kiki-ufo-anim.glb"},

	gpSunMoon:			{ rx:0.0,					ry:-Math.PI/2,	rz: -Math.PI/2, s:0.030, glb:"kiki-sun-moon-anim.glb"}
}
const OBJSTATIC = [
		{ t: "l", i: 0, act:"tbv", x:-0.3161,	y: 0.4994, z: 0.6620, byNbClick:[{m:"gpTabUnCheckLarge"},{m:"gpTabCheckLarge"}], nom:"Ardoise de bienvenue", //  loc ok
			dsp:{ titre:"Ardoise de bienvenue", body:["➥ Trouve les 4 ardoises permettant de localiser le Bar à Thym.","➥ Découvre les failles."], ding:"X-good-morning" },
			loc: "Dans le portail d'entrée de la ville", res: "Ardoise de bienvenue"
		},
		{ t: "l", i: 1, act:"???", x:-0.3151, y: 0.5634, z: 0.0894, byNbClick:[{m:"gpTabUnCheck"},{m:"gpTabCheck"}], nom:"Indice de lieu #1", // loc ok
			dsp:{ titre:"Indice de lieu #1", body:["Le Bar à Thym est sur le monde Cerbérus"], ding:"X-good-morning" },
			loc: "Dans le haut du clocher central", res: "Monde Cerbérus"
		},
		{ t: "l", i: 2, act:"???", x:-0.1054, y: 0.5023, z:-0.0054, byNbClick:[{m:"gpTabUnCheck"},{m:"gpTabCheck"}], nom:"Indice de lieu #2", // loc ok
			dsp:{ titre:"Indice de lieu #2", body:["Le Bar à Thym est dans Lavandière"], ding:"X-good-morning"  },
			loc: "Sur un puit", res: "Brumée"
		},
		{ t: "l", i: 3, act:"???", x:-0.3875, y: 0.4945, z:-0.9906, byNbClick:[{m:"gpTabUnCheck"},{m:"gpTabCheckLarge"}], nom:"Indice de lieu #3", // loc ok
			dsp:{ titre:"Indice de lieu #3", body:["Le nombre 11 est important pour localiser le Bar à Thym"], ding:"X-good-morning" },
			loc: "En extérieur de la ville  et à l'arriere, dans une maison", res: "Nombre 11"
		},
		{ t: "l", i: 4, act:"???", x: 0.0349, y: 0.6877, z:-0.2934, byNbClick:[{m:"gpTabUnCheck"},{m:"gpTabCheckLarge"}], nom:"Indice de lieu #4", // loc ok
			dsp:{ titre:"Indice de lieu #4", body:["Le nombre 82 est important pour localiser le Bar à Thym"], ding:"X-good-morning" },
			loc: "En haut d'une tour de la ville", res: "Nombre 82"
		},
		{ t: "q", i: 5, act:"???", x:-0.2174, y: 0.4945, z: 0.3365, byNbClick:[{m:"gpScrollLock"},{m:"gpPelucheMog"}], nom:"Le Mog perdu", // loc ok  A VERIFIER (j'en vois 8 pas 9)
			dsp:{ titre:"Le mog perdu", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "Je suis un mog perdu, j'aimerai tant retourner dans le Bar à Thym. Combien de Mog y sont encore ?", r:4 , o:["5","6","7","8","9","10","11","12"] },
			loc: "Dans une maison donnant sur la place du bûcher", res: "Le Mog Perdu"
		},
		{ t: "q", i: 6, act:"???", x:-0.3161, y: 0.9994, z: 0.6620, byNbClick:[{m:"gpScrollLock"},{m:"gpHorlogeEcole"}], nom:"L'horloge perdue", // loc ok A VERIFIER (5 pour objectif 6)
			dsp:{ titre:"L'horloge perdue", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "Je ne suis pas un Pharao, seulement une horloge perdue, j'aimerai tant retourner dans le Bar à Thym. Combien de d'horloges y sont encore ?", r:4 , o:["2","3","4","5","6","7","8","9","10"] },
			loc: "Au dessus de la ville", res: "L'horloge perdue"
		},
		{ t: "q", i: 7, act:"???", x:-0.5569, y: 0.4945, z:-0.1881, byNbClick:[{m:"gpScrollLock"},{m:"gpPelucheCalca"}], nom:"La peluche perdue", // loc ok Q OK en précifiant que le nom doit être peluche
			dsp:{ titre:"La peluche perdue", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "J'étais dans le Bar à Thym, et pouf, je me suis retrouvée ici. Combien de peluches reste-t-il dans le Bar à Thym? (seuls les objets nommés peluche sont valides)", r:6 , o:["6","7","8","9","10","11","12","13","14","15","16"] },
			loc: "Dans la maison au Coq, Vache et Cochon", res: "La Peluche perdue"
		},
		{ t: "q", i: 8, act:"???", x:-0.7041, y: 0.4945, z:-0.2446, byNbClick:[{m:"gpScrollLock"},{m:"gpBouleBall"}], nom:"La boule perdue", // loc ok , Q OK
			dsp:{ titre:"La boule perdue", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "Je suis une boule de pétanque. Peut-être est à cause de cela que je suis ici. Combien de boules de billard sont dans le Bar à Thym?", r:6 , o:["9","10","11","12","13","14","15","16"] },
			loc: "A l'extérieur de la ville, au pied des remparts", res: "La boule perdue"
		},
		{ t: "q", i: 9, act:"???", x:-0.6534, y: 0.6877, z:-0.2961, byNbClick:[{m:"gpScrollLock"},{m:"gpTableauHeritiers"}], nom:"Les Héritiers", // loc ok Q OK
			dsp:{ titre:"Les héritiers", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "Nous nous sommes retrouvé dans ce tableau. Combien d'entre-nous pourraient s'assoir dans le Bar à Thym si nous y retournions?", r:8 , o:["aucun","2","3","4","5","6","7","8","9","10"] },
			loc: "En haut d'une tour de la ville", res: "Les héritiers"
		},
		{ t: "q", i:10, act:"???", x:-0.5817, y: 0.4945, z: 0.4104, byNbClick:[{m:"gpScrollLock"},{m:"gpTropheeCristalJob"}], nom:"Les cristaux", // loc ok Q OK
			dsp:{ titre:"Les cristaux", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "Parmi les jobs suivant, quel trophée en cristal n'est pas présent dans le Bar à Thym?", r:1 , o:["Mage bleu","Mage blanc","Danseur","Astromancien","Faucheur","Mage rouge","Sage"] },
			loc: "Dans une maison gardée par un hallebardier, une vache et un cochon", res: "Le cristal manquant"
		},
		{ t: "q", i:11, act:"???", x:-0.0720, y: 0.4945, z:-0.1662, byNbClick:[{m:"gpScrollLock"},{m:"gpTableauMural"}], nom:"Le Cadre du Vide", // loc ok Q OK
			dsp:{ titre:"Le Cadre du Vide", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "Pour retourner dans mon tableau juste à gauche en entrant dans le Bar à Thym, dis moi ce que je représente", r:1 , o:["Gridania","Ul'dah","Limsa","Tour de cristal","Fort Jobb","Le Nichoir","Azurée"] },
			loc: "Dans la maison au cheval et les deux cochons, près du marché", res: "Le tableau à gauche"
		},
		{ t: "q", i:12, act:"???", x:-0.9094, y: 0.6291, z:-1.6262, byNbClick:[{m:"gpScrollLockLarge"},{m:"gpTableauMural"}], nom:"Le Cadre du Néant", // loc ok Q OK
			dsp:{ titre:"Le Cadre du Néant", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "Pour retourner dans mon tableau juste à droite en entrant dans le Bar à Thym, dis moi ce que je représente", r:3 , o:["Gridania","Ul'dah","Limsa","Tour de cristal","Fort Jobb","Le Nichoir","Azurée"] },
			loc: "Dans la nature, à l'opposé de la Porte de la Ville", res: "Le tableau à droite"
		},
		{ t: "q", i:13, act:"???", x: 0.2565, y: 0.6877, z: 0.1622, byNbClick:[{m:"gpScrollLockLarge"},{m:"gpTableauMural"}], nom:"Le Gentil ou le Méchant", // loc ok Q OK
			dsp:{ titre:"Le Gentil ou le Méchant", body:["Ton parchemin des failles a été mis à jour"], ding:"Applaudissements" },
			qcu: { q: "Mon portrait est au dessus de la porte d'entrée du Bar à Thym, qui suis-je", r:2 , o:["Aliva","Alphinaud","Emet-Selch","Estinien","Thancred","Valens Van Varro","Wheiskaet"] },
			loc: "Sous la coupole d'une tour", res: "Le tableau de la porte"
		},
		// soucoupe
		{ t: "i", i:14, act:"???", x:-0.5000,	y:1.2000, z:0.0000, byNbClick:[{m:"gpUFO"},{m:"gpUFO"}], nom:"UFO",
			dsp:{ titre:"UFO", body:["Coucou, c'est Hildiscord. Ou plutôt c'est mon esprit dans l'Ortho-Temps. Je peux transmettre des messages selon tes actions sur ton Parchemin des Failles"], ding:"X-scifi" },
			loc: "???", res: "UFO"
		}
]

const WORLD3DDESC = { 
	PATH:"expansion/",
	WORLDSIZE: WORLDSIZE,
	ROOTDESC: ROOTDESC,
	CAM:{ x:-0.3062,y:0.5975,z:1.0831,rx:-0.0656,ry:3.1930,rz:0.0000, speed:0.2, minZ:WORLDSIZE/10000, maxZ:WORLDSIZE*4, minY:MINY, elipsX:0, elipsY:0, elipsZ:0, },
	LIGHT:{ x:0, y: WORLDSIZE/2, z:0, colorR:1.0, colorG:1.0, colorB:1.0 },
	SKYBOX: "space",
	OBJ3DDESC: OBJ3DDESC,
	OBJSTATIC: OBJSTATIC,
}
// ROOTDESC:{ glb:"egyptian_city.glb" },
// ROOTDESC:{ glb:"city_rtx.glb" },
// ROOTDESC:{ glb:"city2.glb" },
// ROOTDESC:{ glb:"futuristic_alien_sea_city.glb" },
// ROOTDESC:{ glb:"city_pack.glb" },
// ROOTDESC:{ glb:"minas_tirith.glb" },

function getMaskObjByType(type) { return OBJSTATIC.reduce( (a,o,i) => (o.t==type) ? a | (1<<i) : a , 0 ) }	 // calcul le mask des type 
function getNbObjByType(type) { return OBJSTATIC.reduce((a,o) => (o.t==type)? a+1: a ,0) }
const CONF = {
				COLNAME:COLNAME,
				GILS:GILS,
				TIMERPROPOSITION:TIMERPROPOSITION,
				WORLD3DDESC:WORLD3DDESC,
				NBO: OBJSTATIC.length,
				NBI: getNbObjByType('i'),
				NBL: getNbObjByType('l'),
				NBQ: getNbObjByType('q'),
				MASKI: getMaskObjByType('i'),
				MASKL: getMaskObjByType('l'),
				MASKQ: getMaskObjByType('q')
}
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	// init de l'etat si besoin
	e.pseudos ??= {} // tableau index par pseudo
	// tableau état objets par index, cooronnee actuelles et le premmier qui a click
	e.objets ??= Array(OBJSTATIC.length).fill(null)
	for (let i=0; i<OBJSTATIC.length; i++)
		e.objets[i] ??= { i:i, updDth:0, x:OBJSTATIC[i].x, y:OBJSTATIC[i].y, z:OBJSTATIC[i].z, s:OBJSTATIC[i].s, fPseudo: null, fDth: 0, rPseudo: null, rDth: 0, dPseudo: null, dDth: 0, } 
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
// Force persque termine
function setAll(pseudo) {
	// A FAIRE 
	syncClients()
}
// recupere l'etat actualisé
function getEtat() {
	return etat
}
// recupere l'etat d'un pseudo
function getEtatPseudo(pseudo) {
	etat.pseudos[pseudo] ??= { objTrouve: 0, objResolu: 0, objDivulgue: 0 }
	return etat.pseudos[pseudo]
}
// un pseudo clique sur un objet 
function trouver(pseudo, objIdx) {
	let p = getEtatPseudo(pseudo)
	let o = etat.objets[objIdx]
	p.objTrouve |= 1<<objIdx	// modifie le masque des objets du pseudo
	if (! o.fPseudo ) { o.fPseudo = pseudo; o.fDth = Date.now() } // premier trouve
	o.updDth = Date.now()
	syncClients()
	return o
}
// un pseudo a trouvé une reponse
function proposition(pseudo,objIdx,idxRep) {
	let p = getEtatPseudo(pseudo)
	let o = etat.objets[objIdx]
	p.objResolu |= 1<<objIdx 
	if (! o.rPseudo ) { o.rPseudo = pseudo; o.rDth = Date.now() } // premier resolu
	o.updDth = Date.now()
	syncClients()
	return o
}
// un pseudo divulgue une reponse
function divulguer(pseudo,objIdx) {
	let p = getEtatPseudo(pseudo)
	let o = etat.objets[objIdx]
	p.objDivulgue |= 1<<objIdx 
	if (! o.dPseudo ) { o.dPseudo = pseudo; o.dDth = Date.now() } // premier divulgué
	o.updDth = Date.now()
	syncClients("Hildiscord a envoyé un message sur Discord de la part de "+pseudo)
	// let x= (100*o.x/WORLDSIZE).toFixed(1)
	// let y= (100*o.y/WORLDSIZE).toFixed(1)
	// let z= (100*o.z/WORLDSIZE).toFixed(1)
	discord.postMessage("expansion","Coucou, c'est Hildiscord.\n\nGrâce à "+pseudo+", la faille "+OBJSTATIC[objIdx].nom+" peut être localisée plus facilement. Ton Parchemin des Failles a été mis à jour.",true)
	return o
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
					gbl.exception( getEtat() , 200) 
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "objetClick":
					trouver(pseudo,gbl.checkInt(reqPaths[3],0,OBJSTATIC.length-1) )
					gbl.exception( "ok via ws" , 200) 
				case "proposition":
					proposition(pseudo,gbl.checkInt(reqPaths[3],0,OBJSTATIC.length-1),gbl.checkInt(reqPaths[4],0,20) )
					gbl.exception( "ok via ws" , 200) 
				case "divulguer":
					divulguer(pseudo,gbl.checkInt(reqPaths[3],0,OBJSTATIC.length-1) )
					gbl.exception( "ok via ws" , 200) 
			}
			gbl.exception(COLNAME+" post",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			switch(reqPaths[2]) {
				case "resetAll":
					globalReset()
					gbl.exception( getEtat() , 200) 
				case "setAll":
					setAll(pseudo)
					gbl.exception( getEtat() , 200) 
			}
			gbl.exception(COLNAME+" delete",400);
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
