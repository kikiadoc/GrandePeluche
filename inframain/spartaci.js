const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const tts = require('../infraback/tts.js');
const igImage = require('../infraback/igImage.js');

const EFFECTIVESTARTDTH = Date.UTC(2025, 1-1, 19, 19, 0, 0)
const TIMER_RELAXOK= 15000	// timer de relax apres une mission OK
const TIMER_RELAXKO= 25000	// timer de relax apres une mission echoué
const TIMER_OBJDEFAUT= 20000	// timer par defaut des objectifs
const DELAY_TICTAC= 6000	// timer par defaut idu tictac des objectifs
const SCRUTER_NBRUNES=5		// nombre de runes nécessaires pour un scruter
const SCRUTER_NBRUNESPAR=4	// facteur nombre de runes nécessaires selon nombre de scruter deja fait
const SCRUTER_NBRUNESMAX=19	// max nombre de runes nécessaires pour un scruter
const SCRUTER_ALEA=0.66		// probabilite de reussite d'un scruter
const OMEGA_NBRUNES=25		// nombre de runes omega a trouver
const SIGNE_NBRUNESREQUISES=3		// il faut 3 runes pour faire un signe pour demander 
const DONNER_NBRUNESREQUISES=2		// il faut 2 runes sur la cible pour faire un donner 
const DONNER_COEFPERDU=0.5	// perte maximal lors d'un échange : 50%
const DONNER_MAXDONNER=5		// max de rune a donner par echange
const GLOBALDES_TIRAGEMOYEN=450 // moyenne des des pour un tirage global
const GLOBAL_MAXDELAI= 3*60000 // delai max d'un challenge global (3min)
const SOMNOLER_NBMAX=1 // 5 // nombre de somnoler possible

const MANNEQUINS = [
	// coordonnées en plaque de marbre au sol, pas en coord IG
	{ nom: "Zeboy-a-kiki",			couleur: 'vert',	race: "miqo'te",	chapeau: true,	nombril: true,	gants: false,	cX: 2,	cY: 2, tts: tts.getMP3('zeboyakiki') },
	{ nom: "Reactif-a-kiki",		couleur: 'noir',	race: 'hrothgar',	chapeau: false,	nombril: false, gants: true,	cX: 5,	cY: 3, tts: tts.getMP3('reactifakiki') },
	{ nom: "Yaouanck",					couleur: 'gris',	race: 'roegadyn',	chapeau: false, nombril: false, gants: false, cX: 6,	cY: 9, tts: tts.getMP3('yaouanck') },
	{ nom: "Kiki's'",						couleur: 'rouge',	race: 'lalafell', chapeau: true,	nombril: false, gants: false, cX: 15,	cY: 3, tts: tts.getMP3('kikis') },
	{ nom: "Baroudeurakiki",		couleur: 'noir',	race: 'lalafell',	chapeau: true,	nombril: false, gants: false, cX: 16,	cY: 3, tts: tts.getMP3('baroudeurakiki') },
	{ nom: "Grenierjoli",				couleur: 'bleu',	race: 'hyur',			chapeau: false,	nombril: false, gants: true,	cX: 17,	cY: 4, tts: tts.getMP3('grenierjoli') },
	{ nom: "Fleuraukiki",				couleur: 'vert',	race: 'ao ra',		chapeau: true,	nombril: true,	gants: true,	cX: 18,	cY: 4, tts: tts.getMP3('fleuraukiki') },
	{ nom: "Superstock'a'kiki",	couleur: 'bleu',	race: 'elezen',		chapeau: false,	nombril: true,	gants: false,	cX: 19,	cY: 4, tts: tts.getMP3('superstockakiki') },
	{ nom: "Coquinou-a-kiki",		couleur: 'mauve',	race: 'roegadyn',	chapeau: true,	nombril: false,	gants: false,	cX: 20,	cY: 5, tts: tts.getMP3('coquinouakiki') },
	{ nom: "Wonderkiki",				couleur: 'rouge',	race: 'hyur',			chapeau: true,	nombril: true,	gants: true,	cX: 17,	cY: 7, tts: tts.getMP3('wonderkiki') }
]
const GRANDEPELUCHE = 
	{ nom: "Grande Peluche",		couleur: 'n/a',		race: 'n/a',			chapeau: true,	nombril: false,	gants: false,	cX: 0,	cY: 0, tts: tts.getMP3('grandepeluche') }


