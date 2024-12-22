

const gbl = require('../infraback/gbl.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');
const pFs = require('fs/promises');

const { PollyClient, SynthesizeSpeechCommand} = require("@aws-sdk/client-polly"); // CommonJS import

const URLMP3PREFIX = "/var/www/static/grimoire/"

// Collection contenant les hash des fichiers MP3
const mp3s = collections.get("ttsMP3",true)
mp3s.byTexte ??= new Map() // { file: static: }
// definition des fichiers mp3 statics
mp3s.byTexte.set('ding-ding',{file: "ding-ding.mp3", statique: true})
mp3s.byTexte.set('bienvenue',{file: "bienvenue.mp3", statique: true})
mp3s.byTexte.set('a disparu',{file: "adisparu.mp3", statique: true})
mp3s.byTexte.set('grandepeluche',{file: "grandepeluche.mp3", statique: true})
mp3s.byTexte.set('kikiadoc',{file: "kikiadoc.mp3", statique: true})
mp3s.byTexte.set('ma voix',{file: "mavoix.mp3", statique: true})
mp3s.byTexte.set('ok',{file: "ok.mp3", statique: true})
mp3s.byTexte.set('statique',{file: "statique.mp3", statique: true})
mp3s.byTexte.set('dynamique',{file: "dynamique.mp3", statique: true})
mp3s.byTexte.set('jeterepete',{file: "jeterepete.mp3", statique: true})
mp3s.byTexte.set('jerepete',{file: "jerepete.mp3", statique: true})
mp3s.byTexte.set('des-dejalance',{file: "des-dejalance.mp3", statique: true})
mp3s.byTexte.set('des-superlance',{file: "des-superlance.mp3", statique: true})
mp3s.byTexte.set('des-pasmal',{file: "des-pasmal.mp3", statique: true})
mp3s.byTexte.set('des-mieuxprochaine',{file: "des-mieuxprochaine.mp3", statique: true})
mp3s.byTexte.set('des-pasdemande',{file: "des-pasdemande.mp3", statique: true})
mp3s.byTexte.set('tufaispitie',{file: "tufaispitie.mp3", statique: true})
mp3s.byTexte.set('pasdemissionencours',{file: "pasdemissionencours.mp3", statique: true})
mp3s.byTexte.set('finduround',{file: "finduround.mp3", statique: true})
mp3s.byTexte.set('annuletonciblage',{file: "annuletonciblage.mp3", statique: true})
mp3s.byTexte.set('coursunpeupartout',{file: "coursunpeupartout.mp3", statique: true})
mp3s.byTexte.set('kikis',{file: "kikis.mp3", statique: true})
mp3s.byTexte.set('baroudeurakiki',{file: "baroudeurakiki.mp3", statique: true})
mp3s.byTexte.set('grenierjoli',{file: "grenierjoli.mp3", statique: true})
mp3s.byTexte.set('fleuraukiki',{file: "fleuraukiki.mp3", statique: true})
mp3s.byTexte.set('superstockakiki',{file: "superstockakiki.mp3", statique: true})
mp3s.byTexte.set('coquinouakiki',{file: "coquinouakiki.mp3", statique: true})
mp3s.byTexte.set('wonderkiki',{file: "wonderkiki.mp3", statique: true})
mp3s.byTexte.set('zeboyakiki',{file: "zeboyakiki.mp3", statique: true})
mp3s.byTexte.set('reactifakiki',{file: "reactifakiki.mp3", statique: true})
mp3s.byTexte.set('yaouanck',{file: "yaouanck.mp3", statique: true})
mp3s.byTexte.set('couleurdominante',{file: "couleurdominante.mp3", statique: true})
mp3s.byTexte.set('racede',{file: "racede.mp3", statique: true})
mp3s.byTexte.set('casquetteouberet',{file: "casquetteouberet.mp3", statique: true})
mp3s.byTexte.set('dallesmarbre',{file: "dallesmarbre.mp3", statique: true})
mp3s.byTexte.set('de',{file: "de.mp3", statique: true}) // prononcé dé
mp3s.byTexte.set('des',{file: "des.mp3", statique: true}) // prononcé dès
mp3s.byTexte.set('adefinir',{file: "adefinir.mp3", statique: true})
mp3s.byTexte.set('notincache',{file: "notincache.mp3", statique: true})
mp3s.byTexte.set('objectifbienvenue',{file: "objectifbienvenue.mp3", statique: true})
mp3s.byTexte.set('tuneciblespas',{file: "tuneciblespas.mp3", statique: true})
mp3s.byTexte.set('tuestroploin',{file: "tuestroploin.mp3", statique: true})
mp3s.byTexte.set('cenestpaslebonemote',{file: "cenestpaslebonemote.mp3", statique: true})
mp3s.byTexte.set('voirnombril',{file: "voirnombril.mp3", statique: true})
mp3s.byTexte.set('silencerapide',{file: "silencerapide.mp3", statique: true})
mp3s.byTexte.set('et',{file: "et.mp3", statique: true})
mp3s.byTexte.set('ou',{file: "ou.mp3", statique: true})
mp3s.byTexte.set('oui',{file: "oui.mp3", statique: true})
mp3s.byTexte.set('non',{file: "non.mp3", statique: true})
mp3s.byTexte.set('approchetoidelui',{file: "approchetoidelui.mp3", statique: true})
mp3s.byTexte.set('ciblele',{file: "ciblele.mp3", statique: true})
mp3s.byTexte.set('faisunemote',{file: "faisunemote.mp3", statique: true})
mp3s.byTexte.set('faisundire',{file: "faisundire.mp3", statique: true})
mp3s.byTexte.set('faisuncrier',{file: "faisuncrier.mp3", statique: true})
mp3s.byTexte.set('faisunhurler',{file: "faisunhurler.mp3", statique: true})
mp3s.byTexte.set('aveclenombre',{file: "aveclenombre.mp3", statique: true})
mp3s.byTexte.set('tudoisreussir',{file: "tudoisreussir.mp3", statique: true})
mp3s.byTexte.set('merci',{file: "merci.mp3", statique: true})
mp3s.byTexte.set('reecoutemission',{file: "reecoutemission.mp3", statique: true})
mp3s.byTexte.set('challengeencours',{file: "challengeencours.mp3", statique: true})
mp3s.byTexte.set('challengeenpause',{file: "challengeenpause.mp3", statique: true})
mp3s.byTexte.set('challengetermine',{file: "challengetermine.mp3", statique: true})
mp3s.byTexte.set('portegantsmitaines',{file: "portegantsmitaines.mp3", statique: true})
mp3s.byTexte.set('tictac6sec',{file: "tictac6sec.mp3", statique: true})
mp3s.byTexte.set('tuasechouedanstamission',{file: "tuasechouedanstamission.mp3", statique: true})
mp3s.byTexte.set('pouraugmentersaresistance',{file: "pouraugmentersaresistance.mp3", statique: true})
mp3s.byTexte.set('urgent',{file: "urgent.mp3", statique: true})
mp3s.byTexte.set('nacastpossesionsur',{file: "nacastpossesionsur.mp3", statique: true})
mp3s.byTexte.set('lanceundes',{file: "lanceundes.mp3", statique: true})
mp3s.byTexte.set('aresisteaucast',{file: "aresisteaucast.mp3", statique: true})
mp3s.byTexte.set('tuasaugmentelaresistancede',{file: "tuasaugmentelaresistancede.mp3", statique: true})
mp3s.byTexte.set('tuasreussitamission',{file: "tuasreussitamission.mp3", statique: true})
mp3s.byTexte.set('mauvaisereponse',{file: "mauvaisereponse.mp3", statique: true})
mp3s.byTexte.set('tempsdepasse',{file: "tempsdepasse.mp3", statique: true})
mp3s.byTexte.set('pasdemandeemote',{file: "pasdemandeemote.mp3", statique: true})
mp3s.byTexte.set('pasdemandedire',{file: "pasdemandedire.mp3", statique: true})
mp3s.byTexte.set('pasdemandehurler',{file: "pasdemandehurler.mp3", statique: true})
mp3s.byTexte.set('pasdemandecrier',{file: "pasdemandecrier.mp3", statique: true})
mp3s.byTexte.set('bravo',{file: "bravo.mp3", statique: true})
mp3s.byTexte.set('tuascontribuealareussite',{file: "tuascontribuealareussite.mp3", statique: true})
mp3s.byTexte.set('laresistancede',{file: "laresistancede.mp3", statique: true})
mp3s.byTexte.set('napasetesuffisante',{file: "napasetesuffisante.mp3", statique: true})
mp3s.byTexte.set('asurvecu',{file: "asurvecu.mp3", statique: true})
mp3s.byTexte.set('mais',{file: "mais.mp3", statique: true})
mp3s.byTexte.set('helas',{file: "helas.mp3", statique: true})
mp3s.byTexte.set('desnuagesdelapossession',{file: "desnuagesdelapossession.mp3", statique: true})
mp3s.byTexte.set('acettemission',{file: "acettemission.mp3", statique: true})
mp3s.byTexte.set('tuascontribue',{file: "tuascontribue.mp3", statique: true})
mp3s.byTexte.set('tunaspascontribue',{file: "tunaspascontribue.mp3", statique: true})
mp3s.byTexte.set('tuasunemissionencours',{file: "tuasunemissionencours.mp3", statique: true})
mp3s.byTexte.set('tunasplusderunedescrutation',{file: "tunasplusderunedescrutation.mp3", statique: true})
mp3s.byTexte.set('a',{file: "a.mp3", statique: true})
mp3s.byTexte.set('tuas',{file: "tuas.mp3", statique: true})
mp3s.byTexte.set('tas',{file: "tas.mp3", statique: true})
mp3s.byTexte.set('tunaspas',{file: "tunaspas.mp3", statique: true})
mp3s.byTexte.set('assez',{file: "assez.mp3", statique: true})
mp3s.byTexte.set('runedescrutation',{file: "runedescrutation.mp3", statique: true})
mp3s.byTexte.set('cibler',{file: "cibler.mp3", statique: true})
mp3s.byTexte.set('un',{file: "un.mp3", statique: true})
mp3s.byTexte.set('une',{file: "une.mp3", statique: true})
mp3s.byTexte.set('2',{file: "2.mp3", statique: true})
mp3s.byTexte.set('3',{file: "3.mp3", statique: true})
mp3s.byTexte.set('4',{file: "4.mp3", statique: true})
mp3s.byTexte.set('5',{file: "5.mp3", statique: true})
mp3s.byTexte.set('beaucoup',{file: "beaucoup.mp3", statique: true})
mp3s.byTexte.set('joueur',{file: "joueur.mp3", statique: true})
mp3s.byTexte.set('donner',{file: "donner.mp3", statique: true})
mp3s.byTexte.set('trouver',{file: "trouver.mp3", statique: true})
mp3s.byTexte.set('runeomega',{file: "runeomega.mp3", statique: true})
mp3s.byTexte.set('perdu',{file: "perdu.mp3", statique: true})
mp3s.byTexte.set('tes',{file: "tes.mp3", statique: true})
mp3s.byTexte.set('nuage-de-500',{file: "nuage-de-500.mp3", statique: true})
mp3s.byTexte.set('nuage-dissipe',{file: "nuage-dissipe.mp3", statique: true})
mp3s.byTexte.set('ton-ame-en-prison',{file: "ton-ame-en-prison.mp3", statique: true})
mp3s.byTexte.set('s-est-echape-de-prison',{file: "s-est-echape-de-prison.mp3", statique: true})
mp3s.byTexte.set('a-ete-capture',{file: "a-ete-capture.mp3", statique: true})
mp3s.byTexte.set('aucune',{file: "aucune.mp3", statique: true})
mp3s.byTexte.set('touteslesrunesomegatrouvees',{file: "touteslesrunesomegatrouvees.mp3", statique: true})
mp3s.byTexte.set('plus-obtenir-runes-solos',{file: "plus-obtenir-runes-solos.mp3", statique: true})
mp3s.byTexte.set('pause-demandee-par',{file: "pause-demandee-par.mp3", statique: true})
mp3s.byTexte.set('tu-as-deja-utilise-ce-joker',{file: "tu-as-deja-utilise-ce-joker.mp3", statique: true})
mp3s.byTexte.set('ce-nest-pas-le-bon-moment',{file: "ce-nest-pas-le-bon-moment.mp3", statique: true})
mp3s.byTexte.set('seulement',{file: "seulement.mp3", statique: true})
mp3s.byTexte.set('souhaite-recevoir-des-runes-de-scrutation',{file: "souhaite-recevoir-des-runes-de-scrutation.mp3", statique: true})
mp3s.byTexte.set('ce-nest-pas-suffisant-pour-en-demander',{file: "ce-nest-pas-suffisant-pour-en-demander.mp3", statique: true})
mp3s.byTexte.set('tu-as-trop-de-runes-pour-demarrer-un-challenge-solo',{file: "tu-as-trop-de-runes-pour-demarrer-un-challenge-solo.mp3", statique: true})
mp3s.byTexte.set('n-est-pas-en-condition-pour-recevoir-tes-runes',{file: "n-est-pas-en-condition-pour-recevoir-tes-runes.mp3", statique: true})
mp3s.byTexte.set('il-te-faut',{file: "il-te-faut.mp3", statique: true})
mp3s.byTexte.set('pour-scruter',{file: "pour-scruter.mp3", statique: true})
mp3s.byTexte.set('recu',{file: "recu.mp3", statique: true})
mp3s.byTexte.set('a-ete-perdu',{file: "a-ete-perdu.mp3", statique: true})
mp3s.byTexte.set('ont-ete-perdu',{file: "ont-ete-perdu.mp3", statique: true})
mp3s.byTexte.set('quel-mannequin-porte-une-robe-de-bure',{file: "quel-mannequin-porte-une-robe-de-bure.mp3", statique: true})
mp3s.byTexte.set('combien-de-joueurs-de-triple-triade-sont-a-cote-de-wonderkiki',{file: "combien-de-joueurs-de-triple-triade-sont-a-cote-de-wonderkiki.mp3", statique: true})
mp3s.byTexte.set('combien-de-vitraux-sont-visibles-dans-la-chapelle',{file: "combien-de-vitraux-sont-visibles-dans-la-chapelle.mp3", statique: true})
mp3s.byTexte.set('combien-de-lampes-bleues-sont-sur-le-comptoir-des-fournisseurs',{file: "combien-de-lampes-bleues-sont-sur-le-comptoir-des-fournisseurs.mp3", statique: true})
mp3s.byTexte.set('combien-de-banquettes-circulaires-sont-dans-lentree',{file: "combien-de-banquettes-circulaires-sont-dans-lentree.mp3", statique: true})
mp3s.byTexte.set('quelle-est-la-couleur-des-plus-grands-tapis',{file: "quelle-est-la-couleur-des-plus-grands-tapis.mp3", statique: true})
mp3s.byTexte.set('quelle-est-la-couleur-de-gilgamesh-en-face-de-wonderkiki',{file: "quelle-est-la-couleur-de-gilgamesh-en-face-de-wonderkiki.mp3", statique: true})
mp3s.byTexte.set('avec-son-nom',{file: "avec-son-nom.mp3", statique: true})
mp3s.byTexte.set('avec-la-couleur',{file: "avec-la-couleur.mp3", statique: true})
mp3s.byTexte.set('rune',{file: "rune.mp3", statique: true})
mp3s.byTexte.set('pour-en-demander',{file: "pour-en-demander.mp3", statique: true})
mp3s.byTexte.set('tu-peux',{file: "tu-peux.mp3", statique: true})
mp3s.byTexte.set('fais-un-emote-moi',{file: "fais-un-emote-moi.mp3", statique: true})

