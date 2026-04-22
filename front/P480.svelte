<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, urlCdnAI, apiCall, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownTo, hhmmssms, isDistance, countDownInit, nbSecTo,
					 getEpsilon, isSM
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE,calcCagnotte, calcCagnotteNb }  from './ground.svelte.js'
	import Btn from './Btn.svelte'
	import Common from './Common.svelte'
	
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
	// svelte-ignore state_referenced_locally
	const APICONFIG = '/'+pageDesc.rootName+'/config'
	// svelte-ignore state_referenced_locally
	const APIETAT = '/'+pageDesc.rootName+'/etat'
	// svelte-ignore state_referenced_locally
	const APIREVEAL = '/'+pageDesc.rootName+'/reveal/'
	// svelte-ignore state_referenced_locally
	const APIPROPOSITION = '/'+pageDesc.rootName+'/proposition/'
	// svelte-ignore state_referenced_locally
	const CDNROOT = urlCdn+pageDesc.rootName+'/'
	// svelte-ignore state_referenced_locally
	const WSETAT=pageDesc.rootName+".etat" 
	const VIDEOFINALE="X-dessins/X-dessins-final"
	
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

	// appelé apres mount du component
	async function init() { await getConfig(); await getEtat() }
	
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
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.debug ??=false
		s.clicEcheance ??= 0
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// chargement etat du challenge
	let CONFIG =$state.raw(null)
	async function getConfig(msgWs) {
		let ret = msgWs || await apiCall(APICONFIG);
		if (ret.status != 200) return console.error("erreur sur",APICONFIG, ret.status)
		CONFIG = Object.assign(ret.o,( (isSM())? ret.o.SM : ret.o.PC))
	}
	let etat = $state(null)
	let etatVideoFinale=false
	async function getEtat(msgWs) {
		if (!CONFIG) return console.log("* getEtat sans config,ignoré")
		console.log('getEtat')
		let ret = msgWs || await apiCall(APIETAT);
		if (ret.status != 200) return console.error("erreur  sur",APIETAT, ret.status)
		recalcEtat(ret.o)
	}
	function recalcEtat(tEtat) {
		tEtat ??= Object.assign({},etat)
		console.log ('******** recalcEtat')
		// test si le dspProposition et trouve
		if (dspProposition && tEtat.dessins[dspProposition.idx].decouvertPseudo)
			dspProposition=null // annule la proposition
		
		// test si le challenge est terminé
		tEtat.challengeTermine = false
		// recalcule la cagnotte
		// tEtat.cagnotteNb = calcCagnotteNb(tEtat.listeTrouveurs.length,tEtat.listeConfirms.length)
		tEtat.cagnotteNb = 0
		// tEtat.cagnotte = calcCagnotte(tEtat.listeTrouveurs.length,CONFIG.GILS,tEtat.listeConfirms.length)
		// commit
		if (tEtat.challengeTermine && !etatVideoFinale) {
			etatVideoFinale=true
			playVideo(VIDEOFINALE)
		}
		etat=tEtat
	}
	// calcul des résultsts
	function calcResultats() {
		let res = { }
		dspResultats = res
	}

	/*
	function loadImage(idx) {
		return new Promise( (ok,ko) => {
			let newImg = new Image()
			newImg.onload = function () { console.log("image chargée",newImg.src); ok(newImg) }
			newImg.onerror = function () { console.log("image error",newImg.src); ko("erreurImage idx="+idx) }
			newImg.src = urlCdn+"X-dessins/test-khloe-raw.gif"
			})
	}
	*/
	// clic sur une image 
	async function clicZone(e) {
		const idx = e.currentTarget.getAttribute("gpIdx")
		let dessin = etat.dessins[idx]
		if (dessin.revealNb>=CONFIG.DESSINS[idx].reveal.l*CONFIG.DESSINS[idx].reveal.c)
			return addNotification("Le mirage est totalement révélé","orange",5,"prout-long")
		if (Math.max(saisies.clicEcheance,dessin.revealEcheance+getEpsilon()) >= Date.now())
			return addNotification("Tu ne peux pas encore","orange",5,"prout-long")
		await apiCall(APIREVEAL+idx,'POST')
		saisies.clicEcheance = Date.now()+CONFIG.CLICDELAI
	}
	// clic sur bouton proposition
	let dspProposition = $state(null)
	async function affProposition(e) {
		addNotification("affProposition+cancelbubble A FAIRE","red",5)
		e.preventDefault()
		e.stopPropagation()
		const idx = e.currentTarget.getAttribute("gpIdx")
		dspProposition = { idx: parseInt(idx,10) }
	}
	async function proposition() {
		let i = dspProposition.idx
		let x = parseInt(saisies.propositionX,10)
		let y = parseInt(saisies.propositionY,10)
		if (isNaN(x) || isNaN(y))
			return addNotification("Coordonnées invalides","orange",5,"prout-long")
		dspProposition = null
		saisies.propositionX = null
		saisies.propositionY = null
		saisies.clicEcheance = Date.now()+CONFIG.CLICDELAI
		await apiCall(APIPROPOSITION+i,'POST',{x:x, y:y})
	}

