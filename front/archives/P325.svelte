<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, newInfoPopup, apiCall, addNotification, urlImg, urlCdn  } from './storage.js'
	import { playSound, playVideo, jjmmhhmmss, hhmmssms, scrollTop, clickSur, getEpsilon, getDynMetro } from './storage.js'
	import Epiq from './z/Epiq.svelte'
	import Btn from './z/Btn.svelte'

	export let wsCallComponents; 
	export let pseudo; 
	export let pageDesc = null
	export let dspObject = null
	export let audioBack
	export let audioAmbiance

	const pageEpiqLbl= "P"+pageDesc.n+"_epiqStep"
	
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback) });

	async function myWsCallback(m) {
		console.log('pipoTrace',m.op)
		if (m.op=="igImage" && m.o) newIgImage(m)
	}

	// Gestion de l'épique
	let epiqStep = loadIt(pageEpiqLbl, 0);
	$: storeIt(pageEpiqLbl,epiqStep)

	function init() {
		newIgImage()
	}

	async function newIgImage(wsMsg) {
		console.log('pipoTracens',wsMsg)
		let ret = wsMsg || await apiCall("/spartaci/igImage")
		if (ret.status == 200) {
			console.log('majigImage',ret)
			igImage = ret.o
			igImage.dth =	ret.dth
			igImage.epsilon =	getEpsilon()
		}
	}
	
	// igImage actuelles IG
	let igImage = null

	// force les parametres audio
	function forceAudio() {
		audioBack=true
		audioAmbiance=true
	}
	
	// CRADO !!!!!! pour simul
	// ordre simulé
	let simul = {}
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

</script>
<style>
	
</style>

