<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 generateSecurityAlert
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
	
	let {
		GBLCTX,
		wsCallComponents,
		pageDesc = null,
		pseudo,
		pseudoGenre,
		pseudoList,
		page = $bindable(0),
		pageDone = $bindable([]),
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

	////////////////////////////////////////////////
	// A modifier dans un vrai composant
	////////////////////////////////////////////////
	// appelé apres mount du component
	function init() {	getMetadata(); getNovices() }
	
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
		// s.pipoVal ??= 0 // exemple de normalized
		s.aleaReq ??= Math.floor(Math.random()*100) // Nombre demandé pour lecture popup
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	//////////////////////////////////////////////////
	// spécifique composant
	//////////////////////////////////////////////////
	import { addNotification, apiCall, getEpsilon,
					 urlCdn, urlRaw, jjmmhhmmss 
				 } from './common.js'
	import Btn from './Btn.svelte'
	import Upload from './Upload.svelte'

	const EVENEMENT_NOM="Kiki_X_TBD" // literal evenement
	const EVENEMENT_TEC="Kiki_X" // nom tchnique evenement
	const VIDEO_PIPO="ff-3-rendez-vous" // Video en attente d'une nouvelle

	//////////////////////////////////////////////////
	// gestion des metadata 
	//////////////////////////////////////////////////
	let metadata = null
	async function getMetadata() {
		let ret = await apiCall('/clientConfig/metadata');
		if (ret.status == 200) { metadata = ret.o }
	}
	
	//////////////////////////////////////////////////
	// gestion des novices
	//////////////////////////////////////////////////
	const NOVICIAT_HF=EVENEMENT_TEC+"_initiatique"
	const NOVICIAT_LBL = EVENEMENT_NOM // usage en texte
	const NOVICIAT_DISCORD = EVENEMENT_NOM // nom du channel discord
	const NOVICIAT_NBMAX = 20 // nombre max d'inscription automatique
	let novices = $state(null)
	let dspNoviciat = $state(false);
	async function getNovices(msgWs) {
		let ret = msgWs || await apiCall('/hautsFaits/'+NOVICIAT_HF);
		if (ret.status == 200) {
			novices = ret.o;
			novices.nb = Object.keys(novices.pseudos).length
		}
	}
	async function addNovice() {
		const hfLvl = (novices && novices.nb < NOVICIAT_NBMAX)? 0:1
		await apiCall('/discord/reqGrant/'+NOVICIAT_DISCORD,'PUT') // resultat ignoré msg sur discord
		let ret = await apiCall('/hautsFaits/'+NOVICIAT_HF+'/'+hfLvl,'PUT')
		if (ret.status==200) addNotification("Tu es déjà un novice de "+NOVICIAT_LBL,"lightgreen",10)
		if (ret.status==201 && hfLvl>=1)
			displayInfo({
				titre:"Attention",
				body:"Je t'ai inscrit dans la liste d'attente car le quota de participants est atteint",
				trailer:"Contacte Kikiadoc sur Discord"
			})
		return true // pour utilisation dans un ifFct d'un btn
	}
	//////////////////////////////////////////////////
	// boutons d'assistance pour le reglage audio
	//////////////////////////////////////////////////
	const AUDIO_PLAYMUSIC="LOTR-connaissances"
	async function audioRien() {
		GBLSTATE.audioAmbiance = true;
		GBLSTATE.audioBack=true
		GBLSTATE.audioVolume=50
		playMusic(AUDIO_PLAYMUSIC,true)
		displayInfo({
			titre: "Aucun son n'est audible", back:"papier",
			body:[
						"J'ai réinitialisé le volume d'AudioBlaster à 50% et relancé la bande sonore depuis le début.",
						"Si tu n'entends toujours rien, vérifie que le son du navigateur est activé au niveau du mixer global de ton appareil",
						"Sur Windows, vérifie aussi que tu n'as pas 'mute' l'onglet du site et que le son de ton navigateur est autorisé",
						"Sur Smartphone, vérifie aussi que tu n'as pas désactivé l'autorisation de son du site",
						"Si tu n'entends toujours rien, contacte Kikiadoc sur Discord"
					]
		})
		
	}
	async function audioFaible() {
		GBLSTATE.audioAmbiance = true;
		GBLSTATE.audioBack=true
		GBLSTATE.audioVolume=50
		playMusic(AUDIO_PLAYMUSIC,true)
		displayInfo({
			titre:"Le volume est trop faible", back:"papier",
			body:	[
							"Clique sur ton pseudo en haut de ton écran et augmente le volume d'AudioBlaster",
							"Si, même à 100%, c'est toujours trop faible, augmente le volume du navigateur dans le mixer global de ton appareil",
							"Si tu as encore un soucis, contacte Kikiadoc sur Discord"
						]
		})
	}
	async function audioFort() {
		GBLSTATE.audioAmbiance = true;
		GBLSTATE.audioBack=true
		playMusic(AUDIO_PLAYMUSIC,true)
		displayInfo({
			titre: "Le volume est trop fort", back:"papier",
			body: [
							"Clique sur ton pseudo en haut de ton écran et baisse le volume d'AudioBlaster jusque 10%",
							"Si tu entends trop fort, même à 10%, baisse le volume du navigateur dans le mixer global de ton appareil",
							"Si tu as encore un soucis, contacte Kikiadoc sur Discord"
						]
		})
	}
</script>

<style>
	
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if pseudo.startsWith('Kikiadoc')}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin:
				{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="test" onclick={() => dspResultats=true} />
				<input type="button" value="resetNoviciat" onclick={()=>apiCall('/hautsFaits/'+NOVICIAT_HF,'DELETE')} />
				<input type="button" value="ReEnd" onclick={()=>{epiqStep=90}} />
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={() => dspResultats=true} />
		<!--
		<span role="button"	style="cursor: pointer" onclick={()=>{ dspObject={ template: "a modifier" }}}>
		🆘
		</span>
		-->
	</div>
	{#if dspResultats && novices}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						<div>Novices de {NOVICIAT_LBL}:</div>
						<hr/>
						{#each Object.keys(novices.pseudos) as p,i}
							<div style="font-size:0.9em">{p}: {jjmmhhmmss(novices.pseudos[p].dth)}</div>
						{/each}
						<hr/>
						<div>{novices.nb} participants</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if epiqStep==0 && novices}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			Bienvenue {pseudo} dans <b>{NOVICIAT_LBL}</b>, le Kiki's Event X.
			{#if novices.nb >= NOVICIAT_NBMAX && !novices.pseudos[pseudo]}
				<div class="adminCadre">
					<div style="color:red">
						Les inscriptions automatiques sont closes, car le quota de participants est atteint.</div>
					<div class="blinkMsg">
						Si tu souhaites participer car tu es motiv{G(pseudoGenre,"é","ée")},
						termine ce challenge puis contacte Kikiadoc sur Discord.
					</div>
					<i>Pour voir la liste des inscrits, clique sur le bouton "Résultats" en haut de la page.</i>
				</div>
			{/if}
			<div class="br"></div>
			Comme lors du précédent événement, 
			Kikiadoc m'a confié la lourde mission d'être ton Game Master Numérique.
			<div class="br"></div>
			Même si tu as déjà participé à de précédents événements,
			<u>lit attentivement mes instructions</u>:
			Il y a toujours quelques nouveautés dans l'initiatique
			afin de découvrir de nouvelles fonctions
			du site, même si, en apparence, rien n'a changé.
			<div class="br"></div>
			Tu découvriras aussi le début de la trame épique de l'événement.
			<div class="br"></div>
			N'hésite pas à cliquer sur les liens marqués d'une
			<a href="https://fr.wikipedia.org/wiki/Hyperlien" target="_blank">loupe</a>
			d'un <span class="imgLink" gpImg="ff-7/kiki-1.png" gpImgClass="img100">appareil photo</span>
			d'un <span class="videoLink" gpVideo={VIDEO_PIPO}>projecteur vidéo</span>,
			ou d'un <span class="infoLink" gpHelp="Exemple de message d'information">signe d'information</span>,
			ça peut être une surprise ou une explication importante! 
			<div class="br"></div>
			Prends le temps de lire le texte du Lore, regarder les vidéos en intégralité,
			et même les vidéos qui peuvent poper au milieu d'un challenge, 
			<u>celà n'impacte jamais tes résultats</u>, au contraire, 
			c'est parfois une source d'info pour aller plus vite!
			<div class="br"></div>
			A tout moment, tu peux cliquer sur "Revoir le lore" en haut de page,
			tu ne perdras aucune donnée saisie ou Haut Fait réalisé.
			<br/>
			<Btn bind:refStep={epiqStep} step=2 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==2}
		{@const genreLbl = GBLCONST.GENRES.find((e)=> e.val==pseudoGenre).lbl}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			<div>
				J'adapte nos intéractions en fonction de ton genre:
			</div>
			<div class="infoLink" gpHelp="Ton genre est important, mais est une information sensible. Cette information reste uniquement sur ton appareil. Tu peux la modifier en cliquant sur ton pseudo en haut à droite du site. Je l'utilise pour adapter nos intéractions en post-traitement sur ton équipement. Ni Kikiadoc, ni moi en avons connaissance. Elle n'est jamais stockée par le server">
				Ton genre actuel est {genreLbl}
			</div>
			<div>
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
			<div onclick={markClick} gpHelp="N'oublie pas, tu peux modifier ton genre à tout moment. Pour celà clique sur ton pseudo en haut à droite de ton écran et modifie-le. Tu en verras les effets immédiats sur la page affichée">
				<Btn val="Je veux changer mon genre" />
				<Btn bind:refStep={epiqStep} step=5 val="Pour mon genre, {genreLbl}, c'est OK" />
			</div>
			<div class="info">
				Pour éviter de passer sous les fourches caudines de la
				<a href="https://www.cnil.fr/fr" target="_blank">CNIL</a>
				et respecter au mieux
				<a href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees">
					le règlement RGPD
				</a>,
				tes données personnelles sensibles (ex: ton genre...) sont uniquement
				stockées sur ton appareil dans un stockage privé de ton navigateur (le 
				<a href="https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage" target="_blank">
					Local Storage
				</a>
				accessible quand tu es en communication sécurisée avec le site https://ff14.adhoc.click).
				Elles ne sont jamais stockées sur le serveur.
				Les traitements les utilisant sont des post-traitements réalisés uniquement sur ton appareil.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==5}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			En cas de soucis, d'incompréhension ou d'une simple hésitation,
			c'est MP @Kikiadoc sur Discord ou via le canal #discussions.
			Kikiadoc ne supporterai pas que tu sois bloqu{G(pseudoGenre,"é","ée")},
			ennuy{G(pseudoGenre,"é","ée")}
			ou frustr{G(pseudoGenre,"é","ée")}!
			<br/>
			Il n'y a pas de mauvaise question:
			Si Kikiadoc considère la réponse à ta question comme un "spoiler",
			il te dira que c'est un "spoiler" 😜
			<br/>
				Et si tu découvres un bug notable, il y a même un
				<a href="https://fr.wikipedia.org/wiki/Prime_aux_bogues" target="_blank">
					bug bounty
				</a>
				avec des gils en récompense!
			<br/>
			<Btn bind:refStep={epiqStep} step=10 val="C'est cool" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
		
	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"audio.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Tu as probablement déjà entendu mon Assistant AudioBlaster.
				Il gère la musique d'ambiance, les notifications sonores,
				la synthèse vocale et 
				<span style="cursor: pointer" onclick={markClick} gpHelp="Regarde en bas de la page">
					les vidéos<sup>(i)</sup>.
				</span>
				Je vais t'aider à bien le paramétrer.
			</div>
			<div class="br"></div>
			A tout moment, en <u>cliquant sur 🔊 ou 🔇, en haut à droite de ton écran</u>,
			tu peux activer ou désactiver l'ambiance sonore
			tout en laissant les autres flux actifs
			car ils sont sources d'informations importantes.
			<div class="br"></div>
			{#if GBLSTATE.audioAmbiance}
				A tout moment, tu peux aussi modifier les réglages d'AudioBlaster
				<u>en cliquant sur ton pseudo en haut à droite de ton écran</u>.
			{:else}
				<span style="color:red" class="blinkMsg">Active l'ambiance sonore en cliquant sur 🔇 afin de parametrer AudioBlaster</span>.
			{/if}
			<div class="br"></div>
			{#if GBLSTATE.audioAmbiance}
				<div>Comment est l'audio d'ambiance du site actuellement?</div>
				<div>
					<input type="button" onclick={audioRien} value="Je n'entend rien" />
					<input type="button" onclick={audioFaible} value="Le son est trop faible" />
					<input type="button" onclick={audioFort} value="Le son est trop fort" />
					<Btn bind:refStep={epiqStep} step=15 val="C'est parfait" 
							msg="Tu peux toujours activer/désactiver l'ambiance sonore avec les boutons 🔊 ou 🔇, alors ne mute pas le site par d'autres moyens afin de toujours recevoir les éléments sonores importants"	/>
				</div>
				<div class="br"></div>
			{/if}
			<div class="info">
				<sup>(i)</sup>Lors de l'affichage de vidéos, tu gardes la possibilité de te positionner, de faire pause,
				ou d'en modifier le volume. Toutefois, ces modifications ne s'appliquent qu'à la vidéo en cours.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==15}
		{@const epsilon=getEpsilon()}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"audio.jpg"} style="width:20%; float:right" alt="" />
			Je vais aussi utiliser ma Voix pour te commander.
			<div>
				Tu dois entendre distinctement ma Voix même avec l'ambiance sonore active.
				<br/>
				<input type="button" value="Je veux tester ta voix"
					onclick={(e)=>{tts({o:{statique:true, file:"mavoix.mp3"}});addNotification("Test TTS en cours...","green",3) }} />
			</div>
			<div>
				<u>
					Pour régler le volume de ma voix,
					clique sur ton pseudo en haut à droite de ton écran..
				</u>
			</div>
			<Btn val="Je n'entend pas bien ta voix"
				msg="Monte le volume de ma voix à 100% et baisse celui de l'ambiance sonore."	/>
			<Btn val="J'ai un soucis"
				msg="Si même avec un volume à 100%, tu n'entends pas ma voix, contacte Kikiadoc sur Discord, Il t'aidera a compléter tes reglages en paramétrant aussi le mixer de ton appareil"	/>
			<Btn bind:refStep={epiqStep} step=20 val="J'entend parfaitement ta Voix" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==20 && novices}
		{@const epsilon=Math.abs(getEpsilon())}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"lore.jpg"} style="width:20%; float:right" alt="" />
			La charge de Game Master Numérique ne peut se maîtriser seule:
			Moi-même et mon équipe de Peluches sommes concues par Kikiadoc:
			<br/>
			➥ Grande Peluche, Hildiscord, AudioBlaster, LogicServer, SyncServer, Métacache, CheckSec, DeepCheckSec
			<br/>
			Nous sommes animées par deux "engines" très réputés:
			<br/>
			➥ Svelte et Babylon
			<br/>
			<u>En cas de soucis, recharge la page
			(F5 su PC, touch top & swipe down sur smartphone)</u>
			tu ne perdras pas ton avancement dans les challenges et
			retrouveras ta situation.
			<div class="br"></div>
			<Btn bind:refStep={epiqStep} step=25 val="J'ai compris"
				msg="Lire attentivement les popups est TRES IMPORTANT. Note bien cette valeur, tu en auras besoin plus tard: {saisies.aleaReq}"
				/>
			<div class="info">
				➥Hildiscord est en charge de nos échanges sur Discord
				<br/>
				➥AudioBlaster gère les médias (mixage son, vidéos, synthèse vocale...)
				<br/>
				➥LogicServer gère la logique des challenges.
				<br/>
				➥SyncServer assure la synchronisation en temps-réel de l'ensemble des participants.
				<br/>
				➥Métacache optimise ta bande passante, en particuler lors des scènes en 3D.
				<br/>
				➥CheckSec est en charge de la cybersécurité du server.
				<br/>
				➥DeepCheckSec est en charge de la cybersécurité de ton navigateur.
				<br/>
				➥<a href="https://fr.wikipedia.org/wiki/Svelte" target="_blank">Svelte</a>
				assure le rendu et la réactivité des pages web
				<br/>
				➥<a href="https://fr.wikipedia.org/wiki/Babylon.js" target="_blank">Babylon</a>
				assure le rendu des scènes en 3D.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==25}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-7/checksec.png"} style="width:30%; float:right" alt="" />
			Un  
			<a href="https://fr.wikipedia.org/wiki/Responsable_de_la_s%C3%A9curit%C3%A9_des_syst%C3%A8mes_d%27information" target="_blank">
				RSSI
			</a>, collègue de Kikiadoc, a dit un jour:
			<i>En cybersécurité, il faut faire au mieux et s'attendre au pire</i>.
			<div class="br"></div>
			C'est pourquoi je veux te présenter plus en détail 
			CheckSec et DeepCheckSec.
			<div class="br"></div>
			CheckSec, mon Tank Gardien, est en charge de la cybersécurité du server.
			Il manie le Marteau du Bannissement et l'utilise plusieurs fois par jour contre
			des sites malveillants.
			<br/>
			➥Il surveille en temps réel les connexions vers le serveur.
			<br/>
			⚠️Si vous êtes plusieurs à partager ta connexion Internet, indique le à Kikiadoc.
			Normalement à 2, ca doit passer, mais à 3 ça bloque.
			<br/>
			➥Il vérifie la sémantique de toutes les requêtes vers le serveur.
			Une seule requête invalide entraine le bannissement immédiat.
			<br/>
			⚠️Accède au site en utilisant <u>uniquement</u> l'URL d'accès: {document.location}
			<br/>
			➥Son marteau est de grande taille, il bannit par bloc de 64 adresses IP au minimum.
			<br/>
			⚠️Si tu utilises un VPN moisi, ou si ton IP est proche d'un site malveillant,
			tu risques d'être un dommage colatéral.
			<div class="br"></div>
			<Btn bind:refStep={epiqStep} step=30 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-7/checksec.png"} style="width:30%; float:right" alt="" />
			DeepCheckSec est mon Erudit furtif.
			<br/>
			Il applique ma
			<a href="https://developer.mozilla.org/fr/docs/Web/HTTP/Guides/CSP" target="_blank">
				stratégie de sécurité du contenu
			</a>
			directement dans ton navigateur. Il peut ainsi détecter un comportement déviant.
			<br/>
			Dans ce cas, l'accès à la ressource inappropriée est bloqué,
			il t'alerte par un message dans ton navigateur et sur Discord.
			<br/>
			➥Un antivirus moisi, un VPN moisi peuvent provoquer un alerte de DeepCheckSec
			s'ils bidouillent ta navigation.
			<br/>
			⚠️Utilise un antivirus (même gratuit) fiable et bien conçu.
			Tu peux éventuellement utiliser un VPN <u>payant</u>.
			<div class="br"/>
			Tu peux examiner l'état de mes assistants en cliquant sur ton pseudo
			en haut à droite de ton écran.
			<br/>
			Tu peux aussi consulter ma
			<a href="https://filedn.eu/lxYwBeV7fws8lvi48b3a3TH/securite/index.html" target="_blank">
				page d'assistance
			</a>.
			Elle te permet de vérifier si CheckSec t'a bloqué
			et comment faire si tu changes ton pseudo sur FF14
			ou si tu changes d'équipement pour accéder au site.
			<div class="br"></div>
			<Btn ifFct={()=>generateSecurityAlert(3)} val="Test DeepCheckSec" />
			<Btn ifFct={()=>window.open(GBLCONST.PAGEASSISTANCE)} val="Voir la page d'assistance" />
			<Btn bind:refStep={epiqStep} step=35 val="J'ai regardé la page d'assistance" />
			<div class="info">
				<u>Avis personnel de Kikiadoc</u>
				<br/>
				AUCUN antivirus ou VPN ne garantit réellement la non collecte de données personnelles,
				quoiqu'ils en disent.
				Les VPNs gratuit ne vivent que pour et par ça.
				<u>Il ne faut JAMAIS utiliser un VPN gratuit</u>.
				<br/>
				J'utilise AVAST comme antivirus et aucun VPN sur 
				nos équipements personnels (PC fixe, PC portable, tablettes et smartphones).
				Je considère, depuis plus de 20 ans, que Kaspersky est une mauvaise solution,
				et que Norton est une usine à gaz s'inscrutant telle une horde de morpions.
				<br/>
				J'utilise de préférence Firefox sinon Chrome. 
				L'anti-pub Ublock Origin sur Firefox est activé par défaut.
				Par éthique, les pubs sont activées sur les
				sites ayant une vraie valeur et dont les pubs ne sont pas envahissantes.
				Les sites putapubs ou putaclics sont bloqués. 
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==35 && novices}
		{@const epsilon=Math.abs(getEpsilon())}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"lore.jpg"} style="width:20%; float:right" alt="" />
			Tu vas participer à des challenges où le timing est important:
			j'applique une "correction temporelle" pour rendre équitable
			les challenges entre tout le monde.
			<br/>
			Pour ton équipement, elle est actuellement de
			{#if epsilon < 300}
				<span style="color:lightgreen">{epsilon} millisecondes, tu n'as donc pas de soucis</span>
			{:else if epsilon < 1000}
				<span style="color:yellow">{epsilon} millisecondes, c'est un peu trop mais je peux gérer</span>
			{:else}
				<span class="blinkMsg" style="color:red">{epsilon} millisecondes, c'est trop, contacte Kikiadoc</span>
			{/if}
			<sup>(*)</sup>.
			<div class="br"></div>
			Enfin, attention à ne pas purger les "données de site" de ton navigateur(**).
			Si tu fais cela, tu perdras ta clé privée(***), tes données saisies et tu ne pourras pas te reconnecter.
			Il faudra alors contacter Kikiadoc sur Discord.
			<div class="br"></div>
			<Btn bind:refStep={epiqStep} step=40 val="J'ai compris" />
			<div style="font-size:0.8em">
				(*) la correction temporelle est l'écart entre l'horloge du serveur et celle de ton équipement.
				Cet écart est compensé par les algorithmes utilisés dans la limite du raisonnable,
				mais un écart de plus d'un seconde indique un soucis avec ton équipement.
				Tu peux vérifier à tout moment la correction temporelle en cliquant sur ton pseudo
				en haut à droite de ton écran
				et en scollant vers le bas du popup.
				<br/>
				(**) Il est facile de purger les "données de site" par inadvertance, souvent en purgeant les cookies ou en
				utilisant des utilitaires de "ménage". Si c'est possible, paramètre le ménage en indiquant de ne pas purger
				les informations relatives à "ff14.adhoc.click".
				<br/>
				(***) Ta clé privée est utilisée pour générer des "mots de passe" aléatoires, éphémères et signés.
				C'est bien plus sécurisé que l'usage d'un mot de passe classique.
				Elle est obligatoire pour que le serveur t'authentifie.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
		
	{#if epiqStep==40}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"lore.jpg"} style="width:30%; float:right" alt="" />
			Lors des précédents événements, certains challenges en coopération temps réel ont été
			anormalement long.
			<div class="br"/>
			Une des causes de cette situation a été que les participants et participantes n'ont pas
			lu avec attention les popups <u>même pendant les phases de rapidité</u>
			<div class="br"/>
			Pour me démontrer que ce ne sera pas ton cas, indique moi le nombre que
			je t'ai demandé de mémoriser lors d'un popup précédent de ce challenge initiatique.
			<div class="br"/>
			<input type="number" placeholder="nn" min=0 max=100 bind:value={saisies.alea} />
			<Btn bind:refStep={epiqStep} step=50 ifFct={()=>saisies.alea==saisies.aleaReq} val="➤"
				koMsg="Ce n'est pas la bonne valeur. Lire les popups est toujours important."/>
			<br />
			<Btn bind:refStep={epiqStep} step=0 val="Revoir le Lore en faisant attention aux popups"
				msg="NOOB: lire le Lore ou les popups est TRES IMPORTANT" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==50}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"hof-lalalex.png"} style="width:30%; float:right" alt="" />
			Maintenant, passons aux choses sérieuses!
			<div class="br" />
			Te souviens-tu de tout celà?
			<div class="br"></div>
			<Btn val="Non, je n'y ai pas participé"
				msg="Alors clique sur les liens videos de cette page pour voir ce que tu as manqué" />
			<Btn bind:refStep={epiqStep} step=55 val="Oui. J'y étais"
				msg="Si tu souhaites revoir les vidéos de ces aventures plus tard, tu pourras te rendre à l'IPA, l'Institut Peluchique de l'Audiovisuel (dans la liste de tes Possibles)"/>
			<Btn bind:refStep={epiqStep} step=55 val="Je viens de regarder les vidéos"
				msg="Si tu souhaites revoir les vidéos de ces aventures plus tard, tu pourras te rendre à l'IPA, l'Institut Peluchique de l'Audiovisuel (dans la liste de tes Possibles)"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==55}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"hof-lalalex.png"} style="width:30%; float:right" alt="" />
			<div>
				Blablabla
			</div>
			<Btn bind:refStep={epiqStep} step=70 val="C'est inquiétant" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==70}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"deepAI/ref-cl.png"} style="width:30%; float:right" alt="" />
			Oui, c'est même très inquiétant. Je pense que c'est le commencement de nouvelles aventures!
			<div class="br"></div>
			Il me reste à vérifier avec toi quelques points.
			Le premier est que tu peux facilement te TP vers les maisons de Kikiadoc en étant
			ami{G(pseudoGenre,"","e")} IG avec lui
			<span class="info">(Kikiadoc Lepetiot @ Moogle)</span>.
			<div class="br"></div>
			<Btn bind:refStep={epiqStep} step=72 val="Je vais lui demander"
				msg="N'oublie pas, ce sera très pratique pour les TPs.
						Tu peux MP Kikiadoc sur Discord s'il n'est pas connecté"/>
			<Btn bind:refStep={epiqStep} step=72 val="Je suis déjà ami{G(pseudoGenre,"","e")} IG avec Kikiadoc" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==72}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"multijoueurs.jpg"} style="width:30%; float:right" alt="" />
			Faire une page pour communaute ou linkshell intermondes ou améliorer le chat du site
			--  A ETUDIER
			<br/>
			<Btn bind:refStep={epiqStep} step=78 val="next" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==78}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"deepAI/ref-cl.png"} style="width:30%; float:right" alt="" />
			Fais maintenant un TP vers la maison de CL de Kikiadoc
			(Moogle, Brumée, secteur 19, slot 5). 
			Si ton perso n'est pas sur Moogle, tu peux utiliser
			l'éthérite d'une capitale pour changer de monde.
			<a href="https://fr.finalfantasyxiv.com/lodestone/playguide/contentsguide/worldvisit/" alt="" target="_blank">
				(Tutorial)
			</a>
			<br/>
			<u>Ces TPs sont gratuits! Surtout, n'utilise pas les options payantes de transfert de monde</u>
			<div class="br"></div>
			Quand tu es devant la maison de CL de Kikiadoc, va dans le jardin et dirige toi vers le servant Kikiadoc Lebogosse
			<br/>
			<Btn bind:refStep={epiqStep} step=80 val="Je suis dans le jardin" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"boussole.png"} style="width:50%; float:right" alt="" />
			<div class="info">
				Cette étape semble chiante, mais
				<span class="infoLink" gpHelp="Voir en bas de page">c'est justifié</span>.
			</div>
			Maintenant que tu es dans le jardin de la maison de CL de Kikiadoc,
			tu es à proximité du servant Kikiadoc Lebogosse. (voir l'image)
			<div class="br"></div>
			Entraine-toi à te positionner juste à coté d'un pnj (ici Kikiadoc Lebogosse),
			à m'indiquer ses coordonnées (ici X:8.6 Y:11.7)
			et faire un screen où les noms des servants ou pnjs sont lisibles.
			<div class="info">
				Lors de cet entrainement, ton screen ne sera pas réellement stocké sur le serveur,
				mais son format, sa taille et ses métadonnées seront vérifiées.
				N'en profite pas pour mettre une
				<span class="videoLink" gpVideo="ff-7/photocopie-fesses">
					photocopie de tes fesses!
				</span>
			</div>
			<table width="95%"><tbody><tr>
				<td style="vertical-align: top; text-align: right; width: 50%">
					X:<input type="number" placeholder="*8.6*" size=6 step="0.1" bind:value={saisies.X} />
					<br/>
					Y:<input type="number" placeholder="*11.7*" size=6 step="0.1" bind:value={saisies.Y} />
					<br/>
					{#if saisies.X!='8.6' || saisies.Y!='11.7'}
						<span style="color:red">Coordonnées?</span>
					{:else if !saisies.imageDataRaw}
						<span style="color:red">Screen non défini</span>
					{:else}
						<Btn style="color:green" bind:refStep={epiqStep} step=90 val="C'est OK ➤" />
					{/if}
					<br/>
				</td>
				<td style="vertical-align: top; width: 50%">
					<Upload cbImageRaw={(raw)=>saisies.imageDataRaw=raw} />
				</td>
			</tr></tbody></table>
			<div style="clear:both" class="br"></div>
			<div class="info">
				Cette étape d'entrainement peut sembler très chiante,
				mais c'est lié aux difficultés rencontrées lors de précédents événements:
				Dans certains cas, des "assistants à la saisie"
				peuvent perturber la saisie de valeurs numériques ou un upload.
				Exemple: la "locale" n'est pas "fr-FR" (français de france),
				un clavier "custom" est utilisé sur smartphone etc...
				<br/>
				<!--
				<br/>
				N.B: Contrairement à Google, Discord, FesseLivre, Tiktoké, X-Fake etc.. 
				je n'utilise pas les "métadatas" de tes images sur le serveur
				(style tes coordonnées GPS, le nom de ton équipement etc...).
				Le filtrage pour ne garder que l'image est réalisé localement par ton équipement et
				le serveur n'accepte que des données "brutes".
				<br/>
				<br/>
				Pour t'éviter un soucis au milieu d'un challenge, je préfère faire un
				test dès maintenant en espérant que j'ai traité tous les cas rencontrés précédemment.
				-->
				
			</div>
		</div>
	{/if}
	
	{#if epiqStep==90}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-7/livre-correspondance.png"} style="width:50%; float:right" alt="" />
			Ton initiation touche à sa fin.
			<br/>
			Entre dans la maison de CL de Kikiadoc et consulte le message du propriétaire sur le livre de correspondance.
			Suis alors les consignes.
			<div class="br"></div>
			<Btn val="Explique moi pour le livre de correspondance"
				msg="Le livre se trouve dans la maison, près de l'entrée et à gauche en entrant, sur une demi-cloison. Clic sur l'icon 🠟 au dessus du livre. Lis alors le message du propriétaire et laisse un message selon la consigne en cliquant sur l'icon crayon 🖉" />
			<Btn bind:refStep={epiqStep} step=99 val="J'ai écrit le message demandé sur le livre" ifFct={()=>addNovice()} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==99}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"hautfait.png"} style="width:30%; float:right" alt="" />
			Bravo {pseudo}, tu as fini la quête initiatique de {NOVICIAT_LBL} et tu as déjà gagné
			1 million de gils sous reserve de ta participation aux challenges.
			<div class="br"></div>
			<u>Je t'ai envoyé un MP sur Discord car tu as maintenant accès au canal Discord de cet événement.</u>
			<div class="br"></div>
			En haut de page, tu auras souvent un bouton indiquant la progression
			actuelle des Aventuriers et Aventurières dans le challenge en cours. Ici, tu peux cliquer sur 'Résultats'
			<div class="br"></div>
			Tu peux revenir à cette quête initiatique depuis ta Liste des Possibles
			en cliquant sur <i>{pageDesc.texte}</i> puis la rebalayer en cliquant sur "Revoir le Lore"
			<div class="br"></div>
			<Btn bind:refPageDone={pageDone} pageDone={pageDesc.n} bind:refPage={page} page=0 val="Merci Grande Peluche"  />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
</div>

<!-- P405.svelte -->
