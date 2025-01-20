<script>
	import { onMount, onDestroy  } from 'svelte';
	import {
		loadIt, storeIt, newInfoPopup, apiCall, addNotification, urlImg, urlCdn,
		playSound, playVideo, jjmmhhmmss, hhmmssms, ssms, hhmmss,
		scrollTop, clickSur, getEpsilon, getDynMetro,
		isEquipementPC
	} from './storage.js'
	
	import Cpacman from './Cpacman.svelte'
	import Btn from './z/Btn.svelte'

	let {
		wsCallComponents,
		pageDesc = null,
		pseudo,
		pseudoList,
		etatTTS = null,
		page = $bindable(),
		pageDone = $bindable([]),
		audioBack = $bindable(),
		audioAmbiance = $bindable(),
		audioVolume = $bindable(),
		dspObject = $bindable()
	} = $props();

	const pageEpiqLbl= "P"+pageDesc.n+"_epiqStep"
	const indexes = [1,2,3,4,5]
	
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback) });

	async function myWsCallback(m) {
		// console.log('pipoTrace',m.op)
		if (m.op=="igImage" && m.o) newIgImage(m)
		return false
	}

	// Gestion de l'épique
	let epiqStep = $state(loadIt(pageEpiqLbl, 0))
	$effect(()=>storeIt(pageEpiqLbl,epiqStep))

	function init() {
		forceAudio()
		newIgImage()
	}

	// igImage actuelles IG
	let igImage = $state(null)
	// situation actuelle du pseudo
	let enPrison = $state(false)
	// mode SOS
	let modeSOS = $state(false)
	// affichage des résltats
	let dspResultats=$state(false)

	async function newIgImage(wsMsg) {
		// console.log('pipoTracens',wsMsg)
		let ret = wsMsg || await apiCall("/spartaci/igImage")
		if (ret.status == 200) {
			// console.log('majigImage',ret)
			igImage = ret.o
			igImage.dth =	ret.dth
			igImage.epsilon =	getEpsilon()
			// scanne les situations pour trouver celle du pseudo
			let pSituation = Object.values(igImage.situations).find((s)=> s.pseudo==pseudo)
			// determine si en prison (test pour eviter le blink client)
			let t_enPrison = pSituation && pSituation.objectif && pSituation.objectif.prison && true
			if (enPrison != t_enPrison) enPrison=t_enPrison
			// determine le nombre de runes trouvees
			if (igImage.omega && igImage.omega.runes)
				igImage.nbRunesRecuperees=igImage.omega.runes.reduce((a,r)=> a+((r)? 1:0) ,0)
			else
				igImage.nbRunesRecuperees=0
		}
	}

	// recupere la synthse du joueur
	function getSynthese() {
		let ret = { 
			"localDth": hhmmssms(Date.now()),
			"igImageDth": hhmmssms(igImage && igImage.dth),
			"lastTTSDth": hhmmssms(etatTTS && etatTTS.dth),
			"epsilon": igImage.epsilon
		}
		// recherche le pseudo dans l'image
		let situation = Object.values(igImage.situations).find( (s)=> s.pseudo==pseudo)
		ret.situation= situation || "non défini"
		return ret
	}

	// force les parametres audio
	function forceAudio() {
		audioBack=true
		// audioAmbiance=true
	}

	// callback de sortie de la prison
	function pacmanEscape() {
		newInfoPopup("Retourne dans le jeu",
								 "Ne ferme pas cette fenêtre, bascule sur le jeu et suis à nouveau les consignes\
								 vocales de la Grande Peluche",
								 "Fermeture popup automatique", {autoClose:10}
								)
		apiCall("/spartaci/escapePrison")
	}
	
	// CRADO !!!!!! pour simul
	
	// ordre simulé
	let simul = $state({})
	const mannequins=[
		'Zeboy-a-kiki',
		'Reactif-a-kiki',
		'Yaouanck',
		"Kiki's'",
		'Baroudeurakiki',
		'Grenierjoli',
		'Fleuraukiki',
		"Superstock'a'kiki",
		'Coquinou-a-kiki',
		'Wonderkiki'
	]
	async function doSimul(radical) {
		const [p,n] = simul.nomIG.split(' ')
		const params = {
			p:p,
			n:n,
			target: simul.target,
			nears: (simul.near)? [simul.nomIG, simul.near] : [simul.nomIG],
			action: {
				type: radical.type,
				mot: simul.mot,
				tirage: radical.tirage
			} 
		}
		if (!p || !n || !radical.type) 
			addNotification("Erreur param de doSimul")
		else
			dspObject = await apiCall("/spartaci/igEvent","POST",params)
			simul={}
	}
	function winEvent(e) {
		console.log("*****event******",e.type)
		event.preventDefault()
	}

	
