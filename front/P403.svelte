<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, urlCdnSTATIC, urlCdnAI, apiCall, apiCallExtern, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownInit, jjhhmm, jjmmhhmmss, checkTemplate, getEpsilon
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
		page = $bindable(0),
		pageDone = $bindable([]),
	} = $props();

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()
	const WSETAT = (()=>pageDesc.rootName+'.etat')()
	const APICONFIG = APIROOT+'config'
	const APIETAT = APIROOT+'etat'
	const APIREPONSE = APIROOT+'reponse'
	const APIUNLOCK = APIROOT+'adminUnlock/'

	
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
		s.reponses ??= []
		s.nextReponseDth ??= 0
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}

	// etat du challenge 
	let CONFIG = $state(null)
	let etat = $state(null)
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
		// console.log("*********************calcEtat") 
		const now = Date.now()
		etat.challengeTermine = CONFIG.QUESTIONSNB == etat.etapes.reduce ( (a,c) => (c.gagnant)? a+1 : a , 0)
		etat.malus = etat.etapes.reduce ( (a,c) => (c.gagnant?.p==pseudo)? a+1 : a , 0)
		etat.malusDelai = etat.malus*CONFIG.MALUSDELAI
		etat.etapes.forEach ( (e)=> {
			e.malusEcheance = e.dth+etat.malusDelai+getEpsilon()
			if (e.malusEcheance <= now) e.malusEcheance = 0
		} )
	}
	async function reponse(i) {
		// alert("reponse:"+i+"Val="+saisies.reponses[i])
		// evite le click vide 
		// vérification des caractères spéciaux (blanc,point,virgule,slash)
		if (!checkTemplate(saisies.reponses[i],etat.etapes[i].ph))
			return displayInfo({titre:"Mauvais format de réponse", 
													body:["Ta réponse doit être comme ci-dessous:",
																etat.etapes[i].noph || etat.etapes[i].ph],
													img: "commons/Human_brainstem2.gif",
													ding: 'prout-long', back:'papier'})
		saisies.nextReponseDth = Date.now() + CONFIG.REPONSEDELAI
		let ret = await apiCall(APIREPONSE+"/"+i,"POST",{ reponse: saisies.reponses[i] })
		switch(ret.status) {
			case 200: // Bonne réponse
				playVideo("hildiscord-bravo")
				break;
			case 202: // Mauvaise réponse
				playVideo("hildiscord-non")
				break;
		}
	}
	async function resetReponseDth() {
		// alert("resetReponseDth")
		saisies.nextReponseDth = 0
	}
	
	let dspResultats = $state(null)
	function calcResultats() {
		if (!etat) return
		let tDspResultats = { globalGils: 0, totalGils: 0, pseudos: [] }
		etat.etapes.forEach( (e) => {
			tDspResultats.globalGils += e.gils
			if (e.gagnant) {
				tDspResultats.pseudos[e.gagnant.p] ??= { gils: 0 }
				tDspResultats.pseudos[e.gagnant.p].gils += e.gils
				tDspResultats.totalGils += e.gils
			}
		})
		dspResultats = tDspResultats
	}
	function adminUnlock(e) {
		let i = parseInt(e.target.getAttribute("gpIdx"),10)
		apiCall(APIUNLOCK+i,'PATCH')
	}
</script>

