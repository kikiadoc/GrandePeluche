<script>

	import { playVideo, playMusic, markClick, urlCdn } from './common.js'

	/** @type {Props} */
	let {
		wsCallComponents,
		pageDesc = null,
		pseudo,
		pseudoList,
		etatTTS = null,
		page = $bindable(),
		pageDone = $bindable([]),
		audioBack = $bindable(),
		audioAmbiance = $bindable(),
		audioVolume = $bindable(),
	} = $props();

	let entrees = [
		{
			nom: "metropolis", hdr:"Métropolis (Mars 2025)",
			mp4:"ff-10/ff-10-metro-trailer", gains: 32,
			resume: "Méphistophélès a fui Eorzéa... et a été vaincu dans l'Hyper-Temps"
		},
		{
			dep: "metropolis", hdr:"Te Sera-t-il possible d'aller dans l'Ortho-temps?",
			mp4:"ff-10/ff-10-avantBench"
		},
		{
			dep: "metropolis", hdr:"Sauras-tu activer le Chronogyre vers Métropolis?",
			mp4:"ff-10/ff-10-metropolis-c"
		},
		{
			dep: "metropolis", hdr:"Enclenchement des chevrons 1 à 7",
			mp4:"ff-10/ff-10-chevron"
		},
		{
			dep: "metropolis", hdr:"Chevron 8, départ vers l'Ortho-temps",
			mp4:"ff-10/ff-10-chevron-8"
		},
		{
			dep: "metropolis", hdr:"Métropolis dans le monde 3D de l'Ortho-temps",
			mp4:"ff-10/ff-10-metropolis-3d"
		},
		{
			dep: "metropolis", hdr:"Retour en Eorzéa",
			mp4:"ff-10/ff-10-ortho-ring"
		},
		{
			dep: "metropolis", hdr:"Le sauvetage d'Eorzéa",
			mp4:"ff-10/ff-10-metro-trailer"
		},

		
		{
			nom: "hegemonie", hdr:"Event IX: L'Hégémonie (Janvier 2025)",
			mp4:"ff-7/ff-7-trailer", gains: 411,
			resume: "Les Nouveaux Anciens tente de prendre possession des âmes, et ils ont échoué!"
		},
		{
			dep: "hegemonie", hdr:"Teaser",
			mp4:"ff-7/ff-7-teaser0c"
		},
		{
			dep: "hegemonie", hdr:"Prélude #1",
			mp4:"ff-7/ff-7-prelude-1"
		},
		{
			dep: "hegemonie", hdr:"Prélude #2",
			mp4:"ff-7/ff-7-prelude-2"
		},
		{
			dep: "hegemonie", hdr:"Prélude #3",
			mp4:"ff-7/ff-7-prelude-3"
		},
		{
			dep: "hegemonie", hdr:"Prélude #4",
			mp4:"ff-7/ff-7-prelude-4"
		},
		{
			dep: "hegemonie", hdr:"Prélude #5",
			mp4:"ff-7/ff-7-prelude-5"
		},
		{
			dep: "hegemonie", hdr:"Challenge: L'enigme de la Grande Peluche",
			mp4:"ff-7/ff-7-epique-1"
		},
		{
			dep: "hegemonie", hdr:"Challenge: Ton âme a été capturée",
			mp4:"ff-7/ff-7-epique-2"
		},
		{
			dep: "hegemonie", hdr:"Challenge: Sortir de la prison des âmes",
			mp4:"ff-7/ff-7-escapeprison"
		},
		{
			dep: "hegemonie", hdr:"Cinématique: La conférence secrète",
			mp4:"ff-7/ff-7-epique-3"
		},
		{
			dep: "hegemonie", hdr:"Challenge: Décoder le langage des Nouveaux Anciens",
			mp4:"ff-7/ff-7-alan-decryptage"
		},
		{
			dep: "hegemonie", hdr:"Cinématique: Le nouvel Ancien mystifié",
			mp4:"ff-7/ff-7-maitrepecheur"
		},
		{
			dep: "hegemonie", hdr:"Challenge: Découverte de la doctrine des Nouveaux Anciens",
			mp4:"ff-7/ff-7-doctrine-2"
		},
		{
			dep: "hegemonie", hdr:"Challenge: Détruire la Torchère à Gaz de Possession",
			mp4:"ff-7/ff-7-torches-1"
		},
		{
			dep: "hegemonie", hdr:"Cinématique: La Torchère à Gaz est détruite",
			mp4:"ff-7/ff-7-torches-2"
		},
		{
			dep: "hegemonie", hdr:"Challenge: Localiser la Station Alpha en utilisant le langage des Nouveaux Anciens",
			mp4:"ff-7/ff-7-boulier"
		},
		{
			dep: "hegemonie", hdr:"Challenge: Boucher les 40 Avaloirs de la Station Alpha",
			mp4:"ff-7/ff-7-usines-intro-1"
		},
		{
			dep: "hegemonie", hdr:"Cinématique: un Avaloir de la Station Alpha a été bouché",
			mp4:"ff-7/ff-7-stationalpha-intermediaire"
		},
		{
			dep: "hegemonie", hdr:"Cinématique: Les 40 Avaloirs de la Station Alpha sont bouchés!",
			mp4:"ff-7/ff-7-stationalpha-final"
		},
		{
			dep: "hegemonie", hdr:"Challenge: Spartaci, le sauvetage de la Grande Peluche",
			mp4:"ff-7/ff-7-spartaci-1"
		},
		{
			dep: "hegemonie", hdr:"Cinématique: La Grande Peluche est sauvée et la station Oméga localisée",
			mp4:"ff-7/ff-7-spartaci-2"
		},
		{
			dep: "hegemonie", hdr:"Challenge: La Bombe d'Oméga est désamorcée!",
			mp4:"ff-7/ff-7-omega-final"
		},
		{
			dep: "hegemonie", hdr:"Le Final",
			mp4:"ff-7/ff-7-trailer"
		},
		
		{
			nom: "benchmark", hdr:"Benchmark pour l'Event IX (Juillet 2024)",
			mp4:"ff-7/ff-7-benchmark-trailer", gains: 7,
			resume: "Pour se préparer au Kiki's Event IX, les Aventuriers ont vérifié les caractéristiques de leurs équipements"
		},
		{
			nom: "innommable", hdr:"Nommer l'innommable (Mai 2024)",
			mp4:"ff14-innommable-trailer", gains: 20,
			resume: "En résolvant l'énigme du damier à rubans, les Aventuriers ont découvert le nom de l'innomable: Méphistophélès"
		},
		{
			dep: "innommable", hdr:"Teaser: A la découverte de l'innnomable",
			mp4:"ff14-innommable"
		},
		{
			nom: "uchronie", hdr:"Event VIII: L'Uchronie (mars 2024)",
			mp4:"ff-6-trailer", gains: 388,
			resume: "L'Uchronie a perturbé le Temps, l'Espace et l'Histoire. Les Aventuriers les ont restaurés"
		},
		{
			dep: "uchronie", hdr:"Teaser: La Magie existe",
			mp4:"ff-6-teaser1"
		},
		{
			dep: "uchronie", hdr:"Teaser: Top Départ!",
			mp4:"ff-6-teaser3"
		},
		{
			dep: "uchronie", hdr:"Challenge: Teotihuacan",
			mp4:"ff14-6-teotihuacan-challenge"
		},
		{
			dep: "uchronie", hdr:"Challenge: Les lieux déracinés",
			mp4:"ff14-6-screens"
		},
		{
			dep: "uchronie", hdr:"Challenge: Le cristal de l'Uchronie",
			mp4:"ff-6-cristal"
		},
		{
			dep: "uchronie", hdr:"Challenge: La restauration du Temps",
			mp4:"ff-6-dontgiveup"
		},
		{
			dep: "uchronie", hdr:"Challenge: Le Dirac des Quatre",
			mp4:"ff-6-epilogue"
		},
		{
			nom: "deepAI", hdr:"DeepAI (Janvier 2024)",
			mp4:"ff14-deepai-teaser", gains: 16,
			resume: "Après de nombreux screens postés par les Aventuriers,\
				Kikiadoc a du se rendre à l'évidence...<br>\
				La meilleure IA du moment pour détecter une similutude d'image, DeepAI,\
				n'est pas satisfaisante pour valider automatiquement des screens IG"
		},
		{
			nom: "jungleBoogie", hdr:"Jungle Boogie (Janvier 2024)",
			mp4:"ff14-venteprivee-2024",
			resume: "50% de remise sur les plus bas prix de l'HV de moogle pour tous les objets en vente par Kikiadoc"
		},
		{
			nom: "avantUchronie", hdr:"L'avant Uchronie (décembre 2023)",
			mp4: "ff14-avant-uchronie", gains: 30,
			resume: "Alors que les Quatre explorent l'Ortho-Temps, l'Univers Connu semble perturbé par la Magie."
		},
		{
			nom: "broceliande", hdr:"Brocéliande (octobre 2023)",
			mp3: "Benabar-foret-extrait", gains: 30, // lead: Fang 7.5m
			resume: "Les Aventuriers de Brocéliande ont dissipé les nombreux maléfices en résolvant des énigmes, \
							puis ils ont établi un itinéraire permettant de partir de la Grande Bibliothèque du Bois Bandé \
							et rejoindre le chateau de Camelot. Le Grand Grimoire de la Magie a alors été découvert",
			img: urlCdn+"Minijeu-Broceliande.png"
		},
		{
			nom: "transition", hdr:"La transition Magique (septembre 2023)",
			mp3: "QueenMagic", gains: 23,
			resume: 
				"Alors que les Quatre, à l'issue de l'Event VI Hypostasis, sont parti explorer de nouvelles dimensions \
				et étendre l'Univers Connu, \
				j'ai recu un message interdimensionnel que je n'avais pas réussi à comprendre. \
				Grace aux Aventuriers, j'ai pu le décrypter:<br/>\
				<div style='font-size:0.7em'>\
				Ceci est un message que nous, les Quatre, envoyons depuis l'Ortho-Temps.<br/>\
				En explorant une nouvelle dimension, nous faisons d'extraordinaires découvertes<br/>\
				Ainsi, l'axe du temps classique n'est pas immutable<br/>\
				On a vu des personnes disparaitre du présent classique et se retrouver ailleurs dans le passé.<br/>\
				Un objet peut changer d'aspect, des claviers changer la disposition de leurs touches<br/>\
				Ces perturbations ont forcement une origine<br/>\
				Selon Anakin, ce pourrait être un effet qui ne soit pas lié aux Dimensions.<br/>\
				Hikaru a appelé ce phénomène l'Uchronie, Luke l'a appelé la Magie.<br/>\
				Robin est certain que celà constitue une menace pour l'Univers Connu.<br/>\
				Grande Peluche, prépare des Chevaliers de l'Uchonie, c'est important.<br/>\
				Amicalement, les Quatre.</div>"
		},
		{
			nom: "vacances", hdr:"En vacances, je n'oublie rien (Août 2023)",
			mp3: "QueenMagic", gains: 37, 
			resume: "Partir en vacances seul n'est pas forcement un total plaisir. \
				J'ai proposé aux Aventuriers de résoudre 24 énigmes, mais avec de la collaboration! \
				Ainsi, pour qu'un Aventurier valide une énigme, il fallait qu'un autre Aventurier le lui permette. \
				Les Aventuriers ont toujours trouvé des partenaires pour valider leurs réponses!"
		},
		{
			nom: "godot", hdr:"En attendant Godot (juin 2023)",
			mp4: "godot", gains: 10, 
			img: urlCdn+"Minijeu-Godot.png",
			resume: "Les félicités insulaires de FF14 sont des endroits paradisiaques.<br/> \
				Tels que dans la pièce <b>En Attendant Godot de Samuel Beckett</b>, les arbres de mon île semblent \
				changer au fil du temps. J'ai proposé aux Aventuriers d'identifier ces changements. \
				Ils l'ont fait!"
		},
		{
			nom: "hypostasis", hdr:"Event VII: Hypostasis (mai 2023)",
			mp4: "ff-5-trailer", gains: 350, 
			resume: "Lors d'Hypostasis, les aventuriers vont réconcilier les Dimensions Quantiques et les Dimensions Classiques.\
				Il vont découvrir une nouvelle dimension, l'Ortho-temps et les Quatre vont aller l'explorer."
		},
		{
			dep: "hypostasis", hdr:"Teaser: #1",
			mp4:"ff-5-teaser0"
		},
		{
			dep: "hypostasis", hdr:"Teaser: #2",
			mp4:"ff-5-teaser1"
		},
		{
			dep: "hypostasis", hdr:"Teaser: #3",
			mp4:"ff-5-teaser2"
		},
		{
			dep: "hypostasis", hdr:"Teaser: Top départ!",
			mp4:"ff-5-teaser3"
		},
		{
			dep: "hypostasis", hdr:"Challenge: Troubles et temple du Quantique",
			mp4:"ff-5-troubles"
		},
		{
			dep: "hypostasis", hdr:"Challenge: Les lieux de la vision classique",
			mp4:"ff-5-explo40"
		},
		{
			dep: "hypostasis", hdr:"Challenge: La gravitation",
			mp4:"ff-5-newton"
		},
		{
			dep: "hypostasis", hdr:"Challenge: Le temps",
			mp4:"ff-5-calendrier"
		},
		{
			dep: "hypostasis", hdr:"Challenge: Le hasard",
			mp4:"ff-5-hasard"
		},
		{
			dep: "hypostasis", hdr:"Challenge: La conjonction des Dimensions",
			mp4:"ff-5-rapidite"
		},
		{
			dep: "hypostasis", hdr:"Challenge: Le repos à la kermesse",
			mp4:"ff-5-kermesse"
		},
		{
			dep: "hypostasis", hdr:"Challenge: Le Chronogyre",
			mp4:"ff-5-chronogyre"
		},
		{
			dep: "hypostasis", hdr:"Challenge: L'Ortho-temps'",
			mp4:"ff-5-epilogue"
		},
		{
			nom: "adage", hdr:"L'adage (février 2023)",
			mp4: "ff-5-slogan", gains: 10, 
			resume: "Alors que le Event VII, approchait, j'ai proposé aux Aventuriers d'en découvir son adage.<br/> \
				La solution <b>Hypostatis, Quatre Corps, une ame</b> a été rapidement trouvée."
		},
		{
			nom: "prive", hdr:"Les Ventes Privées (Janvier 2023)",
			mp4: "ff-5-venteprivee",
			resume: "Le mois de Janvier est l'occasion d'importantes promotions à l'HV de Moodle"
		},
		{
			nom: "mascottes", hdr:"Les mascottes de l'île (décembre 2022)",
			mp4: "ff-5-mascottes", gains: 10,
			resume: "A l'occasion de la Noël 2022, un voyage sur une félicité insulaire permet de se réchauffer!<br/>\
				Les Aventuriers ont identifié les mascottes en lévitation."
		},
		{
			dep: "mascottes", hdr:"Teaser des mascottes de l'île",
			mp4: "ff-5-demain-mascottes", 
			resume: "Aventure dans la félicité insulaire"
		},
		{
			nom: "jardin", hdr:"Le Jardin Extraordinaire (novembre 2022)",
			mp4: "ff-5-jardinextraordinaire", gains: 8,
			resume: "La sexualité des animaux de le Félicité insulaire est libre.<br/>\
				Certains sont célibataires, d'autres en couple hétéro, d'autres en couple homo...<br/>\
				Les aventuriers ont identifiés toutes les diversités"
		},
		{
			nom: "ascension", hdr:"Event VI: L'ascension d'Anakin (septembre 2022)",
			mp4: "ff-4-trailer", gains: 320,
			resume: "Après avoir aidé Anakin à maitriser les 4 pouvoirs et obtenu la capacité de replier l'espace,\
				les Compagnons de l'Ascension ont permis à Anakin et Luke de vaincre Sauron du Mordor\
				et empêcher la destruction de l'Univers Connu"
		},
		{
			dep: "ascension", hdr:"Teaser: #1",
			mp4:"ff-4-teaser0"
		},
		{
			dep: "ascension", hdr:"Teaser: #2",
			mp4:"ff-4-teaser1"
		},
		{
			dep: "ascension", hdr:"Teaser: #3",
			mp4:"ff-4-teaser2"
		},
		{
			dep: "ascension", hdr:"Teaser: Top départ!",
			mp4:"ff-4-teaser3"
		},
		{
			dep: "ascension", hdr:"Challenge: Le quatrième pouvoir",
			mp4:"ff-4-4emepouvoir"
		},
		{
			dep: "ascension", hdr:"Challenge: Le troisième pouvoir",
			mp4:"ff-4-explo30"
		},
		{
			dep: "ascension", hdr:"Challenge: Le second pouvoir",
			mp4:"ff-4-laforce"
		},
		{
			dep: "ascension", hdr:"Challenge: Le Shai-hulud",
			mp4:"ff-4-shai-hulud"
		},
		{
			dep: "ascension", hdr:"Challenge: Le repos des Padawans",
			mp4:"ff-4-lefacteur"
		},
		{
			dep: "ascension", hdr:"Challenge: Le Bene Gesserit",
			mp4:"ff-4-benegesserit"
		},
		{
			dep: "ascension", hdr:"Challenge: La Kermesse avant l'ascension",
			mp4:"ff-4-kermesse"
		},
		{
			dep: "ascension", hdr:"Challenge: L'épice pour tous",
			mp4:"ff-4-epicepourtous"
		},
		{
			dep: "ascension", hdr:"Challenge: La Grande Menace",
			mp4:"ff-4-grandemenace"
		},
		{
			dep: "ascension", hdr:"Challenge: Les lieux de paix",
			mp4:"ff-4-lieuxdepaix"
		},
		{
			dep: "ascension", hdr:"Challenge: La stratégie finale",
			mp4:"ff-4-distraire"
		},
		{
			dep: "ascension", hdr:"Challenge: La défaite de Mauron du Sordor",
			mp4:"ff-4-distraire"
		},
		{
			TBC: true,
			nom: "miaous", hdr:"Les miaous de la mi-août (Août 2022)",
			mp4: "ff-4-teaser0c", gains: 5,
			resume: "Les Aventuriers de la mi-août ont découvert les 4 lieux occupés par des chats.<br/>\
				Et le chat du troisème lieu était un <i>chien</i> !!"
		},
		{
			TBC: true,
			nom: "afterpride", hdr:"L'after Pride (Juin 2022)",
			mp4: "ff-4-teaser0b", gains: 3,
			resume: "Un mini jeu tout simple où il faut identifier 3 lieux."
		},
		{
			nom: "ultimate", hdr:"Event V: Ultimate Walker (février 2022)",
			mp4: "ff-3-trailer", gains: 320,
			resume: "Ultimate Walker verra naître l'Amour entre Hikaru et Robin.\
				Les Aventuriers vont protéger cet Amour des velléités des Templiers et d'autres.\
				Cet Amour va sauver l'Univers Connu de Dark Vador.\
				Celui-ci redevient alors le jeune garçon nommé Anakin. Il sera élevé par ses deux papas."
		},
		{
			dep: "ultimate", hdr:"Teaser: #1",
			mp4:"ff-3-teaser0"
		},
		{
			dep: "ultimate", hdr:"Teaser: #2",
			mp4:"ff-3-teaser1"
		},
		{
			dep: "ultimate", hdr:"Teaser: #3",
			mp4:"ff-3-teaser2"
		},
		{
			dep: "ultimate", hdr:"Teaser: Go!",
			mp4:"ff-3-teaser3"
		},
		{
			dep: "ultimate", hdr:"Challenge: Le Carnet du Temps",
			mp4:"ff-3-temps"
		},
		{
			dep: "ultimate", hdr:"Challenge: Le Labyrinthe",
			mp4:"ff-3-dedale"
		},
		{
			dep: "ultimate", hdr:"Challenge: Robin du Bois Bandé",
			mp4:"ff-3-robin"
		},
		{
			dep: "ultimate", hdr:"Challenge: Les templiers",
			mp4:"ff-3-youki"
		},
		{
			dep: "ultimate", hdr:"Challenge: Youki, Pépère et Mémère",
			mp4:"ff-3-templiers"
		},
		{
			dep: "ultimate", hdr:"Challenge: Anakin et Robin, le rendez-vous",
			mp4:"ff-3-rendez-vous"
		},
		{
			dep: "ultimate", hdr:"Challenge: Le temple marin",
			mp4:"ff-3-poseidon"
		},
		{
			dep: "ultimate", hdr:"Challenge: Starfleet",
			mp4:"ff-3-touriste"
		},
		{
			dep: "ultimate", hdr:"Challenge: Power Of Love",
			mp4:"ff-3-power-of-love"
		},
		{
			nom: "retour", hdr:"Event IV: le Retour du Lala (septembre 2021)",
			mp4: "ff-2-final", gains: 200,
			resume: "Les Aventuriers vont participer à de multiples challenges proposés par un LALA."
		},
		{
			dep: "retour", hdr:"Teaser: #1",
			mp4:"ff-2-teaser"
		},
		{
			dep: "retour", hdr:"Teaser: #2",
			mp4:"ff-2-teaser2"
		},
		{
			dep: "retour", hdr:"Teaser: #3",
			mp4:"ff-2-teaser3"
		},
		{
			dep: "retour", hdr:"Teaser: #4",
			mp4:"ff-2-teaser4"
		},
		{
			dep: "retour", hdr:"Challenge: Les LA-LAnternes volées",
			mp4:"ff-2-lalanternes"
		},
		{
			dep: "retour", hdr:"Soluce: Les LA-LAnternes volées",
			mp4:"ff-2-lalanternes-sol"
		},
		{
			dep: "retour", hdr:"Challenge: LALA où t'es?",
			mp4:"ff-2-lalaoutes"
		},
		{
			dep: "retour", hdr:"Challenge: LALA table ronde",
			mp4:"ff-2-tableronde"
		},
		{
			dep: "retour", hdr:"Challenge: LALAmie Khloe",
			mp4:"ff-2-khloe"
		},
		{
			dep: "retour", hdr:"Challenge: Le Gloubiboul-LALA-ga",
			mp4:"ff-2-gloubiboulga"
		},
		{
			dep: "retour", hdr:"Soluce: Le Gloubiboul-LALA-ga",
			mp4:"ff-2-gloubi-soluce"
		},
		{
			dep: "retour", hdr:"Challenge: Touch my tra-LALA",
			mp4:"ff-2-boumboumboum"
		},
		{
			dep: "retour", hdr:"Soluce: Touch my tra-LALA",
			mp4:"ff-2-boum-soluce"
		},
		{
			dep: "retour", hdr:"Challenge: LALAbitant",
			mp4:"ff-2-rapidite"
		},
		{
			dep: "retour", hdr:"Challenge: LALA discothèque",
			mp4:"ff-2-disco"
		},
		{
			dep: "retour", hdr:"Challenge: Vivre et ne pas LALAisser mourir",
			mp4:"ff-2-lala007"
		},
		{
			nom: "quinzaine", hdr:"Event III: La quinzaine LGBT (mai 2021)",
			mp4: "ff-1-quinzaine-final", gains: 140,
			resume: "A l'occasion de quinzaine LGBT, les Aventuriers participent à de multiples challenges."
		},
		{
			dep: "quinzaine", hdr:"Teaser: ZE teaser",
			mp4:"ff-1-quinzaine-teaser"
		},
		{
			dep: "quinzaine", hdr:"Challenge: le potager",
			mp4:"ff-1-quinzaine-potager"
		},
		{
			dep: "quinzaine", hdr:"Challenge: le sauna",
			mp4:"ff-1-quinzaine-slip"
		},
		{
			dep: "quinzaine", hdr:"Challenge: le Gogodancer",
			mp4:"ff-1-quinzaine-gogodancer"
		},
		{
			dep: "quinzaine", hdr:"Challenge: Khloe la généreuse",
			mp4:"ff-1-quinzaine-khloe"
		},
		{
			dep: "quinzaine", hdr:"Challenge: La vie en rose",
			mp4:"ff-1-quinzaine-roses"
		},
		{
			dep: "quinzaine", hdr:"Soluce: La vie en rose",
			mp4:"ff-1-quinzaine-roses-soluce"
		},
		{
			dep: "quinzaine", hdr:"Challenge: La crypte",
			mp4:"ff-1-quinzaine-crypte"
		},
		{
			dep: "quinzaine", hdr:"Soluce: Le coquinou",
			mp4:"ff-1-quinzaine-coquinou"
		},
		{
			nom: "anniv", hdr:"Event II: L'anniversaire de Didi et Kiki (Décembre 2020)",
			mp4: "ff-0-final2", gains: 75,
			resume: "Quelques challenge pour la célébration des 36 ans de vie commune IRL de Kiki et de son Didi"
		},
		{
			nom: "lala", hdr:"Event I: Les challenges du LALA (Juin 2020)",
			mp3: "Memoire-qui-flanche", gains: 60,
			resume: "Hélas, je n'ai meme pas une archive vidéo de ce premier Evenement !"
		}
		
		
	]

	function clickEntree(entree) {
		if (entree.mp4) playVideo(entree.mp4)
		if (entree.mp3) playMusic(entree.mp3)
	}
