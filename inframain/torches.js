const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const collections = require('../infraback/collections.js');
const discord = require('../infraback/discord.js');

// Equilibrage final
const RELAXNOUVELLE = 30 * 60000 // nombre de min pour calcul nouvelle question
const RELAXBYREPONSE = 180 * 60000 // nombre de ms en delay par réponse déjà faite apres une reponse
const RELAXBYERREUR = 20 * 60000 // nombre de ms en delay si erreur
// Dth de premier pop (pour prod à 20h15, reset lors d'un adminReset a +15sec ou 20h15 du jour sur ordre admin
let RELAXINIT = Date.UTC(2025, 1-1, 13, 19, 15, 0)


// liste des questions/reponses
const lstQR = [
	/* Noscea */
	/* Noscea centrale */
	{ z: "dans la poigne des dieux" ,q: "Des 4 petites tours, combien ont été détruites lors de l'amerrissage de la Torchère?", r: 1, o: ["aucune","une","deux","trois","quatre"] }, // basse-nocea 26.4 30.6
	{ z: "en Noscea orientale", q: "Près de la chute cachée, combien de Miq'ote dansent à proximité de l'endroit de la chute de la torchère?", r: 2, o: ["une","deux","trois","quatre","cinq"] }, // noscea orientatle 32.5 23.5
	/* noscea occidentale */
	{ z: "en Noscea occidentale", q: "Depuis qu'il a vu tomber la torchère, le capitaine Sthalrhet regarde toujours vers?", r: 1, o: ["le nord","l'est","le sud","l'ouest"] }, // noscea occidentale 19.5 22.8
	/* haute noscea */
	{ z: "en Noscea extérieure" ,q: "L'ermite a vu tomber la Torchère. Il a noté les coordonnées dans un livre. Combien de livres ouverts se trouvent dans sa masure?", r: 5, o: ["2","3","4","5","6","7","8"] }, // 15.3 10.0
	/* sombrelinceul */
	/* foret centrale */
	{ z: "en forêt centrale" ,q: "Gabineaux n'arrête plus de discuter de l'endroit où il a vu tomber la torchère avec son amie. Quel est son nom?", r: 1, o: ["Paula","Pauline","Viviane","Clara","Khloé"] }, // 27.2 20.8
	/* foret de l'est */
	{ z: "dans Sombrelinceul" ,q: "Les radiations de la Torchère ont changé la couleur d'une des tentes du Refuge. Quelle est sa couleur?", r: 4, o: ["grise","verte","bleu","jaune","rouge"] }, // thanalan méridional 24.8 40.9
	/* foret du sud */
	/* foret du nord */
	{ z: "dans la Sommière de la Paix" ,q: "Herluin a dissumulé un parchemin avec les coordonnées de la Torchère dans une des bouteilles de sa chambre. Combien y-a-t-il de bouteilles?", r: 5, o: ["5","6","7","8","9","10"] }, // 30.3 19.9 
	/* thanalan */
	/* thanalan occidental */
	/* thanalan central */
	{ z: "en Thanalan central" ,q: "Le lieu de chute de la Torchère à été identifié car l'Arbre du Sultan est cerné par des...", r: 1, o: ["coccinelles","frelons","poux","marmottes"] }, // 
	/* thanalan oriental */
	{ z: "en Thanalan méridional" ,q: "La Torchère est retombée dans les sables près de Hab. Depuis, il se prend pour...", r: 0, o: ["un zombi","un esprit","un ascien","un aventurier"] }, // thanalan méridional 24.8 40.9
	/* thanalan septentrional */
	/* coerthas */
	/* mor dhona */
	/* abalathia */
	{ z: "en Azys Lla" ,q: "Dans les deux complexes d'incubation de masse, la Torchère a provoqué l'arret de nombreux incubateurs. Combien en reste-il d'actifs?", r: 4, o: ["7","9","12","15","18","21","24"] }, // 38.7 5.8
	/* dravania */
	{ z: "en Idyllée" ,q: "Près de l'Intendant des Becs-rouges, dans quel objet pouvant contenir 40 lalafells se dissimule la torchère?", r: 1, o: ["une énorme caisse","un four","un nuage gazeux","un système d'irrigation"] }, // 3.8 4.5
	{ z: "dans l'Eurée feste" ,q: "La torchère a été gobée par un monstre de taille moyenne. Quel est son espèce?", r: 3, o: ["un élémentaire","un draguêpe","un bandersnatch","un dragon"] }, // avant pays dravanien 31.5 5.7
	{ z: "au nord-est de Nid-mog" ,q: "La torchère s'est plantée dans un grand arbre, le rendant luminescent. Quel est la couleur de cet luminescence?", r: 2, o: ["rouge","vert","bleu","jaune"] }, // écume des cieux de dravania 32.4 32.4
	/* Gyr abania*/
	{ z: "en Gyr Abania" ,q: "Un énorme cratère s'est formé lors de la chute de la Torchère. Quel est le nom de ce cratère?", r: 1, o: ["Aenadem Ol","Bâillement","Cratère d'Ubul","Baignade du Taureau"] }, // les marges 30. 34.
	/* Othard */ 
	{ z: "dans la mer de rubis" ,q: "Hayama a vu tomber la Torchère, il pense que ses canons suffiront à se protéger la prochaine fois. De combien de canons dispose-t-il?", r: 3, o: ["7","8","9","11","13","15"] }, // 38.6 37.9
	{ z: "dans Yanxia" ,q: "En percutant le contre-torpilleur, la torchère a provoqué la mutation de certaines grandes algues brunes. Elles sont maintenant rachitiques et de couleur? ", r: 1, o: ["noire","verte","violette","grise"] }, // Yanxia34.8 38.5
	{ z: "dans la Steppe d'Azim" ,q: "Beki, depuis son poste de guet, scrute en permanence dans la direction où elle a vu tomber la torchère, c'est vers?", r: 3, o: ["le nord","l'est","le sud","l'ouest"] }, // steppe d'azim 33.0 26.9
	/* Norvrandt */
	{ z: "en Amh Araeng" ,q: "La torchère n'est pas dans le donjon, mais au fond du puit de Malikah. Elle est dissimulée par une épaisse couche de?", r: 3, o: ["glace","lave","pierres","brume"] }, // amh araeng 11.3 30.5 0
	{ z: "en Il Mheg" ,q: "Marn Ose a été exposée à la radioactivité de la torchére, sa chemise s'est teinte en ?", r: 3, o: ["noir","blanc","rouge","vert","jaune"] }, // il mheg 20.5 4.3
	{ z: "vers le Lac Tusi Mek'ta" ,q: "Dans une clairière, la torchère s'est plantée dans un arbre rendant une partie de son tronc luminescente. Quel est la couleur?", r: 3, o: ["violet","vert","bleu","orange"] }, // raktika 7.5 32.1
	{ z: "dans le Cristarium" ,q: "Vral a été exposé à la radioactivité de la torchére, sa chemise à bretelles blanc perlé s'est décolorée en?", r: 2, o: ["rouge","noir","vert","jaune","rose"] }, // cristarium 9.0 12.4
	{ z: "dans Eulmore" ,q: "Dadine a été exposée à la radioactivité de la torchére, elle était une aventurière, elle s'est reconvertie en?", r: 3, o: ["gogodanseuse","serveuse","apothicaire","éleveuse de coqs"] }, // eulmore au rdc
	/* mers du nord */
	{ z: "dans la Vieille Sharlayan" ,q: "Depuis qu'il a vu tomber la torchère, Snoeharr ne regarde plus que dans cette direction. C'est vers?", r: 1, o: ["le nord","l'est","le sud","l'ouest"] }, // 6.4 12.9
	/* Ilsabard */
	{ z: "en Thavnair" ,q: "Combien de nids ont été endommagés dans le couvoir lors de la chute de la torchère", r: 2, o: ["0","1","2","3","4","5","6"] } // Thavnair 12.4 10.5
]

