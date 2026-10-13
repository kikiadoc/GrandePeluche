const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');




class phrasesDiscoveringEngine {

	// Fields
	phrases = [];
	phrasesUpper = [];
	templates = [];
	colCtx = {};

	// Constructor...
	constructor (phrasesInit,colName) {
		this.phrases= phrasesInit;
		this.colCtx =  collections.get(colName,true);
		this.init();
	}

	init() {
		// init structure si besoin
		if (this.colCtx.idx == null) this.colCtx.idx = -1;
		if (this.colCtx.lettresTrouveesHistory == null) this.colCtx.lettresTrouveesHistory = [];
		if (this.colCtx.lettresTrouvees == null) this.colCtx.lettresTrouvees = [];
		for (let i=0; i < this.phrases.length; i++) {
			this.phrasesUpper[i] = this.phrases[i].toUpperCase();
			if (this.colCtx.lettresTrouveesHistory[i] == undefined) this.colCtx.lettresTrouveesHistory[i] = [];
			if (this.colCtx.lettresTrouvees[i] == undefined) this.colCtx.lettresTrouvees[i] = "";
			// calcul du template initial et de l'index de découverte
			if (this.reBuildTemplate(i)) this.colCtx.idx = i+1;
		}
	}

	// remplace le template avec underscore de la phrase selon la string trouvé
	// et return true si le templat est totalement découvert
	reBuildTemplate(idx) {
		let phrase = this.phrases[idx];
		let trouve = this.colCtx.lettresTrouvees[idx];
		let upper = phrase.toUpperCase();
		let template = []
		let ret=true;
		for (let i=0; i<phrase.length; i++) {
			let c = upper[i];
			if ( trouve.indexOf(c) >= 0 ) {
				// ... deja trouvé copie
				template.push(phrase[i]);
			}
			else if (c>='A' && c<= 'Z') {
				// non trouve et alpha... underscore
				template.push('﹇');
				ret=false;
			}
			else {
				// autre caractère ... copie
				template.push(phrase[i]);
			}
		}
		this.templates[idx]=template.join('');
		// console.log("phrase=",phrase,"idx=",idx,"template=",this.templates[idx]);
		return ret;
	}



	checkLettre(pseudo,l) {
		let startDth=Date.now();
		let i = this.colCtx.idx;
		if (i < 0) gbl.exception("Le challenge n'a pas commencé",202);
		if (i >= this.phrases.length) gbl.exception("Le challenge est terminé",202);

		// Si deja proposée...
		if ( this.colCtx.lettresTrouvees[i].indexOf(l) >= 0) {
			this.colCtx.lettresTrouveesHistory[i].push({ pseudo: pseudo, lettre: l, dth: Date.now(), ok: "déjà trouvée"});
			gbl.exception(l+" est déjà trouvée",202);
		}
		// test si présence dans la phrase
		if ( this.phrasesUpper[i].indexOf(l) >= 0) {
			// la lettre est présente et n'a pas été enore découverte
			this.colCtx.lettresTrouvees[i] = this.colCtx.lettresTrouvees[i].concat(l);
			this.colCtx.lettresTrouveesHistory[i].push({ pseudo: pseudo, lettre: l, dth: Date.now(), ok: "validée"});
			let completed = this.reBuildTemplate(i);
			if ( completed ) {
				this.colCtx.idx = i+1;
				collections.save(this.colCtx);
				if (this.colCtx.idx >= this.phrases.length) {
					this.synch("Le Challenge est terminé","Wonderful");
				
				}
				else
					this.synch("Phrase suivante...","phrase-suivante" );
			}		
			else
				this.synch("Lettre "+l+" trouvée par " +pseudo);
			gbl.exception(l+" validée",200,startDth);
		}	
		else {
			this.colCtx.lettresTrouveesHistory[i].push({ pseudo: pseudo, lettre: l, dth: Date.now(), ok: "introuvable"});
			gbl.exception(l+' est introuvable',202,startDth);
		}
	}


	// Broadcast
	synch(m,mp3) {
		wsserver.broadcastRaw({
			op: this.colCtx.name+"Synch",
			idx: this.colCtx.idx,
			template: this.templates[this.colCtx.idx],
			gpMsg: m,
			mp3: mp3
		});
	}

	resynch() {
		let ret = {
			phrases: this.phrases,
			idx: this.colCtx.idx,
			template: this.templates[this.colCtx.idx],
			gpMsg: "Toi et moi sommes synchonisés en temps réel"
		};
		gbl.exception(ret,200);
	}

	resultats() {
		console.log("faire un cache de la reponse pour resultats");
		let byPhrase = [];
		let byPseudoSet = {};
		let gblLettres = 0;
		// balayage des toutes les touches enregistrées
		for (let i=0; i < this.phrases.length; i++) {
			byPhrase[i] = [];
			this.colCtx.lettresTrouveesHistory[i].forEach((history) => {
				gblLettres ++;
				byPhrase[i].push( {
				 	lettre: history.lettre,
				 	pseudo: history.pseudo,
				 	dth: history.dth,
				 	ok: history.ok,
				 	dthEditee: gbl.hhmmssms(history.dth)
				});
				if (!byPseudoSet[history.pseudo]) byPseudoSet[history.pseudo] = 0;
				byPseudoSet[history.pseudo] ++;
			});
		}	
		let byPseudo=[];
		Object.keys(byPseudoSet).forEach (  pseudo => { byPseudo.push( {pseudo: pseudo, nb: byPseudoSet[pseudo]}  ) } );
	
		gbl.exception({ phrases: this.phrases, gblLettres: gblLettres, byPhrase: byPhrase, byPseudo: byPseudo  }, 200);
	}

	// Reqpath[1] doit être le nom de la collection backend
	httpCallback(req, res, method, reqPaths, body, pseudo, pwd) {
		if (reqPaths[1] != this.colCtx.name) gbl.exception("Collection backend mismath",500);
		switch (reqPaths[2]) {
			case "lettre":
				pseudos.check(pseudo,pwd);
				this.checkLettre(pseudo,reqPaths[3]);
			case "resynch":
				pseudos.check(pseudo,pwd);
				this.resynch();
			case "resultats":
				pseudos.check(pseudo,pwd);
				this.resultats();
			case "adminStart":
				pseudos.check(pseudo,pwd,true);
				this.colCtx.idx = 0;
				this.synch("C'EST PARTI!!", "call-to-attention");
				gbl.exception("Ok",200);
			case "adminReinit":
				pseudos.check(pseudo,pwd,true);
				this.colCtx = { name: this.colCtx.name };
				this.init();
				this.synch("Admin reinit");
				collections.save(this.colCtx);
				gbl.exception("Ok",200);
			default:
				gbl.exception("bad op ucyyhronieIntro",404);
		}
	}
}

module.exports = phrasesDiscoveringEngine;
console.log("phrasesDiscoeringEngine loaded");
