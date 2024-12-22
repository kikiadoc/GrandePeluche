
const { Worker } = require('worker_threads');

const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');

const tictactoe = require('../infraback/tictactoe_worker.js');
const worker = new Worker('../infraback/tictactoe_worker.js');

let seqId = 0;
let queries = new Map()

// 10 heures quand gagné ou exaspéré
const relaxMs = 3600*10 * 1000

// Ensemble des jeux
let tictactoes = {};

// normalize un jeu
function normalize(jeu) {
	jeu.board ||= Array(tictactoe.bSize*tictactoe.bSize).fill(null)
	jeu.nbPat ||= 0;
	jeu.nbWin ||= 0;
	jeu.nbNull ||= 0;
	jeu.nbLoose ||= 0;
	jeu.dthLock ||= 0;
	return jeu;
}
// Recupère un jeu 
function getTictactoe(pseudo) {
	if (tictactoes[pseudo]) return normalize(tictactoes[pseudo]);
	let jeu = normalize(collections.get("tictactoe_"+pseudo, { }));
	tictactoes[pseudo] = jeu;
	return jeu;
}

// reset le jeu du pseudo, exception si op en cours inc pat/win/loose si besoin
// resetPat indique qu'il faut aussi activer le timer et reset le compteur de pat
// resetDth indique que le timer doit etre reinitialisé
function resetTictactoe(pseudo, resetPat, resetDth) {
	let jeu = getTictactoe(pseudo);
	checkNoRequest(pseudo);

	if (tictactoe.isWinner(jeu.board, tictactoe.human)) jeu.nbWin++;
	else if (tictactoe.isWinner(jeu.board, tictactoe.omputer)) jeu.nbLoose++;
	else if (!tictactoe.canPlay(jeu.board)) { jeu.nbPat++; jeu.nbNull++; }

	jeu.board = Array(tictactoe.bSize*tictactoe.bSize).fill(null);
	if (resetPat) { jeu.nbPat=0; jeu.dthLock=Date.now(); }
	if (resetDth) { jeu.dthLock=0; }
	collections.save(jeu);
	return jeu;
}

// etat courant du jeu de pseudo
function getStatus(pseudo) {
	let jeu = getTictactoe(pseudo)
	return {	humanWin:			tictactoe.isWinner(jeu.board, tictactoe.human),
						computerWin:	tictactoe.isWinner(jeu.board, tictactoe.computer),
						canPlay:			tictactoe.canPlay(jeu.board),
						bSize:				tictactoe.bSize,
						board:				jeu.board,
						nbPat:				jeu.nbPat,
						nbWin:				jeu.nbWin,
						nbNull:				jeu.nbNull,
						nbLoose:			jeu.nbLoose,
						dthLock:			jeu.dthLock,
						relaxMs:			relaxMs
	}
}

// verifie qu'il n'y a pas de requete en cours sur le worker
// thow eception 409 si requete en cours
function checkNoRequest(pseudo) {
	if (queries.has(pseudo)) gbl.exception("Op en cours, patience "+pseudo, 409);
}

// envoie une requete au worker pour le pseudo, en vérifiant que pas de requete en cours
function requete(pseudo, op, i) {
	checkNoRequest(pseudo);
	seqId++;
	let req = { id: seqId, op: op, pseudo: pseudo, idx: i, board: getTictactoe(pseudo).board }
	queries.set(pseudo,req);
	worker.postMessage(JSON.stringify(req));
  console.log("req/worker:", req);
}

// gestion des réponses du worker
function mainThread() {
	// receive worker responses
  worker.on('message', (message) => {
		let ret = JSON.parse(message);
		// il n'y a plus de requete pour le pseudo
		queries.delete(ret.pseudo);

		console.log("ret/Worker:", ret);

		// Si erreur worker...
		if (ret.status != 200) {
			// erreur de worker...
			console.log("!!!!!!!!!!!!!!!!!!!! worker error:",ret);
		}
		else
		// met a jour le board si besoin.
		if (ret.board) {
			let jeu = getTictactoe(ret.pseudo)
			jeu.board = ret.board;
			collections.save(jeu);
			// requete refresh client
			wsserver.sendToPseudo(ret.pseudo,{op:"tictactoe"});
		}
  });
}
// demarre la gestion des réponses du worker
mainThread();


// test si jeu est gagnant pour le joueur humain ou que nombre de PAT >= limite
exports.isHumanWinnerOrPat = (pseudo,nbPat) => {
	let jeu = getTictactoe(pseudo)
  if (jeu.nbPat >= nbPat) return true;
	if (tictactoe.isWinner(jeu.board, tictactoe.human)) return true;
	return false;
}

// reset le tictactoe du pseudo
exports.reset = (pseudo,resetPat,resetDth) => {
	resetTictactoe(pseudo,resetPat,resetDth);
}

//retourn le status du jeu du joeur
exports.getStatus = getStatus

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	// auth
	pseudos.check(pseudo,pwd);
	
	switch (method) {
		case "OPTIONS":
			res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET":
			gbl.exception(getStatus(pseudo),200)
		case "PUT":
			switch(reqPaths[2]) {
				case "admInit":
					pseudos.check(pseudo,pwd,true);
					resetTictactoe(pseudo,true,true);
					gbl.exception(getStatus(pseudo),200);
				default:
					// Si le timer de jeu n'est pas échu, impossible de jouer
					let jeu = getTictactoe(pseudo)
					if (jeu.dthLock >= Date.now() + relaxMs)
						gbl.exception("dthLock sur tictactoe, client unsync",409);
					requete(pseudo,"JOUER",parseInt(reqPaths[2],10));
					gbl.exception("En cours",200);
			}
		case "DELETE":
			resetTictactoe(pseudo)
			gbl.exception(getStatus(pseudo),200)
	}
	gbl.exception("inv http op tictactoe",400);
}


console.log("tictactoe loaded");