const T_NOTINCACHE=					tts.getMP3('notincache')
const T_D=									tts.getMP3('ding-ding') 
const T_SILENCE=						tts.getMP3('silencerapide') 
const T_ET=									tts.getMP3('et') 
const T_OU=									tts.getMP3('ou') 
const T_DE=									tts.getMP3('de')  // prononcé dé
const T_DES=								tts.getMP3('des')  // prononcé dès
const T_OUI=								tts.getMP3('oui') 
const T_NON=								tts.getMP3('non') 
const T_CIBLELE=						tts.getMP3('ciblele') 
const T_APPROCHE=						tts.getMP3('approchetoidelui') 
const T_EMOTE=							tts.getMP3('faisunemote') 
/**/ const T_FAISUNHURLER=				tts.getMP3('faisunhurler') 
const T_FAISUNCRIER=				tts.getMP3('faisuncrier') 
const T_NOMBRE=							tts.getMP3('aveclenombre') 
const T_OK=									tts.getMP3('ok')
const T_BADTARGET=					tts.getMP3('tuneciblespas')  				// Tu ne cibles pas xxx
const T_NOTNEAR=						tts.getMP3('tuestroploin')					// Tu es trop loin, rapproche-toi et re-cible xxx
const T_BADEMOTE=						tts.getMP3('cenestpaslebonemote')		// Ce n'est pas le bon émote
const T_PASDEMISSION=				tts.getMP3('pasdemissionencours')
const T_MERCI=							tts.getMP3('merci')
const T_REECOUTEMISSION=		tts.getMP3('reecoutemission')
const T_COULEURDOMINANTE=		tts.getMP3('couleurdominante')
const T_RACEDE=							tts.getMP3('racede')
const T_CASQUETTEOUBERET=		tts.getMP3('casquetteouberet')
const T_VOIRNOMBRIL=				tts.getMP3('voirnombril')
const T_PORTEGANTSMITAINES=	tts.getMP3('portegantsmitaines')
const T_DALLESMARBRE=				tts.getMP3('dallesmarbre')
const T_JEREPETE=						tts.getMP3('jerepete')
const T_TICTAC=							tts.getMP3('tictac6sec')
const T_ECHOUE=							tts.getMP3('tuasechouedanstamission')
const T_TUDOISREUSSIR=			tts.getMP3('tudoisreussir')
const T_DESDEJALANCE=					tts.getMP3('des-dejalance')
const T_DESPASDEMANDE=			tts.getMP3('des-pasdemande')
const T_URGENT=							tts.getMP3('urgent')
const T_NACASTPOSSESSIONSUR=tts.getMP3('nacastpossesionsur')
const T_LANCEUNDES=					tts.getMP3('lanceundes')
const T_POURAUGMENTERSARESISTANCE=	tts.getMP3('pouraugmentersaresistance')
const T_ARESISTEAUCAST=			tts.getMP3('aresisteaucast')
const T_TUASAUGMENTELARESISTANCEDE = tts.getMP3('tuasaugmentelaresistancede')
const T_TUASREUSSITAMISSION=			tts.getMP3('tuasreussitamission')
const T_MAUVAISEREPONSE=			tts.getMP3('mauvaisereponse')
const T_TEMPSDEPASSE=			tts.getMP3('tempsdepasse')
const T_PASDEMANDEEMOTE=	tts.getMP3('pasdemandeemote')
/**/ const T_PASDEMANDEDIRE=		tts.getMP3('pasdemandedire')
const T_PASDEMANDECRIER=		tts.getMP3('pasdemandecrier')
/**/ const T_PASDEMANDEHURLER=		tts.getMP3('pasdemandehurler')
const T_BRAVO=		tts.getMP3('bravo')
const T_TUASCONTRIBUEALAREUSSITE=		tts.getMP3('tuascontribuealareussite') 
const T_LARESISTANCEDE=		tts.getMP3('laresistancede')
const T_NAPASETESUFFISANTE=		tts.getMP3('napasetesuffisante')
const T_ASURVECU=		tts.getMP3('asurvecu')
const T_MAIS=		tts.getMP3('mais')
const T_HELAS=		tts.getMP3('helas')
const T_DESNUAGESDELAPOSSESION=		tts.getMP3('desnuagesdelapossession')
const T_ACETTEMISSION=		tts.getMP3('acettemission')
const T_TUASCONTRIBUE=		tts.getMP3('tuascontribue')
const T_TUNASPASCONTRIBUE=		tts.getMP3('tunaspascontribue')
const T_TUASUNEMISSIONENCOURS=		tts.getMP3('tuasunemissionencours')
const T_A=		tts.getMP3('a')
const T_TUAS=		tts.getMP3('tuas')
const T_TAS=		tts.getMP3('tas')
const T_TUNASPAS=		tts.getMP3('tunaspas')
const T_ASSEZ=		tts.getMP3('assez')
const T_RUNEDESCRUTATION=	tts.getMP3('runedescrutation') 
const T_CIBLER=	tts.getMP3('cibler') 
const T_UN=	tts.getMP3('un') 
const T_UNE=	tts.getMP3('une') 
const T_DEUX=	tts.getMP3('2') 
const T_TROIS=	tts.getMP3('3') 
const T_QUATRE=	tts.getMP3('4') 
const T_CINQ=	tts.getMP3('5') 
const T_BEAUCOUP=	tts.getMP3('beaucoup') 
const T_JOUEUR=	tts.getMP3('joueur') 
const T_DONNER=	tts.getMP3('donner') 
const T_TROUVER=	tts.getMP3('trouver') 
const T_RUNEOMEGA=	tts.getMP3('runeomega') 
const T_PERDU=	tts.getMP3('perdu') 
const T_TES=	tts.getMP3('tes') 
const T_NUAGEDE500=	tts.getMP3('nuage-de-500') 
const T_NUAGEDISSIPE=	tts.getMP3('nuage-dissipe') 
const T_TONAMEENPRISON=	tts.getMP3('ton-ame-en-prison') 
const T_X_SESTECHAPPEDEPRISON=	tts.getMP3('s-est-echape-de-prison') 
const T_X_AETECAPTURE=	tts.getMP3('a-ete-capture')
const T_AUCUNE=	tts.getMP3('aucune')
const T_TOUTESLESRUNESTROUVEES=	tts.getMP3('touteslesrunesomegatrouvees')
const T_CHALLENGETERMINE=	tts.getMP3('challengetermine')
const T_PLUSOBTENIRRUNESSOLOS=	tts.getMP3('plus-obtenir-runes-solos')
const T_PAUSEDEMANDEEPAR=	tts.getMP3('pause-demandee-par')
const T_TUASDEJAUTILISECEJOKER=	tts.getMP3('tu-as-deja-utilise-ce-joker')
const T_CENESTPASLEBONMOMENT=	tts.getMP3('ce-nest-pas-le-bon-moment')
const T_SEULEMENT= tts.getMP3('seulement')
const T_SOUHAITERECEVOIRDESRUNESDESCRUTATION= tts.getMP3('souhaite-recevoir-des-runes-de-scrutation')
const T_CENESTPASSUFFISANTPOURENDEMANDER= tts.getMP3('ce-nest-pas-suffisant-pour-en-demander')
const T_TUASTROPDERUNESPOURDEMARRERUNCHALLENGESOLO= tts.getMP3('tu-as-trop-de-runes-pour-demarrer-un-challenge-solo')
const T_X_NESTPASENCONDITIONPOURRECEVOIRTESRUNES= tts.getMP3('n-est-pas-en-condition-pour-recevoir-tes-runes')
const T_ILTEFAUT= tts.getMP3('il-te-faut')
const T_POURSCRUTER= tts.getMP3('pour-scruter')
const T_RECU= tts.getMP3('recu')
const T_AETEPERDU= tts.getMP3('a-ete-perdu')
const T_ONTETEPERDU= tts.getMP3('ont-ete-perdu')
const T_QUELMANNEQUINPORTEUNEROBEDEBURE= tts.getMP3('quel-mannequin-porte-une-robe-de-bure')
const T_COMBIENDEJOUEURSDETRIPLETRIADESONTACOTEDEWONDERKIKI= tts.getMP3('combien-de-joueurs-de-triple-triade-sont-a-cote-de-wonderkiki')
const T_COMBIENDEVITRAUXSONTVISIBLESDANSLACHAPELLE= tts.getMP3('combien-de-vitraux-sont-visibles-dans-la-chapelle')
const T_COMBIENDELAMPESBLEUESSONTSURLECOMPTOIRDESFOURNISSEURS= tts.getMP3('combien-de-lampes-bleues-sont-sur-le-comptoir-des-fournisseurs')
const T_COMBIENDEBANQUETTESCIRCULAIRESSONTDANSLENTREE= tts.getMP3('combien-de-banquettes-circulaires-sont-dans-lentree')
const T_QUELLEESTLACOULEURDESPLUSGRANDSTAPIS= tts.getMP3('quelle-est-la-couleur-des-plus-grands-tapis')
const T_QUELLEESTLACOULEURDEGILGAMESHENFACEDEFLEUAUKIKI= tts.getMP3('quelle-est-la-couleur-de-gilgamesh-en-face-de-wonderkiki')
const T_AVECSONNOM= tts.getMP3('avec-son-nom')
const T_AVECLACOULEUR= tts.getMP3('avec-la-couleur')
const T_RUNE= tts.getMP3('rune')
const T_POURENDEMANDER= tts.getMP3('pour-en-demander')
const T_TUPEUX= tts.getMP3('tu-peux')
const T_FAISUNEMOTEMOI= tts.getMP3('fais-un-emote-moi')

const	T_TUPEUXDEMANDERDESRUNES= tts.getMP3('tu-peux-demander-des-runes')
const	T_RUNEPOURSCRUTER= tts.getMP3('rune-pour-scruter')
const	T_TUPEUXDONNERTESRUNES= tts.getMP3('tu-peux-donner-tes-runes')
const	T_TUNASPASDERUNEDESCRUTATION= tts.getMP3('tu-nas-pas-de-rune-de-scrutation')
const	T_TUNASPASCIBLEUNJOUEUR= tts.getMP3('tu-nas-pas-cible-un-joueur')
const	T_HELASTUNASPASTROUVERDERUNEOMEGA= tts.getMP3('helas-tu-nas-pas-trouve-de-rune-omega')
const	T_ATROUVEUNERUNEOMEGA= tts.getMP3('a-trouve-une-rune-omega')

const	T_IMPOSSIBLE= tts.getMP3('impossible')
const T_PAUSESONTDEJAETEDEMANDEES= tts.getMP3('pauses-ont-ete-demandees')

const	T_ALARME= tts.getMP3('alarme')

// ttsGlobalKo: [ T_X_ESTENPRISON ],
// ttsOk: [ T_ECHAPEPRISON ],
// ttsGlobalOk: [ T_X_SORTIPRISON ],

const OBJECTIFBIENVENUE =
	{
		timeout: 30000, target: GRANDEPELUCHE, emote:"encourage", q: "Approche-toi de la Grande Peluche, cible-la et fait un émote encourager", obligatoire: true, score:1,
		ttsDelayed: [ tts.getMP3('objectifbienvenue') ],
		ttsOk:  [ T_MERCI, T_SILENCE, T_REECOUTEMISSION ],
		ttsPanique: [ tts.getMP3('objectifbienvenue') ]
	}