<style>
	
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
				<input type="button" value="DELETEALL" onclick={async () => { if (confirm("tout supprimer?")) { await apiCall(APIROOT,"DELETE"); page=0 }}} />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}
	{#if CONFIG && etat}
		<div>
			<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0}  />
			<input type="button" value="Résultats" onclick={calcResultats} />
			<label class="petit"><input type="checkbox" bind:checked={saisies.afficherTout} />Voir tout</label>
		</div>
	{/if}
	{#if epiqStep==0 && CONFIG && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-ventesPrivees/gamemaster.jpg"} style="width:30%; float:right" alt="" />
			<div>{pseudo}, prépare-toi à ce nouveau mini-jeu.</div>
			<div class="br"/>
			<div>
				Mon assistant Hildiscord va publier
				{CONFIG.QUESTIONSNB} questions sur Discord
				à partir du {jjmmhhmmss(CONFIG.TIPDTH[0],true)}.
				Elles seront toutes publiées dans le canal "Prélude à la Rapidité" entre 19h et 21h (heure de paris)
				à raison de quelques-unes par jour.
			</div>
			<div>
				Les questions sont de diverses natures, les réponses se trouvent In Game ou ailleurs...
			</div>
			<div>
				Si tu es {G(pseudoGenre,"le","la")} plus rapide à répondre à une question,
				tu gagnes entre 1 et 4 millions de Gils selon la question.
			</div>
			<div>
				Et tu peux tenter d'être {G(pseudoGenre,"le","la")} plus rapide à répondre à toutes les questions!
			</div>
			<Btn bind:refStep={epiqStep} step=10 val="Dis m'en plus" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==10 && CONFIG && etat }
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-ventesPrivees/gamemaster.jpg"} style="width:30%; float:right" alt="" />
			<div>
				A chaque notification d'Hildiscord,
				tu devras trouver la réponse le plus vite possible et l'indiquer ici, sur le site.
				<br/>
				Certaines sont très simples, d'autres plus compliquées.
				Les deux premières sont des tutos d'utilisation du site.
				<br/>
				Pour être dans les meilleurs conditions pour ce challenge:
				<br/>
				👉Vérifie que tes notifications sont activées pour le Discord des Kiki's Events.
				<br/>
				👉N'hésite pas à devenir {G(pseudoGenre,"ami","amie")} IG avec Kikiadoc Lepetiot @Moogle pour faciliter tes téléportations.
			</div>	
			<Btn bind:refStep={epiqStep} step=90 val="Je suis prêt{G(pseudoGenre,"","e")}"
				ifFct={()=>apiCall("/clientConfig/confirmations/"+pageDesc.n,'POST') && true} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div use:scrollPageToTop>
			<div class="br"/>
			{#each etat.etapes as e,i}
				<div class="papier">
					{#if e.q}
						{#if e.gagnant}
							{#if !etat.etapes[i+1]?.gagnant || saisies.afficherTout}
								<div class="petit" style="color: lightgray; border: 2px solid white">
									✅{e.q}
									<div style="font-style: italic">
										{jjmmhhmmss(e.gagnant.dth)}, {e.gagnant.p} a répondu "{e.gagnant.r.toLowerCase()}" 
									</div>
									<div>{e.c}</div>
								</div>
							{/if}
						{:else}
							<div style="background-color: green; border: 2px solid white">
								<div>{e.q}</div>
								<div class="info">
									{#if e.screens}
										<div>
											{#each e.screens as s}
												<span class="blinkFlag" gpImg={s.img} gpImgClass="img100" onclick={markClick}>
													<input type="button" value={s.t} />
												</span>
											{/each}
										</div>
									{/if}
									{#if e.audios}
										<div>
											{#each e.audios as a}
												<span class="blinkFlag">
													<input type="button" value={a.t} onclick={()=>{GBLSTATE.audioAmbiance=true; playMusic(a.mp3)}} />
												</span>
											{/each}
										</div>
									{/if}
									{#if e.videos}
										<div>
											{#each e.videos as v}
												<span class="blinkFlag">
													<input type="button" value={v.t} onclick={()=>{playVideo(v.mp4)}} />
												</span>
											{/each}
										</div>
									{/if}
									{e.site}
									{#each e.urls as u}
										<a target="gpHelp" href={u.u}>{u.t}</a>
									{/each}
								</div>
								<div class="gpHelp" gpHelp="Format de la réponse à respecter. C'est très important pour que ta réponse soit acceptable" onclick={markClick}>
									ℹ️{e.noph || e.ph}
								</div>
								{#if Date.now() < e.malusEcheance }
									<div style="cursor: help; color:red" onclick={markClick}
										gpHelp="Tu as dejà répondu à des questions ({etat.malus}), tu as un handicap pour proposer une réponse">
										⏳<countdown dth={e.malusEcheance} oncdTimeout={calcEtat} /> (handicap)
									</div>
								{:else if Date.now() < saisies.nextReponseDth }
									<div style="cursor: help; color:red" onclick={markClick}
										gpHelp="Temps restant avant de pouvoir proposer une nouvelle réponse">
										⏳<countdown dth={saisies.nextReponseDth} oncdTimeout={resetReponseDth} />
									</div>
								{:else}
									<div>
										👉
										<input bind:value={saisies.reponses[i]} type="text" size={e.ph.length} placeholder="réponse" gpIdx={i}
											onkeydown={(e) => e.key=="Enter" && reponse(i)} />
										<input type="button" value="➤" gpIdx={i} onclick={()=>reponse(i)}/>
									</div>
								{/if}
							</div>
						{/if}
					{:else if (i==0 && !e.dth) || (i>0 && etat.etapes[i-1].dth) || saisies.afficherTout}
						<div class="petit" style="color: red; border: 2px solid white">
							<img src={urlCdnSTATIC+"delai-anim.gif"} style="float:left; width: 5em" alt="" />
							Pas de panique,
							<br/>
							Hildiscord n'a pas encore annoncé la question ({i+1}/{etat.etapes.length})
							<br/>
							Elle sera divulguée sur Discord et apparaitra ici entre
							{jjmmhhmmss(CONFIG.TIPDTH[i])} et {jjmmhhmmss(CONFIG.TIPDTH[i]+3600000)}
							{#if isAdmin(pseudo)}
								<br/><input type="button" value="ADMIN UNLOCK {i}" gpIdx={i} onclick={adminUnlock} />
							{/if}
							<div style="clear: both;" />
						</div>
					{/if}
				</div>
			{/each}
			{#if etat.challengeTermine}
				<div class="blinkMsg">Le challenge est terminé</div>
			{/if}
		</div>
	{/if}

	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					💰{dspResultats.totalGils}/{dspResultats.globalGils} (millions de Gils)
					<table class="resTable"><tbody>
						<tr class="petit">
							<td>Pseudo</td><td>Gils (en millions)</td>
						</tr>
						{#each Object.keys(dspResultats.pseudos) as p,i}
							<tr>
								<td class="resTd">{p}</td>
								<td class="resTd">{dspResultats.pseudos[p].gils}M</td>
							</tr>
						{/each}
					</tbody></table>
				</div>
			</div>
		</div>
		
	{/if}

</div>
<!-- P403.svelte --> 