mp3s.byTexte.set('tu-peux-demander-des-runes',{file: "tu-peux-demander-des-runes.mp3", statique: true})
mp3s.byTexte.set('rune-pour-scruter',{file: "rune-pour-scruter.mp3", statique: true})
mp3s.byTexte.set('tu-peux-donner-tes-runes',{file: "tu-peux-donner-tes-runes.mp3", statique: true})
mp3s.byTexte.set('tu-nas-pas-de-rune-de-scrutation',{file: "tu-nas-pas-de-rune-de-scrutation.mp3", statique: true})
mp3s.byTexte.set('tu-nas-pas-cible-un-joueur',{file: "tu-nas-pas-cible-un-joueur.mp3", statique: true})
mp3s.byTexte.set('helas-tu-nas-pas-trouve-de-rune-omega',{file: "helas-tu-nas-pas-trouve-de-rune-omega.mp3", statique: true})
mp3s.byTexte.set('a-trouve-une-rune-omega',{file: "a-trouve-une-rune-omega.mp3", statique: true})

mp3s.byTexte.set('impossible',{file: "impossible.mp3", statique: true})
mp3s.byTexte.set('pauses-ont-ete-demandees',{file: "pauses-ont-ete-demandees.mp3", statique: true})

mp3s.byTexte.set('alarme',{file: "alarme.mp3", statique: true, flash: true})


