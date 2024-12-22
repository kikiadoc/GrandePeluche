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
		console.log('pipoTrace',m.op)
		if (m.op=="igImage" && m.o) newIgImage(m)
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

	async function newIgImage(wsMsg) {
		// console.log('pipoTracens',wsMsg)
		let ret = wsMsg || await apiCall("/spartaci/igImage")
		if (ret.status == 200) {
			console.log('majigImage',ret)
			igImage = ret.o
			igImage.dth =	ret.dth
			igImage.epsilon =	getEpsilon()
			// scanne les situations pour trouver celle du pseudo
			let pSituation = Object.values(igImage.situations).find((s)=> s.pseudo==pseudo)
			// determine si en prison
			enPrison = pSituation && pSituation.objectif && pSituation.objectif.prison
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
	.rune { 
	  padding: 0.3em;
		border-color: rgb(0, 0, 0, .2);
	  /* border-image-source: url("https://cdn.adhoc.click/ff-7/runemetal.png"); */
		border-image-repeat: stretch;
		border-image-slice: 2% 2% fill;
		display: inline-block;
		cursor: pointer;
		height: 4em;
		width: 4em;
		aspect-ratio: 1 / 1;
	}
	.runeOK {
	  border-image-source: url("https://cdn.adhoc.click/ff-7/runemetal.png");
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
	<input type="button" value="Resultats TBD" onclick={() => epiqStep=0} />
	{#if igImage}
		<span class="gpHelp info" gpHelp="Etat de synchronisation temps réel avec le serveur, clique sur 🆘 pour le détail">
			sync:{Math.floor(Date.now() - (igImage.dth+igImage.epsilon))}ms
			ε={igImage.epsilon}ms
			Δtts:{ssms(Date.now()-(etatTTS.dth+igImage.epsilon))}
		</span>
		<span role="button" style="cursor:pointer" 
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
		<img src="{urlCdn+'ff-7/confirmer-fermeture.png'}" style="float: right; width: 35%" alt="" />
		<Btn video="ff-7-spartaci-1" val="Re-explique moi ta situation" />
		<div class="info">
			{pseudo}, tu vas participer à un challenge doté d'une mécanique immersive en temps réel.
			<br/>
			Pour cela, il faudra laisser ton navigateur communiquer avec moi, la Grande Peluche, 
			en <u>permanence</u> pendant cette mécanique, <u>alors même que tu es sur FF14</u>.
			<br/>
			Tu pourras minimiser/occulter ton navigateur, utiliser alt-tab etc...
			<u>mais ne ferme en aucun cas ton navigateur lors de la phase d'immersion</u>.
			<br/>
			Pour éviter une erreur de ta part, si tu tentes de fermer cette fenêtre pendant
			le challenge, tu devras confirmer la fermeture
			en validant un <u>popup d'alerte inadapté</u>(*) comme ci-contre.
			<br/>
			Tant que la phase immersive n'est pas commencée, tu peux fermer ton navigateur sans soucis
			en validant le popup de fermeture.
		</div>
		<Btn bind:refStep={epiqStep} step=5 val="J'ai compris" />
		<div class="info">
			(*) Les navigateurs ne permettent plus d'afficher un
			message personnalisé lors de la fermeture d'une page
			car il y a eu de nombreux abus et dangers (sites de span, de malware..).
			Les navigateurs affichent maintenant tous un message du style
			<b>"vous pourriez perdre des données saisies"</b>.
			<br/>
			Si tu vois une popup d'alerte comme ci-contre, c'est que tu vas 
			<u>interrompre les dialogues et	les notifications</u> avec moi.
			C'est un soucis pour toi uniquement lors de la phase immersive temps-réel.
		</div>
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==5}
	<div class="reveal">
		<Btn video="ff-7-spartaci-1" val="Rappelle moi ta situation" />
		<div class="br"></div>
		<div class="info">
			Tu sais déjà que la Grande Peluche va te parler, t'expliquer vocalement ce que tu dois faire,
			et que tes actions in-game vont te permettre de réaliser des actions
			lors de ce challenge.
		</div>
		<div class="info">
			Pour profiter d'une expérience immersive inédite, je te propose de
			suivre
			<a href="{urlCdn}ff-7/Spartaci.pdf" target="_blank">
				<span class="blinkMsg">
					mes conseils de configuration de ton jeu et du site pour le challenge.
				</span>
			</a>
		</div>
		<div class="info">
			De tels réglages te permettront de participer de façon optimale
			à ce challenge: Barre de raccourcis ciblés, raccoucis de chat etc...
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
		<Btn video="ff-7-spartaci-1" val="Rappelle moi ta situation" />
		<div>Tu connais maintenant mes mésaventures, alors {pseudo}, aide-moi!</div>
		<div class="info" style="color:red">
			Tu devras entrer dans la maison dans
			<countdown dth={igImage.effectiveStartDth+getEpsilon()}
				oncdTimeout={()=>{
					newInfoPopup('Le challenge est en cours',
											 'Bascule sur le jeu avec alt-tab et entre dans la maison de CL de Kikiadoc',
											 "Fermeture popup automatique", {autoClose:10}
											)
					epiqStep=99
				}}
			/>
			et garder ton navigateur ouvert sur cette page.
		</div>
		<div class="info">
			Pour l'instant, patiente encore un peu: 
				<a href="{urlCdn}ff-7/Spartaci.pdf" target="_blank">
					<u>Vérifie ta configuration</u>
				</a>
				 du jeu et du site pour le challenge.
			Lis les <u>compléments ci-dessous</u>
			ou vaque à d'autres occupations.
			Reviens dans le jardin de la maison de CL de Kikiadoc quelques minutes avant  le
			début de la phase immersive.
		</div>
		<div class="info">
			<u>Quelques compléments très utiles</u>:
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
				👉Tu peux rejoindre le canal #blablabla sur Discord un peu avant la phase d'immersion,
				<u>mais ne parle que si nécessaire</u>.
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
		<div style="margin: auto; text-align: center">
			<table class="parchemin" style="margin: auto; font-size:0.7em">
				<tbody style="text-align: center">
					{#each indexes as _,l }
						<tr style="height:4em">
							{#each indexes as _,c }
								{@const idx=l*indexes.length+c}
								{@const runeOmega=igImage.omega.runes[idx]}
								{#if runeOmega}
									<td class="rune runeOK">
										<div>{runeOmega.pseudo}</div>
										<div>{hhmmss(runeOmega.dth)}</div>
									</td>
								{:else}
									<td class="rune">
										<div style="font-size:2em">Ω</div>
									</td>
								{/if}
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
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

</div>
<!-- P370.svelte -->
