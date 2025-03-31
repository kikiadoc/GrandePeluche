<script>
	import { onMount, onDestroy  } from 'svelte'
	import { urlCdn, loadIt, storeIt, scrollPageToTop, getTypeEquipement,
					 audioPause, audioResume, playVideo,
					 setHautFait, getHautFait, jjmmhhmmss } from './storage.js'
	import { G }  from './privacy.js'
	import Ruban from './Ruban.svelte'

	const TBLNBBTNCHRONO= [{val:4,lbl:"4"},{val:6,lbl:"6"},{val:8,lbl:"8"},{val:10,lbl:"10"}]
	const TBLOPTIONSINDICES= [
		{val: 0, icon: urlCdn+"ff-10/metroChronoIcon-0.png"},
		{val: 1, icon: urlCdn+"ff-10/metroChronoIcon-1.png"},
		{val: 2, icon: urlCdn+"ff-10/metroChronoIcon-2.png"},
		{val: 3, icon: urlCdn+"ff-10/metroChronoIcon-3.png"},
		{val: 4, icon: urlCdn+"ff-10/metroChronoIcon-4.png"},
		{val: 5, icon: urlCdn+"ff-10/metroChronoIcon-5.png"},
		{val: 6, icon: urlCdn+"ff-10/metroChronoIcon-6.png"},
		{val: 7, icon: urlCdn+"ff-10/metroChronoIcon-7.png"},
		{val: 8, icon: urlCdn+"ff-10/metroChronoIcon-8.png"},
		{val: 9, icon: urlCdn+"ff-10/metroChronoIcon-9.png"}
	]
	const TBLINDICES= [
		{txt:"dans la chambre du Dirac des Dimensions", r:8}, // cristal d'erudit
		{txt:"dans le Club 18 (maison perso de Kikiadoc)", r:3}, // mage noir
		{txt:"dans les Jardins Suspendus (Lavandière, secteur 24, appart ??", r:4}, // mage blanc
		{txt:"dans la chambre du temps", r:9}, // cristal d'invocateur
		{txt:"dans le Bois Bandé, le territoire ancestral des Peluches (La Coupe, secteur 16, appart ??)", r:7}, 
		{txt:"dans la chambre du 4ème pouvoir", r:7}, // cristal de barde
		{txt:"dans la crypte des Valeureux (maison de cl de Kikiadoc)", r:4}, // mage blanc
		{txt:"dans le labyrinthe (chambre)", r:9 }, // cristal d'invocateur
		{txt:"dans la Chapelle du Bene Gesserit (La Coupe, secteur 15, appart ??", r:3}, //mage noir
		{txt:"dans le Temple des Dimensions Quantiques (Lavendière, secteur 5, appart ??)", r:9}, // invocateur
	]
	console.warn("NBINDICES=10 A coordonner (constante dans P400)")

	
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

	// etat des saisies persistantes
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// afficahge des popups standards
	let dspResultats=$state(false) 	// affichage des résltats

	// appelé apres mount du component
	async function init() {
		let ret = await apiCall("/shared/metropolis")
		if (ret.status==200) updateRunesMalefiques(ret.o)
	}
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		if (m.op=="shared.metropolis")	return updateRunesMalefiques(m.o)
		// if (m.op=="????" && m.o) .... return true 
		return false
	}

	// appelé lors d'un changement de step de l'épique 
	function epiqStepChange(newStep) {
		console.log("epiqStepChange=",newStep,typeof newStep)
		switch(Number(newStep)) {
			case 60: playVideo("ff-10/ff-10-metropolis-c"); break
			// case 80: playVideo("ff-10/chevron-8"); console.log('****************80'); break
			case 90: playVideo("ff-10/ff-10-ortho-ring"); break
			case 95: playVideo("ff-10/ff-10-metro-trailer"); setHautFait("metropolisMaitre",3); break
		}
	}

	import { markClick, addNotification, urlImg, apiCall } from './storage.js'
	import Btn from './z/Btn.svelte'
	import Cradio from './Cradio.svelte'
	import Cengine3D from './Cengine3D.svelte'

	let rubanTermine=$state(false)
	let accesPupitre = $state(false)
	let runesMalefiques = $state(null)
	let runesTimerDth = $state(Date.now())
	const RUNESDELAI = 120000

	// update les saisies des runes
	function updateRunesMalefiques(o) {
		// console.warn("updateRunesMalefiques",o)
		runesMalefiques = o.valeurs
		// si tout trouvé...
		if (epiqStep==90 && nbFinalReponseOK(runesMalefiques)==TBLINDICES.length) epiqStep=95
		return true
	}
	// propose une rune
	function proposeRuneMalefique(i,cIdx) {
		if (cIdx < 0) {
			if (Date.now()<runesTimerDth) addNotification("Tu dois te reposer","red",5,"prout-long")
			if (runesMalefiques[i].valeur==TBLINDICES[i].r) addNotification("La bonne rune est déjà trouvée","yellow",5,"ding-ding")
			return
		}
		apiCall("/shared/metropolis/"+i+"/"+cIdx,'POST')
		runesTimerDth = Date.now() + RUNESDELAI
	}
	// function stop{} 

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized 
		s.btnChronogyre ??= 0
		return s
	}

	// callbak sur ruban termine
	function cbRubanTermine(t) {
		rubanTermine = t
		if (epiqStep==70 && rubanTermine) epiqStep=80
	}
	// calcul le nombre de bonne réponses
	function nbFinalReponseOK(runes) {
		// console.log("runes:",runes)
		if (!runes) return 0
		let nbOk = 0
		for (let i=0;i<TBLINDICES.length;i++)
			if (runesMalefiques[i].valeur==TBLINDICES[i].r) nbOk++
		return nbOk
	}

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
				<input type="button" value="resetRuban" onclick={async () => dspObject=confirm("resetRuban") && await apiCall('/rubans/metropolis','DELETE')} />
				<input type="button" value="resetChallenge" onclick={async () => dspObject=confirm("resetChallenge") && await apiCall('/metropolis/all','DELETE')} />
				<input type="button" value="resetShare" onclick={async () => dspObject=confirm("resetShare") && await apiCall('/shared/metropolis','DELETE')} />
				<input type="button" value="resetTimerShare" onclick={()=>runesTimerDth=Date.now()} />
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={async () => dspResultats=await getHautFait('metropolisMaitre')} />
	</div>
	{#if dspResultats}
		{@const pseudos = Object.keys(dspResultats.pseudos)}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Voici les Maîtres de Métropolis
					</div>
					<hr/>
					{#each pseudos as p,i}
						<div>
							{p} {jjmmhhmmss(dspResultats.pseudos[p].dth)}
						</div>
					{/each}
					<hr/>
					<div>Total: {pseudos.length}</div>
					<div>Gains: {pseudos.length*500} Kgils par maître</div>
				</div>
			</div>
		</div>
	{/if}

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
			<Btn bind:refStep={epiqStep} step=5 val="Je veux participe à tout ça!"
				hautFait="metropolisNovice" />
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
				(version 2025)
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
			<img class="parchemin" src={urlImg+"ff-10/metropolis.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Tu peux vérifier:
				<input type="button" value="Etat de Metacache" onclick={GBLCTX.metaCacheTest} />
			</div>
			<div class="br" />
			<div>
				Et maintenant, es-tu prêt{G(pseudoGenre,'','e')} à t'immerger dans le Lore de Métropolis?
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
			<img class="parchemin" src={urlImg+"ff-10/metropolis.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Voici le lore de Métropolis:
			</div>
			<div class="br" />
			<div>
				Lors du Kiki's Event IX, l'Hégémonie, les Douze ont bouté Méphistophélès hors d'Eorzéa.
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
			<img class="parchemin" src={urlImg+"ff-10/metropolis.jpg"} style="width:30%; float:right" alt="" />
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
			<img class="parchemin" src={urlImg+"ff-10/metropolis.jpg"} style="width:30%; float:right" alt="" />
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
			<img class="parchemin" src={urlImg+"ff-10/metropolis.jpg"} style="width:30%; float:right" alt="" />
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
			<img class="parchemin" src={urlImg+"ff-10/metropolis.jpg"} style="width:30%; float:right" alt="" />
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
			<Cradio nom="btnChronogyre"	bind:value={saisies.btnChronogyre} options={TBLNBBTNCHRONO} />
			<Btn bind:refStep={epiqStep} ifFct={()=>saisies.btnChronogyre==8} step=60
				hautFait="metropolisPadawan" val="➤"
				koMsg="Ce n'est pas ca"/>
		</div>
	{/if}

	{#if epiqStep==60}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlImg+"ff-10/metropolis.jpg"} style="width:30%; float:right" alt="" />
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
				{#if rubanTermine}
					<Btn bind:refStep={epiqStep} step=80 val="Rendez-vous dans l'Ortho-Temps" />
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
					cbEtat={cbRubanTermine}
					bind:dspObject={dspObject}
				/>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==75}
		<div class="reveal" use:scrollPageToTop>
			<audio id="orthoConsignes" autoplay src={urlCdn+"ff-10/orthoConsignes.mp3"}
				onended={()=>audioResume()} onplay={()=>audioPause()} />
			<input type="button" value="Je veux écouter à nouveau la Grande Peluche🔊" onclick={()=>document.getElementById('orthoConsignes').play()} />
			<div class="info">Je te laisse découvrir l'Ortho-temps et ses mécaniques:</div>
			<div class="info">➥Sur PC, tu as une souris et une molette de souris</div>
			<div class="info">➥Sur Smartphone, tu as tes doigts</div>
			<div>
				<Btn bind:refStep={epiqStep} step=80 video="ff-10/chevron-8" val="Je veux me rendre dans l'Ortho-Temps" />
			</div>
			<div><u>Lacunes et bugs connus:</u></div>
			<div class="info">
				<div class="adminCadre">
					<div class="blinkMsg">Règle de base en cas de souci</div>
					<div>➥Clique sur le bouton (dans la zone 3D) et sélectionne "aller à l'entrée"</div>
					<div>➥Clique sur le bouton (dans la zone 3D) et sélectionne "recharger"</div>
					<div>➥Recharge la page (via F5) (ne pas utiliser ctrl-F5 sur PC, cela désactive MetaCache)</div>
					<div>➥C'est la merde! Contacte Kikiadoc</div>
				</div>
				<div class="adminCadre">
					➥Quand tu arrives, tu te déplaces ou tu utilises l'Ortho-téléportation (icône 👤), 
					tu peux te retrouver “à l’intérieur” d’un autre perso.
					<br/>👉Déplace toi un peu, ça va passer!
					<br/>🔎Mon algorithme de gestion des collisions est buggé et je l’ai désactivé
				</div>
				<div class="adminCadre">
					➥Les vidéos et notifications ne s'affichent pas si tu es en mode "vrai fullscreen"
					dans l'Univers 3D (utile sur smartphone uniquement)
					<br/>👉pas de solution actuellement
					<br/>🔎Je connais la cause mais il me faut réflechir encore...
				</div>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==79}
		<div class="reveal" use:scrollPageToTop>
			<div>
				<Btn bind:refStep={epiqStep} step=80 video="ff-10/chevron-8" val="Je veux retourner dans l'Ortho-Temps" />
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<Cengine3D GBLCTX={GBLCTX} wsCallComponents={wsCallComponents}
				pseudo={pseudo} pseudoGenre={pseudoGenre} pseudoList={pseudoList} resetStep=75
				bind:epiqStep={epiqStep} bind:dspObject={dspObject} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==90}
		<div class="reveal" use:scrollPageToTop>
			<div>
				<input type="button" value="Revoir la vidéo" gpVideo="ff-10/ff-10-ortho-ring" onclick={markClick} />
				<span class="infoLink" onclick={markClick} gpHelp="Temps avant d'indiquer une rune">
					⏳<countdown dth={runesTimerDth} oncdTimeout={()=>{console.log('runesTimerDth');runesTimerDth=0}} />
				</span>
			</div>
			<div>
				Grâce au flux éthéré de chaque Ardoise découverte dans l'Ortho-Temps,
				j'ai pu identifier les lieux
				où Méphistophélès a déposé des runes maléfiques.
				Va dans les lieux concernés et indique moi la Rune que tu y trouveras
			</div>
			<div class="info">
				Il n'y a qu'une rune par lieu, mais elle peut être cachée.
				N'hésite pas à explorer à plusieurs.
				Tu ne peux proposer qu'une rune toutes les {RUNESDELAI/60000} minutes,
				fais profiter tes amis de tes découvertes, elles sont partagées.
			</div>
			{#if runesMalefiques}
				{#each runesMalefiques as rune,i}
					{@const lock= Date.now()<runesTimerDth || rune.valeur==TBLINDICES[i].r }
					<hr/>
					<div>
						<span style="cursor:pointer" class={(lock)?"":"blinkFlag"} gpHelp={"Méphistophéles à dissimulé une rune "+TBLINDICES[i].txt} onclick={markClick}>
							{i+1}😈
						</span>
						<Cradio nom={"btnFinal"+i}
							bind:value={rune.valeur}
							lock={lock}
							cb={(cIdx)=>proposeRuneMalefique(i,cIdx)}
							options={TBLOPTIONSINDICES} />
					</div>
				{/each}
				<hr/>
				{#if nbFinalReponseOK(runesMalefiques)==TBLINDICES.length}
					<Btn bind:refStep={epiqStep} step=95 val="Go Final" />
				{/if}
				{#if pseudo.startsWith("Kikiadoc") }
					{nbFinalReponseOK(runesMalefiques)}/{TBLINDICES.length}
				{/if}
			{/if}
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
					
	{#if epiqStep==95}
		<div class="reveal" use:scrollPageToTop>
			<div>
				<input type="button" value="Revoir la vidéo" gpVideo="ff-10/ff-10-metro-trailer" onclick={markClick} />
			</div>
			Tu es maintenant un Maître de Métropolis
			<div style="clear:both"/>
		</div>
	{/if}
	
</div>
<!-- P400.svelte -->
