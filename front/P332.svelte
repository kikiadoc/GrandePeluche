<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		loadIt, storeIt, apiCall, clickSur, scrollTop, jjmmhhmmss,
		addNotification, newInfoPopup, playVideo, urlCdn, setHautFait, getHautFait,
	} from "./storage.js"

	import Btn from './z/Btn.svelte'
	import Cpacman from './Cpacman.svelte'
	
	
	
	/**
	 * @typedef {Object} Props
	 * @property {any} pseudo - export let wsCallComponents
	 * @property {any} page
	 * @property {any} [pageDesc]
	 * @property {any} [pageDone]
	 * @property {any} audioVolume - export let pseudoList = []
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

	// parametres pour la selection des zones (r=bonne reponse)
	const zoneList = [ 
		// liste à construire
		{z:'Noscea occidentale X:15.4 Y:17.0',r:11}, // porte au milieu de la grotte
		{z:'Forêt du Sud X:18.2 Y:28.4',r:12},  // Sentinelle des vigils sombres
		{z:'Noscea occidentale X:26.8 Y:25.6',r:5}, // canons en haut des remparts
		{z:'Azys Lla X:38.1 Y:12.8',r:9}, // téléporteur allagois
		{z:'Coerthas central X:30.2 Y:15.3 Z:1.1',r:7},  // Simple PNJ (Matigniant)
		{z:'Thanalan méridionnal X:17.7 Y:18.8',r:7}, // pnj yayazuku <<-- !!! Y18.8 sur bogosse
		{z:'Ecume des cieux (Dravania) X:21.6 Y:25.8',r:7}, // pnj Mogmont
		{z:'Yanxia X:19.5 Y:12.1 Z:1.6',r:8}, // en haut d'une butte verticale herbes et herbustes
		{z:'Coerthas central X:25.9 Y:18.4',r:12},  // Sentinelle des fortemps
		{z:'Elpis X:37.6 Y:16.6 Z:3.1',r:9} // téléporteur vers pandaemoniuum
		/*
		{z:'Porte des Dieux X:21.4 Y:21.4',r:9}, // téléporteur allagois
		{z:'Ultima Thulé X:31.5 Y:27.6',r:7}, // pnj M-032
		{z:'Mare Lamentorum X:21.9 Y:30.0',r:10}, // entrée de grotte
		{z:'Kholusia X:39.2 Y:35.3',r:1} // zone inaccessible
		*/
	]
	// option de réponse (l=lbl, v=valeur de reponse)
	const zoneReponse = [
		{l:"Choisir...", v:0},
		{l:"Lieu inaccessible", v:1},
		{l:"Rien, de la végétation", v:8},
		{l:"Des canons", v:5},
		{l:"Un téléporteur", v:9},
		{l:"L'entrée d'une grotte", v:10},
		{l:"Une porte", v:11},
		{l:"Un habitant (simple pnj", v:7},
		{l:"Une sentinelle", v:12},
		{l:"Un maître-artisant", v:98},
		{l:"Un maître de guilde", v:99}
	] 
	
	const pageEpiqLbl = "P"+pageDesc.n + "_epiqStep"
	const pageSaisiesLbl = "P"+pageDesc.n + "_saisies"
	
	let step = $state(loadIt(pageEpiqLbl,0))
	$effect(()=>storeIt(pageEpiqLbl,step))

	let saisies = $state(loadIt(pageSaisiesLbl,{}))
	$effect(()=>storeIt(pageSaisiesLbl,saisies))
	// npormalize les saisies si besoin
	saisies.zones ??= []


	// Gestion des reload, refresh etc..
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback);  init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback) });

	async function myWsCallback(m) {
		// if (m.op=="doctrineDuMal") loadContexte(m)
	}
	
	// init...
	function init() {
	}
	
	// escape de la prison
	function pacmanEscape() {
		saisies.escape=true
		setHautFait("hegemonieEvade",3)
		playVideo("ff-7-portemagique")
		step=30
		scrollTop()
	}

	// nb de bonnes réponses
	let nbZoneOk = $state(0)
	$effect(()=> {
		let nb = 0
		for (let i = 0; i < zoneList.length; i++) {
			if (saisies.zones[i] == zoneList[i].r) nb++
		}
		console.log("getNbBonnesReponses!!!",nb)
		nbZoneOk = nb
	})
	
	// affichage des hautfaits/résultats
	let dspResultats = $state(null)

