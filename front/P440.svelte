<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, apiCall, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd, countDownTo, hhmmssms, isDistance, countDownInit,
					 getEpsilon, jjmmhhmmss
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
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

	const PAGEEPIQLBL= "P"+pageDesc.n+"_epiqStep"
	const PAGESAISIESLBL = "P"+pageDesc.n + "_saisies"
	const APIROOT = '/'+pageDesc.rootName+'/'
	const FAILTIMER = 1* 60000
	const VIDEOFINALE = "commons/videoafaire"	
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
	function init() { console.log('**init 440**'); getConfig(); getEtat() }
	
	// appelé apres unmount du component
	function reset() { console.log('**reset 440**')	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true 
		if (m.op=='orthocomposants.etat' && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.admGoStep??=0
		s.debug??=false
		// s.noTimer??=false
		s.failEcheance??=0 // dth du dernier fail
		s.elixirEcheance??=0 
		// retur saisies normalized
		return s
	}

	// appelé lors d'un changement de step de l'épique 
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// calcul d'échance pour question selon les premiers découverts
	let questionEcheance = $state(Date.now()+24*3600*1000)
	function calcQuestionEcheance(premierNb,premierDthMax) {
		let delai
		switch(premierNb) {
			case  0: delai = 1; break
			case  1: delai = 15*60000; break
			case  2: delai = 30*60000; break
			case  3: delai = 60*60000; break
			case  4: delai = 120*60000; break
			case  5: delai = 180*60000; break
			default: delai = 240*60000; break
		}
		// notimer ?
		// if (saisies.noTimer) delai = 1
		return questionEcheance=Math.max(premierDthMax+delai,saisies.failEcheance)
	}
	// chargement config du challenge
	let CONFIG = $state(null)
	async function getConfig(msgWs) {
		let ret = msgWs || await apiCall(APIROOT+'config');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"config", ret.status)
		CONFIG = ret.o
	}
	// chargement etat du challenge
	let etat = $state(null)
	let etatVideo=false // si video finale affichée
	let dspQuestion=$state(null) // option d'action sur un element
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall(APIROOT+'etat');
		if (ret.status != 200) return console.error("erreur sur",APIROOT,"etat", ret.status)
		recalcEtat(ret.o)
	}
	async function recalcEtat(tEtat) {
		// complete l'etat 
		tEtat.nbQuestionsEnCours=0 // nombre de runes actuelle identifiées par le pseudo
		tEtat.premierNb=0 // nombre de runes trouvée initialement par le pseudo
		tEtat.premierDthMax=0 // max du dth des decouvertes en premier
		tEtat.questions.forEach( (q)=> {
			// si question nn disponible
			if (q.pseudo==pseudo)	tEtat.nbQuestionsEnCours++
			// si question resoluees en premier, calcul du nb et du dthMax
			if (q.premierPseudo==pseudo) {
				tEtat.premierNb++
				if (q.premierDth > tEtat.premierDthMax) tEtat.premierDthMax=q.premierDth
			}	
		})
		// calcul du dth du possible pour question
		calcQuestionEcheance(tEtat.premierNb,tEtat.premierDthMax)

		tEtat.composantsNb = 0
		tEtat.composants.forEach( (c)=> {
			if (c.vernisPseudo) {c.cls="vernis"; c.txt=c.pseudoVernis}
			else if (c.elixirPseudo) {c.cls="stars elixir"; c.txt=c.elixirPseudo; tEtat.composantsNb++}
			else if (tEtat.elixirsNb) {c.cls="usage"; c.txt=" "}
			else { c.cls="vierge"; c.txt=" "}
		})

		// calcul challenge termine
		tEtat.challengeTermine = CONFIG && tEtat.composantsNb==CONFIG.SIZE*CONFIG.SIZE
		
		etat=tEtat

		// dspQuestion=null // pour eviter les conflits ???
		if (etat.challengeTermine && !etatVideo) {
			etatVideo=true
			playVideo(VIDEOFINALE)
		}	
	}

	function displayQuestion(i) {
		if (etat.challengeTermine) {
			displayInfo({titre: "Challenge terminé",body:[{txt:"Revoir la vidéo", cb: ()=>playVideo(VIDEOFINALE)}]})
			return
		}
		dspQuestion=etat.questions[i]
		if (saisies.debug) displayObject(dspQuestion)
	}
	function reloadDspQuestion() {
		addNotification("reloadDspQuestion a faire")
		dspQuestion=null
	}
	// fait une propositionQuestion pour l'objet i
	async function propositionQuestion(i) {
		console.log("propositionQuestion:"+i+" l:"+saisies.pL+" px:"+saisies.pX+" py:"+saisies.pY)
		saisies.propositionQuestionDth = Date.now()
		dspQuestion=null
		// vérif de la solution en local
		let o = CONFIG.objets[i]
		if (o.l==saisies.pL && isDistance(saisies.pX,saisies.pY,o.x,o.y,0.1) ) {
			let ret= await apiCall(APIROOT+"propositionQuestion/"+i,"POST",{l:saisies.pL, x:saisies.pX, y:saisies.pY})
			if (ret.status==200) playVideo("orthocomposants/orthocomposants-1")
		}
		else {
			saisies.failEcheance = Date.now()+ FAILTIMER
			calcQuestionEcheance(etat.premierNb,etat.premierDthMax)
			displayInfo({
				titre:"Mauvaise identification",
				img: "commons/fail.gif",
				body:[
					"Je ne vois pas d{'objet permettant l'extraction d'élixir à cet endroit:",
					"("+CONFIG.lieux[saisies.pL].lbl+","+saisies.pX+","+saisies.pY+")",
					{cls:"info", txt:"⚠️Superpose exactement ton personnage sur le composant et indique les coordonnées exactes de ta boussole"}
				],
			})
		}
	}

	let dspComposant=$state(null)
	function displayComposant(i) {
		if (etat.challengeTermine) {
			displayInfo({titre: "Challenge terminé",body:[{txt:"Revoir la vidéo", cb: ()=>playVideo(VIDEOFINALE)}]})
			return
		}
		dspComposant=etat.composants[i]
		if (saisies.debug) displayObject({composant: dspComposant, map: CONFIG.MAP[i] })
	}
	// fait une propositionQuestion pour l'objet i 
	async function propositionComposant(i) {
		console.log("propositionComposant:"+i)
		saisies.elixirEcheance = Date.now() + CONFIG.TIMERELIXIR
		dspComposant=null
		let ret=await apiCall(APIROOT+"propositionComposant/"+i,"POST")
		switch(ret.status) {
			case 200:
				playVideo("orthocomposants/orthocomposants-2")
				break
			case 201: 
				addNotification("Pas assez d'élixir selon le serveur","yellow",30)
				break
		}
	}
	
	// calcul des résultsts
	function calcResultats() {
		let res={ byPseudo: {} }
		etat.elts.forEach( (e) => {
			if (e.trouvePseudo) {
				res.byPseudo[e.trouvePseudo] ??= { nbTrouve: 0}
				res.byPseudo[e.trouvePseudo].nbTrouve++
			}
		})
		dspResultats = res
	}

	
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bungee+Tint&display=swap');
  .runeT {
    padding: 0; border: 5px inset green; height: 1.9em;
		background-color: yellow;
		cursor: pointer;
    font-family: "Bungee Tint"; color: green; font-size:1.1em; font-weight: bold;
  }
  .runeNT {
    padding: 0; border: 5px outset green;
		background-color: green;
		cursor: pointer;
    font-family: "Bungee Tint"; color: green; font-size:1.1em; font-weight: bold;
  }
	.resultats {
		border: 2px solid white;
	}
	.table {
		background-image: url('https://cdn.adhoc.click/V10a/ff-10/Pharao.png');
		background-size: 100% 100%; background-position: center; 
		width: 100%; margin: auto; padding: 0; border: 0;
		border-spacing: 0; border-collapse: collapse;
		border: 0; text-align: center; cursor: pointer;
	}
	.tbody { }
	.tr { }
	td { height: 2em;font-size:0.7em; text-align:top; border: 1px solid white }
	.vernis { width: 16.6%; opacity:80%; height: 2em}
	.elixir {	width: 16.6%; font-size:0.7em; aspect-ratio: 2}
	.usage { width: 16.6%; color: green; height: 2em}
	.vierge { width: 16.6%; color: red; height: 2em}
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
				<input type="button" value="resetAll" onclick={() => confirm("Tout effacer?") && apiCall(APIROOT+'resetAll','DELETE') } />
				<input type="button" value="setAll" onclick={() => confirm("Tout valider?") && apiCall(APIROOT+'setAll','DELETE') } />
				<input type="button" value="ReserTimerQuestion" onclick={() => questionEcheance=1 } />
				<input type="button" value="ReserTimerCompo" onclick={() => saisies.elixirEcheance=1 } />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
				<!-- <label><input type="checkbox" bind:checked={saisies.noTimer} />NoTimer</label> -->
			</div>
		</div>
	{/if}
	<Common t="popupDebutChallenge" pageDesc={pageDesc} />
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
	</div>

	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Le Pharao d'Eorzéa poursuit son voyage vers le Point de Lagrange.
			<br/>
			Nous construisons les Bases sur Eorzéa et des Pharao à la chaîne.
			<div class="br"/>
			Il nous faut maintenant construire un Pharao pour l'Ortho-Temps: l'Ortho-Pharao.
			<br/>
			<Btn bind:refStep={epiqStep} step=20 val="Explique-moi!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Le Pharao qui sera envoyé dans l'Ortho-Temps
			nécessite les mêmes composants que celui d'Eorzéa,
			mais pour pouvoir envoyer Pharao dans l'ortho-temps, 
			il faut	phaser chacun des composants.
			<br/>
			Ceci peut être fait en utilisant des molécules d'élixir de conversion de phase:
			Ces molécules peuvent être extraites de certains objets.
			<br/>
			Le Grand Grimoire des Savoirs les mentionnent sous forme d'énigmes.
			<br/>
			Je pense que tous ces objets se trouvent dans les chambres
			de la maison de CL de Kikiadoc.
			<br/>
			Je compte sur toi pour les trouver et en extraire des molécules d'élixir.
			<br/>
			Phaser un composant nécessite une 
			<a target="_blank" href="https://fr.wikipedia.org/wiki/Quantit%C3%A9_de_mati%C3%A8re">
				quantité très variable de molécules d'élixir
			</a>
			(entre 2000000 et 9000000
			<span class="infoLink" onclick={markClick} gpHelp="rmol est une mesure de la quantité de matière selon le système internationnal, voir en bas de page pour des détails" >
				rmol
			</span>)
			selon la complexité du composant.
			<br/>
			Hélas, les molécules d'élixir sont instables:
			elles se décomposent au fil du temps.
			<br/>
			<Btn bind:refStep={epiqStep} step=80 val="J'ai compris" />
			<div class="info">
				<hr/>
				(ℹ) rmol est une unité de mesure du
				<a target="_blank" href="https://fr.wikipedia.org/wiki/Syst%C3%A8me_international_d%27unit%C3%A9s">
					Système international
				</a>.
				<br/>
				Elle est composés
				de l'unite de base, la
				<a target="_blank" href="https://fr.wikipedia.org/wiki/Mole_(unit%C3%A9)">
					mole
				</a>
				et du préfixe
				<a target="_blank" href="https://fr.wikipedia.org/wiki/Pr%C3%A9fixes_du_Syst%C3%A8me_international_d%27unit%C3%A9s">
					ronto
				</a>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==80}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			<div>
				Extraire de l'Elixir de Conversion ou phaser un composant
				peut sembler relativement simple.
				<br/>
				Détrompe toi {pseudo}.
				<br/>
				Obtenir la quantité d'Elixir nécessaire au phasage de certains composants
				peut nécessiter de le faire en coopération.
			</div>
			<div class="info">
				Pour faciliter votre coopération, les questions et les composants
				sont numérotées pour faciliter la communication entre vous.
				<br/>
				N'hésite pas à partager questionnement et stratégie sur Discord.
				<br/>
				Je te laisse découvrir les autres mécanismes de ce challenge.
			</div>
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat && CONFIG}
		<div use:scrollPageToTop>
			<div>
				<span class="gpHelp" onclick={markClick} gpHelp="Délai avant de pouvoir chercher un objet contenant des molécules d'élixir">
					🔎<countdown dth={questionEcheance} txtTimeout="Possible" use:countDownInit />
				</span>
				<span class="gpHelp" onclick={markClick} gpHelp="Quantité restante de molécules d'élixir dans la réserve. Les molécules sont instables.">
						🧪{#key etat}<countdown id="idElixirCpt" cnt={etat.elixirsNb} step=1000 />{/key}
				</span> 
				<span class="gpHelp" onclick={markClick} gpHelp="Délai avant de pouvoir t'approcher de la réserve de molécules d'élixir">
					🪄<countdown dth={saisies.elixirEcheance} txtTimeout="Possible" use:countDownInit />
				</span>
			</div>
			<div class="parchemin">
				<div style="overflow-wrap: anywhere">
					{#each etat.questions as q,idx}
						{@const cls= (q.pseudo) ? "runeT":"runeNT"}
						{@const txt= (q.pseudo) ? "✓":"?"}
						<span style="position: relative;" class={cls} onclick={()=>displayQuestion(idx)}>
							{txt}
							<span style="position: absolute; top:0px; left: 0px; color: yellow; font-size: 0.4em; overflow: hidden; overflow-wrap: normal;">
								{idx+1}
							</span>
						</span>
					{/each}
				</div>
				<div class="br"/>
				<table class="table">
					<tbody class="tbody">
						{#each Array(CONFIG.SIZE) as _,l}
							<tr class="tr">
								{#each Array(CONFIG.SIZE) as _,c}
									{@const idx=l*CONFIG.SIZE+c}
									{@const cmp=etat.composants[idx]}
									<td style="overflow-wrap: anywhere" class={cmp.cls} onclick={()=>displayComposant(idx)}>
										<div style="position: relative; aspect-ratio: 2">
											<div style="position: absolute; top:0px; left: 0px; color: yellow">
												{idx+1}
											</div>
											<div style="overflow: hidden">{cmp.txt||"-"}</div>
										</div>
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

	{#if dspQuestion}
		{@const objet=CONFIG.objets[dspQuestion.i]}
		{@const lieu=CONFIG.lieux[objet.l]}
		{@const now=Date.now()+getEpsilon()}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspQuestion=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					{#if dspQuestion.premierPseudo==pseudo}
						<img class="parchemin" src={urlCdn+"commons/Human_brainstem2.gif"} style="width:20%; float:right" alt="" />
						<div>
							Tu as été {G(pseudoGenre,"le premier","la première")}
							à extraire de l'élixir de cet objet, tu ne peux en réextraire</div>
					{:else if dspQuestion.pseudoEcheance > now}
						<img class="parchemin" src={urlCdn+"commons/Human_brainstem2.gif"} style="width:20%; float:right" alt="" />
						<div>
						{dspQuestion.pseudo} a recemment extrait un elixir de cet objet.
						Il ne peut pas encore être reutilisé avant
						<countdown dth={dspQuestion.pseudoEcheance} use:countDownInit />
						</div>
					{:else if questionEcheance > now}
						<img class="parchemin" src={urlCdn+"commons/hamac-sommeil.gif"} style="width:20%; float:right" alt="" />
						<div >
							Ta dernière extraction t'as fatigué.
							<br />
							Repose-toi encore
							<countdown dth={questionEcheance} oncdTimeout={()=>reloadDspQuestion()} use:countDownInit />
						</div>
					{:else}	
						<img class="parchemin" src={urlCdn+"commons/Human_brainstem2.gif"} style="width:20%; float:right" alt="" />
						<div>
							Tu peux extraire des molécules d'élixir de cet objet.
							Voici un indice pour le découvrir:
						</div>
						<div class="adminCadre">{objet.q}</div>
						<div>Tu penses l'avoir trouvé? Indique moi son lieu et ses coordonnées</div>
						<div>
							<select bind:value={saisies.pL}>
								{#each CONFIG.lieux as z,i}
									<option value={i}>{z.lbl}</option>
								{/each}
							</select>
							<input bind:value={saisies.pX} type="number" min=0 max=100 step=0.1 placeholder="x.x"/>
							<input bind:value={saisies.pY} type="number" min=0 max=100 step=0.1 placeholder="y.y"/>
							<input type="button" value="➤" onclick={()=>propositionQuestion(dspQuestion.i)} />
						</div>
						{#if dspQuestion.premierPseudo}
							<div class="info" style="color:lightgreen">
								Pour information, {dspQuestion.premierPseudo} a déjà identifié cet objet.
							</div>
						{/if}
						{#if isAdmin(pseudo)}
							<div class="adminCadre">
								Soluce: l={objet.l} x={objet.x} y={objet.y} ({CONFIG.lieux[objet.l].lbl})
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspComposant}
		{@const now=Date.now()+getEpsilon()}
		{@const cpt=document.getElementById('idElixirCpt')?.getAttribute('curval')}
		{@const bes= CONFIG.MAP[dspComposant.i].nb}
		{@const ratio = cpt/bes}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspComposant=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
						<div>
							{#if dspComposant.elixirPseudo}
								Ce composant a disparu du Temps,
								{dspComposant.elixirPseudo} l'a phasé et envoyé dans l'Ortho-temps.
							{:else if saisies.elixirEcheance < now}
								<img class="parchemin" src={urlCdn+"commons/Human_brainstem2.gif"} style="width:20%; float:right" alt="" />
								Tu peux tenter d'utiliser des molécules d'élixir de conversion
								pour changer la phase de ce composant.
								{#if cpt < 3100000}
									<div style="color:yellow">
										⚠️ le niveau de la réserve de molécule d'élixir est bas
									</div>
								{/if}
								{#if ratio < 1.05}
									<div style="color:red">
										⚠️ ta chance de phaser ce composant est quasi nulle.
									</div>
								{/if}
								<br/>
								<input type="button" value="Tenter la conversion" onclick={()=>propositionComposant(dspComposant.i)} />
								{#if isAdmin(pseudo)}
									<div class="adminCadre">
										reserve:{cpt}, besoin:{bes}, ratio:{(1.0*cpt/bes).toFixed(1)}
									</div>
								{/if}
							{:else}
								<img class="parchemin" src={urlCdn+"commons/hamac-sommeil.gif"} style="width:20%; float:right" alt="" />
								Tu ne peux pas encore t'approcher de la réserve de molécules d'élixir.
								(<countdown dth={saisies.elixirEcheance} oncdTimeout={()=>dspComposant=null} use:countDownInit />)
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
					<div>Résultats:</div>
					<table class="resultats">
						<tbody>
							{#each Object.keys(dspResultats.byPseudo) as p}
							<tr><td>{p}:</td><td>{dspResultats.byPseudo[p].nbTrouve}</td></tr>
							{/each}
						</tbody>
					</table>
					<hr/>
					<div>
						{Object.keys(dspResultats.byPseudo).length} participants
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	

</div>
<!-- P440.svelte -->

