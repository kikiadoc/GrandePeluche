
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const fs = require('fs');

////////////////////////////////////////////////
// Gestion des collections et des simpleObjets
////////////////////////////////////////////////

function replacer(key, value) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}
function reviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}
////////////////////////////////////////////////
// initialise les collectsions depuis le FS
////////////////////////////////////////////////
let collectionsMap = new Map();
function initCollections() {
	console.log("--- init collections ---");
	fs.readdirSync(gbl.staticFsPath).forEach(file => {
  		const radical = file.split('.');
  		if (radical[1]=='collection') {
   			const rawCol = fs.readFileSync(gbl.staticFsPath+file);
   			const jsonCol = JSON.parse(rawCol,reviver);
				if (jsonCol.name == radical[0]) {
 					collectionsMap.set(jsonCol.name,jsonCol);
 					console.log("Collection loaded: ",file);
				}
				else {
					console.error("Collection NOT loaded (integrity)",file);
				}
  		}	
	});
	console.log("------------------------");
}

////////////////////////////////////////////////
// save une collection
////////////////////////////////////////////////
function save(col) {
	if (! col.name ) gbl.exception("No name in collection", 500);
	col.versionDth = Date.now();
	fs.writeFileSync(gbl.staticFsPath+col.name+".collection",JSON.stringify(col,replacer));
	console.log("collection", col.name, "saved on fs");
}

////////////////////////////////////////////////
// charge un fichier JSON
////////////////////////////////////////////////
function loadJsonFile(file) {
	try {
 		const rawFile = fs.readFileSync(file);
 		return JSON.parse(rawFile);
	}
	catch (e) {
		console.log('*** parsing error:',file,e);
		return {}
	}
}

////////////////////////////////////////////////
// préparation d'un mode asynchrone eventuel
////////////////////////////////////////////////

let colQueue = {};
function deQueue() {
	let col= colQueue
}
function queue(col) {
	colQueue[col.name] = col;
}


function get(nom, init) {
	let ret = collectionsMap.get(nom);
	if (ret==null && init) ret = { name: nom };
	return ret;
}

function reset(nom) {
	const ret = { name: nom }
	collectionsMap.set(nom,ret);
	return ret
}

// initialise une collection si elle n'existe pas sur la base du parametre
// elle n'est pas sauvegardée tant que pas usage de save()
function init(newCol) {
	let col = collectionsMap.get(newCol.name);
	if (col) return col;
	collectionsMap.set(newCol.name,newCol);
	return newCol;
}

//////////////////////////////////////////////////////////////////////////////////////////////
// pseudoContext
// c'est une collection dont les membres sont indexes par les pseudos
// {name: ??, pseudos:[{}]
//////////////////////////////////////////////////////////////////////////////////////////////
function pseudoContextLoad(nom){
	const col = init( {name: "pseudoContext_"+nom, pseudos: {} } )
	return col
}
function pseudoContextGet(nom,pseudo){
	const col = pseudoContextLoad(nom)
	return col.pseudos[pseudo] || { }
}
function pseudoContextSet(nom,pseudo,o){
	const col = pseudoContextLoad(nom)
	col.pseudos[pseudo] = o
	save(col)
	return col.pseudos[pseudo]
}
function pseudoContextDelete(nom,pseudo){
	const col = pseudoContextLoad(nom)
	delete col.pseudos[pseudo]
	save(col)
	return {}
}

//////////////////////////////////////////////////////////////////////////////////////////////
// SimpleObject
//////////////////////////////////////////////////////////////////////////////////////////////
exports.loadSimpleObject = (name) => {
	try {
		const rawObj = fs.readFileSync(gbl.staticFsPath+name+".object");
		const jsonObj = JSON.parse(rawObj);
		if (jsonObj.name != name) throw new Error("object "+name+" malformé, reinit");
		return jsonObj;
	}
	catch(e) {
		if (e.errno==-2) 
			console.error("Object initialisé a default, file not found",e.path);
		else
			console.error(e);
	}
	return { name: name }
}
exports.deleteSimpleObject = (name) => {
	try {
		fs.unlinkSync(gbl.staticFsPath+name+".object");
	}
	catch(e) {
		console.log(e);
	}
	return { name: name }
}
exports.saveSimpleObject = (name,obj) => {
	try {
		if (obj.name != name) throw new Error("object "+name+" malformé, reinit");
		const jsonStr = JSON.stringify(obj);
		fs.writeFileSync(gbl.staticFsPath+name+".object",jsonStr);
		return jsonStr;
	}
	catch(e) {
		if (e.errno==-2) 
			console.error("Object supprime, mais file not found",e.path);
		else
			console.log(e);
	}
	return { name: name }
}


//////////////////////////////////////////////////////////////////////////////////////////////

exports.get = get
exports.save = save
exports.init = init
exports.reset = reset
exports.loadJsonFile = loadJsonFile
exports.pseudoContextLoad=pseudoContextLoad
exports.pseudoContextGet=pseudoContextGet
exports.pseudoContextSet=pseudoContextSet

exports.stringify = (col) => {
	console.log("** A FAIRE, cache de collections");
	return JSON.stringify(col);
}

// GET collections/{name}
// GET contextes/{name}
// GET contextes/{name}/{pseudo}
// POST contextes/{name}/{pseudo} {body}
// DELETE contextes/{name}/{pseudo}
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd);
	switch (method) {
		case "OPTIONS": {
			res.setHeader('Access-Control-Allow-Methods', 'DELETE');
			gbl.exception("AllowedCORS",200);
		}
		case  "GET": {
			switch(reqPaths[1]) {
				case "collections":
					gbl.exception(collectionsMap.get(reqPaths[2]),200)
				case "contextes":
					if (! reqPaths[3] )
						gbl.exception(pseudoContextLoad(reqPaths[2]),200)
					else
						gbl.exception(pseudoContextGet(reqPaths[2],reqPaths[3]),200)
			}
			gbl.exception("bad GET",400);
		}
		case  "POST": {
			switch(reqPaths[1]) {
				case "contextes":
					if (reqPaths[3]!=pseudo) gbl.exception('bad pseudo in req',400)
					gbl.exception(pseudoContextSet(reqPaths[2],reqPaths[3],JSON.parse(body)),200)
			}
			gbl.exception("bad POST",400);
		}
		case  "DELETE": {
			pseudos.check(pseudo,pwd,true); // admin
			gbl.exception(pseudoContextDelete(reqPaths[2],reqPaths[3]),200)
		}
	}
	gbl.exception("bad op",400);
}

initCollections();

console.log("collection et simpleObjects loaded");
