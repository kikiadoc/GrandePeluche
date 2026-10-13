const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');

// Contient indexé par le pseudo les métrologies chargées
let metrologie = {}

function saveMetrologie(pseudo,m) {
	collections.saveSimpleObject("metrologie_"+pseudo,m)
}
function getMetrologie(pseudo) {
	if (! metrologie[pseudo]) metrologie[pseudo] = collections.loadSimpleObject("metrologie_"+pseudo)
	return metrologie[pseudo]
}
function setMetrologie(pseudo,clef,body,append) {
	// vrif de la clef
	if (! gbl.isDataNameValid(clef)) gbl.exception("bad Dataname",400)
	let m = getMetrologie(pseudo)
	let b = JSON.parse(body)
	b.srvDth = Date.now()
	if (append) {
		m[clef] ??= []
		m[clef].push(b)
	}
	else {
		m[clef] = [b]
	}
	saveMetrologie(pseudo,m)
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// retroune l'état de la métrologie du pseudo
					gbl.exception( getMetrologie(pseudo) , 200) 
			}
			gbl.exception("metrologie get",400);
		case "POST": 
			setMetrologie(pseudo,reqPaths[2],body,true)
			gbl.exception("metrologie post",200);
		case "PUT": 
			setMetrologie(pseudo,reqPaths[2],body,false)
			gbl.exception("metrologie post",200);
		case "DELETE": 
			metrologie[pseudo] = { name: "metrologie_"+pseudo }
			saveMetrologie(pseudo, metrologie[pseudo])
			gbl.exception(getMetrologie(pseudo),200);
	}
	gbl.exception("inv http op",400);
}

console.log("metrologie loaded")
