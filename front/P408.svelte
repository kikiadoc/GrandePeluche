<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo, displayObject,
					 markClick, isAdmin,
					 urlCdn, apiCall, apiCallExtern, getEpsilon, urlCdnAI, urlCdnSTATIC,
					 addNotification, mediaPlay,countDownInit,
					 addTexteTTS, isPlaying, isProd, playVideo
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE, calcCagnotte }  from './ground.svelte.js'
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
	const
		PAGEEPIQLBL= "P"+pageDesc.n+"_epiqStep",
		PAGESAISIESLBL = "P"+pageDesc.n + "_saisies",
		APIROOT = '/'+pageDesc.rootName+'/',
		WSMSGETAT = pageDesc.rootName+".etat",
		APICONFIG = APIROOT+'config',
		APIETAT = APIROOT+'etat',
		APIREQUPDATE = APIROOT+'reqUpdate',
		APIDEMANDEBATON = APIROOT+'demandeBaton/',
		APIREPONSE = APIROOT+'reponse/'
	
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
		s.debug ??= false
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}

	// chargement config du challenge
	let CONFIG=$state(null)
	async function getConfig() {
		let ret = await apiCall(APICONFIG);
		if (ret.status != 200) throw new Error("erreur sur "+APICONFIG+"("+ret.status+')')
		CONFIG = ret.o
	}
	// chargement etat du challenge
	let etat = $state(null)
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall(APIETAT);
		if (ret.status != 200) return console.error("erreur sur",APIETAT,ret.status)
		recalcEtat(ret.o)
	}

	const STATUS= {WAIT: 0, DEMPOS:1, ENCOURS: 2, POSAUTRE: 3}
	let videoFinale=false
	function reNewEtat() {
		recalcEtat(null)
	}
	async function recalcEtat(tEtat) {
		console.log("recalcEtat")
		etat= tEtat || Object.assign({},etat)

		// un pseudo possede le baton et son echeance est dépassée 
		if (etat.qPseudo && (etat.pseudos[etat.qPseudo].batonEcheance+getEpsilon() < Date.now()) ) {
			// duree dépassée, baton libre, on fait comme si il n'y avait pas de pseudo
			etat.qPseudo = null
		}

		let tCagnotteNb = 0
		let tOkTotalNb = 0
		// calcul de myEcheance et myStatus pour tous les pseudos
		Object.keys(etat.pseudos).forEach( (pNom) => {
			let p = etat.pseudos[pNom]
			p.myEcheance = Math.max(etat.qEcheance,p.batonEcheance)+getEpsilon()
			if (! etat.qPseudo) {
				// baton disponible, soit demande possible, soit attente
				p.myStatus = ( p.myEcheance < Date.now() ) ? STATUS.DEMPOS : STATUS.WAIT
			}
			else {
				// baton possédé, soit encours, soit possede par un autre
				p.myStatus = ( etat.qPseudo==p.pseudo ) ? STATUS.ENCOURS : STATUS.POSAUTRE
			}
			tOkTotalNb += p.nbOk || 0
			if (p.nbOk > 0) tCagnotteNb++
		})
		
		// report des valeurs calculées pour le pseudo
		etat.myEcheance = etat.pseudos[pseudo].myEcheance
		etat.myStatus = etat.pseudos[pseudo].myStatus
		// Synthèses
		etat.cagnotteNb = tCagnotteNb
		etat.goalNb = tOkTotalNb
		etat.cagnotteNbCap = Math.min(etat.cagnotteNb,GBLCONST.EQUILIBRAGE.NB)
		etat.goalNbCap = Math.min(etat.goalNb,CONFIG.GOAL)
		etat.cagnotteGils=calcCagnotte(etat.cagnotteNb,CONFIG.GILS)

		// etat du challenge
		etat.challengeTermine = (etat.goalNb>=CONFIG.GOAL)
		if (etat.challengeTermine && !videoFinale) {
			videoFinale=true
			playVideo("X-tranquilite/tranquilite-final")
		}
	}

	// calcul des résultats
	function calcResultats() {
		let res={ }
		dspResultats = res
	}

	async function reponse(i) {
		await apiCall(APIREPONSE+i,'POST');
	}
	async function demandeBaton(e) {
		let ret = await apiCall(APIDEMANDEBATON,'POST');
		// reponse 201 est OK, MAJ par le WS
		if (ret.status != 201) return console.error("erreur sur",APIDEMANDEBATON,ret.status)
	}
	async function admSetPseudo() {
		throw new Error('admSetPseudo pas defini')
	}
	async function aideDemande() {
	}

	
