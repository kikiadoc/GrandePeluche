<script>
	import { onMount, onDestroy  } from 'svelte';
	import {
		loadIt, storeIt, newInfoPopup, apiCall, addNotification, 
		urlCdn, getEpsilon, markClick
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

	// Gestion de l'épique
	const pageEpiqLbl= "P"+pageDesc.n+"_epiqStep"
	let epiqStep = $state(loadIt(pageEpiqLbl, 0))
	$effect(()=>storeIt(pageEpiqLbl,epiqStep))

	// etat des saisies
	const pageSaisiesLbl = "P"+pageDesc.n + "_saisies"
	let saisies = $state(loadIt(pageSaisiesLbl,{}))
	saisies.caracs ??= [] // normalized
	$effect(()=>storeIt(pageSaisiesLbl,saisies))

	// constantes divers 
	const indexes = [0,1,2,3,4] // for les #each
	const C_AME_REDUC_PAR_RUNE = 2 // % de réduc d'ame par rune
	const C_AME_NB_VIS_MAX = 20 // nombre de runes découvrables
	const C_AME_REDUC_MAX = 100 - (C_AME_NB_VIS_MAX*C_AME_REDUC_PAR_RUNE) // niveau d'ame min sinon mort

	let timerId = null
	onMount(() => { 
		console.log('*** mount P380')
		wsCallComponents.add(myWsCallback)
		init()
		timerId = setInterval(timer,5000)
	})
	onDestroy(() => {
		console.log('*** destroy P380')
		wsCallComponents.delete(myWsCallback)
		clearInterval(timerId)
	})

	async function myWsCallback(m) {
		// console.log('ws P380',m.op,m)
		if (m.op=="omega_vis") etatVis=m.o
	}

	async function init() {
		let ret= await apiCall("/omega/vis")
		if (!etatVis && ret && ret.status==200) etatVis = ret.o
		// execute le timer une fois
		timer()
	}

	// etat des vis { runes: [ { pseudos: [ {pseudo:, dth:} ]  }]
	let etatVis = $state(null)
	let nbVisRef = $state(0) // nombre de reference du pseudo dans les vis
	let visDth = $state(0) // dernière dth de vis du pseudo
	let ameRestant = $state(100) // % ame restante
	let resteGains = $state(null) // reste des gains
	$inspect("etatVis",etatVis)
	$effect(()=> {
		if (!etatVis) return;
		// il y a un nouvel etatVis...
		// calcul des elements liés au pseudo
		let t_nbVisRef = 0
		let t_visDth = 0
		etatVis.runes.forEach((rune) => {
			if (rune) rune.pseudos.forEach((p) => {
				if (p && p.pseudo==pseudo) {
					t_nbVisRef++
					if (p.dth > t_visDth) t_visDth=p.dth
				}
			})
		})
		nbVisRef = t_nbVisRef
		ameRestant = Math.floor(100-(C_AME_REDUC_PAR_RUNE* t_nbVisRef))
		// calcul dth de prochain devissage (30 sec si pas dernier, 10 minutes si dernier)
		t_visDth += t_nbVisRef*((etatVis.lastDevisseeDth > t_visDth)? 30000 : 600000 )
		// mini 30 sec apres le dernier, ajuste heure local sur serveur (-epsilon)
		visDth = Math.max(etatVis.lastDevisseeDth+30000,t_visDth) - getEpsilon()
	})

	// actulise le resteGains toutes les 5 secondes
	function timer() {
		// recalcul le reste des gains
		// si callenge en cours, decompte les gains
		// valeur pour info, sera recalculée par le serveur lorsque le challenge est termine pour pseudo
		const nbMinutes = (Date.now() - (etatVis.dthStart+getEpsilon())) / 60000
		const decote = etatVis.decoteParMin * nbMinutes
		resteGains = Math.max(Math.floor(etatVis.gainMax - decote),etatVis.gainMin)
	}
	
	async function clickRuneVis(idx) {
		let ret= await apiCall("/omega/vis/"+idx,"PUT")
		// pas de notif en cas de 200, sera fait via le WS
		// if (ret.status==200) addNotification("Tu as retiré une vis de la rune #"+(idx+1))
		if (ret.status==201) addNotification("Tu as déjà retiré une vis de la rune #"+(idx+1),"orange",10,"prout-long")
		if (ret.status==202) addNotification("Toutes les vis de la rune #"+(idx+1)+" ont déjà été retirées","orange",10,"prout-long")
	}

	// caractéristiques et reponses
	const tblCarac = [
		{desc: "Ses 4 vis fendues", r:false, uWiki: "https://fr.wikipedia.org/wiki/Vis_fendue"},
		{desc: "Sa striure horizontale", r:false, uWiki: "https://www.dictionnaire-academie.fr/article/A9S3040"},
		{desc: "Une vis au Suroît", r:true, uWiki: "https://fr.wiktionary.org/wiki/suro%C3%AEt"},
		{desc: "Sa teinte rougeâtre", r:false, uWiki: "https://fr.wiktionary.org/wiki/rouge%C3%A2tre"},
		{desc: "Une vis à l'ouest", r:false, uWiki: "https://fr.wikipedia.org/wiki/Rose_des_vents"},
		{desc: "Son aspect rectangulaire", r:true, uWiki: "https://fr.wikipedia.org/wiki/Rectangle"},
		{desc: "Une vis au Noroît", r:true, uWiki: "https://fr.wikipedia.org/wiki/Noro%C3%AEt_(point_cardinal)"},
		{desc: "Une vis au Suet", r:true, uWiki: "https://fr.wikipedia.org/wiki/Suet_(point_cardinal)"},
		{desc: "Sa teinte grisâtre", r:true, uWiki: "https://fr.wiktionary.org/wiki/gris%C3%A2tre"},
		{desc: "Une vis au nord", r:false, uWiki: "https://fr.wikipedia.org/wiki/Rose_des_vents"},
		{desc: "Ses 4 vis Allen", r:false, uWiki: "https://fr.wikipedia.org/wiki/Cl%C3%A9_Allen"},
		{desc: "Sa teinte bleuâtre", r:false, uWiki: "https://fr.wiktionary.org/wiki/bleu%C3%A2tre"},
		{desc: "Son périmètre est un polygone convexe", r:true, uWiki: "https://fr.wikipedia.org/wiki/Polygone_convexe"},
		{desc: "Sa symétrie parfaite autour d'un axe vertical", r:false, uWiki: "https://fr.wikipedia.org/wiki/Sym%C3%A9trie"},
		{desc: "Ses 4 vis Pozidriv", r:false, uWiki: "https://fr.wikipedia.org/wiki/Vis_Pozidriv"},
		{desc: "Son aspect rhombique", r:true, uWiki: "https://fr.wikipedia.org/wiki/Losange"},
		{desc: "Une vis au sud", r:false, uWiki: "https://fr.wikipedia.org/wiki/Rose_des_vents"},
		{desc: "Son aspect d'ellipse", r:false, uWiki: "https://fr.wikipedia.org/wiki/Ellipse_(math%C3%A9matiques)"},
		{desc: "Une vis au Nordé", r:true, uWiki: "https://fr.wiktionary.org/wiki/nord%C3%A9"},
		{desc: "Son aspect carré", r:true, uWiki: "https://fr.wikipedia.org/wiki/Carr%C3%A9"},
		{desc: "Les longueurs des cotés respectent la divine proportion", r:false, uWiki: "https://fr.wikipedia.org/wiki/Nombre_d%27or"},
		{desc: "Ses 4 vis cruciformes", r:true, uWiki: "https://fr.wikipedia.org/wiki/Vis_cruciforme"},
		{desc: "Son périmètre est un parallélogramme", r:true, uWiki: "https://fr.wikipedia.org/wiki/Parall%C3%A9logramme"},
		{desc: "Son périmètre est un polygone concave", r:false, uWiki: "https://fr.wikipedia.org/wiki/Polygone_convexe"},
		{desc: "Ses 4 vis Phillips", r:true, uWiki: "https://fr.wikipedia.org/wiki/Vis_cruciforme"},
		{desc: "Sa symétrie parfaite autour d'un axe horizontal", r:false, uWiki: "https://fr.wikipedia.org/wiki/Sym%C3%A9trie"},
		{desc: "Sa striure verticale", r:true, uWiki: "https://www.dictionnaire-academie.fr/article/A9S3040"},
		{desc: "Une vis à l'est", r:false, uWiki: "https://fr.wikipedia.org/wiki/Rose_des_vents"}
	]
	// return true/false si toutes les saisies sont ok
	function validateCarac() {
		let nbOk = 0
		let nbErr = 0
		for (let i=0; i<tblCarac.length; i++)
			if (tblCarac[i].r == saisies.caracs[i])
				nbOk++
			else
				nbErr++
		let ok = nbOk == tblCarac.length
		if (!ok) newInfoPopup("Tu n'as pas indiqué les bonnes caractéristiques","Tu as une ou plusieurs erreurs",null, {mp3: "prout-long"})
		return ok
	}
</script>

<style>
	.rune { 
		padding: 0.3em;
		border-color: rgb(0, 0, 0, .2);
		border-image-source: url("https://cdn.adhoc.click/ff-7/runemetal.png");
		border-image-repeat: stretch;
		border-image-slice: 2% 2% fill;
		cursor: pointer;
		position: relative;
		height: 4em;
		width: 4em;
		aspect-ratio: 1 / 1;
	}
	.rivet { position: absolute; font-size: 1.5em; color: lightgreen	}	
	.r1 { top: -0.5em; left: 0 }
	.r2 { top: -0.5em; right: 0 }
	.r3 { bottom: -0.3em; right: 0 }
	.r4 { bottom: -0.3em; left: 0 }
	
	label {
		cursor: pointer
	}
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->

<div>
	{#if pseudo.startsWith('Kikiadoc')}
		<div class="adminCadre">
			<div>
				Admin:
				<input type="button" value="resetVis" onclick={async ()=>dspObject= confirm('ResetVis?') && await apiCall('/omega/admResetVis','PATCH')}/>
			</div>
		</div>
	{/if}

	<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
	<input type="button" value="Resultats TBD" onclick={() => epiqStep=0} />
	{#if etatVis}
		<span onclick={markClick} gpHelp="Niveau d'âme restant (plus de {C_AME_REDUC_MAX}% pour pouvoir retirer une vis)" style="cursor: pointer">
			{#if ameRestant > C_AME_REDUC_MAX}❤️{:else}💔{/if}{ameRestant}%<sup>🛈</sup>
		</span>
		{#if ameRestant > C_AME_REDUC_MAX}
			<span onclick={markClick} gpHelp="Délai avant possibilité de retirer une vis" style="cursor: pointer">
				🪛<countdown dth={visDth} /><sup>🛈</sup>
			</span>
		{/if}
		<span onclick={markClick} gpHelp="Reste du trésor de Méphistophélès (en millions de Gils par participant)" style="cursor: pointer">
			🪙{resteGains}<sup>🛈</sup>
		</span>
	{/if}
	
	{#if epiqStep==0}
		<div class="reveal">
			<div>
				<div class="info">
					Ce challenge est un challenge de coopération avec rapidité collégiale
					pour maximiser les gains:
					<br/>
					Le gain maximum est de XXX millions de Gils
					<u>par participant terminant ce challenge</u> mais ce gain diminue au fil du temps.
					<br/>
					Pour éviter qu'il diminue beaucoup, il faut terminer ce challenge rapidement:
					Plus le nombre de participants est important, plus la coopération est facile,
					et chaque minute qui passe diminue le gain de chacun de 25K Gils...
					<br/>
					La réduction de tes gain s'arrête lorsque tu termines ce challenge
					(le gain mini est d'un million de gils)
					<br/>
					N'hésite pas à partager sur Discord et si possible en vocal.
				</div>
			</div>
			<Btn bind:refStep={epiqStep} step=5 val="Un pour tous, tous pour un!" />
		</div>
	{/if}
	{#if epiqStep==5}
		<div class="reveal">
			<div>
				{pseudo}, je ne perçois plus le flux UniCast de la Possession des âmes à mon encontre.
				Je suis à nouveau libre. Encore Merci.
				<div class="br" />
				Je penses que Méphistophélès est derrière tout cela,
				et qu'il a été troublé par la découverte des runes Oméga.
				<div class="br" />
				Je pense qu'il a perçu le danger, qu'il déménage progressivement son trésor
				depuis la station Oméga vers un lieu inaccessible et qu'il fera ensuite exploser
				la Bombe de la Possession: <u>cela annihilera toute volonté des vivants sur Eorzéa</u>.
				<div class="br" />
				Peut-être as tu remarqué que les 25 runes Omega semblent identiques?
				<br />
				Hélas, je n'ai pas recouvré toutes mes capacités,
				sauras-tu identifier pour moi leurs caractéristiques communes?
			</div>
			<Btn bind:refStep={epiqStep} step=10 val="Bien sur!" />
		</div>
	{/if}
	
	{#if epiqStep==10}
		<div class="reveal">
			<div class="br"></div>
			<div>
				<div>Quels sont les caractéristiques remarquables d'une rune Oméga?</div>
				<div class="info">
					De multiples réponses sont possibles.
					Tu peux partager tes idées ou demander de l'aide sur Discord.
				</div>
				<img style="float:right; width:40%" src="{urlCdn}ff-7/runemetal.png" alt="" />
				{#each tblCarac as carac,i}
					<div>
						<input bind:checked={saisies.caracs[i]} type="checkbox" id="omegaS{i}" />
						<label for="omegaS{i}">{carac.desc}</label>
						<a href="{carac.uWiki}" alt="">
							(indice)
						</a>
					</div>
				{/each}
			</div>
			<Btn bind:refStep={epiqStep} step=20 ifFct={()=>validateCarac()} val="C'est mon dernier mot, Grande Peluche" />
		</div>
	{/if}
	
	{#if epiqStep==20 && etatVis}
		<div class="reveal">
			Merci {pseudo}.
			<div class="br" />
			Je crois pouvoir localiser la station Oméga.
			Pour celà, il faut que j'examine le contenu de chaque rune Oméga masquée par les plaques striées
			et reconstituer le message.
			<br />
			Grâce à tes informations, j'ai déterminé le mode opératoire suivant:
			Il faut que j'accède au contenu de chaque rune Omega en retirant la plaque striée la recouvrant.
			Pour cela, il faut d'abord en retirer les 4 vis dans l'ordre: Noroît, Nordé, Suet, Suroît.
			<div class="br" />
			Je n'ai pas encore suffisamment récupéré pour le faire, peux-tu le faire pour moi ?
			<Btn bind:refStep={epiqStep} step=25 val="Je suis impatient!" />
		</div>
	{/if}
	
	{#if epiqStep==25 && etatVis}
		<div class="reveal">
			Attention, l'influence de Mephistophéles est telle que tu perdras {C_AME_REDUC_PAR_RUNE}% de ton âme à chaque action!
			Si ton âme est possédée à plus de {C_AME_REDUC_MAX}% de son éther, tu meurs.
			Tu ne peux donc retirer plus de {C_AME_NB_VIS_MAX} vis.
			<div class="br" />
			Voici le mode opératoire pour retirer les vis:
			<br/>
			- Tu ne peux retirer plus d'une vis par rune, sinon, tu meurs:
			ton âme serait alors immédiatement identifiée et possédée par Mephistophélès.
			<br/>
			- Tu dois te reposer de façon importante après avoir retirée une vis car
			il faut te faire oublier de Méphistophélès. 
			Ton repos est alors important et fonction du nombre de vis que tu as déjà retirées.
			<br/>
			- MAIS si un autre Aventurier retire une vis après toi, c'est son âme que Mehistophélès va focus,
			ton repos sera alors réduit et tu pourras plus rapidement retirer une nouvelle vis.
			<br/>
			<div class="info">
				En cliquant sur une rune, tu peux tenter d'en dévisser une vis dans le bon ordre.
				Pour optimiser les temps de repos, synchronise toi avec les autres joueurs.
			</div>
			<div class="br" />
			<Btn bind:refStep={epiqStep} step=30 ifFct={()=>validateCarac()} val="Je peux le faire" />
		</div>
	{/if}
	
	{#if epiqStep==30 && etatVis && etatVis.nbVisDevissee < 100}
		<div class="reveal">
			<div style="margin: auto; text-align: center">
				<table class="parchemin" style="margin: auto; font-size:0.7em">
					<tbody style="text-align: center">
						{#each indexes as _,l }
							<tr style="height:4em">
								{#each indexes as _,c }
									{@const idx=l*indexes.length+c}
									{@const rune=etatVis.runes[idx]}
									{@const n= (rune)? rune.pseudos.length : 0}
									<td class="rune" onclick={()=>clickRuneVis(idx)}>
										{#if n>0}<div class="rivet r1">o</div>{/if}
										{#if n>1}<div class="rivet r2">o</div>{/if}
										{#if n>2}<div class="rivet r3">o</div>{/if}
										{#if n>3}<div class="rivet r4">o</div>{/if}
										<div>#{idx+1}</div>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if epiqStep==30 && etatVis && etatVis.nbVisDevissee >= 100}
		<div class="reveal">
			vis OK
		</div>
	{/if}
	
</div>

<!-- p380.svelte -->