// etat du challenge
let etatTorches = normalizeTorches(collections.get("torches", true))

function normalizeTorches(t) {
	t.historique ??= []   	// contien des { pseudo, idx, dth } des bonnes réponses
	t.relaxDthByPseudo ??= {}  // index par le pseudo, date/heure de trouvaille possible (peut ere inférieur a question.dth)
	t.question ??= nouvelleQuestion(t) // question actuelle { idx, q , o, dth } dth est le début de la question
	t.NBQUESTIONS = lstQR.length				// nombre de questions au total
	console.log("Torches normalized")
	return t
}

function admResetTorches() {
	RELAXINIT = Date.now() + 15*1000
	etatTorches = normalizeTorches(collections.reset("torches"))
}

// sycnho les clients, et notif discord si pseudo indiqué
function syncClients(pseudo) {
	collections.save(etatTorches)
	// broadcast sur le WS
	wsserver.broadcastSimpleOp('torches',getEtat())
	// si pseudo, la torchere vient d'etre envoyée
	if (pseudo) {
		// si il y a encore au moins une question
		if (etatTorches.question)
			discord.postMessage("hegemonie",
				"**Challenge de la Torchère**\n\n" +
				pseudo + " a renvoyé la torchère de l'Hégémonie dans les limbes." + 
				"\nSelon la Peluche Galileo Galilei, elle devrait retomber " + etatTorches.question.z + " à <t:"+Math.floor(etatTorches.question.dth/1000) +":T>"+
				"\n__Attention__: Consulte la Grande Peluche pour connaitre l'heure précise où tu pourras t'en approcher car cela dépend de ton niveau d'irradiation actuel"
				,true)
		else
			discord.postMessage("hegemonie",
				pseudo + " a renvoyé la torchère de l'Hegémonie dans les limbes et elle s'y est consumée!" +
				"\n\nLe challenge est terminé, mais pas tes Aventures!"+
				"\n<"+gbl.pCloudUrl+"ff-7/ff-7-torches-2.mp4>"
				,true)
	}
}