</script>

<svelte:window onbeforeunload={winEvent} />




<style>
	.alertMsg { background-color: red; text-align:center; font-size: 0.7em }
	.taRune {
		margin: auto;
		font-size:0.7em;
		text-align: center;
		vertical-align: middle;
		/* width:100% */
	}
	.tbRune {
	}
	.trRune {
	}
	.tdRune { 
		width: 17%;
	}
	.tdDiv {
	  padding: 0.3em;
		border-color: rgb(0, 0, 0, .2);
		border-image-repeat: stretch;
		border-image-slice: 1% 1% fill;
		vertical-align: middle;
		cursor: not-allowed;
		max-width: 100%;
		min-height: 3em;
		aspect-ratio: 1 / 1;
		text-overflow: clip;
	}
	.tdDivOK {
		border-image-source: url("https://cdn.adhoc.click/ff-7/runemetal.png");
	}
	.tdDivNA {
		/* background-color: lightgrey; */
	}
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>

{#if pseudo.startsWith('Kikiadoc')}
	<div class="adminCadre" style="font-size: 0.5em">
		<div>
			Admin: 
			<input type="button" value="Reset" onclick={async ()=> dspObject= await apiCall('/spartaci/reset','PUT')} />
			<input type="button" value="ResetRunes" onclick={async ()=> dspObject= await apiCall('/spartaci/resetRunes','PUT')} />
			<input type="button" value="Start" onclick={async ()=> dspObject= await apiCall('/spartaci/start','PUT')} />
			<input type="button" value="Pause" onclick={async ()=> dspObject= await apiCall('/spartaci/pause','PUT')} />
			<input type="button" value="End" onclick={async ()=> dspObject= await apiCall('/spartaci/end','PUT')} />
			<input type="button" value="ChallengeGlobal" onclick={async ()=> dspObject= await apiCall('/spartaci/global','PUT')} />
			<input type="button" value="go99" onclick={()=>epiqStep=99} />
			<input type="button" value="goLive" onclick={async ()=> dspObject= await apiCall('/spartaci/schedStart/now','PUT')} />
			<input type="button" value="resetSched" onclick={async ()=> dspObject= await apiCall('/spartaci/schedStart/reset','PUT')} />
			<input type="button" value="setFull-1" onclick={async ()=> dspObject= await apiCall('/spartaci/setFull','PUT')} />
		</div>
		{#if igImage}
			<div>
				Simul:
				<select bind:value={simul.nomIG}>
					<option>-</option>
					{#each Object.values(igImage.situations) as situation}
						<option>{situation.nomIG}</option>
					{/each}
				</select>
				Target:
				<select bind:value={simul.target}>
					<option style="color:red"></option>
					{#each mannequins as m}
						<option style="color:red">{m}</option>
					{/each}
					{#each Object.values(igImage.situations) as situation}
						<option>{situation.nomIG}</option>
					{/each}
				</select>
				Near:
				<select bind:value={simul.near}>
					<option style="color:red"></option>
					{#each mannequins as m}
						<option style="color:red">{m}</option>
					{/each}
					{#each Object.values(igImage.situations) as situation}
						<option>{situation.nomIG}</option>
					{/each}
				</select>
			</div>
			<div>
				<input type="button" value="Encourage" onclick={()=>doSimul({type:'encourage'})}/>
				<input type="button" value="Oui" onclick={()=>doSimul({type:'oui'})}/>
				<input type="button" value="Non" onclick={()=>doSimul({type:'non'})}/>
				<input type="button" value="Dés=100" onclick={()=>doSimul({type:'dés', tirage: 100})}/>
				<input type="button" value="Dés=400" onclick={()=>doSimul({type:'dés', tirage: 400})}/>
				<input type="button" value="Dés=700" onclick={()=>doSimul({type:'dés', tirage: 700})}/>
				<input type="text" placeholder="dire" bind:value={simul.mot} />
				<input type="button" value="Dire" onclick={()=>doSimul({type:'dire'})}/>
				<input type="button" value="Mute" onclick={()=>apiCall("/spartaci/mute","POST",{nomIG: simul.nomIG })} />
				<input type="button" value="Demute" onclick={()=>apiCall("/spartaci/unmute","POST", {nomIG: simul.nomIG })} />
				<input type="button" value="R0" onclick={()=>apiCall("/spartaci/setRunes","POST", {nomIG: simul.nomIG, nbRunes: 0 })} />
				<input type="button" value="R4" onclick={()=>apiCall("/spartaci/setRunes","POST", {nomIG: simul.nomIG, nbRunes: 4 })} />
				<input type="button" value="R9" onclick={()=>apiCall("/spartaci/setRunes","POST", {nomIG: simul.nomIG, nbRunes: 9 })} />
				<input type="button" value="R10" onclick={()=>apiCall("/spartaci/setRunes","POST", {nomIG: simul.nomIG, nbRunes: 10 })} />
				<input type="button" value="R29" onclick={()=>apiCall("/spartaci/setRunes","POST", {nomIG: simul.nomIG, nbRunes: 29 })} />
				<input type="button" value="clrMission" onclick={()=>apiCall("/spartaci/clrMission","POST", {nomIG: simul.nomIG })} />
			</div>
		{/if}
	</div>
{/if}

<div>
	<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
	<input type="button" value="Resultats" onclick={() => dspResultats=true} />
	{#if igImage}
		<span class="gpHelp info" gpHelp="Ecart en millisecondes entre image server et image client de l'in-game avant correction temporelle">
			ΔigSync:{Math.floor(Date.now() - (igImage.dth+igImage.epsilon))}ms
			<sup>(ℹ)</sup>
		</span>
		<span class="gpHelp info" gpHelp="Temp réseau de propagation: sniffer réseau-> kikiBridge-> SyncServer-> LogicServer-> SyncServer->client">
			Δevt:n/a
			<sup>(ℹ)</sup>
		</span>
		<span role="button" style="cursor:pointer" gpHelp="Diagnostic technique, ne pas utiliser sans Kikiadoc"
			onclick={()=>{ 
				if (pseudo=="Orodus" || pseudo.startsWith('Kikiadoc') || pseudo.startsWith('Grande')) modeSOS=true;
				dspObject=getSynthese()}}>
			🆘
		</span>
	{/if}
</div>

{#if igImage && modeSOS}
	{@const isAdmin=pseudo.startsWith('Kikiadoc')}
	<div style="font-size:0.5em;">
		<table border=1 style="width:100%; background-color: #404040; text-align: center">
			<tbody>
			<tr>
				<td>Pseudo</td>
				<td>Nom IG</td>
				<td>#rune</td>
				<td>/scruter</td>
				<td>Next</td>
				<td>Mission</td>
				<td>Target</td>
				{#if isAdmin}
					<td>Emote</td>
					<td>Crier</td>
					<td>Valeur</td>
					<td>Score</td>
					<td>Nears</td>
					<td>Ciblé</td>
					<td>Dés</td>
					<td>Rc</td>
					<td>P</td>
					<td>R</td>
				{/if}
			</tr>
			{#each Object.values(igImage.situations) as situation,i}
				{#if isAdmin || situation.pseudo==pseudo}
					<tr class="gpHelp" onclick={()=>dspObject=situation}>
						<td >{situation.pseudo}</td>
						<td >{situation.nomIG}</td>
						<td>{situation.nbRunes || "-"}</td>
						<td>{situation.nbReqScruter || "-"}</td>
						<td><countdown dth={situation.echeance} cbdone="">{situation.echeance}</countdown></td>
						<td style="width:30%; max-height: 1em; overflow-y: scroll; /* white-space: nowrap; */ ">
							{situation.objectif && situation.objectif.q}
						</td>
						<td>
							{situation.objectif && situation.objectif.target && situation.objectif.target.nom || "-"}
						</td>
						{#if isAdmin}
							<td>{situation.objectif && situation.objectif.emote || "-"}</td>
							<td>{situation.objectif && situation.objectif.dire || "-"}</td>
							<td>{situation.objectif && situation.objectif.valeur || "-"}</td>
							<td>{situation.score}</td>
							<td>{situation.nears.length}</td>
							<td>{situation.target}</td>
							<td>{situation.des || "-"}</td>
							<td>{situation.rc || "-"}</td>
							<td>{situation.dejaSomnoler? "x" : "-"}</td>
							<td>{situation.dejaEtirer? "x" : "-"}</td>
						{/if}
					</tr>
				{/if}
			{/each}
			</tbody>
		</table>
	</div>
{/if}

{#if epiqStep==0}
	<div class="reveal">
		<div>{pseudo}, aide-moi!</div>
		<div class="br"></div>
		<div>Je suis comme pétrifiée, je ne peux plus rien faire!</div>
		<Btn bind:refStep={epiqStep} video="ff-7-spartaci-1" step=2 val="Que t'arrive-t-il?" />
	</div>
{/if}
{#if epiqStep==2}
	<div class="reveal">
		<Btn video="ff-7-spartaci-1" val="Rappelle moi ta situation" />
		<div class="info">
			{pseudo}, demain, tu vas participer à un challenge doté d'une mécanique immersive en temps réel.
			<br/>
			Pour cela, il faudra laisser ton navigateur ouvert pour communiquer avec moi, la Grande Peluche, 
			en <u>permanence</u> pendant cette mécanique, <u>alors même que tu joues à FF14</u>.
			<div class="br" />
			<b>Sur PC</b>, tu pourras minimiser ou occulter la fenêtre de ton navigateur, utiliser alt-tab etc...
			<u>mais ne ferme en aucun cas ton navigateur lors de la phase d'immersion</u>.
			<div class="br" />
			<b>Sur Smartphone</b>,
			<u>laisse cette page affichée sur ton écran.</u>
			Il ne devrait pas passer en veille<sup>(*)</sup>.
			<div class="br" />
			Pour éviter une erreur de ta part, si tu tentes de fermer cette fenêtre pendant
			le challenge, tu devras confirmer la fermeture
			en validant un
			<span class="imgLink" gpImg="ff-7/confirmer-fermeture.png">
				popup d'alerte bizarre et inadapté
			</span><sup>(**)</sup>
			<br/>
			Tant que la phase immersive n'est pas commencée, tu peux fermer ton navigateur sans soucis
			en validant le popup de fermeture.
		</div>
		<Btn bind:refStep={epiqStep} step=5 val="J'ai compris" />
		<div class="info">
			<div>
				(*) J'active le mode
				<a href="https://developer.mozilla.org/en-US/docs/Web/API/WakeLock" target="_blank">
					WakeLock
				</a>
				mais il faut que ce soit possible sur ton smartphone.
			</div>
			(**) Les navigateurs ne permettent plus d'afficher un
			message personnalisé pour confirmer la fermeture d'une page
			car il y a eu de nombreux abus et dangers (sites de span, de malware..).
			<br/>
			Si tu vois une 
			<span class="imgLink" gpImg="ff-7/confirmer-fermeture.png">
			popup d'alerte bizarre</span>,
			c'est que tu vas 
			<u>interrompre les dialogues et	les notifications</u> avec moi.
			C'est un soucis uniquement lors de la phase immersive temps-réel
			(tu pourras te reconnecter, évidemment).
		</div>
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==5}
	<div class="reveal">
		<Btn video="ff-7-spartaci-1" val="Rappelle moi ta situation" />
		<div class="br"></div>
		<div class="info">
			Tu sais déjà que la Grande Peluche va te parler et t'expliquer ce que tu dois faire,
		</div>
		<div class="info">
			Pour profiter d'une expérience immersive optimale, je te propose de
			suivre
			<a href="{urlCdn}ff-7/Spartaci.pdf" target="_blank">
				<span class="blinkMsg">
					mes conseils de configuration de ton jeu et du site pour le challenge.
				</span>
			</a>
			(à regarder en mode paysage sur smartphone)
		</div>
		<div class="info">
			De tels réglages te permettront de participer à ce challenge avec
			une barre de raccourcis ciblés, des raccoucis de chat etc...
		</div>
		<Btn bind:refStep={epiqStep} step=5 val="J'ai un soucis de configuration du jeu"
			msg="Relis attentivement les conseils ci-dessus, vérifie bien et contacte alors Kikiadoc sur discord"
		/>
		<Btn bind:refStep={epiqStep} step=5 val="Je n'arrive pas à régler le son de ta voix"
			msg="Contacte immédiatement Kikiadoc sur discord"
		/>
		<Btn bind:refStep={epiqStep} step=10 val="J'ai bien configuré le jeu et j'entends clairement ta voix" />
	</div>
{/if}

{#if epiqStep==10 && igImage}
	<div class="reveal">
		<div>Tu connais maintenant mes mésaventures, alors viens à mon secours!</div>
		<div style="color:red">
			Dans
			<countdown dth={igImage.effectiveStartDth+getEpsilon()}
				oncdTimeout={()=>{
					newInfoPopup('Le challenge est en cours',
											 'Bascule sur le jeu avec alt-tab et entre dans la maison de CL de Kikiadoc',
											 "Fermeture popup automatique", {autoClose:10}
											)
					epiqStep=99
				}}
			/>
			tu devras entrer dans la maison de CL de Kikiadoc
			et garder ton navigateur ouvert sur cette page.
		</div>
		<div>
			Il est souhaitable que tu rejoignes le canal vocal #blablabla sur Discord
			un peu avant la phase d'immersion,
			<u>mais ne parle que si nécessaire</u>.
		</div>
		<div>
			Lis les <span class="blinkMsg">compléments ci-dessous</span>,
			tu peux encore 
				<a href="{urlCdn}ff-7/Spartaci.pdf" target="_blank">
					<u>vérifier ta configuration</u>
				</a>
				du jeu ou revoir la
				<span class="videoLink" gpVideo="ff-7-spartaci-1">
					situation de la Grande Peluche
				</span>
		</div>
		<div>
			Pour revoir toutes mes instructions, tu peux 
			<Btn bind:refStep={epiqStep} step=0 val="Revoir le Lore" />
		</div>
		<div class="info">
			<div><u>Quelques compléments très utiles</u>:</div>
			<div>
				👉Savoir calculer une Distance de Manhattan
				<span class="imgLink" gpImg="ff-7/Distance-manhattan.png">
					Exemple
				</span>.
				<a href="https://fr.wikipedia.org/wiki/Distance_de_Manhattan" target="_blank">
					Définition
				</a>.
			</div>
			<div>
				👉Si tu dois faire un /crier avec une réponse et si ce n'est pas un nombre,
				tu peux n'indiquer que la première lettre de ta réponse.
				(Exemple "r" pour "rouge", "a" pour "ao ra", "h" pour "hrothgar")
			</div>
			<div>
				👉Si besoin, tu peux inspecter un mannequin pour examiner ses caractéristiques
				telles que les teintures et les vétements portés. (sur PC, cibler le mannequin+clic droit) 
				<span class="imgLink" gpImg="ff-7/Inspection-mannequin.png">
					Exemple
				</span>.
			</div>
			<div>
				👉Tu peux, une fois seulement, demander la pause du challenge en faisant l'emote "somnoler".
				La pause sera <u>effective après la fin des missions en cours</u>.
				Tu pourras alors parler de stratégie en /dire ou sur Discord. Tu pourras sortir le
				challenge de la pause en faisant l'émote "s'étirer".
				<br/>
				Seulement 5 pauses seront possibles pendant le challenge.
			</div>
		</div>
		<div style="clear:both" class="br"></div>
	</div>
{/if}
	
	
{#if epiqStep==99 && igImage}
	<div class="blinkMsg alertMsg">
		{#if isEquipementPC()}
			(PC détecté) Ne ferme pas cette fenêtre de ton navigateur (utilise alt-tab pour passer sur le jeu)
		{:else}
			(Smartphone détecté) Reste avec cette page affichée sur ton smartphone et passe sur le jeu
		{/if}
	</div>
	{#if !enPrison}
		<div class="parchemin" style="margin: auto; text-align: center">
			<div>Runes Ω récupérées: {igImage.nbRunesRecuperees}/25</div>
			<table class="taRune">
				<tbody class="tbRune">
					{#each indexes as _,l }
						<tr class="trRune">
							{#each indexes as _,c }
								{@const idx=l*indexes.length+c}
								{@const runeOmega=igImage.omega.runes[idx]}
								{#if runeOmega}
									<td class="tdRune tdRuneOK">
										<div class="tdDiv tdDivOK">
											{(runeOmega.pseudo).substring(0,6)}
											<div style="font-size:0.8em">
												{hhmmss(runeOmega.dth)}
											</div>
										</div>
									</td>
								{:else}
									<td class="tdRune tdRuneNA">
										<div class="tdDiv tdDivNA">
											Ω
										</div>
									</td>
								{/if}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
			<div>
				{#if igImage.nbRunesRecuperees>=25}
					<Btn bind:refPage={page} video="ff-7/ff-7-spartaci-2" page=0 val="Challenge terminé" />
				{:else}
					Challenge en cours
				{/if}
			</div>
		</div>
	{:else}
		<div class="blinkMsg" style="text-align: center">
			Tu dois t'échapper de la prison des âmes
		</div>
		<div>
			<!-- <Cpacman cbSuccess={pacmanEscape} targetScore=2000 /> -->
			<Cpacman cbSuccess={pacmanEscape} targetScore=1500 />
		</div>
	{/if}
{/if}

{#if dspResultats}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspResultats=null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>
					Il n'y a pas de véritable résultat pour ce challenge!
					<div class="br"/>
					Chaque participant à ce challenge recevra le même montant de Gils:
					<br/>
					50 millions divisé par le nombre de participants.
					<br/>
					Soit environ 5 millions pour 10 participants
				</div>
			</div>
		</div>
	</div>
{/if}

</div>
<!-- P370.svelte -->
