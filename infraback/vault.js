
const gbl = require('../infraback/gbl.js');
const fs = require('fs');


//////////////////////////////////////////////////////////////////////////////////////////////
// VAULT
// a upgrader pour un stockage sécurisé
//////////////////////////////////////////////////////////////////////////////////////////////
let vault = null;

// charge le vault
function load() {
	const rawCol = fs.readFileSync(gbl.vaultPath);
	// manque le décryptage....
	vault = JSON.parse(rawCol);
	console.log("** Vault data loaded **");
}
function save() {
	// manque le cryptage
	fs.writeFileSync(gbl.vaultPath,JSON.stringify(vault));
	console.log("** Vault data saved ** ");
}
// Recupère une info du vault
function get(key,canBeNull) {
	const ret = vault[key];
	if (!ret && !canBeNull) throw new Error("VAULT KEY NOT FOUND:"+key);
	return ret;
}
// stocke une info dans le vault
function put(key,val) {
	console.log("Put in Vault:",key);
	vault[key]=val;
	save();
	return val;
}

//////////////////////////////////////////////////////////////////////////////////////////////

load();

exports.get = get
exports.put = put

console.log("Vault loaded");

