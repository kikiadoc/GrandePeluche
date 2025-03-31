<script>
	import { onMount, onDestroy  } from 'svelte';
	import {
		loadIt, storeIt, apiCall, addNotification, 
		urlCdn, getEpsilon, markClick, playSound, clickSur, playVideo
	} from './storage.js'

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

	//  const 
	const prefix = "hegemonie_epilog" // en prevision du refactoring
	const pageEpiqLbl= "P"+pageDesc.n+"_epiqStep"
	const pageSaisiesLbl = "P"+pageDesc.n + "_saisies"
	
	// etat de l'épique
	let epiqStep = $state(loadIt(pageEpiqLbl, 0))
	$effect(()=>storeIt(pageEpiqLbl,epiqStep))

	// etat des saisies
	function normalizeSaisies(saisies) {
		// exemple: saisies.caracs ??= [] 
	}
	let saisies = $state(loadIt(pageSaisiesLbl,{}))
	$effect(()=>storeIt(pageSaisiesLbl,saisies))

	// affichage des résultats
	let dspResultats=$state(false)

	// timer id a refactorer en effect/windows:
	let timerId = null
	onMount(() => { 
		wsCallComponents.add(myWsCallback)
		init()
		timerId = setInterval(timer,1000)
	})
	onDestroy(() => {
		wsCallComponents.delete(myWsCallback)
		clearInterval(timerId)
	})

	async function myWsCallback(m) {
		// if (m.op=="omega_etat") { etatOmega=m.o; return true }
		return false
	}

	async function init() {
		// let ret= await apiCall("/omega/etat")
		// if (ret && ret.status==200) {	etat = ret.o }
	}

	// etat
	let etat = $state(null) // calculé lors de l'init et de l'effect
	$effect(()=> {
		if (!etat) { console.log("** integrite: pas encore d'etatOmega"); return; }
	})

	// actulis via timer
	function timer() {
	}
	
	// fonction d'admin
	async function admAction(type) {
		if (!confirm(type)) return
		dspObject= await apiCall('/omega/'+type,'PATCH')
		init()
	}

</script>

<style>
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->

<div>
	{#if pseudo.startsWith('Kikiadoc')}
		<div class="adminCadre">
			<div>
				Admin:
			</div>
		</div>
	{/if}

	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={() => dspResultats=true} />
		<span onclick={()=>dspObject={}} gpHelp="Diagnostic technique (ne pas utiliser sans Kikiadoc)" style="cursor: pointer">
			🆘
		</span>
	</div>
	
	{#if epiqStep==0}
		<div class="reveal">
			<div>
				<img class="parchemin" src="{urlCdn}ff-7/exemple-screen-tete.png" alt="" style="width:40%; float: right"/>

				{pseudo}, l'événement <b>l'Hégémonie</b> est terminé mais
				il te reste trois petites choses à faire.
				<div class="br"/>
				1-Poster sur Discord (dans #discussion)
				<span class="blinkMsg">un screen en haute définition</span>
				(pas de photo de screen par smartphone).
				Ton visage doit occuper entre 20% et 30% de la hauteur du screen,
				et doit être au milieu du screen.
				Il peut être tourné légèrement à droite ou à gauche.
				L'arrière plan de ton visage doit être clair,
				et ne pas comporter d'éléments perturbant la visibilité de ton visage
				<div class="imgLink" gpImg="ff-7/exemple-screen-tete.png">Voir l'exemple en grand</div>
				En postant ce screen tu valides tes gains du challenge Epilogue et apparaitra dans la
				vidéo trailer de l'Hégémonie.
				<div class="br"/>
				2- Vérifier tes gains dans
				<a href="https://docs.google.com/spreadsheets/d/1_hho3TD2dr0kqIE-XBVhf6OW62lo2s3RAz_xc_Tkd2Y/edit?gid=1777355675#gid=1777355675"
					target="_blank">
					le grimoire des gains
				</a>
				<br/>
				Les gains de l'épilogue ne sont pas encore indiqués (il faut que tu postes un screen)
				<div class="br"/>
				3- Répondre à la rapide enquête qui permettra à Kikiadoc d'améliorer le prochain événement.
				<a href="https://docs.google.com/forms/d/e/1FAIpQLSf2k2yQYHpNWl-x0aK-1S9Ex1luSiYJFEd_4-KKiyzl4yR9GQ/viewform?usp=dialog"
					target="_blank">
					Répondre à l'enquête
				</a>
				<div class="br"/>
				Enfin tout le code source du site (client sur navigateur et serveur) est disponible sur
				<a href="https://github.com/kikiadoc/GrandePeluche/tree/main" target="_bank">
				le GitHub de la Grande Peluche
				</a>
				(le répertoire front est le client téléchargé dans ton navigateur,
				les répertoires inframain et infraback sont les programmes du serveur).
				<br/>
				Le document de
				<a href="https://cdn.adhoc.click/Architecture%20et%20conception%20du%20site%20ff14.adhoc.click.pdf"
					target="_blank" >
					conception générale du site
				</a>
				est disponible et public.
				<br/>
				N'hésite pas à contacter Kikiadoc pour retrouver une musique, une video, un gameplay
				que tu as aimé, ou même l'implémentation d'une technique
				<div class="br"/>
				<Btn msg="Alors, clique à la prochaine" val="J'ai bien fait les 3 petites choses" />
				<Btn bind:refPage={page} page=0 val="A la prochaine !" />
			</div>
			<div style="clear:both" />
		</div>
	{/if}

	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						Résultat à faire
					</div>
				</div>
			</div>
		</div>
	{/if}

</div>

<!-- p390.svelte -->
