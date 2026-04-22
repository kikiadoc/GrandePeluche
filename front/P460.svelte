<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo, displayObject,
					 markClick, isAdmin,
					 urlCdn, apiCall, apiCallExtern, getEpsilon, urlCdnAI,
					 addNotification, mediaPlay,countDownInit,
					 addTexteTTS, isPlaying, isProd
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
	import Common from './Common.svelte'
	import Btn from './Btn.svelte'
	
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
	// svelte-ignore state_referenced_locally
	const APIROOT = '/'+pageDesc.rootName+'/'
	
	const APICONFIG = APIROOT+'config'	
	const APIETAT = APIROOT+'etat'	
	const APIREQUPDATE = APIROOT+'reqUpdate'	
	// svelte-ignore state_referenced_locally
	const WSMSGETAT = pageDesc.rootName+".etat"
	
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique 
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// variables intercomposants
	let commonVars = $state({})
	
	// afficahge des popups standards
	let dspResultats=$state(false) 	// affichage des résltats

	let dspAide=$state(false) 	// aide à un pseudo
	let dspIndices=$state(false) 	// indices d'un pseudo

	// appelé apres mount du component
	async function init() { console.log('**mount P'+pageDesc.n+'**'); await getConfig(); getEtat() }
	
	// appelé apres unmount du component
	function reset() { console.log('**unmunt P'+pageDesc.n+'**')	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op==WSMSGETAT && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.targetPseudo = null // cible actuelle
		s.nextIndiceEcheance ??= 1 // 1ms pour forcer le refresh timer
		console.log("**************************normalizedSaisies nextIndiceEcheance corriger ")
		s.nextIndiceEcheance ||= 1 // 1ms pour forcer le refresh timer
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// chargement config du challenge
	let MUSIQUESENUM = $state(null)
	let MUSIQUEITEM2ENUM = Array() // sera populé par l'index croisé
	let MUSIQUEITEM2SOLUCE = Array() // sera populé par l'index croisé
	let CONFIG = $state(null)
	async function getConfig() {
		MUSIQUESENUM= await apiCallExtern(urlCdn+"musiques/index.json","GET")
		if (!MUSIQUESENUM) throw new Error("Erreur de fetch sur l'index des musiques")
		// reverse index des musiques par itemId
		for (let i=0; i< MUSIQUESENUM.length; i++)
			MUSIQUEITEM2ENUM[MUSIQUESENUM[i].itemId]=i
		// console.log("MUSIQUEITEM2ENUM",MUSIQUEITEM2ENUM)
		let ret = await apiCall(APICONFIG);
		if (ret.status != 200) throw new Error("erreur sur "+APICONFIG+"("+ret.status+')')
		CONFIG = ret.o
		// reverse index des soluces par itemId
		for (let i=0; i< CONFIG.MUSIQUES.length; i++)
			MUSIQUEITEM2SOLUCE[CONFIG.MUSIQUES[i].mu]=i
	}
	// chargement etat du challenge
	let etat = $state(null)
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall(APIETAT);
		if (ret.status != 200) return console.error("erreur sur",APIETAT,ret.status)
		recalcEtat(ret.o)
	}

	async function recalcEtat(tEtat) {
		console.log("recalcEtat")
		// Si pas d'état précédent 
		if (!etat) {
			etat=tEtat
			etat.cagnotteNb = 0
		}
		else { 
			etat.nbDissonances = tEtat.nbDissonances
			etat.dthVersion = tEtat.dthVersion
			etat.cagnotteNb = 0
			// balaye les pseudos et miodifie ceux qui ont évolués
			Object.keys(tEtat.pseudos).forEach( (p) => {
				let e = tEtat.pseudos[p]
				if (e?.score) etat.cagnotteNb += 1
				if (e?.muDth != etat.pseudos[p]?.muDth) {
					console.log("update etat:",p)
					etat.pseudos[p] = e
				}
				else
					console.log("pas update etat:",p)
			})
		}
		toggleToPseudo()
	}

	function getMusicFromItemId(itemId) {
		return MUSIQUESENUM[ MUSIQUEITEM2ENUM[itemId] ]
	}
	function getSoluceFromItemId(itemId) {
		return CONFIG.MUSIQUES[ MUSIQUEITEM2SOLUCE[itemId] ]
	}
	function getOggUrlFromMusic(music) {
		return urlCdn+"musiques/item_"+music.itemId+"_"+music.oggId+".ogg"
	}
	function getEtatPseudo(pseudo) {
		return etat.pseudos[pseudo] || null
	}
	function toggleToPseudo(p) {
		if (p) saisies.targetPseudo = p
		let e = getEtatPseudo(saisies.targetPseudo)
		if (!e) return console.log("toggleToPseudo null p=",p)
		let domAudio = document.getElementById("audioDissonances")		
		console.log("toggleToPseudo",e)
		// si une musiqu est en cours sur le pseudo...
		if ( e.muIdx && (e.muDth+getEpsilon()+CONFIG.TIMERSUCCES > Date.now()) ) {
			addNotification("Tu écoutes les dissonances de "+saisies.targetPseudo)
			// console.log("music en cours",e,m)
			if (domAudio && domAudio.gpPseudo!=saisies.targetPseudo) {
				if (saisies.targetPseudo==pseudo)
					addTexteTTS("Tu écoutes tes dissonances personnelles")
				else {
					addTexteTTS("Tu écoutes les dissonances de")
					addTexteTTS(saisies.targetPseudo)
				}
			}
			if (domAudio && ( domAudio.gpPseudo!=saisies.targetPseudo || !isPlaying(domAudio) )) {
				let m = getMusicFromItemId(e?.muIdx)
				domAudio.gpPseudo = saisies.targetPseudo
				domAudio.src=getOggUrlFromMusic(m)
				mediaPlay(domAudio)
			}
		}
		else {
			// pas de musique sur le pseudo...
			addNotification("Pas de dissonances pour "+saisies.targetPseudo)
			addTexteTTS(saisies.targetPseudo)
			addTexteTTS("ne perçoit aucune dissonance")
			if (domAudio) { 
				domAudio.pause()
				domAudio.src=urlCdn+"commons/hildiscord-jenairiendit.mp3"
				domAudio.gpPseudo=null
			}
			// console.log("music non dispo",e) 
			dspAide=null
			dspIndices=null
		}
	}
	// un timer est a l'écheance
	async function renewTimer(p) {
		// si c'est le timer du pseudo on fait le refesh
		console.log("renewTimer",p)
		if (p==pseudo) { 
			console.log('reqUpdate')
			let ret = await apiCall(APIREQUPDATE)
			if (ret.status==200) {
				if (ret.o.muIdx) {
					addTexteTTS(pseudo)
					addTexteTTS("Ta dissonance personnelle a changé")
				}
			}
		}
		// si dspAide ouvert sur le pseudo, on le ferme
		if (dspAide && dspAide.pseudo==p) dspAide = null
	}
	async function proposition() {
		let url = APIROOT+'proposition/'+(saisies.x || 0)+'/'+(saisies.y || 0)
		let ret = await apiCall(url,'POST');
		switch (ret.status) {
			case 200: displayInfo({back:"stars", body:["Tu as désactivé ta dissonance"] }); break
			case 201: displayInfo("Ce n'est pas la bonne position"); break;
		}
		toggleToPseudo()
	}
	const matchBlanc = /[, ]/g // comptage des blancs, virgules
	async function envoiIndice(indice) {
		if (saisies.nextIndiceEcheance > Date.now()) {
				return displayInfo({titre:"Tu es épuisé"+G(pseudoGenre,"","e"),body:["Repose toi encore un peu"]})
		}
		// indice= {t, from, to, m}
		if (indice.t=='m') {
			// Le texte du message doit comporter un blancs/virgues et être de longeur de 15
			if ( (indice.m||"").length<15 || (indice.m.match(matchBlanc).length < 2) )
				return displayInfo({titre:"Honte à toi!",body:["Ton message ",indice.m,"est mesquin"]})
		}
		dspAide=null // ferme la popoup d'aide
		saisies.nextIndiceEcheance=Date.now()+CONFIG.TIMERAIDE // reset le timer d'indice
		let url = APIROOT+'indice'
		let ret = await apiCall(url,'POST',indice)
		switch (ret.status) {
			case 200: displayInfo({back:"stars", body:["Tu as matérialisé un indice pour "+indice.to] }); break
			case 201: displayInfo({back:"stars", body:[indice.to+" avais déjà cet indice"] }); break
			default: displayInfo("Je n'ai pas réussi à matérialiser l'indice"); break;
		}
	}
	// calcul des résultsts
	function calcResultats() {
		let res={ }
		dspResultats = res
	}

	