</script>

<style>
	.table {
		/* background-size: 100% 100%; background-position: center; */
		margin: auto; padding: 0; border: 0;
		border-spacing: 0; border-collapse: collapse;
		cursor: pointer;
		text-align: center; width:100%
	}
	.tbody { }
	.tr { padding: 0; margin: 0; border: 0 }
	.td {
		padding: 0; margin: 0; border: 2px; position:relative; border: 5px solid;
	}
	.contenu { }
	.divDessin {
		aspect-ratio: 2 / 3; image-rendering: auto; position: relative;
		background-position: center; background-size: cover;
	}
	.divCible {
		aspect-ratio: 2 / 3; width: 33.33%; position: absolute; 
		margin: 0; font-size: 0.5em;
		background: radial-gradient(#FFFFFF,#000000,#FFFFFF,#000000);
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
				<input type="button" value="ResetAll" onclick={() => confirm("Tout effacer?") && apiCall(APIROOT+'etat','DELETE') } />
				<input type="button" value="SetAll" onclick={() => confirm("Tout valider?") && apiCall(APIROOT+'setAll','DELETE') } />
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
			<img class="parchemin" src={urlCdn+"X-dessins/logoPnj.jpg"} style="width:30%; float:right" alt="" />
			Les trois Pharao sont opérationnels,
			Grace aux mesures combinées, la fluctuationd e l'Orthogonalites des axes temporels
			ont été réajustés.
			Les PNJs perdus peuvent retourner à leurs positions d'origine sur Eorzéa.
			<br/>
			<Btn bind:refStep={epiqStep} step=10 video="afaire" val="Explique-moi!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-dessins/logoPnj.jpg"} style="width:30%; float:right" alt="" />
			<input type="button" value="Revoir la video" gpVideo="afaire" onclick={markClick} />
			<br/>
			<Btn bind:refStep={epiqStep} step=20 val="Retrouvons-les" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<Btn bind:refStep={epiqStep} step=80 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<div class="info">
				La cagnotte de ce challenge est maximale si, <u>au moment où ce challenge se termine</u>:
				<br/>
				➥Le nombre de personnes ayant découvert au moins un lieu est supérieur ou égal à {GBLCONST.EQUILIBRAGE.NB}
				<br/>
				Je te laisse découvrir les autres mécanismes de ce challenge.
			</div>
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div use:scrollPageToTop>
			<div>
				{#if !etat.challengeTermine}
					<span onclick={markClick} style="cursor:pointer" gpImg="commons/cagnotte.png" 
						gpHelp="C'est la cagnotte. Elle augmente de façon exponentielle selon le nombre d'Aventuriers
										ayant découvert au moins un lieu et le nombre d'Aventuriers
										ayant indiqué un lieu de faible chronosismicité.
										Tu peux cliquer sur le bouton 'résultats' pour voir la répartition actuelle.">
						💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}
					</span>
					<!--
					<span class="gpHelp" onclick={markClick} gpHelp="Repos nécessaire avant de pouvoir changer de lieu d'exploration ou après une découverte">
						🔎<countdown dth={saisies.trouveEcheance} txtTimeout="Possible" use:countDownInit />
					</span>
					-->
				{:else}
					Le challenge est terminé.
				{/if}
			</div>
			<div>
				<table class="papier table" >
					<tbody class="tbody">
						{#each Array(CONFIG.L) as _,l}
							<tr class="tr">
								{#each Array(CONFIG.C) as _,c}
									{@const idx=l*CONFIG.C+c}
									{@const dessin = etat.dessins[idx]}
									{@const conf = CONFIG.DESSINS[idx]}
									{@const reveal = conf.reveal}
									{@const echeanceLoc = Math.max(0,saisies.clicEcheance,dessin.revealEcheance+getEpsilon())}
									{@const bidon = console.log("reveal",CONFIG.DESSINS[idx],reveal,echeanceLoc)}
									<td class="td" style={"width:"+(100/CONFIG.C)+"%"}>
										<div class="divDessin"
											gpIdx={idx} onclick={clicZone} 
											style={"background-image: url('"+urlCdn+conf.png+"')"}>
											{#each Array(reveal.l) as _,ll}
												{#each Array(reveal.c) as _,cc}
													{@const i= ll*reveal.c+cc}
													{@const m= (reveal.o[i] > dessin.revealNb)}
													{@const pL= cc*100/reveal.c}
													{@const pT= ll*100/reveal.l}
													<div class="divCible"
														style={
														 ((saisies.debug)?"border:1px solid white; ":"")+
														 ((m)?"":"background: unset;")+
														 "left:"+pL+"%; top: "+pT+"%"}>
														{#if saisies.debug}
															{ll*3+cc}
															<br/>
															{dessin.revealNb}
															<br/>
															{m?"t":"f"}
														{/if}
													</div>
												{/each}
											{/each}
											<span class="petit" style="position: absolute; bottom:0; left:50%; transform: translateX(-50%);">
												{#if dessin.decouvertPseudo}
													{dessin.decouvertPseudo}
												{:else if echeanceLoc > Date.now()}
													<countdown dth={echeanceLoc} use:countDownInit
														style="background-color:black"
														oncdTimeout={()=>{ saisies.clicEcheance=0 }} />
												{:else}
													<input type="button" value="Eorzéa" gpIdx={idx} onclick={affProposition} />
												{/if}
											</span>
											<span style="font-size: 0.6em; position: absolute; top:0; left:0">
												{idx+1}
											</span>
										</div>
										{#if saisies.debug}
											<div class="adminCadre contenu" style="font-size: 0.4em">
												X:{conf.x} Y:{conf.y}
												<br/>
												{conf.loc}
												<br/>
												<input type="range" min=0 max=9 step=1 style="width:80%"
													bind:value={dessin.revealNb} idx={idx} />
												<br/>
												<input type="button" value="Timer" onclick={(e)=>saisies.clicEcheance=Date.now()+10000-getEpsilon()} />
												<br/>
												{echeanceLoc}
												<br/>
												{echeanceLoc>Date.now()}
											</div>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if dspProposition}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspProposition=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Ortho-mirage #{(dspProposition.idx+1)}
						<br/>
						Indique ses coordonnées en Eorzéa pour la rétrotéléportation:
					</div>
					<div>
						X:<input type="number" min="0.0" max="99.9" step="0.1"
								placeHolder="x.x" bind:value={saisies.propositionX} />
						Y:<input type="number" min="0.0" max="99.9" step="0.1"
								placeHolder="y.y" bind:value={saisies.propositionY} />
						<input type="button" value="➤" onclick={proposition} />
						{#if saisies.debug}
							<div class="adminCadre">
								Admin:
								x:{CONFIG.DESSINS[dspProposition.idx].x}
								y:{CONFIG.DESSINS[dspProposition.idx].y}
							</div>
						{/if}
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
					<!--
					<div>
						Résultats: 💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}⇒ {etat.cagnotte.toFixed(1)}M/{CONFIG.GILS}M Gils
					</div>
					<table class="resTable">
						<tbody>
							<tr class="petit">
								<td></td>
								<td>Trouvés</td>
								<td>Confirmés</td>
								<td>%</td>
								<td>Gils</td>
							</tr>
							{#each pseudos as p,i}
								{@const res=dspResultats.pseudos[p]}
								<tr>
									<td class="resTd">
										<img style="width: 1em" alt="" src={urlCdnAI+"pseudo-"+p+".jpg"} />
										{p}
									</td>
									<td class="resTd">{#if res.nTrouve>0}🪙{/if}{res.nTrouve}</td>
									<td class="resTd">{#if res.nConfirm>0}🪙{/if}{res.nConfirm}</td>
									<td class="resTd">
										{Math.round(100*res.coef/dspResultats.coefTotal)}%
									</td>
									<td class="resTd">
										{(etat.cagnotte*res.coef/dspResultats.coefTotal).toFixed(3)}M
									</td>
								</tr>
							{/each}
							<tr class="petit">
								<td>Contributions</td>
								<td>🪙={etat.listeTrouveurs.length}</td>
								<td>🪙={etat.listeConfirms.length}</td>
								<td></td>
								<td colspan=3>
									💰{etat.cagnotteNb}=min({etat.listeTrouveurs.length},{etat.listeConfirms.length},{GBLCONST.EQUILIBRAGE.NB})
								</td>
							</tr>
						</tbody>
					</table>
					<div class="info">
						⚠️Les gains varient tant que le challenge n'est pas terminé
					</div>
					-->
				</div>
			</div>
		</div>
	{/if}

</div>
<!-- P480.svelte -->