const OBJECTIFPAUSE =
	{
		timeout: 99*3600*1000, q: "Ne rien faire", obligatoire: true,
		tts: [ T_OK ],
		ttsOk:  [ T_OK ],
		ttsPanique: [ T_OK ]
	}

const OBJECTIFFINI =
	{
		timeout: 99*3600*1000, q: "challenge terminé", obligatoire: true,
		ttsPanique: [ T_CHALLENGETERMINE ]
	}

// objectifs de couleur
const OBJECTIFSCOULEUR = []
MANNEQUINS.forEach( (m) => {OBJECTIFSCOULEUR.push( 
	{
		timeout: 25000, target: m, dire: m.couleur, q: "Quelle est la couleur dominante de la tenue de "+m.nom+" (/crier x)", score: 1,
		tts: [ T_D, T_COULEURDOMINANTE, m.tts, T_APPROCHE, T_CIBLELE, T_ET, T_FAISUNCRIER, T_AVECLACOULEUR ],
		ttsOk: [ T_TUASREUSSITAMISSION ],
		ttsPanique: [ T_COULEURDOMINANTE, m.tts, T_APPROCHE, T_CIBLELE, T_ET, T_FAISUNCRIER, T_AVECLACOULEUR ]
	} 
)})
// objectifs de races
const OBJECTIFSRACE = []
MANNEQUINS.forEach( (m) => {OBJECTIFSRACE.push( 
	{
		timeout: 25000, target: m, dire: m.race, q: "Quelle est la race de "+m.nom+" (/dire X)", score: 1,
		tts: [ T_D, T_RACEDE, m.tts, T_SILENCE, T_APPROCHE, T_CIBLELE, T_ET, T_FAISUNCRIER ],
		ttsOk: [ T_TUASREUSSITAMISSION ],
		ttsPanique: [ T_RACEDE, m.tts, T_SILENCE, T_APPROCHE, T_CIBLELE, T_ET, T_FAISUNCRIER ]
	} 
)})
// objectifs de chapeau
const OBJECTIFSCHAPEAU = []
MANNEQUINS.forEach( (m) => {OBJECTIFSCHAPEAU.push( 
	{
		timeout: 25000, target: m, emote: m.chapeau? "oui":"non", q: m.nom+" porte-t-il une casquette ou un béret (/oui ou /non)", score: 1,
		tts: [ T_D, m.tts, T_CASQUETTEOUBERET, T_SILENCE, T_APPROCHE, T_CIBLELE, T_ET, T_EMOTE, T_OUI, T_OU, T_NON ],
		ttsOk: [ T_TUASREUSSITAMISSION ],
		ttsPanique: [ m.tts, T_CASQUETTEOUBERET, T_SILENCE, T_APPROCHE, T_CIBLELE, T_ET, T_EMOTE, T_OUI, T_OU, T_NON ]
	} 
)})
// objectifs de nombril
const OBJECTIFSNOMBRIL = []
MANNEQUINS.forEach( (m) => {OBJECTIFSNOMBRIL.push( 
	{
		timeout: 25000, target: m, emote: m.nombril? "oui":"non", q: "Peut-on voir le nombril de "+m.nom+" (/oui ou /non)", score: 1,
		tts: [ T_D, T_VOIRNOMBRIL, m.tts,  T_SILENCE, T_APPROCHE, T_CIBLELE, T_ET, T_EMOTE, T_OUI, T_OU, T_NON ],
		ttsOk: [ T_TUASREUSSITAMISSION ],
		ttsPanique: [ T_VOIRNOMBRIL, m.tts,  T_SILENCE, T_APPROCHE, T_CIBLELE, T_ET, T_EMOTE, T_OUI, T_OU, T_NON ]
	} 
)})
// objectifs de gants
const OBJECTIFSGANTS = []
MANNEQUINS.forEach( (m) => {OBJECTIFSGANTS.push( 
	{
		timeout: 25000, target: m, emote: m.gants? "oui":"non", q: m.nom+" porte-t-il des gants ou des mitaines (/oui ou /non)", score: 1,
		tts: [ T_D, m.tts , T_PORTEGANTSMITAINES, T_SILENCE, T_APPROCHE, T_CIBLELE, T_ET, T_EMOTE, T_OUI, T_OU, T_NON ],
		ttsOk: [ T_TUASREUSSITAMISSION ],
		ttsPanique: [ m.tts , T_PORTEGANTSMITAINES, T_SILENCE, T_APPROCHE, T_CIBLELE, T_ET, T_EMOTE, T_OUI, T_OU, T_NON ]
	} 
)})
// objectifs de distances
function distanceMarbre(f,t) {
	return Math.abs(f.cX-t.cX) +  Math.abs(f.cY-t.cY)
}
const OBJECTIFSDISTANCE = []
for (let i = 0; i < MANNEQUINS.length; i++) {
	for (let j = 0; j < MANNEQUINS.length; j++) {
		if (i==j) continue
		let from = MANNEQUINS[i]
		let to = MANNEQUINS[j]
		let dist = distanceMarbre(from,to)
		OBJECTIFSDISTANCE.push(
			{
				timeout: (dist*2500+15000), valeur: dist, q: "combien de dalles en marbre séparent "+from.nom+" de "+to.nom+" (/crier nombre)", score: 2,
				tts: [ T_D, T_DALLESMARBRE, from.tts, T_DE, to.tts, T_SILENCE, T_FAISUNCRIER, T_NOMBRE ],
				ttsOk: [ T_TUASREUSSITAMISSION ],
				ttsPanique: [ T_DALLESMARBRE, from.tts, T_DE, to.tts, T_SILENCE, T_FAISUNCRIER, T_NOMBRE ]
			} 
		)
	}
}

// objectifs global de protction important global:true et caractristiques particuliers style desGlobal
const OBJECTIFSBARRIERE = []
MANNEQUINS.forEach( (m) => {OBJECTIFSBARRIERE.push( 
	{
		timeout: 30000, target: m, desGlobal: true, global:true, q: "Augmenter la résistance sur "+m.nom+" (/dés)", score: 2, clrRunes: true,
		// tts: pas de tts spécifique
	  tts: [ T_ALARME, T_URGENT, T_NACASTPOSSESSIONSUR, m.tts , T_APPROCHE, T_CIBLELE, T_LANCEUNDES, T_POURAUGMENTERSARESISTANCE ],
		// n/a ttsOk: [ T_BRAVO, T_TUASCONTRIBUEALAREUSSITE ],
		// n/a ttsKo: [ T_TUNASPASCONTRIBUE, T_ACETTEMISSION ],
	  // n/a ttsGlobal: [ T_D, T_URGENT, T_NACASTPOSSESSIONSUR, m.tts , T_APPROCHE, T_CIBLELE, T_LANCEUNDES, T_POURAUGMENTERSARESISTANCE ],
	  ttsPanique: [ m.tts, T_APPROCHE, T_CIBLELE, T_LANCEUNDES, T_POURAUGMENTERSARESISTANCE ],
	  ttsTimeout: [ T_LARESISTANCEDE, m.tts, T_NAPASETESUFFISANTE, T_SILENCE, m.tts, T_ASURVECU, T_MAIS, T_TUAS, T_PERDU, T_TES, T_RUNEDESCRUTATION ]
	} 
)})

// cas particulier de la pison des ames
const OBJECTIFPRISONPOSSIBLE = {
		timeout: 15000, desSolo: true, q: "Un nuage de Possession tente de pénétrer ton esprit (/dés >500)", score: 1, goPrison: true,
		tts: [ T_D, T_NUAGEDE500 ],
		ttsOk: [ T_NUAGEDISSIPE ],
		ttsGlobalKo: [ T_X_AETECAPTURE ],
		ttsKo: [ T_TONAMEENPRISON ],
		ttsPanique: [ T_NUAGEDE500 ]
} 
const OBJECTIFPRISON = {
		timeout: 45*60000, q: "En prison", score: 2, prison: true, obligatoire: true,
		tts: [ T_D, T_TONAMEENPRISON ],
		// ttsOk: [ T_ECHAPEPRISON ],
		ttsGlobalOk: [ T_X_SESTECHAPPEDEPRISON ],
		ttsKo: [ T_TONAMEENPRISON ],
		ttsPanique: [ T_TONAMEENPRISON ]
} 
// cas particulier du challenge en cas de nombre de runes suffisant
const OBJECTIFRUNESOK = {
		timeout: 500, q: "Runes obtenues", score: 0,
		ttsDelayed: [ T_TUASTROPDERUNESPOURDEMARRERUNCHALLENGESOLO, T_FAISUNEMOTEMOI ],
		ttsKo: "rien",
		ttsPanique: [ T_TUASTROPDERUNESPOURDEMARRERUNCHALLENGESOLO, T_FAISUNEMOTEMOI ]
} 

