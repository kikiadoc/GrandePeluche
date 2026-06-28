<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop,
					 displayInfo, displayObject, addNotification, playVideo,
					 markClick, urlCdn, apiCall
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
	import Common from './Common.svelte'
	import Btn from './Btn.svelte'
	
	let {
		GBLCTX,
		wsCallComponents,
		pageDesc,
		pseudo,
		pseudoGenre,
		pseudoList,
		page = $bindable(0),
		pageDone = $bindable([]),
	} = $props();

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()

	const URLWEBHOOKSTART = "https://discord.com/api/webhooks/"
	const ABOTAGLENMAX = 10 // En dur dans le client car mode non public - identique au serveur conf
  const ABOTAGLENMIN = 4  // En dur dans le client car mode non public - identique au serveur conf
	
	onMount(() => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique 
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes 
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// appelé apres mount du component
	async function init() { await getEtat() }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true 
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		s.debug ??= false
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}
	let etat = $state(null)
	async function getEtat() {
		let ret = await apiCall(APIROOT+"synthese",'GET',null,true,'-public-')
		if (ret.status==200) etat = ret.o
	}

</script>

<style>
	
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0}  />
		<span onclick={markClick} class="petit" style="cursor:pointer" gpHelp="Nombre actuels d'abonnés, les places sont limitées">
			Abonnés: {etat?.nbAbo || 0}/{etat?.nbAboMax || 0}
			<sup>(ℹ)</sup>
		</span>
	</div>
	{#if epiqStep==0 && etat}
		<div class="reveal2" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/gamemaster.jpg"} style="width:30%; float:right" alt="" />
			Parfois la mémoire de faits notables de l'Histoire d'Eorzéa me fait défaut,
			aussi, seras-tu {G(pseudoGenre,"le premier","la première")}
			à me rappeler un détail de notre Histoire?
			<br/>
			Lorsque ma mémoire flanche, je publie une question
			concernant les Codex sur les discords "Final Fantasy XIV-France" (en public) et "La Grande Peluche" (en privé).
			<br/>
			Pour y répondre, il faut que tu sois clairement authentifié{G(pseudoGenre,"","e")},
			car les spammeurs, hackeurs et autres crétins numériques malfaisants sont légions IG et IRL.
			<br/>
			As-tu déjà accès à mon discord et mon site privé "La Grande Peluche"?
			<br/>
			<Btn bind:refStep={epiqStep} music="emmenez-moi" step=10 val="Oui" />
			<Btn bind:refStep={epiqStep} music="emmenez-moi" step=20 val="Non, explique-moi" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==10}
		<div class="reveal2" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/gamemaster.jpg"} style="width:30%; float:right" alt="" />
			<div>Alors rejoins-moi sur mon site privé</div>
			<div>Alors rejoins-moi sur mon site privé</div>
			<div>
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<a href={GBLCONST.URLPRIVE} target="GP" >
					<input type="button" value="Emmene-moi" />
				</a>
				<Btn bind:refStep={epiqStep} step=20 val="Zut, je n'ai pas encore accès" />
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==20}
		<div class="reveal2" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"commons/gamemaster.jpg"} style="width:30%; float:right" alt="" />
			Pour participer à mes challenges privés, tu dois être authentifié{G(pseudoGenre,"","e")}.
			<br/>
			Suis mon parcours initiatique, ca se fait en quelques dizaines de secondes.
			<br/>
			Je ne te demanderai aucune information personnelle, mais tu dois être 
			{G(pseudoGenre,"un joueur identifié","une joueuse identifiée")}
			de FF14.
			<br/>
			➥Rejoint mon discord
			en utilisant cette invitation
			<a href="https://discord.gg/WvRSN8Wshe" target="gpHelp">https://discord.gg/WvRSN8Wshe</a>
			<br/>
			➥Suis les instructions du canal de bienvenue, je te contacterai en MP Discord
			<br/>
			➥Suis mes instructions en MP jusque te rendre sur mon site privé "La Grande Peluche"
			<br/>
			➥Tu pourras alors participer au "Feuillets oubliés" et d'autre challenges
			<br/>
			<Btn bind:refPage={page} page=0 val="C'est fait" />
			<Btn bind:refStep={epiqStep} step=0 val="Revoir le Lore" />
			<div class="info">
				Ce parcours d'inscription peut te paraître un peu contraignant,
				mais, d'expérience et pour l'instant, il a permis d'éviter l'intrusion de bots ou
				de crétins numériques malfaisants.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}


</div>
<!-- P102.svelte --> 

