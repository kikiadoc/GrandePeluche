
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const igImage = require('../infraback/igImage.js');
const WebSocket = require('ws');

const clients = new Map();

// reponse au ping/pong avec la version client
let clientPong = null

// admin force la version client depuis le filesystem (utilisé par les scripts de commit client)
exports.forceClientVersion = () => {
	const v = collections.loadSimpleObject("clientVersion").version
	const o = {op: "pong", clientVersion: v }
	clientPong=JSON.stringify(o)
	return v;
}

function targetClient(pseudo,o) {
	let jsonMsg = JSON.stringify(o);
	console.log("targetClient:" ,pseudo, o.op);
	clients.forEach((meta,ws) => {
		if (meta.pseudo == pseudo) 
			ws.send(jsonMsg);
	});
}

function broadcastClient(o) {
	const start = performance.now()
	const jsonMsg = JSON.stringify(o);
	const mid = performance.now()
	clients.forEach((meta,ws) => {
		ws.send(jsonMsg);
	});
	const now = performance.now()
	// Annulation des mesures pour performances tr de metropolis
	console.log("broadcastClient(op,nbCli,jsonLength,jsonMs,totalMs):" , o.op, clients.size, jsonMsg.length, mid-start, now-start)
}

function broadcastPing() {
  clients.forEach((meta,ws) => {
		if (ws.estVivant) {
			ws.estVivant = false;
   		// console.log("ping:", meta);
   		ws.ping();
  	}
  	else {
			console.log('Authoritative disconnect, no ping/pong', meta);
			ws.close();
  	}
  });
}

setInterval(broadcastPing, 10000);

function broadcastPseudoList () {
  let pseudoList = [];
  clients.forEach( (meta,ws) => {
	 	pseudoList.push(meta.pseudo);
	});
	broadcastClient({op : "pseudoList", pseudoList : pseudoList , dth: Date.now()});
}

exports.sendToPseudo = (pseudo,o) => {
	targetClient(pseudo,o)
}

exports.sendToPseudoSimpleText = (pseudo, texte) => {
	targetClient(pseudo,{ op: "notif", texte: texte, dth: Date.now() } )
}

exports.isConnected = (pseudo) => {
  clients.forEach((meta,ws) => {
    if (meta.pseudo==pseudo) return true;
  });
  return false;
}

exports.broadcastNotification = (texte, fromPseudo, mp3, toPseudo, toTexte, admin ) => {
	broadcastClient({
		op : "notif",
		texte : texte,
		fromPseudo: fromPseudo,
		mp3: mp3,
		toPseudo: toPseudo,
		toTexte: toTexte,
		admin: admin,
		dth: Date.now()
	});
}


exports.broadcastCollection = (col) => {
	broadcastClient({
		op : "collection",
		name : col.name,
		versionDth : col.versionDth || 0,
		dth: Date.now()
	});
}

exports.broadcastRaw = (o) => {
	o.dth = Date.now();
	broadcastClient(o);
}

exports.broadcastSimpleText = (texte, ding, couleur, duree) => {
	broadcastClient({
		op : "notif",
		mp3: (typeof ding === "string")? ding : (ding)? "Ding" : null,
		texte : texte,
		dth: Date.now(),
		couleur: couleur,
		duree: duree
	});
}

exports.broadcastSimpleOp = (op, o) => {
	broadcastClient( { op: op, o: o, status:200, dth: Date.now() } );
}

exports.targetSimpleOp= (pseudo,op,o) => {
	targetClient( pseudo, { op: op , o: o, status:200, dth: Date.now() } );
}

// execution d'une video v apres un delai en seconde d par les connectes
exports.broadcastVideo = (v,d) => {
	exports.broadcastSimpleOp('wsMedia',{ type:'mp4', mp4:v, delai:d })
}

exports.getMetadata = (pseudo) => {
	let ret=null
  clients.forEach((meta,ws) => {
		if (meta.pseudo==pseudo) ret=meta
	})
	return ret
}

exports.start = (wsCallback, port) => {
  const wss = new WebSocket.Server({ port: port });

  wss.on('connection', (ws,req) => {
    let metadata = { id: gbl.uuidv4() , ip: req.headers['x-forwarded-for'].split(',')[0].trim() };

    console.log('Connexion:',metadata);

    clients.set(ws, metadata);

    ws.on('ping', (m) => {
	    ws.estVivant=true;
	    ws.pong();
	    // console.log('ping recu:', metadata, m);
    });
    ws.on('pong', (m) => {
	    ws.estVivant=true;
	    // console.log('pong recu :', metadata, m);
    });
    ws.on('message', async (m) => {
			try {
				let p = m.toString();
				let jMsg = JSON.parse(p);
				let start = performance.now()
				switch (jMsg.op) {
					case "ig": // image ingame depuis le kikibidge
						if (metadata.ip != gbl.ipAdmin) gbl.exception("not bot",400)
						await igImage.jsonEvent(jMsg)
						break;
					case "ping":
	    			ws.estVivant=true;
						ws.send(clientPong);
						break;
					case "iam":
						let pseudoDesc = await pseudos.asyncSetPwdSession(jMsg.pseudo,jMsg.newPwd,jMsg.signature,jMsg.publicKey,metadata)
						if (pseudoDesc) {
							metadata.pseudo = jMsg.pseudo;
							ws.send(JSON.stringify( { op: "elipticKeyOk", pseudoDesc: pseudoDesc } ));
							// fermeture des autres connexions du pseudo
  						clients.forEach( (metaScan,wsScan) => {
								if (metaScan.pseudo == jMsg.pseudo && wsScan != ws)  {
									wsScan.send(JSON.stringify({op : "erreur", texte: "Une autre connexion est activée, fermeture de cette connexion"}));
									wsScan.close();
								}
							});
							exports.broadcastNotification(jMsg.pseudo+ " s'est connecté");
							broadcastPseudoList();
						}
						else {
							ws.send(JSON.stringify( { op: "erreur", texte:"Pas de clef elliptique, contacte Kikiadoc" } ));
							ws.close();
						}
						break;
					case "iamBot":
						if (metadata.ip != gbl.ipAdmin) gbl.exception("not admin",400)
						metadata.pseudo = "(kikiBridge)"
						exports.broadcastNotification(metadata.pseudo+ " s'est connecté");
						broadcastPseudoList();
						break;
					default:
						wsCallback(metadata.pseudo,jMsg);
				}
				console.log("WSmessage:",metadata.pseudo,jMsg.op,performance.now()-start);
			}
			catch(ev) {
				console.log("WS INBOUND msg:", m.toString(), "exception:" , ev);
				ws.send(JSON.stringify({op : "erreur", code: ev.code, msg: ev.msg, o: ev.o, name : ev.name }));
				ws.close();
			}
    });

    ws.on("close", (e) => {
			try {
 				console.log("WS Close:",metadata, "reason:", e);
				pseudos.invalidatePwd(metadata.pseudo)
				clients.delete(ws);
				broadcastPseudoList();
				exports.broadcastNotification(metadata.pseudo+ " s'est déconnecté");
				switch(e) {
					case 1000:
					case 1001: // deconnexion "normale"
					case 1005: // deconnexion par fermeture WS pour inactivité browser
					case 1006: // pas de ping/pong ou mode veille
					default:
				}
			}
			catch(ev) {
				console.log("WS CLOSE invalide:", ev);
			}
    });

    ws.estVivant=true;
    ws.ping();

  }); 

  console.log("Websocket server started:",port);

};


exports.forceClientVersion()
console.log('wsserver loaded');
