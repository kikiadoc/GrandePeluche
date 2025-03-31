<script>
	import { onMount, onDestroy } from 'svelte';
	import { 
		loadIt, storeIt, apiCall, markClick,
		addNotification, newInfoPopup, playVideo, urlImg, countDownTo, jjmmhhmmss
	} from "./storage.js"

	import Btn from './z/Btn.svelte'
	
	/**
	 * @typedef {Object} Props
	 * @property {any} wsCallComponents
	 * @property {any} pseudo
	 * @property {any} page
	 * @property {any} [pageDesc]
	 */

	/** @type {Props} */
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
  // export let pageDone = []
	// export let pseudoList = []
	
	// Gestion des reload, refresh etc..
	onMount(() => {
		if (wsCallComponents) wsCallComponents.add(myWsCallback)
		loadEtat(null)
	})
	onDestroy(() => {
		if (wsCallComponents) wsCallComponents.delete(myWsCallback)
		clearTimeout(recalcTimerId)
	})
	// callback sur le websocket
	function myWsCallback(m) {
		if (m.op=="torches") {	console.log('reloadEtat'); loadEtat(m); return true }
	}

	const pageEpiqLbl = "P"+pageDesc.n + "_epiqStep"
	let epiqStep = $state(loadIt(pageEpiqLbl,0))
	$effect(()=> {
		storeIt(pageEpiqLbl,epiqStep)
		dthAttenteStep26=Date.now()+15000
	})

	// etat actue du challenge (maj par get ou WS)
	let etat = $state(null)
	// etat calule du challenge pour affichage
	let cEtat = $state({})
	
	// chargement de l'état (mWs msg du websocket ou d'un autre requete null)
	async function loadEtat(mWs) {
		let ret = (!mWs)?  await apiCall("/torches/etat") : mWs
		if ( !ret.o || !ret.o.historique)
			return addNotification("Erreur sur chargement de l'état du challenge, contacte Kikiadoc","red",30)
		ret.o.dthDiffered = ret.o.relaxDthByPseudo[pseudo] || 0
		etat = ret.o
		recalcEtat()
	}

	// recalcul les parametres d'affichage (sur timer)
	let recalcTimerId = null
	function getSievert(ms) {
		return (ms<=0)?  0 : Math.floor( (Math.exp(ms/250000000) -1) * 1000000)
	}
	function recalcEtat() {
		// si challenge termine
		if (!etat.question) 
			return cEtat.dspDth = cEtat.dspDthDiffered = cEtat.dspNbSieverts = null
		// calcul des éléments d'IHM
		const now = Date.now()
		cEtat.dspDth = (etat.question.dth > now)? countDownTo(etat.question.dth) : null
		cEtat.dspDthDiffered = (etat.dthDiffered > now)? countDownTo(etat.dthDiffered) : null
		cEtat.dspNbSieverts = getSievert(etat.dthDiffered-now)
		// relance le timer si affichage des dth (pas encore de proposition)
		recalcTimerId = (cEtat.dspDth || cEtat.dspDthDiffered)? setTimeout(recalcEtat,1000) : null
	}

	// proposition d'un réponse
	async function propose() {
		let ret = await apiCall("/torches/propose/"+cEtat.proposition,'POST')
		cEtat.proposition = null
		if (ret.status==200) { playVideo("ff-7-torches-1") } // la sync se fera par le WS
		if (ret.status==201) { playVideo("ff-7-torches-2") } // la sync se fera par le WS
		if (ret.status==202) { newInfoPopup("Mauvaise réponse","tu as été irradié",null,{ding:"prout-long"}); loadEtat(ret) } // mauvaise réponse
	}
	
	// affichage des hautfaits/résultats
	let dspResultats = $state(null)
	// timer step 26
	let dthAttenteStep26 = $state(0)