</script>

<style>
	.trOn { cursor: pointer; outline: 2px outset black}
	.trOff { cursor: pointer }
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
				<input type="button" value="ResetAll" onclick={() => confirm("Tout effacer?") && apiCall(APIROOT+'etat','DELETE') } />
				<input type="button" value="ResetTimerIndice" onclick={() => saisies.nextIndiceEcheance=1 } />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}

	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
		<Common t="headerPage" pageDesc={pageDesc} />
	</div>

	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dissonances/prime-directive.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Après qu'Anakin eût découvert l'Ortho-Temps (Hypostasis, Kiki's Event VII),
				les Peluches définissaient les Directives Déontologiques des Dimensions.
				<br/>
				La
				<a href="https://fr.wikipedia.org/wiki/Directive_Premi%C3%A8re" target="gpHelp">
					Directive Première
				</a>
				définit le principe de non-ingérence.
				<br/>
				Daniel Jackson, notre explorateur de l'Hyper-Temps, se doit de la respecter.
			</div>
			<Btn bind:refStep={epiqStep} step=10 val="Et alors?" />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dissonances/tableau-math.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Et alors {pseudo}, la situation est délicate:
				<br/>
				Les Humains de la Terre paramètre leur Pharao selon leur temps ce qui n'est pas assez précis.
				<br/>
				Daniel ne peut révéler aux Humains de la Terre qu'il faut tenir compte
				de l'existence de trois dimensions temporelles lors de ce paramétrage.
				<br/>
				Ces approximations provoquent des Dissonnances dans notre espace-temps classique
				et le triplet de Pharao ne peut pas encore mettre en évidence la dérive des Orthogonalités.
			</div>
			<Btn bind:refStep={epiqStep} step=20 val="Des Dissonances?" />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dissonances/cds-musique.png"} style="width:30%; float:right" alt="" />
			<div>
				Oui {pseudo}, j'ai appelé ce phénomène les Dissonances car ce paramétrage imprécis
				des humains de la terre provoque des vibrations sonores dans l'atmosphère d'Eorzéa.
			</div>
			<div>
				Si nous dissipons chacune de ces Dissonances de notre espace-temps classique,
				le retour de force intertemporel devrait provoquer le reparamétrage
				du Pharao des Humains de la Terre aux bonnes valeurs.
			</div>
			<div class="br"/>
			<div>
				Hélas, localiser une Dissonance n'est pas une opération facile:
				elles sont nombreuses, elles ne sont pas stables,
				elle apparaissent, disparaissent de la surface d'Eorzéa et
				ne peuvent être localisées que par la mesure d'infimes variations
				de pression se propageant dans l'atmosphère.
			</div>
			<div class="br"/>
			<div>
				C'est ta mission. Tu as tout compris?
			</div>
			<Btn bind:refStep={epiqStep} step=30 val="Oui, bien sur" />
			<Btn bind:refStep={epiqStep} step=30 val="Peut-être pas..." />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dissonances/cds-musique.png"} style="width:30%; float:right" alt="" />
			<div>
				Bon, je vais préciser ta mission.
				<div class="br"/>
				Comme tous les habitants d'Eorzéa, tu es équipé{G(pseudoGenre,"","e")} de
				<a href="https://fr.wikipedia.org/wiki/Oreille" target="gpHelp">
					deux capteurs
				</a>
					te permettant de percevoir une Dissonance comme un
				<a href="https://fr.wikipedia.org/wiki/Musique">
					flux harmonieux
				</a>.
				Cela devrait te permettre de la localiser et
				ta seule présence sur son lieu source, {G(pseudoGenre,"équipé","équipée")}
				d'une tunique temporelle,	suffira alors à la dissiper.
			</div>
			<div class="br"/>
			<div>
				D'après les calculs de la Peluche Mathématicienne
				<a href="https://fr.wikipedia.org/wiki/Nicolas_Bourbaki" target="gpHelp">
					Nicolas Bourbaki
				</a>,
				le cardinal de l'ensemble des
				Dissonances devrait être égal
				<br/>
				➥au premier
					triplet pythagoricien
				(3²+4²=5²=<u>25</u> )
				<br/>
				➥au troisième
					nombre octogonal centré
				(1, 9, <u>25</u>, 49, ... )
			</div>
			<div>
				Voila ta mission. C'est limpide non?
			</div>
			<Btn bind:refStep={epiqStep} step=40 val="Heu..." />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==40}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dissonances/cds-musique.png"} style="width:30%; float:right" alt="" />
			<div>
				Bon, je vais encore plus détailler.
				<div class="br" />
				Cette mission est impossible à faire en solo.
				Elle nécessite une équipe où chaque membre de l'équipe collabore
				pour atteindre l'objectif commun.
				Plus grande sera cette collaboration, plus rapide sera la réalisation de cette mission.
				<div class="br" />
				Il y a 25 Dissonances à la surface d'Eorzéa. Il faut les trouver et les dissiper toutes.
			</div>
			<Btn bind:refStep={epiqStep} step=50 val="C'est clair" />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==50}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dissonances/cds-musique.png"} style="width:30%; float:right" alt="" />
			<div>
				Chaque membre de l'équipe percevra, si cela est possible, 
				une des Dissonances encore actives sous forme de musique.
				Pour dissiper sa Dissonance, il devra être équipé d'une tunique temporelle et
				indiquer les coordonnées du lieu d'origine de cette musique.
				Ces coordonnées peuvent être le résultat de sa propre exploration,
				ou d'indices proposés par d'autres membres de l'équipe.
				<br/>
			</div>
			<Btn bind:refStep={epiqStep} step=60 val="D'autres détails?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==60}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dissonances/cds-musique.png"} style="width:30%; float:right" alt="" />
			<div>
				A tout moment, tu peux:
				<br/>
				➥Sélectionner ta Dissonance.
				Tu peux, si tu es {G(pseudoGenre,"équipé","équipée")} d'une tunique temporelle,
				indiquer les coordonnées de sa source et la dissiper.
				Tu peux aussi te rendre sur le lieu de sa source pour en connaître les coordonnées.
				<br/>
				➥Sélectionner la Dissonance d'un autre membre de l'équipe.
				Tu peux alors l'aider de différentes manières et selon tes possibilités.
				Tu peux lui crafter une tunique temporelle et lui envoyer un message.
				Tu peux, si tu reconnais la musique de sa Dissonance, te rendre sur le lieu
				associé et lui indiquer les coordonnées.
				Tu pourras aussi, parfois, lui indiquer un indice.
				<br/>
			</div>
			<Btn bind:refStep={epiqStep} step=70 val="Coopération!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==70}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dissonances/cds-musique.png"} style="width:30%; float:right" alt="" />
			<div>
				oui {pseudo}, coopérer est la clef de ce challenge.
				<div class="br"/>
				Les extraits de musique sont les débuts de musiques d'ambiance de donjon, raid ou cités.
				<br/>
				➥Les positions à indiquer sont les coordonnées de l'Ethérite principale de la cité ou
				celles de la petite éthérite permettant d'accéder au donjon ou au raid.
				<br/>
				Pour vérifier une musique d'un raid ou d'un donjon, tu peux y entrer en solo en
				activant le mode "Sans restriction" dans le panneau des raids et donjon.
			</div>
			<div>
			</div>
			<Btn bind:refStep={epiqStep} step=80 val="Dernieres suggestions?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Réglages de l"audio...
			</div>
			<div>
				Position à indiquer quand donjon, ville etc...
				Position du téléporteur d'entrée ou du PNJ pour y entrer (style félicité insulaire)
			</div>
			<div>
				Pour pouvoir détruire une dissonance.. (aide utile ou a comprendre?)
			</div>
			<div>
				Dernier conseil:
				<br/>
				Jouez collectif, jouez stratégique, vous gagnerez plus et irez plus vite.
				<br/>
				Jouez perso et vous y passerez la nuit.
			</div>
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div use:scrollPageToTop>
			<div>
				<div style="display: {(saisies.debug)? 'block' : 'none'} ">
					{saisies.targetPseudo || "Aucune sélection"}
					<br/>
					<audio style="height:1em; width: 100%" id="audioDissonances" gpMute="true"
						volume={GBLSTATE.audioVolume/100} controls onended={()=>toggleToPseudo()}
					/>
				</div>
				<div>
					<div style="cursor:pointer" >
						<span onclick={markClick}
							gpHelp="Cagnotte globale. Elle augmente à chaque fois qu'une personne trouve sa première dissonance (voir le bouton résultats)." >
							💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}
						</span>
						<span onclick={markClick}
							gpHelp="Nombre total de dissonances détruites." >
							🎯
							{etat.nbDissonances}/{CONFIG.NBDISSONANCES}
						</span>
						<span onclick={markClick}
							gpHelp="Delai de refroidissement de ton chaudron de matérialisation d'indices. Tu ne peux l'utiliser que s'il est froid." >
							🍲
							<countdown dth={saisies.nextIndiceEcheance} txtTimeout="froid" />
						</span>
					</div>
				</div>
				<div class="papier adminCadre" style="height: 3.1em">
					{#if saisies.targetPseudo==pseudo}
						{@const e = etat.pseudos[saisies.targetPseudo] }
						{#if e?.muIdx }
							<div style="cursor: pointer">
								<span class="infoLink" onclick={()=>dspIndices={t:'n'}}>
									Indices:
								</span>
								{#if e.m1}<span onclick={()=>dspIndices={t:'m1'}}>💌</span>{/if}
								{#if e.m2}<span onclick={()=>dspIndices={t:'m2'}}>💌</span>{/if}
								{#if e.m3}<span onclick={()=>dspIndices={t:'m3'}}>💌</span>{/if}
								{#if e.iNom}<span onclick={()=>dspIndices={t:'n'}}>📜</span>{/if}
								{#if e.iLieu}<span onclick={()=>dspIndices={t:'l'}}>🌐</span>{/if}
							</div>
							{#if e.m1}
								<div>
									<span class="infoLink" onclick={markClick} gpHelp="Indique les coordonnées du lieu de dissonance: C'est le portail d'un donjon, d'un défi ou celle d'un PNJ proposant cette dissonance.">
										Lieu
									</span>
									<input style="width:3em" bind:value={saisies.x} type="number" min=0.0 max=99.9 step=0.1 />
									<input style="width:3em" bind:value={saisies.y} type="number" min=0.0 max=99.0 step=0.1 />
									<input type="button" value="➤" onclick={()=>proposition()}/>
								</div>
							{:else}
								<div class="infoLink" onclick={markClick} gpHelp="Tu dois porter une tunique temporelle pour indiquer le lieu de la source de dissonance, seuls tes amis peuvent t'en procurer une">
									Pas de tunique temporelle
								</div>
							{/if}
						{:else}
							<div>
								Aucune dissonance.
							</div>
							<div>
								Aide les autres!
							</div>
						{/if}
					{:else if saisies.targetPseudo}
						{@const e = etat.pseudos[saisies.targetPseudo] }
						{#if e?.muIdx && e.muDth }
							<div>
								<span class="infoLink" onclick={markClick} gpHelp="Tu peux l'aider en matérialisant une tunique temporelle, le nom 'Orchestrion' de la dissonnance, ou un indice du lieu où en trouver la source de dissonance">
									Aide {saisies.targetPseudo}
								</span>
							</div>
							<div style="cursor:pointer">
								<span onclick={()=>dspAide={t:"m", from:pseudo, to:saisies.targetPseudo} }>𐂫</span>
								<span onclick={()=>dspAide={t:"n", from:pseudo, to:saisies.targetPseudo} }>📜</span>
								<span onclick={()=>dspAide={t:"l", from:pseudo, to:saisies.targetPseudo} }>🌐</span>
							</div>
						{:else}
							<div>
								Aucune dissonance.
							</div>
							<div>
								Aide les autres!
							</div>
						{/if}
					{:else }
						<div class="infoLink" onclick={markClick} gpHelp="help xy">
							Aucune dissonance.
						</div>
						<div>
							Aide les autres!
						</div>
					{/if}
				</div>
				<div class="parchemin" style="font-size: 0.9em; text-align: left">
					<table>
						<tbody>
							{#each Object.keys(etat.pseudos) as p,i}
								{@const e = etat.pseudos[p] }
								{@const mDesc = getMusicFromItemId(e?.muIdx) }
								<tr class= {(p==saisies.targetPseudo)? "trOn":"trOff"} onclick={()=>toggleToPseudo(p)}>
									<td>
											{p}
									</td>
									{#if e.muIdx}
										<td>
											🔊
										</td>
										<td>
											<countdown dth={e.muDth+CONFIG.TIMERSUCCES} use:countDownInit
												oncdTimeout={async ()=> await renewTimer(p)} txtTimeout="--:--:--" />
										</td>
									{:else}
										<td>
											🔇
										</td>
										<td>
											<countdown dth={e.muDth+CONFIG.TIMERWAIT} use:countDownInit
												oncdTimeout={async ()=> await renewTimer(p)} txtTimeout="--:--:--" />
										</td>
									{/if}
									<td>
										{#if e.m1}
											𐂫
										{/if}
									</td>
									{#if saisies.debug}
										{@const soluce=getSoluceFromItemId(e.muIdx) }
										<td>itemId={soluce?.mu}</td>
										<td>x={soluce?.x}</td>
										<td>y={soluce?.y}</td>
										<td>nom={mDesc?.ad?.fields.Name}</td>
										<td>desc={mDesc?.ad?.fields?.Description}</td>
										<td>tip={soluce?.tip}</td>
									{/if}
								</tr>						
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if dspAide}
		{@const aideTo = etat.pseudos[dspAide.to] }
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspAide=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					{#if dspAide.t=="m" && (saisies.nextIndiceEcheance <= Date.now())}
						<div>
							Matérialise une tunique temporelle
							et envoie-la à {dspAide.to} accompagnée d'un petit message.
							<br/>
							⚠️Tout le monde entendra ton message.
							<br/>
							➥Une telle matérialisation est épuisante, aussi
							tu ne peux solliciter une matérialisation que toutes les
							{CONFIG.TIMERAIDE/60000} minutes.
							<br/>
							<input id="dspAideMessage" type="texte" maxlength=40 placeholder="message" style="width:80%" />
							<input type="button" value="➤" 
								onclick={()=>envoiIndice({t:'m',from:dspAide.from, to:dspAide.to, m: document.getElementById("dspAideMessage").value})}/>
							<div class="info">
								Exemples de messages:
								<br/>
								* C'est l'entrée d'IFRIT
								<br/>
								* C'est dans le thanalan
								<br/>
								* IFRIT, thanalan, 0.1 0.1
								<br/>
								* {dspAide.to}, tu sais que je t'aime!
							</div>
						</div>
					{:else if (dspAide.t=="n" || dspAide.t=="l") && (saisies.nextIndiceEcheance <= Date.now())}
						<div>
							Tu peux aider {dspAide.to}
							{#if dspAide.t=="n"}
								en matérialisant le nom de sa dissonance.
							{:else}
								en matérialisant un indice concernant le lieu de sa dissonance.
							{/if}
							<br/>
							➥Une telle matérialisation est épuisante, aussi
							tu ne peux solliciter une matérialisation que toutes les
							{CONFIG.TIMERAIDE/60000} minutes.
							<br/>
							<input type="button" value="Matérialisation"
								onclick={()=>envoiIndice({t:dspAide.t, from:dspAide.from, to:dspAide.to})} />
							<div class="info">
								{#if aideTo.iNom}⚠️ {aideTo.iNom} a déjà matérialisé le nom<br/>{/if}
								{#if aideTo.iLieu}⚠️ {aideTo.iLieu} a déjà matérialisé le lieu<br/>{/if}
								➥Tu ne connaitras pas le résultat de cette matérialisation.
								<br/>
								➥Cette matérialisation disparaîtra lorsque la dissonance de 
								{dspAide.to} changera.
								<br/>
							</div>
						</div>
					{:else}
						<div style="color:red">
							Tu es totalement épuisée.
							<br/>
							{#if saisies.nextIndiceEcheance > Date.now()}
								Patiente
								<countdown dth={saisies.nextIndiceEcheance} oncdTimeout={()=>dspAide=null} use:countDownInit />
								pour que ton chaudron de matérialisation refroidisse.
								<br/>
							{/if}
						</div>
					{/if}
					<div class="info">
					</div>
				</div>
			</div>
		</div>
	{/if}
		
	{#if dspIndices} 
		{@const e = etat.pseudos[pseudo] }
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspIndices=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<img src={urlCdn+"dissonances/gift-40.gif"} style="width: 20%; float:right" alt="" />
					{#if e.iNom || e.iLieu || e.m1}
						<div>
							{#if e.m1}<div>Tu portes une tunique temporelle</div>{/if}
							{#if e.iNom}
									<div>{e.iNom} a matérialisé le nom de ta dissonance:</div>
									<div>"{getMusicFromItemId(e.muIdx)?.ad?.fields?.Name}"</div>
							{/if}
							{#if e.iLieu}
									<div>{e.iLieu} a matérialisé un indice du lieu de ta dissonance:</div>
									<div>"{getMusicFromItemId(e.muIdx)?.ad?.fields?.Description}"</div>
							{/if}
							{#if e.m1} <div>{e.m1.p} t'as envoyé un message: {e.m1.m}</div>{/if}
							{#if e.m2} <div>{e.m2.p} t'as envoyé un message: {e.m2.m}</div>{/if}
							{#if e.m3} <div>{e.m3.p} t'as envoyé un message: {e.m3.m}</div>{/if}
						</div>
					{:else}
						<div>
							Tu n'as recu aucun indice concernant ta dissonance en cours
						</div>
					{/if}
					<div style="clear:both" />
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Résultats: 💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}⇒ {etat.cagnotteNb.toFixed(1)}M/{CONFIG.GILS}M Gils
					</div>
					<table class="resTable">
						<tbody>
							<tr class="petit">
								<td>Pseudos</td>
								<td>Disson.</td>
								<td>Coef</td>
								<td>Gils</td>
							</tr>
							{#each Object.keys(etat?.pseudos) as p}
								{@const e = etat.pseudos[p]}
								<tr>
									<td class="resTd">
										<img style="width: 1em" alt="" src={urlCdnAI+"pseudo-"+p+".jpg"} />
										{p}
									</td>
									<td class="resTd">{#if e.score}🪙{/if}{e.score}</td>
									<td class="resTd">{Math.floor(100*e.score)}%</td>
									<td class="resTd">{(e.score*CONFIG.GILS).toFixed(3)}M</td>
								</tr>
							{/each}
							<tr class="petit">
								<td>Contributions</td>
								<td>🪙={etat.cagnotteNb}</td>
								<td></td>
								<td colspan=3>💰=min({etat.cagnotteNb},{GBLCONST.EQUILIBRAGE.NB})={etat.cagnotteNb}</td>
							</tr>
						</tbody>
					</table>
					<div class="info">
						⚠️Les gains varient tant que le challenge n'est pas terminé.
					</div>
				</div>
			</div>
		</div>
	{/if}

</div>
<!-- P460.svelte -->


