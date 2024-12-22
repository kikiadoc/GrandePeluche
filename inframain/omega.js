const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');

const NBRUNES = 25
const NBVISPARRUNE = 4
const COLVISNAME = "omega_vis"
const GAINMAX=10000
const GAINMIN=1000
const DECOTEPARMIN=25 // 25 K par minute, donc 1.5M par heure


// etat du challenge
let etatVis = normalizeVis(collections.get(COLVISNAME, true))

function normalizeVis(v) {
	v.runes ??= new Array(NBRUNES)
	v.nbVisDevissee ??= 0
	v.lastDevisseeDth ??= 0
	v.dthStart ??= null // dth de debut idu challenge ou null pas pas commencé
	v.nbVisTotal = NBRUNES * NBVISPARRUNE
	v.decoteParMin =  DECOTEPARMIN
	v.gainMax = GAINMAX // en KGils
	v.gainMin = GAINMIN // en KGils
	return v
}

// sycnho les clients sur l'état des vis
function syncClientsEtatVis() {
	collections.save(etatVis)
	// broadcast sur le WS
	wsserver.broadcastSimpleOp(COLVISNAME,etatVis)
}

function admResetVis() {
  etatVis = normalizeVis(collections.reset(COLVISNAME))
	syncClientsEtatVis()
}

// demande le retrait d'une vis
// 200 ok, 201 deja devisse, 202 full devisse
function devisser(pseudo,txtVis) {
	let i = gbl.checkInt(txtVis,0,NBRUNES-1)
	// si l'etat des vis pas initialise... c'est le premier
	if (etatVis.runes[i] == null) etatVis.runes[i] = { pseudos: [ ] } 
	// verifie que pas tout devisse
	if (etatVis.runes[i].pseudos.length >= NBVISPARRUNE) gbl.exception("tout devisse",202)
	// verifie que pas encore devisser une vis de cette rune
	etatVis.runes[i].pseudos.forEach( (r) =>  { if (r.pseudo == pseudo) gbl.exception("deja devisse",201) } )
	// ok, ajoute le devissage
	etatVis.runes[i].pseudos.push( { pseudo: pseudo, dth: Date.now() } )
	etatVis.nbVisDevissee++
	etatVis.lastDevisseeDth = Date.now()
	// sync
	syncClientsEtatVis()
	wsserver.broadcastSimpleText(pseudo+" a retiré une vis de la rune #"+(i+1),true)
	gbl.exception("devissage vis ok ",200);
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "vis":
					// si le challenge n'est pas commencé, marque le debut du challenge
					etatVis.dthStart ??= Date.now()
					gbl.exception( etatVis , 200) 
			}
			gbl.exception("omega get",400);
		case "PUT": 
			switch(reqPaths[2]) {
				case "vis":
					devisser(pseudo,reqPaths[3])
			}
			gbl.exception("omega put",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "admResetVis":
					admResetVis()
					gbl.exception("admResetVis",200);
			}
			gbl.exception("bad adm patch",400);
	}
	gbl.exception("inv http op",400);
}

console.log("omega loaded")