// const client = new PollyClient(config);
const client = new PollyClient({region:"eu-west-3"});

// base de parametres
const paramsBase = { // SynthesizeSpeechInput
  Engine: "standard", // "neural", // "standard",
  LanguageCode: "fr-FR",
  // LexiconNames: [ "STRING_VALUE", ],
  OutputFormat: "mp3",
  // SampleRate: "STRING_VALUE",
  // SpeechMarkTypes: [ "sentence" ],
  // Text: "kiki", SERA REMPLACE
  TextType: "ssml",
  VoiceId: "Lea"
};

// recupere le MP3 {file: } ou undefined
function getMP3(texte) {
	return mp3s.byTexte.get(texte)
}
function setMP3(texte,filename) {
	const ret = { file: filename } 
	mp3s.byTexte.set(texte, ret)
	collections.save(mp3s)
	return ret
}
function clearMP3() {
	mp3s.byTexte = new Map() // { file: }
	collections.save(mp3s)
}
// stocke le MP3 en asynchrone
async function pubMP3(texte,data) {
	const hrTime = process.hrtime()
	const filename = "tts-"+hrTime[0]+"-"+hrTime[1]+".mp3"
	await pFs.writeFile(URLMP3PREFIX+filename, data)
	// stocke en collection
	return setMP3(texte,filename)
}

