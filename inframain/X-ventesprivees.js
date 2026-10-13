const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

// nom de la collection
const COLNAME="X-ventesprivees"
const SERVANTS = [
		/* lepetiot */
		"Kiki's",
		"Baroudeurakiki",
		"Grenierjoli",
		"Fleuraukiki",
		"Superstock'a'kiki",
		"Coquinou-a-kiki",
		"Kikireactif",
		"Zeboy-a-kiki",
		"Wonderkiki", 
		/* lestockeur */
		"Chronos-le-temps",
		"Kairos-l'instant",
		"Sennacherib",
		"Triton-le-messager",
		"Eon-l'eternite",
		"Kiki-min-c-hikaru",
		"Kikibot-a",
		"Kikibot-b",
		"Kikipec-a",
		/* lexplorateur */
		"Dedale",
		"Icare-l'insouciant",
		"Robin-des-bois",
		"Frere-tuck",
		"Mortianna",
		"Kiki-min-c",
		"Kiki-bot-a",
		"Kiki-bot-b",
		"Petit-jean",
		/* lemignon */
		"James-t-kirk",
		"Mr-spock",
		"Hikaru-sulu",
		"Nyota-uhura",
		"Luke-skywalker",
		"Reparateur-alpha",
		"Anakin-a-real-reborn",
		"Han-solo",
		"Robin-des-bois-", 
		/* lebogosse */
		"Senor-teotihuacan",
		"Kiki-le-bogosse-b",
		"Kiki-le-bogosse-c",
		"Kiki-le-bogosse-d",
		"Kiki-le-bogosse-e",
		"Kiki-le-bogosse-f",
		"Anakin'",
		"Luke-",
		"Anakin-enfant",
		/* lecalin */
		"Kiki-calinou-a",
		"Kiki-calinou-b",
		"Kiki-calinou-c",
		"Kiki-calinou-d",
		"Kiki-calinou-e",
		"Kiki-calinou-f",
		"Reverende-mere",
		"Yoda-",
		"Anakin-", 
		/* lejoligarcon */
		"Kikilejoli-dps-a", 
		"Kikilejoli-min-a", 
		"Kikilejoli-min-b", 
		"Kikilejoli-min-c", 
		"Kikilejoli-min-d", 
		"Robin-ba", 
		"Hikaru-bb", 
		"Anakin-bc", 
		"Luke-bd", 
		/* lecoquin */
		"Lecoquin-a", 
		"Lecoquin-b", 
		"Lecoquin-c", 
		"Daniel-jackson", 
		"Grande-peluche-recol", 
		"Hikaru-", 
		"Robin-", 
		"Luke'", 
		"Anakin-x", 
].sort()

const CONF = {
	SERVANTS: SERVANTS,
	TICKETSNBMAX: 30 ,
	PRIXMIN: 49999,
	TICKETSPRIXMAX: 60000000,
	TICKETSREDUCMAX: 20000000,
	GLOBALPRIX: 600000000,
	REDUCSTD: 0.3,
	REDUCMAX: 0.8,
}
const CONFJSON = JSON.stringify(CONF)

// Avancement du mini jeu
let etat = normalize(collections.get(COLNAME,true))
function normalize(e) {
	e.pseudos ??= { }
	return e
}
// Reset global du mini-jeu
function globalReset() {
	console.warn("Collection reset pour",COLNAME)
	etat = normalize(collections.reset(COLNAME))
}
// getPseudo
function getEtatPseudo(pseudo) {
	etat.pseudos[pseudo] ??= { achats: [], totalPaye: 0  }
	return etat.pseudos[pseudo]
}
// Ajout d'un achat pour le pseudo
// post ventesprivees/achat { 
function achat(pseudo,body) {
	let o = JSON.parse(body)
	let e = getEtatPseudo(pseudo)
	// vérification d'un unique achat a minima par le speudo
	let n = e.achats.reduce( (a, c) => (c.id == o.achatId) ? a+1 : a , 0) 
	if (n>0) gbl.exception("Deja achete",400)
	// commit l'achat
	e.achats.push({ pseudo: pseudo, dth: Date.now(), nom: o.achatNom, id: o.achatId, monde: o.achatMonde, prix: o.achatPrix, quantity: o.achatQuantity, pnj: o.achatPnj, servant: o.achatServant })
	collections.save(etat)
}
// remboursement
function rembourser(pseudo,reqPaths) {
	let p=reqPaths[3]
	let s=parseInt(reqPaths[4],10)
	let e = getEtatPseudo(p)
	if (!e) gbl.exception("Erreur pseudo rembourser",400)
	if (!s) gbl.exception("Erreur somme rembourser",400)
	
	// commit
	e.achats.forEach( (a) => a.paye = true )
	e.totalPaye += s
	collections.save(etat)
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
					// init etat du pseudo
					getEtatPseudo(pseudo)
					// retroune l'état global
					gbl.exception( etat , 200) 
       case "config":
          // retroune les zones en JSON direct
          gbl.exception( CONFJSON , 200, true)
			}
			gbl.exception(COLNAME+" get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "achat":
					achat(pseudo,body)
					gbl.exception( etat , 200)
				case "rembourser":
					pseudos.check(pseudo,pwd,true); // adm
					rembourser(pseudo,reqPaths)
					gbl.exception( etat , 200)
			}
			gbl.exception(COLNAME+" post",400);
		case "DELETE": 
			pseudos.check(pseudo,pwd,true); // adm
			globalReset()
			gbl.exception( etat , 200) 
	}
	gbl.exception(COLNAME+" inv http op",400);
}

console.log(COLNAME+" loaded")
