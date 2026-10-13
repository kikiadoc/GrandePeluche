
const gbl = require('../infraback/gbl.js');
const collections = require('../infraback/collections.js');
const wsserver = require('../infraback/wsserver.js');
const pseudos = require('../infraback/pseudos.js');

let initStatus = [
	{ x: 22.3, y: 26.2, zone: "Forêt de l'est"         ,l:  0, pub: { tLoc: 20, d:0.1, txt: "#1"  , tTime:"0:00:20", r:"∀" } },
	{ x: 21.8, y: 17.8, zone: "Il mheg"                ,l:  1, pub: { tLoc: 30, d:0.1, txt: "#2"  , tTime:"0:00:20", r:"∂" } },
	{ x: 21.5, y: 38.5, zone: "Kholusia"               ,l:  2, pub: { tLoc: 13, d:0.1, txt: "#3"  , tTime:"0:00:20", r:"Ж" } },
	{ x: 18.5, y: 14.6, zone: "Noscéa centrale"        ,l:  3, pub: { tLoc: 25, d:0.1, txt: "#4"  , tTime:"0:00:30", r:"Љ" } },
	{ x: 30.3, y: 24.2, zone: "Haute noscéa"           ,l:  4, pub: { tLoc: 17, d:0.1, txt: "#5"  , tTime:"0:00:40", r:"Ф" } },
	{ x: 17.5, y: 25.3, zone: "Avant-pays Dravanien"   ,l:  5, pub: { tLoc: 29, d:0.1, txt: "#6"  , tTime:"0:00:40", r:"Ҕ" } },
	{ x: 31.4, y: 36.8, zone: "Coerthas occidental"    ,l:  6, pub: { tLoc: 24, d:0.1, txt: "#7"  , tTime:"0:00:52", r:"б" } },
	{ x: 22.6, y: 30.6, zone: "Thanalan septentrional" ,l:  7, pub: { tLoc:  5, d:0.1, txt: "#8"  , tTime:"0:00:52", r:"Ѭ" } },
	{ x: 13.0, y: 34.5, zone: "Les Lacs"               ,l:  8, pub: { tLoc: 18, d:0.1, txt: "#9"  , tTime:"0:01:09", r:"П" } },
	{ x:  6.1, y: 24.7, zone: "Les Steppes d'Azim"     ,l:  9, pub: { tLoc: 26, d:0.1, txt: "#10" , tTime:"0:01:09", r:"Ђ" } },
	{ x: 22.3, y: 11.6, zone: "Mer de rubis"           ,l: 10, pub: { tLoc:  3, d:0.1, txt: "#11" , tTime:"0:01:09", r:"Я" } },
	{ x: 13.8, y:  8.5, zone: "Khugane"                ,l: 11, pub: { tLoc:  8, d:0.1, txt: "#12" , tTime:"0:01:09", r:"Ѩ" } },
	{ x: 16.6, y: 28.7, zone: "Forêt du nord"          ,l: 12, pub: { tLoc: 34, d:0.1, txt: "#13" , tTime:"0:01:09", r:"Ѯ" } },
	{ x: 22.1, y:  5.1, zone: "Mor Dhona"              ,l: 13, pub: { tLoc: 14, d:0.1, txt: "#14" , tTime:"0:01:09", r:"Ӣ" } },
	{ x: 28.8, y: 24.6, zone: "Noscéa orientale"       ,l: 14, pub: { tLoc:  6, d:0.1, txt: "#15" , tTime:"0:01:09", r:"Ӹ" } },
	{ x: 26.7, y: 21.1, zone: "Forêt centrale"         ,l: 15, pub: { tLoc: 31, d:0.1, txt: "#16" , tTime:"0:01:09", r:"ͼ" } },
	{ x: 36.6, y: 16.3, zone: "Thavnair"               ,l: 16, pub: { tLoc: 35, d:0.1, txt: "#17" , tTime:"0:01:45", r:"Δ" } },
	{ x:  5.0, y:  3.4, zone: "Doma"                   ,l: 17, pub: { tLoc:  2, d:0.1, txt: "#18" , tTime:"0:01:45", r:"σ" } },
	{ x: 23.8, y:  9.3, zone: "Azys Lla"               ,l: 18, pub: { tLoc: 36, d:0.1, txt: "#19" , tTime:"0:01:45", r:"ͻ" } },
	{ x: 39.8, y: 18.8, zone: "Azys Lla"               ,l: 19, pub: { tLoc: 33, d:0.1, txt: "#20" , tTime:"0:01:45", r:"Π" } },
	{ x: 31.8, y: 39.3, zone: "Pays Dravanien"         ,l: 20, pub: { tLoc: 38, d:0.1, txt: "#21" , tTime:"0:02:08", r:"γ" } },
	{ x: 12.8, y:  9.4, zone: "Kholusia"               ,l: 21, pub: { tLoc:  7, d:0.1, txt: "#22" , tTime:"0:02:08", r:"ε" } },
	{ x: 31.0, y: 15.3, zone: "Les Pics"               ,l: 22, pub: { tLoc: 21, d:0.1, txt: "#23" , tTime:"0:02:19", r:"θ" } }, //
	{ x: 33.4, y: 28.7, zone: "Elpis"                  ,l: 23, pub: { tLoc: 37, d:0.1, txt: "#24" , tTime:"0:02:31", r:"λ" } },
	{ x: 32.4, y: 25.3, zone: "Arr Pays Dravanien"     ,l: 24, pub: { tLoc:  0, d:0.1, txt: "#25" , tTime:"0:02:31", r:"ξ" } },
	{ x: 38.5, y: 12.7, zone: "Pays Dravanien"         ,l: 25, pub: { tLoc: 28, d:0.1, txt: "#26" , tTime:"0:02:31", r:"փ" } },
	{ x: 17.0, y: 22.1, zone: "Coerthas occidental"    ,l: 26, pub: { tLoc:  9, d:0.1, txt: "#27" , tTime:"0:02:31", r:"֍" } },
	{ x: 20.4, y: 21.3, zone: "Noscéa orientale"       ,l: 27, pub: { tLoc:  1, d:0.1, txt: "#28" , tTime:"0:02:53", r:"ք" } },
	{ x: 17.8, y: 30.4, zone: "Forêt du sud"           ,l: 28, pub: { tLoc: 15, d:0.1, txt: "#29" , tTime:"0:02:53", r:"Ϗ" } },
	{ x: 22.8, y: 21.1, zone: "Thanalan oriental"      ,l: 29, pub: { tLoc: 32, d:0.1, txt: "#30" , tTime:"0:02:53", r:"Ϣ" } },
	{ x: 34.8, y: 18.2, zone: "Les marges"             ,l: 30, pub: { tLoc: 23, d:0.1, txt: "#31" , tTime:"0:02:53", r:"Ϯ" } },
	{ x: 28.6, y: 27.4, zone: "Forêt du nord"          ,l: 31, pub: { tLoc: 39, d:0.1, txt: "#32" , tTime:"0:03:18", r:"Ώ" } },
	{ x: 33.7, y: 22.9, zone: "Ecume de Dravania"      ,l: 32, pub: { tLoc: 12, d:0.1, txt: "#33" , tTime:"0:03:18", r:"Ξ" } },
	{ x: 17.4, y: 26.3, zone: "Forêt de l'est"         ,l: 33, pub: { tLoc: 19, d:0.1, txt: "#34" , tTime:"0:03:18", r:"β" } },
	{ x: 22.5, y: 23.2, zone: "Mare Lamentorum"        ,l: 34, pub: { tLoc: 11, d:0.1, txt: "#35" , tTime:"0:03:34", r:"α" } },
	{ x: 14.6, y: 18.8, zone: "Thanalan occidental"    ,l: 35, pub: { tLoc: 27, d:0.1, txt: "#36" , tTime:"0:03:34", r:"Ϡ" } },
	{ x: 20.5, y: 26.0, zone: "Thanalan occidental"    ,l: 36, pub: { tLoc: 10, d:0.1, txt: "#37" , tTime:"0:03:34", r:"Ͷ" } },
	{ x: 37.2, y: 25.1, zone: "Ultima Thule"           ,l: 37, pub: { tLoc:  4, d:0.1, txt: "#38" , tTime:"0:03:34", r:"δ" } },
	{ x:  9.9, y: 13.8, zone: "Brumée"                 ,l: 38, pub: { tLoc: 22, d:0.1, txt: "#39" , tTime:"0:03:34", r:"ΰ" } },
	{ x: 12.2, y: 12.0, zone: "Hisgard l'assise"       ,l: 39, pub: { tLoc: 16, d:0.1, txt: "#40" , tTime:"0:03:34", r:"Ϣ" } }
];

