<script>
	import { onMount, onDestroy  } from 'svelte';
	import { rawConsole, urlCdn, hostDesc, urlCdnAI, GBLSTATIC, GBLCONST } from "./ground.svelte.js"
	import { loadIt, storeIt, scrollPageToTop,
					 displayInfo, displayObject, addNotification, playVideo,
					 alphanum2placer, aaaammjjThhmm, jjmm, jjmmhhmmss, jjmmhhmm, countDownInit,
					 markClick, apiCall, apiCallExtern,
					 isAdmin, isAdminServer, isPrivilege
				 } from './common.js'
	import { G, getConsole }  from './privacy.js'
	import Common from './Common.svelte'
	// import Btn from './Btn.svelte'
	import Upload from './Upload.svelte'
	// import Radio from './Radio.svelte'

	const TEAMCRAFTLOGO = GBLSTATIC.TEAMCRAFT+"assets/logo_home.png"
	const UNIVERSALISLOGO = GBLSTATIC.UNIVERSALIS+"/i/universalis/universalis.png"
	const XIVAPILOGO = GBLSTATIC.XIVAPI+"/favicon.ico"
	const UNIVERSALISURL = GBLSTATIC.UNIVERSALIS+"market/"
	const UNIVERSALISAPIURL = GBLSTATIC.UNIVERSALIS+"api/v2/"
	const TEAMCRAFTURL = GBLSTATIC.TEAMCRAFT+"db/fr/item/"
	const ITEMSEARCHURL = GBLSTATIC.XIVAPI+
		"api/search?sheets=Item"+
		"&language=fr"+
		"&limit=60"+
		"&fields="+encodeURIComponent("Name,Icon,ItemSearchCategory.Name")+
		"&query=" // Query: encodeURIComponent('+Name~"bagues" +ItemSearchCategory>=1')
	let {
		GBLCTX,
		wsCallComponents,
		pageDesc,
		pseudo,
		pseudoGenre,
		pseudoList,
		page = $bindable(0),
		pageDone = $bindable([]),
		webAuth,
		localCtx
	} = $props()

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()

	onMount(async () => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique 
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes 
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// appelé apres mount du component
	async function init() {
		await getConf()
		await getEtat()
	}
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true 
		if (m.op=="S-enigme.etat" && m.o) getEtat(m.o)
		return false
	}

	// normalization des saisies persistantes 
	function normalizedSaisies(s) {
		s.debug ??= false
		s.defDateDeb ??= aaaammjjThhmm(Date.now())
		s.defDateDur ??= 1
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}
	
	// gestion ETAT et CONF etc...
	let CONF = $state(null)
	let etat = $state(null)
	let inputDisable = $state(null)
	let dspEnigme = $state(null)
	
	async function getConf() {
		let ret = await apiCall(APIROOT+"conf",'GET')
		if (ret.status==200) CONF = ret.o  
	}
	async function getEtat(wso) {
		let tEtat = null
		if (wso) 
			tEtat=wso
		else {
			let ret = await apiCall(APIROOT+"etat",'GET')
			if (ret.status==200) tEtat = ret.o  
		}
		// calcul des tris etc...
		etat = calcEtat(tEtat)
	}
	function recalcEtat() {
		rawConsole.log('recalcEtat')
		etat = calcEtat(Object.assign({},etat))
	}
	function calcEtat(tEtat) {
		// tri les enigmes des pseudos par date échéances 
		let pseudos = Object.keys(tEtat?.pseudos || etat?.pseudo || {})
		let parEcheance = []
		let nbEnigmes = 0
		let nbResolues = 0
		let flagDspFound = false
		pseudos.forEach( (p) => {
			let enigmes = tEtat.pseudos[p].enigmes
			if (!enigmes) return
			enigmes.forEach( (e) => {
				if (e.resoluePseudo) nbResolues++
				if (e.publieeDth && !e.resoluePseudo) nbEnigmes++
				if (e.idx == dspEnigme?.idx && !e.resolueDth) flagDspFound=true
				e.clientRefresh=0
			} )
			// tri des enigmes d'un pseudo
			enigmes.sort ( (pA,pB) => pA.echeanceDth - pB.echeanceDth)
			// ajoute dans le pool global
			parEcheance.push(... enigmes )
		})
		// tri les enigmes par échéances
		parEcheance.sort( (pA,pB) => pA.echeanceDth - pB.echeanceDth)
		tEtat.parEcheance = parEcheance
		tEtat.nbEnigmes = nbEnigmes
		tEtat.nbResolues = nbResolues
		if (!flagDspFound) dspEnigme = null // ferme le popup si l'enigme a disparue
		return tEtat
	}
	
	// recherche item XIVAPI
	const ITEMRESULTLBL = (()=>"P"+pageDesc.n + "_itemResult")()
	let itemResult = $state(loadIt(ITEMRESULTLBL,null))
	$effect(()=>storeIt(ITEMRESULTLBL,itemResult))
	async function xivapiSearchObject(nom) {
		let query = encodeURIComponent('+Name~"'+nom+'" +ItemSearchCategory>=1')
		// let query = encodeURIComponent('+Name~"'+nom+'"')
		let ret= await apiCallExtern(ITEMSEARCHURL+query,"GET",null,false)
		if (ret.status==200)
			return ret.results
		return []
	}
	async function defItemSearch() {
		if (saisies.defItemSearch) {
			let nom = saisies.defItemSearch.replaceAll('"',"'") // double quot en simple
			return xivapiSearchObject(nom)
		}
		return []
	}
	
	// recherche Universalis
	async function universalisPrix(id) {
		/* SEARCH PAR DATACENTERS 
		let tblP = []
		GBLCONST.DATACENTERS.forEach( (dc) => {
			tblP.push(apiCallExtern(UNIVERSALISAPIURL+dc.lbl+'/'+id,"GET",null,true))
		}) 
		tblP.push(apiCallExtern(UNIVERSALISAPIURL+'Europe/'+id,"GET",null,true))
		let results = await Promise.allSettled(tblP)
		*/
		let minPrix = +Infinity 
		let maxPrix = -Infinity
		let sMoy = 0
		let nMoy = 0
		// Search global sur region Europe
		let r = await apiCallExtern(UNIVERSALISAPIURL+'Europe/'+id,"GET",null,true)
		if (r.status==200) {
			if (r.minPrice < minPrix) minPrix = r.minPrice
			if (r.maxPrice > maxPrix) maxPrix = r.maxPrice
			if (r.currentAveragePrice) { sMoy += r.currentAveragePrice; nMoy++ }
		}
		return {
			status: r.status,
			minPrix: Math.round(minPrix/1000),
			maxPrix: Math.round(maxPrix/1000),
			moyPrix: Math.round(sMoy/nMoy/1000) }
	}
	
	// Validation de l'enigme 
	let rawImage = null
	let checkFlags = $state({})
	// 
	//Reset des data de definition denigme
	function defDateReset() {
		let nh = Math.round( (Date.now()+ 90*60000) / 3600000) * 3600000
		saisies.defDateDeb = aaaammjjThhmm(nh)
		saisies.defDateDur = 7
	}
	// verif des dates entre min/max de valeur yyyy-mm-ddThh:mm
	function dateValidCls(nDateTime) {
		let d = Date.now() + CONF.DTHMIN
		let f = Date.now() + CONF.DTHMAX
		let dth = new Date(nDateTime).valueOf()
		return ( (dth < d || dth > f) ) ? "button cRed" : "button"
	}
	function enigmeValidCls(txt) {
		if (!txt || txt?.length < CONF.NBCHARMIN || txt?.length > CONF.NBCHARMAX) return "cRed"
		return null
	}
	async function enigmeDefinir() {
		inputDisable = "disabled" // interdit la survalidation 
		enigmeDefinirTech()
		inputDisable = null // autorise les requetes 
	}
	async function enigmeDefinirTech() {
		// 
		let d = new Date(saisies.defDateDeb).valueOf()
		let f = d + saisies.defDateDur*24*3600000
		// vérif de l'énigme
		if (!Number.isInteger(d) || !Number.isInteger(f)) return displayInfo({titre:"Enigme non valide",body:["Tes dates sont incorrectes"]})
		if (d < Date.now() + CONF.DTHMIN) return displayInfo({titre:"Enigme non valide",body:["Le début doit être dans plus d'une heure"]})
		if (f > Date.now() + CONF.DTHMAX) return displayInfo({titre:"Enigme non valide",body:["La fin doit être dans moins de 30 jours"]})
		if (!saisies.defTypeGain) return displayInfo({titre:"Enigme non valide",body:["Tu dois indiquer un lot"]})
		if (!saisies.defGils && !itemResult?.row_id) return displayInfo({titre:"Enigme non valide",body:["Tu dois indiquer un objet ou des gils"]})
		if ( (saisies.defTexteEnigme||"").length < CONF.NBCHARMIN) return displayInfo({titre:"Enigme non valide",body:["Ton énigme doit comporter au moins 10 caractères"]})
		if ( (saisies.defTexteEnigme||"").length > CONF.NBCHARMAX) return displayInfo({titre:"Enigme non valide",body:["Ton énigme doit comporter moins de 1000 caractères"]})
		if ( saisies.defFlagImage && ! rawImage) return displayInfo({titre:"Enigme non valide",body:["Image non définie ou non valide"]})
		// normalize le body pour ne pas emcombrer le serveur de trucs inutiles
		let body = {
			debDth: d,
			finDth: f,
			typeGain: saisies.defTypeGain,
			gils: (saisies.defTypeGain=='g')? saisies.defGils : null,
			objetId: (saisies.defTypeGain=='o')? itemResult?.row_id : null,
			objetNom: (saisies.defTypeGain=='o')? itemResult?.fields?.Name : null,
			enigme: saisies.defTexteEnigme,
			flagImage: saisies.defFlagImage,
			typeRep: saisies.defTypeRep,
			repIndice: (saisies.defTypeRep=='t' && saisies.defRepIndice)? alphanum2placer(saisies.defRepT) : null,
			repT: (saisies.defTypeRep=='t')? saisies.defRepT:null,
			repX: (saisies.defTypeRep=='c')? saisies.defRepX:null,
			repY: (saisies.defTypeRep=='c')? saisies.defRepY:null,
			repI: (saisies.defTypeRep=='c')? saisies.defRepI:null,
			rawImage: (saisies.defFlagImage)? rawImage:null
		}
		if (saisies.defFlagImage) playVideo("S-GrandePeluche/GP-delai-publication")
		displayInfo({titre:"Définition de ton énigme en cours",body:[
			"Laisse moi quelques secondes...",
		]})
		// if (body.flagImage && body.rawImage) addNotification('Upload image sur CDN en cours...','lightgreen',5)
		let ret = await apiCall(APIROOT+"enigmeDefinir","POST",body)
		// if (body.flagImage && body.rawImage) addNotification('Upload termine','lightgreen',5)
		if (ret.status==200) {
			displayInfo({titre:"Enigme prête à être publiée",body:[
				"Vérifie ta nouvelle énigme dans la liste:",
				"⚠️Si elle te convient, clique sur 'Publier'",
				"⚠️Si elle ne convient pas, clique sur 'Supprimer'",
			]})
			epiqStep=50
		}
		else {
			displayInfo({titre:"Erreur",body:[
				"Erreur de définition de ton énigme",
				"⚠️Vérifie tous les paramètres",
			]})
			epiqStep=60
		} 
	} 
	async function enigmePublier(ev) {
		let p = ev.currentTarget.getAttribute("gpPseudo")
		let i = ev.currentTarget.getAttribute("gpIdx")
		if (!p || !i) throw new Error("manque gpPseudo ou gpIdx dans le DOM event")																			 
		let ret = await apiCall(APIROOT+"enigmePublier/"+p+"/"+i,"POST")
		// reponse via WS 
	}
	async function enigmeSupprimer(ev) {
		let p = ev.currentTarget.getAttribute("gpPseudo")
		let i = ev.currentTarget.getAttribute("gpIdx")
		if (!p || !i) throw new Error("manque gpPseudo ou gpIdx dans le DOM event")																			 
		let ret = await apiCall(APIROOT+"enigmeSupprimer/"+p+"/"+i,"DELETE")
		// reponse via WS															 
	}
	async function enigmeRepondre() {
		if (!dspEnigme) return
		if (dspEnigme.indice && (alphanum2placer(dspEnigme.maReponseT || "") != dspEnigme.indice) ) {
			displayInfo({ding:'prout-long', 
									 body:["Ta réponse n'est pas conforme à l'indice",
												 "Vérifie tes espaces, signe de ponctuation etc...",
												 "Attention aux iPhoneries: Certains caractères sont parfois remplacés sans te le dire",
									 ]
									})
			return
		}
		let rep = {
			idx: dspEnigme.idx,
			pseudo: dspEnigme.pseudo,
			T: dspEnigme.maReponseT,
			X: dspEnigme.maReponseX,
			Y: dspEnigme.maReponseY,
		}
		
		let ret = await apiCall(APIROOT+"enigmeRepondre/"+dspEnigme.pseudo+"/"+dspEnigme.idx,"POST",rep )
		switch (ret.status) {
			case 200: // OK, ferme la popup 
								displayInfo({
									ding: 'Applaudissements',
									body: [
										"Tu as trouvé la solution de l'énigme",
										"Pour recevoir ton lot, contacte " // +dspEnigme.pseudo
									]})
								dspEnigme = null
								break
			case 201: // mauvaise réponse maj du délai mais on reste avec le popup
								displayInfo({
									ding: 'explosion',
									body: [
										"Ce n'est pas la bonne réponse",
										"Tu dois attendre un peu pour en indiquer une nouvelle"
									]})
			case 202: // délai non respecé  
								saisies.reponseEcheanceDth = ret.o.reponseEcheanceDth
								dspEnigme = null
								break
		}
		// addNotification('SERVEUR REPONSE='+ret.status,"red")
	}
	async function enigmeOk(e) {
		let p = e.target.getAttribute('gpPseudo')
		let i = e.target.getAttribute('gpIdx')
		if (!p || !i) return
		let ret = await apiCall(APIROOT+"enigmeOk/"+p+"/"+i,"POST" )
		addNotification('SERVEUR REPONSE='+ret.status,"red")
	}
	async function adminParams() {
		epiqStep = 0 // pour éviter des saisies multiples
		const oBody = { whAnnonce: saisies.whAnnonce, whModo: saisies.whModo }
		let ret = await apiCall(APIROOT+"adminParams","POST",oBody)
		if (ret.status == 200) {
			displayInfo({body:["Paramètres d'administration modifiés"]})
		}
		else {
			displayInfo({back: "rouge", body:["Paramètres d'administration invalide"]})
		}
	}