</script>
<style>
</style>
<!-- svelte-ignore element_invalid_self_closing_tag -->
<div>
{#if pseudo.startsWith("Kikiadoc")}
	<div class="adminCadre">
		Admin:
	  <input type="button" onclick={()=> apiCall('/hautsFaits/evadePrison','DELETE')} value="Reset evadePrison" />
	  <input type="button" onclick={()=> apiCall('/hautsFaits/hegemonieExplorateur','DELETE')} value="Reset hegemonieExplorateur" />
	</div>
{/if}

<div>
  <input type="button" onclick={()=> step=0} value="Revoir le lore" />
  <input type="button" onclick={async ()=> dspResultats = await getHautFait("hegemonieExplorateur")} value="Les explorateurs" />
</div>

{#if step==0}
	<div class="reveal">
		<img class="parchemin" style="float:right; width:30%" src="{urlCdn+'ff-7/ancien.png'}" alt="" />
		<div>
			Les Anciens étaient une antique civilisation qui a disparu lors de la Fragmentation.
			<div class="br"></div>
			Il existe encore de nombreux vestiges des Anciens, et selon le 
			<a href="https://fr.wikipedia.org/wiki/Deuxi%C3%A8me_Bureau_(France)" target="_blank">
			 deuxième bureau des Peluches
			</a>,
			certains ont retrouvé une activité inhabituelle.
		</div>
		<p>
			Celà confirme que de Nouveaux Anciens
			apparaissent en Eorzéa et que tu en as peut-être déjà identifié un: 
			<a href="https://fr.wikipedia.org/wiki/M%C3%A9phistoph%C3%A9l%C3%A8s" target="_blank">
				Méphistophélès
			</a>.
		</p>
		<p>
			Si les Nouveaux Anciens reprennent les objectifs des Anciens Disparus, alors
			ils veulent remplacer les civilisations d'Eorzéa par une nouvelle Hégémonie.
		</p>
		<p>
			C'est pourquoi j'espère que tu vas m'aider à comprendre les arcanes de ces Nouveaux Anciens
			et, si besoin, de les combattre.
		</p>
		<Btn bind:refStep={step} step=1 video="ff-7-epique-1" val="Tu peux compter sur moi" />
		<div style="clear:both" />
	</div>
{/if}
{#if step==1}
	<div class="reveal">
		<input type="button" value="Je peux revoir ton message?" onclick={()=>playVideo('ff-7-epique-1')} />
		<br/>
		{pseudo}, note le nom de ce maître de guilde sur ton parchemin épique.
		<div class="parchemin">
			Parchemin épique:
			<br/>
			<input type="text" bind:value={saisies.maitre128} placeholder="maître de guilde" onkeypress={(e) => e.key=="Enter" && clickSur('maitre128')} />
			<Btn id="maitre128" bind:refStep={step} step=15 video="ff-7-epique-2" val="➤"
				ifFct={()=> saisies.maitre128 && (saisies.maitre128.toLowerCase() == "geva")}
				koMsg="{saisies.maitre128} n'est pas le maître de guilde 12 8" />
		</div>
	</div>
{/if}
	
{#if step==15}
	<div class="reveal">
		<img class="parchemin" style="float:right; width:30%" src="{urlCdn+'ff-7/ancien.png'}" alt="" />
		{pseudo}, ton âme est prisonnière des Nouveaux Anciens, mais elle n'est pas encore possédée!
		<br/>
		{#if saisies.escape}
			<Btn bind:refStep={step} step=30 val="Je me suis déjà échappé" />
		{/if}
		<Btn video="ff-7-epique-2" val="Remontre-moi ma capture" />
		<Btn bind:refStep={step} step=20 video="ff-7-escapeprison" val="Que dois-je faire?" />
		<div style="clear:both" />
	</div>
{/if}
{#if step==20}
	<Cpacman cbSuccess={pacmanEscape} targetScore=500 />
{/if}

{#if step==30}
	<div class="reveal">
		<img class="parchemin" style="float:right; width:30%" src="{urlCdn+'ff-7/ancien.png'}" alt="" />
		Ton âme a réussi à s'échapper de la Prison des Ames et rejoindre ton corps.
		<br />
		Tu as eu de la chance, car les Gardiens
		ont été surpris par ta capture et ton évasion a été facile...
		<br />
		Si ton âme est à nouveau prisonnière de la Prison des Ames,
		ta future évasion sera probablement plus délicate...
		<br />
		<Btn bind:refStep={step} step=35 val="J'ai eu chaud aux fesses!" />
		<div style="clear:both" />
	</div>
{/if}

{#if step==35}
	<div class="reveal">
		<img class="parchemin" style="float:right; width:30%" src="{urlCdn+'ff-7/engrenage.webp'}" alt="" />
		{pseudo}, je suis très perturbée par ce qu'il vient de t'arriver. 
		<div class="br"></div>
		Il semble que notre interprétation était incorrecte.
		<div class="br"></div>
		Peut-être que la séquence "12 8" n'indiquait pas les
		coordonnées de la guilde des tanneurs en Gridania...
		<br />
		Peut-être que le X et le Y sont inversés dans le système de coordonnées des nouveaux anciens.
		<div class="br"></div>
		Non, c'est trop simple.
		<br />
		J'ai une idée.. je vais ouvrir le grimoire des savoirs au chapitre 12,
		le grimoire de la magie au chapitre 8
		et je vais voir ce qui se passe.
		<br />
		<Btn bind:refStep={step} step=40 val="Je peux regarder avec toi?" />
		<div style="clear:both" />
	</div>
{/if}
	
{#if step==40}
	<div class="reveal">
		<img class="parchemin" style="float:right; width:30%" src="{urlCdn+'ff-7/runetournantes.webp'}" alt="" />
		Regarde ci-contre les émanations éthéréennes {pseudo}!
		<br/>
		<Btn bind:refStep={step} step=45 val="J'ai une idée!" />
		<Btn bind:refStep={step} step=46 val="Je n'y comprend rien" />
		<div style="clear:both" />
	</div>
{/if}

{#if step==45}
	<div class="reveal">
		<img class="parchemin" style="float: right; width:30%" src="{urlCdn+'ff-7/runetournantes.webp'}" alt="" />
		Petit scarabée présomptueux, je suis la seule à pouvoir interpréter
		les émanations éthéréennes des grimoires.
		<br/>
		Remet tes idées saugrenues dans ton... bref...
		<br/>
		<Btn bind:refStep={step} step=50 val="Excuse-moi Grande Peluche" />
		<div style="clear:both" />
	</div>
{/if}

{#if step==46}
	<div class="reveal">
		<img class="parchemin" style="float: right; width:30%" src="{urlCdn+'ff-7/runetournantes.webp'}" alt="" />
		C'est normal, je suis la seule à pouvoir interpréter
		les émanations éthéréennes des grimoires.
		<br/>
		<Btn bind:refStep={step} step=50 val="Et qu'as-tu vu?" />
		<div style="clear:both" />
	</div>
{/if}
{#if step==50}
	<div class="reveal">
		{pseudo}, j'y ai vu de nombreuses coordonnées et noms de lieux!
		<div class="br"></div>
		Rends-toi dans ces régions d'Eorzéa et indique sur ton parchemin ce que tu y vois:
		<div class="info">
			Tu peux explorer en solo, le faire à plusieurs, tu peux aussi partager tes découvertes sur Discord.
			<br />
			Si tu n'as pas découvert une zone, demande de l'aide aux autres joueurs!
		</div>
		<div class="br"></div>
		<div class="parchemin">
			<div>Parchemin</div>
			<div style="font-size: 0.8em" >
				<hr style="width:50%" />
				{#each zoneList as zone,i}
					<div style="text-shadow: none; color:black">
						<span>{zone.z}</span>
						<br/>
						<select bind:value={saisies.zones[i]}>
						{#each zoneReponse as reponse}
							<option value={reponse.v}>{reponse.l}</option>
						{/each}
						</select>
						<hr style="width:50%" />
					</div>
				{/each}
			</div>
			<Btn bind:refStep={step} step=60
				ifFct={()=>{
					let ok = nbZoneOk==zoneList.length
					if (!ok)
						newInfoPopup(
							"Vérifie bien...",
							["Toutes tes réponses ne sont pas bonnes:",nbZoneOk+"/"+zoneList.length ],
							null,{ding:'prout-long'})
					return ok
				}}
				hautFait="hegemonieExplorateur"
				val="C'est mon dernier mot, Grande Peluche" />
		</div>		
	</div>
{/if}

{#if step==60}
	<div class="reveal">
		<img class="parchemin" style="float: right; width:30%" src="{urlCdn+'ff-7/conference.webp'}" alt="" />
		Merci d'avoir exploré ces lieux, {pseudo}.
		<div class="br"></div>
		Tu n'as donc pas trouvé en ces lieux, ni maître de guilde, ni maître-artisan.
		<div class="br"></div>
		Alors je vais tenter autre chose...
		<div class="br"></div>
		Je vais organiser un congrès scientifique pour tenter de comprendre ces nombres étranges.
		<div class="br"></div>
		<Btn bind:refPage={page} video="ff-7-epique-3" bind:refPageDone={pageDone} page=0 pageDone={pageDesc.n} val="Voir les préparatifs" />
		<div class="info">
			Ce challenge est terminé, tu peux cliquer sur les boutons en haut cette page pour
			revoir le lore ou les résultats actuels.
			<br/>
			Tu peux revenir ici en cliquant sur <b>{pageDesc.texte}</b> dans ta liste des possibles
		</div>
		<div style="clear:both" />
	</div>
{/if}

{#if dspResultats}
	{@const pseudos = Object.entries(dspResultats.pseudos)}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspResultats=false} onkeypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				Les Explorateurs:
				<br/>
				{#each pseudos as p}
					<div>{p[0]} {jjmmhhmmss(p[1].dth)}</div>
				{/each}
			</div>
			<div>Total: {pseudos.length} futurs Indiana Jones</div>
		</div>
	</div>
{/if}
</div>



<!-- P332.svelte -->
