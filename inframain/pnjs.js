
const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');

const FILEPNJS="/home/ec2-user/garland/garlandPnjs.json"
const FILEDATA="/home/ec2-user/garland/garlandData.json"
const GARLANDURLID="https://www.garlandtools.org/db/doc/npc/fr/2/"
const NBRANDOM=5

let pnjs = null
let gData = null

function normalize() {
	console.log("** PNJS: normalizing **")
	gData = collections.loadJsonFile(FILEDATA)
	let tmpPnjs = collections.loadJsonFile(FILEPNJS)
	let nbNorm = 0
	let nbGbl = 0
	let nbMultiRef = 0
	let tPnjs = { byId: {}, byNom: {} }
	// balaye les elements du tableau browse contenant des { i, n, l, s, c, t, a, c}
	tmpPnjs.browse.forEach( (e,i) => {
		if (e.i && e.n && e.l && !e.n.startsWith('Sans nom #') ) {
				nbGbl++
				const lettre = e.n.substring(0,1).toLowerCase()
				if (lettre>='a' && lettre <='z') {
					let nom = e.n.replaceAll('<SoftHyphen/>','')
					// if (e.n.indexOf('<') > 0) console.log(e.n, nom)
					tPnjs.byId[e.i] ??= e
					tPnjs.byId[e.i].nom = nom
					tPnjs.byId[e.i].loc = gData.locationIndex[e.l] && gData.locationIndex[e.l].name
					delete tPnjs.byId[e.i].n
					tPnjs.byNom[nom] ??= []
					tPnjs.byNom[nom].push(e.i)
					nbNorm++
				}
		}
	})
	// elimine tous les personnages ayant plusieurs références
	Object.keys(tPnjs.byNom).forEach( (nom) => {
			if (tPnjs.byNom[nom].length != 1) {
					// console.log("delete multiref:",nom);
					nbMultiRef+=tPnjs.byNom[nom].length
					delete tPnjs.byNom[nom]
			}
	})
	// construit le tableau des références
	pnjs = { tblRef: [], byId: {}, byNom: {}, byLettre: {} }
	Object.keys(tPnjs.byNom).forEach( (nom) => {
		let i =  tPnjs.byNom[nom][0]
		let desc = tPnjs.byId[i]
		pnjs.tblRef.push( { n: nom, iDb: i, l: desc.l , loc: desc.l && gData.locationIndex[desc.l] && gData.locationIndex[desc.l].name  } )
		pnjs.byId[i] = tPnjs.byId[i]
		const lettre = nom.substring(0,1).toLowerCase()
		pnjs.byLettre[lettre] ??= []
		pnjs.byLettre[lettre].push(nom)
	})
	// compacte les objets en mémoire (libere les references a tmpPnjs.*)
	pnjs = gbl.deepCompact(pnjs)

	console.log("******************************* PNJS: normalized **")
	console.log("NbPNJ global:",tmpPnjs.browse.length)
	console.log("NbPNJ eligibles:",nbGbl)
	console.log("NbPNJ normalized:",nbNorm)
	console.log("NbPNJ deleted multiref:",nbMultiRef)
	console.log("NbPNJ differents:",pnjs.tblRef.length)
	console.log("NbPNJ nbLettre:",Object.keys(pnjs.byLettre).length)
	console.log("******************************* PNJS: normalized **")
}

// retourne un descriptif par Id
async function getById(id,pseudo) {
	let pnjDesc = pnjs.byId[id] || gbl.exception("pnjs getById BadIndex:"+id,400)
	if (! pnjDesc.garland) {
		// message privé via le ws si pseudo indiqué
		if (pseudo) wsserver.sendToPseudoSimpleText(pseudo,"Je relis le Tour d'Eorzéa en 80 jours")
		// resultat via garland
		let ret = await fetch(GARLANDURLID+id+".json", { method: 'GET', body: null , mode: "cors", cache: "no-cache" } );
		if (ret.status != 200) gbl.exception("pnjs getById getGarlandById Error, id="+id+", garlandStatus="+ret.status, 400)
		// recup le résultat
		let garland = await ret.json();
		// complete pour simplification
		pnjDesc.garland = garland
	}
	console.log(pnjDesc)
	return pnjDesc
}

// retourne NBRANDOM pnj au hazard 
function getRandom() {
	let ret = []
	for (let i=0; i < NBRANDOM ; i++) {
		ret.push( pnjs.tblRef[ Math.floor( Math.random() * pnjs.tblRef.length ) ] ) 
	}
	return ret
}

exports.getById = getById
exports.getRandom = getRandom

exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	switch (method) {
		case "GET":
			pseudos.check(pseudo,pwd);
			switch(reqPaths[2]) {
				case "lettre":
					gbl.exception(pnjs.byLettre[reqPaths[3]],200)
				case "random":
					gbl.exception(getRandom(),200)
				case "id":
					gbl.exception( await getById(reqPaths[3],pseudo), 200)
				case "data":
					gbl.exception( gData, 200)
			}
			gbl.exception("bad GET op",400)
		case "PATCH":
			if (pseudo || pwd) gbl.exception( "Not local admin" ,400)
			switch(reqPaths[2]) {
				case "reload":
					normalize()
					gbl.exception( "ok", 200)
			}
			gbl.exception("bad PATCH op",400)
	}
	gbl.exception("bad meth",400)
}

normalize()

console.log("pnjs loaded");

