<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 urlCdn, apiCall, isAdmin,
					 displayObject, addNotification, playVideo,
					 isProd
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
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

	const PAGEEPIQLBL= "P"+pageDesc.n+"_epiqStep"
	const PAGESAISIESLBL = "P"+pageDesc.n + "_saisies"
	
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
	function init() { calcDebutChallengeDth(); getEtat() }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op=='pharao.etat' && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		s.debug ??= false
		s.noTimer ??= false
		s.nuEnigme ??= 0
		s.lastBadReponse ??= 0
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// Listes des enigmes
	const enigmes = [
		{ l:"enigme0", x:0.0, y: 0.0, r:0, o:["pipo1","pipo2"] }
	]

	// calcul de la date effective pour le challenge
	let debutChallengeDth = $state(Date.now()+60000) // par defaut en attente de la synchro initt
	function calcDebutChallengeDth() {
		debutChallengeDth = (isProd)? pageDesc.start + 15*60000 : Date.now()+3*60000 // 
	}
	
	// calcul des timers
	function getTrouveEcheance(dthRef,nb,lastBad) {
		console.log("getTrouveEcheance",dthRef,nb)
		if (saisies.noTimer) return dthRef + 1
		if (lastBad) return lastBad+ 10*60000 // 10 minutes si mauvaise réponse
		switch(nb) {
			case 0 : return dthRef + 1
			case 1 : return dthRef+ 30*60000 // 1/2H
			case 2 : return dthRef+ 2*3600000 // 2H
		}
		return dthRef+ 4*3600000 // 4H
	}
	function getSwapEcheance(dthRef,nb) {
		console.log("getSwapEcheance",dthRef,nb)
		if (saisies.noTimer) return dthRef + 1
		switch(nb) {
			case 0 : return dthRef + 1
			case 1 :
			case 2 : return dthRef+ 10*60000 // 10min
			case 3 :
			case 4 : return dthRef+ 20*60000 // 20min
		}
		return dthRef+ 30*60000 // 30min
	}
	// chargement etat du challenge
	let etat = $state(null)
	async function getEtat(msgWs) {
		let ret = msgWs || await apiCall('/pharao/etat');
		if (ret.status != 200) return console.error("erreur sur /pharao/etat", ret.status)
		let tEtat = ret.o
		// recalc selon le pseudo
		tEtat.trouveNb=0
		tEtat.trouveDth=1 // pas 0 pour declencher les chronos
		tEtat.poseNb=0
		tEtat.poseDth=1 // pas 0 pour declencher les chronos
		tEtat.trouveNbTotal=0
		tEtat.poseNbTotal=0
		for (let i=0; i < tEtat.elts.length; i++) {
			let e = tEtat.elts[i]
			if (e.trouvePseudo) tEtat.trouveNbTotal++
			if (e.trouvePseudo==pseudo) {
				tEtat.trouveNb++
				if (e.trouveDth > tEtat.trouveDth) tEtat.trouveDth = e.trouveDth
			}
			if (e.posePseudo==pseudo) {
				tEtat.poseNb++
				if (e.poseDth > tEtat.poseDth) tEtat.poseDth = e.poseDth
			}
			if (e.targetIdx==i) tEtat.poseNbTotal++
		}
		tEtat.isTrouvePossible = (tEtat.trouveNbTotal < tEtat.size*tEtat.size)
		tEtat.isPosePossible = (tEtat.poseNbTotal < tEtat.size*tEtat.size)
		// calcul des timers
		tEtat.trouveEcheance = getTrouveEcheance(tEtat.trouveDth,tEtat.trouveNb,saisies.lastBadReponse)
		tEtat.swapEcheance = getSwapEcheance(tEtat.poseDth,tEtat.poseNb)
		// commit du nouvel etat
		tEtat.fromIdx=null
		console.log("new etat",tEtat)
		etat = tEtat
		// Si challenge termine, envoi la vidéo
		if (tEtat.poseNbTotal==tEtat.elts.length)
			playVideo("pharao/Pharao2")
	}
	// une proposition est faite pour une enigme
	function proposition(i) {
		// vérification de la validite de la réponse
		if (saisies.nuEnigme<0) return // pas d'énigme en cours
		if (enigmes[saisies.nuEnigme].r != i) {
			saisies.lastBadReponse = Date.now()
			saisies.nuEnigme = -1
			etat.trouveEcheance = Date.now() + 10*60000 // 10 minutes
			// mauvaise réponse
			displayInfo({titre:"Noob!",body:["Tu n'as pas indiqué la bonne réponse","Une nouvelle enigme te sera proposée plus tard"], autoClose:10})
			return
		}
		apiCall('/pharao/proposition/idxSol/idxProp','POST')
		saisies.nuEnigme = -1
		saisies.lastBadReponse = 0
	}
	// initialise l'image pour le canvas (chargement pour les canvas)
	let pharaoImage = new Image()
	let pharaoImagePromise = new Promise( (ok,ko) => {
		pharaoImage.onload = function () { console.log("image chargée",pharaoImage.src); ok(true) }
		pharaoImage.onerror = function () { console.log("image error",pharaoImage.src); ko(false) }
		pharaoImage.src = urlCdn+"pharao/imagePharao600x600.png";
	})
	// constuit le canvas d'un node
	async function buildCanvas(node) {
		// console.log("buildCanvas wait image")
		await pharaoImagePromise // atente si besoin du chargement de l'image
		let idx = node.getAttribute("idx")
		let targetIdx = etat.elts[idx].targetIdx
		let isTrouve = etat.elts[idx].trouvePseudo
		let px = targetIdx % etat.size
		let py = Math.floor(targetIdx / etat.size)
		// coordonnées dans l'image 
		const context = node.getContext('2d')
		// console.log("buildCanvas",idx,targetIdx,px,py,node.width,node.height)
		if (isTrouve)
			context.drawImage(pharaoImage, 100*px, 100*py, 100, 100, 0, 0, node.width, node.height)
	}

	// Calcule une question (si besoin)
	function newQuestion() {
		console.log("newQuestion")
		if (saisies.nuEnigme >= 0) return // si question en cours
		saisies.nuEnigme = Math.floor(Math.random() * enigmes.length)
	}
	// click sur un element
	function pharaoClick(n){
		if (saisies.debug) displayObject({pos: n, etat: etat.elts[n]})
		if (! etat.isPosePossible) {
			displayInfo({titre:"Impossible", body:["Tous les composants de Pharao sont bien positionnés"]})
			return
		}
		if (etat.swapEcheance>Date.now()) {
			displayInfo({titre:"Impossible", body:["Tu ne peux pas encore échanger des composants de Pharao"]})
			return
		}
		if (etat.elts[n].targetIdx==n && etat.elts[n].trouvePseudo) {
			displayInfo({titre:"Impossible", body:["Ce composant semble bien positionné"]})
			return
		}
		if (etat.fromIdx===null)
			// debut d'un switch
			etat.fromIdx = n
		else if (etat.fromIdx==n)
			// annulation d'un switch
			etat.fromIdx = null
		else {
			// tentative de switch  
			apiCall("/pharao/swap/"+etat.fromIdx+'/'+n,'POST')
		}
	}

	// calcul des résultsts
	function calcResultats() {
		let res = { byPseudo: {} }
		// displayObject(etat)
		for (let i=0; i< etat.elts.length; i++) {
			let e=etat.elts[i]
			if (e.trouvePseudo) {
				res.byPseudo[e.trouvePseudo] ??= { t: 0, p: 0, r:0}
				res.byPseudo[e.trouvePseudo].t++
			}
			if (e.posePseudo) {
				res.byPseudo[e.posePseudo] ??= { t: 0, p: 0, r:0}
				res.byPseudo[e.posePseudo].p++
				if (e.targetIdx==i) res.byPseudo[e.posePseudo].r++
			}
		}
		dspResultats = res
	}

	
