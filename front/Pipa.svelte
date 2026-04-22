<script>
	import { onMount, onDestroy  } from 'svelte';
	import { playVideo, playMusic, markClick, urlCdn,
					 apiCall, displayInfo, scrollPageToTop,
					 loadIt, storeIt, isAdmin, addNotification, displayObject
				 } from './common.js' 
	import Common from './Common.svelte'
	import Btn from './Btn.svelte'
	import { G }  from './privacy.js'

	let {
		wsCallComponents,
		pageDesc = null,
		pseudo,
		pseudoGenre,
		pseudoList,
		etatTTS = null,
		page = $bindable(),
		pageDone = $bindable([]),
		audioBack = $bindable(),
		audioAmbiance = $bindable(),
		audioVolume = $bindable(),
	} = $props();

	const entreesRef = [
		{
			nom: "marche2025", hdr:"Marche de Noël 2025",
			mp4:"X-ventes-privees/ventes-privees-f", gains: 140,
			resume: "Les fans des tenues, de housing, mascottes et montures sont aux anges",
			dep: [
				{
					dep: "marche2025", hdr:"L'annonce du marché de Noël",
					mp4:"X-ventes-privees/ventes-privees-t"
				},
			]
		},
		{
			nom: "metropolis", hdr:"Métropolis (Mars 2025)",
			mp4:"ff-10/ff-10-metro-trailer", gains: 32,
			resume: "Méphistophélès a fui Eorzéa... et a été vaincu dans l'Hyper-Temps",
			dep: [
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
					mp4:"ff-10/ff-10-metropolis-3d", like: true
				},
				{
					dep: "metropolis", hdr:"Retour en Eorzéa",
					mp4:"ff-10/ff-10-ortho-ring"
				},
				{
					dep: "metropolis", hdr:"Le sauvetage d'Eorzéa",
					mp4:"ff-10/ff-10-metro-trailer"
				},
			]
		},
		{
			nom: "hegemonie", hdr:"Event IX: L'Hégémonie (Janvier 2025)",
			mp4:"ff-7/ff-7-trailer", gains: 411, like: true,
			resume: "Les Nouveaux Anciens tente de prendre possession des âmes, et ils ont échoué!",
			dep: [
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
					mp4:"ff-7/ff-7-prelude-2", like: true
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
					mp4:"ff-7/ff-7-torches-1", like:true
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
					mp4:"ff-7/ff-7-spartaci-1", like: true
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
			]
		},
		
		{
			nom: "benchmark", hdr:"Benchmark pour l'Event IX (Juillet 2024)",
			mp4:"ff-7/ff-7-benchmark-trailer", gains: 7,
			resume: "Pour se préparer au Kiki's Event IX, les Aventuriers ont vérifié les caractéristiques de leurs équipements"
		},
		{
			nom: "innommable", hdr:"Nommer l'innommable (Mai 2024)",
			mp4:"ff14-innommable-trailer", gains: 20,
			resume: "En résolvant l'énigme du damier à rubans, les Aventuriers ont découvert le nom de l'innomable: Méphistophélès",
			dep: [
				{
					dep: "innommable", hdr:"Teaser: A la découverte de l'innnomable",
					mp4:"ff14-innommable"
				},
			]
		},
		{
			nom: "uchronie", hdr:"Event VIII: L'Uchronie (mars 2024)",
			mp4:"ff-6-trailer", gains: 388, like: true,
			resume: "L'Uchronie a perturbé le Temps, l'Espace et l'Histoire. Les Aventuriers les ont restaurés",
			dep: [
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
					mp4:"ff14-6-screens", like: true
				},
				{
					dep: "uchronie", hdr:"Challenge: Le cristal de l'Uchronie",
					mp4:"ff-6-cristal"
				},
				{
					dep: "uchronie", hdr:"Challenge: La restauration du Temps",
					mp4:"ff-6-dontgiveup", like: true
				},
				{
					dep: "uchronie", hdr:"Challenge: Le Dirac des Quatre",
					mp4:"ff-6-epilogue"
				},
			]
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
			mp4: "ff14-avant-uchronie", gains: 30, like: true,
			resume: "Alors que les Quatre explorent l'Ortho-Temps, l'Univers Connu semble perturbé par la Magie."
		},
		{
			nom: "broceliande", hdr:"Brocéliande (octobre 2023)",
			mp4: "ff-10/ff-10-sans-video", gains: 30, // lead: Fang 7.5m
			resume: "Les Aventuriers de Brocéliande ont dissipé les nombreux maléfices en résolvant des énigmes, \
							puis ils ont établi un itinéraire permettant de partir de la Grande Bibliothèque du Bois Bandé \
							et rejoindre le chateau de Camelot. Le Grand Grimoire de la Magie a alors été découvert",
			img: urlCdn+"Minijeu-Broceliande.png"
		},
		{
			nom: "transition", hdr:"La transition Magique (septembre 2023)",
			mp4: "ff-10/ff-10-sans-video", gains: 23,
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
			mp4: "ff-10/ff-10-sans-video", gains: 37, 
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
			mp4: "ff-5-trailer", gains: 350, like: true,
			resume: "Lors d'Hypostasis, les aventuriers vont réconcilier les Dimensions Quantiques et les Dimensions Classiques.\
				Il vont découvrir une nouvelle dimension, l'Ortho-temps et les Quatre vont aller l'explorer.",
			dep: [
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
					mp4:"ff-5-troubles", like:true
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
					mp4:"ff-5-chronogyre",like: true
				},
				{
					dep: "hypostasis", hdr:"Challenge: L'Ortho-temps'",
					mp4:"ff-5-epilogue"
				},
			]
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
				Les Aventuriers ont identifié les mascottes en lévitation.",
			dep: [
				{
					dep: "mascottes", hdr:"Teaser des mascottes de l'île",
					mp4: "ff-5-demain-mascottes", 
					resume: "Aventure dans la félicité insulaire"
				},
			]
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
			mp4: "ff-4-trailer", gains: 320, like: true,
			resume: "Après avoir aidé Anakin à maitriser les 4 pouvoirs et obtenu la capacité de replier l'espace,\
				les Compagnons de l'Ascension ont permis à Anakin et Luke de vaincre Sauron du Mordor\
				et empêcher la destruction de l'Univers Connu",
			dep: [
				{
					dep: "ascension", hdr:"Teaser: #1",
					mp4:"ff-4-teaser0"
				},
				{
					dep: "ascension", hdr:"Teaser: #2",
					mp4:"ff-4-teaser1", like: true
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
					mp4:"ff-4-4emepouvoir", like: true
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
					mp4:"ff-4-epicepourtous", like: true
				},
				{
					dep: "ascension", hdr:"Challenge: La Grande Menace",
					mp4:"ff-4-grandemenace"
				},
				{
					dep: "ascension", hdr:"Challenge: Les lieux de paix",
					mp4:"ff-4-lieuxdepaix", like: true
				},
				{
					dep: "ascension", hdr:"Challenge: La stratégie finale",
					mp4:"ff-4-distraire"
				},
				{
					dep: "ascension", hdr:"Challenge: La défaite de Mauron du Sordor",
					mp4:"ff-4-distraire"
				},
			]
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
			mp4: "ff-3-trailer", gains: 320, like:true,
			resume: "Ultimate Walker verra naître l'Amour entre Hikaru et Robin.\
				Les Aventuriers vont protéger cet Amour des velléités des Templiers et d'autres.\
				Cet Amour va sauver l'Univers Connu de Dark Vador.\
				Celui-ci redevient alors le jeune garçon nommé Anakin. Il sera élevé par ses deux papas.",
			dep: [
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
					mp4:"ff-3-temps", like: true
				},
				{
					dep: "ultimate", hdr:"Challenge: Le Labyrinthe",
					mp4:"ff-3-dedale", like: true 
				},
				{
					dep: "ultimate", hdr:"Challenge: Robin du Bois Bandé",
					mp4:"ff-3-robin"
				},
				{
					dep: "ultimate", hdr:"Challenge: Les templiers",
					mp4:"ff-3-templiers", like: true
				},
				{
					dep: "ultimate", hdr:"Challenge: Youki, Pépère et Mémère",
					mp4:"ff-3-youki"
				},
				{
					dep: "ultimate", hdr:"Challenge: Anakin et Robin, le rendez-vous",
					mp4:"ff-3-rendez-vous", like: true
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
					mp4:"ff-3-power-of-love", like: true
				},
			]
		},
		{
			nom: "retour", hdr:"Event IV: le Retour du Lala (septembre 2021)",
			mp4: "ff-2-final", gains: 200,
			resume: "Les Aventuriers vont participer à de multiples challenges proposés par un LALA.",
			dep: [
				{
					dep: "retour", hdr:"Teaser: #1",
					mp4:"ff-2-teaser", like: true
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
					mp4:"ff-2-lalaoutes", like: true
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
					mp4:"ff-2-boum-soluce", like: true
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
			]
		},
		{
			nom: "quinzaine", hdr:"Event III: La quinzaine LGBT (mai 2021)",
			mp4: "ff-1-quinzaine-final", gains: 140,
			resume: "A l'occasion de quinzaine LGBT, les Aventuriers participent à de multiples challenges.",
			dep: [
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
			]
		},
		{
			nom: "anniv", hdr:"Event II: L'anniversaire de Didi et Kiki (Décembre 2020)",
			mp4: "ff-0-final2", gains: 75,
			resume: "Quelques challenge pour la célébration des 36 ans de vie commune IRL de Kiki et de son Didi"
		},
		{
			nom: "lala", hdr:"Event I: Les challenges du LALA (Juin 2020)",
			mp4: "ff-10/ff-10-sans-video", gains: 60,
			resume: "Hélas, je n'ai meme pas une archive vidéo de ce premier Evenement !"
		}
	]
	////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()
	const VIDEOINIT='X-ipa/cabaret'

	const SCOREEXTRAORDINAIRE = 80*60*1000 // minutes de visionnage
	const SCOREEMERITE = SCOREEXTRAORDINAIRE * 0.4 // minutes de visionnage

	const HAUTFAITS = [ "néophyte","émérite","extraordinaire","fantastique" ]
	const NOTIFS = [
		null,
		{ titre: "Haut fait réalisé!", ding:"Applaudissements", back:"stars", img: "X-ipa/clap-3.gif",
			body: [ "Tu es "+G( (()=>pseudoGenre)(),"un ","une")+" cinéphile émérite",
							{ cls:"info", txt: "Contacte Kikiadoc pour récupérer tes gains"},	]
		},
		{ titre: "Haut fait réalisé!", ding:"Applaudissements", back:"stars", // img: "X-ipa/clap-3.gif",
			body: [ "Tu es "+G( (()=>pseudoGenre)(),"un ","une")+" cinéphile extraordinaire",
							{ cls:"info", txt: "Contacte Kikiadoc pour récupérer tes gains"},	]
		},
		{	titre: "Haut fait réalisé!", ding:"Applaudissements", back:"stars", // img: "X-ipa/clap-3.gif",
			body: ["Tu as obtenu le titre de cinéphile fantastique, c'est le plus haut niveau de reconnaissance.",
							{ cls:"info", txt: "Contacte Kikiadoc pour récupérer tes gains"},	]
		}
	]
	
	// Gestion de l'épique
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	// $effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes 
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))
	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.tri ??= false
		s.notifs ??= [] // flags notif des niveaux
		s.clsClickLvl ??= "blinkFlag"
		return s
	}

	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback); reset() });

	function init () { 
		if (!saisies.initVideo) {
			saisies.initVideo = true 
			playVideo(VIDEOINIT)
		}
		loadVideosStatus()
	}
	
	function reset () {}
	
	async function myWsCallback(m) { return false } 


	// tri des videos
	let entrees = $state(null)
	$effect(()=> entrees = (saisies?.tri) ? entreesRef : entreesRef.toReversed(entreesRef) )
	// index des videos "like" 
	let likes = {}
	let mp4s = {} // liste unique des mp4
	let nbUniques = $state(0) // nombre de video unique a visionner
	function reverseIndex() {
		entreesRef.forEach( (e) => {
			if (e.mp4) mp4s[e.mp4] = true // marque une video a lire
			if (e.like) likes[e.mp4] = true // marque un like
			if (e.dep) {
				e.dep.forEach( (d) => {
					if (d.mp4) mp4s[d.mp4] = true // marque une video a lire
					if (d.like) likes[d.mp4] = true
				})
			}
		})
		nbUniques = Object.keys(mp4s).length // nombre total de videos unique à lire
		// console.log("reverseIndex",mp4s,nbUniques)
	}
	reverseIndex()
	
	// Etat de lecture des vidéos { luDth: , score:  } indexé par le mp4
	let videosStatus = $state(null)
	function calcScore() {
		let s = 0 // score
		let nb= 0 // nb de videos lues intégralement
		console.log(videosStatus) 
		for (const e in videosStatus) {
			if (videosStatus[e]?.score > 0) {
				s+=videosStatus[e]?.score
				if (likes[e]) s+=videosStatus[e]?.score // si video "love" double les points
			}
			if (videosStatus[e]?.luDth) nb++ // nombre de video totalement lues
		}
		// calcul de synthese
		videosStatus.score = s
		videosStatus.nbLu = nb
		videosStatus.lvl =
			(nb >= nbUniques)? 3 :
			(s >= SCOREEXTRAORDINAIRE)? 2 :
			(s >= SCOREEMERITE)? 1 : 0
		// Notif eventuelles
		if ( !saisies.notifs[videosStatus.lvl] ) {
			saisies.notifs[videosStatus.lvl]=true // falg de notif
			if (NOTIFS[videosStatus.lvl]) displayInfo(NOTIFS[videosStatus.lvl])
		}
	}
	async function loadVideosStatus() {
		let ret = await apiCall("/contextes/ipa/"+pseudo)
		if (ret.status==200) videosStatus=ret.o
		calcScore()
	}
	async function videoEnd(mp4,duree,total) {
		console.log('videoEnd duree',mp4,duree,total)
		videosStatus[mp4] ??= {luDth: null, score: 0}
		// recalcul du score et push serveur
		if (total > videosStatus[mp4].score) { videosStatus[mp4].score = total }
		if (total >= duree) { videosStatus[mp4].luDth = Date.now() }
		calcScore()
		addNotification("Ton score de cinéphile est de "+Math.floor(videosStatus.score/1000),"green",10)
		console.log("videoEnd: optimisation de modif partielle à étudier")
		let ret =	await apiCall("/contextes/ipa/"+pseudo,'POST',videosStatus)
		if (ret.status==200) videosStatus = ret.o
	}
	function clickEntree(entree) {
		if (videosStatus[entree.mp4]?.luDth)
				displayInfo({titre: "Vidéo déjà vu en intégralité", class:"papier", ding:"Ding",
										 body: ["Tu as déjà vu cette vidéo.",
														"Tu n'obtiendras pas de points de cinéphile."]
										})
		if (entree.mp4) playVideo(entree.mp4,null,null,videoEnd)
		if (entree.mp3) playMusic(entree.mp3)
	}
	function getIconVideoLu(mp4,dummy) { 
		if (!mp4) return ""
		if (videosStatus[mp4]?.luDth) return "👁"
		return "➥"
	}
	function affNiveau() {
		saisies.clsClickLvl = ""
		displayInfo({
			titre:"Progression de cinéphile", img: "X-ipa/clap-3.gif",
			body:[ "Tu es cinéphile "+HAUTFAITS[videosStatus.lvl || 0]+".",
						 "Ton score est "+Math.floor(videosStatus.score/1000)+".",
						 "Tu as visionné "+videosStatus.nbLu+" vidéos uniques.", 
						 { cls: (videosStatus.lvl >=1)? "petit cGreen": "petit cRed", txt: "Niveau émérite: Score "+Math.round(SCOREEMERITE/1000)+" (0.5 Million Gils)"},
						 { cls: (videosStatus.lvl >=2)? "petit cGreen": "petit cRed", txt: "Niveau extraordinaire: Score "+Math.round(SCOREEXTRAORDINAIRE/1000)+" (1 Million en plus)"},
						 { cls: (videosStatus.lvl >=3)? "petit cGreen": "petit cRed", txt: "Niveau fantastique: Voir "+nbUniques+" vidéos uniques (1 Million en plus)"},
					 ]
		})
	}

	// Afficahge des résulats
	let dspResultat = $state(null)
	async function affResultat() {
		let ret =	await apiCall("/contextes/ipa",'GET') // charge tous les contextes 
		if (ret.status!=200) return
		// balaye la liste des participants
		let lstP = Object.keys(ret.o.pseudos)
		let tDsp = []
		lstP.forEach( (p) => tDsp.push({p:p, s:ret.o.pseudos[p].score||0, l:ret.o.pseudos[p].lvl||0, r:ret.o.pseudos[p].remb||0}))
		console.log("tDsp",tDsp)
		tDsp.sort( (a,b) => ( (b.s||0) - (a.s||0)))
		console.log("tDsp",tDsp)
		dspResultat = { lst: tDsp }
	}
	let dspRemboursement = $state(null)
	async function affRemboursement() {
		let ret =	await apiCall("/contextes/ipa",'GET') // charge tous les contextes 
		if (ret.status!=200) return
		dspRemboursement = ret.o
	}
	// remboursement pour pseudo p et niveau r
	async function admRemb(p,r) {
		let o = dspRemboursement.pseudos[p]
		o.remb = r
		let ret =	await apiCall("/contextes/ipa/"+p,'POST',o)
		affRemboursement()
	}