// synthese vocale, stocke le mp3 et retourne le descriptif { file: ... }
async function forceTTS(texte) {
	let params = Object.create(paramsBase)
	console.log('forceTTS:',texte)
	params.Text = '<speak><prosody volume="x-loud"><amazon:effect name="drc">'
	params.Text +=texte
	params.Text += '</amazon:effect></prosody></speak>'
	console.log("******************* ssml=",params.Text)
	const response = await client.send(new SynthesizeSpeechCommand(params))
	console.log("******************* cout/char=",response.RequestCharacters,texte)
	const byteArray = await response.AudioStream.transformToByteArray()
	return pubMP3(texte,byteArray)
}

// synthese volcale si non deja effectuée
async function getTTS(texte) {
	return getMP3(texte) || await forceTTS(texte)
}

exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	switch ( method ) {
		case "GET":
			switch ( reqPaths[2] ) {
				case "test":
					pseudos.check(pseudo,pwd,true); // admin
					await getTTS(decodeURI(reqPaths[3]) || "Test Kiki")	
					gbl.exception("ok",200);
				case "clear":
					pseudos.check(pseudo,pwd,true); // admin
					clearMP3()
					gbl.exception(Array.from(mp3s.byTexte.entries()),200)
				case "dump":
					pseudos.check(pseudo,pwd,true); // admin
					gbl.exception(Array.from(mp3s.byTexte.entries()),200)
				case "testSeq":
					pseudos.check(pseudo,pwd,true); // admin
					mp3s.byTexte.forEach( (val,key) => {
						if (val.statique) wsserver.targetSimpleOp(pseudo,"tts", getMP3(key) )
					})
					gbl.exception("ok",200)
			}
	}
	gbl.exception("Err param",400)
}

exports.getTTS = getTTS
exports.getMP3 = getMP3

console.log("tts loaded");

/*
	const command = new SynthesizeSpeechCommand(params)
	const response = await client.send(command)
	console.log("Content-type",response.ContentType)
	console.log("*********************** meta",response.$metadata)
	console.log("*********************** byteArray",response.AudioStream.transformToByteArray)
	console.log("*********************** audiostream",response.AudioStream.transformToWebStream)
	const byteArray = await response.AudioStream.transformToByteArray()
	await pFs.writeFile("/var/www/static/grimoire/test.mp3", byteArray)
	console.log("*********************** fin stream")
*/