// objectifs spécifiques a faire en solo
const OBJECTIFSSOLO = [
			{
				timeout: 15000, dire: "yaouanck", q: "Quel mannequin porte une robe de bure? (/crier x)", score: 1,
				tts: [ T_D, T_QUELMANNEQUINPORTEUNEROBEDEBURE, T_SILENCE, T_FAISUNCRIER, T_AVECSONNOM  ],
				ttsOk: [ T_TUASREUSSITAMISSION ],
				ttsPanique: [ T_QUELMANNEQUINPORTEUNEROBEDEBURE ]
			}, 
			{
				timeout: 15000, valeur: 2, q: "Combien de joueurs de triple triade sont à coté de wonderkiki? (/crier nb)", score: 1,
				tts: [ T_D, T_COMBIENDEJOUEURSDETRIPLETRIADESONTACOTEDEWONDERKIKI, T_SILENCE, T_FAISUNCRIER, T_NOMBRE ],
				ttsOk: [ T_TUASREUSSITAMISSION ],
				ttsPanique: [ T_COMBIENDEJOUEURSDETRIPLETRIADESONTACOTEDEWONDERKIKI, T_SILENCE, T_FAISUNCRIER, T_NOMBRE  ]
			}, 
			{
				timeout: 15000, valeur: 9, q: "Combien de vitraux dans la chapelle? (/crier nb)", score: 1,
				tts: [ T_D, T_COMBIENDEVITRAUXSONTVISIBLESDANSLACHAPELLE , T_SILENCE, T_FAISUNCRIER, T_NOMBRE  ],
				ttsOk: [ T_TUASREUSSITAMISSION ],
				ttsPanique: [ T_COMBIENDEVITRAUXSONTVISIBLESDANSLACHAPELLE , T_SILENCE, T_FAISUNCRIER, T_NOMBRE ]
			}, 
			{
				timeout: 15000, valeur: 4, q: "Combien de lampes bleues sur le comptoir des fournisseurs (/crier nb)", score: 1,
				tts: [ T_D, T_COMBIENDELAMPESBLEUESSONTSURLECOMPTOIRDESFOURNISSEURS, T_SILENCE, T_FAISUNCRIER, T_NOMBRE ],
				ttsOk: [ T_TUASREUSSITAMISSION ],
				ttsPanique: [ T_COMBIENDELAMPESBLEUESSONTSURLECOMPTOIRDESFOURNISSEURS, T_SILENCE, T_FAISUNCRIER, T_NOMBRE  ]
			}, 
			{
				timeout: 15000, valeur: 4, q: "Combien de banquettes circulaires sont dans l'entrée (/crier nb)", score: 1,
				tts: [ T_D, T_COMBIENDEBANQUETTESCIRCULAIRESSONTDANSLENTREE , T_SILENCE, T_FAISUNCRIER, T_NOMBRE],
				ttsOk: [ T_TUASREUSSITAMISSION ],
				ttsPanique: [ T_COMBIENDEBANQUETTESCIRCULAIRESSONTDANSLENTREE, T_SILENCE, T_FAISUNCRIER, T_NOMBRE  ]
			}, 
			{
				timeout: 15000, dire: "rouge", q: "Quelle est la couleur des plus grands tapis (/crier x)", score: 1,
				tts: [ T_D, T_QUELLEESTLACOULEURDESPLUSGRANDSTAPIS , T_SILENCE, T_FAISUNCRIER, T_AVECLACOULEUR ],
				ttsOk: [ T_TUASREUSSITAMISSION ],
				ttsPanique: [ T_QUELLEESTLACOULEURDESPLUSGRANDSTAPIS , T_SILENCE, T_FAISUNCRIER, T_AVECLACOULEUR ]
			}, 
			{
				timeout: 15000, dire: "rouge", q: "Quelle est la couleur de Gilgamesh, en face de fleuraukiki (/crier x)", score: 1,
				tts: [ T_D, T_QUELLEESTLACOULEURDEGILGAMESHENFACEDEFLEUAUKIKI , T_SILENCE, T_FAISUNCRIER, T_AVECLACOULEUR ],
				ttsOk: [ T_TUASREUSSITAMISSION ],
				ttsPanique: [ T_QUELLEESTLACOULEURDEGILGAMESHENFACEDEFLEUAUKIKI, T_SILENCE, T_FAISUNCRIER, T_AVECLACOULEUR ]
			} 
]

/////////////////////////////////////////////////////////////////////////////////////////
// CHoix d'un nouvel objectif solo au hazard
/////////////////////////////////////////////////////////////////////////////////////////
function objectifAleatoire(tblObjectifs) {
	return tblObjectifs[ Math.floor(Math.random()*tblObjectifs.length) ]
}
function getNouvelObjectifSoloAleatoire(situation) {
	// pour test
	// return OBJECTIFSSOLO[6]
	const alea = Math.random()
	// prison possible (15%) --> prison 7% apres /dés
	if (alea < 0.15) return OBJECTIFPRISONPOSSIBLE
	// si assez de runes, pas de vrai mission solo
	if (situation.nbRunes >= SCRUTER_NBRUNES) return OBJECTIFRUNESOK
	// mission solo selon la proba
	// 12% pour chaque type
	if (alea < 0.27) return objectifAleatoire(OBJECTIFSCOULEUR)
	if (alea < 0.39) return objectifAleatoire(OBJECTIFSRACE)
	if (alea < 0.51) return objectifAleatoire(OBJECTIFSCHAPEAU)
	if (alea < 0.63) return objectifAleatoire(OBJECTIFSNOMBRIL)
	if (alea < 0.75) return objectifAleatoire(OBJECTIFSGANTS)
	// 10% pour objectif solo speciaux
	if (alea < 0.85) return objectifAleatoire(OBJECTIFSSOLO)
	// objectif distance par defaut 15%
	return objectifAleatoire(OBJECTIFSDISTANCE)
}

/////////////////////////////////////////////////////////////////////////////////////////
// CHoix d'un nouvel objectif global au hazard
/////////////////////////////////////////////////////////////////////////////////////////
function getNouvelObjectifGlobalAleatoire() {
	return objectifAleatoire(OBJECTIFSBARRIERE)
}

/////////////////////////////////////////
// verof de la complétion d'un objectif
/////////////////////////////////////////
const OBJ_RC_OK = 0
const OBJ_RC_UNDEF = 1				// pas de mission en cours
const OBJ_RC_BADTARGET = 2
const OBJ_RC_BADEMOTE = 3
const OBJ_RC_MAUVAISEREPONSE = 4
const OBJ_RC_NOTNEAR = 5
const OBJ_RC_TIMEOUT = 6
const OBJ_RC_PASDEMANDEEMOTE = 7
const OBJ_RC_PASDEMANDECRIER = 8
const OBJ_RC_PASDES = 9
const OBJ_RC_DESDEJALANCE = 10
			// --> situation.rc = OBJ_RC_PARTICIPATIONKO
			// --> situation.rc = OBJ_RC_PARTICIPATIONOK