</script>

<style>
	.titre { font-size: 1.2em; text-align: center; font-weight: bold }
	.gains { font-style: italic; color: yellow}
	.entree { border: 0.2em outset lightgreen; cursor: pointer;
						background: linear-gradient(to bottom right, green, transparent 30%),
												linear-gradient(45deg, red,  transparent 30%)
					}
	.imageDroite { width: 40%; float: right; }
	.fin { clear: both; }
	/*
	.grimoire {	cursor: pointer; font-weight: bold	}
	.ouvert { border: 2px solid lightgreen; background-color:black; font-size: 0.8em }
	.evt { text-decoration: underline }
	.event { font-weight: bold;	font-size: 1.2em;	text-decoration: underline;	cursor:pointer }
	.synthese { font-style: italic;	font-weight: bold }
	.quote { font-style: italic }
	.imageFull { width: 100% }
	.videoDroite { width: 100%; max-height: 70dvh; }
	*/
</style> 

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div>
	<div class="titre">
		Bienvenue à l'IPA-GBBB,
		<br/>
		l'Institut Peluchique de l'Audiovisuel de
		<br/>
		la Grande Bibliothèque du Bois Bandé
		<div role="button" class="videoLink" onclick={markClick} gpVideo="ff-10/IPA-BNF">
			Visite la BNF, l'IPA en IRL</div>
		<div class="br" />
		<div class="papier info">
			Les Peluches ont regroupé ici l'Histoire des Aventuriers des quatre dernières années.
			<br/>
			Tu retrouveras tes Hauts Faits parmi ces incunables des temps modernes.
		</div>
	</div>
	<div class="br" />
	{#each entrees as entree}
		{#if entree.nom}
			<div class="entree">
				{#if entree.img}
					<img class="imageDroite" src={entree.img} alt="" />
				{/if}
				<div role="button" tabindex=0 onclick={()=>clickEntree(entree)}>
					<div style="color:lightgreen">
						{#if entree.mp4}📽{/if}
						{entree.hdr}
					</div>	
					<div class="info">{@html entree.resume}</div>
					{#if entree.gains}
						<div class="gains">Les Aventuriers se sont répartis {entree.gains} millions de Gils</div>
					{/if}
				</div>
				{#each entrees as dep}
					{#if dep.dep == entree.nom}
						<div role="button" tabindex=0 onclick={()=>clickEntree(dep)}>
							➥{dep.hdr}📽
						</div>	
					{/if}
				{/each}
				<div class="fin" />
			</div>
			<div class="br" />
		{/if}
	{/each}

	<div class="br"/>
	<div>
		Ceci termine les Archives du Bois Bandé relatives aux mini jeux et aux événements
		organisés par Kikiadoc Lepetiot depuis plus de 4 ans.
	</div>
	<div>&nbsp;</div>

	<!-- page z/p1.svelte -->


</div>
