<script>
	import { onMount, onDestroy  } from 'svelte';
	import { urlCdn, urlCdnSTATIC, isProd  } from "./ground.svelte.js"
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 apiCall, apiCallExtern, isAdmin,
					 displayObject, addNotification, playVideo,
					 countDownInit, jjmmhhmmss, getEpsilon, checkTemplate
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE, calcCagnotte, calcCagnotteNb }  from './ground.svelte.js'
	import Common from './Common.svelte'
	import Btn from './Btn.svelte'
	
	let {
		GBLCTX,
		wsCallComponents,
		pageDesc,
		pseudo,
		pseudoGenre,
		pseudoList,
		webAuth,
		page = $bindable(0),
		pageDone = $bindable([]),
	} = $props();

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()
	const WSETAT = (()=>pageDesc.rootName+'.etat')()
	const APICONFIG = APIROOT+'config'
	const APIETAT = APIROOT+'etat'
	const VIDEOLIEUSECRET = "X-cherchezlelala/lieusecret"
	const URLPNJS=urlCdnSTATIC+"img-pnjs/"
	
	onMount(() => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique 
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes 
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// appelé apres mount du component
	async function init() { await getConfig(); getEtat(); voleurSetTimer() }
	
	// appelé apres unmount du component
	function reset() { clearInterval (voleurUpdateIdxTimerId) }

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op==WSETAT && m.o) { getEtat(m); return true }
		return false 
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		s.debug ??= false
		s.vitesse ??= 1
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		/*
		epiqStepChangeDth=Date.now()
		if (newStep==95 && !saisies.videoSlotsTermine) {
			saisies.videoSlotsTermine=true // marque Video affichée
			playVideo(VIDEOLIEUSECRET)
		}
		*/
	}

	// etat du challenge
	let CONFIG = $state(null)
	let etat = $state(null)
	let dspResultats = $state(null)
	let dspAlambic = $state(null)
	let dspEnigme = $state(null)
	let dspReglages = $state(null)
		
	async function getConfig(msgWs) {
		let ret = msgWs || await apiCall(APICONFIG);
		if (ret.status != 200) return console.error("erreur sur",APICONFIG, ret.status)
		CONFIG = ret.o
	}
	async function getEtat(msgWs) {
		if (!CONFIG) return console.log("getEtat impossible sans CONFIG")
		let ret = msgWs || await apiCall(APIETAT);
		if (ret.status != 200) return console.error("erreur sur ", APIETAT,ret.status)
		let tEtat = ret.o
		// commit du nouvel etat
		etat = tEtat
		calcEtat()
	}
	// saisies.videoAffichee = false
	function calcEtat() {
		// Si popup de résolution, et resolu ou reset, ferme le popup 
		if (dspEnigme) {
			if (etat.slots[dspEnigme.idx].solucePseudo)
				dspEnigme=null
			else if (!etat.slots[dspEnigme.idx].unlockPseudo)
				dspEnigme=null
		}
		// video de challenge termine
		if (etat.challengeTermine && !saisies.videoAffichee) {
			saisies.videoAffichee = true
			playVideo(VIDEOLIEUSECRET)
		}
	}

	const POINTMIN=5
	const POINTMAX=7
	const CAGNOTTE=[0,2,5,10,15,25,45,85,100]
		
	function calcResultats() {
		if (!etat) return
		let tRes = { tblPseudos: Object.keys(etat.pseudos), pseudos: {}, eligibleNb: 0, ptTotal: 0 }
		function getPseudo(tRes,p) {
			return tRes.pseudos[p] ??= { cnt:0, pt:0, cls:"cRed", persoPct:0 }
		}
		tRes.tblPseudos.forEach( (p) => {
			let rp = getPseudo(tRes,p)
			let ep = etat.pseudos[p]
			// calcul des points
			if (ep.lalaPresent) { rp.flagLala = true; rp.cnt++ }
			if (ep.voleurGetNb) { rp.flagVol = true; rp.cnt++ }
			if (ep.alambicGetNb) { rp.flagAla = true; rp.cnt++ }
			if (ep.upNb) { rp.flagUp = true; rp.cnt++ }
			if (ep.unlockNb) { rp.flagUnl = true; rp.cnt++ }
			if (ep.soluceNb) { rp.flagSol = true; rp.cnt++ }
			if (ep.msgLivre) { rp.flagLivre = true; rp.cnt++ }
			// uniquement si le speudo a "participé"
			if (rp.cnt >= POINTMIN) {
				rp.cls = "cGreen"
				rp.pt = rp.cnt
				tRes.eligibleNb++
				tRes.ptTotal += rp.cnt
			}
		})
		tRes.cagnotte = CAGNOTTE[Math.min(CAGNOTTE.length-1,tRes.eligibleNb)]
		dspResultats = tRes
	}
	// réponse à l'énigme du nom du lala 
	function reponseLala(ev) {
		if (!checkTemplate(saisies.lalaNom,CONFIG.LALAPH)) {
			displayInfo({titre:"Proposition invalide", ding: 'prout-long',
									 body:["Ta réponse doit être selon le format:",CONFIG.LALAPH]})
		}
		else {
			apiCall(APIROOT+"lalaNom/",'POST',{reponse:saisies.lalaNom})
			saisies.reponseLala = null
		}
	}

	//////////////////////////////////////////////////
	// Gestion des slots
	//////////////////////////////////////////////////
		
	// clic sur un slot de la carte
	function slotClick(ev) {
		let idx = ev.currentTarget.getAttribute("gpIdx")
		let slot =  etat.slots[idx]
		let ep = etat.pseudos[pseudo]
		// console.log("clicCase",ev,idx,slot,ep)
		if (slot.solucePseudo) {
			displayInfo({titre:"Partie de parchemin déja fixée", ding: "prout-long", autoClose:5,
										 body: [slot.solucePseudo+" a déjà fixé cette partie."] })
			return
		}
		if (slot.unlockPseudo) {
			dspEnigme = { idx: idx }
			return
		}
		if (slot.revelateurPseudo == pseudo) {
			displayInfo({titre:"Passe ton tour", ding: "prout-long", autoClose:5,
										 body: ["Demande à un ou une autre de révéler la suite."] })
			return
		}
		if (slot.proba < CONFIG.PROBA) {
			// Utilisation d'une revelateur
			if (ep.revelateurNb>0)
				apiCall(APIROOT+"revelateurUtilise/"+idx,'POST')
			else
				displayInfo({titre:"Partie de parchemin à révéler", ding:"prout-long", autoClose:5,
										 body: ["Tu n'as pas de revelateur disponible."] })
			return
		}
		// status non cohérent
		addNotification("Erreur de logique, etat du slot incohérent","red",10,'prout-long')
	}
	
	// slot arrivé a échéance, traitement local
	function slotResetUnlockEcheance(ev) {
		let idx = ev.currentTarget.getAttribute("gpIdx")
		etat.slots[idx].unlockPseudo = null
		etat.slots[idx].unlockEcheance = null
		etat.slots[idx].proba = 1
		etat.slots[idx].enigme = null
		// si dspEnigme affichée, reset
		if (dspEnigme && dspEnigme.idx==idx) dspEnigme=null
	}

	// réponse à l'énigme indiqué dans dspEnigme
	function slotReponseEnigme() {
		// 
		let enigme = etat.slots[dspEnigme.idx].enigme
		if (!checkTemplate(saisies.reponseEnigme,enigme.ph)) {
			displayInfo({titre:"Proposition invalide", ding: 'prout-long',
									 body:["Ta réponse doit être selon le format:",enigme.ph]})
		}
		else {
			apiCall(APIROOT+"reponse/"+dspEnigme.idx,'POST',{reponse:saisies.reponseEnigme})
			saisies.reponseEnigme = null
		}
	}
	///////////////////////
	// gestion des voleurs
	///////////////////////
	const VOLEURPOSTBL = [
		"top: 0; left: 0",
		"top: 0; left: 30%",
		"top: 0; right: 30%",
		"top: 0; right: 0",
		"top: 30%; left: 0",
		"top: 30%; left: 30%",
		"top: 30%; right: 30%",
		"top: 30%; right: 0",
		"bottom: 0; left: 0",
		"bottom: 0; left: 30%",
		"bottom: 0; right: 30%",
		"bottom: 0; right: 0"
	]
	let voleurUpdateIdxTimerId = null
	let voleurIdx=$state(0)
	let voleurPosStyle=$state(VOLEURPOSTBL[0])
	let voleurEcheance=$state(0)

	function voleurSetTimer() {
		if (voleurUpdateIdxTimerId) clearInterval(voleurUpdateIdxTimerId)
		voleurUpdateIdxTimerId = setInterval(voleurUpdateIdx, saisies?.vitesse*1000 || 1000) 
	}
	$effect(()=>voleurSetTimer())
	
	function voleurUpdateIdx() {
		voleurIdx = Math.floor(Math.random()*CONFIG.VOLEURS.length)
		voleurPosStyle = VOLEURPOSTBL[Math.floor(Math.random()*VOLEURPOSTBL.length)]
	}
	async function voleurClick(ev,admForceOk) {
		let ret = await apiCall(APIROOT+"voleurClick/"+ ((admForceOk)? etat.voleurIdx : voleurIdx),'POST')
		// 200 si voleur OK, 201 si voleur pas OK, 298 pas de capture possible 299 coffre rempli
		switch(ret.status) {
			case 200:
			case 201:
				// aucune action, des nroadcast on indiqué le click  
				break;
			case 298:
				displayInfo({
					titre: "Analyse bien la situation", ding: "prout-long",
					body: [
						"A cet instant, je n'ai pas identifié de mirage ascien porteur d'un alambic éthéré.",
						"Laisse les mirages asciens sans alambic éthéré traverser tranquillement ton cyberespace "
					]
				})
				break;
			case 299:
				displayInfo({
					titre: "Analyse bien la situation", ding: "prout-long",
					body: [
						"Mon coffre à Alambic éthéré est plein, je ne peux plus récuperer d'alambic éthéré.",
						"N'oublie pas que tu peux récupérer un révélateur en me demanant d'utiliser un alambic éthéré."
					]
				})
				break;
		}
	}
	function voleurDisplay(ev) {
		displayInfo({
			titre: "Analyse bien la situation",
			img: URLPNJS+CONFIG.VOLEURS[etat.voleurIdx]+".png",
			imgClass: "img50",
			body: [
				"Voici l'aspect du mirage ascien que j'ai identifié"
			],
			autoClose: 5
		})
	}
	///////////////////////
	// gestion des alambic 
	///////////////////////
	async function alambicClick() {
		let ret= await apiCall(APIROOT+"alambicGet","POST")
		// 200 Récupéré 400 Unsync
		dspAlambic = null
		switch(ret.status) {
			case 200: displayInfo({	body:["Tu as récupéré un révélateur"]}); break;
			case 201: displayInfo({	body:["Tu as récupéré des révélateurs"]}); break;
		}
	}

	///////////////////////
	// divers
	///////////////////////
	// fonction d'admin 
	async function admValidLivre(p) {
		if (!confirm("Valider le message du livre pour "+p+"?")) return
		let ret= await apiCall(APIROOT+"admValidLivre/"+p,"PATCH")
		calcResultats()
	}
	async function admResetPseudo() {
		let ret= await apiCall(APIROOT+"admResetPseudo","PATCH")
		// 200 Récupéré 400 Unsync
		// donc ne fait rien
	}
	function admFill(ev) {
		apiCall(APIROOT+"admFill/"+saisies.admFillIdx,'PATCH')
	}
	function admFillAll(ev) {
		apiCall(APIROOT+"admFillAll",'PATCH')
	}
	function admUnlock(ev) { 
		let idx = ev.currentTarget.getAttribute("gpIdx") 
		apiCall(APIROOT+"admUnlock/"+idx,'PATCH') 
	}
