<script>
	import { onMount, onDestroy  } from 'svelte'
	import { loadIt, storeIt, scrollPageToTop, getTypeEquipement } from './storage.js'
	import { G }  from './privacy.js'
	import Ruban from './Ruban.svelte'
	
	let {
		GBLCTX,
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
		dspObject = $bindable()
	} = $props();

	const PAGEEPIQLBL= "P"+pageDesc.n+"_epiqStep"
	const PAGESAISIESLBL = "P"+pageDesc.n + "_saisies"
	
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))
	let accesPupitre = $state(false)

	// etat des saisies persistantes
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// afficahge des popups standards
	let dspResultats=$state(false) 	// affichage des résltats

	////////////////////////////////////////////////
	// A modifier dans un vrai composant
	////////////////////////////////////////////////
	// appelé apres mount du component
	function init() {	}
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		s.btnChronogyre ??= 0
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	////////////////////////////////////////////////
	// A supprimer dans un vrai composant
	////////////////////////////////////////////////
	// options lié aux tests a supprimer
	import { markClick, addNotification, urlImg, apiCall } from './storage.js'
	import Btn from './z/Btn.svelte'
	import Cradio from './Cradio.svelte'
	const tblNbBtnChrono= [{val:4,lbl:"4"},{val:6,lbl:"6"},{val:8,lbl:"8"},{val:10,lbl:"10"}]
	import Cengine3D from './Cengine3D.svelte'
	let cbRubantermine=$state(false)
	
	////////////////////////////////////////////////
	// FIN DU A supprimer dans un vrai composant
	////////////////////////////////////////////////
	