// determine le TTS selon l'ECHEC de la mission
function getTTSFromRc(situation,rc) {
	switch (rc) {
		case OBJ_RC_BADTARGET:				return [ T_BADTARGET , situation.objectif.target.tts, T_ECHOUE ]
		case OBJ_RC_BADEMOTE:					return [ T_BADEMOTE, T_ECHOUE ] 
		case OBJ_RC_NOTNEAR:					return [ T_NOTNEAR , situation.objectif.target.tts, T_ECHOUE ]
		case OBJ_RC_TIMEOUT:					return situation.objectif.ttsTimeout || [ T_TEMPSDEPASSE, T_ECHOUE ]
		case OBJ_RC_PASDES:						return [ T_DESPASDEMANDE, T_ECHOUE ]
		case OBJ_RC_MAUVAISEREPONSE:	return [ T_MAUVAISEREPONSE, T_ECHOUE ]
		case OBJ_RC_PASDEMANDEEMOTE: 	return [ T_PASDEMANDEEMOTE, T_ECHOUE ]
		case OBJ_RC_PASDEMANDECRIER:	return [ T_PASDEMANDECRIER, T_ECHOUE ]
		default:											return [ T_NOTINCACHE, T_ECHOUE ]
	}
}

// cache les résultats par quantité
let ttsByVal = null
let ttsByValOther = null
async function defTTSQuantite() {
	ttsByVal = [
		T_AUCUNE, T_UNE, T_DEUX, T_TROIS, T_QUATRE,
		await tts.getTTS('5'), await tts.getTTS('6'), await tts.getTTS('7'), await tts.getTTS('8'), await tts.getTTS('9'),
		await tts.getTTS('10'), await tts.getTTS('11'), await tts.getTTS('12'), await tts.getTTS('13'), await tts.getTTS('14'),
		await tts.getTTS('15'), await tts.getTTS('16'), await tts.getTTS('17'), await tts.getTTS('18'), await tts.getTTS('19'),
		await tts.getTTS('20'), await tts.getTTS('21'), await tts.getTTS('22'), await tts.getTTS('23'), await tts.getTTS('24'),
		await tts.getTTS('25'), await tts.getTTS('26'), await tts.getTTS('27'), await tts.getTTS('28'), await tts.getTTS('29'),
		await tts.getTTS('30'), await tts.getTTS('31'), await tts.getTTS('32'), await tts.getTTS('33'), await tts.getTTS('34'),
		await tts.getTTS('35'), await tts.getTTS('36'), await tts.getTTS('37'), await tts.getTTS('38'), await tts.getTTS('39')
	]
	ttsByValOther = await tts.getTTS('beaucoup de')
}
defTTSQuantite()

// retourne le tts d'une quantité
function ttsQuantite(nb) {
	return (nb>=0 && nb<ttsByVal.length)? ttsByVal[nb] : ttsByValOther
}

// produit le tts de synthèse apres la fin d'un truc
function ttsSynthese(situation) {
	situation.syntheseDone = true
	// indique la synthèse: Quantité de runes
	wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_TUAS, ttsQuantite(situation.nbRunes) , T_RUNEDESCRUTATION] )
}
// test si c'est /des possible
function isObjectifDesPossible(situation) {
	const o= situation.objectif
	if (!o) return OBJ_RC_UNDEF
	if (!o.desSolo && !o.desGlobal) return OBJ_RC_PASDES
	if (situation.des) return OBJ_RC_DESDEJALANCE
	if (o.target && situation.target != o.target.nom) return OBJ_RC_BADTARGET
	if (o.target && !situation.nears.includes(o.target.nom) ) return OBJ_RC_NOTNEAR
	// si objectif et que target ok et dans les nears et que des possible ok...
	return OBJ_RC_OK
}
// test si c'est la bonne emote et option sur le bon perso
function isObjectifEmoteOk(situation,action) {
	const o= situation.objectif
	if (!o) return OBJ_RC_UNDEF
	if (!o.emote) return OBJ_RC_PASDEMANDEEMOTE
	if (o.target && situation.target != o.target.nom) return OBJ_RC_BADTARGET
	if (o.target && !situation.nears.includes(o.target.nom) ) return OBJ_RC_NOTNEAR
	if (o.emote != action.type) return OBJ_RC_BADEMOTE
	// si objectif et que target ok et dans les nears et que emote ok...
	return OBJ_RC_OK
}
// test si c'est la bon dire/valeur et option sur le bon perso
function isObjectifDireValeurOk(situation,action) {
	const o= situation.objectif
	if (!o) return OBJ_RC_UNDEF
	if (!o.dire && !o.valeur) return OBJ_RC_PASDEMANDECRIER
	if (o.target && situation.target != o.target.nom) return OBJ_RC_BADTARGET
	if (o.target && !situation.nears.includes(o.target.nom) ) return OBJ_RC_NOTNEAR
	// le mot doit etre le debut du dire requis
	if (o.dire && !o.dire.startsWith(action.mot.toLowerCase())) return OBJ_RC_MAUVAISEREPONSE
	// le mot doit etre le valeur requise
	if (o.valeur && o.valeur!=parseInt(action.mot,10)) return OBJ_RC_MAUVAISEREPONSE
	// si objectif et que target ok et dans les nears et que dire ok...
	return OBJ_RC_OK
}

// positionne le choix d'un objectif au prochain timer
function setObjectifNextTimer(situation,delai) {
	// objectif suivant sur timer
	situation.objectif = null
	situation.echeance = Date.now() + ((delai)? delai : TIMER_RELAXKO) // possibilité de prochain challenge
}

// positionne un objectif solo
// delayed indique l'annonce n'est pas urgente
function setObjectif(situation,objectif) {
	situation.rc=null
	situation.tictacDone = null
	situation.syntheseDone = null
	situation.des = null
	situation.objectif = objectif
	situation.echeance = Date.now() + ( (objectif.timeout)? objectif.timeout : TIMER_OBJDEFAUT)
	if (objectif.tts) wsserver.targetSimpleOp(situation.pseudo, "ttsNow", objectif.tts )
	if (objectif.ttsDelayed) wsserver.targetSimpleOp(situation.pseudo, "tts", objectif.ttsDelayed )
}

// positionne un objectif commun
function setObjectifGlobal(image,objectif) {
	// init element d'objectif commun
	image.sommeDes = 0
	Object.values(image.situations).forEach( (situation) => {
		// defini l'objecif sauf si objectif actuel obligatoire
		if (!situation.objectif || !situation.objectif.obligatoire ) setObjectif(situation,objectif)
	})
	if (objectif.ttsGlobal) wsserver.broadcastSimpleOp("ttsNow", objectif.ttsGlobal )
}

// marque l'objectif commun comme ok depuis le joueur du a fait gagner
function setObjectifGlobalDesOk(image,orgSituation,objectif) {
	wsserver.broadcastSimpleOp("ttsNow", [ T_BRAVO, orgSituation.objectif.target.tts, T_ARESISTEAUCAST ])
	Object.values(image.situations).forEach( (situation) => {
		if (situation.objectif==objectif) {
			// situation concernée par l'objectif global
			let rc= isObjectifDesPossible(situation)
			wsserver.targetSimpleOp(situation.pseudo,"tts",(rc==OBJ_RC_DESDEJALANCE)? [ T_TUASCONTRIBUEALAREUSSITE ]  : [ T_TUNASPASCONTRIBUE, T_ACETTEMISSION ] )
			setObjectifOk(image,situation,true)
		}
	})
}

// marque l'objectif atuel ok et passe a la suite
// si ttsQueued, poste le tts en queue sinon immediat
function setObjectifOk(image,situation,ttsQueued) {
	situation.tictacDone = null
	if (situation.objectif.ttsGlobalOk) wsserver.broadcastSimpleOp("tts", [ situation.ttsPseudo, ...situation.objectif.ttsGlobalOk] )
	if (situation.objectif.ttsOk) wsserver.targetSimpleOp(situation.pseudo,(ttsQueued)? "tts" : "ttsNow", situation.objectif.ttsOk )
	// ajoute le score de l'objectif
	if (situation.objectif && situation.objectif.score) situation.score += situation.objectif.score
	// objectif OK, obtient une rune si le max perso n'est pas atteint
	if (situation.nbRunes < SCRUTER_NBRUNES) {
		situation.nbRunes++	
		situation.nbReqScruter = getNbRunesPourScruter(situation)
		ttsSynthese(situation)
	}
	if (situation.nbRunes >= SCRUTER_NBRUNES)
		wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_PLUSOBTENIRRUNESSOLOS ] )

	// objectif suivant sur timer
	setObjectifNextTimer(situation, TIMER_RELAXOK)
}

