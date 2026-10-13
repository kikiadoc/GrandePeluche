// Construction de l'image IG actuelle
//
//
// ceci desvrait etre une class, mais pas le temps
//
//
//
//
//
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');


/////////////////////////////////////////////////////////////////////////////////////////
// gestion des igImage: undexe par le nom IG et reflete la derniere situation des joueus
/////////////////////////////////////////////////////////////////////////////////////////
// situation = indexé par nomIG { nomIG , pseudo , nears:[], target, objectif, score , echeance }
// objectif, score et dispoAt doivent être géré par les callbacks, c'est stocké mais ignoré
let igImage = null  // par defaut
let cbIgInit = null	// callback d'init de l'image
let cbIgNew = null	// callback lors de l'ajout d'un joueur IG
let cbIgEvent = null // callback lors d'un nouvel event IG
let cbIgTimer = null // callback pour timer
let timerId = null // timerId

// publie les igImage aux clients
exports.synchClients = () => {
	wsserver.broadcastSimpleOp("igImage",igImage)
}
// le client veut les igImage
exports.getImage = () => {
	return igImage
}
// reset les igImage
exports.resetImage = () => {
	igImage = { situations: {}} 
	return igImage
}
// nombre de situations actuelles (incluant Grande Peluche)
exports.getNbSituations = () => {
	return Object.keys(igImage.situations).length
}
// recupere une situation selon le nomIg
exports.getSituationByNomIG = (nomIG) => {
	return igImage.situations[nomIG]
}
// recupere une situation selon le pseudo
exports.getSituationByPseudo = (pseudo) => {
	return Object.values(igImage.situations).find( (s)=> s.pseudo==pseudo)
}
// recupere une situation au hazard
exports.getSituationRandom = () => {
	const lstNomIg = Object.keys(igImage.situations)
	return igImage.situations[lstNomIg[Math.floor(lstNomIg.length*Math.random())]]
}
// recupere les situations sous la forme d'un tableau
exports.getSituations = () => {
	return Object.values(igImage.situations)
}


/////////////////////////////////////////////////////////////////////////////////////////
// Reception d'un evenmeent IG
/////////////////////////////////////////////////////////////////////////////////////////
// evt::= { op:"ig", p: prenom, n: nom, nears: [noms..], target: nom,  action: action }
exports.jsonEvent = async (evt) => {
	try {
		const nomIG = evt.p+" "+evt.n
		// receupere la situation du joueur
		let situation = igImage.situations[nomIG]
		if (!situation) {
			// vérifie les caracteres du pseudo
			if (!gbl.isPseudoValid(evt.p) || !gbl.isPseudoValid(evt.n)) return broadcastSimpleText('Intrus détecté:'+nomIG,true)
			// Joueur pas encore dans les igImage....
			// recupere le pseudo
			let pseudo = pseudos.getByPN(evt.p,evt.n)
			// si pseudo introuvable, erreur
			if (!pseudo) return console.error('Indésirable ignoré:',nomIG)
			// construit la situation
			situation = { nomIG: nomIG, pseudo: pseudo, nears:[], target: null, objectif: null, score: 0, dispoAt: 0 }
			// association de la situation
			igImage.situations[nomIG]=situation
			// appel callback d'init de nouveau joueur
			await cbIgNew(igImage,situation)
		}	
	
		// la situation du joueur est définie, on upate la situation avec les données disponibles dans l'event
		if (evt.nears) situation.nears=evt.nears
		if (evt.target) situation.target=evt.target
	
		// callback de traitement de l'event selon le challnge en cours
		// et synchclient si demandé par la cb
		if (await cbIgEvent(igImage,situation,evt.action)) exports.synchClients()
	}
	catch(e) {
		console.log(e)
	}
}
/////////////////////////////////////////////////////////////////////////////////////////
// appel de la cbIgTimer avec le igImage actuel
/////////////////////////////////////////////////////////////////////////////////////////
async function callCbTimer() {
	try {
		if (await cbIgTimer(igImage)) exports.synchClients()
	}
	catch(e) {
		console.log(e)
	}
}
/////////////////////////////////////////////////////////////////////////////////////////
// Parametrage de l'image IG selon le challenge en cours
/////////////////////////////////////////////////////////////////////////////////////////
exports.init = (cbInit,cbNew,cbEvent,cbTimer) => {
	if (igImage) throw new Error("Une seule instance sur IgImage possible")
	igImage = { situations: {} }
	cbIgNew = cbNew
	cbIgEvent = cbEvent
	cbIgTimer = cbTimer // callback pour timer
	cbInit(igImage) // initialisation de l'image
	timerId = setInterval(callCbTimer,1000)
	return igImage
}

console.log("igImage loaded")
