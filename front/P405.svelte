<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts, playDing,
					 generateSecurityAlert, isEquipementPC, isPC, isSM,
					 getEpsilon, getLatence, displayObject,
					 addNotification, apiCall,
					 urlCdn, urlCdnAI, jjmmhhmmss,
					 isPWA, isAndroid, isAdmin,
					 enterFullScreen, exitFullScreen, addTexteTTS
				 } from './common.js'
	import { babylonSetOption, babylonGetOption,
					 babylonStart, babylonStop,
					 babylonSetSceneActive, sceneLoadingCreate, babylonHome,
					 babylonGetMetrologie
				 } from './BabRoot.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE, calcCagnotte }  from './ground.svelte.js'

	import Btn from './Btn.svelte'
	import Info from './Info.svelte'
	import Common from './Common.svelte'
	import BabHeader from './BabHeader.svelte'
	
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

	// svelte-ignore state_referenced_locally
	const PAGEEPIQLBL= "P"+pageDesc.n+"_epiqStep"
	// svelte-ignore state_referenced_locally
	const PAGESAISIESLBL = "P"+pageDesc.n + "_saisies"
	
	onMount(() => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// afficahge des popups standards
	let dspResultats=$state(false) 	// affichage des résltats

	// appelé apres mount du component (en async)
	function init() {	getNovices() }
	
	// appelé apres unmount du component
	function reset() { babylonStop()	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.isInitDone ??= false // indique que les metaata on ete calculées
		s.aleaReq ??= Math.floor(Math.random()*100) // Nombre demandé pour lecture popup
		s.sensibilite3D ??= 3
		s.simulBaton ??= 50
		s.simulContrib ??= 0
		s.simulRatio ??= 0
		s.simulMax ??= 0
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}

	// variable poubelle
	let poub = {}

	//////////////////////////////////////////////////
	// spécifique composant
	//////////////////////////////////////////////////

	const VIDEO_PIPO="ff-3-rendez-vous" // Video en attente d'une nouvelle

	//////////////////////////////////////////////////
	// gestion des novices
	//////////////////////////////////////////////////
	const NOVICIAT_HF="Kiki_X_initiatique" // haut fait
	const NOVICIAT_LBL = "l'Expansion de l'univers" // usage en texte
	const NOVICIAT_DISCORD = "expansion" // nom du channel discord
	const NOVICIAT_NBMAX = 20 // nombre max d'inscription automatique
	let novices = $state(null)
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
	const AUDIO_PLAYMUSIC="X-initiatique/secrets"
	async function audioRien() {
		GBLSTATE.audioAmbiance = true;
		GBLSTATE.audioBack=false
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
		GBLSTATE.audioBack=false
		GBLSTATE.audioVolume=50
		playMusic(AUDIO_PLAYMUSIC,true)
		displayInfo({
			titre:"Le volume est trop faible", back:"papier",
			body:	[
							"Clique sur ton pseudo en haut de ton écran et augmente le volume d'AudioBlaster",
							"Si, même à 100%, c'est toujours trop faible, augmente le volume du navigateur dans le mixer global de ton appareil",
							"Si tu as encore un souci, contacte Kikiadoc sur Discord"
						]
		})
	}
	async function audioFort() {
		GBLSTATE.audioAmbiance = true;
		GBLSTATE.audioBack=false
		playMusic(AUDIO_PLAYMUSIC,true)
		displayInfo({
			titre: "Le volume est trop fort", back:"papier",
			body: [
							"Clique sur ton pseudo en haut de ton écran et baisse le volume d'AudioBlaster jusque 10%",
							"Si tu entends trop fort, même à 10%, baisse le volume du navigateur dans le mixer global de ton appareil",
							"Si tu as encore un souci, contacte Kikiadoc sur Discord"
						]
		})
	}
	/////////////////////////////////////////////////////////////////////////////////////
	// chargement de la scene 3D pour test 
	/////////////////////////////////////////////////////////////////////////////////////
	let babIHM = $state({})
	let dspBabParam = $state(false)
	async function start3D() {
		console.log("****************** START3D")
		babylonSetOption('perf',true,true)
		await babylonStart(pseudo,babIHM)
		babylonSetSceneActive(await sceneLoadingCreate())
	}
	function helpCoord() {
		return { titre: "Tes Ortho-Coordonnées",
						 body: ["Elles ne respectent pas le même référentiel Euclidien que celui d'Eorzéa:",
										"Y et Z sont inversées"] }
	}
	function event3d(e) {
		let o = e?.srcElement?.Event3D // recupere les complements de l'event
		if (babylonGetOption("debug")) console.log('descEvent:',o)
		if (!o) return
		if(o.action=="btnGo") {
			let babMetro = babylonGetMetrologie()
			console.log("event3d - babMetro",babMetro)
			if ( (Date.now() - babMetro.perfStartDth) < 20000) {
				displayInfo("Je n'ai pas eu le temps de stabiliser mes mesures, déplace toi et patiente un peu avant de sortir");
			}
			else {
				displayInfo({titre:"Tu as cliqué sur le bouton 'Ortho-temps'",
										 body: ["Dans le cadre de ta quête initiatique,",
														"Tu ne peux te rendre dans l'Ortho-Temps.",
														"tu as donc quitté la Porte de l'Ortho-Temps"] })
				epiqStep=70
			}
		}
		if(o.nom=="cannette#1") { babIHM.msg="Il est interdit de boire la cannette de droite" }
		if(o.nom=="cannette#2") { babIHM.msg="Il est interdit de boire la cannette de gauche" }
		if(o.nom=="OrthoStargate") { babIHM.msg="C'est le Chronogyre. Il te permettra d'accéder à l'Ortho-Temps, mais pour l'instant le voyage est impossible. Clique sur le bouton au centre du chronogyre pour sortir de la Porte de l'Ortho-Temps" }
	}
</script>

<style>
	.babylon {
	  margin: 0;
	  padding: 0;
	  width: 100%;
	  /* height: 800px; /* 100%; */
	  /* font-size: 0; */
	  color: rgba(204, 204, 204, 1);
	}
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if isAdmin(pseudo)}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin:
				{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="resetNoviciat" onclick={()=>apiCall('/hautsFaits/'+NOVICIAT_HF,'DELETE')} />
				<input type="button" value="ReEnd" onclick={()=>{epiqStep=90}} />
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={() => dspResultats=true} />
		<Common t="headerPage" pageDesc={pageDesc} />
	</div>
	{#if epiqStep==0 && novices}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			{#if isAdmin(pseudo)}
				<div class="adminCadre">
					isEquipementPC={isEquipementPC()} isPWA={isPWA()} isAndroid={isAndroid()}
				</div>
			{/if}
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
			<div>
				<u>Lit attentivement mes instructions</u>, même si tu as déjà participé à de précédents événements.
			</div>
			{#if !isPWA() && isAndroid()}
					<div class="adminCadre">
						Tu utilises un smartphone Android.
						Si tu utilises Chrome comme navigateur par défaut sur ton smartphone,
						tu peux activer le mode
						<a href="https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps" target="gpHelp">
							PWA
						</a> et transformer le site en une application.
						<br/>
						<a href="{urlCdn}commons/Installation Grande Peluche comme PWA sur smartphone (portait).pdf" target="gpHelp">
						Suis ces instructions pour installer l'application.
						</a>.
						<br/>
						Après installation, ferme cette fenêtre et lance l'application.
					</div>
			{/if}
			<div class="br"></div>
			A tout moment, tu peux cliquer sur "Grande Peluche" en haut à gauche de ton écran,
			tu retourneras alors à ta <i>liste des Possibles</i>.
			Tu pourras revenir ici en cliquant sur <i>{pageDesc.texte}</i>
			ou un autre Possible selon ton choix.
			<div class="br"></div>
			<div class="br"></div>
			N'hésite pas à cliquer sur des éléments identifiés par une
			<a href="https://fr.wikipedia.org/wiki/Hyperlien" target="gpHelp">loupe</a>
			d'un <span class="imgLink" gpImg="ff-7/kiki-1.png" gpImgClass="img100">appareil photo</span>
			d'un <span class="videoLink" gpVideo={VIDEO_PIPO}>projecteur vidéo</span>,
			ou d'un <span class="infoLink" gpHelp="Exemple de message d'information">signe d'information</span>,
			ça peut être une surprise ou une explication importante! 
			<div class="br"></div>
			{#if ! isEquipementPC()}
				Pour une meilleure expérience, tu peux passer ton smartphone en mode paysage
				pour les vidéos ou les scènes en 3D.
				<div class="br"></div>
			{/if}
			Prends le temps de lire le texte du Lore, regarder les vidéos en intégralité,
			et même les vidéos qui peuvent poper au milieu d'un challenge: 
			<u>celà n'impacte jamais tes résultats</u>
			et c'est même parfois une source d'info pour aller plus vite.
			<br/>
			Quand tu lis le lore, c'est aussi un temps où je fais des opérations invisibles.
			<br/>
			Tu verras parfois un chrono sur un bouton,
			tu ne devras pas cliquer sur le bouton tant que le chrono s'affiche.
			<div class="br"></div>
			A tout moment, tu peux cliquer sur le bouton "Revoir le lore" en haut de page
			pour relire le lore depuis le début,
			ou cliquer sur "Résultats" pour voir le classement actuel des participants.
			<br/>
			<Btn bind:refStep={epiqStep} refDth={epiqStepChangeDth} delai=20 step=5 val="J'ai compris" />
			<div style="clear:both" class="br" />
		</div>
	{/if}

	{#if epiqStep==5}
		{@const genreLbl = GBLCONST.GENRES.find((e)=> e.val==pseudoGenre).lbl}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdnAI+"pseudo-"+pseudo+".jpg"} style="width:30%; float:right" alt="" />
			<div>
				{pseudo}, voici quelques informations.
				<br/>
				J'utilise l'image de ton personnage du Lodestone ci-contre comme étant ton portrait.
				<input type="button" value="Mais ce n'est pas mon portait!!"
					onclick={()=>displayInfo({body:[
																	 "J'ai extrait cette image du Lodestone de FF14.",
																	 "Modifier cette image nécessite un rafraîchissement du lodestone du jeu (quelques heures).",
																	 "Pour cela, connecte toi au jeu, choisi la tenue de ton personnage et déconnecte toi du jeu,",
																	 "Attend alors que le lodestone se mettre à jour,",
																	 "Quand il sera à jour, contacte Kikiadoc.",
																	 "Tu peux toutefois continuer ton Initiatique."]})}
				/>
			</div>
			<div>
				Je me permettrai aussi de t'interpeler si besoin.
				<input type="button" value="Et tu feras comment?"
					onclick={()=>{ 
							addTexteTTS("J'utiliserai ma jolie voix")
							addTexteTTS(pseudo)
							displayInfo({body:["J'utiliserai ma jolie voix, "+pseudo]})
						}
					}
				/>

			</div>
			<div>
				J'adapte nos dialogues en fonction de ton genre:
				<span class="infoLink" gpHelp="Ton genre est important, mais est une information sensible. Cette information reste uniquement sur ton appareil. Tu peux la modifier en cliquant sur ton pseudo en haut à droite du site. Je l'utilise pour adapter nos intéractions en post-traitement sur ton équipement. Ni Kikiadoc, ni moi en avons connaissance. Elle n'est jamais stockée par le server">
					{genreLbl}
				</span>
			</div>
			{#if !pseudoGenre}
				<div class="blinkMsg" style="color:yellow">
					Tu n'as pas encore indiqué ton genre.
				</div>
			{:else}
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
			{/if}
			<div onclick={markClick} gpHelp="Tu peux modifier ton genre à tout moment. Pour celà clique sur ton pseudo en haut à droite de ton écran et modifie-le. Tu en verras les effets immédiats sur la page affichée">
				<Btn val="Je veux changer mon genre" />
				<Btn bind:refStep={epiqStep} step=10 val="Pour mon genre, {genreLbl}, c'est OK" />
			</div>
			<div class="info">
				Pour éviter de passer sous les fourches caudines de la
				<a href="https://www.cnil.fr/fr" target="gpHelp">CNIL</a>
				et respecter totalement
				<a href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees" target="gpHelp">
					le règlement RGPD
				</a>,
				tes données personnelles sensibles (ex: ton genre...) sont uniquement
				stockées sur ton appareil dans un stockage privé, le 
				<a href="https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage" target="gpHelp">
					Local Storage
				</a>
				accessible uniquement quand tu es en communication sécurisée avec le site https://ff14.adhoc.click.
				Elles ne sont jamais stockées sur le serveur.
				Les traitements les utilisant sont des post-traitements réalisés uniquement sur ton appareil.
			</div>
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
			{#if GBLSTATE.audioAmbiance}
				A tout moment, tu peux modifier les réglages d'AudioBlaster
				<u>en cliquant sur ton pseudo en haut à droite de ton écran</u>.
			{:else}
				<span style="color:red" class="blinkMsg">Active l'ambiance sonore en cliquant sur 🔇 en haut à droite de ton écran afin de parametrer AudioBlaster</span>.
			{/if}
			<div class="br"></div>
			{#if GBLSTATE.audioAmbiance}
				{#if GBLSTATE.audioBack}
					<div style="color:yellow">
						Selon tes paramètres, le son du site continue même si
						{#if isPC()}tu minimises ou masque ta fenêtre{:else}tu repasses à ton écran d'accueil{/if}.
						Ce n'est pas le paramétrage recommandé.
						<input type="button" value="modifier" onclick={()=>GBLSTATE.audioBack=false} />
					</div>
				{/if}
				<div>Comment est l'audio d'ambiance du site actuellement?</div>
				<div>
					<input type="button" onclick={audioRien} value="Je n'entend rien" />
					<input type="button" onclick={audioFaible} value="Le son est trop faible" />
					<input type="button" onclick={audioFort} value="Le son est trop fort" />
					<Btn bind:refStep={epiqStep} step=15 val="C'est parfait" 
							msg="Tu peux toujours activer/désactiver l'ambiance sonore avec les boutons 🔊 ou 🔇 en haut à droite de ton écran, alors ne mute pas le site par d'autres moyens afin de toujours recevoir les éléments sonores importants"	/>
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
			<Btn val="J'ai un souci"
				msg="Si même avec un volume à 100%, tu n'entends pas ma voix, contacte Kikiadoc sur Discord, Il t'aidera a compléter tes reglages en paramétrant aussi le mixer de ton appareil"	/>
			<Btn bind:refStep={epiqStep} step=18 val="J'entend parfaitement ta Voix" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==18 && novices}
		{@const epsilon=Math.abs(getEpsilon())}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-10/lalateam.png"} style="width:20%; float:right" alt="" />
			<div>
				N'hésite pas à MP @Kikiadoc sur Discord ou via le canal #discussions
				à la moindre hésitation,
				il ne supporterai pas que tu sois bloqu{G(pseudoGenre,"é","ée")},
				ennuy{G(pseudoGenre,"é","ée")}
				ou frustr{G(pseudoGenre,"é","ée")}!
			</div>
			<div class="br"></div>
			<div>
				En cas de soucis, recharge la page:
				tu ne perdras pas ton avancement dans les challenges et
				retrouveras ta situation.
			</div>
			<div class="blinkMsg">
				Tu peux essayer maintenant: 
				{#if isEquipementPC()}
					Appuie sur la touche F5 de ton PC
				{:else}
					Appuie sur le haut de l'écran de ton smartphone et glisse vers le bas
				{/if}
			</div>
			<div class="br"></div>
			<Btn bind:refStep={epiqStep} step=20 val="J'ai compris" />
			<div class="info">
				La charge de Game Master Numérique ne peut se maîtriser seule.
				Mon équipe est composée de multiples Peluches (développements par Kikiadoc), 
				deux "Engines" réputés (gratuits et "open-source") et d'autres solutions techniques (payantes).
				Tu verras parfois leurs noms.
				<br/>
				➥Moi, la Grande Peluche, je suis en charge de l'apparence et la dynamique du site.
				<br/>
				➥Hildiscord est en charge de nos échanges sur Discord
				<br/>
				➥AudioBlaster gère les médias (mixage son, bruitages, vidéos, synthèse vocale...)
				<br/>
				➥LogicServer gère la logique des challenges.
				<br/>
				➥SyncServer assure la synchronisation en temps-réel de l'ensemble des participants.
				<br/>
				➥Métacache optimise tes gros téléchargements et ta bande passante.
				<br/>
				➥CheckSec est en charge de la cybersécurité du server.
				<br/>
				➥DeepCheckSec est en charge de la cybersécurité de ton navigateur.
				<br/>
				➥<a href="https://fr.wikipedia.org/wiki/Svelte" target="gpHelp">Svelte</a>
				assure le rendu et la réactivité des pages web en 2D
				<br/>
				➥<a href="https://fr.wikipedia.org/wiki/Babylon.js" target="gpHelp">Babylon</a>
				assure le rendu des scènes en 3D.
				<br/>
				➥Mon server
				<a href="https://aws.amazon.com/fr/ec2/" target="gpHelp">EC2</a>
				(localisé à Paris) fait tourner LogicServer, SyncServer, CheckSec, Hildiscord
				et permet de télécharger les composants fonctionnant dans ton navigateur.
				<br/>
				➥Mon service <a href="https://www.pcloud.com/fr/eu" target="gpHelp">pCloud</a>
				(localisé au Luxembourg et en Suisse)
				assure un triple stockage sécurisé de référence des codes sources,
				des sauvegardes et des fichiers médias.
				<br/>
				➥Mon service <a href="https://aws.amazon.com/fr/polly/" target="gpHelp">Polly</a>
				(localisé à Paris et backend en Ireland)
				assure la synthèse vocale par IA.
				<br/>
				➥Mon service <a href="https://aws.amazon.com/fr/cloudfront/" target="gpHelp">Cloudfront</a>
				(localisé à Paris, Londres, Francfort, Milan...)
				assure la diffusion optimisées des médias.
				<br/>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"audio.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Il y a des cas où tu ne peux pas utiliser facilement ton micro sur discord,
				parfois même tu n'en as pas.
				<br/>
				C'est pourquoi Audioblaster peux relayer tes messages en synthèse vocale à tous les connectés
				sur le site et Hildiscord envoyer tes messages en texte dans le canal blablatage de Discord.
			</div>
			<div class="br" />
			<div>
				Dans la zone de saisie marquée "message" en haut page, à coté du bouton "Résultat",
				tu peux indiquer un message.
				<br />
				Pour l'envoyer,
				{#if isPC()}
					appuie sur la touche "retour" de ton PC,
				{:else}
					valide ton message par le bouton style "aller à" sur ton smartphone,
				{/if}
				ou clique sur "➤".
			</div>
			<div>
				<input type="button" value="Je peux faire un test?"
					onclick={markClick} gpHelp="Oui, tu peux faire un test!!" />
				<Btn bind:refStep={epiqStep} step=25 val="C'est cool!" />
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	
	{#if epiqStep==25}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-7/checksec.png"} style="width:30%; float:right" alt="" />
			Un collègue
			<a href="https://fr.wikipedia.org/wiki/Responsable_de_la_s%C3%A9curit%C3%A9_des_syst%C3%A8mes_d%27information" target="gpHelp">
				RSSI
			</a> de Kikiadoc lui a dit un jour:
			<i>En cybersécurité, il faut faire au mieux et s'attendre au pire</i>.
			<div class="br"></div>
			C'est pourquoi je veux te présenter plus en détail 
			CheckSec et DeepCheckSec.
			<div class="br"></div>
			CheckSec, mon Tank Gardien, est en charge de la cybersécurité du server.
			Il manie le Marteau du Bannissement et l'utilise plusieurs fois par jour contre
			des sites malveillants. En cas d'attaque massive, il peut placer le server en PLS.
			<br/>
			➥Il surveille en temps réel le nombre de connexions vers le serveur.
			<br/>
			➥Il vérifie la sémantique de toutes les requêtes vers le serveur.
			Une seule requête invalide entraine le bannissement immédiat.
			<br/>
			➥Son marteau est de grande taille: à chaque frappe,
			il bannit entre 256 et 17 millions d'adresses IP.
			Actuellement, des dizaines de millions d'adresses IP sont bannies du site.
			<div class="br"></div>
			⚠️Si vous êtes plusieurs à partager ta connexion Internet, indique le à Kikiadoc.
			Normalement à 2, ca doit passer, mais à 3 ça bloque.
			<br/>
			{#if isPWA()}
				⚠️Accède au site en utilisant <u>uniquement</u> l'application
			{:else}
				⚠️Accède au site en utilisant <u>uniquement</u> l'URL d'accès: {document.location}
			{/if}
			<br/>
			⚠️Si tu utilises un VPN moisi, ou si ton IP est proche d'un site malveillant,
			tu risques d'être un dommage colatéral d'une frappe du Marteau du Bannissement.
			<br/>
			⚠️Ton pseudo et l'indicateur "multijoueurs" en haut à droite de ton écran doivent
			toujours être verts. Cela indique une communication temps-réel sécurisée et signée.
			<br/>
			<Btn bind:refStep={epiqStep} refDth={epiqStepChangeDth} delai=15 step=30 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-10/lalabouclier-resize.png"} style="width:30%; float:right" alt="" />
			DeepCheckSec est mon Erudit furtif.
			<br/>
			Il applique ma
			<a href="https://developer.mozilla.org/fr/docs/Web/HTTP/Guides/CSP" target="gpHelp">
				stratégie de sécurité du contenu
			</a>.
			Il peut ainsi détecter certains comportements déviants.
			<br/>
			Dans ce cas, l'accès à la ressource inappropriée est bloqué.
			Il t'alerte par un message dans ton navigateur et si possible sur Discord.
			<br/>
			➥Un malware ou un virus présent sur ton équipement peut
			provoquer une alerte de DeepCheckSec. Dans ce cas, tu devras agir rapidement.
			<br/>
			➥Un antivirus moisi, un VPN moisi peut aussi provoquer une alerte de DeepCheckSec
			s'il bidouille ta navigation.
			<br/>
			➥Le navigateur TOR bidouille les paramètres de DeepCheckSec
			et provoque des "faux positifs" stupides et annule la protection intégrée au site.
			<br/>
			⚠️Il FAUT utiliser un antivirus (même gratuit) fiable, à jour et bien conçu.
			<br/>
			⚠️Il FAUT activer une fonction firewall sur ton équipement
			(via ta box au minimum).
			<br/>
			⚠️N'oublie jamais que la meilleure cyberprotection n'est pas l'IA.
			C'est l'IN, l'Intelligence Naturelle. Le moteur d'inférence de cet IN est 
			un réseau de neurones ultra performant localisé entre ta chaise et ton clavier.
			N'oublie pas de le solliciter en permanence
			afin d'éviter un comportement compulsif de tes doigts.
			<div class="br"/>
			<Btn ifFct={()=>generateSecurityAlert(3)} val="Test DeepCheckSec" />
			<Btn bind:refStep={epiqStep} refDth={epiqStepChangeDth} delai=15 step=32 val="J'ai bien compris" />
			<div class="info">
				<img class="parchemin" src={urlCdn+"pc-kiki.jpg"} style="width:30%; float:right" alt="" />
				<u>Configuration et avis personnel de Kikiadoc</u>
				<br/>
				Comme "résolver DNS", j'utilise le DNS "souverain"
				<a href="https://www.joindns4.eu/about" target="gpHelp">
					DNS4EU
				</a>
				avec les parametres bloquant automatiquement la majorité des sites dangereux et
				des sites dédiés aux pubs.
				Ce DNS n'est pas, aujourd'hui, le back-end par défaut des box Internet
				ou des réseaux mobiles,
				mais j'espère qu'il le deviendra.
				<br/>
				Comme "gestionnaire de mots de passe", j'utilise
				<a href="https://keepass.info/" target="gpHelp">
					Keepass
				</a>,
				ce n'est pas le plus ergonomique, mais le seul
				outil gratuit, sans lien cloud et
				<a href="https://www.cybermalveillance.gouv.fr/tous-nos-contenus/bonnes-pratiques/mots-de-passe" target="gpHelp">
					recommandé par l'ANSSI
				</a>.
				Je génère un mot de passe "fort et unique" pour chaque site que j'utilise.
				<br/>
				J'utilise AVAST comme antivirus (gratuit).
				Je considère, depuis plus de 20 ans, et bien avant les avis
				des instances officielles de cybersécurité, que Kaspersky est une solution dangeureuse.
				Je considère aussi que Norton est une usine à gaz s'inscrutant telle une horde de morpions.
				<br/>
				Je n'utilise aucun VPN "grand public" sur 
				nos équipements personnels (PC fixe, PC portable, tablettes et smartphones) car
				AUCUN antivirus ou VPN ne garantit l'absence de collecte de données personnelles,
				quoiqu'ils en disent.
				<br/>
				Le sigle VPN est, aujourd'hui, totalement galvaudé.
				<u>Il ne faut JAMAIS utiliser un VPN gratuit qui ne vivent que par la collecte de données,
				voire l'injection de malware</u>,
				et je considère les VPN "payant grand public" comme un danger plus qu'une solution même
				s'ils implémentent le protocole
				<a href="https://fr.wikipedia.org/wiki/IPsec" target="gpHelp">
					IPSEC
				</a>
				<br/>
				Deux bémols:
				<br/>
					➥Pour un usage professionel, un VPN est obligatoire
						mais ce ne sont pas les mêmes solutions techniques.
				<br/>
					➥Pour un usage privé, le VPN <u>proposé par ton fournisseur d'accès</u> ne garantit pas l'anonymat
						mais peut contribuer à la protection contre les sites malveillants (Orange, Free).
				<br/>
				J'utilise de préférence Firefox sinon Chrome ou Brave.
				<br/>
				Je n'utilise le
				browser Tor
				que dans de très rares occasions.				
				Il offre une confidentialité bien plus importante que tous les VPN/navigateur
				mais est une daube en temps de réponse et ne permet jamais l'accès à des sites
				technologiquement évolués.
				Il facilite surtout l'accès aux forums illégaux du DarkWeb et aux sites de boules.
				<br/>
				L'anti-pub Ublock Origin sur Firefox (PC ou mobiles) est activé par défaut.
				Par éthique, les pubs sont activées sur les
				sites ayant une vraie valeur et dont les pubs ne sont pas envahissantes.
				Les sites putapubs ou putaclics sont bloqués.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==32}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-10/lalabouclier-resize.png"} style="width:30%; float:right" alt="" />
			Tu peux consulter ma
			<a href={(GBLCONST.PAGEASSISTANCE)} target="gpHelp">
				page d'assistance
			</a>
			pour:
			<div class="info">
				➥vérifier si CheckSec t'a bloqué en cas de soucis d'accès au site
				<br/>
				➥savoir comment faire si tu changes ton pseudo sur FF14
				<br/>
				➥savoir comment faire si tu changes d'équipement
				<div class="gpHelp" role="button" onclick={markClick}
					gpHelp="Pour ajouter la page d'assistance en favori, ferme ce popup puis clique sur le lien de la page d'assistance un peu plus haut. Quand elle est affichée, clique sur le symbole ☆ dans la barre d'url de ton navigateur" >
					💡Ajoute cette page dans tes favoris.
				</div>
			</div>
			<div class="br"/>
			Si tu rencontres un bug, tu peux remonter un rapport d'erreur à Kikiadoc.
			Pour cela:
			<div class="info">
				➥Ferme la popup d'erreur si elle est affichée
				<br/>
				➥Clique sur ton pseudo en haut à droite de ton écran
				<br/>
				➥Scroll jusque la rubrique 'Rapport technique de fonctionnement'
				<br/>
				➥Clique sur le bouton 'envoyer un rapport à Kikiadoc'
				<div>
					💡Si tu es {G(pseudoGenre,"le premier","la première")} à identifier un bug bloquant,
					tu gagnes un
					<a target="gpHelp" href="https://fr.wikipedia.org/wiki/Prime_aux_bogues">
						bug bounty
					</a>
					de 300K gils.
				</div>
			</div>
			<Btn bind:refStep={epiqStep} step=35 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==35 && novices}
		{@const epsilon=Math.abs(getEpsilon())}
		{@const latence=getLatence()}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/course.gif"} style="width:20%; float:right" alt="" />
			Tu vas participer à des challenges où le timing est important.
			<br/>
			➥Ta correction temporelle actuelle est de
			{#if epsilon < 300}
				<span style="color:lightgreen">{epsilon} millisecondes, tu n'as pas de souci</span>
			{:else if epsilon < 1000}
				<span style="color:yellow">{epsilon} millisecondes, c'est un peu trop mais je peux gérer</span>
			{:else}
				<span class="blinkMsg" style="color:red">{epsilon} millisecondes, c'est trop, contacte Kikiadoc</span>
			{/if}
			<sup>(*)</sup>.
			<br/>
			➥Ta latence réseau actuelle est de
			{#if latence < 50}
				<span style="color:lightgreen">{latence} millisecondes, tu n'as pas de souci</span>
			{:else if latence < 150}
				<span style="color:yellow">{latence} millisecondes, c'est un peu trop mais je peux gérer</span>
			{:else}
				<span class="blinkMsg" style="color:red">{latence} millisecondes, c'est trop, contacte Kikiadoc</span>
			{/if}
			<br/>
			<div class="br"></div>
			Enfin, attention à ne pas purger les "données de site" de ton navigateur(**).
			Si tu fais cela, tu perdras les données stockées dans ton équipement,
			(style saisies en cours, flags indiquant tes actions précédentes etc...)
			et tu devras te reidentifier. 
			<div class="br"></div>
			<Btn bind:refStep={epiqStep} refDth={epiqStepChangeDth} delai=12 step=50 val="J'ai compris" />
			<div style="font-size:0.8em">
				(*) la correction temporelle est l'écart entre l'horloge du serveur et celle de ton équipement.
				Cet écart est compensé par les algorithmes utilisés dans la limite du raisonnable,
				mais un écart de plus d'un seconde indique un souci sur ton équipement
				(l'horloge server est synchronisée sur le 
				<a href="https://fr.wikipedia.org/wiki/Temps_universel_coordonn%C3%A9" target="gpHelp">
					temps UTC
				</a>
				à ±10µs).
				Tu peux vérifier à tout moment la correction temporelle en cliquant sur ton pseudo
				en haut à droite de ton écran
				et en scollant vers le bas du popup.
				Tu peux aussi vérifier la synchronisation du server en consultant le
				<a href="https://filedn.eu/lxYwBeV7fws8lvi48b3a3TH/AI-Generated/yumUpdate.txt" target="gpHelp">
					rapport quotidien de patch de sécurité et synchronisation de l'horloge
				</a>
				<br/>
				(**) Il est facile de purger les "données de site" par inadvertance, souvent en purgeant les cookies ou en
				utilisant des utilitaires de "ménage". Si c'est possible, paramètre le ménage en indiquant de ne pas purger
				les informations relatives à "ff14.adhoc.click".
				<br/>
				(***) Ta clé privée est utilisée pour générer des "jetons" aléatoires, éphémères et signés.
				Elle est validée par une clef enfouie dans le coffre numérique de ton équipement.
				C'est bien plus sécurisé et confidentiel que l'usage d'un mot de passe classique,
				l'usage d'un compte Tiktoké, Fesse-Livre ou autres stupidités dévoreuses de ta vie privée.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	<!--	
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
	-->
	
	{#if epiqStep==50}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"hof-lalalex.png"} style="width:30%; float:right" alt="" />
			Maintenant, passons aux choses sérieuses!
			<div class="info">Si tu es {G(pseudoGenre,"un nouvel Aventurier","une nouvelle Aventurière")}, 
				tu pourras découvrir l'Histoire grâce aux liens ci-dessous.
				Si tu as déjà participé, ces liens
				te rapelleront tes Haut-faits passés.
			</div>
			{#if isSM()}
				<div>
					N'oublie pas que tu peux placer ton smartphone en mode paysage lors
					de vidéos pour mieux les voir. (c'est aussi valable pour les scènes en 3D).
				</div>
			{/if}
			<div>
				Voici le résumé des derniers épisodes:
			</div>
			<hr/>
			<div class="videoLink br" onclick={markClick} gpVideo="ff-7/ff-7-trailer">
				➥Lors de l'Hégémonie (Event IX),
				les Aventuriers ont déjoué la tentative de Méhistophélès de 
				rendre Erozéa inhabitable en répendant le Gaz de Possesion.
				Méphistophélès va alors se réfuger dans l'Ortho-temps.
			</div>
			<hr/>
			<div class="videoLink" onclick={markClick} gpVideo="ff-10/ff-10-metropolis-3d">
				➥Grâce au Chronogyre, les Aventuriers se rendent à Métropolis,
				un cité instanciée selon l'Ortho-temps.
				Méphistophélès a déjà fuit cette dimension en laissant des directives
				aux derniers Nouveaux Anciens d'Eorzéa.
			</div>
			<hr/>
			<div class="videoLink" onclick={markClick} gpVideo="ff-10/ff-10-metro-trailer">
				➥En explorant Métropolis, les Aventuriers ont retrouvé les indices
				localisant des runes maléfiques en Erozéa.
				Je les ai toutes désactivées grâce à une parfaite collaboration des Aventuriers.
				C'est alors que Thor nous a rendu visite via le Chronogyre, confirmant
				l'existance de l'Hyper-temps et la neutralisation de Méphistophélès.
			</div>
			<hr/>
			<div>
				Te souviens-tu de tout celà?
				<br/>
				<Btn val="Non, je n'y ai pas participé"
					msg="Alors clique sur les liens videos de cette page pour voir ce que tu as manqué" />
				<Btn bind:refStep={epiqStep} step=55 val="Oui. J'y étais"
					msg="Si tu souhaites revoir les vidéos d'autres aventures plus tard, tu pourras te rendre à l'IPA, l'Institut Peluchique de l'Audiovisuel (dans la liste de tes Possibles)"/>
				<Btn bind:refStep={epiqStep} step=55 val="Je viens de regarder les vidéos"
					msg="Si tu souhaites revoir les vidéos d'autres aventures plus tard, tu pourras te rendre à l'IPA, l'Institut Peluchique de l'Audiovisuel (dans la liste de tes Possibles)"/>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==55}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"hof-lalalex.png"} style="width:30%; float:right" alt="" />
			<div>
				Après la capture de Méthistophéles, il y a quelques mois,
				Erozéa est entré dans une nouvelle ère de tranquillité.
				<br/>
				D'éminentes Peluches Philosophes l'ont appelé <b>Le Temps des Fleurs</b>.
				<div class="br"/>
				Les Peluches Scientifiques vont de découvertes en découvertes.
				<br/>
				Les Aventuriers et Aventurières découvrent des lieux encore inexplorés,
				cultivent leurs jardins,
				craftent de merveilleux objets, et améliorent leur Housing,
				transformant une simple chambre ou une maisonnette en un véritable
				écrin digne du
				<span onclick={null} class="videoLink" gpVideo="X-initiatique/Hameau">
				hameau de la reine.
				</span>
			</div>
			<div class="br" />
			<div>
				Mais cette tranquilité apparente pourrait cacher un
				danger inimaginable.
			</div>
			<div class="br" />
			<div>
				La Peluche 
				<a href="https://fr.wikipedia.org/wiki/Nostradamus" target="gpHelp">
					Nostradamus
				</a>
				a prédit que lorsque Eorzéa sera apaisée,
				<a href="https://fr.wikipedia.org/wiki/Expansion_de_l%27Univers" target="gpHelp">
					l'Expansion de l'Univers Connu
				</a>
				sera menacée.
			</div>
			<Btn bind:refStep={epiqStep} refDth={epiqStepChangeDth} delai=10 step=60 val="C'est inquiétant" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==60}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"hof-lalalex.png"} style="width:30%; float:right" alt="" />
			<div>
				Tu as bien raison {pseudo}. C'est inquiétant.
				<div class="br"/>
				Peut-être que lors de cette prochaine période troublée,
				tu devras te rendre dans l'Ortho-Temps,
				la cinquième dimension de notre Univers Connu.
				<div class="br"/>
				Je te propose de visiter la Porte de l'Ortho-Temps,
				afin de vérifier les capacités de ton équipement.
				<div class="br"/>
				Les éléménts importants, dans l'Ortho-Temps, sont:
				<br/>
				{#if isPC()}
					➥Clique et drag avec ta souris pour t'orienter. (bouton droit pour "tourner", bouton gauche pour "glisser")
					<br/>
					➥Pour te déplacer, 
					utilise ton clavier, la molette de ta souris,
					ou clique sur les boutons verts.
					<br/>
					➥Pour intéragir avec un objet, clique dessus.
					<br/>
				{:else}
					➥Appuie sur les boutons verts pour te déplacer,
					<br/>
					➥Glisse ton doigt pour t'orienter.
					<br/>
					➥Pour intéragir avec un objet, tape dessus.
					<br/>
					➥Le passage entre mode "Portait" et le mode "Paysage" doit ajuster la scene
					à ton écran.
					<br/>
				{/if}
			</div>
			<div class="adminCadre info">
				<div>Quelques informations de Métacache (optimisation des téléchargements)</div>
				<Common t="checklist3D" />
			</div>
			<Btn bind:refStep={epiqStep} step=65 val="Visiter la porte de l'Ortho-Temps" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==65}
		<div class="reveal" use:scrollPageToTop>
			<div {@attach start3D} id="kikiFullArea">
				<div>
					<BabHeader
						bind:dspBabParam={dspBabParam}
						bind:babIHM={babIHM}
						bind:saisies={saisies}
						pseudo={pseudo}  />
				</div>
				<div>
					<canvas class="babylon" id="render-canvas-3D" onevent3d={event3d}></canvas>
				</div>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==70}
		{@const babMetro=babylonGetMetrologie()}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"deepAI/ref-cl.png"} style="width:30%; float:right" alt="" />
			{#if babMetro.FPS}
				<div>Mon relevé indique un FPS moyen de {babMetro.FPS.toFixed(1)}.</div>
				{#if babMetro.FPS>55}
					<div style="color:lightgreen">
						Ton équipement permet les voyages dans l'Ortho-Temps.
					</div>
				{:else if babMetro.FPS>40}
					<div style="color:yellow">
						Ton équipement permet les voyages dans l'Ortho-Temps.
					</div>
				{:else if babMetro.FPS>30}
					<div style="color:orange">
						Ton équipement est plutot lent, tu risques de lagger lors des voyages dans l'ortho-temps.
					</div>
				{:else}
					<div style="color:red">
						Ton équipement semble TRES lent, contacte Kikiadoc pour analyse.
					</div>
				{/if}
			{:else}
				<div class="blinkMsg" style="color:red">
					Je n'ai pas obtenu recemment des mesures valides de la performance de ton équipement,
					tente de l'explorer à nouveau.
					Si l'erreur persiste, contacte Kikiadoc sur Discord
				</div>
			{/if}
			J'espère que tu as bien exploré la Porte de l'Ortho-Temps.
			Si tu n'as pas découvert toutes les options de déplacement, d'intéraction,
			de personnalisation ou que le test de performance n'est pas satisfaisant,
			tu peux
			<Btn bind:refStep={epiqStep} step=65 val="l'explorer à nouveau" />
			<div class="br"></div>
			<div class="br"></div>
			Il me reste à vérifier avec toi quelques points.
			Le premier est que tu peux facilement te TP vers les maisons de Kikiadoc 
			<u>en étant ami{G(pseudoGenre,"","e")} IG avec lui</u>
			<span class="info">(Kikiadoc Lepetiot @ Moogle)</span>.
			<div class="br"></div>
			<Btn bind:refStep={epiqStep} step=75 val="Je vais lui demander"
				msg="N'oublie pas, ce sera très pratique pour les TPs.
						Tu peux MP Kikiadoc sur Discord s'il n'est pas connecté"/>
			<Btn bind:refStep={epiqStep} step=75 val="Je suis déjà ami{G(pseudoGenre,"","e")} IG avec Kikiadoc" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
<!--	
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
-->	
	{#if epiqStep==75}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"deepAI/ref-cl.png"} style="width:30%; float:right" alt="" />
			Fais maintenant un TP vers la maison de CL de Kikiadoc
			(Moogle, Brumée, secteur 19, slot 5). 
			Si ton perso n'est pas sur Moogle ou si tu dois te rendre sur d'autres monde, tu peux utiliser
			l'éthérite d'une capitale pour changer gratuitement de monde (mode baroud{G(pseudoGenre,"eur","euse")}).
			<a href="https://fr.finalfantasyxiv.com/lodestone/playguide/contentsguide/worldvisit/" alt="" target="gpHelp">
				Voir le tuto du jeu pour de tels voyages.
			</a>
			<div class="br"></div>
			Quand tu es devant la maison de CL de Kikiadoc, va dans le jardin et dirige toi vers le servant Kikiadoc Lebogosse
			<br/>
			<Btn bind:refStep={epiqStep} step=80 val="Je suis dans le jardin" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==80}
		{@const X=8.7}
		{@const Y=11.8}
		<div class="reveal" use:scrollPageToTop>
			Maintenant que tu es dans le jardin de la maison de CL de Kikiadoc,
			tu peux te placer à proximité du servant Kikiadoc Lebogosse. (voir l'image ci-dessous)
			<div class="br" />
			<img class="parchemin" src={urlCdn+"X-initiatique/testJardin.png"} style="width:90%" alt="" />
			<br/>
			Positionne toi juste à côté de lui.
			Tu auras de multiples cas où ta position est importante pour réussir,
			alors rapproches-toi toujours au maximum.
			<br/>
			Lorsque ta boussole indique X:{X} Y:{Y}, tu es bien positionné{G(pseudoGenre,"","e")}.
			<br/>
			Indique alors ci-dessous les coordonnées:
			<div class="br" />
			X:<input type="number" placeholder="*{X}*" min=0 max=20 step="0.1" bind:value={saisies.X} />
			Y:<input type="number" placeholder="*{Y}*" min=0 max=20 step="0.1" bind:value={saisies.Y} />
			{#if saisies.X!=X || saisies.Y!=Y}
				<span style="color:red">??</span>
			{:else}
				<Btn style="color:green" bind:refStep={epiqStep} step=85 val="➤" />
			{/if}
			<div class="info">
				Ce petit test permet de vérifier que tu n'as pas de pertubateur de saisies
				(en particulier sur iPhone)
				et que tu vois bien la distance minimum pour être "près" d'un pnj, d'un objet ou d'un lieu.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==85}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/cagnotte.png"} style="width:50%; float:right" alt="" />
			<div>
				Il me reste à t'expliquer quelques nouvelles mécaniques générales de cet Evénement.
				<br/>
				➥La Cagnotte de l'Evénement
				<br/>
				➥La Contribution
				<br/>
				➥La Cagnotte de Challenge
				<div class="br" />
				La Cagnotte de l'événement est la somme totale qui sera répartie lors de l'événement.
				Elle peut dépasser plus de 400 millions de Gils en fonction du niveau de coopération de tous.
				<div class="br" />
				La Contribution reflête l'implication personnelle de chacun au profit de tous
				et, réciproquement, l'implication de tous au profit de chacun.
				Pour chaque challenge, elle commence à 0 et peut atteindre la valeur maximale de
				{GBLCONST.EQUILIBRAGE.NB}.
				<br/>
				Elle détermine alors la Cagnotte de Challenge, mais attention, ce n'est
				pas du tout linéaire, c'est une exponentielle.
				<br/>
				La Cagnotte de challenge est la somme qui sera répartie lors d'un challenge
				selon la Contribution et tes résultats personnels.
				Son montant maximum est une partie de la cagnotte de l'événement
				(environ 50 millions de gils par challenge).
				<div class="br" />
				C'est pourquoi il faut TOUJOURS maximiser la Contribution lors d'un challenge.
				<div class="blinkMsg">
					Il est souvent préférable d'aider une personne n'ayant pas encore réussi à contribuer
					que de le faire soi-même: Tu peux lui expliquer comment faire ou lui donner la solution!
				</div>
				Tu peux à tout moment cliquer sur le bouton "Résultats", 
				le résultat et le calcul de la Contribution seront alors indiqués.
			</div>
			<Btn style="color:green" bind:refStep={epiqStep} step=86 val="Un exemple?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==86}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/cagnotte.png"} style="width:50%; float:right" alt="" />
			La meilleure stratégie est:
			<br/>
			➥Collaborer pour maximiser la Contribution.
			<br/>
			➥Puis augmenter ton mérite personnel.
			<br/>
			Tu peux <u>simuler le calcul de ton gain personnel</u> en positionnant les différents curseurs
			ci-dessous.
			<div class="adminCadre">
				<div>
					Gain maximum du challenge:
					<input type="range" min=40 max=70 step=10 bind:value={saisies.simulBaton}>
					{saisies.simulBaton}M
				</div>
				<hr/>
				<div>
					Contributions:
					<input type="range" min=1 max={GBLCONST.EQUILIBRAGE.NB} step=1
						bind:value={saisies.simulContrib} oninput={ ()=> {
							saisies.simulMax =
							(saisies.simulContrib<=1)? 100:
							(saisies.simulContrib<=4)? 90:
							(saisies.simulContrib<=7)? 70:
							(saisies.simulContrib<=9)? 40:	30
							if (saisies.simulRatio>saisies.simulMax) saisies.simulRatio=saisies.simulMax
						}}>
					{saisies.simulContrib}
				</div>
				<hr/>
				<div>
					Mérite personnel:
					<input type="range" min=0 max={saisies.simulMax} step=5 bind:value={saisies.simulRatio}>
					{saisies.simulRatio}%
				</div>
				<hr/>
				<div>
					Gain personnel:
					{(saisies.simulRatio*calcCagnotte(saisies.simulContrib,saisies.simulBaton)/100).toFixed(1)}M
				</div>
			</div>
			<Btn style="color:green" bind:refStep={epiqStep} step=90 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==90}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-7/livre-correspondance.png"} style="width:50%; float:right" alt="" />
			Ton initiation touche à sa fin.
			<br/>
			Entre dans la maison de CL de Kikiadoc et consulte le livre de correspondance.
			Ecris alors un message.
			<div class="br"></div>
			<Btn val="Explique moi pour le livre de correspondance"
				msg="Le livre se trouve dans la maison, près de l'entrée et à gauche en entrant, sur une demi-cloison. Clic sur l'icon 🠟 au dessus du livre. Lis alors le message du propriétaire et laisse un message selon la consigne en cliquant sur l'icon crayon 🖉" />
			<Btn bind:refStep={epiqStep} step=99 bind:refPageDone={pageDone} pageDone={pageDesc.n} 
				val="J'ai écrit le message demandé sur le livre" ifFct={()=>addNovice()} />
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
			En haut de page, tu auras souvent un bouton "résultats" indiquant la progression
			actuelle des Aventuriers et Aventurières dans le challenge en cours.
			En cliquant dessus immédiatement, tu verras la liste des Novices de {NOVICIAT_LBL}.
			<div class="br"></div>
			Tu pourras revenir à cette quête initiatique depuis ta Liste des Possibles
			en cliquant sur <i>{pageDesc.texte}</i>.
			Tu pourras alors la revoir en cliquant sur "Revoir le Lore" en haut de cette page.
			<div class="br"></div>
			<Btn bind:refPage={page} page=0 val="Merci Grande Peluche"  />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
</div>

<!-- svelte-ignore element_invalid_self_closing_tag  -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if dspResultats && novices}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>
					<div>Novices de {NOVICIAT_LBL}:</div>
					<hr/>
					{#each Object.keys(novices.pseudos) as p,i}
						<div style="font-size:0.9em">
							<img style="width: 1em" alt="" src={urlCdnAI+"pseudo-"+p+".jpg"} />
							{p}:
							{jjmmhhmmss(novices.pseudos[p].dth)}
						</div>
					{/each}
					<hr/>
					<div>{novices.nb} participants</div>
				</div>
				<div class="info">
					Il n'y a pas de contribution ni de gains pour ce challenge Initiatique,
					mais ta participation permet de finaliser l'équilibrage de l'événement.
					<br/>
					Tous les participants à cette Initiatique gagne 1 millions de Gils.
				</div>
			</div>
		</div>
	</div>
{/if}
	

<!-- P405.svelte -->