</script>
<style>
	
</style>
{#snippet barreOptions(o)}
	<div>
		<button class={"button" + (epiqStep==0 && " cOrange" || "")}
			title="Revenir aux explications"
			onclick={() => epiqStep=0} >
			Explications
		</button>
		<button class={"button" + (epiqStep==50 && " cOrange" || "")}
			title="Voir les énigmes en cours"
			onclick={() => epiqStep=50} >
			Résoudre
		</button>
		<button class={"button" + (epiqStep==60 && " cOrange" || "")}
			title="Proposer une énigme"
			onclick={() => epiqStep=60} >
			Proposer
		</button>
		{#if saisies.debug}
			<button class="button" onclick={() => epiqStep=70} >Admin</button>
		{/if}
		<!-- <Common t="headerPage" pageDesc={pageDesc}  /> -->
	</div>
{/snippet}
{#snippet chrono(en)}
	{@const now=Date.now()}
	<span>
		{#if en.recuDth && en.donneDth}
			✅Terminé
		{:else if en.resolueDth}
			🏆Résolue
		{:else if now < en.debDth}
			{#if now < en.debDth - 48*3600000}
				⏳{jjmmhhmm(en.debDth)}
			{:else}
				⏳<countdown dth={en.debDth} oncdTimeout={()=>en.clientRefresh++} use:countDownInit></countdown>
			{/if}
		{:else if now < en.finDth}
			{#if now < en.finDth - 48*3600000}
				⏱️{jjmmhhmm(en.finDth)}
			{:else}
				⏱️<countdown dth={en.finDth} oncdTimeout={()=>en.clientRefresh++} use:countDownInit></countdown>
			{/if}
		{/if}
	</span>
{/snippet}
{#snippet descEnigme(en,hide)}
	{#key en.clientRefresh}
		{@const affDetail = (en.pseudo==pseudo) || (Date.now() >= en.debDth && en.publieeDth) || saisies.debug }
		{#if en.pseudo==pseudo || en.publieeDth}
			<div class="papier" style="border: 0.1em dotted yellow; margin-bottom: 1em">
				<div>
					{@render chrono(en)}
					{#if hide!="p"}👼{en.pseudo}{/if}
					{#if en.typeGain=="o"}🎁{en.objetNom}{/if}
					{#if en.typeGain=="g"}💰{en.gils}{/if}
				</div>
				<!-- Etat  -->
				<div>
					{#if en.recuDth && en.donneDth}
						<div>Enigme soldée, {en.pseudo} à donné le lot à {en.resoluePseudo}</div>
					{:else if en.resolueDth}
						<div>Enigme résolue par {en.resoluePseudo} {jjmmhhmmss(en.resolueDth)}</div>
					{/if}
					{#if en.resolueDth && !en.donneDth && pseudo==en.pseudo}
						<div class="blinkMsg cRed">Tu dois confirmer avoir donné le lot à {en.resoluePseudo}</div>
					{/if}
					{#if en.resolueDth && !en.recuDth && pseudo==en.resoluePseudo}
						<div class="blinkMsg cRed">Tu dois confirmer avoir reçu le lot de {en.pseudo}</div>
					{/if}
				</div>
				<div>
					<!-- Si pas encore le début et publiée -->
					{#if Date.now() < en.debDth && en.publieeDth}
						{#if pseudo == en.pseudo}
							<div class="cOrange">Ton énigme sera visible par les autres joueurs à son heure de début</div>
						{:else}
							<div class="cOrange">Cette énigme est encore masquée par une brume éthérée</div>
						{/if}
					{:else if !en.publieeDth && pseudo == en.pseudo}
						<div class="cRed blinkMsg">Tu n'as pas encore publié cette énigme</div>
					{/if}
				</div>
				{#if en.CDN && affDetail}
					<img class="parchemin" src={urlCdnAI+en.CDN} alt="" style="width: 30%; float:right" />
				{/if}
				{#if affDetail}
					<div >
						<pre style="margin: 0; max-height: 15em; overflow: auto">{en.enigme}</pre>
						{#if en.indice}<pre style="margin: 0; max-height: 5em; overflow: auto">{en.indice}</pre>{/if}
					</div>
				{/if}
				<!-- boutons de publication -->
				{#if en.pseudo == pseudo}
					<!-- c'est mon enigme -->
					{#if en.resolueDth && !en.donneDth}
						<button class="button" gpPseudo={en.pseudo} gpIdx={en.idx} onclick={enigmeOk}>
							✅Lot donné
						</button>
					{/if}
					{#if !en.publieeDth}
						<button class="button blinkFlag cRed" gpPseudo={en.pseudo} gpIdx={en.idx} onclick={enigmePublier}>
							📢Publier
						</button>
					{/if}
					{#if !en.resolueDth}
						<button class="button" gpPseudo={en.pseudo} gpIdx={en.idx} onclick={enigmeSupprimer}>
							🗑️Supprimer
						</button>
					{/if}
				{:else} 
					<!-- ce n'est pas mon enigme -->
					{#if en.resolueDth && !en.recuDth && en.resoluePseudo==pseudo }
						<button class="button" gpPseudo={en.pseudo} gpIdx={en.idx} onclick={enigmeOk}>
							✅Lot récupéré
						</button>
					{/if}
					{#if !en.resolueDth && affDetail}
						<button class="button" onclick={()=>dspEnigme=en}>
							🔬Résoudre
						</button>
					{/if}
				{/if}
				<!-- bouton d'admin -->
				{#if saisies.debug}
					<span class="adminCadre">
						ADMIN: #{en.idx}
						<button class="button" onclick={()=>dspEnigme=en}>🆗FORCE</button>
						<button class="button" gpPseudo={en.pseudo} gpIdx={en.idx} onclick={enigmeSupprimer}>🗑️DELETE</button>
					</span>
				{/if}
				<div style="clear:both"></div>
			</div>
		{/if}
	{/key}
{/snippet}
{#snippet rubriques()}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore (element_invalid_self_closing_tag -->
	<div>
		<hr/> 
		<div>Informations complémentaires:</div>
		<div>
			<div role="button" tabindex=0 onclick={()=>epiqStep=11}>👉Réponse textuelle</div>
			<div role="button" tabindex=0 onclick={()=>epiqStep=12}>👉Réponse par coordonnées</div>
			<div role="button" tabindex=0 onclick={()=>epiqStep=13}>👉Récupérer le lot d'une énigme</div>
			<div role="button" tabindex=0 onclick={()=>epiqStep=21}>👉Proposer une enigme</div>
		</div>
	</div>
{/snippet}
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_missing_attribute  -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore (element_invalid_self_closing_tag -->
<div>
	{#if CONF && etat && (webAuth.privilege & CONF.PRIVMSK) } 
		<div class="adminCadre" style="font-size: 0.8em">
			<div>
				Admin: {pageDesc.n}/{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep || 0} />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONF) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<input type="button" value="DELETEALL" onclick={async () => { if (confirm("tout supprimer?")) { await apiCall(APIROOT+"all","DELETE"); page=0 }}} />
				<label><input type="checkbox" bind:checked={saisies.debug} />options admin</label>
			</div>
		</div>
	{/if}
	{@render barreOptions(null)}

	{#if epiqStep==0}
		<div class="cards-section reveal3" {@attach scrollPageToTop}>
			<div class="card-wide">
				Bienvenue dans l'énigme dont tu es {G(pseudoGenre,"le héros","l'héroïne")}.
				<div class="br"/>
				<div>Tu peux résoudre des énigmes, en proposer...</div>
				<div>Pour cela, utilise les boutons en haut de page.</div>
				<div class="br"/>
				<div>Si tu es {G(pseudoGenre,"le premier","la première")} à m'indiquer la solution à une énigme,
					tu gagnes le lot indiqué et
					tu pourras le récupérer IG auprès de l'auteur de l'énigme.
					Prenez alors rendez-vous via MP discord ou via un salon de discussion.</div>
				<div>‼️Après cet échange, auteur et gagnant devront me confirmer avoir procédé à la remise du lot.</div>
				{@render rubriques()}
			</div>
		</div>
	{/if}
	{#if epiqStep==11}
		<div class="cards-section reveal3" {@attach scrollPageToTop}>
			<div class="card-wide">
				La solution d'une énigme peut être un mot, un nom, un lieu ou une petite phrase.
				La différence majuscules/minuscule est ignorée, mais pas les autres caractères (y compris espaces, accents ou ponctuations).
				L'auteur de l'énigme peut indiquer un "indice" facilitant la saisie de la réponse, en particulier si
				elle contient des espaces, de la ponctuation ...
				{@render rubriques()}
			</div>
		</div>
	{/if}
	{#if epiqStep==12}
		<div class="cards-section reveal3" {@attach scrollPageToTop}>
			<div class="card-wide">
				La solution d'une énigme peut être des coordonnées de boussole (X et Y).
				L'auteur de l'énigme indique une "tolérance" autour de ces coordonnées.
				Par exemple, si la bonne solution est X: 1.5 avec une tolérance de 0.1, la réponse est valide entre 1.4 et 1.6.
				{@render rubriques()}
			</div>
		</div>
	{/if}
	{#if epiqStep==13}
		<div class="cards-section reveal3" {@attach scrollPageToTop}>
			<div class="card-wide">
				Le gagnant et l'auteur de l'énigme doivent se rencontrer IG pour la remise du lot de l'énigme.
				Après la remise du lot, gagnant et auteur doivent revenir me voir et, sur la liste des énigmes à résoudre,
				me confirmer l'échange.
				{@render rubriques()}
			</div>
		</div>
	{/if}
	{#if epiqStep==21 && CONF}
		<div class="cards-section reveal3" {@attach scrollPageToTop}>
			<div class="card-wide">
				Une énigme comporte toujours un lot: Des gils ou un objet.
				<br/>
				Une énigme commence au minimum {CONF.DTHMIN/60000} minutes après sa définition par son auteur.
				<br/>
				Elle dure entre 12H et 15 jours et disparait automatiquement de mon grimoire si la solution n'a pas été trouvée.
				<br/>
				Elle comporte un texte de quelques phrases au maximum.
				<br/>
				L'auteur d'une énigme peut y associer une image.
				<br/>
				⚠️N'oublie pas de vérifier l'orthographe de ton énigme et son niveau de difficulté par AI:
				(bouton orthographe et bouton facilité).
				Une énigme peut paraître compliquée, mais évidente par scraping d'une AI. 
				{@render rubriques()}
			</div>
		</div>
	{/if}
	{#if epiqStep==22 && CONF}
		<div class="cards-section reveal3" {@attach scrollPageToTop}>
			<div class="card-wide">
				Une énigme comporte toujours un lot: Des gils ou un objet.
				<br/>
				Une énigme commence au minimum {CONF.DTHMIN/60000} minutes après sa définition par son auteur.
				<br/>
				Elle dure entre 12H et 15 jours et disparait automatiquement de mon grimoire si la solution n'a pas été trouvée.
				<br/>
				Elle comporte un texte de quelques phrases au maximum.
				<br/>
				L'auteur d'une énigme peut y associer une image.
				{@render rubriques()}
			</div>
		</div>
	{/if}
	{#if epiqStep==50 && etat}
		<div class="cards-section reveal3" use:scrollPageToTop>
			<div class="card-wide">
				Grimoire des énigmes
				<div class="petit">
					A résoudre: {etat.nbEnigmes-etat.nbResolues}
					Résolues: {etat.nbResolues}
				</div>
				<hr/>
				<!--
				<div class="cPointer" onclick={()=> saisies.triEnigmes = (saisies.triEnigmes=="d")? null:"d"}>
					{#if saisies.triEnigmes=="d"}👇{:else}👉{/if}Par date échéance
				</div>
				{#if saisies.triEnigmes=="d"}
				-->
				<div class="papier">
					{#each etat.parEcheance as en,i}
						{@render descEnigme(en)}
					{/each}
				</div>
				<!--
				{/if}
				<div class="cPointer" onclick={()=> saisies.triEnigmes = (saisies.triEnigmes=="p")? null:"p"}>
					{#if saisies.triEnigmes=="p"}👇{:else}👉{/if}Par pseudo
				</div>
				{#if saisies.triEnigmes=="p"}
					<div class="card-wide papier">
						{#each Object.keys(etat.pseudos) as p}
							{#if saisies.triPseudo==p}
								<fieldset>
									<legend onclick={()=>saisies.triPseudo=null}>{p}❌</legend> 
									{#each etat.pseudos[p].enigmes as en}
										{@render descEnigme(en,"p")}
									{/each}
								</fieldset>
							{:else}
								<div class="cPointer" onclick={()=> saisies.triPseudo = (saisies.triPseudo==p)? null:p}>
									{#if saisies.triPseudo==p}👓{:else}👼{/if}{p}
								</div>
							{/if}
						{/each}
					</div>
				{/if}	
				-->
			</div>
		</div>
	{/if}
	{#if epiqStep==60 && etat && CONF}
		{@const nbEnigmes = etat.pseudos[pseudo]?.enigmes?.length || 0}
		{@const nbPseudos = Object.keys(etat.pseudos).length}
		{@const minDth = Date.now()+CONF.DTHMIN}
		{@const maxDth = Date.now()+CONF.DTHMAX}
		{@const minDate = aaaammjjThhmm(minDth)}																							
		{@const maxDate = aaaammjjThhmm(maxDth)}	
		{#if !saisies.debug && Date.now()<pageDesc.publicDth}
			<div class="cards-section reveal3" use:scrollPageToTop>
				{pseudo}, tu es {(pseudoGenre,"impatient","impatiente")}...
				<br/>
				La publication d'énigme personnelle sera disponible dans quelques jours.
				<br/>
				Elle est actuellement réservée aux administrateurs.
			</div>
		{:else}
			<div class="cards-section reveal3" use:scrollPageToTop>
				<div class="card-wide">
					{#if nbEnigmes >= CONF.NBENIGMEMAX}
						<div>
							⚠️Tu as défini le maximum d'énigmes ({CONF.NBENIGMEMAX}).
							<br/>
							Si tu souhaites proposer une nouvelle énigme, il faut en supprimer.
						</div>
					{:else if nbPseudos >= CONF.NBPSEUDOMAX}
						<div>
							⚠️Il y a déjà {CONF.NBPSEUDOMAX} personnes ayant définies une ou plusieurs énigmes.
							<br/>
							Tu ne peux proposer une énigme actuellement.
						</div>
					{:else}
						<div>👍Tu peux définir une énigme (reste {CONF.NBENIGMEMAX-nbEnigmes})</div>
						<fieldset class="fieldset papier">
							<legend>
								Timing de l'énigme
							</legend>
							<span onclick={defDateReset}>🔃</span>
							<input class={dateValidCls(saisies.defDateDeb)}
								type="datetime-local"
								required bind:value={saisies.defDateDeb} min={minDate} max={maxDate} />
							<select class="button" bind:value={saisies.defDateDur}>
								{#if saisies.debug}
									<option value="0.00694">1 min (test)</option>
								{/if}
								<option value="0.5">12 heures</option>
								<option value="1">24 heures</option>
								{#each Array(15) as _,i}
									<option value={i+2}>{i+2} jours</option>
								{/each}
							</select>
							<span class="petit">
								➜{jjmmhhmm( (new Date(saisies.defDateDeb).valueOf()) + (saisies.defDateDur*24*3600000) )}
							</span>
							{#if saisies.debug}
								<button class="button cRed" 
									onclick={ ()=> {saisies.defDateDeb=aaaammjjThhmm(Date.now()+120000); saisies.defDateDur="0.5"} } >
									Instant
								</button>
							{/if}
						</fieldset>
						<fieldset class="fieldset papier">
							<legend>Lot</legend>
							<div>
								<select class="button" bind:value={saisies.defTypeGain}>
									<option value="g">💰Des Gils</option>
									<option value="o">🎁Un objet</option>
								</select>
							</div>
							{#if saisies.defTypeGain=='g'}
								<div>
									<input type="number" min={CONF.GILSMIN} max={CONF.GILSMAX} bind:value={saisies.defGils} />🪙
									{#if saisies.defGils < CONF.GILSMIN}
										<span class="petit">⚠️Aussi peu, ne te moques pas!</span>
									{:else if saisies.defGils > CONF.GILSMAX}
										<span class="petit">⚠️Tu ne peux pas offrir autant de gils</span>
									{/if}
								</div>
							{:else if saisies.defTypeGain=='o'}
								<div>
									{#if itemResult}
										{@const g = itemResult}
										<div>
												<span class="button" onclick={()=>itemResult=null} >
													<img style="width: 1em; heigth:1em; vertical-align: middle; border: 0.1em solid yellow"
														src={GBLSTATIC.XIVAPI+"api/asset/"+g.fields.Icon.path+"?format=png"} />
													{g.fields.Name}
													<span type="button" value="˅" >˅</span>
												</span>
												<span class="petit">
													{#await universalisPrix(g.row_id)}
														⌛
													{:then r}
														{#if r.status==200 && r.minPrix != Infinity && r.moyPrix}
															<div class="petit" style="display:inline-block" gpHelp="Estimation du prix d'achat à l'HV">
																🪙{r.minPrix}K-{r.moyPrix}K
															</div>
														{:else if r.status==200}
															HV: Pas en vente
														{:else}
															🚨 Erreur Universalis {r.status}
														{/if}
													{:catch e}
														🚨 Erreur Universalis {e}
													{/await}
												</span>
												<button class="button" title="Teamcraft"
													onclick={markClick} gpLink={TEAMCRAFTURL+g.row_id}>
													<img style="height: 1em; vertical-align: baseline" src={TEAMCRAFTLOGO} />
												</button>
												<button class="button" title="Universalis"
													onclick={markClick} gpLink={UNIVERSALISURL+g.row_id}>
													<img style="height: 1em; vertical-align: baseline" src={UNIVERSALISLOGO} />
												</button>
										</div>
									{:else}
										<!-- il y a des selections... -->
										<div>
											<div>
												<div>
													<input class="button" type="text" bind:value={saisies.defItemSearch}
														placeholder="Rechercher..." >
													{#if saisies.defItemSearch && saisies.defItemSearch.length>3}
														<span style="position: relative">
															<div class="papier petit selectCadre"
																style="position: absolute; padding: 0.3em; max-height: 6em; width:70vw; overflow: auto">
																{#await defItemSearch(saisies.defItemSearch)}
																	⌛Recherche en cours
																{:then r}
																	<div>
																		{#if r.length == 0 && saisies.defItemSearch}⚠️Rien trouvé{/if}
																		{#each r as g}
																			<div onclick={()=>itemResult=g}>
																				<img style="width:1em; vertical-align: middle; border: 0.1em solid yellow"
																					src={GBLSTATIC.XIVAPI+"api/asset/"+g.fields.Icon.path+"?format=png"} />
																				{g.fields.Name}
																			</div>
																		{/each}
																	</div>
																{:catch e}
																	🚨 Erreur XIVAPI: {e}
																{/await}
															</div>
														</span>
													{/if}
													<input type="button" value="↺" onclick={()=>saisies.defItemSearch=null} />
												</div>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</fieldset>
						<fieldset class="fieldset papier">
							<legend>Enigme</legend>
							<div class="petit">
								<span onclick={markClick} class="gpHelp cOrange"
									gpHelp="Ces fonctions utilisent l'AI {GBLCONST.CHOIXAI[localCtx.choixAI].lbl}, tu peux modifier l'AI à utiliser dans ton profil">
									AI
									<sup>(i)</sup>
								</span>
								<span class="button gpLink" 
									gpLink={GBLCONST.CHOIXAI[localCtx.choixAI].url+"?q="+
													encodeURIComponent("Dans l'univers du jeu FF14, corrige l'orthographe de la phrase suivante: "+saisies.defTexteEnigme)}>
									Orthographe?
								</span>
								<span class="button gpLink"
									gpLink={GBLCONST.CHOIXAI[localCtx.choixAI].url+"?q="+
													encodeURIComponent("Dans l'univers du jeu FF14, peux-tu résoudre l'énigme suivante: "+saisies.defTexteEnigme)}>
									Difficulte?
								</span>
								<!--
								<span class="button gpLink" gpHelp="Pas encore disponible">
									Conformité?
								</span>
								<br/>
								-->
							</div>
							<!-- <input type="text" bind:value={saisies.defTexteEnigme} size=80/> -->
							<textarea class={enigmeValidCls(saisies.defTexteEnigme)}
								style="width:100%; height: 8em" bind:value={saisies.defTexteEnigme}></textarea>
							<br/>
							<div>
								<label>
									<input type="checkbox" bind:checked={saisies.defFlagImage} />
									Avec image (max 3Méga)
								</label>
							</div>
							{#if saisies.defFlagImage}
								<div style="width:50%">
									<Upload cbImageRaw={(d)=>rawImage=d}/>
								</div>
							{/if}
						</fieldset>
						<fieldset class="fieldset papier">
							<legend>Réponse</legend> 
							<select class="button" bind:value={saisies.defTypeRep}>
								<option value="c">🗺️Coordonnées</option>
								<option value="t">📝Texte</option>
							</select>
							{#if saisies.defTypeRep=='t'}
								<div>
									<div><input bind:value={saisies.defRepT} style="width: 100%" size=80/></div>
									<div>
										<label><input type="checkbox" bind:checked={saisies.defRepIndice} />Avec indice</label>
										<sup gpHelp="Indique en majuscules les lettres que tu souhaites donner comme indice, les caractères accentués ou non alphanumériques sont toujours affichés dans l'indice">(i)</sup>
									</div>
									{#if saisies.defRepIndice}
										<div>{alphanum2placer(saisies.defRepT)}</div>
									{/if}
								</div>
							{:else if saisies.defTypeRep=='c'}
								<div>
									X:<input class={(saisies.defRepX<0 || saisies.defRepX>CONF.COORDMAX)? "cRed":""}
											type="number" min=0 max=99.9 step=0.1 bind:value={saisies.defRepX} />
									Y:<input class={(saisies.defRepY<0 || saisies.defRepY>CONF.COORDMAX)? "cRed":""}
											type="number" min=0 max=99.9 step=0.1 bind:value={saisies.defRepY} />
									≅:<input class={(saisies.defRepI<0 || saisies.defRepI>CONF.INCERTMAX)? "cRed":""}
											type="number" min=0 max=1.0 step=0.1 bind:value={saisies.defRepI} />
									<sup gpHelp="X et Y sont les coordonnées de boussole, ≅ est la tolérance de la position (ex: 0.2, min 0, max {CONF.INCERTMAX})">(i)</sup>
								</div>
							{/if}
						</fieldset>
						<fieldset class="fieldset papier">
							<legend>Validation</legend>
							<div class="petit">
								⚠️Ta réponse ou les coordonnées de ta réponse ne seront plus jamais affichées.
								<br/>
								Vérifie bien leurs valeurs avant d'ajouter ton énigme.
								<br/>
								Après avoir ajouté ton énigme, tu pourras la publier ou la supprimer.
							</div>
							<button class="button" {inputDisable} onclick={enigmeDefinir}>
								Ajout de ton énigme
							</button>
							<div class="petit cOrange">
								⚠️Si ton texte ou ton image est inapropriée, tu seras banni{G(pseudoGenre,"","e")}.
							</div>
						</fieldset>
					{/if}
				</div>
			</div>
		{/if}	
	{/if}
	
	{#if epiqStep==70 && etat}
		<div class="reveal2" use:scrollPageToTop>
			Admin:
			<br/>
			Webhook d'annonce:
			<input type="url" bind:value={saisies.whAnnonce} placeholder="https://discord..." />
			<br/>
			Webhook modération:
			<input type="url" bind:value={saisies.whModo} placeholder="https://discord..." />
			<br/>
			<button class="button cRed" onclick={adminParams}>
				Modifier les paramètres d'administration
			</button>
		</div>
	{/if}

	{#if dspEnigme}
		<div class="popupCadre papier">
			<div class="close" onclick={dspEnigme=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						{@render chrono(dspEnigme)}
						👼{dspEnigme.pseudo}
						{#if dspEnigme.typeGain=="o"}🎁{dspEnigme.objetNom}{/if}
						{#if dspEnigme.typeGain=="g"}💰{dspEnigme.gils}{/if}
					</div>
					<hr/>
					<fieldset class="fieldset" >
						<legend>Réponse:</legend>
						<!-- <div>prout</div> -->
						{#if dspEnigme.typeRep=="t"}
							<div><pre>{dspEnigme.indice}</pre></div>
							<input style="width:100%" type="text" bind:value={dspEnigme.maReponseT}/>
						{/if}
						{#if dspEnigme.typeRep=="c"}
							<div>Coordonnées boussole à ±{dspEnigme.repI}</div>
							X:<input style="width:4em" type="number" placeholder="x.x" min=0 max={CONF.COORDMAX} step=0.1 bind:value={dspEnigme.maReponseX}/>
							Y:<input style="width:4em" type="number" placeholder="y.y" min=0 max={CONF.COORDMAX} step=0.1 bind:value={dspEnigme.maReponseY}/>
						{/if}
						<div>
							{#if saisies.reponseEcheanceDth > Date.now()}
								<span class="cRed" onclick={markClick} gpHelp="Délai avant prochaine possibilité de réponse">
								⏳<countdown dth={saisies.reponseEcheanceDth}
									 oncdTimeout={()=>saisies.reponseEcheanceDth=0}></countdown>
								</span>
							{:else}
								<button class="button" onclick={enigmeRepondre} >C'est ma réponse</button>
							{/if}
							{#if saisies.debug}
								<button class="adminCadre button" onclick={enigmeRepondre} >Admin BypassTimer</button>
							{/if}
						</div>
					</fieldset>
					<fieldset class="fieldset" >
						<legend>Enigme:</legend>
						<div><pre style="max-height:6em; overflow:auto">{dspEnigme.enigme}</pre></div>
					</fieldset>
					{#if dspEnigme.CDN}
						<fieldset class="fieldset" >
							<legend>Image:</legend>
							<img src={urlCdnAI+dspEnigme.CDN} alt="" style="width:100%"/>
						</fieldset>
					{/if}
					{#if saisies.debug}<pre>{JSON.stringify(dspEnigme,null,1)}</pre>{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
<!-- {@render barreOptions(null)} -->

<!-- P110.svelte -->