</script>

<style>
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
<div use:scrollPageToTop>
	{#if isAdmin(pseudo)}
		<div class="adminCadre" style="font-size: 0.5em">
			<input type="button" value="remboursement" onclick={affRemboursement} />
			<input type="button" value="resetLecturePerso"
				onclick={()=>{ confirm("Reset de toutes lectures de "+pseudo) && apiCall('/contextes/ipa/'+pseudo,'DELETE'); videosStatus={} }}
			/>
		</div>
	{/if}
	{#if videosStatus}
		<div>
			<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
			<input type="button" value="Résultat" onclick={affResultat} />
			<span role="button" style="cursor:pointer" onclick={affNiveau} >
				<span class={saisies.clsClickLvl}>💎</span>
				{#if videosStatus.lvl >=2 }
					{videosStatus.nbLu}/{nbUniques}
				{:else}
					<Common t="jauge" p={ {val:videosStatus.score, max:SCOREEXTRAORDINAIRE, s2:SCOREEMERITE }} />
				{/if}
			</span>
			<Common t="headerPage" pageDesc={pageDesc} />
		</div>
	{/if}

	{#if epiqStep==0 && videosStatus}
		<div class="reveal">
			<div>
				Bienvenue à l'IPA, l'Institut Peluchique de l'Audiovisuel.
			</div>
			<div class="br"/>
			<div>
				<input type="button" value="Revoir la vidéo d'introduction" onclick={()=>playVideo(VIDEOINIT)} />
			</div>
			<div class="br"/>
			<div>
				Les Peluches ont regroupé ici l'Histoire des Aventuriers des Kiki's Events
				depuis de nombreuses années sous la forme de dizaines de vidéos.
			</div>
			<div>
				En les visionnant, tu augmenteras ton score de cinéphilie et tu pourras réclamer jusque 2.5 Millions de Gils.
			</div>
			<div>
				Tu peux voir ton avancement en cliquant sur 💎 en haut de page.
			</div>
			<div class="petit">
				Légende des vidéos: 
				<div>➥: Vidéo à lire (points de cinéphile si lecture complète)</div>
				<div>❤️: Vidéo offrant un bonus de points de cinéphile</div>
				<div>👁: Vidéo vue intégralement (pas de point de cinéphile si elle est revisionnée)</div>
			</div>
			<Btn bind:refStep={epiqStep} step=90 val="Voir la liste des vidéos"
				ifFct={ ()=>{return apiCall('/clientConfig/confirmations/'+pageDesc.n,'POST') || true }} />
			<div class="info cOrange">
				Ce challenge a été réinitialisé le 2 avril 2026 pour acceuillir de nouveaux joueurs
			</div>
		</div>
	{/if}
	{#if epiqStep==90 && videosStatus}
		{@const clsFlag= (saisies.flagChrono ? "" : "blinkFlag" )}
		<div class="reveal">
			<span class={clsFlag}>
				<label>
					<input type="checkbox" bind:checked={saisies.tri} onclick={()=>saisies.flagChrono=true}/>
					{#if saisies.tri}
						Les derniers événements en premier
					{:else}
						Les événemements selon l'Histoire
					{/if}
				</label>
			</span>
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
							{getIconVideoLu(entree.mp4,videosStatus)}
							{#if entree.like}❤️{/if}
							{entree.hdr}
							{#if entree.mp4}📽{/if}
						</div>	
						<div class="info">{@html entree.resume}</div>
						{#if entree.gains}
							<div class="gains">Les Aventuriers se sont répartis {entree.gains} millions de Gils</div>
						{/if}
					</div>
					{#each entree.dep as dep}
						<div role="button" tabindex=0 onclick={()=>clickEntree(dep)}>
							{getIconVideoLu(dep.mp4,videosStatus)}
							{#if dep.like}❤️{/if}
							{dep.hdr}📽
						</div>	
					{/each}
					<div class="fin" />
				</div>
				<div class="br" />
			{/if}
		{/each}
		<div class="br"/>
		<div>
			Ceci termine les Archives du Bois Bandé relatives aux mini jeux et aux événements
			organisés par Kikiadoc Lepetiot depuis de nombreuses années.
		</div>
		<div>&nbsp;</div>
	{/if}

	{#if dspResultat}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultat=null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						<div>Scores de cinéphilie</div>
						<table class="resTable" >
							<tbody>
								{#each dspResultat.lst as p}
									<tr>
										<td class="resTd">{p.p}</td>
										<td class="resTd">
											{
												(p.l >=3)? "Fantastique!": 
												(p.l >=2)? "Extraordinaire":
												(p.l >=1)? "Emérite": "Novice"
											}
										</td>
										<td class="resTd">{Math.floor(p.s/1000)}</td>
										{#if (p.l > p.r)}
											<td gpHelp="Gils à réclamer" onclick={markClick} style="cursor:pointer">💰</td>
										{/if}
									</tr>
								{/each}
							</tbody>
						</table>
						<div>Nombre de cinéphiles: {dspResultat.lst.length}</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if dspRemboursement}
		{@const lstPseudos=Object.keys(dspRemboursement.pseudos)}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspRemboursement=null} onkeypress={null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						<table class="resTable" style="border: 1px solid white">
							<tbody>
								<tr><td>Pseudo</td><td>Lvl</td><td>Score</td><td>R fait</td><td></td><td>0.5M</td><td>1M</td><td>1M</td></tr>
								{#each lstPseudos as p}
									{@const desc=dspRemboursement.pseudos[p]}
									<tr>
										<td class="resTd">{p}</td>
										<td class="resTd">{desc.lvl}</td>
										<td class="resTd">{Math.floor(desc.score/1000)}</td>
										<td class="resTd">{desc.remb}</td>
										<td><input type="button" value="R0" onclick={()=>admRemb(p,0)} /></td>
										<td><input type="button" value="R1" onclick={()=>admRemb(p,1)} /></td>
										<td><input type="button" value="R2" onclick={()=>admRemb(p,2)} /></td>
										<td><input type="button" value="R3" onclick={()=>admRemb(p,3)} /></td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}
	<!-- page Pipa.svelte -->


</div>
