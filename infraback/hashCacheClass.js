
const fs = require('fs');
const crypto = require('crypto');

const gbl = require('../infraback/gbl.js');

// hashCache simple, a upgarder avec un B-tree et une map
class hashCache {

	// Fields
	nom = null;
	cache = {} // AUPGRADER !!

	// Constructor...
	constructor (nom) {
		console.log("hashCache creation:",nom);
		this.nom= nom;
		this.load();
	}

	load() {
		try {
			const raw = fs.readFileSync(gbl.staticFsPath+this.nom+".cache");
			console.log("Cache init from file:",this.nom);
			this.cache = JSON.parse(raw);
		}
		catch(e) {
			console.log("Cache init from scratch:",this.nom);
			this.cache= {};
		}
	}
	save() {
		fs.writeFileSync(gbl.staticFsPath+this.nom+".cache",JSON.stringify(this.cache));
		console.log("cache saved fs:",this.nom);
	}
	get(key) {
		// si ce n'est pas un hash, calcule le hash
		return cache[(key.startsWith("MD5-"))? key : getKey(key)];
	}
	put(key,val) {
		cache[(key.startsWith("MD5-"))? key : getKey(key)] = val ;
	}
	del(key,val) {
		delete cache[(key.startsWith("MD5-"))? key : getKey(key)] ;
	}
	getKey(texte) {
		return "MD5-"+crypto.createHash('md5').update(texte).digest('hex');
	}
	lock(key) {
	}

}

module.exports = hashCache;
console.log("hashCache loaded");