// retourne une nouvelle question ou null si plus de question disponible
function nouvelleQuestion(t) {
	// recupere les indices non utilisés
	let trouves = new Array(lstQR.length).fill(false)
	t.historique.forEach( (e) => trouves[e.idx] = true )
	// determine les possibles
	let possibles = []
	for (let i=0; i < lstQR.length; i++) { if (!trouves[i]) possibles.push(i)	}
	// verfie qu'il y a encore des possibles...
	if (possibles.length <=0) return null
	// recupere l'indice dans les trouves
	let idx = possibles[Math.floor(Math.random() * possibles.length)]
	// dth = date de pop selon relax avec respect de la date de début
	// dth selon le nombre de trouvés
	let dth = (lstQR.length == possibles.length)?  (RELAXINIT) : (Date.now() + RELAXNOUVELLE)
	return {idx: idx, q: lstQR[idx].q, o: lstQR[idx].o, z: lstQR[idx].z, dth: dth }
}

// retourne l'etat actuel
function getEtat() {
	return etatTorches
}

// compte le nombre de bonne réponse par le pseudo
function getCountReponse(pseudo) {
	return etatTorches.historique.reduce( (acc, hist) => acc + ( (hist.pseudo==pseudo)? 1: 0 ) ,0)
}

// propose reponse (200 reponse OK, 201 ok challenge terminé, 202 mauvaise réponse, 400 erreur de synch)
function proposeReponse(pseudo,reqPaths) {
	const now = Date.now()
	// verif de la possibilite de réponse (question et dth synch)
	if ( !etatTorches.question ) gbl.exception("plus de question, err synch client/serveur",400)
	if (now < ( etatTorches.relaxDthByPseudo[pseudo] || 0 ) ) gbl.exception("pas encore possible, err synch client/serveur",400)
	// si mauvaise reponse
	if (parseInt(reqPaths[3],10) != lstQR[etatTorches.question.idx].r ) {
		etatTorches.relaxDthByPseudo[pseudo] = now + RELAXBYERREUR
		collections.save(etatTorches)
		gbl.exception(getEtat(),202)
	}
	// reponse OK
	etatTorches.historique.push( { pseudo: pseudo, idx: etatTorches.question.idx, dth: now } )
	etatTorches.question = nouvelleQuestion(etatTorches)
	etatTorches.relaxDthByPseudo[pseudo] = now + RELAXBYREPONSE * getCountReponse(pseudo)
	wsserver.broadcastSimpleText(pseudo+" a envoyé la Torchère dans les limbes",true)
	syncClients(pseudo)
	// retourne 200 ou 201 selon que le challenge est terminé
	gbl.exception("synch by WS", (etatTorches.question)? 200:201)
}


exports.httpCallback = (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd); // auth
	switch(method) {
		case "OPTIONS": 
			res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH');
			gbl.exception("AllowedCORS",200);
		case "GET": 
			switch(reqPaths[2]) {
				case "etat":
					// GET etat retourne état courant
					gbl.exception( getEtat() , 200) 
			}
			gbl.exception("torches get",400);
		case "POST": 
			switch(reqPaths[2]) {
				case "propose":
					proposeReponse(pseudo,reqPaths);
			}
			gbl.exception("torches put",400);
		case "PATCH": 
			pseudos.check(pseudo,pwd,true); // auth admin
			switch(reqPaths[2]) {
				case "admReset":
					admResetTorches()
					syncClients(null)
					gbl.exception("torches clear ok",200);
				case "admNext":
					etatTorches.question = nouvelleQuestion(etatTorches)
					syncClients(null)
					gbl.exception("torches next ok",200);
				case "admResetTimer":
					etatTorches.question.dth = Date.now()+30000
					etatTorches.relaxDthByPseudo[pseudo] = Date.now()+45000
					syncClients(null)
					gbl.exception("torches clear ok",200);
				case "admReset20H15":
					const nbSecJour = 24*60*60000
					const h2030 = (19*60+15)*60000  // GMT+1 !!
					etatTorches.question.dth = (Math.floor(Date.now()/nbSecJour))*nbSecJour+ h2030
					syncClients(null)
					gbl.exception("torches clear ok",200);
			}
			gbl.exception("torches patch",400);
	}
	gbl.exception("inv http op toches",400);
}

console.log("torches loaded")