</script>

<style>
	.table { /* background-image: url('https://cdn.adhoc.click/V10/ff-10/Pharao.png');
					background-size: 100% 100%; background-position: center; */
					width: 90%; margin: auto; padding: 0; border: 0;
					border-spacing: 0; border-collapse: collapse;
					border: 0;
				}
	.tbody { }
	.tr { padding: 0; margin: 0px; border: 0;
			 background-color:white;
		 }
	.canvas { padding: 0; margin: 0px;
			 /* border: 1px solid white; border-collapse: collapse; */
			 /* height: 3em; width: 3em; aspect-ratio: 1 / 1; */
			 cursor: pointer;
			 background-color: black;
			 text-align: top; font-size: 0px;
		 }
	canvas { background-color: red; border: 0; 
					 width: 100%; height:100%;
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
				<input type="button" value="ResetAll" onclick={() => confirm("Tout effacer?") && apiCall('/pharao/etat','DELETE') } />
				<input type="button" value="SetAll-2" onclick={() => confirm("Tout valider?") && apiCall('/pharao/setAll','DELETE') } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
				<label><input type="checkbox" bind:checked={saisies.noTimer} />NoTimer</label>
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
		<!--
		<span role="button"	style="cursor: pointer" onclick={()=>{ dspObject={ template: "a modifier" }}}>
		🆘
		</span>
		-->
	</div>
	{#if dspResultats}
		{@const tblPseudos=Object.keys(dspResultats.byPseudo)}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Résultats:</div>
					<table style="text-align: center; border-collapse: collapse">
						<tbody >
							<tr class="info">
								<td>Pseudos</td>
								<td>Trouvés</td>
								<td>Swaps</td>
								<td>Placés</td>
							</tr>
							{#each tblPseudos as p,i}
								{@const bp=dspResultats.byPseudo[p]}
								<tr>
									<td style="border: 1px solid white">{p}</td>
									<td style="border: 1px solid white">{bp.t}</td>
									<td style="border: 1px solid white">{bp.p}</td>
									<td style="border: 1px solid white">{bp.r}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
	
	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"pharao/hilbert-espace.jpg"} style="width:30%; float:right" alt="" />
			Bienvenue {pseudo}.
			<br/>
			{#if debutChallengeDth > Date.now()}
				<div class="info" style="color:red">
					Le challenge commencera dans
					<countdown dth={debutChallengeDth} oncdTimeout={()=>debutChallengeDth=0} />.
					<br/>
					Tu as le temps de bien lire le lore!
				</div>
			{/if}
			Depuis la venue de Thor,
			nous savons qu'une
				sixième dimension existe.
			<br/>
			Lors de trop rares visios interdimensionnelles,
			le Docteur Daniel Jackson, depuis l'Hyper-Temps, nous a fait part
			de ses découvertes.
			<br/>
			Dernièrement, il s'est rendu sur un lieu appelé
			la
			Terre
			du
			Système Solaire
			de la 
			Voie Lactée.
			<br/>
			Les Humains de cette "Terre"
			étudient le Temps pour en vérifier les Equations 
			car ils ont détecté des fluctuations.
			<br/>
			Hélas, ils n'ont pas pris conscience de l'importance
			de ces fluctuations.
			<br/>
			Selon Daniel, leur Temps est notre Hyper-Temps.
			<br/>
			Les Humains de la Terre ont entrepris le projet Pharao pour vérifier leur Temps
			mais il prendra des années alors que, selon Daniel, il y a urgence.
			<br/>
			<Btn bind:refStep={epiqStep} step=10 video="pharao/Pharao" val="Le projet Pharao?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<input type="button" value="Revoir la video" gpVideo="pharao/Pharao" onclick={markClick} />
			<br/>
			C'est ainsi que les Humains de la Terre ont présenté leur projet Pharao à Daniel.
			<br/>
			Si certains Humains de la Terre ont théorisé la probabilité
			que d'autres dimensions existent en développant la
			<a href="https://fr.wikipedia.org/wiki/Physique_quantique" target="_blank">
				physique quantique
			</a>,
			les Humains de la Terre n'en sont qu'à la vérification
			d'une Physique régissant un Univers Connu à quatre dimensions
			selon la
			<a href="https://fr.wikipedia.org/wiki/Relativit%C3%A9_g%C3%A9n%C3%A9rale" target="_blank">
				Relativité générale
			</a>.
			<br/>
			Depuis que les Quatre sont partis explorer l'Ortho-Temps et depuis la visite
			de Thor depuis l'Hyper-temps, nous savons que notre Univers Connu
			comporte au moins 6 dimensions.
			<div class="br"/>
			Le Savoir des Peluches est plus avancé que celui des Humains de la Terre,
			pourtant Daniel était très troublé lors de notre dernière visio intertemporelle.
			<br/>
			<Btn bind:refStep={epiqStep} step=20 val="Daniel? Troublé?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			Les Humains de la Terre supputent des fluctuations dans leur Temps.
			<div class="br"/>
			L'hypothèse de Daniel est que ceci est du aux explosions temporelles
			lorsque Méphistophélès s'est transporté depuis notre Temps vers l'Ortho-Temps puis
			ensuite vers l'Hyper-Temps sans précaution.
			<div class="br"/>
			Pour nous, comme pour les Humains de la Terre,
			il est simple d'appréhender les coordonnées spatiales
			X,Y,Z indiquées sur nos boussoles.
			<br/>
			Mais imagine que, face à un monstre, tu veux faire un pas à gauche,
			et qu'au lieu de t'en éloigner, tu t'en approches en faisant 2 pas en avant!
			En ne maîtrisant plus tes mouvements, tu n'as plus aucune chance de le vaincre!
			<div class="br"/>
			C'est ce que Daniel redoute pour nos trois Dimensions Temporelles:
			Une rupture de leurs
			<a href="https://fr.wikipedia.org/wiki/Orthogonalit%C3%A9" target="_blannk">
				Orthogonalités
			</a>.
			<div class="br"/>
			Je commence à bien te connaitre {pseudo}.
			Tu penses à la possibilité d'une téléportation temporelle...
			<br/>
			<Btn bind:refStep={epiqStep} step=25 val="Oui!" />
			<Btn bind:refStep={epiqStep} step=26 val="Non!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==25}
		<div class="reveal" use:scrollPageToTop>
			Je m'en doutais, mais tu es un petit scarabée.
			<div class="br"/>
			La téléportation multi-dimensionnelle se base au contraire
			sur de parfaites orthogonalités entre les Dimensions.
			<div class="br"/>
			<Btn bind:refStep={epiqStep} step=30 val="Evidemment!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==26}
		<div class="reveal" use:scrollPageToTop>
			C'est vilain de mentir, je sais que tu y as pensé.
			<div class="br"/>
			Mais la téléportation multi-dimensionnelle se base au contraire
			sur de parfaites orthogonalités entre les Dimensions.
			<div class="br"/>
			<Btn bind:refStep={epiqStep} step=30 val="Evidemment!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			Je pense que Thor, de façon invisible, va aider les Humains de la Terre à
			analyser les fluctuations de leur Temps, notre Hyper-Temps.
			<div class="br"/>
			Mais les Humains de la Terre n'ont pas connaissance de notre Temps
			ni de l'Ortho-Temps.
			<div class="br"/>
			Pour vérifier la théorie de Daniel, il nous faut construire
			une matrice d'horloges afin d'examiner les fluctuations de ces deux Dimensions.
			<br/>
			<Btn bind:refStep={epiqStep} step=40 val="On va construire des Pharao!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==40}
		<div class="reveal" use:scrollPageToTop>
			Tout à fait {pseudo}.
			<br/>
			Et nous avons un peu de chance: Si Méhistophélès s'est transporté facilement
			entre les Dimensions, c'est parce que les Nouveaux Anciens avaient construit
			un Pharao sur Eorzéa, mais les explosions temporelles de Méphistophélès l'ont détruit.
			<br/>
			Pourrons-nous stabiliser le Temps, l'Ortho-Temps et l'Hyper-Temps?
			<br/>
			Ainsi, nous pourrions
			<span class="blinkMsg">sécuriser l'EXPANSION de notre Univers Connu</span>.
			<br/>
			<Btn bind:refStep={epiqStep} step=50 val="J'en suis {G(pseudoGenre,'tout excité','toute excitée')}!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==50}
		<div class="reveal" use:scrollPageToTop>
			Alors, ta nouvelle Aventure commence!
			<div class="info">
				Lors de ce challenge, tu devras retrouver des composants de Pharao dispersés
				en Eorzéa et les réassembler pour en faire une horloge Pharao.
				<br/>
			</div>
			{#if debutChallengeDth < Date.now()}
				<Btn bind:refStep={epiqStep} step=90 val="J'y vais tout de suite" />
			{:else}
				<div class="info" style="color:red">
					Le challenge commencera dans
					<countdown dth={debutChallengeDth} oncdTimeout={()=>debutChallengeDth=0} />.
					<br/>
					Prend le temps de bien lire le lore!
					Si tu as envie de le revoir ou si tu as zappé des informations,
					clique sur "Revoir le Lore".
				</div>
			{/if}
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	<!--
			Peut-être pourrions les aider ?
			https://www.youtube.com/watch?v=UGvLvL8uliM
			https://www.youtube.com/watch?v=c-6-qBR1EPo
			file:///D:/Telechargement/Horloge%20atomique%20et%20temps%20qui%20passe...%20On%20teste%20nos%20experts%20!%20%E2%9C%85%E2%9D%8C.mp4
			file:///D:/Telechargement/Une%20horloge%20atomique%20%C3%A0%20bord%20de%20l%E2%80%99ISS%20%E2%8F%B2%EF%B8%8F.mp4
			file:///D:/Telechargement/STARGATE%20(1994)%20Best%20of%20James%20Spader%20as%20Daniel%20Jackson%20Compilation%20MGM.mp4
			<br/>
			Il semble que ce temps ne soit autre que l'Hyper-Temps, la 6ème dimension
			mentionnée par Thor.
			<br/>
			Fédérer notre 6ème dimension et le temps des Humains de la Terre,
			ce serait une fanstastique Expansion de notre Univers Connu.
			<br/>
			Principe de pharao:
			Protéger les composants nécessaires à Pharao.
	-->
	
	{#if epiqStep==90 && etat}
		<div>
			{#if etat.isTrouvePossible}
				<span onclick={markClick} style="cursor:pointer" gpHelp="Pour tenter de découvrir un composant de Pharao, réponds à l'énigme quand elle est affichée">
					<span style="color: green">🔎</span>
					<countdown dth={etat.trouveEcheance} oncdTimeout={newQuestion} txtTimeout="Possible"></countdown>
				</span>
			{:else}
				<span onclick={markClick} style="color:red; cursor:pointer" gpHelp="Tous les composants de Pharao ont été trouvés">
					🛇 Terminé
				</span>
			{/if}
			{#if etat.isPosePossible}
				<span onclick={markClick} style="cursor:pointer" gpHelp="Clique sur un composant de Pharao pour l'échanger avec un autre afin d'en reconstituer la structure" >
					<span style="color: green">✥</span>
					<countdown dth={etat.swapEcheance} txtTimeout="Possible"></countdown>
				</span>
			{:else}
				<span onclick={markClick} style="color:red; cursor:pointer" gpHelp="Tous les composants de Pharao ont été assemblés">
					🛇 Terminé
				</span>
			{/if}
		</div>
		<div class="adminCadre papier scrollbar" style="height: 4em">
			{#if etat.isTrouvePossible && saisies.nuEnigme >= 0}
				{@const enigme=enigmes[saisies.nuEnigme]}
				Question #{saisies.nuEnigme}
				{enigme.l}
				<br />
				{#each enigme.o as o,i}
					<input type="button" value={o} onclick={()=>proposition(i)} />
				{/each}
			{:else if etat.isTrouvePossible}
				Tu es	épuisé{G(pseudoGenre,"","e")}, patiente un peu
			{/if}
		</div>
		<div class="parchemin">
			<table class="table">
				<tbody class="tbody">
					{#each Array(etat.size) as _,l}
						<tr class="tr">
							{#each Array(etat.size) as _,c}
								{@const idx = l*etat.size+c}
								{#key etat.elts[idx] || etat.fromIdx }
									{@const cls = (idx===etat.fromIdx)?"tdBlink canvas":"canvas"}
									<td class={cls} onclick={()=>pharaoClick(idx,etat.elts)}>
											<canvas idx={idx} use:buildCanvas></canvas>
									</td>
								{/key}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

</div>
<!-- P410.svelte -->