{#if pseudo.startsWith('Kikiadoc')}
	<div class="adminCadre" style="font-size: 0.5em">
		<div>
			Admin: 
			<input type="button" value="Reset" on:click={async ()=> dspObject= await apiCall('/spartaci/reset','PUT')} />
			<input type="button" value="Start" on:click={async ()=> dspObject= await apiCall('/spartaci/start','PUT')} />
			<input type="button" value="Pause" on:click={async ()=> dspObject= await apiCall('/spartaci/pause','PUT')} />
			<input type="button" value="End" on:click={async ()=> dspObject= await apiCall('/spartaci/end','PUT')} />
			<input type="button" value="ChallengeGlobal" on:click={async ()=> dspObject= await apiCall('/spartaci/global','PUT')} />
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
				<input type="button" value="Encourage" on:click={()=>doSimul({type:'encourage'})}/>
				<input type="button" value="Oui" on:click={()=>doSimul({type:'oui'})}/>
				<input type="button" value="Non" on:click={()=>doSimul({type:'non'})}/>
				<input type="button" value="Dés=100" on:click={()=>doSimul({type:'dés', tirage: 100})}/>
				<input type="button" value="Dés=400" on:click={()=>doSimul({type:'dés', tirage: 400})}/>
				<input type="button" value="Dés=700" on:click={()=>doSimul({type:'dés', tirage: 700})}/>
				<input type="text" placeholder="dire" bind:value={simul.mot} />
				<input type="button" value="Dire" on:click={()=>doSimul({type:'dire'})}/>
				<input type="button" value="Mute" on:click={()=>apiCall("/spartaci/mute","POST",{nomIG: simul.nomIG })} />
				<input type="button" value="Demute" on:click={()=>apiCall("/spartaci/unmute","POST", {nomIG: simul.nomIG })} />
			</div>
		{/if}
	</div>
{/if}


<input type="button" value="Revoir le Lore" on:click={() => epiqStep=0} />

{#if epiqStep==0}
	<div class="reveal">
		<div>Merci de participer à cette expérimentation</div>
		<div class="blinkMsg">Il y a DEUX règles à respecter <b>scrupuleusement</b></div>
		<ul>
			<li>Ne pas spoiler les mécaniques que tu vas découvrir</li>
			<li>Etre en vocal sur Discord et me dire dès que tu as un doute, un soucis, une question ou... un BUG</li>
		</ul>
		<div>
			Si on te pose des questions sur cette expérimentation, tu ne dois dire que des banalités style...
			Ca décoiffe, c'est super, tu verras toi même etc...
		</div>
		<div>
			Et si tu ne trouves pas ça sympa, tu peux le dire, style je n'ai pas aimé.
			Il faudra alors que je trouve autre chose, et les idées de challenges originaux sont rares.
			Je suis à sec!
		</div>
		<Btn bind:refStep={epiqStep} step=10 val="Je ne spoilerai pas!" />
		<div style="clear:both" class="br"/>
	</div>
{/if}

{#if epiqStep==10}
	{@const pipo=forceAudio()}
	<div class="reveal" pipo={pipo}>
		<div>
			Tu vas découvrir que la Grande Peluche peut parler, t'expliquer ce que tu dois faire,
			mais aussi que tes actions in-game (émote/dire/dés) vont te permettre de réaliser des actions
			pour de futurs challenges de rapidité.
		</div>
		<div class="br" />
		<div>
			Pour celà j'ai forcé l'ambiance audio du site, activé la synthèse vocale
			et coché l'option "le son continue quand le site n'est pas visible".
		</div>
		<div>
			Configure maintenant ton jeu et le site selon les indications de
			<a href="{urlCdn}ff-7/Préparatif pour expérimentation de Spartaci.pdf" target="_blank">
				configuration pour le futur événement de rapidité en coopération
			</a>
		</div>
		<Btn bind:refStep={epiqStep} step=30 val="C'est fait" />
		<div style="clear:both" class="br"/>
	</div>
{/if}

{#if epiqStep==30}
	<div class="reveal">
		<div>
		Rejoint moi maintenant sur le Discord de la Grande Peluche dans le canal vocal #blablabla.
		N'oublie pas que c'est une EXPERIMENTATION...
		</div>
		<div>
		Il faudra bien écouter et suivre mes consignes.
		Parfois je devrais "faire une pause" pour noter les remarques, les erreurs ou même corriger
		des bugs "simples" en "live".
		</div>
		<div>
			Je streamerai un de mes écrans et vous pourrez y voir des informations "de débug" en "live"
		</div>
		<div>
			Tu peux maintenant te connecter au jeu et te TP vers la maison de cl de Kikiadoc.
			<span class="blinkMsg">MAIS IL FAUT RESTER DANS LE JARDIN de la maison.</span>
		</div>
		<div>
			Quand tu seras OK, clique ci-dessous pour afficher le panneau de controle de l'expérimentation et suis alors
			mes explications vocales sur Discord.
		</div>
		<Btn bind:refStep={epiqStep} step=99 val="GOGOGO" />
		<div style="clear:both" class="br"/>
	</div>
{/if}

{#if epiqStep==99 && igImage}
	<div style="color:yellow">
		Ceci est l'écran d'administration que tu ne verras pas lors des challenges futurs
	</div>
	<div style="font-size:0.5em;">
		<div>
			Synchro serveur:{hhmmssms(igImage.dth)} ε={igImage.epsilon}ms
			Σdés: {igImage.sommeDes}
			Σscore: {igImage.sommeScores}
		</div>
		<table border=1 style="width:100%; background-color: #404040; text-align: center">
			<tr>
				<td>Pseudo</td>
				<td>Nom IG</td>
				<td>Score</td>
				<td>Nears</td>
				<td>Ciblé</td>
				<td>Dés</td>
				<td>#</td>
				<td>Rc</td>
				<td>Next</td>
				<td>Mission</td>
				<td>Target</td>
				<td>Emote</td>
				<td>Dire</td>
				<td>Valeur</td>
			</tr>
			{#each Object.values(igImage.situations) as situation}
				<tr class="gpHelp" on:click={()=>dspObject=situation}>
					<td >{situation.pseudo}</td>
					<td >{situation.nomIG}</td>
					<td>{situation.score}</td>
					<td>{situation.nears.length}</td>
					<td>{situation.target}</td>
					<td>{situation.des || "-"}</td>
					<td>{situation.nbTry || "-"}</td>
					<td>{situation.rc || "-"}</td>
					<td><countdown dth={situation.echeance} cbdone="">{situation.echeance}</countdown></td>
					{#if situation.objectif}
						<td style="width:30%; max-height: 1em; overflow-y: scroll; /* white-space: nowrap; */ ">{situation.objectif.q}</td>
						<td>{situation.objectif.target && situation.objectif.target.nom || "-"}</td>
						<td>{situation.objectif.emote || "-"}</td>
						<td>{situation.objectif.dire || "-"}</td>
						<td>{situation.objectif.valeur || "-"}</td>
					{/if}
				</tr>
			{/each}
		</table>
	</div>
{/if}

<!-- P325.svelte -->
