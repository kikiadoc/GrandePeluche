////////////////////////////////////////////////////////////
// Varaible constante globales et variables à state globales
////////////////////////////////////////////////////////////
import {urlCdn} from "./common.js"
export const GBLSTATE = $state({
	swcReady: false // etat du service worker
	, audioVolume: 30
	, audioBack: false
	, audioTTS: 100
	, audioAmbiance: true
});

export const GBLCONST = {
	GENRES: [
		{val: null, lbl:"Inconnu", notif: "Je vais accorder mon discours au masculin"},
		{val:"M", lbl:"Masculin", notif: "Je vais accorder mon discours au masculin"},
		{val:"F", lbl:"Féminin", notif: "Je vais accorder mon discours au féminin"},
		{val:"N", lbl:"Non-binaire", notif: "Je vais accorder mon discours au masculin ou au féminin, selon ma propre humeur"}
	],
	MONDES: [
		"Cerberus","Louisoix","Moogle","Omega","Phantom","Ragnarok","Sagittarius","Spriggan",
		"Alpha","Lich","Odin","Phoenix","Raiden","Shiva","Twintania","Zodiark"
	],
	PAGEASSISTANCE: urlCdn+"securite/index.html"
};

console.log("Chargé: ground.svelte.js")

// ground.svelte.js 
