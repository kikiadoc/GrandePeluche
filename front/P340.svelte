<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		loadIt, storeIt, apiCall, addNotification, playVideo, urlImg,
		jjmmhhmmss, setHautFait, getHautFait
	} from "./storage.js"

	import Btn from './z/Btn.svelte'
	import Ctrad from './Ctrad.svelte'
	
	
	/**
	 * @typedef {Object} Props
	 * @property {any} pseudo - export let wsCallComponents
	 * @property {any} page
	 * @property {any} [pageDesc]
	 * @property {any} [pageDone]
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
	// export let pseudoList = []
	// export let audioVolume

	const nomHautFait="traducteurDesAnciens"
	
	const pageEpiqLbl = "P"+pageDesc.n + "_epiqStep"
	let epiqStep = $state(loadIt(pageEpiqLbl,0))
	$effect(()=>storeIt(pageEpiqLbl,epiqStep))

	// Gestion des reload, refresh etc..
	onMount(() => { })
	onDestroy(() => {	})

	// contexte d'execution (synch/server à déterminer)
	const ctxName = "hegemonie_"+pseudo
	let ctx = $state(loadIt(ctxName,{}))

	// affichage des hautfaits/résultats
	let dspResultats = $state(null)

	// validation du maitre de guilde
	function validationMaitrePecheur(newStep) {
		if (!ctx.maitrePecheur || ctx.maitrePecheur.toLowerCase() != "wawalago")
			return addNotification("Non, ce n'est pas "+ctx.maitrePecheur,"orange",10,"prout-long")
		storeIt(ctxName,ctx)
		playVideo("ff-7-maitrepecheur",null,null,2);
		epiqStep=newStep
	}

</script>
<style>
</style>
<!-- svelte-ignore element_invalid_self_closing_tag -->
<div>
{#if pseudo.startsWith("Kikiadoc")}
	<div class="adminCadre"> 
		<input type="button" value="ResetParchemin" onclick={()=>confirm('Reset le parchemin?') && apiCall("/asciens/admClearTrad",'PATCH')} />
	  <input type="button" onclick={()=> confirm('resetHautFait') && apiCall('/hautsFaits/'+nomHautFait,'DELETE')} value="ResetHautFaits" />
	</div>
{/if}

<div>
  <input type="button" onclick={()=> epiqStep=0} value="Revoir le Lore" />
  <input type="button" onclick={async ()=> dspResultats = await getHautFait(nomHautFait)} value="Résultats" />
</div>


{#if epiqStep==0}
	<div class="reveal">
		<div>Te voila à nouveau {pseudo}.</div>
		<div class="br"></div>
		Le congrés scientifique vient de se terminer. Je t'en fais ici la synthèse, c'était fabuleux!
		<div class="br"></div>
		<a href="https://fr.wikipedia.org/wiki/Jean-Fran%C3%A7ois_Champollion" target="_blank">Champollion</a>
		nous a expliqué qu'un élément peut se traduire de différentes
		façons selon le contexte: un nombre, une lettre, un glyphe ou même un mot!!!
		Comme illustration, il a dévoilé la
		<a href="https://fr.wikipedia.org/wiki/Pierre_de_Rosette" target="_blank">Pierre de Qarn</a>
		qu'il a découverte au fond du temple éponyme et comportant de multiples traductions d'un même texte.
		<div class="br"></div>
		Ensuite,
		<a href="https://fr.wikipedia.org/wiki/Lothar_Collatz" target="_blank">Callatz</a>
		nous a parlé de chiffrement.
		Il nous a démontré qu'une série mathématique peut servir à chiffrer ou déchiffrer une information.
		Il nous a indiqué qu'une fonction mathématique ne se limite pas à calculer un résultat
		en fonction de ses paramètres car celui-ci peut même être déjà connu. Il a illustré son propos avec la 
		<a href="https://fr.wikipedia.org/wiki/Conjecture_de_Syracuse" target="_blank">Conjecture de Syracuse</a>:
		Son résultat est connu, c'est toujours 1, la suite 4/2/1 des derniers calculs est appelée le cycle trivial.
		<br/>
		<Btn bind:refStep={epiqStep} step=5 val="Et?" />
		<div class="info">
			La Conjecture de Syracuse n'est pas, aujourd'hui, mathématiquement démontrée, mais aucune exception n'a été
			identifiée, c'est pourquoi ce n'est pas un
			<a href="https://fr.wikipedia.org/wiki/Th%C3%A9or%C3%A8me" alt="" target="_blank">théorème</a>,
			mais une
			<a href="https://fr.wikipedia.org/wiki/Conjecture" alt="" target="_blank">conjecture</a>.
			Tu vas l'utiliser alors que les meilleurs mathématiciens du monde s'attèlent à sa preuve
			et en espèrent la 
			<a href="https://fr.wikipedia.org/wiki/M%C3%A9daille_Fields" alt="">médaille Fields</a>
		</div>
	</div>
{/if}

{#if epiqStep==5}
	<div class="reveal">
		C'est alors qu'au fond de la salle de conférence,
		<a href="https://fr.wikipedia.org/wiki/Alan_Turing" target="_blank">Alan Turing</a>
		s'est levé et s'est exclamé:
		<br/>
		<span class="blinkMsg">Je sais déchiffrer le langage des Nouveaux Anciens !</span>
		<div class="br"></div>
		Tous les orateurs, spectateurs et moi, nous nous
		sommes tous retournés vers lui comme d'une seule Peluche et lui avons simplement demandé: comment?
		<br/>
		<Btn bind:refStep={epiqStep} video="ff-7-alan-decryptage" step=10 val="Et alors? Qu'a dit Alan?" />
	</div>
{/if}
{#if epiqStep==10}
	<div class="reveal">
		<a href="https://fr.wikipedia.org/wiki/Alan_Turing" target="_blank">Alan Turing</a>
		nous alors indiqué la traduction du feuillet du Grimoire de la Magie qui a brulé!
		<div class="br"></div>
		Les nombres se traduisent comme suit: 
		<br/>
		<i>Aux environs de 12≡guilde 8≡pêcheur, un maître de guilde saura...</i>
		<div class="br"></div>
		Comme les nouveaux anciens utilisent des 
		<a href="https://fr.wikipedia.org/wiki/Ellipse_(rh%C3%A9torique)" target="_blank">ellipses réthoriques</a>,
		le véritable texte est selon lui:
		<br/>
		<i>Aux environs de la guilde des pêcheurs, un maître de guilde saura...</i>
		<div class="br"></div>
		Ensuite il nous a indiqué comment traduire le language des Nouveaux Ansciens:
		<div class="br"></div>
		Les mots sont conservés, mais chaque nombre doit être décomposé selon la 
		<a href="https://fr.wikipedia.org/wiki/Conjecture_de_Syracuse" target="_blank">Conjecture de Syracuse</a>
		et obtenir un nombre que l'on peut alors associer selon la 
		<a href="https://fr.wikipedia.org/wiki/Pierre_de_Rosette" target="_blank">Pierre de Qarn</a>
		à un autre nombre, une lettre ou un mot.
		<br/>
		<Btn bind:refStep={epiqStep} step=30 val="Ho, mais c'est très compliqué!" />
	</div>
{/if}

{#if epiqStep==30}
	<div class="reveal">
		Tu as raison, c'est très compliqué. Mais Alan est tellement surprenant!
		<div class="br"></div>
		Il a même imaginé
		<a href="https://fr.wikipedia.org/wiki/Bombe_(%C3%A9lectrom%C3%A9canique)" alt="" target="_blank">
			une bombe électromécanique
		</a>
		permettant à tout le monde de traduire le Nouvel Ancien en Eorzéen.
		<br/>
		<Btn bind:refStep={epiqStep} step=40 val="Je peux en avoir une?" />
	</div>
{/if}

{#if epiqStep==40}
	<div class="reveal">
		<div class="br"></div>
		Hélas, crafter une bombe électromécanique restera encore longtemps une
		<a href="https://fr.wikipedia.org/wiki/Exp%C3%A9rience_de_pens%C3%A9e" target="_blank">expérience de pensée</a>
		car les composants nécessaires n'ont pas encore été découverts:
		il faudrait 100 crocs de requin du 13ème reflet,
		100 mécanismes d'horloge de l'Ortho-temps et
		10 tonnes de poils de Kikiadoc.
		<br/>
		<Btn bind:refStep={epiqStep} step=50 val="Alors c'est mort?" />
	</div>
{/if}

{#if epiqStep==50}
	<div class="reveal">
		Peut-être pas...
		<div class="br"></div>
		Si les Nouveaux Anciens peuvent posséder les Ames d'Eorzéens,
		il doivent traduire	leur langage en Eorzéeen pour les diriger.
		<div class="br"></div>
		Cela veut dire que les Nouveaux Anciens utilisent un équivalent
		à la bombe électromécanique d'Alan.
		<div class="br"></div>
		Et si le message incomplet était une indication permettant de récupérer un tel équipement?
		<div class="br"></div>
		Va à la Guilde des Pêcheurs, et note le nom du maître de guilde sur ton Parchemin:
		<p class="parchemin">
			Parchemin épique:
			<br/>
			<input type="text" bind:value={ctx.maitrePecheur} placeholder="maître pêcheur" onkeyup={(e) => e.key=="Enter" && validationMaitrePecheur()} />
			<input type="button" value=">" onclick={(e) => validationMaitrePecheur(55)} />
		</p>
	</div>
{/if}

{#if epiqStep==55}
	<div class="reveal">
		<img src={urlImg+"ff-7/Tablette-anime.gif"} style="width:30%; float:right" alt="" />
		C'est fantastique, tu as grugé un Nouvel Ancien et tu as récupéré une Tablette de Traduction!
		<div class="br"></div>
		Tu mérites un Grimoire du Savoir Personnel.
		<br/>
		<Btn bind:refStep={epiqStep} step=57 val="Un Grimoire du Savoir Personnel????" />
		<div style="clear:both"></div>
	</div>
{/if}

{#if epiqStep==57}
	<div class="reveal">
		<img src={urlImg+"ff-7/Grimoire-anime.gif"} style="width:30%; float:right" alt="" />
		Oui, je n'en ai que quelques-uns, mais tu le mérites bien!
		<div class="br"></div>
		Ton Grimoire du Savoir Personnel note automatiquement tes Hauts-faits,
		tes traductions et je peux même y ajouter des notes personnelles.
		<br/>
		<Btn bind:refStep={epiqStep} step=60 val="Ca fonctionne comment?" />
		<div style="clear:both"></div>
	</div>
{/if}

{#if epiqStep==60}
	<div class="reveal">
		Haha, pour cela, je te propose de vérifier que ta Tablette de Traduction et ton Grimoire du Savoir Personnel
		fonctionnent bien.
		<div class="br"></div>
		Selon Alan, le nombre 12 se traduit par Guilde. Peux-tu utiliser ta Tablette
		pour réaliser la traduction selon la Conjecture de Syracuse?
		<br/>
		<Btn bind:refStep={epiqStep} step=70 val="Oui, bien sur!" />
	</div>
{/if}

{#if epiqStep==70}
	<div>
		<Ctrad ascVal=12 cbResolve={()=>{epiqStep=80; console.log('hf',nomHautFait); setHautFait(nomHautFait,3)}}/>
	</div>
{/if}

{#if epiqStep==80}
	<div class="reveal">
		C'est fabuleux, la Tablette de Traduction des Anciens fonctionne parfaitement et
		ton Grimoire du Savoir Personnel note automatiquement tes traductions!
		<div class="br"></div>
		Quand cela sera nécessaire, tu pourras à nouveau les utiliser pour
		comprendre les écrits des Nouveaux Anciens.
		<div class="br"></div>
		<div class="info">
			Tu as terminé ce challenge,
			tu peux revoir le lore en cliquant sur 'Revoir le Lore'
			et les résultats en cliquant sur 'résultats'
		</div>
		<Btn bind:refPage={page} bind:refPageDone={pageDone} page=0 pageDone={pageDesc.n} val="Merci Grande Peluche" />
		<div style="clear:both"></div>
	</div>
{/if}

{#if dspResultats}
	{@const pseudos=Object.entries(dspResultats.pseudos)}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspResultats=false} onkeypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>Traducteurs des Anciens:</div>
				{#each pseudos as p,i}
					<div>{p[0]} {jjmmhhmmss(p[1].dth)}</div>
				{/each}
				<div>Total: {pseudos.length}</div>
			</div>
		</div>
	</div>
{/if}
</div>


<!-- P340.svelte.com -->

