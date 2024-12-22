
const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const discord = require('../infraback/discord.js');

const USINESGAZCOLNAME="usinesGaz"
const UNLOCKDELAI = 5*60000 // 5*60000 // temps avant un nouvel unlock
const TROUVEDELAI = 4*60*60000 // temp avant un nouveau trouvé après un trouve
const OUVERTDELAI = 18*60*60000 // 18*60*60000 // temp d'ouverture d'un Avaloir
const DISTANCE = 0.4 // tolerance de distance

const soluces = [
	/*  0 */ {x:3.3,	y:19.5}, // ok station neuf
	/*  1 */ {x:16.3,	y:17.5}, // ok noscea centrale
	/*  2 */ {x:18.3, y:19.3}, // ok noscea centrale
	/*  3 */ {x:32.6, y:16.2}, // l'écume des cieux de dravania 
	/*  4 */ {x:19.3, y:39.3}, // les pics 
	/*  5 */ {x:19.7, y:22.9}, // ok noscea occidentale
	/*  6 */ {x:22.4, y:26.3}, // ok foret du sud
	/*  7 */ {x:23.9, y:23.7}, // ok foret du nord
	/*  8 */ {x:18.3, y:13.4}, // ok thanalan méridonnal
	/*  9 */ {x:31.5, y:7.5},  // L'hoirie recouvrée
	/* 10 */ {x:37.6, y:27.2}, // hautes terres du coerthas occidental
	/* 11 */ {x:29.7, y:23.5}, // hautes terres du coerthas occidental
	/* 12 */ {x:20.3, y:8.7},  // mor dhona
	/* 13 */ {x:8.6,  y:17.3}, // l'écume des cieux d'abalathia
	/* 14 */ {x:23.8, y:31.2}, // l'écume des cieux d'abalathia
	/* 15 */ {x:5.1,  y:9.2},  // Azys Lla
	/* 16 */ {x:13.4, y:9.6},  // Garlemald
	/* 17 */ {x:35.0, y:7.3},	 // les lacs
	/* 18 */ {x:29.5, y:30.6}, // Yak t'el
	/* 19 */ {x:29.7, y:26.1}, // les marges
	/* 20 */ {x:34.7, y:12.7}, // Avantpays dravanien
	/* 21 */ {x:33.5, y:28.2}, // les steppes d'azim
	/* 22 */ {x:12.2, y:25.0}, // foret de l'est
	/* 23 */ {x:18.8, y:35.2}, // ok basse-noscea
	/* 24 */ {x:22.2, y:20.3}, // Thanalan central
	/* 25 */ {x:11.8, y:31.6}, // les marges
	/* 26 */ {x:27.0, y:37.6}, // Elpis
	/* 27 */ {x:29.9, y:24.8}, // Thanalan occidental
	/* 28 */ {x:20.0, y:26.2}, // l'écume des cieux de dravania
	/* 29 */ {x:31.5, y:32.2}, // Urqopacha
	/* 30 */ {x:10.1, y:35.9}, // arrière-pays dravanien
	/* 31 */ {x:26.8, y:23.1}, // les lacs
	/* 32 */ {x:24.6, y:36.4}, // La tempete
	/* 33 */ {x:19.4, y:4.6},  // Il Mheg
	/* 34 */ {x:32.1, y:28.0}, // ok noscea occidentale
	/* 35 */ {x:17.9, y:36.4}, // Kholusia
	/* 36 */ {x:6.5, y:9.5},   // mer de rubis
	/* 37 */ {x:8.8, y:37.8},  // thavnair 
	/* 38 */ {x:33.2, y:22.6}, // arrière-pays dravanien
	/* 39 */ {x:19.8, y:21.3} // les pics
]

let etat = normalize(collections.get(USINESGAZCOLNAME,true))


function normalize(etat) {
	// etat.lieux[] = { status, unlockPseudo, unlockDth, findPseudo, findDth}
	etat.lieux ??= new Array(40)
	for (let i=0; i < 40; i++) etat.lieux[i] ??= new Object({status:"lock", i:i})
	etat.UNLOCKDELAI = UNLOCKDELAI
	etat.TROUVEDELAI = TROUVEDELAI
	etat.OUVERTDELAI = OUVERTDELAI // delai d'ouverture apres le unlockDth
	return etat
}

function syncClients() {
	wsserver.broadcastSimpleOp(USINESGAZCOLNAME,etat)
	collections.save(etat)
}

function getNbTrouve() {
	return etat.lieux.reduce((a,e)=>e.status=="trouve"? a+1: a,0)
}