// marque l'objectif atuel ko et passe a la suite ou reste sur cet objectif si il est obligatoire
// si ttsQueued, poste le tts en queue sinon immediat
// si noclear, ne supprime pas les runes possédées
function setObjectifKo(image,situation,ttsQueued,noClear) {
	situation.tictacDone = null
	// console.log("SITUATION:",situation.objectif,situation.objectif.obligatoire)
	// informe de l'échec selon le rc avec priorité, si ttsKo présent utilise ttsKo sauf si c'est rien et dans ce cas, pas de tts
	if (situation.objectif.ttsGlobalKo) wsserver.broadcastSimpleOp("tts", [situation.ttsPseudo, ...situation.objectif.ttsGlobalKo] )
	if (situation.objectif.ttsKo != "rien")
		wsserver.targetSimpleOp(situation.pseudo,(ttsQueued)? "tts" : "ttsNow", situation.objectif.ttsKo || getTTSFromRc(situation,situation.rc))
	// si effacement des runes en cas d'echec sauf si "echec partiel" ou pas de runes
	if (situation.objectif.clrRunes && !noClear && situation.nbRunes > 0) {
		situation.nbRunes = 0
		situation.nbReqScruter = getNbRunesPourScruter(situation)
		// le tts associé est dans le rc timeout wsserver.targetSimpleOp(situation.pseudo, "tts", [ T_TUAS, T_PERDU, T_TES, T_RUNEDESCRUTATION ] )
	}
	// objectif obligatoire?
	if (situation.objectif.obligatoire) {
		// objectif obligatoire
		wsserver.targetSimpleOp(situation.pseudo,"tts",[ T_TUDOISREUSSIR, T_REECOUTEMISSION ])
		situation.echeance = Date.now() + (situation.objectif.timeout || TIMER_RELAXOK) // delai pour ce challenge
	}
	else if (situation.objectif.goPrison) {
		// passage en prison
		setObjectif(situation,OBJECTIFPRISON)
		wsserver.broadcastSimpleText(situation.pseudo+" en prison des âmes")
		wsserver.targetSimpleOp(situation.pseudo,"goPrison")
	}
	else 
		setObjectifNextTimer(situation)
}

// positionne un objectif global aleatoire
function setObjectifGlobalAleatoire() {
	const image = igImage.getImage()
	image.lastGlobalDth=Date.now()
	setObjectifGlobal(image,getNouvelObjectifGlobalAleatoire())
	return true
}
/////////////////////////////////////////
// gestion runes omega
/////////////////////////////////////////

function addRuneOmega(image,situation) {
	situation.nbScruter++
	image.omega.runes.push( { pseudo: situation.pseudo, dth: Date.now() } )
	if (image.omega.runes.length >= OMEGA_NBRUNES) {
		// toutes les runes omegas sont trouveés, challenge terminé
		challengeEnd()
	}	
	collections.save(image.omega)
}

function resetRuneOmega(image) {
	image.omega = collections.reset('runes_omega')
	image.omega.runes = new Array()
	collections.save(image.omega)
}

// retourne le nb de runes requises pour scruter
function getNbRunesPourScruter(situation) {
	return Math.min(SCRUTER_NBRUNES +  SCRUTER_NBRUNESPAR*situation.nbScruter,SCRUTER_NBRUNESMAX)
}

/////////////////////////////////////////
// actions diverses
/////////////////////////////////////////

function paniquer(image,situation) {
	// tts panique si objectif
	if (situation.objectif) {
		wsserver.targetSimpleOp(situation.pseudo,"ttsNow", situation.objectif.ttsPanique)
	}
	else {
		wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_PASDEMISSION ] )
		ttsSynthese(situation)
	}
	return false
}

// donner une rune a qqun, retourne le flagSynch
function donnerRune(image,situation) {
	// verif pas de mission
	if (situation.objectif) { wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ T_TUASUNEMISSIONENCOURS, ...situation.objectif.ttsPanique ] ); return false }
	// verfi qu'une rune possédés
	if (situation.nbRunes <= 0) { wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ T_TUNASPASDERUNEDESCRUTATION ] ); return false }
	// choisir le destinataire
	const dest =igImage.getSituationByNomIG(situation.target)
	if (!dest) { wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ T_TUNASPASCIBLEUNJOUEUR ] ); return false }
	// verif du nombre de runes de la destination
	if (dest.nbRunes < DONNER_NBRUNESREQUISES) { wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ dest.ttsPseudo, T_X_NESTPASENCONDITIONPOURRECEVOIRTESRUNES ] ); return false }
	// calcul donner, perdu, recu
	const nbDonner = Math.min(situation.nbRunes,DONNER_MAXDONNER)
	const nbPerdu = Math.floor(nbDonner * (Math.random() * DONNER_COEFPERDU))
	const nbRecu = nbDonner - nbPerdu
	// faire le donner
	situation.nbRunes -= nbDonner
	situation.nbRunesDonnees += nbDonner
	situation.nbReqScruter = getNbRunesPourScruter(situation)
	dest.nbRunes += nbRecu
	dest.nbRunesRecues += nbRecu
	dest.nbReqScruter = getNbRunesPourScruter(dest)
	setObjectifNextTimer(situation)
	// tts
	wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ T_TUAS, T_DONNER, ttsQuantite(nbDonner) , T_RUNEDESCRUTATION, T_A, dest.ttsNomIg ] )
	wsserver.targetSimpleOp(dest.pseudo,"tts", [ T_TUAS, T_RECU, ttsQuantite(nbRecu), T_RUNEDESCRUTATION, T_DEUX, tts.getMP3(situation.nomIG) ] )
	if (nbPerdu > 0) {
		 let ttsPerdu = [ T_SILENCE, T_HELAS, ttsQuantite(nbPerdu), (nbPerdu>1)? T_ONTETEPERDU: T_AETEPERDU ]
		 wsserver.targetSimpleOp(situation.pseudo,"tts", ttsPerdu  )
		 // ***** wsserver.targetSimpleOp(dest.pseudo,"tts", ttsPerdu )
	}
	return true
}

function scruter(image,situation) {
	// verif pas de mission
	if (situation.objectif) { wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ T_TUASUNEMISSIONENCOURS, ...situation.objectif.ttsPanique ] ); return false }
	// nombre de rune requises
	const nbReqRunes= getNbRunesPourScruter(situation)
	// verif nombre de rune
	if (situation.nbRunes < nbReqRunes) {
		wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ T_TUNASPAS, ttsQuantite(nbReqRunes), T_RUNEDESCRUTATION, T_SEULEMENT, ttsQuantite(situation.nbRunes)] )
		return false
	}
	// retire les runes
	situation.nbRunes -= nbReqRunes
	// lance le scruter
	if (Math.random() < SCRUTER_ALEA) {
		// scruter ok
		wsserver.broadcastSimpleOp("tts", [ T_BRAVO, situation.ttsPseudo, T_ATROUVEUNERUNEOMEGA ] )
		// ajoute un rune omega
		addRuneOmega(image,situation)
		wsserver.broadcastSimpleText("Rune Omega découverte!")
	}
	else {
		// scruter fail
		wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ T_HELASTUNASPASTROUVERDERUNEOMEGA ] )
	}
	// recalcul du nbReqScruter
	situation.nbReqScruter = getNbRunesPourScruter(situation)
	// challenge au timer
	setObjectifNextTimer(situation)
	return true
}

function questionner(image,situation) {
	return false
}

