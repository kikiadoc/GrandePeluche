////////////////////////////////////////////////////////////
// Varaible constante globales et variables à state globales
////////////////////////////////////////////////////////////
import {urlCdn, loadIt} from "./common.js"
// skin par defaut
console.log("window.location.host",window.location.host)
let skin= ( (window.location.host=="ffxivfr.adhoc.click") && "FF" ) ||
					( (window.location.host=="ff14.adhoc.click") && "FF"  ) ||
					"GP" 
let isPublic = window.location.host=="ffxivfr.adhoc.click"

export const GBLSTATE = $state({
	swcReady: false, // etat du service worker
	audioVolume: 30,
	audioBack: false,
	audioTTS: 100,
	audioAmbiance: true,
});

const SKINELTFF = {
	titreLbl: "Final Fantasy XIV - France",
}
const SKINELTGP = {
	titreLbl: "La Grande Peluche",
}
export const GBLCONST = {
	SKINCONST: "SKIN"+skin, // peut etre modfier pour changement de skin
	SKINELT: (isPublic)? SKINELTFF : SKINELTGP,
	public: isPublic,
	URLPUBLIC: "https://ffxivfr.adhoc.click/bienvenue",
	URLPRIVE: "https://ff14.adhoc.click/enjoy",
	PAGEASSISTANCE: "https://help.adhoc.click/HELP/index.html",
	EQUILIBRAGE: {
		NB: 10, // nombre de joueurs 
		EVENTGILS: 400, // nombre de gils de l'événement
		COEFPOW: 50 // Coef d'exponentielle de la cagnotte
	},
	GENRES: [
		{val: null, lbl:"Inconnu", notif: "Je vais accorder mon discours au masculin"},
		{val:"M", lbl:"Masculin", notif: "Je vais accorder mon discours au masculin"},
		{val:"F", lbl:"Féminin", notif: "Je vais accorder mon discours au féminin"},
		{val:"N", lbl:"Non-binaire", notif: "Je vais accorder mon discours au masculin ou au féminin, selon ma propre humeur"}
	],
	SKINS: [
		{val:"SKIN"+skin, lbl:"Par défaut", notif: null},
		{val:"SKINGP", lbl:"Historique", notif: null},
		{val:"SKINFF", lbl:"Modernisé", notif: null},
	],
};

// calcul cagnotte:
// curNb : nombre de contributions primaires
// maxGils: nom de gils total
// secNb: nombre de contributions secondaires (ou null)
// eqNb: nombre max de contributions pour equillibrage (ou null)
export function calcCagnotte(curNb,maxGils,secNb,eqNb) {
	if (curNb==0) return 0
	eqNb = eqNb || GBLCONST.EQUILIBRAGE.NB
	if (secNb !== undefined) curNb=Math.min(curNb,secNb)
	if (curNb>eqNb) return maxGils
	// ramene le ratio de participation entre -1 et 0 et applique l'exponentielle
	return maxGils * Math.pow( GBLCONST.EQUILIBRAGE.COEFPOW, (curNb/eqNb)-1 )
}
export function calcCagnotteNb(curNb,secNb,eqNb) {
	if (curNb==0) return 0
	eqNb = eqNb || GBLCONST.EQUILIBRAGE.NB
	if (secNb === undefined) return Math.floor(Math.min(curNb,eqNb))
	return Math.floor(Math.min(curNb,secNb,eqNb))
}

/*
// debug
for (let i=0; i<= GBLCONST.EQUILIBRAGE.NB; i++)
	console.log("***calcCagnotte",i,calcCagnotte(i,100) )
*/
console.log("Chargé: ground.svelte.js SKIN=",skin)

// ground.svelte.js 