</script>
<style>
	.rouge { color: red}
	.vert { color: lightgreen}
	.blanc { color: white}
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<div>
{#if pseudo.startsWith("Kikiadoc")}
	<div class="adminCadre">
	  <input type="button" onclick={()=> newInfoPopup("debug",["etat:",JSON.stringify(etat,null,2),"cEtat:",JSON.stringify(cEtat,null,2)])} value="Adm LocalDump" />
	  <input type="button" onclick={()=> confirm("Reset torche?") && apiCall('/torches/admReset','PATCH')} value="Adm Reset" />
	  <input type="button" onclick={()=> confirm("Go next torche?") && apiCall('/torches/admNext','PATCH')} value="Adm Next" />
	  <input type="button" onclick={()=> confirm("Reset timer?") && apiCall('/torches/admResetTimer','PATCH')} value="Reset Timer" />
	  <input type="button" onclick={()=> confirm("Reset 20h15?") && apiCall('/torches/admReset20H15','PATCH')} value="Reset 20h15" />
	</div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div>
  <input type="button" onclick={()=> epiqStep=0} value="Revoir le lore" />
  <input type="button" onclick={()=> dspResultats = etat && etat.historique} value="Résultats" />
	{#if etat && cEtat}
		{@const cls = (cEtat.dspNbSieverts >0) ? "rouge" : "vert"}
		<span style="font-size:0.8em">
			<span onclick={markClick} class="gpHelp" gpHelp="Nombre d'envois de la torchère dans les limbes">
				🏆{etat.historique.length}/{etat.NBQUESTIONS}<sup>(ℹ)</sup>
			</span>
			<a class={cls} href="https://fr.wikipedia.org/wiki/Sievert" target="_blank" >
				☢{cEtat.dspNbSieverts} µSv
			</a>
			<span onclick={markClick} class="gpHelp" gpHelp="Délai avant la prochaine chute de la Torchère en Eorzéa">
				{cEtat && cEtat.dspDth || "--:--:--"}<sup>(ℹ)</sup>
			</span>
		</span>
	{/if}
</div>

{#if epiqStep==0}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/gaz.jpg"} style="width:20%; float:right" alt="" />
		<div class="info">
			Ce challenge de rapidité va aussi stresser ta patience!
			<div class="br"/>
			Il comporte {etat && etat.NBQUESTIONS} étapes.
			<div class="br"/>
			Tu peux voir l'heure de début de la prochaine étape en haut de cette page.
			<div class="br"/>
			Hildiscord t'informera de l'avancement sur Discord à chaque étape.
			<div class="br"/>
			Si tu ne souhaites pas de notification Discord à chaque étape, 
			<span class="imgLink" gpImg="ff-7/discord-param-notif-2.png">
				modifie ton parametre de notification	du channel de l'événement.
			</span>
		</div>
		<Btn bind:refStep={epiqStep} step=5 val="Je m'impatiente déjà" />
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==5}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/gaz.jpg"} style="width:20%; float:right" alt="" />
		<div>
			{pseudo}, tu le sais déjà, de nombreuses Peluches sont possédées.
			<br/>
			C'est un grand danger pour Eorzéa et je pense que la cause est le Gaz de Possession.
		</div>
		<Btn bind:refStep={epiqStep} step=10 val="Le Gaz de Possession?" />
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==10}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/oss-117.png"} style="width:30%; float:right" alt="" />
		Oui le Gaz de Possession. Tu n'as pas lu la 
		<span class="videoLink" gpVideo="ff-7-doctrine-2">Doctrine du Mal</span>?
		<div class="br"></div>
		Selon le dernier rapport de la Peluche-espionne 
		<a href="https://fr.wikipedia.org/wiki/Hubert_Bonisseur_de_La_Bath" target="_blank">OSS117</a>,
		il existe un laboratoire secret
		fabriquant une nouvelle arme de destruction massive: la Torchère de l'Hégémonie.
		<br/>
		Cette arme radioactive est très dangeureuse.
		Passant de main de Nouvel Ancien en main de Nouvel Ancien, elle peut répendre
		le pire des neurotoxiques,
		le fameux Gaz de Possession, sur toute la surface d'Eorzéa.
		<br />
		<Btn bind:refStep={epiqStep} step=20 val="Mais que faire?" />
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==20}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/oss-117.png"} style="width:30%; float:right" alt="" />
		Je suis en communication avec 
		<a href="https://fr.wikipedia.org/wiki/Hubert_Bonisseur_de_La_Bath" target="_blank">OSS117</a>
		<br/>
		Elle me décrit la Torchère. Elle ressemble à s'y méprendre à une 
		<a href="https://fr.finalfantasyxiv.com/lodestone/playguide/db/item/ef2a3f80662" target="_blank" alt="">
			Lampe cénote
		</a>	
		<br/>
		Elle m'indique aussi que la dispersion du neurotoxique est sans danger si elle est effectue dans les limbes,
		au delà de l'atmosphère d'Eorzéa.
		<br/>
		Elle me dit vouloir envoyer la Torchère dans les limbes afin qu'elle s'y consume,
		<u>mais si la Torchère retombe en Eorzéa, il faudra la renvoyer dans les limbes.</u>
		<div class="info">
			Si la Torchère retombe dans une chambre, une maison, un appartement,
			la torchère est dissimulée, et c'est un mobilier de table de type
			<a href="https://fr.finalfantasyxiv.com/lodestone/playguide/db/item/ef2a3f80662" target="_blank" alt="">
				Lampe cénote
			</a>.	
			Si la chute est dans une autre zone, la torchère n'est pas visible
			(impossible de placer des objets dans les zones hors logements).
		</div>
		<div class="br"></div>
		Mais mais heu...
		<br />
		<Btn bind:refStep={epiqStep} step=25 val="Quoi mais mais heu..????" />
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==25}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/oss-117.png"} style="width:30%; float:right" alt="" />
		Je ne comprend pas...
		<br />
		J'ai entendu une série d'énormes explosions et j'ai perdu la transmission d'OSS117.
		<br />
		<Btn bind:refStep={epiqStep} step=26 val="Ha merde!" />
		<div style="clear:both" />
		<audio src="{urlImg+'ff-7/sf_explosion_01.mp3'}" repeat=true loop=true autoplay=true  />
	</div>
{/if}
{#if epiqStep==26}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/radome-cornet.jpg"} style="width:40%; float:right" alt="" />
		Attend
		<span style="color:red">
			<countdown dth={dthAttenteStep26} oncdTimeout={()=>epiqStep=27}></countdown>
		</span>
		, j'ai un message urgent.
		<br />
		<Btn ifFct={()=>{dthAttenteStep26+=40000; return true}}
			bind:refStep={epiqStep} step=0
			val="Grouille-toi!" msg="Mais laisse moi écouter, j'espère qu'ils vont répéter le message, en attendant, relis le Lore." />
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==27}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/radome-cornet.jpg"} style="width:40%; float:right" alt="" />
		Voici le message que j'ai reçu:
		<div class="br" />
		Selon les astro-peluches du  
		<a href="https://www.pleumeur-bodou.com/Le-Radome.html" target="_blank">
			radôme de Peluche-Bodou
		</a>
		un objet non identifié a été projété dans les limbes depuis Station Neuf.
		<div class="br" />
		<Btn bind:refStep={epiqStep} step=30 val="Qu'en penses-tu?" />
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==30}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/oss-117.png"} style="width:30%; float:right" alt="" />
		Je suis sûre que c'est OSS117 qui a provoqué ce lancement
		afin d'envoyer la Torchère de l'Hégémonie dans les limbes.
		<div class="br" />
		J'espère que ma Peluche-espionne préférée n'est pas blessée.
		<div class="br" />
		<Btn bind:refStep={epiqStep} step=40 val="Que faire maintenant?" />
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==40}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/gali-marie.png"} style="width:20%; float:right" alt="" />
		Je m'en vais quérir les Peluches
		<a href="https://fr.wikipedia.org/wiki/Galil%C3%A9e_(savant)" target="_blank">Galileo Galilei</a>
		et
		<a href="https://fr.wikipedia.org/wiki/Marie_Curie" target="_blank">Marie Curie</a>
		afin d'analyser la situation.
		<div class="br" />
		Je suis sûre qu'elles te seront d'une grande aide si tu souhaites contribuer à la destruction de la Torchère.
		<div class="br" />
		<Btn bind:refStep={epiqStep} step=99 val="Tu peux compter sur moi!" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==99 && etat && cEtat}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/gali-marie.png"} style="width:20%; float:right" alt="" />
		{#if !etat.question}
			<div class="blinkMsg">La Torchère de l'Hégémonie s'est consumée dans les limbes éthérées.</div>
			<div class="info">
				Ce challenge est terminé,
				tu peux revoir le lore en cliquant sur 'Revoir le Lore'
				et les résultats en cliquant sur 'Résultats'.
			</div>
			<Btn video="ff-7-torches-2" bind:refPage={page} page=0 val="Merci Grande Peluche" />
		{:else}
			<div>
				Selon la Peluche
				<a href="https://fr.wikipedia.org/wiki/Galil%C3%A9e_(savant)" target="_blank">Galileo Galilei</a>,
				{#if cEtat.dspDth}
					la Torchère de l'Hégémonie retombera {etat.question.z} dans {cEtat.dspDth}.
				{:else}
					la Torchère de l'Hégémonie est retombée {etat.question.z}.
				{/if}
			</div>
			{#if cEtat.dspDthDiffered}
				<div>
					Au vu de l'irradiation résiduelle de ton corps, et selon la Peluche
					<a href="https://fr.wikipedia.org/wiki/Marie_Curie" target="_blank">Marie Curie</a>,
					il faut que tu attendes encore <span style="color:red">{cEtat.dspDthDiffered}</span> pour
					t'approcher de la Torchère sans risque pour ta santé.
				</div>
				<div style="font-style:italic; font-size: 0.7em">
					L'irradiation résiduelle de ton corps est calculée selon tes résultats actuels (réussites et erreurs)
				</div>
			{/if}
			{#if cEtat.dspDth==null && cEtat.dspDthDiffered==null}
				<div>
					Tu peux récupérer la Torchère en répondant à la question suivante:
					<br/>
					{etat.question.q}
					<br/>
					{#each etat.question.o as o,i}
						{@const cls= (cEtat.proposition==i)? "selOui":"selNon"}
						<span class={cls} onclick={()=>cEtat.proposition=i} role="button" tabindex=0 onkeypress={null} >
							{o} &nbsp;
						</span>
					{/each}
					{#if cEtat.proposition !== undefined}
						<input type="button" value="Je confirme" onclick={()=>propose()} />
					{/if}
				</div>
				<div style="font-style:italic; font-size: 0.7em">
					Attention, en cas de mauvaise réponse, tu seras quand meme exposé aux radiations de la Torchère
					et tu devras patienter afin que ton niveau résiduel de radiations redevienne tolérable.
				</div>
			{/if}
		{/if}
		<div style="clear:both" />
	</div>
{/if}

{#if dspResultats}
	{@const historique=Object.entries(dspResultats)}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspResultats=false} onkeypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				Historique du renvoi de la Torchère de l'Hégémonie dans les limbes éthérées:
				<hr/>
				<div style="font-size:0.8em">
					{#each historique as h,i}
						<div>{h[1].pseudo} {jjmmhhmmss(h[1].dth)}</div>
					{/each}
				</div>
				<hr/>
			</div>
			<div>Total: {dspResultats.length}</div>
		</div>
	</div>
	
{/if}
</div>

<!-- P350.svelte -->