function somnoler(image,situation) {
	// si deja utilisé...
	if (situation.dejaSomnoler) { wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_TUASDEJAUTILISECEJOKER ] ); return false }
	// si trop utilisé...
	if (image.nbSomnoler >= SOMNOLER_NBMAX)  { wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_IMPOSSIBLE, T_SILENCE, ttsQuantite(image.nbSomnoler), T_PAUSESONTDEJAETEDEMANDEES ] ); return false }
	// si le challeng n'est pas en mode run
	if (challengeStatus != CHALLENGE_RUN) { wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_CENESTPASLEBONMOMENT ] ); return false }
	challengePause(situation)
	situation.dejaSomnoler = true
	image.nbSomnoler++
	return true
}

function etirer(image,situation) {
	// si deja utilisé...
	if (situation.dejaEtirer) { wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_TUASDEJAUTILISECEJOKER ] ); return false }
	// si le challeng n'est pas en mode pause ou que deja demander somnoler
	if ( !situation.dejaSomnoler || challengeStatus != CHALLENGE_PAUSE) { wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_CENESTPASLEBONMOMENT ] ); return false }
	challengeStart(situation)
	situation.dejaEtirer = true
	return true
}

function signe(image,situation) {
	if (situation.objectif) { wsserver.targetSimpleOp(situation.pseudo,"ttsNow", [ T_TUASUNEMISSIONENCOURS, ...situation.objectif.ttsPanique ] ); return false }
	// le joueur demande à recevoir des runes, verif qu'il en as au moins 2
	if (situation.nbRunes < SIGNE_NBRUNESREQUISES)  { 
		// tu as XX runes de scrutation, pas suffisant
		ttsSynthese(situation)
		wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_CENESTPASSUFFISANTPOURENDEMANDER ] )
		return false
	}
	// joueur souhaite recevoir des runes de scrutation
	wsserver.broadcastSimpleOp("tts", [  situation.ttsPseudo, T_SOUHAITERECEVOIRDESRUNESDESCRUTATION ] )
	wsserver.broadcastSimpleText(situation.pseudo+" demande des runes.")
	return false
}

function moi(image,situation) {
	// le joueur demande à avoir des infos actuelles
	// indique le nomre de runes pour un scruter
	wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_SILENCE, T_ILTEFAUT, ttsQuantite(getNbRunesPourScruter(situation)) , T_RUNEPOURSCRUTER ] )
	// indique si il peut revoir/donner des runes
	// wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_SILENCE, ( situation.nbRunes < SIGNE_NBRUNESREQUISES)? T_TUNASPAS : T_TUAS , T_ASSEZ, T_DEUX, T_RUNE, T_POURENDEMANDER ] )
	if (situation.nbRunes >= SIGNE_NBRUNESREQUISES) wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_SILENCE, T_TUPEUXDEMANDERDESRUNES ] )
	if (situation.nbRunes > 1) wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_SILENCE, T_TUPEUXDONNERTESRUNES ] )
	// indiue le nombre de runces actuelles
	ttsSynthese(situation)
	return false
}

/////////////////////////////////////////
// callback pour le challenge spartaci
/////////////////////////////////////////
// normalize de l'image avec ajout des elements complementaires
async function normalize(image) {
	image.nbScruter ??= 0
	image.nbSomnoler ??= 0
	image.omega = collections.get('runes_omega',true)
	image.omega.runes ??= new Array()
	image.effectiveStartDth = EFFECTIVESTARTDTH
	image.lastGlobalDth ??= Date.now()
}
// Initiation de l'image
async function cbInit(image) {
	normalize(image)
}
// Arrivéee d'un nouveau joueur IG (définition dans le serveur)
async function cbNew(image,situation) {
	// init de la situation
	situation.score = 0
	situation.nbScruter ??= 0
	situation.nbRunes ??= 0 // nombre de runes
	situation.nbReqScruter = getNbRunesPourScruter(situation)
}
// nouvel event IG idu joueur situation, detail dans action
// return true si besoin de resynch clients
async function cbEvent(image,situation,action) {
	let flagResynch = false
	switch(action.type) {
		case "panique": // replay le dernier TTS
			flagResynch = paniquer(image,situation)
			break;
		case "questionner": // a definir
			flagResynch = questionner(image,situation)
			break;
		case "somnoler": // pause du challenge
			flagResynch = somnoler(image,situation)
			break;
		case "etirer": // redemarrage du challenge
			flagResynch = etirer(image,situation)
			break;
		case "signe": // demande de don de rune
			flagResynch = signe(image,situation)
			break;
		case "moi": // introspection du scruter etc...
			flagResynch = moi(image,situation)
			break;
		case "encourage": // emote indique la participation
		case "oui": // emote
		case "non": // emote
		case "dire": // expression d'un dire avec un mot ou une valeur numerique
			// si joueur en prison
			if (situation.objectif && situation.objectif.prison) {
				wsserver.targetSimpleOp(situation.pseudo,"ttsNow", situation.objectif.ttsPanique )
				break;
			}
			// joueur pas en prison
			situation.rc = (action.type=="dire")? isObjectifDireValeurOk(situation,action) : isObjectifEmoteOk(situation,action)
			switch(situation.rc) {
				case OBJ_RC_OK:
					setObjectifOk(image,situation)
					flagResynch = true
					break
				case OBJ_RC_BADTARGET:
					wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_BADTARGET, situation.objectif.target.tts ] )
					break
				case OBJ_RC_NOTNEAR:
					wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_NOTNEAR, situation.objectif.target.tts ] )
					break
				case OBJ_RC_UNDEF:
					wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_PASDEMISSION ] )
					break
				default:
					setObjectifKo(image,situation)
					flagResynch = true
			}
			break;
		case "donner": // emote pour donner une rune a qqun
			flagResynch = donnerRune(image,situation)
			break;
		case "scruter": // emote
			flagResynch = scruter(image,situation)
			break;
		case "dés": // tirage de des
			if (situation.objectif && situation.objectif.prison) {
				wsserver.targetSimpleOp(situation.pseudo,"ttsNow", situation.objectif.ttsPanique)
				break;
			}
			situation.rc = isObjectifDesPossible(situation)
			switch(situation.rc) {
				case OBJ_RC_OK:
					if (situation.objectif.desSolo) {
						if (action.tirage > 500) 
							setObjectifOk(image,situation)
						else
							setObjectifKo(image,situation)
					}
					else
					if (situation.objectif.desGlobal) {
						situation.des = action.tirage
						image.sommeDes ??= 0
						image.sommeDes += action.tirage
						// console.log("Event DES GLOBAL", image.sommeDes, igImage.getNbSituations() )
						if (image.sommeDes > (GLOBALDES_TIRAGEMOYEN*(igImage.getNbSituations()-1)) ) {
							// assez de /dés pour déblocage
							// positionne l'objectif comme atteint
							setObjectifGlobalDesOk(image,situation,situation.objectif)
						}
						else {
							// pas encore assez de /dés
							wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_TUASAUGMENTELARESISTANCEDE, situation.objectif.target.tts ] )
						}
					}
					flagResynch = true
					break
				case OBJ_RC_BADTARGET:
					wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_BADTARGET, situation.objectif.target.tts ] )
					break
				case OBJ_RC_NOTNEAR:
					wsserver.targetSimpleOp(situation.pseudo,"tts", [ T_NOTNEAR, situation.objectif.target.tts ] )
					break
				case OBJ_RC_DESDEJALANCE:
					wsserver.targetSimpleOp(situation.pseudo,"tts", T_DESDEJALANCE )
					break
				case OBJ_RC_UNDEF:
					wsserver.targetSimpleOp(situation.pseudo,"tts", T_PASDEMISSION )
					break
				default:
					setObjectifKo(image,situation)
					flagResynch = true
			}
			break;
		case "newPlayer": // nouveau joeur validé dans une nouvelle zone (NB: ajoute le nomIG/pseudo dans la table TTS)
			situation.ttsNomIg = await tts.getTTS(situation.nomIG)
			situation.ttsPseudo = await tts.getTTS(situation.pseudo)
			wsserver.broadcastSimpleOp("tts",[tts.getMP3('bienvenue'),situation.ttsNomIg])
			setObjectif(situation, OBJECTIFBIENVENUE )
			flagResynch = true
			break;
		default:
			console.error("erreur de type d'action",situation.nomIG,action.type)
	}
	return flagResynch
}
/////////////////////////////////////////
// traitement périodique
/////////////////////////////////////////
function doTimer(image) {
	// console.log('doTimer',challengeStatus, (image)? "imageok":"imagenull" )
	
	// si le challeng n'est pas en cours on ne fait rien
	if (challengeStatus!=CHALLENGE_RUN) return

	// reference temporelle
	const now = Date.now()

	// si necessite de challenge global... (admin peut le forcer)
	if (now > image.lastGlobalDth+GLOBAL_MAXDELAI) {
		setObjectifGlobalAleatoire()
		return true
	}

	// resynchro toutes les situations si besoin
	let flagResynch=false
	Object.values(image.situations).forEach( (situation) => {
		// si objectif défini
		if (situation.objectif) {
			// si objectif et échéance dépasse
			if (situation.echeance && situation.echeance <= now) {
				// objectif raté car timeout
				situation.rc= OBJ_RC_TIMEOUT
				setObjectifKo(image,situation)
				flagResynch=true
			}
			else if (!situation.objectif.global && !situation.tictacDone && (situation.echeance-DELAY_TICTAC <= now) ) {
				// pas objectif global et si moins de 6 secondes..
				situation.tictacDone=true
				wsserver.targetSimpleOp(situation.pseudo,"tts", T_TICTAC)
			}
		}
		else if (situation.echeance && situation.echeance <= now) {
			// si pas d'objectif et echeance, nouvel objectif
				setObjectif(situation,getNouvelObjectifSoloAleatoire(situation))
				flagResynch=true
		}
	})
	return flagResynch
}
/////////////////////////////////////////
// Etat du challenge
/////////////////////////////////////////
const CHALLENGE_INIT = 0
const CHALLENGE_RUN = 1
const CHALLENGE_PAUSE = 2
const CHALLENGE_END = 3
let challengeStatus = CHALLENGE_INIT
// demande de start par admin ou par un joueur de situation
function challengeStart(situation) {
	// date du "dernier" challenge global apres démarrage
	igImage.getImage().lastGlobalDth = Date.now() - GLOBAL_MAXDELAI / 2
	challengeStatus = CHALLENGE_RUN
	wsserver.broadcastSimpleOp("tts",[tts.getMP3('challengeencours')])
	return "ok"
}
// demande de pause par admin ou par un joueur de situation
function challengePause(situation) {
	challengeStatus = CHALLENGE_PAUSE
	if (situation)
		wsserver.broadcastSimpleOp("tts",[T_PAUSEDEMANDEEPAR, situation.ttsNomIg ])
	else
		wsserver.broadcastSimpleOp("tts",[tts.getMP3('challengeenpause')])
	return "ok"
}
function challengeEnd() {
	wsserver.broadcastSimpleOp("ttsNow", [ T_TOUTESLESRUNESTROUVEES, T_CHALLENGETERMINE ] )
	wsserver.broadcastSimpleText("Le challenge est terminé.")
	challengeStatus = CHALLENGE_END
	// bloque toutes les challenges des situations
	igImage.getSituations().forEach( (situation) => setObjectif(situation,OBJECTIFFINI) )
	return "ok"
}
function challengeReset() {
	igImage.resetImage()
	normalize(igImage.getImage())
	igImage.synchClients()
	challengeStatus = CHALLENGE_INIT
	return "ok"
}

