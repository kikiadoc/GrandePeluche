<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo,
					 markClick, playMusic, tts,
					 isEquipementPC,
					 addNotification, apiCall, getEpsilon,
					 urlCdn
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

	// appelé apres mount du component
	function init() {	 }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	// afficahge des popups standards
	let dspResultats=$state(false) 	// affichage des résltats
	async function calcResultats() {
		let ret = await apiCall("/contextes/ipa")
		if (ret.status!= 200) return
		// cumul des scores par pseudos
		let res = []
		Object.keys(ret.o.pseudos).forEach ( (p) => {
			res.push({p:p,s:Object.values(ret.o.pseudos[p]).reduce( (a,c) => a + (c.score || 0) ,0)})
		})
		// tri du résultat
		res.sort( (a,b)=> (a.s<b.s)? 1: (a.s>b.s)? -1 : 0)
		// affichage du résultat
		return { total: res.reduce ( (a,c)=> a+c.s, 0) , scores: res }
	}

</script>

<style>
	
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
				{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={async () => dspResultats= await calcResultats()} />
	</div>
	{#if dspResultats }
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Scores actuels des cinéphiles:</div>
					<hr/>
					{#each dspResultats.scores as r,i}
						<div>#{i+1} {r.p} : {r.s} ({Math.floor(20000000*r.s/dspResultats.total)} Gils)</div>
					{/each}
					<hr/>
					<div>Total: {dspResultats.scores.length} cinéphiles</div>
				</div>
			</div>
		</div>
	{/if}
	
	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Bienvenue {pseudo}.
			</div>
			{#if !pseudoGenre}
				<div class="adminCadre info">
					Tu n'as pas encore paramétré ton genre afin de mieux adapter nos dialogues.
					<br/>
					Clique sur ton pseudo en haut à droite de ton écran pour l'indiquer.
					<br/>
					N.B: Cette information restera inconnu du server de la Grande Peluche.
				</div>
			{/if}
			<div>
				Peut-être que tu n'as pas encore appréhendé l'importance de l'IPA,
				l'Institut Peluchique de l'Audiovisuel.
			</div>
			<div>
				C'est le lieu de mémoire où Kikiadoc conserve les vidéos de
				tous les Evénements de l'Event I jusqu'à l'Event IX et même dernièrement
				l'exploration de Métropolis dans l'Ortho-Temps .
			</div>
			<div class="blinkMsg">
				Ce lieu de mémoire a été profané par un bug informatique.
			</div>
			<div>
				Kikiadoc ne pense pas que ce soit le fait de Méphistophésès:
				il est bien incarcéré dans la prison hypo-temporelle de
				Saint-Pisse-qu’en-Coin et est hors d'état de nuire.
			</div>
			<div>
				<Btn bind:refStep={epiqStep} step=10 val="Et c'est grave ?" />
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-10/rodin-desespoir.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Grave?
			</div>
			<div>
				Haec sunt documenta quae res gestas audacium
				in video narrant, ut eis memoriam aeternam offerant!
			</div>
			<div>
				<Btn bind:refStep={epiqStep} step=20 val="Hein???" />
				<Btn bind:refStep={epiqStep} step=20 val="Evidemment!" />
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-10/rodin-desespoir.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Je te prie de m'excuser.
			</div>
			<div>
				Parfois, quand je suis désespérée, je m'exprime en latin.
			</div>
			<div>
				Celà veut dire que les vidéos des prouesses des Aventuriers
				méritent un lieu de mémoire éternelle.
			</div>
			<div>
				Savoir que quelques vidéos de l'IPA ont été vandalisées par un
				bug informatique...
			</div>
			<div>
				<Btn bind:refStep={epiqStep} step=30 val="Sais-tu quelles vidéos sont concernées?" />
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==30}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"ff-10/rodin-desespoir.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Hélas non, il y a des dizaines et des dizaines de vidéos exposées dans l'IPA.
			</div>
			<div>
				Et seulement certaines sont corrompues.
			</div>
			<div>
				Peut-être souhaites-tu aider Kikiadoc à restaurer les œuvres corrompues de l'IPA?
			</div>
			<div>
				<Btn bind:refStep={epiqStep} step=40 val="Evidemment!" />
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if epiqStep==40}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			<div>
				{pseudo}, je te propose un mini-jeu avec deux objectifs:
				<br/>
				➥Identifier les vidéos corrompues de l'IPA
				<br/>
				➥Maximiser tes points de cinéphile en visionnant des vidéos de l'IPA
			</div>
			<div class="br"/>
			<div>
				<u>Augmenter tes points de cinéphile est simple</u>:
				il suffit de regarder
				une vidéo de l'IPA indiquée par un marqueur ➥.
				<br/>
				Plus tu regarderas de vidéos, plus tu augmenteras tes points de cinéphile.
				<br/>
				Tes points seront crédités si tu <u>visionnes une vidéo jusque sa fin</u>
				et selon ton temps de lecture.
			</div>
			<div>
				Si une vidéo est marquée par un 👁, cela indique que tu l'as déjà vu
				en intégralité et que tu ne peux plus obtenir de points de cinéphile pour cette vidéo.
			</div>
			<div class="br"/>
			<div>
				<u>Identifier les vidéos corrompues est plus difficile</u>: 
				Si lors de la lecture d'une vidéo, tu vois un
				<span class="videoLink" onclick={markClick} gpVideo="ff-10/bugVideo" >
				gros popup d'erreur,
				tout rouge, tout moche
				comme celui-ci
				</span>
				, alors
				<span class="blinkMsg">
					fais immédiatement un screen et poste le sur le canal #bugbountyipa de Discord.
				</span>
				Si tu es
				{G(pseudoGenre,"le premier","la première")}
				à poster pour cette vidéo, tu gagnes le bug bounty exceptionnel associées à cette vidéo.
			</div>
			<div class="br"/>
			<div>
				<u>En synthèse..</u>
			</div>
			<div>
				A la fin du challenge, 20 millions de Gils seront répartis
				au prorata des points de cinéphile des participants.
				<br/>
				20 millions de Gils seront aussi répartis entre
				les premiers à avoir posté un screen dans le canal #bugbountyipa
				identifiant une vidéo à soucis.
			</div>
			<div class="br"/>
			<div>
				<u>N'oublie pas...</u>
			</div>
			<div>
				En cliquant sur le bouton "résultats" (en haut de cette page),
				tu peux vérifier les
				points de cinéphiles actuels des participants.
			</div>
			<div>
				Depuis ta liste des possibles,
				<br/>
				➥tu peux revenir sur cette page en cliquant sur "{pageDesc.texte}"
				<br/>
				➥tu peux visiter l'IPA en cliquant sur "L'IPA, l'Institut Peluchique de l'Audiovisuel".
			</div>
			<div class="br"/>
			<div>
				<Btn bind:refPage={page} page=10 val="Je vais explorer l'IPA" />
			</div>
			<div class="info">
				<u>Pour info...</u>
				<br/>
				Le symptome de cette corruption est la présence de blocs de données
				remplis de zéros dans la version publique de fichiers alors que la version
				privée est intègre.
				<br/>
				Tu peux consulter le
				<a href="https://docs.google.com/presentation/d/1J0lS2HCwqHOObIsbB2IgGe4ODiviIvyo3_5dYZ4Gpy8/edit?slide=id.g25ec72a58bd_0_0#slide=id.g25ec72a58bd_0_0" target="_blank">
					schéma d'architecture du site
				</a>.
				<br/>
				Ce souci semble localisé lors de la phase de "Sync copy partielle (/public)"
				que tu peux voir en bas au centre du schéma.
				Hélas, j'utilise des services et je n'ai pas développé le code de ce processus.
				Je n'ai pas pu reproduire ce bug dans un
				<a href="https://en.wikipedia.org/wiki/Minimal_reproducible_example" target="_blank">
					MRE
				</a>
				pour en déterminer
				<a href="https://fr.wikipedia.org/wiki/Analyse_de_cause_racine" target="_blank">
					la cause racine.
				</a>
				Ce pourrait être un soucis de 
				<a href="https://fr.wikipedia.org/wiki/D%C3%A9duplication" target="_blank">
					déduplication
				</a>.
				<br/>
				PS: Tu n'accèdes jamais, pour des raisons de sécurité,
				au stockage privé et sécurisé, mais uniquement à des
				<a href="https://fr.wikipedia.org/wiki/Cache_web" target="_blank">
				caches web
				</a>
				(
				<a href="https://aws.amazon.com/fr/cloudfront/" target="_blank">
					cloudFront (public)
				</a>
				et indirectement à
				<a href="https://www.pcloud.com/fr/eu" target="_blank">
					pCloud (public)
				</a>
				)
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
</div>
<!-- P401.svelte -->
