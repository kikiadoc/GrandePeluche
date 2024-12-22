const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const pseudos = require('../infraback/pseudos.js');
const jetons = require('../infraback/jetons.js');
const wsserver = require('../infraback/wsserver.js');


class votation {
	// Fields
	colCtx  = {};

	constructor(parDefaut) {
		// initialise la collection backend si besoin ou recupère l'existante
		this.colCtx = collections.init(parDefaut);
	}

	choix(pseudo,idx,val) {
		if (this.colCtx.votesOuverts ) {
			// verif param
			if ( !Number.isInteger(idx) || !Number.isInteger(val) ) gbl.exception("int req as args", 400);
			if ( idx < 0 || idx >= this.colCtx.options.length) gbl.exception("bad index/options", 400);
			if ( val < 0 || val >= this.colCtx.choix.length) gbl.exception("bad index/choix", 400);
			//  si aucun vote du pseudo init du tablea de réponses
			let votes = this.colCtx.pseudos[pseudo];
			if (votes==null || votes==undefined) this.colCtx.pseudos[pseudo] = new Array(this.colCtx.options.length);
			// indique le vote
			this.colCtx.pseudos[pseudo] [idx] = val;
			// sauvegarde le vote
			collections.save(this.colCtx);
			// Si jeton automatique et que toutes les options ont été choisies...
			if ( this.colCtx.dynJeton && (! this.colCtx.pseudos[pseudo].includes(undefined)) ) {
				// si pas encore de jeton attribué...
				if (this.colCtx.jetons[pseudo] == undefined) {
					this.colCtx.jetons[pseudo] = true;
					jetons.inc(pseudo,1);
					wsserver.broadcastNotification(
						pseudo+" a gagné un jeton de Camelot",null,null,pseudo,
						"Tu as gagné un jeton de Camelot en répondant à toutes les options de cette votation!"
					);
				}
			}
		}
		this.get();
	}

	get() {
		gbl.exception(this.colCtx,200);
	}

	httpCallback (req, res, method, reqPaths, body, pseudo, pwd) {
		// le reqpaths[1] doit etre le nom de la collection backend
		if (reqPaths[1] != this.colCtx.name) gbl.exception("backend collection mismatch",500);
		switch (method) {
			case "OPTIONS": 
				pseudos.check(pseudo,pwd);
				res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
				gbl.exception("Coors OK",200);
			case "GET": 
				switch(reqPaths[2]) {
					case "startVotes":
						this.colCtx.votesOuverts = true;
						collections.save(this.colCtx);
						wsserver.broadcastNotification("La votation pour "+this.colCtx.texte+" est ouverte");
						gbl.exception("Votes autorisés",200);
					case "stopVotes":
						this.colCtx.votesOuverts = false;
						collections.save(this.colCtx);
						wsserver.broadcastNotification("La votation pour "+this.colCtx.texte+" est terminée");
						gbl.exception("Votes interdits",200);
					case "addOption":
						this.colCtx.options.push({ lbl: reqPaths[3] });
						gbl.exception("Option ajoutée",200);
					default:
						pseudos.check(pseudo,pwd);
						this.get();
				}
			case "PUT": 
				pseudos.check(pseudo,pwd);
				this.choix(pseudo,parseInt(reqPaths[2],10),parseInt(reqPaths[3],10));
				gbl.exception("Vote enregistré",200);
			case "DELETE": 
				pseudos.check(pseudo,pwd,true);
				delete this.colCtx.pseudos[reqPaths[2]]; 
				delete this.colCtx.jetons[reqPaths[2]]; 
				collections.save(this.colCtx);
				gbl.exception("reset participation ok: "+reqPaths[2],200);
		}
	}

}

module.exports = votation;
console.log("votation loaded");

