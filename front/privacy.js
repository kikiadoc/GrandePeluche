// Ce module regroupe les fonctions sensibles en terme de RGPD
// cela inclu le tracking console car peut remonter des trucs style extension du nav
import {displayInfo, getDynMetro, getLatence} from "./common.js"
import {GBLSTATE } from "./ground.svelte.js"

//////////////////////////////////////////
// retourne le m ou f selon le genre
//////////////////////////////////////////
export function G(g,m,f) {
	switch(g) {
		case "M": return m || ""
		case "F": return f || ""
		default:  return (Math.random()<0.5)? (m || "") : (f || "")
	}
	return "?Genre?"
}
//////////////////////////////////////////
// Gestion de la console et report d'erreur sur smartphone
//////////////////////////////////////////
let logStatements = {global:{}, reseau:{}, perf:{}, old: [], cur: [] }
function cPush(o) {
	if (logStatements.cur.lenght > 100) {
		logStatements.old = logStatements.cur
		logStatements.cur = []
		// console.log("Tracking console: swap logStatements")
	}
	logStatements.cur.push(o)
	// console.error(o)
}

function aClone(args) {
	let ret=[]
	for (const a of arguments) {
		if (Error.isError(a?.error)){
			ret.push(a.error.message)
			ret.push(a.error.stack)
		}
		else
			ret.push(a?.toString())
  }
	return ret
}
export function addReport(section,key,value) {
	if (logStatements[section])	logStatements[section][key]=value
}
function gUpdate() {
	logStatements.global.deepCheckSec= window.crossOriginIsolated
	logStatements.global.metacache= GBLSTATE.swcReady
	logStatements.global.audioBlaster = {
		audioVolume: GBLSTATE.audioVolume,
		audioBack: GBLSTATE.audioBack,
		audioTTS: GBLSTATE.audioTTS,
		audioAmbiance: GBLSTATE.audioAmbiance
	}
	logStatements.global.babylonVersion=(typeof BABYLON=="object")? BABYLON?.Engine?.Version : null
	logStatements.reseau.dynMetro = getDynMetro()
	logStatements.reseau.latence = getLatence()
}
let cNew = null , cOld = null
export function patchConsole() {
	if (cNew) return displayInfo({body: ["capture déjà active"]})
	cOld = window.console
	cNew = (function(){
		return {
			log:  (...args)=>{ cOld.log(...args); cPush( { log:aClone(...args), dth: Date.now() }) },
			info: (...args)=>{ cOld.info(...args); cPush( { info:aClone(...args), dth: Date.now() }) },
			warn: (...args)=>{ cOld.warn(...args); cPush( { warn:aClone(...args), dth: Date.now() }) },
			error: (...args)=>{ cOld.error(...args); cPush( { error:aClone(...args), dth: Date.now() }) },
		}} (window.console))
	window.console = cNew
	console.log('Début des captures de la console')
	displayInfo({
		body:["La capture de la console est DEMARREE",
					"Cette capture est optionnelle et ne doit être activé qu'en cas de souci.",
					"Si ca rame ou lag, ferme ton navigateur"
				 ]})
}
export function unpatchConsole() {
	if (!cNew) return displayInfo({body: ["la capture n'est pas active"]})
	console.log('Arret des captures de la console')
	window.console = cOld
	cNew=null
	displayInfo({body:["La capture de la console est ARRETEE"]})
}

export function getConsole() {
	gUpdate()
	return window.structuredClone(logStatements)
}
export async function reportConsole() {
	if (window.showSaveFilePicker) {
		try {
			gUpdate()
			displayInfo({body:
				["Patiente quelques secondes, je prépare le rapport",
				 "Pour envoyer ton rapport, tu dois l'enregistrer sur ton équipement",
				]})
			let reportBlob = new Blob([JSON.stringify(logStatements,null,2)],{type:"text/json"})
		  const newHandle = await window.showSaveFilePicker(
				{suggestedName:"GrandePeluche.json",startIn:"downloads"})
			console.log("newHandle",newHandle)
		  const writableStream = await newHandle.createWritable();
		  await writableStream.write(reportBlob);
		  await writableStream.close();
			displayInfo({back:"stars", body:[
				"Maintenant que tu as enregistré ton rapport, va sur Discord.",
				"Envoie un MP a Kikiadoc en ajoutant le fichier nommé '"+newHandle.name+"' en pièce jointe à ton message",
				"Il se trouve dans la liste de tes téléchargements."
			]})
		}
		catch(e) {
			displayInfo({titre:"Erreur de génération du rapport", body: [e.toString()] } )
		}
	}
	else
		displayInfo({body:[
			"La fonction de rapport technique utilise des fonctions expérimentales",
			"Hélas, la fonction showSaveFilePicker n'est pas disponible sur ton équipement",
			"Contacte Kikiadoc si tu as besoin de partager le rapport de GrandePeluche avec lui",
		]})
}

// patchConsole()

// privacy.js

