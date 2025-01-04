<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		loadIt, storeIt, apiCall, addNotification, playVideo, urlImg,
		jjmmhhmmss, setHautFait, getHautFait, markClick, newInfoPopup
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
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
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
		<img class="parchemin" src={urlImg+"ff-7/Euklid2.jpg"} style="width:20%; float:right" alt="" />
		<div class="info">
			Ce challenge est d'un type un peu singulier.
			<div class="br"/>
			Il se fait en solo, sans contrainte de rapidité, 
			sans compétition, sans besoin de coopération et est, malgré les apparences, très facile.
			<div class="br"/>
			<div class="gpHelp" onclick={markClick} gpHelp="Regarde en bas de page">
				Kikiadoc l'appelle son challenge sentimental<sup>(*)</sup>
			</div>
			<div class="br"/>
			Laisse-toi porter par la fantasy du Lore,
			suis les liens et découvre le background historique IRL de ce challenge.
			<div class="br"/>
			En cas de difficulté, tu pourras demander l'aide 
			d'<a href="https://fr.wikipedia.org/wiki/Euclide" target="_blank">Euclide</a>
			qui te donnera alors les solutions grâce à sa règle et son compas,
			ou consulter les résultats d'une
			<a href="https://fr.wikipedia.org/wiki/Intelligence_artificielle_g%C3%A9n%C3%A9rative" target="_blank">
				 intelligence artificielle genAI
			</a>
			<div class="br"/>
			Sache que tu vas utiliser une conjecture mathématique des plus célèbres.
			<div class="br"/>
			Sa démonstration (ou son infirmation) résiste aux super-ordinateurs, aux ordinateurs quantiques
			d'aujourd'hui et à toutes les intelligences humaines depuis des décennies.
			<div class="br"/>
			Elle est paradoxalement terriblement simple à mettre en oeuvre.
			<div class="br"/>
			Tu vas l'utiliser alors que des mathématiciens parmi les plus célèbre du monde s'attèlent à sa démonstration
			et en espèrent l'équivalent d'un prix Nobel, la 
			<a href="https://fr.wikipedia.org/wiki/M%C3%A9daille_Fields" alt="" target="_blank">médaille Fields</a>
		</div>
		<div class="br"/>
		<Btn bind:refStep={epiqStep} val="Moi et les maths..." ifFct={ ()=> {
				newInfoPopup(" ",[],null,
										 {imgFull: "ff-7/isocrate-2.png", back:"papier" }
										 )
				return false
		}} />
		<Btn bind:refStep={epiqStep} step=1 val="Si tu dis que c'est passionnant..." ifFct={ ()=> {
				newInfoPopup(" ",["Mais oui,tu vas voir.","Profite du Lore et suis les liens!"],null,
										 {img: "ff-7/isocrate-2.png", back:"papier" }
										 )
				return true
		}} />
		<Btn bind:refStep={epiqStep} step=1 val="Ca a l'air passionant, je vais tout lire!" ifFct={ ()=> {
				newInfoPopup(" ",["Fais-toi plaisir.","Profite du Lore et suis les liens!"],null,
										 {img: "ff-7/isocrate-2.png", back:"papier" }
										 )
				return true
		}} />
		<div class="br" />
		<div class="info">
			(*) Dans ce challenge se retrouvent deux de mes passions: l'Informatique et les Mathématiques.
			<br />
			Et j'ai versé quelques larmes en le concevant car j'ai pensé à
			<a href="https://fr.wikipedia.org/wiki/Jour_du_Premier_Contact" target="_blank">
				mon premier contact
			</a>
			avec
			<a href="https://www.palais-decouverte.fr/fr/explorer-nos-contenus/revue-decouverte/archives/n-409-mars-avril-2017/hommage-a-jean-brette-1946-2017"
				target="_blank" alt="" >
				Jean Brette
			</a>, Mathématicien, Informaticien et prodigieux vulgarisateur:
			<br />
			Je n'étais qu'un gamin d'à peine 11 ans.
			<br />
			En quelques minutes,
			il m'a transmis ses passions et constellé mon imaginaire.
			<br />
			C'était le 14 décembre 1974, il y a 50 ans, au
			<a href="https://www.palais-decouverte.fr/fr/venir-nous-voir/les-etincelles/les-exposes/informatique-et-sciences-du-numerique"
				target="_blank" alt="" >
				Palais de la découverte
			</a>
			lors de 
			<span class="imgLink" gpImg="ff-7/expo-palais-1974.png">
			l'exposition "Micro"
			</span>.
			<br/>
			Je m'en souviens comme si c'était hier.
			<br/>
			Encore merci à
			<a href="https://www.palais-decouverte.fr/fr/explorer-nos-contenus/revue-decouverte/archives/n-409-mars-avril-2017/hommage-a-jean-brette-1946-2017"
				target="_blank" alt="" >
				Jean Brette
			</a>, 
			mon premier Mentor IRL.
		</div>
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==1}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/BNF.jpg"} style="width:30%; float:right" alt="" />
		<div>Te voila à nouveau {pseudo}.</div>
		<div class="br"></div>
		Le congrès scientifique vient de se terminer. Je t'en fais ici la synthèse, c'était fabuleux!
		<div class="br"></div>
		La Peluche
		<a href="https://fr.wikipedia.org/wiki/Jean-Fran%C3%A7ois_Champollion" target="_blank">
			Jean-François Champollion
		</a>
		nous a expliqué qu'un élément peut se traduire de différentes
		façons selon le contexte: un nombre, une lettre, un glyphe ou même un mot!!!
		Comme illustration, il a dévoilé la
		<a href="https://fr.wikipedia.org/wiki/Pierre_de_Rosette" target="_blank">Pierre de Qarn</a>
		qu'il a découverte au fond du temple éponyme.
		<div class="br" />
		Ensuite, la Peluche
		<a href="https://fr.wikipedia.org/wiki/Lothar_Collatz" target="_blank">Lothar Collatz</a>
		nous a parlé de chiffrement.
		Il nous a démontré qu'une série mathématique peut servir à chiffrer ou déchiffrer une information.
		Il nous a indiqué qu'une fonction mathématique ne se limite pas à calculer un résultat
		en fonction de ses paramètres car celui-ci peut même être déjà connu. Il a illustré son propos avec la 
		<a href="https://fr.wikipedia.org/wiki/Conjecture_de_Syracuse" target="_blank">Conjecture de Syracuse</a>:
		<div class="br" />
		Son résultat est connu, c'est toujours 1 et ensuite le cycle 4, 2, 1.
		Pour obtenir ce résultat, il suffit de diviser un nombre par 2 s'il est pair
		ou de le multiplier par 3 et ajouter 1 s'il est impair,
		puis de refaire ce calcul jusqu'à obtenir 1.
		<br/>
		<Btn bind:refStep={epiqStep} step=5 val="Ok, mais je fais quoi, moi?" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==5}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/turing-ordinateur.jpg"} style="width:20%; float:right" alt="" />
		Ne sois pas impatient, je continue le résumé de la conférence.
		<div class="br"></div>
		Alors que se terminaient ces brillants exposés, au fond de la salle, l'Immense Peluche, le Génial
		<a href="https://lejournal.cnrs.fr/articles/alan-turing-genie-au-destin-brise" target="_blank">
			Alan Turing
		</a>
		s'est levé et s'est exclamé:
		<br/>
		<span class="blinkMsg">Je sais déchiffrer le langage des Nouveaux Anciens !</span>
		<div class="br"></div>
		Tous les orateurs, les chercheurs de toutes disciplines, toute l'assistance et moi, nous nous
		sommes tous retournés vers lui comme d'une seule Peluche et lui avons simplement demandé: comment?
		<br/>
		<Btn bind:refStep={epiqStep} video="ff-7-alan-decryptage" step=10 val="Et alors? Qu'a dit Alan?" />
		<div style="clear:both" />
	</div>
{/if}
{#if epiqStep==10}
	<div class="reveal">
		<Btn video="ff-7-alan-decryptage" step=10 val="Revoir la vidéo d'Alan" />
		<br/>
		<a href="https://lejournal.cnrs.fr/articles/alan-turing-genie-au-destin-brise" target="_blank">
			Alan
		</a>
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
		Ensuite il nous a indiqué comment traduire le language des Nouveaux Anciens:
		<div class="br"></div>
		Les mots sont conservés, mais chaque nombre doit être itéré selon la 
		<a href="https://fr.wikipedia.org/wiki/Conjecture_de_Syracuse" target="_blank">Conjecture de Syracuse</a>.
		Le nombre d'itérations est alors l'indice à utiliser pour examiner la
		<a href="https://fr.wikipedia.org/wiki/Pierre_de_Rosette" target="_blank">Pierre de Qarn</a>
		et en déduire un autre nombre, une lettre ou un mot.
		<br/>
		<Btn bind:refStep={epiqStep} step=30 val="Ho, mais c'est très compliqué!" />
	</div>
{/if}

{#if epiqStep==30}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/qarn.png"} style="width:60%; float:right" alt="" />		
		Tu as raison, c'est compliqué.
		<br/>
		Regarde ci-contre un extrait du code informatique gravé sur la Pierre de Qarn!
		<br/>
		<Btn bind:refStep={epiqStep} step=35 val="Waou, c'est ca ?" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==35}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/turing-bombe.jpg"} style="width:30%; float:right" alt="" />		
		Oui, c'est ça la véritable Pierre de Qarn!
		<div class="br"></div>
		Mais Alan est tellement surprenant!
		Il a imaginé
		<a href="https://fr.wikipedia.org/wiki/Bombe_(%C3%A9lectrom%C3%A9canique)" alt="" target="_blank">
			une bombe électromécanique
		</a>
		permettant à tout le monde de traduire le Nouvel Ancien en Eorzéen.
		<br/>
		<Btn bind:refStep={epiqStep} step=40 val="Je peux en avoir une?" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==40}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/Human_brainstem2.gif"} style="width:30%; float:right" alt="" />		
		Hélas, crafter une bombe électromécanique restera encore longtemps une
		<a href="https://fr.wikipedia.org/wiki/Exp%C3%A9rience_de_pens%C3%A9e" target="_blank">expérience de pensée</a>
		car les composants nécessaires n'ont pas encore été découverts:
		il faudrait 100 crocs de requin du 13ème reflet,
		100 mécanismes d'horloge de l'Ortho-temps et
		10 tonnes de poils de Kikiadoc.
		<br/>
		<Btn bind:refStep={epiqStep} step=50 val="Alors c'est mort?" />
		<div style="clear:both" />
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
		<img class="parchemin" src={urlImg+"ff-7/Tablette-anime.gif"} style="width:30%; float:right" alt="" />
		<Btn video="ff-7-maitrepecheur" step=10 val="Revoir ton Haut-Fait" />
		<br/>
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
		<img class="parchemin" src={urlImg+"ff-7/Grimoire-anime.gif"} style="width:30%; float:right" alt="" />
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
		<img class="parchemin" src={urlImg+"ff-7/engrenage.webp"} style="width:30%; float:right" alt="" />
		Haha, pour cela, je te propose de vérifier que ta Tablette de Traduction et ton Grimoire du Savoir Personnel
		fonctionnent bien.
		<div class="br"></div>
		Selon Alan, le nombre 12 se traduit par Guilde. Peux-tu utiliser ta Tablette
		pour réaliser la traduction selon la Conjecture de Syracuse?
		<br/>
		<Btn bind:refStep={epiqStep} step=70 val="Je vais essayer" />
		<Btn bind:refStep={epiqStep} step=70 val="J'en suis sur" />
		<div style="clear:both" />
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
		<div class="br"/>
		Quand cela sera nécessaire, tu pourras à nouveau les utiliser pour
		comprendre les écrits des Nouveaux Anciens.
		<div class="br"/>
		Il semble que les Mathématiques nous aideront à sauver Eorzéa de l'Hégémonie.
		<div class="br"/>
		<div class="info">
			Tu as terminé ce challenge,
			tu peux revoir le lore en cliquant sur 'Revoir le Lore'
			et les résultats en cliquant sur 'Résultats'.
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

