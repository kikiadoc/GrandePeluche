const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

// nom de la collection
const COLNAME="metropolis"

// divers
const PDFINFOURL=gbl.cdnUrl+"ff-10/RapportArdoise.pdf"
const INDICE1="?-?-?-?-?-?-?-?-?-?-?"
const UNIQEORZEA="Tu ne pourras comprendre cet indice qu'a ton retour en Eorzéa"

// Parametrages téléchargé
const objetsDesc = [
		{ t:"t", cx:-2,  cy:0, cz:0, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise de la Malvenue", // a l'entrée
			clg: {t: "Cette Ardoise est illisible, je peux en envoyer une radiographie à la Grande Peluche", o: ['Envoyer la radio'], r: 0 },
			fini: {t: [ "Rapport de Wilhelm Röntgen", "clique dessus pour le réveler" ], img: 'parchemin.gif', url:PDFINFOURL }
		},
		{ t:"t", cx:-58.90,  cy:  0.30, cz:-25.00, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise de la Rue", // dans la rue
			clg: {t: "Dans le jardin de la maison de CL de Kikiaodc, peux-tu voir Kikiadoc Lecoquin?", o: ['oui','non'], r: 1 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx:-38.40,  cy:  6.50, cz:-11.80, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise du Haut", // haut d'immeuble à coté réservoir et climatisation
			clg: {t: "Dans le restaurant de la maison de CL de Kikiaodc, combien y-a-t-il de convives?", o: ['aucun','1','2','3','4','5','6','7','8'], r: 3 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx:-51.60,  cy:  0.40, cz: 31.40, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise de la Rue (2)", // dans la rue
			clg: {t: "Dans la crypte de la maison de CL de Kikiaodc, combien y-a-t-il de tableaux en hommages aux Valeureux?", o: ['aucun','1','2','3','4','5','6','7','8'], r: 6 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx: 48.50,  cy: 15.20, cz: 53.50, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise du Toit en zinc", // sur le toit en bas de la zone en zinc
			clg: {t: "Dans la crypte de la maison de CL de Kikiaodc, combien de héros peuvent s'assoir à la table ronde?", o: ['aucun','2','4','6','8','10','12','14','16'], r: 6 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx: 73.00,  cy: 39.00, cz:-27.80, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise du Grand Bleu",  // en haut du plus grand immeuble bleu
			clg: {t: "Dans le Bois Bandé (La Coupe, secteur 16, appart ??), quel est le nom de la sorcière?", o: ['cruella','lamocha','ragnagna','mortianna','zombina','zarasustra'], r: 3 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx: 16.70,  cy : 0.20, cz: -9.70, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise des poubelles", // entre les poubelles
			clg: {t: "Dans le Kiki's Sauna (chambre de la maison de CL de Kikiadoc) combien de Lalafells sont debout sur des tabourets fungus?", o: ['aucun','1','2','3','4','5','6','7','8'], r: 2 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx: 47.70,  cy:  0.00, cz: 25.00, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise de la Ruelle", // entre les batiments
			clg: {t: "Dans la chambre de la Force (maison de CL de Kikiadoc) combien de torches éclairent la chambre?", o: ['aucun','1','2','3','4','5','6','7','8'], r: 6 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx:  6.50,  cy:  1.30, cz:-23.30, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise de la Malbouffe", // rdc du restaurant
			clg: {t: "Dans l'alcôve de la maison de CL de Kikiadoc, combien de lanternes hingashiennes éclairent les deux Dhalmels?", o: ['aucun','1','2','3','4','5','6','7','8'], r: 7 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx:  0.80,  cy:  1.40, cz:-48.20, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise du rez-de-chaussée", // rdc de l'immeuble
			clg: {t: "Dans l'auditorium de la maison de CL de Kikiadoc, combien de spectateurs sont assis et écoutent le concert?", o: ['aucun','1','2','3','4','5','6','7','8'], r: 4 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		{ t:"t", cx: -5.40,  cy: 10.60, cz:-27.60, rx:0, ry:0, rz: 0, size: 0.2, anim:'r', lbl:"Ardoise du réservoir", // dans le réservoir
			clg: {t: "Dans la salle des trésors de la maison personnelle de Kikiadoc, combien de coffres regorgent de richesses?", o: ['aucun','1','2','3','4','5','6','7','8'], r: 5 },
			fini:	 {t: [ INDICE1, UNIQEORZEA ] }
		},
		// bombes
		{ t:"b", cx:  -3.20, cy: 0.20, cz:   7.00, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe centrale" }, // dans la rue centrale
		{ t:"b", cx:  12.00, cy:15.30, cz:  18.20, rx:0, ry:0, rz: 0, size: 0.4, lbl:"Bombe Haute" }, // toit de l'immeuble pres du centre
		{ t:"b", cx:   1.00, cy: 0.50, cz:  25.40, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe Roulante" }, // dans le camion bleu
		{ t:"b", cx: -29.80, cy:30.00, cz: -55.00, rx:0, ry:0, rz: 0, size: 0.5, lbl:"Bombe Entourée" }, // dans le plus grand immeuble
		{ t:"b", cx:  36.00, cy: 0.50, cz: -11.20, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe Bidoche" }, // rdc steak ridges bbq
		{ t:"b", cx: -14.50, cy:20.30, cz:  12.00, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe Mouillée" }, // dans réservoir en haut de l'immeuble
		{ t:"b", cx: -26.90, cy:20.50, cz:  23.90, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe OVNI" }, // flottante dans l'espace
		{ t:"b", cx: -52.00, cy: 0.50, cz: -11.30, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe Sale" }, // dans la poubelle
		// { t:"b", cx: -26.90, cy:20.50, cz:  23.90, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe #9" }, // toit de l'immeuble

		// { t:"b", cx: -51.90, cy: 0.20, cz:  24.00, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe #7" }, // poste electrique en haut de l'immeuble
		// { t:"b", cx: -70.00, cy: 0.50, cz:  11.20, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe #8" }, // rdc de l'immeuble
		// { t:"b", cx:  30.90, cy:31.60, cz: -27.60, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe #8" }, // etage de l'immeuble
		// { t:"b", cx: -15.70, cy:11.70, cz:  59.50, rx:0, ry:0, rz: 0, size: 0.2, lbl:"Bombe #10" }, // poste d'aeration en haut de l'immeuble
		// anneau de retour
		{ t:"r", cx:-33, cy:0, cz:0, rx:-Math.PI/2, ry:0, rz: 0, size: 0.3, anim:'g', lbl:"GoaRing #1" }
]

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	// objets identifies par index et liste des trouves par odre de date
	e.objetsStatus ??= new Array(objetsDesc.length)
	for (let i=0; i < objetsDesc.length; i++)
		e.objetsStatus[i] ??= { pseudos: [] }
	// positions contient les positions actuelles des pseudos { [pseudo] { p:pseudo, pre:presence, loc: { cx:x, cy:y, cz:z ... } } }
	e.pseudos ??= {}
	return e
}

// Reset global du mini-jeu - necessite un reload client
function globalReset() {
	console.warn("Collection reset pour métropolis")
	etat = normalize(collections.reset(COLNAME))
	collections.save(etat)
}
// Update la découverte d'une objet
function objetBroadcast(i) {
	wsserver.broadcastSimpleOp("metro.objet", { objetIdx:i, objetStatus:etat.objetsStatus[i] } )
	collections.save(etat)
} 
// efface les decouvertes d'un pseudo
function objetReset(pseudo) {
	for (let i=0; i < objetsDesc.length; i++) {
		let idx = etat.objetsStatus[i].pseudos.findIndex((e)=>e.pseudo == pseudo)
		if (idx >= 0) {
			etat.objetsStatus[i].pseudos=etat.objetsStatus[i].pseudos.toSpliced(idx,1)
			objetBroadcast(i)
		}
		console.log("objetReset",i,idx,etat.objetsStatus[i])
	}
}
// broadcast un challenge sur l'harmonique
function harmoBroadcast(pseudo,i) {
	wsserver.broadcastSimpleOp("metro.harmoChallenge", { objetIdx:i, byPseudo: pseudo } )
} 
// marque un objet trouvé
// 200 dans ous les cas
function objetTrouve(pseudo,i) {
	// recupere la descripttion de l'objet
	const desc = objetsDesc[i]
	const status = etat.objetsStatus[i]
	// combien ont déjà trouve ?
	const nbDejaTrouve =  status.pseudos.length
	// déjà trouve par le pseudo ?
	const trouveIdx = status.pseudos.findIndex((e)=>e.pseudo == pseudo)
	// Si pas indiqué comme cliqué, l'ajoute dans la liste
	if (trouveIdx < 0) status.pseudos.push({pseudo:pseudo,dth:Date.now()})
	switch(desc.t) {
		case 't': // tableaux
				if (status.termine) {
					// ne rien faire, le client a indiqué la soluce lors du clic harmonique
				}
				else {
					harmoBroadcast(pseudo,i) // active le challenge via l'harmo
				}
				break
		case 'b': // bombes
				break
		case 'r': // ring
	}
	// diffuse l'objet
	objetBroadcast(i)
	gbl.exception("via ws",200)
}

// tente une réponse sur un challenge
// 200 bonne reponse en premier, 201 mauvaise réponse
function tryReponse(pseudo,reqPaths) {
	// verif de l'index de l'objet
	let idxObjet = gbl.checkInt(reqPaths[3],0,objetsDesc.length-1)
	let desc =  objetsDesc[idxObjet]
	// verif que l'objet a un challenge
	if (!desc.clg) gbl.exception("Erreur idx objet-challenge",400)
	// recup le status de l'objet
	let status = etat.objetsStatus[idxObjet]
	// si le challenge est déjà termine, on ignore la tentative
	if (status.termine) return
	// récupere la réponse proposée
	let idxReponse = gbl.checkInt(reqPaths[4],0,desc.clg.o.length-1)
	// Si ce n'est pas la bonne réponse
	if (desc.clg.r!=idxReponse) gbl.exception("mauvaise reponse",201)
	// bonne réponse
	status.termine = { pseudo: pseudo, dth: Date.now() }
	// reset les harmoniques en indiquant pour le pseudo son nouveau dth d'harmonique
	wsserver.broadcastSimpleOp("metro.harmoReset", { pseudo:pseudo, dth: Date.now() } )
	// diffuse l'objet
	objetBroadcast(idxObjet)
	gbl.exception( "via ws" , 200) 
}

// WS msgs (op=metro.sync)
exports.syncPseudo = (pseudo,o) => {
	etat.pseudos[pseudo] ??= { p: pseudo }
	if (o.loc) etat.pseudos[pseudo].loc = o.loc
	if (o.enter) etat.pseudos[pseudo].pre = true
	if (o.leave) etat.pseudos[pseudo].pre = false
	if (o.g) etat.pseudos[pseudo].g = o.g
	wsserver.broadcastSimpleOp("metro.sync", etat.pseudos[pseudo])
}
// WS msgs (op=metro.emote)
exports.emote = (pseudo,o) => {
	o.orgPseudo=pseudo
	wsserver.broadcastRaw(o)
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
					gbl.exception( { objetsDesc: objetsDesc, etat: etat } , 200) 
			}
			gbl.exception("metropolis get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "objet": // click sur objet
					objetTrouve(pseudo,gbl.checkInt(reqPaths[3],0,objetsDesc.length-1))
				case "harmo": // click sur harmonique
					gbl.exception( "Harmo a faire" , 400) 
				case "tryReponse": // tentative de réponse
					tryReponse(pseudo,reqPaths)
					gbl.exception( "via ws" , 200) 
				case "objetsReset":
					objetReset(pseudo)
			}
			gbl.exception("metropolis post",400);
		case "DELETE": 
			switch(reqPaths[2]) {
				case "all":
					pseudos.check(pseudo,pwd,true); // auth admin
					globalReset()
					gbl.exception("metropolis delete all ok",200);
				case "moi":
					objetReset(pseudo)
					gbl.exception("metropolis delete pseudo ok",200);
			}
			gbl.exception("metropolis delete",400);
	}
	gbl.exception("inv http op",400);
}

console.log("metropolis loaded")