let questions = [
 { c:"Chambre du temps"          ,r:0,q:"A coté de quel pnj est L'orchestion de table?"                                           ,p:["Eon","Chronos","Kairos"] },
 { c:"Chambre du temps"          ,r:1,q:"A coté de quel pnj est le livre de correspondance?"                                      ,p:["Eon","Chronos","Kairos"] },
 { c:"Chambre du temps"          ,r:2,q:"Combien y a-t-il d'horloges sur le mur derrière Kairos?"                                 ,p:[1,2,3,4,5,6] },
 { c:"Chambre du temps"          ,r:3,q:"Combien de piédestaux dans la salle de Kairos"                                           ,p:[3,6,9,12,15] },
 { c:"Chambre du temps"          ,r:3,q:"Combien de torches murales EN TOUT derrière Eon, Chronos et Kairos"                      ,p:[1,2,3,4,5,6] },
 { c:"Le pont de l'Enterprise"   ,r:0,q:"Quel est la couleur de l'uniforme du capitaine James T Kirk"                             ,p:["jaune","noir","vert","bleu","rouge"] },
 { c:"Le pont de l'Enterprise"   ,r:4,q:"Combien d'écrans panoramiques permettent de voir un reflet (lune)"                       ,p:[1,2,3,4,5,6] },
 { c:"Le pont de l'Enterprise"   ,r:4,q:"Combien de moniteurs sont incrustés dans le panneau juste derrière Mr Spock"             ,p:[1,2,3,4,5,6,7] },
 { c:"Le pont de l'Enterprise"   ,r:2,q:"Combien de panneaux indiquent le danger du réacteur au sud ouest du pont?"               ,p:[0,1,2,3,4] },
 { c:"Le pont de l'Enterprise"   ,r:4,q:"Quel est la couleur de l'uniforme de Nyota Uhura"                                        ,p:["jaune","noir","vert","bleu","rouge"] },
 { c:"Le pont de l'Enterprise"   ,r:3,q:"Quel est la couleur de l'uniforme de Mr Spock"                                           ,p:["jaune","noir","vert","bleu","rouge"] },
 { c:"Chambre du 4ème pouvoir"   ,r:4,q:"Combien de lampes carbuncles éclairent les tables du 4ème pouvoir"                       ,p:[2,3,4,5,6,7,8] },
 { c:"Chambre du 4ème pouvoir"   ,r:5,q:"Combien de lampes 'col de cygne' éclairent les tables ET les tableaux"                   ,p:[0,2,4,6,8,10] },
 { c:"Chambre du 4ème pouvoir"   ,r:4,q:"Combien de tableaux sont exposés sur les murs"                                           ,p:[0,1,2,3,4,6,8] },
 { c:"Chambre du 4ème pouvoir"   ,r:3,q:"Combien de peluches Bunbuku composent la lettre E sur une table"                         ,p:[6,9,12,13,15,16] },
 { c:"Chambre de la force"       ,r:5,q:"Combien de flambeaux éclairent la chambre"                                               ,p:[1,2,3,4,5,6,8] },
 { c:"Chambre de la force"       ,r:4,q:"Quel est la couleur des fleurs dans le pot le plus proche de Yoda"                       ,p:["blanc","multicolore","noir","jaune","vert","rouge"] },
 { c:"Chambre de la force"       ,r:4,q:"Quel est couleur du feuillage de l'arbre de la Force derrière Yoda"                      ,p:["blanc","multicolore","noir","jaune","vert","rouge"] },
 { c:"Chez l'Oracle des Savoirs" ,r:4,q:"Combien d'affiches ou tableaux dans le coin secret du sud ouest"                         ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Chez l'Oracle des Savoirs" ,r:2,q:"Combien d'affiches ou tableaux dans le coin secret du nord ouest"                        ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Chez l'Oracle des Savoirs" ,r:3,q:"Combien d'affiches ou tableaux dans le coin secret du nord est"                          ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Chez l'Oracle des Savoirs" ,r:6,q:"Combien d'affiches ou tableaux dans le coin secret du sud est"                           ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Chez l'Oracle des Savoirs" ,r:5,q:"Combien d'assistants (Peluche Bunbuku) se trouvent sur le bureau de la Grande Peluche"   ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Le labyrinthe"             ,r:5,q:"Quel est la couleur de la tenue de Dédale"                                               ,p:["blanc","noir","jaune","vert","bleu","rose"] },
 { c:"Le labyrinthe"             ,r:0,q:"Quel est le type d'orchestrion à gauche en entrant"                                      ,p:["standard","de table", "phonographe"] },
 { c:"Le Kiki's Sauna"           ,r:2,q:"Combien de chopes de bière se trouvent sur le comptoir"                                  ,p:[0,1,2,3,4,5] },
 { c:"Le Kiki's Sauna"           ,r:3,q:"Combien de tabourets 'champignon' se trouvent devant le comptoir"                        ,p:[0,1,2,3,4,5] },
 { c:"Le Kiki's Sauna"           ,r:4,q:"Combien de sacs avec une fleur de tournesol dans les casiers muraux à l'entrée"          ,p:[0,1,2,3,4,5] },
 { c:"Maison de CL"              ,r:4,q:"Combien de petits vitraux sont accrochés aux murs de la chapelle"                        ,p:[0,1,2,3,4,5] },
 { c:"Maison de CL"              ,r:6,q:"Combien de grands candélabres sont posés sur le sol de la chapelle"                      ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:6,q:"Combien de canapés circulaires dans l'entrée"                                            ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:4,q:"Combien de cornouillers dans la crypte des valeureux"                                    ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:4,q:"Combien de paysages magiques des steppes d'Azim autour de la table des chevaliers de l'Azur"  ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:1,q:"Combien de paysages magiques de la pleine lune autour de la table des chevaliers de l'Azur"   ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:4,q:"Combien de poissons dans l'aquarium de la crypte des valeureux"                          ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:6,q:"Combien de tableaux en l'honneur des Héros Tombes dans la crypte des Valeureux"          ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:6,q:"Combien de desserts dans le présentoir à desserts dans la salle des festins"             ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:4,q:"Combien de spectateurs sont assis dans le grand auditorium"                              ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:4,q:"Combien de sièges pour les spectateurs dans le grand auditorium"                         ,p:[4,6,8,10,12,14,16] },
 { c:"Maison de CL"              ,r:7,q:"Combien de lampes murales éclairent l'alcove des dhalmels"                               ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:6,q:"Combien d'aéronefs miniatures sont exposés dans la salle des richesses"                  ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:2,q:"Combien d'éventails flottent à l'entrée des chambres"                                    ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:2,q:"Combien de lalafels jouent dans le casino"                                               ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:2,q:"Combien de cactus du gold saucer dans le casino"                                         ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:1,q:"Comment est le petit-cul du croupier dans le casino"                                     ,p:["flasque","sexy","rebondi"] },
 { c:"Maison de CL"              ,r:0,q:"Le grand argentier est"                                                                  ,p:["assis","debout","couché"] },
 { c:"Maison de CL"              ,r:2,q:"Combien de plateaux de jeu de triple-triade dans le casino"                              ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:3,q:"Combien de gourmets sont assis à la grande table de la salle des festins"                ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:2,q:"Combien de portraits d'Haurchefant sont exposé à l'étage"                                ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:5,q:"Combien d'arches en marbre dans la salle des mémoires"                                   ,p:[0,4,8,10,12,14,16] },
 { c:"Maison de CL"              ,r:5,q:"Combien de chaises innocupées autour de la table des chevaliers de l'Azur"               ,p:[6,7,8,9,10,11,12,13] },
 { c:"Maison de CL"              ,r:4,q:"Combien de vitraux dans la salle des mémoires"                                           ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:2,q:"Combien de pélerins se receuillent devant les coffres-cerceuils de la crypte des valeureux"   ,p:[0,1,2,3,4,5,6,7,8] },
 { c:"Maison de CL"              ,r:5,q:"Combien de minerais sont exposés dans le présentoir de la salle des richesses"           ,p:[15,17,18,20,22,24,26,30] },
 { c:"Maison de CL"              ,r:1,q:"Sur l'espalier des Peluches, la Kotetsu est plutôt"                                      ,p:["en haut","en bas","à droite","à gauche","au milieu"] },
 { c:"Maison de CL"              ,r:4,q:"Sur l'espalier des Peluches, la baron ail est plutôt"                                    ,p:["en haut","en bas","à droite","à gauche","au milieu"] },
 { c:"Maison de CL"              ,r:0,q:"Sur l'espalier des Peluches, Brina est plutôt"                                           ,p:["en haut","en bas","à droite","à gauche","au milieu"] },
 { c:"Maison de CL"              ,r:2,q:"Sur l'espalier des Peluches, la peluche Namazu est plutôt"                               ,p:["en haut","en bas","à droite","à gauche","au milieu"] },
 { c:"Maison de CL"              ,r:4,q:"Sur l'espalier des Peluches, l'ours en peluche est plutôt"                               ,p:["en haut","en bas","à droite","à gauche","au milieu"] },
 { c:"Maison de CL"              ,r:1,q:"Sur l'espalier des Peluches, la peluche de Khloe Aliapoh est plutôt"                     ,p:["en haut","en bas","à droite","à gauche","au milieu"] },
 { c:"Maison de CL"              ,r:3,q:"Combien de faisceaux violets éclairent le trophée des fous volants"                      ,p:[0,1,2,3,4,5,6] }
];

const matrixCol=4;

// infosStatiques
const infosStatiques= { lieux: [], questions: questions }
for (let i=0; i < initStatus.length; i++) {
	infosStatiques.lieux[i] = {};
	infosStatiques.lieux[i] = Object.assign(infosStatiques.lieux[i],initStatus[i].pub);
}

// Contexte
const ctx = collections.get("lieuxDeracines",true)

function broadcastCtx() {
	wsserver.broadcastSimpleOp("lieuxDeracines",ctx);
}

// SCEPTRES !!!!
let sceptres = collections.get("lieuxDeracines_Sceptres",true)
sceptres.pseudos ??= {};
sceptres.coefs ??= {};
sceptres.consos ??= {};

function incSceptres(pseudo,n) {
	return sceptres.pseudos[pseudo] = (sceptres.pseudos[pseudo] || 0) + n
}
function getSceptres(pseudo) {
	sceptres.pseudos[pseudo] ??= 0;
	return sceptres.pseudos[pseudo]
}

function clearSceptres() {
	sceptres.pseudos = {};
	sceptres.coefs = {};
	sceptres.consos = {};
	collections.save(sceptres)
}

function getConso(pseudo) {
	return sceptres.consos[pseudo] || 0
}
function setConso(pseudo,c) {
	return sceptres.consos[pseudo] = c
}
function incConso(pseudo,n) {
	return sceptres.consos[pseudo] = getConso(pseudo) + n
}
function clearConso(pseudo) {
	return sceptres.consos[pseudo] = 0
}


function donnerSceptre(dest,pseudo) {
	// si sceptres dispo et dest  quemandeur ?
	let f = getSceptres(pseudo)
	if ( f>1 && isQuemandeur(dest) ) {
		let d = incSceptres(dest,1)
		f = incSceptres(pseudo,-2)
		// maj sceptres dest
		wsserver.sendToPseudo(dest,{op: "ld_sceptres", s:  d } )
		// broadcast info
		wsserver.broadcastNotification(pseudo+" a donné un sceptre à "+dest)
		// maj sceptres sources via la réponse
		gbl.exception( { s: f } , 200)
	}
	gbl.exception( { s: f } , 202)
}


// LIEUX !!!!
// ctx::=
// tPseudo: pseudo de qui a trouvé
// tDth: dth de la découverte
// pCur: position actuelle
// pPseudo: pseudo qui a positionné au bon endroit
ctx.lieux ??= [];
for (let i=0; i < initStatus.length; i++) {
	ctx.lieux[i] ??= { }
	ctx.lieux[i].pCur ??= i
}
function setTrouve(i,pseudo) {
	ctx.lieux[i].tPseudo = pseudo
	ctx.lieux[i].tDth = Date.now();
}
function setTrouves(pseudo) {
	for (let i=0; i < initStatus.length; i++) {
		setTrouve(i,ctx.lieux[i].tPseudo || pseudo );
	}
}
function clearTrouve(i) {
	ctx.lieux[i].tPseudo = null;
	ctx.lieux[i].tDth = null;
	ctx.lieux[i].pCur = i;
}
function clearTrouves() {
	for (let i=0; i < initStatus.length; i++) clearTrouve(i);
}
function resetCur() {
	for (let i=0; i < initStatus.length; i++) {
		ctx.lieux[i].pCur = i
	}
	collections.save(ctx);
	broadcastCtx();
}

function clearPositions() {
	for (let i=0; i < initStatus.length; i++) {
		ctx.lieux[i].pCur = i
		ctx.lieux[i].pPseudo = null
	}
}	

function setPositions() {
	for (let i=0; i < initStatus.length; i++) {
		ctx.lieux[i].pCur = initStatus[i].pub.tLoc 
	}
}

// ATTENTION PARTAGE AVEC LE CLIENT
function getCoef(pseudo) {
	let nbConsos=getConso(pseudo);
	// ATTENTION PARTAGE AVEC LE CLIENT
	let tmpCoef=1;
	if (nbConsos<5) tmpCoef=1;
	else if (nbConsos<15) tmpCoef=2;
	else if (nbConsos<25) tmpCoef=4;
	else if (nbConsos<35) tmpCoef=6;
	else tmpCoef=10;
	return tmpCoef;
}


// distance entre deux cases de la matrice avec le coef du pseudo
function distance(from,to,pseudo) {
	const fx = Math.floor(from/matrixCol);
	const fy = from - fx*matrixCol;
	const tx = Math.floor(to/matrixCol);
	const ty = to - tx*matrixCol;
	const d =  Math.abs(fx-tx) + Math.abs(fy-ty)
	const tmpCoef = getCoef(pseudo);
	return Math.floor(d*tmpCoef)
}


// pseudo indique reponse r a la question q
// 200: inc ok + nbSceptres, 202: bad rep
function resoudre(reqPaths,pseudo) {
	// recup parametres
	const q = parseInt(reqPaths[3],10);
	const r = parseInt(reqPaths[4],10);
	if (q===NaN || q<0 || q>=questions.length || r===NaN || r<0 ) gbl.exception("swap bad index",400);
	// verif reponse
	if (questions[q].r != r) gbl.exception( "bad reponse" ,202);
	// reponse ok
	let s = incSceptres(pseudo, 1)
	gbl.exception( {s:s, m:"reponse ok"} ,200);
}

// pseudo echange runes from et rune to (indice du tableau, pas de la matrice)
function swapLieu(reqPaths,pseudo) {
	// recup coordonnées des lieux
	const from = parseInt(reqPaths[3],10);
	const to = parseInt(reqPaths[4],10);
	if (from===NaN || from<0 || from>=initStatus.length || to===NaN || to<0 || to>=initStatus.length ) gbl.exception("swap bad index",400);
	// conversion en coordonnées de matric
	const fCur = ctx.lieux[from].pCur
	const tCur = ctx.lieux[to].pCur
	// recup des targets
	const fLoc = initStatus[from].pub.tLoc
	const tLoc = initStatus[to].pub.tLoc
	console.log("lieuxSwap:",from,"@",fCur,">",fLoc+" <-> ",to,"@",tCur,">",tLoc);
	// Verification des credits
	let s = getSceptres(pseudo)
	const d = distance(fCur,tCur,pseudo)
	if (d > s) gbl.exception( {s:s, m:"désynchro client, sceptre req>dispo:"+s },202)
	// Verification que pas en position finale
	if (fLoc == fCur) gbl.exception( {s:s, m:"désynchro client, rune vérouillée:"+fLoc },202)
	if (tLoc == tCur) gbl.exception( {s:s, m:"désynchro client, rune vérouillée:"+tLoc },202)
	// Permutation des lieux
	ctx.lieux[from].pCur = tCur
	ctx.lieux[to].pCur = fCur
	// Indication du dernier acteur sur les runes
	ctx.lieux[from].pPseudo = ctx.lieux[to].pPseudo = pseudo
	ctx.lieux[from].pDth = ctx.lieux[to].pDth = Date.now()
	// Annulation des intentions
	ctx.lieux[from].iPseudo = ctx.lieux[to].iPseudo = null
	ctx.lieux[from].iDth = ctx.lieux[to].iDth = null
	// nouveau solde
	s = incSceptres(pseudo, -d)
	let c = incConso(pseudo,d);

	// supprime de la liste des quemandeurs
	quemandeurDelete(pseudo)
	// sync
	collections.save(ctx);
	collections.save(sceptres);
	broadcastCtx();
	wsserver.broadcastNotification(pseudo+" a échangé les runes "+(fCur+1)+" et "+(tCur+1) )
	gbl.exception( {s:s, c:c, m:"swap ok"} ,201);
}

function putLieu(reqPaths,pseudo) {
	const i = parseInt(reqPaths[3],10);
	const x = parseFloat(reqPaths[4]);
	const y = parseFloat(reqPaths[5]);
	if (isNaN(i) || isNaN(x) || isNaN(y)) gbl.exception("NaN param",400);
	if (i<0 || i>=initStatus.length) gbl.exception("bad index",400);
	// verif que l'element est a découvrir
	if (ctx.lieux[i].trouveDth) gbl.exception("dejà trouve, clienSynch ?",400);
	// verif des coords
	const tX = initStatus[i].x
	const tY = initStatus[i].y
	const tD = initStatus[i].pub.d
	// si bonnes coordonnées...
	if (x>=tX-tD && x<=tX+tD && y>=tY-tD && y<=tY+tD) {
		ctx.lieux[i].tPseudo = pseudo;
		ctx.lieux[i].tDth = Date.now();
		collections.save(ctx);
		let s = incSceptres(pseudo, 1)
		collections.save(sceptres);
		collections.save(ctx);
		broadcastCtx();
		wsserver.broadcastNotification("J'ai trouvé le lieu déraciné #"+(i+1),pseudo);
		gbl.exception( {s:s, m:"Ok"} ,201);
	}
	// mauvaises coordonnées...
	gbl.exception("bad coordonnees",208);
}

// intention/reset||iTbl
function intention(reqPaths,pseudo) {
	switch(reqPaths[3]) {
		case "reset":
				for (let i=0; i < initStatus.length; i++) {
					if (ctx.lieux[i].iPseudo == pseudo) {
						ctx.lieux[i].iPseudo = null
						ctx.lieux[i].iDth = null
					}
				}
				broadcastCtx();
				break;
		default:
				const iTbl = parseInt(reqPaths[3],10)
				if (isNaN(iTbl) || iTbl < 0 || iTbl >= initStatus.length) gbl.exception("Nan/bad index",400);
				for (let i=0; i < initStatus.length; i++) {
					if (ctx.lieux[i].iPseudo == pseudo) {
						ctx.lieux[i].iPseudo = null
						ctx.lieux[i].iDth = null
					}
				}
				if (ctx.lieux[iTbl].iPseudo == null) {
					ctx.lieux[iTbl].iPseudo = pseudo
					ctx.lieux[iTbl].iDth = Date.now();
				}
				broadcastCtx();
				break;
	}
}

// QUEMANDEURS !!
ctx.quemandeurs ??= [];

function isQuemandeur(pseudo) {
	// console.log("Quemand:",ctx.quemandeurs,ctx.quemandeurs.indexOf(pseudo),ctx.quemandeurs.indexOf(pseudo) >= 0);
	return ctx.quemandeurs.indexOf(pseudo) >= 0
}
function quemandeurDelete(pseudo) {
	let i = ctx.quemandeurs.indexOf(pseudo)
	if (i>=0) ctx.quemandeurs.splice(i,1)
}
// quemander par un psuedo
function quemander(pseudo) {
	// si pseudo n'est pas deja en quemandeur...
	if (! isQuemandeur(pseudo)) {
		while (ctx.quemandeurs.lenght >=3) ctx.quemandeurs.shift();
		ctx.quemandeurs.push(pseudo);
		broadcastCtx();
		return true;
	}
	return false;
}

function getStatus() {
	return ctx;
}


exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd);
	switch (method) {
		case "OPTIONS":
			res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET":
			switch(reqPaths[2]) {
				case "sceptres":
					gbl.exception( { s: getSceptres(pseudo), c: getConso(pseudo) } ,200)
				case "quemander":
					gbl.exception( { s: getSceptres(pseudo), c: getConso(pseudo) } , (quemander(pseudo))? 200 : 202)
				case "intention":
					intention(reqPaths,pseudo)
					gbl.exception("delayed via ws",200);
					break;
				case "static":
					gbl.exception(infosStatiques,200)
				case "dynamic":
					gbl.exception(getStatus(),200)
			}
			gbl.exception("bad op",400)
		case "PUT":
			switch(reqPaths[2]) {
				case "swap":
					swapLieu(reqPaths,pseudo)
					break;
				case "donner":
					donnerSceptre(reqPaths[3],pseudo)
					break;
				case "resoudre":
					resoudre(reqPaths,pseudo)
					break;
				case "trouve":
					putLieu(reqPaths,pseudo)
					break;
			}
			gbl.exception("bad op",400)
		case "DELETE":
			pseudos.check(pseudo,pwd,true); // admin
			switch(reqPaths[2]) {
				case "trouves":
					if (reqPaths[3]=="all")
						clearTrouves()
					else
						clearTrouve(parseInt(reqPaths[3],10))
					collections.save(ctx);
					broadcastCtx();
					gbl.exception("ok",200)
				case "sceptres":
					clearSceptres()
					gbl.exception("ok",200)
				case "positions":
					clearPositions()
					collections.save(ctx);
					broadcastCtx();
					gbl.exception("ok",200)
				case "conso":
					clearConso(pseudo)
					gbl.exception("ok",200)
			}
			gbl.exception("bad op",400)
		case "PATCH":
			pseudos.check(pseudo,pwd,true); // admin
			switch(reqPaths[2]) {
				case "trouves":
					if (reqPaths[3]=="all")
						setTrouves("admin")
					else
						setTrouve(parseInt(reqPaths[3],10),pseudo)
					collections.save(ctx);
					broadcastCtx();
					gbl.exception("ok",200)
				case "positions":
					setPositions()
					collections.save(ctx);
					broadcastCtx();
				case "save":
					collections.save(ctx);
					collections.save(sceptres);
					gbl.exception("ok",200)
			}
			gbl.exception("bad op",400)
	}
	gbl.exception("bad op",400)
}



console.log("lieuxderacines loaded");

