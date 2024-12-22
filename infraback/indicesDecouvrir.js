const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');

class indicesDecouvrir {

	// tableau des indices a trouver
	indices = [];
	// collection associée
	colCtx = {};
	// cache de resultat
	getCache = null;

	// Constructor... liste des indices et nom de la collection de persistance des résultats
	constructor (indices,colName) {
		this.indices= indices;
		this.colCtx = collections.get(colName,true);
		// init structure si besoin
		// tableau des découvertes indexé par le tableau d'indices
		this.colCtx.trouves ||= [];
	}

	adminReset() {
		this.colCtx.trouves = [];
		this.getCache = null;
		collections.save(this.colCtx);
		return this.get();
	}
	adminSetAll(pseudo) {
		for (let i=0; i<this.indices.length; i++) {
			this.discoverByIdx(pseudo,i);
		}
		return this.get();
	}
	adminSetPartiel(pseudo) {
		this.adminReset();
		for (let i=1; i<this.indices.length; i++) {
			this.discoverByIdx(pseudo,i);
		}
		return this.get();
	}
	
	// retourne un objet { nbTrouves, trouves[{idx,pseudo,dth}] }
	get() {
		if (this.getCache) return this.getCache;
		let ret= [];
		let nbTrouves = 0;
		for (let i=0; i<this.indices.length; i++) {
			if (this.colCtx.trouves[i]) {
				ret[i] = this.colCtx.trouves[i];
				nbTrouves++;
			}
			else {
				ret[i] = false;
			}
		}
		this.getCache= { nbTrouves: nbTrouves, trouves: ret};
		return this.getCache;
	}

	// retourne un tableau des index non découverts
	getNotDiscovered() {
		let ret = []
		for (let i=0; i<this.indices.length; i++) {
			if (! this.colCtx.trouves[i] ) ret.push(i)
		}
		return ret
	}

	// indique découverte de l'indice I par le pseudo
	// return i si maj ou false si il y avait déjà un découvreur
	// exception si i invalide
	discoverByIdx(pseudo,i) {
		this.getCache = null;
		if (i<0 || i>= this.indices.length) gbl.exception("index invalide pour discoverByIdx",400);
		if (this.colCtx.trouves[i]) return false;
		this.colCtx.trouves[i] = {idx:i, pseudo: pseudo, indice: this.indices[i] , dth: Date.now()}
		collections.save(this.colCtx);
		return i;
	}

	// indique découverte au hasard
	// return false si impossible de trouver, l'index sinon
	discoverByRandom(pseudo) {
		const possibles = this.getNotDiscovered();
		if (possibles.length == 0) return false;
		const i = possibles[Math.floor(Math.random()*possibles.length)]; 
		return this.discoverByIdx(pseudo,i)
	}
}

module.exports = indicesDecouvrir;
console.log("indicesDecouvrir loaded");
