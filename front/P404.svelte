<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, urlCdnAI, apiCall, apiCallExtern, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownInit, jjmmhhmmss, getEpsilon, checkTemplate
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
	async function init() { await getConfig(); getEtat() }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op==WSETAT && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		s.debug ??= false
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		epiqStepChangeDth=Date.now()
		if (newStep==95 && !saisies.videoSlotsTermine) {
			saisies.videoSlotsTermine=true // marque Video affichée
			playVideo(VIDEOLIEUSECRET)
		}
	}

	// etat du challenge
	let CONFIG = $state(null)
	let etat = $state(null)
	let dspResultats = $state(null)
	let dspEnigme = $state(null)
	
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
	function calcEtat() {
		// Si popup de résolution, et resolu ou reset, ferme le popup
		if (dspEnigme) {
			if (etat.slots[dspEnigme.idx].solucePseudo)
				dspEnigme=null
			else if (!etat.slots[dspEnigme.idx].unlockPseudo)
				dspEnigme=null
		}
		// slots termine ?
		let nbSlotsTermine = 0
		etat.slots.forEach( (s)=> {if (s.solucePseudo) nbSlotsTermine++} )
		etat.slotsTermine = nbSlotsTermine >= 1 // CONFIG.NBL*CONFIG.NBC
		// Si termine et pas videovu, bascule step 95
		if (etat.slotsTermine && epiqStep==90 && !saisies.videoSlotsTermine)
			epiqStep=95
	}
	function calcResultats() {
		if (!etat) return
		// dspResultats = tDspResultats 
	}
	// réponse à l'énigme du nom du lala
	function reponseLala(ev) {
		if (!checkTemplate(saisies.lalaNom,CONFIG.LALAPH)) {
			displayInfo({titre:"Proposition invalide", ding: 'prout-long',
									 body:["Ta réponse doit être selon le format:",CONFIG.LALAPH]})
		}
		else {
			apiCall(APIROOT+"nomLala/",'POST',{reponse:saisies.lalaNom})
			saisies.reponseLala = null
		}
	}
	// clic sur un slot de la carte
	function clicSlot(ev) {
		let idx = ev.currentTarget.getAttribute("gpIdx")
		let slot =  etat.slots[idx]
		let ep = etat.pseudos[pseudo]
		// console.log("clicCase",ev,idx,slot,ep)
		if (slot.solucePseudo) {
			addNotification(slot.solucePseudo+" a déjà résolu cette énigme","orange",10,'prout-long')
		}
		else if (slot.unlockPseudo) {
			// le slot est unlock par un pseudo 
			if (slot.unlockPseudo != pseudo) {
				// slot dispo et unlock par un autre, affiche l'énigme
				dspEnigme = { idx: idx, slot: slot, ep: ep }
			}
			else {
				displayInfo({titre:"Tu as découvert cette énigme.",
										 body: ["Tu es tellement aveuglé par ta découverte que tu ne peux en voir l'énigme.",
														"Demande à un ou une autre de la résoudre."
													 ],
										 ding: 'prout-long'
										})
			}
		}
		else if (slot.proba < CONFIG.PROBA) {
			// Utilisation d'une detachant
			if (ep.detachantNb>0)
				apiCall(APIROOT+"detachantUtilise/"+idx,'POST')
			else
				addNotification("Tu n'as pas de detachant disponible","orange",10,'prout-long')
		}
		else {
			// status non cohérent
			addNotification("Erreur de logique, etat du slot incohérent","red",10,'prout-long')
		}
		// la modif se fera via le WS 
	}
	function detachantAdd() {
		let e = etat.pseudos[pseudo]
		e.detachantDthEcheance = null // pour invalider le timer 
		apiCall(APIROOT+"detachantAdd",'POST') // maj par le WS
	}
	function resetUnlockEcheance(ev) {
		let idx = ev.currentTarget.getAttribute("gpIdx")
		// reset le slot de découverte, pas de maj server, sera recalculé quand intéraction
		etat.slots[idx].unlockPseudo = null
		etat.slots[idx].unlockEcheance = null
		etat.slots[idx].proba = 1
		etat.slots[idx].enigme = null
		// si dspEnigme affichée, reset
		if (dspEnigme && dspEnigme.idx==idx) dspEnigme=null
	}
	// réponse à l'énigme indiqué dans dspEnigme
	function reponseEnigme() {
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
	// fonction d'admin
	function admFill(ev) {
		apiCall(APIROOT+"admFill/",'PATCH')
	}
	function admMove(ev) { 
		let idx = ev.currentTarget.getAttribute("gpIdx") 
		apiCall(APIROOT+"admMove/"+idx,'PATCH') 
	}
</script>

<style>
	.aveugle {font-size:0.8em}
	.excavation {font-size:0.8em }
	.soluce {font-size:0.5em}
	
	.proba1  {background-image: radial-gradient(orange, orange 10%, green 20%, transparent 30%)} 
	.proba2  {background-image: radial-gradient(orange, orange 20%, green 30%, transparent 40%)}
	.proba3  {background-image: radial-gradient(orange, orange 30%, green 40%, transparent 50%)}
	.proba4  {background-image: radial-gradient(orange, orange 40%, green 50%, transparent 60%)}
	.proba5  {background-image: radial-gradient(orange, orange 50%, green 60%, transparent 70%)}
	.proba6  {background-image: radial-gradient(white, white 20%, orange 50%, green 60%, transparent 70%)}
	.proba7  {background-image: radial-gradient(white, white 40%, orange 50%, green 60%, transparent 70%)}
	.proba8  {background-image: radial-gradient(white, white 50%, orange 50%, green 60%, transparent 70%)}
	.proba9  {background-image: radial-gradient(white, white 60%, orange 50%, green 60%, transparent 70%)}
	.proba10 {background-image: radial-gradient(white, white 60%, orange 50%, green 60%, transparent 70%)}
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
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
				<input type="button" value="Fill" onclick={admFill} />
				<input type="button" value="ResetVideo" onclick={()=>saisies.videoSlotsTermine=false} />

				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}
	{#if CONFIG && etat}
		{@const ep = etat.pseudos[pseudo]}
		<div>
			<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0}  />
			<input type="button" value="Résultats" onclick={calcResultats} />
			<span style="width:5.5em; display: inline-block">
				{#if ep?.detachantNb}
					<span onclick={markClick}	class={"gpHelp"}
						gpHelp="Nombre de révélateurs disponibles. Tu peux l'utiliser sur le parchemin.">
						🧪{ep.detachantNb}
					</span>
				{:else if ep?.detachantEcheance}
					<span onclick={markClick}	class={"gpHelp"}
						gpHelp="Délai avant d'obtenir un nouveau révélateur">
						🧪<countdown dth={ep.detachantEcheance+getEpsilon()} oncdTimeout={detachantAdd} />
					</span>
				{:else}
					<span>🧪calcul..</span>
				{/if}
			</span>
			<Common t="headerPage" pageDesc={pageDesc} />
		</div>
	{/if}
	{#if epiqStep==0 && etat }
		{@const dthDebut = new Date(pageDesc.realStart)}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-ventesPrivees/gamemaster.jpg"} style="width:30%; float:right" alt="" />
			<div>
				{pseudo}, j'ai découvert un parchemin dans le grand Grimoire de la Magie.
				<div class="br"/>
				Il semble indiquer un lieu discret et éloigné de mon bureau appelé
				"Blanche-Neige et les septs lalas".
				<br/>
				Comme tu le sais, en ces temps troublés, disposer d'une base secrète est un avantage stratégique.
				<div class="br"/>
				Habituellement quand je lance déchiffrage sur un parchemin,
				cela rélève son contenu comme par exemple la localisation d'une carte aux trésors.
				<br/>
				Mais celui-ci reste recouvert de taches magiques et demeure illisible.
				<div class="br"/>
				Je pense que ce lieu discret sera l'endroit parfait de notre base secrète.
				Toute mon équipe, Hildiscord, Audioblaster, Metacache, CheckSec, DeepCheckSec et les autres,
				y trouveront un havre de paix.
			</div>
			<Btn bind:refStep={epiqStep} step=10 val="Dis m'en plus"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==10 && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/grande-peluche-team.jpg"}
				style="width:40%; float:right; filter: sepia(60%);" alt="" />
			<div class="br" />
			<div>Tu peux voir ci-contre le croquis de cette base telle que je l'imagine</div>
			<div class="br" />
			<div>Je compte sur toi pour révéler la carte dissimulée dans ce parchemin.</div>
			<div>Pour cela tu devras utiliser du révélateur(🧪) pour faire disparaitre les taches.</div>
			<div class="br" />
			<div>
				Je sais synthétiser du révélateur, mais cela nécessite du temps et une énorme quantité d'un
				médicament vendu par un lala, dont j'ai oublié le nom.
			</div>
			<div class="br" />
			<div>Veux-tu chercher le lala pour moi?</div>
			<Btn bind:refStep={epiqStep} step=20 val="Compte sur moi"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==20 && etat}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/lala.png"}
				style="width:40%; float:right; filter: sepia(60%);" alt="" />
			<div>
				Tu peux voir ci-contre le lala vendeur de potion<sup>(ℹ)</sup>.
			</div>
			{#if !etat.lalaTrouve}
				<div>Soit {G(pseudoGenre,"le premier","la première")} à m'indiquer son nom:<sup>(ℹℹ)</sup></div>
				<div>Indice: {CONFIG.LALAPH}</div>
				<input bind:value={saisies.lalaNom} type="text" size={CONFIG.LALAPH.length+2}
					onkeyup={(e)=> e.key=='Enter' && reponseLala()}	/>
				<input type="button" value="➤" onclick={reponseLala} />
				<hr />
				<div class="info">
					(ℹ) Lors des challenges, tu peux utiliser le lodestone ou des outils comme
					<a href="https://www.garlandtools.org/db/#item/4551" target="gpHelp">Garlandtools</a>.
					Cela peut rendre élémentaire une question qui semble compliquée.
					<br/>
					(ℹℹ) Cela dévérouillera la phase suivante du challenge pour tout le monde.
				</div>
			{:else}
				<div class="adminCadre stars">
					{#if etat.lalaTrouve.pseudo==pseudo}Tu as {:else}{etat.lalaTrouve.pseudo} a {/if}
					 découvert son nom: {etat.lalaTrouve.nom} 
				</div>
				<Btn bind:refStep={epiqStep} step=30 val="Et maintenant ?" />
			{/if}
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==30 && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/grande-peluche-team.jpg"}
				style="width:40%; float:right; filter: sepia(60%);" alt="" />
			<div>
				J'ai acheté un grand stock de potion à {etat.lalaTrouve.nom},
				je peux donc crafter les révélateurs(🧪) dont nous allons avoir besoin.
			</div>
			<div>Maintenant, je compte sur toi pour révéler la carte dissimulée.</div>
			<div class="info">
				<div>👉Ce challenge est infaisable en solo, il faut collaborer en temps-réel.</div>
				<div>👉Plus il y a de participants connectés, plus ce sera simple et rapide.</div>
				<div>👉Rejoignez le Discord vocal et partagez une stratégie.</div>
			</div>
			<div>Je te laisse découvrir les autres mécaniques...</div>
			<div class="br" />
			<Btn bind:refStep={epiqStep} step=90 val="Montre moi le parchemin"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==60 && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-cherchezlelala/grande-peluche-team.jpg"}
				style="width:40%; float:right; filter: sepia(60%);" alt="" />
			<div class="br" />
			<div>Tu peux voir ci-contre le croquis de cette base telle que je l'imagine</div>
			<div class="br" />
			<div>Je compte sur toi pour révéler la carte dissimulée.</div>
			<div class="br" />
			<div>Voici quelques éléments de mécaniques de ce challenge:</div>
			<div class="petit">
				<div>👉Tu devras utiliser du révélateur(🧪) pour faire disparaitre les taches.</div>
				<div>👉Lorsqu'un morceau de parchemin est visible, il faut répondre à l'énigme rapidement sinon les taches réapparaissent.</div>
				<div>👉Ce challenge est infaisable en solo, il faut collaborer en temps-réel. Plus il y a de participants connectés, plus ce sera simple et rapide.</div>
				<div>👉La phase finale nécessitera de vous retrouvez le plus nombreux possible dans la base secrète.</div>
			</div>
			<div>Je te laisse découvrir les autres mécaniques et... le parchemin.</div>
			<div class="br" />
			<Btn bind:refStep={epiqStep} step=90 val="Compte sur moi"/>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div class="papier" use:scrollPageToTop>
			<div class="parchemin-vertical">
				<table style="width: 100%; text-align:center; border-collapse: collapse; cursor: pointer">
					<tbody>
						{#each Array(CONFIG.NBL) as _,l }
							<tr>
								{#each Array(CONFIG.NBC) as _,c }
									{@const idx=l*CONFIG.NBC+c}
									{@const slot=etat.slots[idx]}
									{@const ep = etat.pseudos[pseudo]}
									<td class={'proba'+slot.proba} style="width: 33%; height: 3em" gpIdx={idx} onclick={clicSlot}>
											{#if saisies.debug}
												<div style="font-size: 0.5em; position: absolute">
													<div style="position: relative; top: 0; left: 0">{l}-{c}</div>
												</div>
											{/if}
											{#if slot.solucePseudo}
												<div class="soluce">{slot.solucePseudo}</div>
											{:else if slot.proba<CONFIG.PROBA}
												{#if ep.detachantNb}
													<div>🧪</div>
												{:else}
													<div>⏳</div>
												{/if}
											{:else if slot.unlockEcheance && slot.unlockPseudo!=pseudo}
												<div class="excavation blinkFlag">
													Excavation!
													<br/>
													<countdown dth={slot.unlockEcheance} gpIdx={idx} oncdTimeout={resetUnlockEcheance} use:countDownInit />
												</div>
											{:else if slot.unlockEcheance}
												<div class="aveugle">
													Aveuglé!
													<br/>
													<countdown dth={slot.unlockEcheance} gpIdx={idx} oncdTimeout={resetUnlockEcheance} use:countDownInit />
												</div>
											{:else}
												<div>...</div>
											{/if}
										{#if isAdmin(pseudo) && saisies.debug}
											<div class="adminCadre" style="font-size:0.5em">
												Admin: {slot.proba}/{CONFIG.PROBA}
												<input type="button" value="Change" gpIdx={idx} onclick={admMove} />
											</div>
										{/if}
									</td> 
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
	
	{#if epiqStep==95 }
		<div class="papier" use:scrollPageToTop>
			<input type="button" value="Revoir la vidéo" onclick={()=> playVideo(VIDEOLIEUSECRET)}/>
				<div>👉La phase finale nécessitera de vous retrouvez le plus nombreux possible dans la base secrète.</div>
			indiquer textuel de l'enigme finale
			Afichage video - découverte du lieu
		</div>
	{/if}

	{#if dspEnigme}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspEnigme=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						{dspEnigme.slot.enigme.q}
						<br/>
						Indice:
						<br/>
						{dspEnigme.slot.enigme.ph}
						<br/>
						<input bind:value={saisies.reponseEnigme} type="text" size={dspEnigme.slot.enigme.ph?.length}
							onkeyup={(e)=> e.key=='Enter' && reponseEnigme()}	/>
						<input type="button" value="➤" onclick={reponseEnigme} />
					</div>
					<hr/>
					<div class="petit">
						Révélé par {dspEnigme.slot.unlockPseudo}.
						<br/>
						Reste: <countdown dth={dspEnigme.slot.unlockEcheance} />
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					A FAIRE 
				</div>
			</div>
		</div>
	{/if}
</div>
<!-- P404.svelte --> 