</script>
<style>
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div>
	{#if pseudo.startsWith('Kikiadoc')}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin: epiqStep={epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="resetChallenge" onclick={async () => dspObject=await apiCall('/metropolis/all','DELETE')} />
				<input type="button" value="resetRuban" onclick={async () => dspObject=await apiCall('/rubans/metropolis','DELETE')} />
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={() => dspResultats=true} />
		<span role="button"	style="cursor: pointer" onclick={async ()=>{ dspObject=await apiCall('/metrologie/etat')}}>
		🆘
		</span>
	</div>
	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Indiquer le resultat selon dspResultats
					</div>
				</div>
			</div>
		</div>
	{/if}
	<!-- Partie a supprimer -->
	<!-- Partie a supprimer -->
	<!-- Partie a supprimer -->

	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" onclick={markClick}
				gpLink="https://docs.google.com/presentation/d/1J0lS2HCwqHOObIsbB2IgGe4ODiviIvyo3_5dYZ4Gpy8/edit?usp=sharing"
				src={urlImg+"ff-10/gp-architecture-v10b.png"} style="cursor: pointer; width:50%; float:right" alt="" />
			<div>
				Bienvenue dans le mini jeu Métropolis.
			</div>
			<div class="br" />
			<div>
				Ce mini-jeu te permettra de gagner plusieurs millions de gils en y participant,
				mais aussi de contribuer à la
				<u>validation	de l'architecture V10</u>
				du site.
			</div>
			<div class="br" />
			<div>
				Tu peux cliquer sur l'image à droite pour voir le détail.
			</div>
			<div class="br" />
			<Btn bind:refStep={epiqStep} step=5 val="Je veux participe à tout ça!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==2} // Etpae desactivee
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" onclick={markClick}
				gpLink="https://docs.google.com/presentation/d/1J0lS2HCwqHOObIsbB2IgGe4ODiviIvyo3_5dYZ4Gpy8/edit?usp=sharing"
				src={urlImg+"ff-10/gp-architecture-v10b.png"} style="cursor: pointer; width:50%; float:right" alt="" />
			<div>
				L'architecture V10 du site met en oeuvre des techniques récentes, parfois même expérimentales,
				alors si tu vois une <span class="blinkMsg">QUELCONQUE ANOMALIE</span>
				ou simplement une question, un temps trop long, un soucis d'ergonomie, etc...
				c'est direct sur le canal Discussion de Discord ou un MP à Kikiadoc.
			</div>
			<div class="br" />
			<Btn bind:refStep={epiqStep} step=5 val="Je n'hésiterai pas" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==5}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" onclick={markClick}
				gpLink="https://docs.google.com/presentation/d/1J0lS2HCwqHOObIsbB2IgGe4ODiviIvyo3_5dYZ4Gpy8/edit?usp=sharing"
				src={urlImg+"ff-10/gp-architecture-v10b.png"} style="cursor: pointer; width:50%; float:right" alt="" />
			<div class="br" />
			<div>
				L'architecture V10 est une évolution très importante, mais
				de nombreuses évolutions techniques sont presque invisibles:</div>
			<div onclick={markClick} style="cursor: pointer"
				gpHelp="Pour permettre l'utilisation de bibliothèques dynamiques dans ton navigateur, les règles de sécurité du site ont été durcies. DeepCheckSec vérifie en temps réel la validité des accès réseau réalisés depuis ton navigateur quand tu es sur le site de la Grande Peluche (https://ff14.adhoc.click)">
				➥Activation de nouveaux mécanismes de sécurité (DeepCheckSec)<sup>(i)</sup>
			</div>
			<div onclick={markClick} style="cursor: pointer"
				gpHelp="HTTP/3 et Brotli/1.1 sont les protocoles de transport et de compression les plus performants en 2025">
				➥Activation de HTTP/3 et Brotli/1.1<sup>(i)</sup>
			</div>
			<div onclick={markClick} style="cursor: pointer"
				gpHelp="Le cache standard du navigateur n'est pas suffisant dans certaines situations, d'où la mise en oeuvre d'un cache complémentaire pour les gros fichiers. Le site utilise maintenant 4 niveaux de cache pour les données statiques: Références sécurisées (si besoin) ⇛ CDN ⇛ MetaCache (si besoin) ⇛ cache de navigateur">
				➥Mise en oeuvre d'un cache supplémentaire (MetaCache)<sup>(i)</sup>
			</div>
			<div onclick={markClick} style="cursor: pointer"
				gpHelp="Le site va décider plus précisément, selon ton contexte, de ce qu'il convient de t'offrir comme possibillités. Il utilise l'Event Bubbling de façon évoluée pour cumuler différentes réactions à tes actions">
				➥Nouvelle technique de gestion de tes intéractions (saisies, liens, boutons...)<sup>(i)</sup>
			</div>
			<div onclick={markClick} style="cursor: pointer"
				gpHelp="L'activation d'une vidéo synchronisée sur l'ensemble des connectés, ou un passage d'étape du Lore peut être ordonnée par le serveur et ne nécessite plus un état particulier du client.">
				➥Simplification de la synchro des videos et passages d'étape en multi-joueurs<sup>(i)</sup>
			</div>
			<div onclick={markClick} style="cursor: pointer"
				gpHelp="Si, par exemple, tu fermais ton navigateur au milieu d'une saisie, elle était perdue. Ce ne sera plus le cas">
				➥Amélioration de la résilience de ton contexte intéractif sur le site<sup>(i)</sup>
			</div>
			<div class="br"/>
			<div>
				<u>Et tu découvriras dans la suite deux évolutions très visibles:</u>
			</div>
			<div>➥Adaptation des dialogues selon ton genre</div>
			<div>➥Intégration d'un moteur 3D</div>
			<Btn bind:refStep={epiqStep} step=10 val="Un moteur 3D, kézako?" />
			<Btn bind:refStep={epiqStep} step=10 val="S'adapter à mon genre?" />
			<div class="info">
				Info sur
				<a target="_blank" href="https://en.wikipedia.org/wiki/HTTP/3">HTTP/3</a>
				(validé en 2022)
				<br/>
				Info sur
				<a target="_blank" href="https://en.wikipedia.org/wiki/Brotli">Brotli/1.1</a>
				(validée en 2023).
				<br/>
				Info sur
				<a target="_blank" href="https://en.wikipedia.org/wiki/Event_bubbling">l'Event Bubbling</a>(vintage)
				<br/>
				Info sur
				<a target="_blank" href="https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API">Service Worker</a>
				(Version 2025)
				<br/>
				Info sur
				<a target="_blank" href="https://fr.wikipedia.org/wiki/Content_Security_Policy">CSP</a>,
				<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy">
						COOP</a>,
				<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy">
						COEP</a>et
				<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security">
						HSTP
				</a>(balises de sécurité de DeepCheckSec)
				<br/>
				Info sur
				<a target="_blank" href="https://fr.wikipedia.org/wiki/Babylon.js">BabylonJS</a>(version 2025)
				<br/>
				Info sur
				<a target="_blank" href="https://developer.mozilla.org/fr/docs/Web/API/Cache">les Caches</a>
				(avec fonctions expérimentales)
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==10}
		{@const genreLbl = GBLCTX.TBL_GENRES.find((e)=> e.val==pseudoGenre).lbl}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			<div>Tu es toujours aussi inpatient{G(pseudoGenre,"","e")}, {pseudo}...</div>
			<div>Je vais t'expliquer tout cela, mais procédons par ordre.</div>
			<div class="br"/>
			<div>
				Une nouvelle fonctionnalité est d'adapter nos intéractions selon ton genre actuel:
				<span class="infoLink" gpHelp="Ton genre est important, mais est une information sensible. Cette information reste uniquement sur ton appareil. Tu peux la modifier en cliquant sur ton pseudo en haut à droite du site. Je l'utilise pour adapter nos intéractions en post-traitement sur ton équipement. Ni Kikiadoc, ni moi en avons connaissance. Elle n'est jamais communiquée au server">
					{genreLbl}
				</span>
			</div>
			<div class="info">
				J'utiliserai donc
				{#if pseudoGenre=='M'}
					le masculin
				{:else if pseudoGenre=='F'}
					le féminin
				{:else}	
					le masculin ou le féminin <u>selon mon humeur</u>
				{/if}.
				<br/>
				A titre d'exemple, "tu es heureu..." se décline, à cet instant, selon ton genre en
				"tu es heureu{G(pseudoGenre,"x","se")}".
			</div>
			<div class="info">
				Pour éviter de passer sous les fourches caudines de la
				<a href="https://www.cnil.fr/fr" target="_blank">CNIL</a>
				et respecter au mieux
				<a href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees">
					le règlement RGPD
				</a>,
				tes données personnelles sensibles (ex: ton genre...) sont uniquement
				stockées sur ton appareil dans un stockage privé (le 
				<a href="https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage" target="_blank">
					Local Storage
				</a>
				accessible quand tu es sur le site https://ff14.adhoc.click).
				Elles ne sont jamais stockées sur le serveur.
				Les traitements les utilisant sont des post-traitements réalisés uniquement sur ton appareil.
			</div>
			<div class="info">
				Cette fonctionnalité semble simple, mais est en réalité très complexe pour couvrir tous les cas.
				Tu dois la considérer comme expérimentale.
			</div>
			<div onclick={markClick} gpHelp="N'oublie pas, tu peux modifier ton genre à tout moment. Pour celà clique sur ton pseudo en haut à droite de ton écran et modifie-le. Tu en verras les effets immédiats sur la page affichée">
				<Btn val="Je veux changer mon genre" />
				<Btn bind:refStep={epiqStep} step=20 val="Pour mon genre, {genreLbl}, c'est OK" />
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"ff-10/minority-report.png"} style="width:30%; float:right" alt="" />
			<div style="cursor:pointer" onclick={markClick} gpHelp="J'utilise des fonctions non risquées mais expérimentales, aussi mon diagnostic peut-être erroné">
				Je me suis permise de faire une analyse de ton equipement<sup>(i)</sup>
			</div>
			<div class="br"/>
			{#if navigator.connection}
				<div style="color:yellow" onclick={markClick} gpHelp="Infos depuis l'Object navigator.connection">
					{#if navigator.connection.type=="ethernet"}
						Tu es connecté en Ethernet, c'est parfait.
					{:else if navigator.connection.type=="wifi"}
						Tu es connecté en Wifi, c'est bien.
					{:else if navigator.connection.type=="cellular"}
						Tu es sur smartphone. Si tu utilises ton abonnement mobile, bascule en Wifi sur ta box si c'est possible puis recharge la page.
					{:else}
						Je n'ai pas identifié exactement ton type de connexion.
						{#if getTypeEquipement()=="PC"}
							Tu es sur PC, aussi je suppose que tu es connecté à ta box en Ethernet, CPL ou Wifi.
						{:else}
							Tu es sur ton smartphone. Si tu utilises ton abonnement mobile, bascule en Wifi sur ta box si c'est possible puis recharge la page.
						{/if}
					{/if}
				</div>
			{:else}
				<div style="color:yellow">
					Je n'ai pas pu déterminer ton type de connexion.
					Si tu utilises actuellement ton mobile et un "petit" abonnement,
					bascule sur ta box en Wifi.
				</div>
			{/if}
			<div class="br"/>
			{#if window.crossOriginIsolated}
				<div>
					DeepCheckSec est <span style="color:lightGreen">active</span>. 
					Cette page est isolée pour ta sécurité.
				</div>
			{:else}
				<div style="color:red">
					DeepCheckSec n'est pas active. Pour ta sécurité, contacte Kikiadoc.
				</div>
			{/if}
			<div class="br"/>
			{#if ("serviceWorker" in navigator) && navigator.serviceWorker.controller}
				<div style="color:lightgreen">
					MetaCache est active.
				</div>
			{:else}
				<div style="color:red">
					MetaCache n'est pas active. Tes téléchargements ne seront pas optimisés.
					<div>
						<span class="blinkMsg">Pour activer MetaCache:</span>
						<br/>
						Recharge le site par ctrl-F5, puis recharge a nouveau par F5 (oui 2 rechargements).
						<br/>
						Si cela ne fonctione pas,
						ferme tous tes onglets sur le site puis ferme ton navigateur.
						Rouvre-le et reviens alors sur le site.
						<br/>
						Si cela ne fonctionne pas, contacte Kikiadoc.
					</div>
				</div>
			{/if}
			{#if navigator.storage?.estimate}
				{#await navigator.storage.estimate()}
					<div>Calcul en cours...</div>
				{:then e}
					{@const storage= e.quota/(1024*1024*1024)}
					{@const storageOk = storage>0.5}
					<div style="cursor: pointer" role="button" onclick={markClick} gpHelp="Cette information est approximative. Ce n'est pas ton espace disponible sur HDD, SSD ou SD">
						{#if storageOk}
							<span style="color:lightgreen" role="button" >
								Tu disposes d'un stockage local utilisable par Metacache de {storage.toFixed(2)}Go<sup>(i)</sup>
							</span>
						{:else}
							<span style="color:red" role="button" >
								Attention, tu disposes d'un stockage local de {storage.toFixed(2)}Go,
								ce n'est pas suffisant pour que Metacache puisse fonctionner de façon optimale<sup>(i)</sup>
							</span>
						{/if}
					</div>
				{:catch error}
					<div style="color: red">{error.message}</div>
				{/await}
			{:else}
				<div style="color:yellow">
					Ton navigateur ne permet pas l'analyse du stockage associé au site par storage.estimate
				</div>
			{/if}
			<div class="br"/>
			{#if ("serviceWorker" in navigator) && navigator.serviceWorker.controller && window.crossOriginIsolated}
				<Btn bind:refStep={epiqStep} step=30 val="Cool, tout est ok" />
			{:else}
				<Btn bind:refStep={epiqStep} step=30 ding="call-to-attention" val="Continuer sans les deux Peluches" />
			{/if}
		</div>
	{/if}
			
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			<input type="button" value="Etat de Metacache" onclick={GBLCTX.metaCacheTest} />
			<div>
				Es-tu prêt{G(pseudoGenre,'','e')} à t'immerger dans le Lore?
			</div>
			<Btn bind:refStep={epiqStep} step=0 val="Je suis con{G(pseudoGenre,'','ne')}, je clique nimp"
				msg="On ne clique pas sans avoir lu...."/>
			<Btn bind:refStep={epiqStep} step=0 val="Je n'ai pas lu le texte"
				msg="On ne clique pas sans avoir lu...."/>
			<Btn bind:refStep={epiqStep} step=40 val="Oui, le Lore cheffe!!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==40}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"lore.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Ok, voici le Lore alors!
			</div>
			<div class="br" />
			<div>
				Lors du Kiki's Event IX, l'Hégémonie, les Douze ont bouté Méphistophélès hors Eorzéa.
				<span class="videoLink" onclick={markClick} gpVideo="ff-7/ff-7-trailer" >
					Tu peux revoir ici leurs Aventures
				</span>
			</div>
			<div class="br" />
			<div>
				Tu sais que les Quatre explorent toujours l'Ortho-Temps depuis que les
				Jedis des Savoirs ont rétabli l'équilibre entre les Dimensions Quantiques
				et les dimensions Classiques lors du 
				<span class="videoLink" onclick={markClick} gpVideo="ff-5-trailer" >
					Kiki's Event VII, Hypostasis
				</span>.
				Cela nous a permis de mieux comprendre notre Univers Connu, selon
				ses 5 dimensions.
			</div>
			<div class="br" />
			<div>
				Mais il y a quelques jours, selon le Temps Classique,
				je me suis inquiétée quand j'ai recu un message des Quatre:
				Ils ont percu un <u>bang supertemporel dans l'Ortho-Temps</u>.
			</div>
			<div>
				Un bang supertemporel, c'est un peu comme quand
				on entend une explosion lorsqu'un avion franchit le
				mur du son et passe en vitesse supersonique.
				Cela se produit alors que quelque chose provoque une distorsion
				de l'axe temporel et se téléporte dans une autre
				Dimension Quantique.
			</div>
			<div>
				Je suppose que c'est Méphistophélès qui l'a provoqué en quittant notre Univers Connu.
			</div>
			<div>
			</div>
			<Btn bind:refStep={epiqStep} step=42 val="Bon débarras!" />
			<Btn bind:refStep={epiqStep} step=44 val="Et tu es inquiète?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==42}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"lore.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Tu as raison, bon débarras!
				<br/>
				Mais je suppose qu'il n'est pas parti de notre Univers Connu 
				sans nous laisser un "héritage maléfique" alors cela m'inquiète.
			</div>
			<Btn bind:refStep={epiqStep} step=50 val="Je comprend!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==44}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"lore.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Oui, je suis inquiète.
				Que Méphistophélès ai quitté notre Univers Connu est une bonne nouvelle,
				mais je suppose qu'il n'est pas parti de notre Univers Connu 
				sans nous laisser un "héritage maléfique"
			</div>
			<Btn bind:refStep={epiqStep} step=50 val="Je comprend!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==50}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"lore.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Si Méphistophélès s'est rendu dans l'Ortho-Temps avant de quitter notre Univers Connu,
				il a du utiliser le	Chronogyre d'Eorzéa.
			</div>
			<div class="br" />
			<div>
				Mais te souviens-tu des améliorations apportées pour permettre l'exploration de 
				l'Ortho-Temps? 
			</div>
			<div class="br" />
			<div class="videoLink" onclick={markClick} gpVideo="ff-5-chronogyre" >
				Te Souviens-tu de l'hypothèse d'Anakin et du Chronogyre?
			</div>
			<div class="br" />
			<div>
				Tu utilises tous les jours les Éthérites.
				C'est un TP en 3 dimensions, le Chronogyre, c'est 5 dimensions.
			</div>
			<div class="br" />
			<div>
				Va dans le complexe du Chronogyre, je t'expliquerai ensuite quoi faire!
			</div>
			<Btn bind:refStep={epiqStep} step=52 val="Je sais où c'est" />
			<Btn bind:refStep={epiqStep} step=52 val="Heu.. c'est où?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==52}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"lore.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Je vais commener par quelques explications...
			</div>
			<div>
				Si Méphistophélès s'est enfui dans l'Ortho-Temps, le Chronogyre a du mémoriser
				les coordonnnées utilisées. Tant qu'il n'est pas reinitialisé,
				les dernières coordonnées utilisées sont toujours indiquées
				sur le premier anneau des dimensions du Chronogyre.
			</div>
			<div>
				Tu vas pouvoir recomposer les coordonnées du voyage de Méphistophéles
				sur le pupitre de commande du Chronogyre, mais attention:
				Le flux Ortho-Temporel généré lors de l'utilisation du pupitre est tel
				qu'il y a une petite difficulté:
			</div>
			<div>
				Si tu es seul{G(pseudoGenre,'','e')} à composer les coordonnées, tu mettras plus de 30 heures de temps classique.
				<u>Le faire à plusieurs et à tour de rôle</u>,
				réduit ce temps de façon TRES importante.
			</div>
			<div>
				Le Chronogyre est situé à La Coupe, secteur 8, appartement 69.
			</div>
			<div>
				Vas-y et indiques moi le nombre de runes de coordonnées qui se trouvent sur le Premier Anneau.
			</div>
			<Cradio nom="btnChronogyre"	bind:value={saisies.btnChronogyre} options={tblNbBtnChrono} />
			<Btn bind:refStep={epiqStep} ifFct={()=>saisies.btnChronogyre==8} step=60
				hautFait="metropolisNovice" video="ff-10/ff-10-metropolis-c" val=">"
				koMsg="Ce n'est pas ca"/>
		</div>
	{/if}

	{#if epiqStep==60}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"lore.jpg"} style="width:20%; float:right" alt="" />
			<Btn video="ff-10/ff-10-metropolis-c" val="Revoir la vidéo" />
			<div>
				Huit runes, cela désigne un lieu dans un univers parallèle indexé par l'Ortho-Temps.
			</div>
			<div class="br"/>
			<div>
				Les Quatre m'ont parlé d'un endroit nommé Métropolis.
				C'est là que se serait produit le bang super-temporel dont je parlais.
				Probablement que les coordonnées sont celles de cet endroit.
			</div>
			<div class="br" />
			{#if !accesPupitre }
				<div style="color:red">
					Ha mais, Hildiscord, en plus de dire des bêtises sur Discord, a bidouillé les
					engrenages du pupitre.
					Il faut que je répare tout ça.
				</div>
				<div style="color:red">
					Tu ne pourras utiliser le pupitre du Chronogyre que dans
					<countdown dth={pageDesc.start+60*60000} txtTimeout="Maintenant" oncdTimeout={()=>accesPupitre=true } />
				</div>
				<div class="br"/>
				<div class="blinkMsg">
					Quand cela sera possible, n'oublie pas de rejoindre tes amis sur Discord pour synchroniser toutes vos actions
					sur le pupitre du Chronogyre.
				</div>
			{:else}
				<div style="color:lightgreen">
					Ha mais, Hildiscord, en plus de dire des bêtises sur Discord, a bidouillé les
					engrenages du pupitre.
					Bon, ce n'est pas grave, je l'ai réparé.
					Je te laisse découvrir le fonctionnement du Pupitre de commande du Chronogyre.
				</div>
				<div class="br"/>
				<div class="blinkMsg">
					Retrouve tes amis sur Discord pour synchroniser toutes vos actions
					sur le pupitre du Chronogyre.
				</div>
				<Btn bind:refStep={epiqStep} step=70 val="Aller au pupitre" msg="Ce mini-jeu est en collaboration, retrouve tes amis sur Discord et synchronise tes actions" />
			{/if}
			<div>
				Plus il y a de joueurs présents, plus le flux de l'Ortho-temps sera
				<a href="https://fr.wikipedia.org/wiki/Diffraction" target="_blank">
					diffracté
				</a>
				et plus le Temps Classique sera raccouci.
				<span class="imgLink" onclick={markClick} gpImg="ff-10/helpPupitreChronogyre.png">Voir les explications</span>
				Cela facilitera les actions de tous.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==70}
		<div class="reveal" use:scrollPageToTop>
			<div style="margin:auto; text-align:center">
				{#if cbRubantermine}
					<Btn bind:refStep={epiqStep} step=80 video="ff-10/chevron-8" val="Rendez-vous dans l'Ortho-Temps" />
				{:else}
					Positionne les chevrons du Chronogyre
				{/if}
			</div>
			<div style="font-size:0.7em">
				<Ruban nom="metropolis"
					wsCallComponents={wsCallComponents}
					pseudo={pseudo}
					pseudoGenre={pseudoGenre}
					pseudoList={pseudoList}
					cbEtat={(t)=>cbRubantermine=t}
					bind:dspObject={dspObject}
				/>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<Cengine3D GBLCTX={GBLCTX} wsCallComponents={wsCallComponents}
				pseudo={pseudo} pseudoGenre={pseudoGenre} pseudoList={pseudoList} resetStep=70
				bind:epiqStep={epiqStep} bind:dspObject={dspObject} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}


<!--	
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			Allez... Souviens-toi...
			<div class="br" />
			Tout le monde connait aujourd'hui l'histoire des Quatre: Robin, Hikaru, Luke et Anakin.
			Ils sont parti explorer l'Ortho-temps, la 5ème dimension de l'espace classique.
			
			Mais leur Histoire a commencé bien avant que Kikiadoc m'élève au rand de Grande Peluche.
			Sais-tu que l'Univers Connu n'aurai pas été apaisé si Robin et Hikaru ne s'était pas
			définitivmenet déclaté leur amour après leur rendez-vous manqué?
			Sais-tu qu'Anakin n'aurai jamais rencontré son fils Luke sans sa resureccion et son ascension ?
			
			après avoir rétabli l'équilibre des Dimensions lors d'Hypostasis.
			Mais peu se souviennent que tous celà n'aurai pas été possible si l'Amour en Hiakru et Robin
			avait été contrarié lors d'un rendez-vous manque.
			Peu se souviennent que Luke rencontrera Anakin, son père lors du combat contre 
			la grande menace.
			(c'est l'unique cas de resurecction mentionné dans le Grimoire des Savoirs., 
			En une époque immémoriale, alors que je n'étais qu'une bébé Peluche parmi d'autres dans le bois Bandé,
			Robin et Hikaru ont failli ne pas se déclarer leur amour à cause d'un rendez-vous manque.
			C'est cet amour qui apaisera l'Univers Connu et fera renaitre Anakin lors d'Utimate Walker.
			Puis, alors que je commencais l'étude des grimoires de la Grande Bibliothèque du Bois Bandé,
			Anakin va maitriser les 4 et 3, rencontrer Luke son fils et vaincre la Grande Menace lors de l'ascension d'anakin
			
			qui a fait faillir Dark Vador et qu'il redevienne un enfant.
			file:///P:/Public%20Folder/ff-3-rendez-vous.mp4
			Depuis ils sont inséparables, dans leurs amours et dans leurs Aventures.
			Alors que je commencais à étudier les Grimoires de la Grande Bibliothèque du Bois Bandé,
			Luke a retrouvé Anakin, son père et acompagné son ascension.
			Alors que Kikiadoc venait de m'initier au role de Grande Peluche, j'ai eu l'honneur
			d'accompagner les Jedis des Savoirs lors de l'aventure d'Hypostasys.
			C'est ainsi que la 5ème dimension, l'Ortho-temps a été découverte.
			
			
			<div>
			</div>
			<div class="br" />
			<div>
			</div>
			<div class="info">
			</div>
			<Btn bind:refStep={epiqStep} step=0 val="Je suis con{G(pseudoGenre,'','ne')}, je clique nimp"
				msg="On ne clique pas sans avoir lu...."/>
			<Btn bind:refStep={epiqStep} step=50 val="Oui cheffe, bien cheffe!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"ff-10/minority-report.png"} style="width:30%; float:right" alt="" />
			<div>
				N'oublie pas que ta mission est aussi d'aider Kikiadoc à valider
				les nouvelles fonctions du site.
			</div>
			<div class="br"/>
			<Btn bind:refStep={epiqStep} step=0 val="Je suis con{G(pseudoGenre,'','ne')}, je clique nimp"
				msg="On ne clique pas sans avoir lu...."/>
			<Btn bind:refStep={epiqStep} step=40 val="Oui, je sais!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==80}
			<div>L'architecture V10, c'est deux nouvelles Peluches:</div>
			<div>➥DeepCheckSec pour vérifier que tous les accès réseaux de ton navigateur sont légitimes</div>
			<div>➥MetaCache pour optimiser tes téléchargements de fichiers de gros columes</div>
			<div>➥BabylonJS pour permettre une immersion en 3D</div>
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"ff-10/minority-report.png"} style="width:30%; float:right" alt="" />
			<div>Je me suis permise d'analyser ton équipement...</div>
			{#if ("serviceWorker" in navigator) && navigator.serviceWorker.controller}
				<div style="color:lightgreen">
					MetaCache est actif sur ton équipement.
					Tu peux lui demander diverses actions et informations en cliquant sur ton pseudo
					en haut à droite de ton écran et en scrollant la popup vers le bas.
				</div>
			{:else}
				<div style="color:red">
					MetaCache n'est pas active. Tes téléchargements ne seront pas optimisés.
					<div>
						<span class="blinkMsg">Pour activer MetaCache:</span>
						Ferme tous tes onglets sur le site puis ferme ton navigateur. Rouvre-le et reviens alors sur le site.
						Si cela ne fonctionne pas, contacte Kikiadoc.
					</div>
				</div>
			{/if}
			{#if ("serviceWorker" in navigator) && navigator.serviceWorker.controller}
				<Btn bind:refStep={epiqStep} step=10 val="Continuer avec MetaCache" />
			{:else}
				<Btn bind:refStep={epiqStep} step=10 ding="call-to-attention" back="rouge" 
					msg="Attention, sans MetaCache, tes performances seront dégradées" val="Continuer sans MetaCache" />
			{/if}
			<div class="info">
				Si on était dans Star Trek,
				le rêve secret de Kikiadoc serait que tu considères ce site
				comme un vaisseau de classe "Enterprise" de dernière génération alliant
				sécurité de l'équipage,
				sécurité du vaisseau,
				capacité à découvrir de nouveaux mondes et de nouvelles expériences
				tout en écartant les menaces, même la menace fantôme.
			</div>
			<div class="br"/>
			<div class="info">
				Dans le monde réel, le rêve de Kikiadoc est bien plus limité: 
				Te proposer de nouvelles expériences de jeu tout en assurant ta sécurité en tentant
				de respecter toutes les recommandations de
				<a href="https://cyber.gouv.fr" target="_blank">
					l'ANSSI.
				</a>
			</div>
			<div class="info">
				Ainsi, chaque évolution technique comprend, d'une part, des nouveautés
				pour caler le site à l'état de l'art des technologies Web du moment, 
				et, d'autre part, des améliorations de la cybersécurité du site.
			</div>
			<div class="br"/>
			<div class="info">
				Le site de la Grande Peluche est aujourd'hui bien plus sécurisé
				que la grande majorité des serveurs du Web:
			</div>
			<div class="info">
				➥Coté exécution, il met en oeuvre deux firewalls externes et un troisième firewall adaptatif
				avec blocage en temps réel des accès illicites. Ensuite, un reverse-proxy vérifie la
				sémantique des requêtes avec bannissement automatique en cas d'anomalie.
				Il surveille aussi en temps réel les concurrences d'accès.
				Il utilise de clefs de sécurité éphémères évitant les mots de passe (style
				<a href="https://fidoalliance.org/fido2/" target="_blank">
					FIDO2
				</a>
				mais
				<span onclick={markClick} style="cursor: pointer; color:lightgreen" 
					gpHelp="La diversité des équipements ne le permet pas, c'est pourquoi la clef privée n'est pas protégée par biométrie">
					sans biométrie<sup>(i)</sup>,
				</span>
				il cloisonne ses traitements,
				et applique une procédure automatique de 'PLS' en cas de
				<span onclick={markClick} style="cursor: pointer; color: lightgreen"
					gpHelp="Le server est trop petit pour supporter une attaque DDOS. La politique de Kikiadoc est de fermer les firewalls en cas d'attaque massive et de reporter l'attaque sur des composants plus capacitaires du backbone Internet, tout en protégeant le serveur">
					détection d'attaques non maîtrisables
					(style DDOS)
					<sup>(i)</sup>
				</span>
			</div>
			<div class="info">
				➥Côté organisation avec des sauvegardes quotidiennes historisées pendant 30 jours
				sur site distants 
				(le site fonctionne dans un datacenter AWS à Paris,
				les sauvegardes sont sur pCloud au Luxembourg et à Zurich),
				les accès "administrateur" sont restreints par
				<a href="https://fr.wikipedia.org/wiki/Certificat_%C3%A9lectronique" target="_blank">
					certificats
				</a>
				et 
				<a href="https://fr.wikipedia.org/wiki/Mot_de_passe_%C3%A0_usage_unique_bas%C3%A9_sur_le_temps" target="_blank">
					MFA par TOTP
				</a>
				<span onclick={markClick} style="cursor: pointer" gpHelp="Le MFA par SMS, bien qu'utilisé par les banques, est régulièrement hacké. Par ailleurs, si Free, France Travail et bien d'autres... avaient mis en oeuvre certificats et MFA-TOTP single device, des millions de données personnelles ne seraient pas dans la nature. Bon après c'est bien plus facile ici que sur un site d'entreprise.">
				(de vraies solutions<sup>(i)</sup>, pas des SMS de merde).
				Le Plan de reprise d'activité (PRA) est défini et a été testé 
				pour dupliquer le serveur avant la dernière version technique majeure (Linux+Svelte).
				Si l'architecture du site est compatible avec un
				<a href="https://fr.wikipedia.org/wiki/Plan_de_continuit%C3%A9_d%27activit%C3%A9_(informatique)" target="_bank">
				Plan de continuité d'activité
				</a>A
				son coût est élevé pour un site personnel (20€/mois) et n'est pas mis en oeuvre.
				Le seul PRA permet de garantir un RTO de moins de 24 heures, ce qui est suffisant
				pour un site "personnel"
			</div>
			<div class="info">
				L'architecture V10 va au delà de tout cela: Elle tente de sécuriser l'exécution
				des traitements réalisés dans ton navigateur en suivant les
				<a href="https://cyber.gouv.fr/publications/securiser-un-site-web" target="_blank">
					recommandations de l'Agence Nationale de Sécurité des Systèmes d'information
					coté navigateur.
				</a>
			</div>
			<div class="info">
				Sur les 63 recommandations de l'ANSSI, 59 sont totalement repectées,
				3 restent à mettre, et une n'est volontairement pas respectée par choix de Kikiadoc.
			</div>
			<div class="info">
				Ma nouvelle assistante
				<a targe="_blank" href="https://cyber.gouv.fr/publications/securiser-un-site-web">
					DeepCheckSec
				</a>
				consiste principalement en l'activation dans ton navigateur de
				balises de sécurité
				<a target="_blank" href="https://developer.mozilla.org/fr/docs/Web/HTTP/CSP">
					CSP
				</a>,
				<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy">
					COOP
				</a>
				et
				<a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy">
					COEP
				</a>
				envoyées par mon
				<a href="https://en.wikipedia.org/wiki/Reverse_proxy" target="_blank">
					reverse-proxy
				</a>
				et mon
				<a target="_blank" href="https://en.wikipedia.org/wiki/Content_delivery_network">
					CDN
				</a>.
			</div>
			<div class="info">
				Ma nouvelle assistante
				<a targe="_blank" href="https://developer.mozilla.org/fr/docs/Web/API/Cache">
					MetaCache
				</a>
				se télécharge dans un 
				<a target="_blank" href="https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API">
					serviceWorker
				</a>
				de ton navigateur.
				<br/>
				Elle te permet d'utiliser la dernière version
				<a target="_blank" href="https://en.wikipedia.org/wiki/HTTP/3">
					HTTP/3
				</a>
				(validé en 2022)
				et la meilleure compression 'on fly'
				<a target="_blank" href="https://en.wikipedia.org/wiki/Brotli">
				Brotli/1.1
				</a>
				(validée en 2023).
				Elle va ainsi optimiser tes téléchargements et conserver des copies des très gros fichiers
				pour que ton navigateur puisse les utiliser très rapidement si besoin.
				<div class="br" />
				Je vais aussi utiliser
				<a href="https://fr.wikipedia.org/wiki/Babylon.js" target="_blank">
					BabylonJS
				</a>
				(version de février 2025) pour le rendu 3D.
				Je n'en maîtrise pas tous les comportements, en particulier pour
				les éléments téléchargés dynamiquement.
				C'est pourquoi 
				DeepChecksec et MetaCache vont vérifier en temps réel
				tous les accès réseau réalisés afin 
				de n'autoriser que ceux qui ont été validés par Kikiadoc au préalable 
				(cette protection n'est active que pour https://ff14.adhoc.click).
				<div class="br" />
				Pas de panique, tout cela n'est pas un "hack", c'est la mise en oeuvre
				de bonnes pratiques récentes en terme de cyber-sécurité.
			</div>
			{#if ("serviceWorker" in navigator) && navigator.serviceWorker.controller}
				<Btn bind:refStep={epiqStep} step=45 val="Continuer avec MetaCache" />
			{:else}
				<Btn bind:refStep={epiqStep} step=45 ding="call-to-attention" back="rouge" 
					msg="Attention, sans MetaCache, tes performances seront dégradées" val="Continuer sans MetaCache" />
			{/if}
		</div>
	{/if}
	
	
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<div>
				Les tests ci-dessous ne seront pas, pour toi, une nouvelle expérience,
				mais ils mettent en oeuvre de nouvelles techniques qu'il convient de valider.
				<br />
				Les vidéos que tu verras lors des tests sont vintage:
				Elles datent d'une époque où je n'avais pas encore été elevée à la Dignité de Grande Peluche!
				<br/>
				N'hésite pas à les regarder en intégralité: Si tu ne les as pas encore vu, ce sera l'occasion
				de découvrir des expériences que tes prédécesseurs ont vécues,
				et si tu as les as vécues, de faire remonter des souvenirs heureux!
			</div>
			<hr/>
			<div>👉Clique sur "lien", "image" et "vidéo" ci-dessous et vérifie qu'il n'y a pas d'anomalie</div>
			<div>
				<a href="https://fr.wikipedia.org/wiki/Hyperlien" target="_blank">Lien</a>
				<span class="imgLink" gpImg="oracle.jpg">image</span>
				<span class="videoLink" gpVideo="ff-2-disco">video</span>
			</div>
			<div class="info">
				Le site met en oeuvre une technique d'héritage de comportement plutôt
				qu'un comportement unique lorsque, par exemple, tu fais un clic:
				Le comportement dynamique de ton action est alors complété lors de 
				<a href="https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling" target="_blank">
				l'event bubbling
				</a> et ne se limite plus à une action uniquement liée, par exemple, au bouton que tu cliques.
				Ainsi ton expérience s'adapte au contexte général dans lequel tu évolues sur le site.
			</div>
			<hr/>
			<div>
				👉Sélectionne ou change la sélection des boutons ci-dessous,
				tu verras une notification, un popup d'explication et entendras un ding.
				Ta sélection sera alors indiquée sur la ligne "Bouton=".
				Elle doit correspondre au bouton que tu as sélectionné.
			</div>
			<div>
				<span onclick={markClick} gpHelp="Test gpHelp" gpNotif="Test gpNotif" gpDing="Ding">
					<Cradio nom="testRadio" bind:value={saisies.pipoVal} options={tests.radioOptions} />
				</span>
			</div>
			<div>Bouton={saisies.pipoVal}</div>
			<div class="info">
				Le composant "bouton radio" utilise aussi l'event bubbling pour cumuler des comportements.
				Il utilise en plus un nouveau mécanisme de persistance automatique dans ton navigateur.
				La valeur indiquée dans "bouton=" est la valeur persistée automatiquement par
				ce nouveau mécanisme.
				Cela rend le site plus résilient en cas de fermeture brutale de ton navigateur
				ou de passage en veille, même en cours de saisie d'une valeur.
			</div>
			<hr/>
			<div>👉Si tu as vu une anomalie, n'oublie pas de MP Kikiadoc.</div>
			<div>Tu peux maintenant passer à l'étape suivante du Lore en cliquant ci-dessous</div>
			<div>Lors du clic, tu verras une vidéo et une popup</div>
			<Btn bind:refStep={epiqStep} step=20 video="ff-3-rendez-vous" val="Next ➤"
				msg="Cette vidéo date d'une époque lointaine où Robin et Hikaru n'était pas le couple qui partira explorer l'Ortho-Temps "/>
			<div class="info">
				Le bouton "Lore" permet l'évolution dans le Lore comme auparavent.
				Il peut inclure maintenant des comportements contextuels.
			</div>
		</div>
	{/if}
		
	
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"ff-10/minority-report.png"} style="width:30%; float:right" alt="" />
			Tu vas tester mon <span class="blinkMsg">univers 3D</span>.
			<div class="br" />
			N'oublie pas que cela reste une expérience et
			que cela ne présage pas des futurs challenges du Kiki's Event X.
			<div class="br" />
			<div>
				Pour cela, je vais utiliser de nombreuses nouvelles techniques
				et manipuler de gros volumes de données au format
				<a target="_blank" href="https://en.wikipedia.org/wiki/GlTF">glTF2.0</a>.
			</div>
			<div>
				Pour m'aider à faire tout ca, j'ai fait appel à ma copine
				BabylonJS
				pour le rendu 3D
				et intégré
				deux nouvelles Peluches dans l'équipe,
				DeepCheckSec
				pour la sécurité
				et
				MetaCache
				pour la performance.
			</div>
			{#if ("serviceWorker" in navigator) && navigator.serviceWorker.controller}
				<div style="color:lightgreen">
					MetaCache est actif sur ton équipement.
					Tu peux lui demander diverses actions et informations en cliquant sur ton pseudo
					en haut à droite de ton écran et en scrollant la popup vers le bas.
				</div>
			{:else}
				<div style="color:red">
					MetaCache n'est pas actif sur ton équipement...
					<br/>
					Pour activer MetaCache,
					<span class="blinkMsg">fait les opérations suivantes DANS L'ORDRE</span>:
					Recharge la page (F5), ferme ton navigateur, relance le et revient sur le site.
					Si cela ne fonctionne pas, contacte Kikiadoc.
					<br/>
				</div>
			{/if}
			</div>
			{#if ("serviceWorker" in navigator) && navigator.serviceWorker.controller}
				<Btn bind:refStep={epiqStep} step=45 val="Continuer avec MetaCache" />
			{:else}
				<Btn bind:refStep={epiqStep} step=45 ding="call-to-attention" back="rouge" 
					msg="Attention, sans MetaCache, tes performances seront dégradées" val="Continuer sans MetaCache" />
			{/if}
		</div>
	{/if}

	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			La première fois, le téléchargement durera une dizaine de secondes,
			plusieurs dizaines de secondes ou même quelques minutes...
			Il y a de très nombreux facteurs qui vont influencer ta vitesse de téléchargement.
			<div class="br" />
			<div>
				Les modèles 3D de test, c'est près de 500Mo à télécharger.
				c'est VOLONTAIREMENT GROS pour les tests.
			</div>
			<div class="br" />
			<div>
				Pour le premier téléchargement, si tu es sur smartphone et 
				si tu as un "petit" forfait mobile, active le WIFI pour ne pas risquer d'éclater ton forfait.
			</div>
			<div class="info">
				C'est une mesure de précaution: lors des premiers tests et à cause d'un bug,
				Kikiadoc a téléchargé 28Go en une heure.
			</div>
			<div class="br" />
			<div>
				En cliquant sur ton pseudo en haut à droite de ton écran puis en scrollant en bas du popup
				tu pourras voir l'état de DeepCheckSec, de MetaCache et de BabylonJS et y faire quelques
				actions. En cliquant sur "voir mes données", tu peux afficher les données de métrologie
				remontées sur le serveur.
			</div>
			<div class="info">
				Certaines informations
				liées à l'analyse de performance de ton équipement, à ta connexion Internet,
				et ton usage des nouvelles techniques (MetaCache, CDN, Moteur 3D...)
				seront remontées au serveur pendant ce mini-jeu afin de permettre à Kikiadoc
				de mieux préparer le prochain événement.
			</div>
			<div>
				<Btn bind:refStep={epiqStep} step=50 val="Go live 3D" />
			</div>
		</div>
	{/if}

	{#if epiqStep==47}
		<div class="reveal" use:scrollPageToTop>
				<Cradio nom="connexion" bind:value={saisies.connexion} options={tests.connexionOptions} />
			<div class="br" />
			<div onclick={markClick} style="cursor: pointer" class="blinkMsg"
				gpHelp="Si tout se passe bien,
								tu ne devrais télécharger les modeles 3D qu'une seule fois (400Mo),
								même avec une connexion mobile changeant d'adresse IP.
								Mais si l'optimisation ne fonctionne pas, ou s'il y a un bug,
								il faut savoir que Kikiadoc a téléchargé 28Go en moins d'une heure
								lors de ses premiers tests sans l'optimisation">
				Si c'est la première fois que tu tentes cette expérience, évite d'utiliser une connexion
				sur réseau mobile si tu as un "petit" forfait (style 10Go):
				Tu vas télécharger près de 400Mo mais en cas de soucis, BEAUCOUP plus<sup>(i)</sup>
			</div>
			<div class="br" />
			<div>
				Si tu es connecté en WIFI sur ta box et que ton débit WIFI est un peu faible,
				il peut être le maillon faible et ajouter plusieurs dizaines de secondes au téléchargement initial.
			</div>
			<div class="br" />
			<div>
				<div class="blinkMsg">
					Si ta box est en ADSL sur cuivre (souci de débit) ou
					via satellite (NordNet, OrangeSat, Starlink...) (souci de latence), MP Kikiadoc.
				</div>
				Je ne pense pas que ce soit ton cas, vu que tu joues à FF14, mais on ne sait jamais...
			</div>
			<div class="br" />
			Enfin,
			si tu cliques sur ton pseudo, en haut à droite de ton écran, et que tu 
			scrolles en fin du popup,
			tu verras différentes informations sur l'état du moteur 3D et du méta-cache
			ainsi que des actions pour en maîtriser les fonctions.
			<div class="br" />
			<Btn bind:refStep={epiqStep} step=50 val="Go live 3D" />
			<div class="br" />
			Je vais donc pouvoir optimiser la chaine de téléchargement de ton navigateur:
			<br/>
			Logique du mini-jeu ⇛ in-memory ⇛ cache ⇛ <span style="color:red">méta-cache</span>
			⇛ Réseau local (WIFI?) ⇛ FAI (Orange,Free...) ⇛ CDN (Paris, Londres, Francfort ou Dublin)
			⇛ Stockage référentiel sécurisé (Luxembourg ou Zurich)
			<div class="info">
				<sup>(i)</sup>
				Le cache standard d'un navigateur est trop limité pour stocker des modèles 3D
				de mondes virtuels:
				La taille de certains éléments peuvent dépasser plusieurs centaines de mégaoctets.
				Et je ne parle pas ici des 80 Gigas des modèles 3D de FF14!
				<br/>
				FF14 ne peut être une pure application "Web", mais le site doit le rester.
				<br/>
				Aussi, le site,
				pour stocker de façon intelligente certaines données,
				met en oeuvre
				une cascade de techniques éprouvées:
				Une technique de "méta-cache" piloté via un
				<a href="https://developer.mozilla.org/fr/docs/Web/API/Service_Worker_API" target="_blank">
					serviceWorker
				</a>
				(technique utilisée par Youtube.com)
				couplé à un CDN 
				<a href="https://aws.amazon.com/fr/cloudfront/" target="_blank">
					CloudFront
				</a>
				(outil utilisé par le groupe M6 ou Amazon pour diffuser du contenu, des vidéos,
				des chaines de télé...)
				lui-même couplé à une origine référentielle de données disponibles depuis un 
				<a href="https://www.pcloud.com/fr/eu" target="_blank">
					stockage sécurisé
				</a>
				(pCloud.com)
				. Cela permet aussi, si tu utilises le site
				sur un smartphone sans wifi, d'optimiser tes coûts
				en t'affranchissant des limites du cache de ton navigateur
				et en ne téléchargenat qu'une fois les
				fichiers les plus volumineux.
			</div>
			<div class="br" />
		</div>
	{/if}
	{#if epiqStep==50}
		<div class="reveal" use:scrollPageToTop>
			<Cengine3D GBLCTX={GBLCTX} wsCallComponents={wsCallComponents}
				pseudo={pseudo} pseudoGenre={pseudoGenre}
				bind:epiqStep={epiqStep}
				bind:dspObject={dspObject} />
		</div>
	{/if}

	{#if epiqStep==99}
		<div class="reveal" use:scrollPageToTop>
			Test LORE: Etape de challenge 99
		</div>
	{/if}

			<div>
				Dans ce mini-jeu, un Lore simple mais pas de multiples challenges comme lors d'un Evènement:
				seulement quelques étapes permettant de vérifier les nouvelles techniques mises en oeuvre
				et un mini-jeu tirant profit de l'architecture V10 du site.
			</div>
			<div class="info">
				<sup>(ii)</sup>
				Pour info, voici mon retour d'expérience personnelle des temps de chargement selon mes configs de tests:
				<br/>
				PC de jeu: Fibre 1Gbit, Ethernet 1Gbit, CPU 6x>4.1Ghz(12Vcore) GPU: nVidia RTX 2060 6Go
				<br/>
				PC portable: Fibre 1Gbit, WIFI >500Mbit, CPU 4x>4.1Ghz(8Vcore) GPU: nVidia RTX 3050 6Go
				<br/>
				Smartphone #1: Fibre 1Gbit, WIFI >500Mbit, Android 13
				<br/>
				Smartphone #2: Mobile 5G (Free), Android 13
				<br/>
				Tablette #1: Fibre 1Gbit, WIFI >500Mbit, Android 14
				<br/>
				Tablette #2: Fibre 1Gbit, WIFI >50Mbit, Android 13
				<div class="br" />
				Rappel: Stockage sécurisé ⇛ CDN ⇛ méta-cache ⇛ in-memory ⇛ 😊!
				<div class="br" />
				<div><b><u>(cas rare)</u></b></div>
				Si les modèles 3D ne sont pas dans ton cache, pas dans le méta-cache, pas dans le CDN,
				et que stockage sécurisé a "gelé" les fichiers:
				1 à 2 minutes sont nécessaires à faire "fondre la glace".
				Tu ne devrais pas être dans ce cas. Kikadoc fait attention à précharger le CDN.
				<br/>
				<div><b>(cas normal à la première expérience)</b></div>
				Si les modèles 3D ne sont pas dans ton cache, pas dans le méta-cache,
				mais dans le CDN:
				entre 10 secondes et 1 minute, variable selon ta connexion internet,
				ton Wifi ou ta connexion mobile (3/4/5G)
				<br/>
				<div><b>(cas normal après la première expérience)</b></div>
				Si les modèles 3D ne sont pas dans ton cache, mais dans le méta-cache:
				moins de 3 secondes,
				le temps dépend de ton processeur et de ton disque (ou SSD)
				<br/>
				<div><b>(cas normal après la première expérience)</b></div>
				Si les modèles 3D sont dans ton cache ou in-memory:
				moins d'une seconde,
				le temps dépend de ton processeur et de ta carte graphique
			</div>
-->
	
	<!-- Fin Partie a supprimer -->
	<!-- Fin Partie a supprimer -->
	<!-- Fin Partie a supprimer -->
	<!-- Fin Partie a supprimer -->
</div>
<!-- PSample.svelte -->