/////////////////////////////////////////
// requete web
/////////////////////////////////////////
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // pseudo valide & crypto ok
	switch (method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH, DELETE');
			gbl.exception("AllowedCORS",200);
		case "GET":
			switch(reqPaths[2]) {
				case "igImage":
					gbl.exception( igImage.getImage(), 200)
				case "escapePrison":
					let situation = igImage.getSituationByPseudo(pseudo)
					if (!situation || !situation.objectif || !situation.objectif.prison) gbl.exception("prison=false",400);
					// sortie de prison
					setObjectifOk(igImage,situation)
					igImage.synchClients()
					gbl.exception( "via ws", 200)
			}
			gbl.exception("bad op get",400)
		case "PUT":
			pseudos.check(pseudo,pwd,true); // admin only
			switch(reqPaths[2]) {
				case "reset":
					gbl.exception(challengeReset() ,200)
				case "resetRunes":
					resetRuneOmega(igImage.getImage())
					igImage.synchClients()
					gbl.exception("via ws" ,200)
				case "start":
					gbl.exception(challengeStart() ,200)
				case "schedStart":
					igImage.getImage().effectiveStartDth = (reqPaths[3]=="now") ? Date.now() + 30*1000 : EFFECTIVESTARTDTH
					igImage.synchClients()
					gbl.exception("via ws" ,200)
					gbl.exception(challengeStart() ,200)
				case "pause":
					gbl.exception(challengePause() ,200)
				case "end":
					challengeEnd();
					igImage.synchClients()
					gbl.exception("ok",200)
				case "global":
					setObjectifGlobalAleatoire()
					igImage.synchClients()
					gbl.exception("ok",200)
			}
			gbl.exception("bad op put",400)
		case "POST":
			pseudos.check(pseudo,pwd,true); // admin only
			let bodyParams = JSON.parse(body)
			switch(reqPaths[2]) {
				case "igEvent": {
					// simulation d'un event depuis le kikiBridge
					console.log("Simulation igEvent",bodyParams)
					if (!bodyParams.action || !bodyParams.p || !bodyParams.n) gbl.exception("adm bad param n/p/action",200)
					let image = igImage.getImage()
					if (!image) gbl.exception("adm pas d'image",200)
					let situation = igImage.getSituationByNomIG(bodyParams.p+" "+bodyParams.n)
					if (!situation) gbl.exception("adm pas de situation pour le nom",200)
					situation.target = bodyParams.target
					situation.nears = bodyParams.nears
					if (await cbEvent(image,situation,bodyParams.action)) igImage.synchClients()
					gbl.exception("event post ok",200)
				}
				case "mute": {
					let situation = igImage.getSituationByNomIG(bodyParams.nomIG)
					if (!situation) gbl.exception("not in image:"+bodyParams.nomIG,400)
					setObjectif(situation,OBJECTIFPAUSE)
					igImage.synchClients()
					gbl.exception("mute post ok",200)
				}
				case "unmute": {
					let situation = igImage.getSituationByNomIG(bodyParams.nomIG)
					if (!situation) gbl.exception("not in image:"+bodyParams.nomIG,400)
					setObjectif(situation,OBJECTIFBIENVENUE)
					igImage.synchClients()
					gbl.exception("demute post ok",200)
				}
				case "setRunes": {
					let situation = igImage.getSituationByNomIG(bodyParams.nomIG)
					let nbRunes = bodyParams.nbRunes
					if (!situation) gbl.exception("not in image:"+bodyParams.nomIG,400)
					situation.nbRunes =  nbRunes
					situation.nbReqScruter = getNbRunesPourScruter(situation)
					igImage.synchClients()
					gbl.exception("setRunes post ok",200)
				}
				case "clrMission": {
					let situation = igImage.getSituationByNomIG(bodyParams.nomIG)
					setObjectif(situation,OBJECTIFRUNESOK)
					igImage.synchClients()
					gbl.exception("setRunes post ok",200)
				}
			}
			gbl.exception("bad op PATCH",400)
		case "DELETE":
			gbl.exception("bad op DELETE",400)
	}
	gbl.exception("bad meth",400)
}


// init la prise d'image avec callbacks
igImage.init(cbInit,cbNew,cbEvent,doTimer)

console.log("spataci loaded");