</script>

<style>
	
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
				<input type="button" value="SetAll" onclick={() => confirm("Tout definir?") && apiCall(APIROOT+'setAll','DELETE') } />
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
			<img class="parchemin" src={urlCdnSTATIC+"kiki.png"} style="width:30%; float:right" alt="" />
			<div>
				Une ère de tranquilité s'achève en Eorzéa.
				<div class="br"/>
				Kikiadoc a profité de cette ère pour crafter,
				obtenir quelques objets légendaires et occuper ses servants.
				<br/>
				Il a même crafté le fameux Bâton de Gils.
			</div>
			<Btn bind:refStep={epiqStep} step=10 val="Le Bâton de Gils?" />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdnSTATIC+"kiki.png"} style="width:30%; float:right" alt="" />
			<div>
				Oui {pseudo}, le Bâton de Gils.
				<br/>
				C'est un artefact légendaire que Kikiadoc m'a confié.
				<br/>
				Sa caractéristique principale est de faire apparaître, à chaque utilisation,
				des Gils dans la Cagnotte de l'événement.
			</div>
			<div>
				Souviens-toi de mes explications concernant la Cagnotte lors de ton Initiatique.
			</div>
			<Btn bind:refStep={epiqStep} step=20 val="Ha oui!" />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==20 && etat}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/gamemaster.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Tu pourras réclamer le Bâton de Gils, mais quand tu le possederas,
				tu devras résoudre une énigme afin de l'utiliser.
				<br/>
				Après utilisation, le Bâton de Gils redeviendra
				disponible et pourra être réclamer de nouveau.
				<br/>
				La Cagnotte globale de l'événement sera
				alors fonction du nombre d'utilisation du Bâton de Gils.
			</div>
			<Btn bind:refStep={epiqStep} step=30 val="J'ai compris" />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==30 && etat}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/Human_brainstem2.gif"} style="width:30%; float:right" alt="" />
			<div>
				N'oublie jamais qu'il faut <u>réfléchir avant d'agir</u>:
				<div class="br"/>
				La durée de ce premier Challenge ne dépendra que de la 
				parfaite coopération entre toi et ton équipe.
				<div class="br" />
				Il faudra résoudre {CONFIG.GOAL} énigmes élémentaires.
				<br/>
				Cela peut sembler un nombre important, mais avec une équipe de 10 personnes,
				elles peuvent être toutes résolues en moins d'une heure !
				<br/>
				Et si l'équipe maximise la Contribution, {CONFIG.GILS} millions
				de gils seront distribués en fonction des résultats.
				<div class="br" />
				A l'opposé, imagine que tu fasses ce challenge en solo.
				<br/>
				Il te faudra plus de 20 heures, ta Contribution sera minable,
				et tu ne gagneras que quelques milliers de Gils.
			</div>
			<Btn bind:refStep={epiqStep} step=50 val="Ha ouais!" />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}
	{#if epiqStep==50 && CONFIG}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/Human_brainstem2.gif"} style="width:30%; float:right" alt="" />
			<div>
				Voila pourquoi, il est souvent judicieux de partager une stratégie
				et l'expliciter sur Discord afin de maximiser la Contribution.
				<div class="br" />
				Je te conseille de vous retrouver sur Discord (si possible en vocal)
				au début de chaque challenge.
				<div class="br" />
				<u>C'est valable dès maintenant... Si possible, rejoint le salon vocal de Discord</u>.
				<div class="br" />
				Mais assez de blabla, je te laisse découvrir les mécanismes de ce
				premier Challenge.
			</div>
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
			<div style="clear:both" class="br"></div>
		</div>		
	{/if}

	{#if epiqStep==90 && etat}
		<div use:scrollPageToTop>
			<div>
				<div>
					{#if !etat.challengeTermine}
					<div style="cursor:pointer">
						<span onclick={markClick}
							gpHelp="Cagnotte du challenge. Elle augmente à chaque fois qu'une personne résoud sa première énigme (voir le bouton résultats)." >
							💰{etat.cagnotteNbCap}/{GBLCONST.EQUILIBRAGE.NB}
						</span>
						<span onclick={markClick}
							gpHelp="Nombre d'utilisations réussies du Bâton de Gils. Cela déterminera la Cagnotte globale de l'événement." >
							🪄{etat.goalNbCap}/{CONFIG.GOAL}
						</span>
						{#if etat.myStatus==STATUS.WAIT}
							<span onclick={markClick}
								gpHelp="Delai avant de pouvoir tenter de recupérer le Bâton de Gils" >
								⏳<countdown dth={etat.myEcheance}
									 oncdTimeout={reNewEtat} />
							</span>
						{:else if etat.myStatus==STATUS.DEMPOS}
							<span onclick={markClick}
								gpHelp="Le Bâton de Gils est disponible, tu peux le demander" >
								👁 Demander
							</span>
						{:else if etat.myStatus==STATUS.ENCOURS}
							<span onclick={markClick}
								gpHelp="Délai pour donner la réponse" >
								❓<countdown dth={etat.myEcheance}
									 oncdTimeout={reNewEtat} />
							</span>
						{:else if etat.myStatus==STATUS.POSAUTRE}
							<span onclick={markClick}
								gpHelp="Delai avant de pouvoir attraper le Bâton de Gils" >
								⏳<countdown dth={etat.myEcheance}
									 oncdTimeout={reNewEtat} />
							</span>
						{:else}
							<span>Erreur de logique</span>
						{/if}
					</div>
					{/if}
					<div class="adminCadre papier">
						{#if etat.challengeTermine}
							<div>Le challenge est terminé</div>
							<div>
								<input type="button" value="Revoir la vidéo"
									onclick={()=>playVideo("X-tranquilite/tranquilite-final") } />
							</div>
						{:else if etat.myStatus==STATUS.WAIT}
							<div>Patiente un peu...</div>
						{:else if etat.myStatus==STATUS.DEMPOS}
							<div class="info">
								{#if etat.cagnotteNb < GBLCONST.EQUILIBRAGE.NB}
									{#if !etat.pseudos[pseudo].nbOk}
										❇️Demande le Bâton de Gils et résous l'énigme afin d'augmenter
										la Contribution de ce challenge.
									{:else}
										⚠️Le nombre de Contributions n'est pas maximal.
										Concertez-vous.
										<br/>
									{/if}
								{:else}
									❇️Le nombre de contributions est maximal.
									Récupère le Bâton de Gils pour augmenter ton mérite personnel.
									<br/>
								{/if}
							</div>
							<div>
								Tu peux
								<input type="button" value="demander" onclick={demandeBaton}/>
								le Bâton de Gils.
								<br/>
							</div>
						{:else if etat.myStatus==STATUS.ENCOURS}
							<div>
								{CONFIG.QUESTIONS[etat.qIdx].q}
							</div>
							<div>
								{#each CONFIG.QUESTIONS[etat.qIdx].o as o,i}
									<input type="button" value={o} onclick={()=>reponse(i)} />
								{/each}
							</div>
							<hr />
							<div class="info">
								Tu peux
								<span class="infoLink" value="demander de l'aide" onclick={markClick}
									gpHelp="Tu peux demander de l'aide en vocal ou texte sur Discord. Tu peux aussi indiquer un message qui sera transmis à tous les connectés dans la zone de saisie 'message' à droite du bouton résultat"
								>
								demander de l'aide.
								</span>
							</div>
							{#if saisies.debug}
								<div class="adminCadre">
									Soluce:
									{CONFIG.QUESTIONS[etat.qIdx].r}
									{CONFIG.QUESTIONS[etat.qIdx].o[CONFIG.QUESTIONS[etat.qIdx].r]}
								</div>
							{/if}
						{:else if etat.myStatus==STATUS.POSAUTRE}
							<div>
								<div class="petit">
									La question posée à {etat.qPseudo} est:
								</div>
								{CONFIG.QUESTIONS[etat.qIdx].q}
								<div class="petit">
									Les réponses proposées sont:
								</div>
								{#each CONFIG.QUESTIONS[etat.qIdx].o as o,i}
									{#if i>0},{/if}
									<span>{o}</span>
								{/each}
							</div>
						{:else}
							<span>Erreur de logique</span>
						{/if}
					</div>
					{#if !etat.challengeTermine}
						<div class="parchemin petit" style="text-align: left">
							<table>
								<tbody>
									{#each Object.keys(etat.pseudos) as pNom,i}
										{@const p=etat.pseudos[pNom]}
										<tr>
											<td>{pNom}</td>
											<td>
												{#if p.myEcheance <= Date.now()}
													⏰
												{:else if p.myStatus==STATUS.WAIT}
													😴<countdown dth={p.myEcheance} oncdTimeout={reNewEtat} />
												{:else if p.myStatus==STATUS.DEMPOS}
													⏰
												{:else if p.myStatus==STATUS.ENCOURS}
													🪄<countdown dth={p.myEcheance} oncdTimeout={reNewEtat} />
												{:else if p.myStatus==STATUS.POSAUTRE}
													😴<countdown dth={p.myEcheance} oncdTimeout={reNewEtat} />
												{:else}
													Erreur de Logique
												{/if}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
					</div>
				{/if}
				</div>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	
	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Cagnotte de l'événement:
						🏦{etat.goalNbCap}/{CONFIG.GOAL}⇒
						{(GBLCONST.EQUILIBRAGE.EVENTGILS*etat.goalNbCap/CONFIG.GOAL).toFixed(1)}/{GBLCONST.EQUILIBRAGE.EVENTGILS}M Gils
					</div>
					<div>
						Cagnotte du challenge:
						💰{etat.cagnotteNbCap}/{GBLCONST.EQUILIBRAGE.NB}⇒
						{etat.cagnotteGils.toFixed(1)}/{CONFIG.GILS}M Gils
					</div>
					<table class="resTable">
						<tbody>
							<tr class="petit">
								<td>Pseudos</td>
								<td>Usage</td>
								<td>Mérite</td>
								<td>Gils</td>
							</tr>
							{#each Object.keys(etat?.pseudos) as p}
								{@const e = etat.pseudos[p]}
								{@const ratio = e.nbOk/etat.goalNb}
								<tr>
									<td class="resTd">
										<img style="width: 1em" alt="" src={urlCdnAI+"pseudo-"+p+".jpg"} />
										{p}
									</td>
									<td class="resTd">{#if e.nbOk}🪙{/if}{e.nbOk}</td>
									<td class="resTd">{Math.floor(100*ratio)}%</td>
									<td class="resTd">{(ratio*etat.cagnotteGils).toFixed(3)}M</td>
								</tr>
							{/each}
							<tr class="petit">
								<td>Contributions</td>
								<td>🪙={etat.cagnotteNb}</td>
								<td></td>
								<td colspan=3>💰=min({etat.cagnotteNb},{GBLCONST.EQUILIBRAGE.NB})={etat.cagnotteNbCap}</td>
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
<!-- P408.svelte -->


