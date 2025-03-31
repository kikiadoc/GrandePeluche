// Ce module regroupe les fonctions sensibles en terme de RGPD

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
// Gestion de la console et report d'erreur
//////////////////////////////////////////
let logStatements = {old: [], cur: [], report: false, oldWarnFct: null, oldErrorFct: null}
function patchConsole() {
	function pushConsole(o) {
		if (logStatements.cur.lenght > 50) {
			logStatements.old = logStatements.cur
			logStatements.cur = []
			console.log("Tracking console: swap logStatements")
		}
		logStatements.cur.push(o)
	}
	logStatements.oldWarnFct = console.warn
	logStatements.oldErrorFct = console.error
	console.warn = function (message) {
		logStatements.oldWarnFct.apply(console, arguments);
		pushConsole({
			type: "console.warn",
			data: message,
			dth: Date.now()
		});
		// console.log('warning capturé')
	}
	console.error = function (message) {
		logStatements.oldErrorFct.apply(console, arguments)
		logStatements.report = true
		pushConsole({
			type: "console.error",
			data: message,
			dth: Date.now()
		});
		// console.log('error capturé')
	}
	console.log('Début des captures de la console')
}
export function unPatchConsole() {
	console.log('Arret des captures de la console')
	if (logStatements.oldWarnFct) console.warn = logStatements.oldWarnFct
	if (logStatements.oldErrorFct) console.error =logStatements.oldErrorFct
}

export function reportNeeded() {
	return logStatements.report
}

export function reportSend() {
}

console.log('patchConsole non activé')
// patchConsole()

// privacy.js