</script>

<style>
	/* #CA9956; F5DDB7 */
	.aveugle {font-size:0.8em}
	.excavation {font-size:0.8em }
	.imgTermine { xheight: 8em; xwidth: 100%; background-size: contain; background-repeat: no-repeat }
	.imgTermine { background-position: center }
	.imgTermine { background-image: url("https://cdn.adhoc.click/V10a/X-cherchezlelala/parchemin-texte.jpg") }
	.table { background-image: url("https://cdn.adhoc.click/V10a/X-cherchezlelala/parchemin-texte.jpg") }
	.table { background-color: transparent; background-repeat: no-repeat; background-position: center }
	.table { width: 100%; text-align:center; border-collapse: collapse; cursor: pointer }
	.proba1 {background-image: radial-gradient(transparent, transparent  5%,  grey 10%, orange 100%)}
	.proba2 {background-image: radial-gradient(transparent, transparent 12%,  grey 15%, orange 100%)}
	.proba3 {background-image: radial-gradient(transparent, transparent 14%,  grey 20%, orange 100%)}
	.proba4 {background-image: radial-gradient(transparent, transparent 16%,  grey 25%, orange 100%)}
	.proba5 {background-image: radial-gradient(transparent, transparent 18%,  grey 30%, orange 100%)}
	.proba6 {background-image: radial-gradient(transparent, transparent 20%,  grey 35%, orange 100%)}
	.proba7 {background-image: radial-gradient(transparent, transparent 22%,  grey 40%, orange 100%)}
	.proba8 {background-image: radial-gradient(transparent, transparent 24%,  grey 45%, orange 100%)}
	.proba9 {background-image: radial-gradient(transparent, transparent 26%,  grey 50%, orange 100%)}
	.proba10 {background-image: radial-gradient(transparent, transparent 28%, grey 55%, orange 100%)}
	.soluce {background-image: radial-gradient(transparent, transparent 28%, grey 55%, orange 100%)}
	.soluce {font-size:1em;}
	.imgPnj {
		height: auto; width: auto; max-height: 50vh; cursor:grab;
		position:absolute; background-image: radial-gradient(circle, rgb(0 249 255 / 70%) 19%, rgb(51 56 57 / 50%) 70%, transparent);
		filter: sepia(60%)
	}
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<div>
	{#if isAdmin(pseudo) && etat}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin: {pageDesc.n}/{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<input type="button" value="DELETEALL" onclick={() => { if (confirm("DELETEALL?")) { apiCall(APIROOT,"DELETE"); page=0 } } } />
				<input type="button" value="mirageClick" onclick={()=>voleurClick(null,true)} />
				<input type="button" value="alambicClick" onclick={()=>alambicClick(null,true)} />
				<input type="button" value="pseudoReset" onclick={()=>admResetPseudo(null,true)} />
				<input type="number" min=0 max=99 placeholder="admFill" bind:value={saisies.admFillIdx} />
				<input type="button" value="Fill" onclick={admFill} />
				<input type="button" value="FillALL" onclick={admFillAll} />
			</div>
		</div>
	{/if}
	{#if CONFIG && etat}
		{@const ep = etat.pseudos[pseudo]}
		<div>
			<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0}  />
			<input type="button" value="Résultats" onclick={calcResultats} />
			<Common t="headerPage" />
			<br/>
			<span class="gpHelp" onclick={()=>dspReglages = !dspReglages} >
				⚙️
			</span>
			<span class="gpHelp" onClick={markClick} gpHelp="Niveau de coopération, détermine le gain du jeu. Maximum 10.">
				💰?
			</span>
			<span onclick={markClick}	class={"gpHelp"}
				gpHelp="Nombre de révélateurs disponibles. Tu peux en utiliser sur le parchemin.">
				🧪{ep?.revelateurNb}
			</span>
			<span class={ (etat.alambicNb >= CONFIG.ALAMBICNBMAX) ? "gpHelp blinkFlag":"gpHelp"}
				onclick={()=>dspAlambic=true}>
					⚗️{etat.alambicNb}
			</span>
			<span class="gpHelp" onclick={()=>saisies.lunettes=!saisies.lunettes}>
				{#if saisies.lunettes}
					<span>
						🥽
					</span>
				{:else}
					<span class={ (etat.lalaTrouve && etat.alambicNb <= 0) ? "gpHelp blinkFlag":"gpHelp"}>
						👓
					</span>
				{/if}
			</span>
			{#if !voleurEcheance}
				<span onclick={voleurDisplay}>
					👻{CONFIG.VOLEURS[etat.voleurIdx]}
				</span>
			{:else}
				<span gpHelp="Tu ne peux pas encore tenter de toucher un mirage ascien" onclick={null}>
					👻<countdown dth={voleurEcheance} oncdTimeout={()=>voleurEcheance=0} />
				</span>
			{/if}
		</div>
	{/if}
	{#if epiqStep==0 && etat }
		{@const dthDebut = new Date(pageDesc.realStart)}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/grande-peluche-team.jpg"}
				style="width:30%; float:right; filter: sepia(60%);" alt="" />
			<div>
				{pseudo}, j'ai découvert un parchemin dans le grand Grimoire de la Magie.
				<div class="br"/>
				Il semble indiquer un lieu discret et éloigné de mon bureau. 
				Selon une rumeur Eorzéenne, c'est
				"Le Bureau de Blanche-Neige et les septs Lalas".
				<br/>
				Comme tu le sais, en ces temps troublés, disposer d'une base secrète est un avantage stratégique.
				<div class="br"/>
				Habituellement quand je lance déchiffrage sur un parchemin,
				cela rélève son contenu comme par exemple la localisation d'une carte aux trésors.
				<br/>
				Mais celui-ci reste recouvert de taches magiques et demeure illisible.
				<div class="br"/>
				Je pense que ce lieu discret sera l'endroit parfait de notre base secrète.
				Toute mon équipe, les peluches LogicServer, SyncServer, Hildiscord,
				Audioblaster, Metacache, CheckSec, DeepCheckSec et les autres,
				y trouveront un havre de paix.
			</div>
			<Btn bind:refStep={epiqStep} step=20 val="Dis m'en plus"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==20 && etat}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/lala.png"}
				style="width:30%; float:right; filter: sepia(60%);" alt="" />
			<div>
				Tu devras utiliser du révélateur🧪 pour faire disparaitre les taches.
				<br/>
				Je sais en crafter, mais cela nécessite une énorme quantité d'un
				médicament vendu par un Lala, dont j'ai oublié le nom.
			</div>
			<div class="br" />
			<div>
				Tu peux voir ci-contre le lala
				<span class="infoLink" gpHelp="Les vendeurs de potions se trouvent souvent dans les villes">
					vendeur de potion
				</span>.
			</div>
			{#if !etat.lalaTrouve}
				<div>Soit {G(pseudoGenre,"le premier","la première")} à m'indiquer son nom:</div>
				<div>Indice: {CONFIG.LALAPH}</div>
				<input bind:value={saisies.lalaNom} type="text" size={CONFIG.LALAPH.length+2}
					onkeyup={(e)=> e.key=='Enter' && reponseLala()}	/>
				<input type="button" value="➤" onclick={reponseLala} />
			{:else}
				<div class="adminCadre stars">
					{#if etat.lalaTrouve.pseudo==pseudo}Tu as {:else}{etat.lalaTrouve.pseudo} a {/if}
					 découvert son nom: {etat.lalaTrouve.nom} 
				</div>
				<Btn bind:refStep={epiqStep} step=30 val="Et maintenant ?" />
			{/if}
			<hr />
			<div class="info">
				Peu importe qui trouve le nom du lala en premier, cela dévérouillera
				la phase suivante du challenge pour tout le monde.
				<br/>
				➥ 1 point "Découverte du Lala" sera attribué à tous les connectés au moment de la découverte.
				<br/>
				➥ Tu peux cliquer sur "résultats" pour voir l'avancement de chacun.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==30 && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/grande-peluche-team.jpg"}
				style="width:50%; float:right; filter: sepia(60%);" alt="" />
			<div>
				J'ai acheté un grand stock de potions à {etat.lalaTrouve.nom}.
				<br/>
				Pour réaliser un craft de révélateurs🧪,
				je dois déposer les composants dans un alambic éthéré⚗️.
				<br/>
				Je ne dispose pas de tels alambics.
				<br/>
				Seul un mirage ascien peut facilement transformer
				mes innombrables alambics en des alambics éthérés.
			</div>
			<Btn bind:refStep={epiqStep} step=40 val="Un mirage ascien?"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==40 && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/grande-peluche-team.jpg"}
				style="width:50%; float:right; filter: sepia(60%);" alt="" />
			<div>
				Un mirage ascien est une créature prenant l'apparence d'un PNJ.
			</div>
			<div>
				Ils ne sont pas dangeureux. Ils sont capables de traverser le
				cyberespace et apparaître furtivement sur ton écran.
				<br/>
				Ils subtilisent parfois un de mes alambics et, à leur contact, 
				mon alambic se transforme en un alambic éthéré⚗️.
				<br/>
				Il te suffit alors de toucher un mirage ascien porteur d'un alambic éthéré pour que
				cet alambic éthéré se rematérialise dans mon laboratoire,
				me permettant alors de crafter un révélateur.
			</div>
			<Btn bind:refStep={epiqStep} step=50 val="Du craft en point-and-click!"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==50 && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/grande-peluche-team.jpg"}
				style="width:50%; float:right; filter: sepia(60%);" alt="" />
			<div>
				Oui, il faut que tu joues à Point & Click Mirages Asciens!
				<div class="br"/>
				Les mirages asciens sont normalement invisibles, mais ils peuvent être visibles
				si tu t'équipes de tes
				<span class="infoLink" onclick={markClick} gpHelp="Pour t'équiper de tes lunettes mirage, clique sur 👓">
					lunettes mirage
				</span>,
				tu pourras alors voir un mirage ascien lorsqu'il stationne
				quelques secondes dans ton cyberespace.
			</div>
			<Btn bind:refStep={epiqStep} step=60 val="C'est facile!"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	
	{#if epiqStep==60 && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/grande-peluche-team.jpg"}
				style="width:30%; float:right; filter: sepia(60%);" alt="" />
			<div>
				Ce n'est pas aussi facile que ca, car tout dépendra d'un subtil équilibre entre
				les actions de tous. Tu peux examiner l'avancement de chacun et l'équilibrage
				à tout instant en cliquant sur "résultats".
			</div>
			<div>Je te laisse découvrir les autres mécaniques...</div>
			<div class="info">
				<div>👉Ce challenge est infaisable en solo: il faut collaborer en temps-réel et à plusieurs.</div>
				<div>👉La clef du succès est d'équilibrer les actions de chacun.</div>
				<div>👉Partage ta stratégie et rejoint le Discord vocal si possible.</div>
			</div>
			<div class="br" />
			<Btn bind:refStep={epiqStep} step=90 val="Montre moi le parchemin"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat && !etat.challengeTermine}
		<div class="papier" use:scrollPageToTop>
			<div class="parchemin-vertical" style="position: relative" >
				{#if saisies.lunettes}
					<img role="button" onclick={voleurClick} src={URLPNJS+CONFIG.VOLEURS[voleurIdx]+".png"} alt="" 
						class="imgPnj" style={voleurPosStyle} />
				{/if}
				<div>
					<table class="table">
					<tbody class="tbody">
						{#each Array(CONFIG.NBL) as _,l }
							<tr>
								{#each Array(CONFIG.NBC) as _,c }
									{@const idx=l*CONFIG.NBC+c}
									{@const slot=etat.slots[idx]}
									{@const ep = etat.pseudos[pseudo]}
									{@const cls = (slot.solucePseudo && 'soluce')  || 'proba'+slot.proba}
									<td class={cls} style="width: 33%; height: 3em" gpIdx={idx} onclick={slotClick}>
											{#if saisies.debug}
												<div style="font-size: 0.5em; position: absolute">
													<div style="position: relative; top: 0; left: 0">
														{slot.proba}/{CONFIG.PROBA}
													</div>
												</div>
											{/if}
											{#if slot.solucePseudo}
												<div class="petit">{slot.solucePseudo}</div>
											{:else if slot.unlockEcheance > Date.now()+getEpsilon()}
												{#if slot.unlockPseudo==pseudo}
													<div class="excavation blinkFlag">
														❌
														<countdown dth={slot.unlockEcheance+getEpsilon()} gpIdx={idx} oncdTimeout={slotResetUnlockEcheance} use:countDownInit />
													</div>
												{:else if slot.unlockPseudo}
													<div class="excavation blinkFlag">
														⏱️
														<countdown dth={slot.unlockEcheance+getEpsilon()} gpIdx={idx} oncdTimeout={slotResetUnlockEcheance} use:countDownInit />
													</div>
												{/if}
											{:else if ep.revelateurNb}
												{#if slot.proba<CONFIG.PROBA}
													{#if slot.revelateurPseudo!=pseudo}
														<div>🧪</div>
													{:else}
														<div>❌</div>
													{/if}
												{:else}
													<div>⏳</div>
												{/if}
											{:else}
												<div>📵</div>
											{/if}
									</td> 
								{/each}
							</tr>
						{/each}
					</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
	
	{#if epiqStep==90 && etat && etat.challengeTermine}
		<div class="papier" use:scrollPageToTop>
			<div class="parchemin-vertical" style="position: relative" >
				<div style="text-align: left">
					La Grande Peluche a lu le parchemin, tu peux en voir une copie ci-dessous.
					<div class="cGreen">
						➥Indique le lieu aux autres si tu le découvres en premier.
					</div>
					<div class="cGreen">
						➥Laisse un message sur le Livre de Correspondance de la Base Secrète
						pour valider l'étape finale
					</div>
					<input type="button" value='Revoir la vidéo' onclick={()=> playVideo(VIDEOLIEUSECRET)} />
					<Btn bind:refStep={epiqStep} step=95 val="J'ai laissé un message"/>
				</div>
				<div class="imgTermine">
					<br/>
					<br/>
					<br/>
					<br/>
					<br/>
					<br/>
					<br/>
				</div>																	 
			</div>
		</div>
	{/if}

	{#if epiqStep==95 && etat}
		<div class="papier" use:scrollPageToTop>
			<div class="parchemin-vertical" style="position: relative" >
				<div>
					Bravo, tu as terminé ce challenge, tu peux en regarder les résultats actuels
					en cliquant sur "Résultat".
				</div>
				<div style="text-align: left">
					<input type="button" value='Revoir la vidéo' onclick={()=> playVideo(VIDEOLIEUSECRET)} />
					<Btn bind:refStep={epiqStep} step=90 val="Revoir le Parchemin"/>
				</div>
			</div>
		</div>
	{/if}

	{#if dspAlambic}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspAlambic=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						{#if etat.alambicNb > 0}
							<img class="img25" style="float:right" src={urlCdn+"X-cherchezlelala/alambic-anim.gif"} alt=""/>
							{#if etat.alambicNb >= CONFIG.ALAMBICNBMAX}
								<div class="blinkMsg">
									Mon coffre déborde, il est urgent d'utiliser un alambic éthéré.
								</div>
							{:else}
								<div>Alambics éthérés disponibles: {etat.alambicNb}</div>
							{/if}
							<hr/>
							{#if etat.alambicPseudo == pseudo}
								Tes mains sont terriblement éthérés du fait de la manipulation récente de révélateur.
								<br/>
								Passe ton tour!
							{:else if etat.pseudos[pseudo].revelateurNb >= CONFIG.REVELATEURNBMAX}
								Tu as déjà {etat.pseudos[pseudo].revelateurNb} révélateurs.
								<br/>
								Passe ton tour!
							{:else}
								Souhaites-tu que j'utilise un alambic éthéré pour te crafter du révélateur?
								<br/>
								<input type="button" value="oui" onclick={alambicClick}/>
								<input type="button" value="non" onclick={()=>dspAlambic=null}/>
							{/if}
						{:else}
							<img class="img25" style="float:right; filter:  blur(5px); " src={urlCdn+"X-cherchezlelala/alambic-anim.gif"} alt=""/>
							Aucun alambic éthéré n'est disponible.
							<hr/>
							Touche des mirages asciens pour me permettre d'obtenir des alambics éthérés.
						{/if}
						<hr/>
						<div class="petit">
							⚠️Un alambic éthéré est instable et se vaporise de temps en temps.
							<br/>
							⚠️Le niveau de coopération augmente selon le nombre de personnes
							ayant utilisé un alambic éthéré, ne joue pas perso.
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	{#if dspEnigme}
		{@const slot = etat.slots[dspEnigme.idx]}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspEnigme=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Il est nécessaire de rapidement FIXER cette partie de parchemin.
						Elle nécessite une déclinaison de fixateur spécifique.
						<hr/>
						{#if slot.unlockPseudo==pseudo}
							Tu as révélé cette partie du parchemin,
							Tu ne peux la fixer toi-même.
						{:else}
							Lieu: {slot.enigme?.l}
							<hr/>
							{slot.enigme?.q}
							<br/>
							Indice:
							{slot.enigme?.ph}
							<br/>
							<input bind:value={saisies.reponseEnigme} type="text" size={slot.enigme?.ph?.length}
								onkeyup={(e)=> e.key=='Enter' && slotReponseEnigme()}	/>
							<input type="button" value="➤" onclick={slotReponseEnigme} />
						{/if}
					</div>
					<hr/>
					<div class="petit">
						La solution se trouvent souvent dans un livre de correspondance.
						<br/>
						Reste: <countdown dth={slot.unlockEcheance+getEpsilon()} oncdTimeout={()=>dspEnigme=null} />
						<br/>
						Révélé par {slot.unlockPseudo}.
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspReglages}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspReglages=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					Paramétrage:
					<div class="petit">ces paramètres sont inconnus des autres</div>
					<hr/>
					Mirages asciens
					<select bind:value={saisies.vitesse}>
						<option value="1">Vitesse Roxxor (1s)</option>
						<option value="1.7">Vitesse Pépère (1.7s)</option>
						<option value="3">Vitesse Noob (3s)</option>
					</select>
					<hr/>
					<div><label><input type="checkbox" bind:checked={saisies.debug} />Afficher Progression</label></div>
				</div>
			</div>
		</div>
	{/if}
	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div class="petit">
						<table><tbody>
							<tr style="cursor: pointer">
								<td gpHelp="Vert: Eligible - Rouge: Pas encore éligible. Les gains peuvent évoluer.">Pseudo/💰</td>
								<td gpHelp="Présence lors de la découverte du Lala">🙂</td>
								<td gpHelp="Identification d'au moins un mirage ascien">👻</td>
								<td gpHelp="Usage d'au moins un alambic">⚗️</td>
								<td gpHelp="Usage d'au moins un révélateur">🧪</td>
								<td gpHelp="Dévérouillage d'au moins une partie du parchemin">🔓</td>
								<td gpHelp="Découverte d'au moins un élément manquant d'une partie du parchemin">🪄</td>
								<td gpHelp="Livre de la base secrète (sera validée manuellement)">🏠</td>
								{#if isAdmin(pseudo)}
									<td gpHelp="Count+Clic pour valider le livre du pseudo">R</td>
								{/if}
									<td>&nbsp;</td>
							</tr>
							{#each dspResultats.tblPseudos as p}
								{@const rp = dspResultats.pseudos[p]}
								{@const pct = rp.pt/dspResultats.ptTotal}
								{@const gil = Math.floor(10*dspResultats.cagnotte*pct)/10}
								<tr>
									<td class={rp.cls}>
										{p}
										<br/>
										{gil && gil.toFixed(1) || 0}M<sup>{Math.floor(100*pct) || 0}%</sup>
									</td>
									<td>{rp.flagLala && "✅"}</td>
									<td>{rp.flagVol && "✅"}</td>
									<td>{rp.flagAla && "✅"}</td>
									<td>{rp.flagUp && "✅"}</td>
									<td>{rp.flagUnl && "✅"}</td>
									<td>{rp.flagSol && "✅"}</td>
									<td>{rp.flagLivre && "✅" || "❓"}</td>
									{#if isAdmin(pseudo)}
										<td style="cursor:pointer" onclick={()=>admValidLivre(p)}>{rp.cnt}</td>
									{/if}
									<td>&nbsp;</td>
								</tr>
							{/each}
						</tbody></table>
						<hr/>
						<div>Cagnotte: {dspResultats.cagnotte}M ({dspResultats.eligibleNb} eligibles)</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
<!-- P404.svelte --> 

