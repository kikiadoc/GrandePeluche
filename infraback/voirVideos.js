
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');

const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');

// init de la collection en back-end
let ctx = collections.get("voirVideos", true);

// recupere le status des videos du pseudo (creation si besoin)
function getVideosStatus(pseudo) {
	ctx.pseudos ||= {};
	ctx.maxVideosVues  ||= 0;
	ctx.jeuOuvert  ||= 0;
	ctx.pseudos[pseudo] ||= { videos: {} };
	return ctx.pseudos[pseudo];
}

// uniquement pour fonction d'admin
function recalcMaxVues() {
	let mexVideosVues = 0;
	for (const pseudo in ctx.pseudos) {
		const l = Object.keys(ctx.pseudos[pseudo].videos).length;
		if (l>maxVideosVues) maxVideosVues = l;
	}
	ctx.maxVideosVues = maxVideosVues;
	collection.save(ctx);
}
// recupere le status video du pseudo + les elements de synthèse
function get(pseudo) {
	// recupere l'etat avant construction de l'objet résultat pour ini global si besoin
	const etat = getVideosStatus(pseudo);
	return { jeuOuvert: ctx.jeuOuvert, maxVideosVues: ctx.maxVideosVues, pseudo: pseudo, videos: etat.videos };
}

// recupere la synthèse
function getSynthese() {
	return ctx;
}

exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	if (method=="OPTIONS") {
		res.setHeader('Access-Control-Allow-Methods', 'PUT');
		gbl.exception("AllowedCORS",200);
	}
	if (method=="GET") {
		switch ( reqPaths[2] ) {
			case "me":
				pseudos.check(pseudo,pwd);
				gbl.exception(get(pseudo),200);
			case "classement":
				pseudos.check(pseudo,pwd);
				gbl.exception(getSynthese(),200);
		}
	}
	if (method=="PUT") {
		switch ( reqPaths[2] ) {
			case "me":
				pseudos.check(pseudo,pwd);
				if (ctx.jeuOuvert == false) gbl.exception("gameOver, client unsync",409)
				let sVideo = getVideosStatus(pseudo);
				// ajoute la video
				sVideo.videos[reqPaths[3]]={dth: Date.now()};
				// verif du max video
				const	l = Object.keys(sVideo.videos).length; 
				if (l > ctx.maxVideosVues) ctx.maxVideosVues = l
				collections.save(ctx);
				wsserver.broadcastNotification( "J'ai vu une vidéo",pseudo );
				wsserver.broadcastSimpleOp("voirVideos");
				gbl.exception("ok",200);
			case "admStart":
				pseudos.check(pseudo,pwd,true);
				ctx.jeuOuvert = true;
				collections.save(ctx);
				wsserver.broadcastSimpleOp("voirVideos");
				gbl.exception("admStart OK",200);
			case "admStop":
				pseudos.check(pseudo,pwd,true);
				ctx.jeuOuvert = false;
				collections.save(ctx);
				wsserver.broadcastSimpleOp("voirVideos");
				gbl.exception("admStop OK",200);
			case "admRecalc":
				pseudos.check(pseudo,pwd,true);
				recalcMaxVues();
				collections.save(ctx);
				wsserver.broadcastSimpleOp("voirVideos");
				gbl.exception("admReinit OK",200);
			case "admReinit":
				pseudos.check(pseudo,pwd,true);
				ctx.pseudos = {};
				ctx.maxVideosVues=0;
				ctx.jeuOuvert = false;
				collections.save(ctx);
				wsserver.broadcastSimpleOp("voirVideos");
				gbl.exception("admReinit OK",200);
		}
	}
	gbl.exception("inv op voirVideos",400);
}

console.log("jetons loaded");