// updateStatus: modifie le status d'un elemen
// nécessaire car les clients peuvent entreprendre des actions en calculant les timers par eux mêmes
// alors que le serveur n'a pas mis à jour encore
function updateStatus(i) {
	switch (etat.lieux[i].status) {
		case "unlock":
			// si "unlock" mais timer echu, on repasse en "lock"
			if (etat.lieux[i].unlockDth+OUVERTDELAI <= Date.now()) etat.lieux[i].status="lock"
			break
		case "trouve":
		case "lock":
			// on ne fait rien
	}
}

// 200: OK 201: mauvaise distance
function doTrouve(reqPaths,pseudo) {
	const i= gbl.checkInt(reqPaths[3],0,39)
	const x= gbl.checkFloat(reqPaths[4],0.0,99.9)
	const y= gbl.checkFloat(reqPaths[5],0.0,99.9)
	const lieu=etat.lieux[i]
	// normalize le status
	updateStatus(i)
	if (lieu.status!="unlock") gbl.exception('avaloir pas unlock, client unsynch?',400)
	// vérif du timer
	if (Date.now() > lieu.unlockDth+OUVERTDELAI) gbl.exception('ouvertDelai... client unsyinch',400)
	// verif des coordonnées
	if ( !gbl.isDistance(x,y,soluces[i].x,soluces[i].y,DISTANCE)) gbl.exception("via ws",201)
	// coodonnées OK
	lieu.status="trouve"
	lieu.trouvePseudo=pseudo
	lieu.trouveDth=Date.now()
	syncClients()
	// msg discord...
	const nbTrouve = getNbTrouve()
	const termine = nbTrouve==etat.lieux.length
	discord.postMessage("hegemonie", 
			"**Challenge des Avaloirs**\n\n"+ pseudo + " a découvert l'extrémité de l'avaloir #"+ (i+1) + " de la station Alpha \n\n" +
			( (termine)? ("**C'était le dernier, le challenge est terminé**"+ "\n<"+gbl.cdnUrl+"ff-7/ff-7-stationalpha-final.mp4>")
				   			 : ("Il en reste "+(etat.lieux.length-nbTrouve)+" à découvrir.") )
		, true)
	gbl.exception( {termine: termine, nbTrouve: nbTrouve} ,200)
}

exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd)
	switch (method) {
		case "OPTIONS":
			res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE')
			gbl.exception("AllowedCORS",200)
		case "GET":
			gbl.exception(etat,200)
		case "POST":
			switch(reqPaths[2]) {
				case "unlock":
					let i= gbl.checkInt(reqPaths[3],0,39)
					updateStatus(i)
					if (etat.lieux[i].status!="lock") gbl.exception('Pas lock, client unsynch?',400)
					etat.lieux[i].status="unlock"
					etat.lieux[i].unlockPseudo=pseudo
					etat.lieux[i].unlockDth=Date.now()
					syncClients()
					gbl.exception("via ws",200)
				case "trouve":
					doTrouve(reqPaths,pseudo)
			}
			gbl.exception("bad POST",400)
		case "PUT":
			switch(reqPaths[2]) {
				case "admTrouveAll":
					// tous les lieux sauf le dernier
					for (let i=0;i<39;i++) {
							const lieu = etat.lieux[i]
							if (lieu.status!="trouve") {
								lieu.status="trouve"
								lieu.unlockPseudo??=pseudo
								lieu.unlockDth??=Date.now()
								lieu.trouveDth=Date.now()
								lieu.trouvePseudo=pseudo
							}
					}
					syncClients()
					gbl.exception("via ws",200)
			}
			gbl.exception("bad POST",400)
		case "DELETE":
			pseudos.check(pseudo,pwd,true); // admin
			switch(reqPaths[2]) {
				case "admResetChallenge":
					etat.lieux = null
					normalize(etat)
					syncClients()
					gbl.exception(etat,200)
				case "admResetTimers":
					let userId = reqPaths[3] || pseudo	
					for (let i=0; i<40; i++) {
						if (etat.lieux[i].trouvePseudo==userId) { etat.lieux[i].trouveDth=0 }
						if (etat.lieux[i].unlockPseudo==userId) { etat.lieux[i].unlockDth=0 }
					}
					syncClients()
					gbl.exception(etat,200)
			}
			gbl.exception("bad DELETE",400)
	}
	gbl.exception("bad meth usinesGaz",400)
}

console.log("usinesGaz loaded");

