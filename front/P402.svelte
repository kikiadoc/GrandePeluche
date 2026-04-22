<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, urlCdnAI, apiCall, apiCallExtern, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownInit, jjmmhhmmss
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
	// const WSETAT = (()=>pageDesc.rootName+'.etat')()
	const APICONFIG = APIROOT+'config'
	const APIETAT = APIROOT+'etat'
	const APIACHAT = APIROOT+'achat'
	const APIREMBOURSER = APIROOT+'rembourser/'

	const REMBMINI = 5000000
	
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
		// if (m.op==WSETAT && m.o) { getEtat(m); return true }
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
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}

	// etat du challenge 
	let CONFIG = $state(null)
	let etat = $state(null)
	let dspValidation = $state(null)
	// svelte-ignore state_referenced_locally
	let pseudoTicket = $state(pseudo)
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
		calcChallengeTermine()
		await calcEtat()
	}
	async function calcEtat() {
		etat.globalPrix = 0
		Object.keys(etat.pseudos).forEach ( (p) => {
			etat.pseudos[p]?.achats?.forEach ( (a) => {
				etat.globalPrix += a.prix
			})
		}	)
		calcChallengeTermine()
		await calcEligibilite()
	}

	let uni = $state({})
	function reinitEligibilite() {
		uni = {} 
	}
	function calcChallengeTermine() {
		etat.challengeTermine = pageDesc.end < Date.now()
	}
	async function calcEligibilite() {
		calcChallengeTermine()
		uni.raisonIneligible = "Calcul en cours"
		if (uni.nb==1) {
			let jsonEurope = await apiCallExtern("https://universalis.app/api/v2/Europe/"+uni.id,null,null,true)
			console.log("jsonEurope",jsonEurope) 
			uni.listeEurope = jsonEurope?.listings || []
			let jsonMoogle = await apiCallExtern("https://universalis.app/api/v2/Moogle/"+uni.id,null,null,true)
			uni.listeMoogle = jsonMoogle?.listings || []
		}
		// analyse global des tickets
		uni.dejaAchete = false
		Object.keys(etat.pseudos).forEach ( (p) => {
			etat.pseudos[p]?.achats?.forEach ( (a) => {
				if (a.id == uni.id) uni.dejaAchete = true
			})
		}	)
		// analyse des listes - calcul prix min, quantity et pu sur europe 
		uni.listePuMin = Infinity
		uni.listeQuantity = 0
		uni.listePuMin = Infinity
		uni.listeEurope?.forEach((e)=> {
			if (e.total/e.quantity < uni.listePuMin) {
				uni.listePrixMin = e.total
				uni.listeQuantity = e.quantity
				uni.listePuMin = e.total/e.quantity
			}
		})
		// analyse des listes - cherche le servant caution 
		uni.servant = null
		uni.servantPrix = Infinity
		uni.listeMoogle?.forEach((e)=> {
			if (CONFIG.SERVANTS.indexOf(e.retainerName) >= 0) {
				uni.servant=e.retainerName 
				uni.servantPrix = Math.min( e.total, uni.servantPrix)
			}
		})
		// analyse situation personnelle du joueur 
		uni.ticketsNb = etat.pseudos[pseudo]?.achats.length || 0
		uni.ticketsPrix = sommePrixAchats(etat.pseudos[pseudo]?.achats)
		uni.ticketsReduc = sommeReducAchats(etat.pseudos[pseudo]?.achats)
		uni.ticketsDejaPaye = etat.pseudos[pseudo]?.totalPaye || 0
		// eligibilité
		if (etat.challengeTermine) uni.raisonIneligible = "Le marché de Noël est terminé"
		else if (uni.dejaAchete) uni.raisonIneligible = "Objet déjà acheté par un joueur"
		else if (uni.nb==1 && uni.listeEurope.length==0) uni.raisonIneligible = "Cet objet n'est pas en vente"
		else if (uni.listePuMin < CONFIG.PRIXMIN) uni.raisonIneligible = "Non éligible, Prix unitaire < "+CONFIG.PRIXMIN
		else if (uni.ticketsNb >= CONFIG.TICKETSNBMAX) uni.raisonIneligible = "Tu es limité à "+CONFIG.TICKETSNBMAX+" tickets de remboursement"
		else if ( (uni.ticketsPrix+uni.listePuMin) >= CONFIG.TICKETSPRIXMAX) uni.raisonIneligible = "Tu es limité à "+CONFIG.TICKETSPRIXMAX+" d'achat"
		else if (uni.ticketsReduc >= CONFIG.TICKETSREDUCMAX) uni.raisonIneligible = "Tu es limité à "+CONFIG.TICKETSREDUCMAX+" de réduction"
		else if (etat.globalPrix >= CONFIG.GLOBALPRIX) uni.raisonIneligible = "Limite globale de "+CONFIG.GLOBALPRIX+" atteinte"
		else uni.raisonIneligible = null // eligible
	}
	
	async function clicSearch() {
		dspValidation = null
		reinitEligibilite()
		let url='https://v2.xivapi.com/api/search?language=fr&sheets=Item&query=Name~"'+encodeURIComponent(saisies.nom)+'"'
		let jsonSearch = await apiCallExtern(url)
		// console.log("check XIVAPI",jsonSearch)
		uni.nb = jsonSearch?.results?.length || 0
		uni.listeSearch = jsonSearch?.results || []
		if (uni.nb==1) {
			uni.nom = jsonSearch.results[0].fields.Name
			uni.id = jsonSearch.results[0].row_id
		}
		// calcul eligibilité
		calcEligibilite()
	}
	function clickListeSel(e) {
		dspValidation = null
		reinitEligibilite()
		console.log("e",e)
		uni.nom = e.target.getAttribute("gpNom")
		uni.id = e.target.getAttribute("gpId")
		uni.nb= 1
		// calcul eligibilité
		calcEligibilite()
	}
	function selClick(l,i) {
		dspValidation = {
			achatNom: uni.nom,
			achatId: uni.id,
			achatPnj: l.retainerName,
			achatMonde: l.worldName,
			achatPrix: l.total,
			achatQuantity: l.quantity,
			achatServant: uni.servant
		}
	}
	async function clickAchat() {
		// utilise dspValidation
		if (dspValidation?.step == 2) {
			saisies.nom=null
			uni.nb = null
			let ret = await apiCall(APIACHAT,'POST',dspValidation)
			if (ret.status==200) etat=ret.o
			calcEtat()
			dspValidation = null
		}
	}
	function calcReducPrix(prix) {
		if (uni.raisonIneligible) return 0
		if (! uni.servant) return prix*CONFIG.REDUCSTD // cas si pas de servant garant (30%)
		if (! uni.listePrixMin) return 0 // cas si pas de liste (ne devrait pas se produire)
		// si servant garant 70% du plus bas prix
		return Math.round(Math.min(uni.listePrixMin*CONFIG.REDUCMAX, uni.servantPrix*CONFIG.REDUCMAX))
	}
	function calcPrixApresReduc(prix) {
		return Math.round(Math.max(0,prix-calcReducPrix(prix)))
	}
	function calcReducAchat(achat) {
		return Math.round( (achat.servant)? achat.prix*CONFIG.REDUCMAX : achat.prix*CONFIG.REDUCSTD)
	}
	function sommeReducAchats(tAchats) {
		return tAchats.reduce( (a,achat)=> a+calcReducAchat(achat) , 0) || 0
	}
	function sommeAchats(tAchats) {
		return tAchats.reduce( (a,achat)=> a+achat.prix , 0) || 0
	}
	function sommePrixAchats(achats) {
		return achats.reduce ( (a,c) => a+c.prix, 0) || 0
	}
	function calcFinal(p) {
		let affTicketsPaye = etat.pseudos[p].totalPaye || 0
		let affTicketsReduc = sommeReducAchats(etat.pseudos[p].achats)
		let affTotalAchatVal= sommeAchats(etat.pseudos[p].achats)
		let affFinalVal = affTicketsReduc
		if ( (affTotalAchatVal>0) && (etat.challengeTermine || isAdmin(pseudo)) )
			affFinalVal = affTicketsReduc + affTotalAchatVal + REMBMINI
		// valeur final restante de remboursement
		return affFinalVal - affTicketsPaye
	}
	let pseudoRemb = $state(null)
	async function rembourser() {
		let r=calcFinal(pseudoRemb)
		if (confirm("Confirmer don de "+r+" à "+pseudoRemb)) {
			let ret = await apiCall(APIREMBOURSER+pseudoRemb+"/"+r,"POST")
			if (ret.status==200) etat=ret.o
		}
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
				<input type="button" value="dspUni" onclick={() => displayObject(uni) } />
				<input type="button" value="DELETEALL" onclick={async () => confirm("tout supprimer?") && await apiCall(APIROOT,"DELETE") && await getEtat()} />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}
	{#if etat}
		<div>
			<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
			{#if etat.challengeTermine}
				<span class="blinkMsg" style="color:red">Le Marché est fermé</span>
			{:else}
				<span style="cursor: pointer" onclick={markClick} gpHelp="Echéance de la fermeture du Marché de Noël">
					🎄<countdown dth={pageDesc.end} oncdTimeout={calcChallengeTermine} />
				</span>
			{/if}
		</div>
	{/if}
	{#if epiqStep==0 && CONFIG}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"X-ventesPrivees/gamemaster.jpg"} style="width:30%; float:right" alt="" />
			<div>{pseudo}, bienvenue au marché de Noël de la Grande Peluche.</div>
			<div class="br"/>
			Les lutins de la Grande Peluche sont capables de te proposer des réductions sur
			l'ensemble des objets en vente dans les mondes européens de FF14 et 
			<span class="blinkMsg">
				t'indiquer les HV les moins chers où réaliser tes achats.
			</span>
			<div class="br"/>
			Les réductions applicables sont de {CONFIG.REDUCSTD*100}% sur les objets éligibles et de
			<span class="blinkMsg">
				{CONFIG.REDUCMAX*100}% pour les objets en vente par un des servants de Kikiadoc.
			</span>
			<div class="br"/>
			Les rêgles de ce mini-jeu sont:
			<br/>
			➥Un objet doit être d'un cout unitaire supérieur ou égal à {CONFIG.PRIXMIN} gils
			pour être acheté avec une réduction.
			<br/>
			➥Un objet ne peut être acheté avec une réduction
			s'il a déjà été acheté par un autre joueur avec une réduction.
			<br/>
			➥Chaque joueur ne peux faire que {CONFIG.TICKETSNBMAX} achats avec réduction.
			<br/>
			➥Chaque joueur ne peux dépasser {CONFIG.TICKETSPRIXMAX/1000000}M Gils d'achats avec réduction.
			<br/>
			➥Chaque joueur ne peux dépasser {CONFIG.TICKETSREDUCMAX/1000000}M Gils de réduction.
			<br/>
			➥Les achats avec réduction sont limités à {CONFIG.GLOBALPRIX/1000000}M Gils pour l'ensemble des participants
			<br/>
			<Btn bind:refStep={epiqStep} step=90 val="Je vais faire mes courses" />
			<div class="info">
				<div>
					Ce mini-jeu s'appuie sur les API de
					<a href="https://v2.xivapi.com/" target="gpHelp">https://v2.xivapi.com/</a>
					et de 
					<a href="https://docs.universalis.app/" target="gpHelp">https://docs.universalis.app/</a>
				</div>
				<b>Encore merci aux développers de ces APIs.</b>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div class="reveal" use:scrollPageToTop>
			{#if etat.challengeTermine}
				<div>
				</div>
			{:else}
				<div>
					<span class="infoLink" onclick={markClick} gpHelp="Indique une partie du nom de l'objet">
						Nom de l'objet souhaité:
					</span>
					<input type="text" maxlength=80 bind:value={saisies.nom} onkeyup={(e)=> e.key=='Enter' && clicSearch()} />
					<input type="button" value=">" onclick={clicSearch} />
				</div>
				<hr />
				{#if uni.nb === null || uni.nb === undefined}
					<div style="color:red">Recherche un objet en vente</div>
				{:else if uni.nb == 0}
					<div style="color:red">Aucun objet trouvé pour {saisies.nom}</div>
				{:else if uni.nb > 1}
					<div>
						<div>{uni.nb} objets trouvés pour {saisies.nom}</div>
						<div style="cursor: pointer; height: 4em; overflow-y: scroll; border: 2px solid white">
							{#each uni.listeSearch as l,i}
								<div onclick={clickListeSel} gpId={l.row_id} gpNom={l.fields.Name}>👉{l.fields.Name}</div>
							{/each}
						</div>
					</div>
				{:else}
					<div>
						Nom exact: {uni.nom} (id={uni.id})
					</div>
					{#if uni.raisonIneligible}
						<div style="color: red">{uni.raisonIneligible}</div>
					{:else if uni.servant}
						<div style="color: lightgreen" onclick={markClick} gpHelp="En achetant cet objet, tu peux obtenir un ticket" de remboursement>
							Cet achat est éligible à la super réduction de {CONFIG.REDUCMAX*100}% ({uni.servant})
						</div>
					{:else}
						<div style="color: yellow">
							Cet achat est éligible à la réduction de {CONFIG.REDUCSTD*100}% 
						</div>
					{/if}
					<div class="petit" style="height: 7em; overflow-y: scroll; border: 2px solid white">
						{#each uni.listeEurope as l,i}
							<div style="cursor:pointer" onclick={()=>selClick(l,i)}>
								👉
								{l.retainerName}@{l.worldName}{#if l.hq}(HQ){/if}
								{calcPrixApresReduc(l.total)/l.quantity}
								{#if l.quantity > 1}<span style="color:yellow">x{l.quantity}</span>{/if}
								({#if uni.raisonIneligible}pas de réduction{:else}sans réduction{/if} {l.total})
							</div>
						{/each}
					</div>
				{/if}
				<hr />
			{/if}
			{#snippet affTicket(p,cls)}
				{#if p && etat.pseudos[p]}
					{@const affTicketsNb = etat.pseudos[p].achats.length}
					{@const affTicketsReduc = sommeReducAchats(etat.pseudos[p].achats)}
					{@const affTicketsPaye = etat.pseudos[p].totalPaye || 0}
					{@const affTotalAchatVal= sommeAchats(etat.pseudos[p].achats)}
					{@const affFinalVal= calcFinal(p)}
					<div>
						Total acheté: {affTotalAchatVal} Gils
					</div>
					<div>Tickets de réduction: {affTicketsNb}/{CONFIG.TICKETSNBMAX}</div>
					<div>
						Total réductions: {affTicketsReduc} Gils
					</div>
					{#if (affTotalAchatVal>0) && (etat.challengeTermine || isAdmin(pseudo))}
						<div>
							Bonus participation: {REMBMINI} Gils
						</div>
					{/if}
					<div>
						Remboursement déjà effectué: {affTicketsPaye} Gils
					</div>
					{#if isAdmin(pseudo) || etat.challengeTermine}
						<div class="blinkMsg">
							Remboursement à faire: {affFinalVal} Gils
						</div>
					{/if}
					<div class={cls} style="cursor:pointer"> 
						{#each etat.pseudos[p].achats as a}
							{@const reducPct= (a.servant)? 100*CONFIG.REDUCMAX : 100*CONFIG.REDUCSTD}
							{@const reducVal= calcReducAchat(a)}
							{@const reducSty= (a.paye)? "text-decoration-line: line-through" : ""}
							<div style={reducSty} onclick={markClick}
								gpHelp="Achat {a.prix} Gils avec reduc de {reducVal} {jjmmhhmmss(a.dth)} auprès de {a.pnj} sur {a.monde} {a.servant?'(garant: '+a.servant+')':""}">
								👉{a.nom}
								({reducPct}%) {reducVal}/{a.prix}
							</div>
						{/each}
					</div>
				{/if}
			{/snippet}
			<div>
				{@render affTicket(pseudo,"parchemin")}
			</div>
			{#if isAdmin(pseudo)}
				<div class="adminCadre">
					<div>
						ADMIN Remboursement: 
						<span>
							<select bind:value={pseudoRemb}>
								<option></option>
								{#each Object.keys(etat.pseudos) as p}
									<option>{p}</option>
								{/each}
							</select>
							{#if pseudoRemb}
								<input type="button" value="Rembourser" onclick={rembourser} />
							{/if}
						</span>
					</div>
					<div>
						{@render affTicket(pseudoRemb)}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if dspValidation}
		<div class="popupCadre papier">
			<div class="close" onclick={dspValidation=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					{#if uni.raisonIneligible}
						<div>Cet objet n'est pas éligible au marché de Noël</div>
						<div>Tu peux choisir de l'acheter sans réduction</div>
					{:else if !dspValidation.step}
						<div>Vérifie la possibilité d'achat sur {dspValidation.achatMonde}</div>
						<div class="info" style="color: yellow">
							Si tu ne trouves pas l'objet en vente à l'HV de {dspValidation.achatMonde} selon les caractéristiques ci-dessous,
							ferme cette fenêtre et trouve un autre objet dans la liste.
						</div>
						<div>
							<input type="button" value="Je l'ai trouvé" onclick={()=>dspValidation.step=2}/>
							<input type="button" value="Je ne le trouve pas" onclick={dspValidation=null}/>
						</div>
					{:else if dspValidation.step==2}
						<div>Achète l'objet IG et valide ta réduction</div>
						<div class="info" style="color: yellow">
							Après l'achat IG, n'oublie pas de l'indiquer ici.
							<br/>
							Ta réduction sera effective après validation des historiques IG par Kikiadoc.
						</div>
						<input type="button" value="Je l'ai acheté" onclick={clickAchat}/>
						<input type="button" value="Je n'ai pas pu l'acheter" onclick={dspValidation=null}/>
					{:else}
						Erreur de logique, contacte Kikiadoc sur Discord.
					{/if}
					<table class="parchemin" style="text-align: left">
						<tbody>
							<tr><td>Objet:</td><td>{dspValidation.achatNom}</td></tr>
							<tr><td>Monde:</td><td>{dspValidation.achatMonde}</td></tr>
							<tr><td>Vendeur:</td><td>{dspValidation.achatPnj}</td></tr>
							<tr><td>Prix:</td><td>{dspValidation.achatPrix}
								{#if dspValidation.achatQuantity>1}
									({dspValidation.achatQuantity}x{dspValidation.achatPrix/dspValidation.achatQuantity})
								{/if}
							</td></tr>
							<tr><td><hr/></td><td><hr/></td></tr>
							{#if !uni.raisonIneligible}
								<tr><td>Réduction:</td><td>{calcReducPrix(dspValidation.achatPrix)}</td><td></td></tr>
								<tr><td>Reste:</td><td>{calcPrixApresReduc(dspValidation.achatPrix)}</td></tr>
							{:else}
								<tr><td colspan=2>Pas de réduction</td></tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
	

</div>
<!-- P402.svelte -->

