<script>
	import { onMount, onDestroy  } from 'svelte';
	import {
		loadIt, storeIt, newInfoPopup, apiCall, addNotification, 
		urlCdn, getEpsilon, markClick, playSound, clickSur
	} from './storage.js'
	
	import Btn from './z/Btn.svelte'
	import Ctrad from './Ctrad.svelte'

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

	let timerId = null
	onMount(() => { 
		console.log('*** mount P380')
		wsCallComponents.add(myWsCallback)
		init()
		timerId = setInterval(timer,1000)
	})
	onDestroy(() => {
		console.log('*** destroy P380')
		wsCallComponents.delete(myWsCallback)
		clearInterval(timerId)
	})

	async function myWsCallback(m) {
		// console.log('ws P380',m.op,m)
		if (m.op=="omega_etat") { etatOmega=m.o; return true }
		if (m.op=="omega_etape") {
			switch(m.o.etape) {
				case 1: // go etape carac
					epiqStep = 50
					newInfoPopup("Attention, nouvelle phase",m.o.pseudo+" a lancé la phase de rapidité",null,
											 {autoClose:20, ding: "call-to-attention"})
					break
				case 2: // go etape vis
					epiqStep = 60
					newInfoPopup("Attention, nouvelle phase",
											[
												m.o.pseudo+" m'a indiqué toutes les caractéristiques des runes",
												"Tu peux tenter de retirer les vis (attention aux malus de Méphistophélès)"
											], null,{autoClose:20, ding: "call-to-attention", mp3:"mission-impossible"})
					break
				case 3: // go etape appartement
					epiqStep = 70
					newInfoPopup("Attention, nouvelle phase",
											[
												"Toutes les vis on été retirées, j'ai enlevé les couvercles de toutes les runes",
												"Analyse le message écrit sur le fond des runes"
											], null,{autoClose:20, ding:"call-to-attention", mp3:"mission-impossible"})
					break
				case 4: // go etape final evenement
					epiqStep = 80
					dspTraduire=null // ferme popup
					dspCodesOmega=null // ferme opup
					newInfoPopup("Sequence de Désactivation acceptée",
											[
												"La bombe de l'Hégémonie a été désactivée",
												"Attention à bien laisser un message sur le livre"
											], null,{autoClose:20, ding:"call-to-attention", mp3:"like-a-melody"})
					break
				default:
					addNotification("Etape "+m.o.etape+" invalide, contacte Kikiadoc")
			}
			return true
		}
		return false
	}

	async function init() {
		console.log("P380 init")
		let ret= await apiCall("/omega/etat")
		if (ret && ret.status==200) {
			etatOmega = ret.o
			ameReducMax=100 - etatOmega.NBMAXVISPARPSEUDO*etatOmega.REDUCAMEPARRUNE
		}
	}

	// etat
	let etatOmega = $state(null) // calculé lors de l'init et de l'effect
	let ameReducMax = $state(null) // calculé lors de l'init
	let resteGains = $state(null) // reste des gains recalulé sur timer
	$effect(()=> {
		if (!etatOmega) { console.log("** integrite: pas encore d'etatOmega"); return; }
		if (!etatOmega.pseudos[pseudo]) { console.log("** integrité: etatOmega.pseudos[pseudo] null"); return }
		etatOmega.flagInit=true
		console.log("*** etatOmega changed")
	})

	// actulise le resteGains toutes les 5 secondes
	function timer() {
		if (!etatOmega) { console.log("**pas d'etatOmega sur timer"); return }
		// si pas commencé
		if (!etatOmega.dthStart) { resteGains = etatOmega.GAINMAX; return }
		// recalcul le reste des gains
		const nbMinutes = (Date.now() - (etatOmega.dthStart+getEpsilon())) / 60000
		const decote = etatOmega.DECOTEPARMIN * nbMinutes
		resteGains = Math.max(Math.floor(etatOmega.GAINMAX - decote),etatOmega.GAINMIN)
	}
	
	// caractéristiques et reponses
	const TBLCARAC = [
		{desc: "Ses 4 vis fendues", r:false, uWiki: "https://fr.wikipedia.org/wiki/Vis_fendue"},
		{desc: "Sa striure horizontale", r:false, uWiki: "https://www.dictionnaire-academie.fr/article/A9S3030"},
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
		{desc: "Sa striure verticale", r:true, uWiki: "https://www.dictionnaire-academie.fr/article/A9S3030"},
		{desc: "Une vis à l'est", r:false, uWiki: "https://fr.wikipedia.org/wiki/Rose_des_vents"}
	]
	// return true/false si toutes les saisies sont ok
	// et passe a l'etape suivante
	async function validateCarac() {
		let nbOk = 0
		let nbErr = 0
		for (let i=0; i<TBLCARAC.length; i++)
			if (TBLCARAC[i].r == saisies.caracs[i])
				nbOk++
			else
				nbErr++
		let ok = nbOk == TBLCARAC.length
		if (!ok)
			newInfoPopup("Tu n'as pas indiqué les bonnes caractéristiques","Tu as une ou plusieurs erreurs",null, {mp3: "prout-long"})
		else {
			// Passage a l'etape des vis
			await apiCall("/omega/etape/2","POST")
		}
		return ok
	}

	// Passage à letape 1 (caractéristiques)
	async function validateStart() {
		await apiCall("/omega/etape/1","POST")
	}

	// tentative de retrait d'une vis
	async function clickRuneVis(i) {
		// vérifications...
		let p = etatOmega.pseudos[pseudo]
		let r = etatOmega.runes[i]
		console.log("timing:",p.nextVisDth,Date.now(),(p.nextVisDth+getEpsilon()) > Date.now())
		let ret= await apiCall("/omega/vis/"+i,"POST")
		if (ret.o && ret.o.txt)
			newInfoPopup("😈 Méphistophélès a ressenti ton action",
									 [
										 "Tu as provoqué un malus du groupe de "+(ret.o.t/1000)+" secondes",
										 "car "+ret.o.txt,
									 ]
									 ,null, {back: "papier", ding: "prout-long"} )
	}

	const INDICES=[
		{t:"Om", c:false },
		{t:"éga", c:false },
		{t:"se", c:false },
		{t:"tro", c:false },
		{t:"uve", c:false },
		{t:"en", c:false },
		{t:"xxxx", c:false },
		{t:"xxxx", c:false },
		{t:"dans", c:false },
		{t:"l'app", c:false },
		{t:"arte", c:false },
		{t:"ment", c:false },
		{t:"nommé", c:false },
		{t:"Hégé", c:false },
		{t:"monie", c:false },
		{t:"Trouve", c:false },
		{t:"le sec", c:false },
		{t:"teur", c:false },
		{t:"puis", c:false },
		{t:"cons", c:false },
		{t:"ulte", c:false },
		{t:"le li", c:false },
		{t:"vre", c:false },
		{t:"xx", c:false },
		{t:"yy", c:false },
	]

	let dspSecteurOmega = $state(null) // affichage de la demande clef Omega
	let dspCodesOmega = $state(null) // affichage de la demande clef Omega
	let dspTraduire = $state(null) // affichage tablette de traudction

	// fonction de lancement du calcul du code numero "i"
	function dspCalcCode(i) {
		dspTraduire = { i: i, nbAsc: dspCodesOmega.valInput[i] }
	}

	// tentative de tourner la clef #i
	async function clefTry(i) {
		// verif que les codes sont valides
		// console.log($state.snapshot(etatOmega.codesOmega))
		if ( etatOmega.codesOmega.includes( null ) )
			return newInfoPopup("Patience...","Tous les codes ne sont pas trouvés",null,{ding: "prout-long"})
		let ret = await apiCall('/omega/clefTry/'+i,'POST')
		if (ret.status==201)
			return newInfoPopup("Trop lent","Tu n'as pas tourné cette clef suffisamment rapidement",null,{ding: "prout-long"})
		// if (ret.status==200) ....
	}
	
	// fonction d'admin
	async function admAction(type) {
		if (!confirm(type)) return
		dspObject= await apiCall('/omega/'+type,'PATCH')
		init()
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
		height: 3em;
		width: 3em;
		aspect-ratio: 1 / 1;
	}
	.rivet { position: absolute; font-size: 1.5em; color: lightgreen	}	
	.r1 { top: -0.5em; left: 0 }
	.r2 { top: -0.5em; right: 0 }
	.r3 { bottom: -0.3em; right: 0 }
	.r4 { bottom: -0.3em; left: 0 }

	.oeuil0 { }
	.oeuil1 { color: lightgreen }
	.oeuil2 { color: orange}
	.oeuil3 { color: red}

	.clef0 { color: red; font-size: 2.5em}
	.clef1 { color: red; font-size: 2.5em }
	.clef2 { color: orange; font-size: 2.5em}
	.clef3 { color: lightgreen; font-size: 2.5em }

	label {
		cursor: pointer
	}
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
				<input type="button" value="resetVis" onclick={async ()=>admAction('admResetVis')}/>
				<input type="button" value="resetTimer" onclick={async ()=>admAction('admResetTimer')}/>
				<input type="button" value="fullVis" onclick={async ()=>admAction('admFullVis')}/>
			</div>
		</div>
	{/if}

	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats TBD" onclick={() => epiqStep=0} />
		<span style="font-size: 0.8em">
		{#if etatOmega && etatOmega.flagInit}
			{@const p=etatOmega.pseudos[pseudo] }
			{@const ameRestant=100 - p.nbVisDevissees*etatOmega.REDUCAMEPARRUNE }
			<span onclick={markClick} gpHelp="Ton niveau d'âme restant: un niveau faible peut provoquer l'ire de Méphistophélès" style="cursor: pointer">
				{#if ameRestant > ameReducMax}❤️{:else}💔{/if}{ameRestant}%<sup>🛈</sup>
			</span>
			<span onclick={markClick} gpHelp="Vert, tu es l'Elu Véloce, Orange, tu es parmi les Surveillés, Rouge: Méphistophélès te regarde, Blanc, il t'ignore" style="cursor: pointer">
				<span class="{'oeuil'+p.oeuil}">👁<sup>🛈</sup></span>
			</span>
			<span onclick={markClick} gpHelp="Délai avant possibilité de retirer une vis sans danger.. Quoique..." style="cursor: pointer">
				🪛<countdown dth={p.nextVisDth} txtTimeout="Possible"/><sup>🛈</sup>
			</span>
			<span onclick={markClick} gpHelp="Reste du trésor de Méphistophélès (en milliers de Gils par participant)" style="cursor: pointer">
				🪙{resteGains}<sup>🛈</sup>
			</span>
			<span onclick={()=>dspObject= etatOmega} gpHelp="Diagnostic technique (ne pas utiliser sans Kikiadoc)" style="cursor: pointer">
				🆘
			</span>
		{/if}
		</span>
	</div>
	
	{#if epiqStep==0 && etatOmega}
		<div class="reveal">
			<div>
				<div class="info">
					Ce challenge est un challenge de coopération avec rapidité collégiale.
					<br/>
					Le gain maximum <u>par participant terminant ce challenge</u>
					est de {etatOmega.GAINMAX/1000} millions de Gils
					mais ce gain diminue de {etatOmega.DECOTEPARMIN}000 Gils par minute
					dès que la phase de rapidité est commencée.
					<br/>
					Plus nombreux vous serez à collaborer, plus rapide sera le challenge.
					<br/>
					La réduction de tes gains s'arrête lorsque tu termines ce challenge.
					<br/>
					Toutes tes actions vont exposer ton âme à Méphistophélès,
					et tu risques d'en perdre un peu à chaque fois!
					<div>
						Attention, une action, si elle est faite dans de mauvaises conditions, peut aussi provoquer un 
						<span class="blinkMsg gpHelp"
							gpHelp="Un malus de groupe empêche tout le groupe de réaliser une action pendant quelques dizaines de seconde"
							onclick={markClick} 
							>
							Malus de Groupe<sup>🛈</sup>
						</span>,
					</div>
					Découvre tes capacités en cliquant sur les <sup>🛈</sup> en haut à droite du bouton résultat.
				</div>
			</div>
			<Btn bind:refStep={epiqStep} step=10 val="Un pour tous, tous pour un!" />
			<div style="clear:both" />
		</div>
	{/if}

	{#if epiqStep==10}
		<div class="reveal">
			<div>
				{pseudo}, je ne perçois plus le flux UniCast de la Possession des âmes à mon encontre.
				Je suis à nouveau libre. Encore Merci.
				<div class="br" />
				Je sais que Méphistophélès est derrière tout cela,
				et qu'il a été effrayé par notre découverte des runes Oméga.
				<div class="br" />
				Il sait que sa défaîte est proche. Je suis sûre qu'il déménage son trésor
				depuis la station Oméga vers un lieu inaccessible et fera ensuite exploser
				une Bombe de la Possession qui annihilera toute volonté des vivants sur Eorzéa.
				<div class="br" />
				Encore faut-il que nous nous rendions à la station Omega et désamorcions la Bombe...
			</div>
			<Btn bind:refStep={epiqStep} step=20 val="Comment peut-on faire?" />
			<div style="clear:both" />
		</div>
	{/if}
	
	{#if epiqStep==20}
		<div class="reveal">
			<div>
				<img style="float:right; width:40%" src="{urlCdn}ff-7/runemetal.png" alt="" />
				Pour celà, il faut que j'examine le contenu de chaque rune Omega
				et reconstitue le message secret destiné aux Nouveaux Anciens d'Eorzéa.
				<div class="br" />
				Peut-être as tu remarqué que les 25 runes Omega semblent identiques?
				<br />
				Peut-être as tu remarqué qu'il y a 4 vis sur chaque rune?
				<div class="br"/>
				Je suis sûre que les runes ont des mécanismes de défense.
				Je ne les connais pas, alors tu devras les découvrir par toi-même.
				<br />
				Je n'ai pas encore recouvré toutes mes capacités,
				sauras-tu identifier pour moi leurs caractéristiques communes
				puis retirer les vis?
			</div>
			<Btn bind:refStep={epiqStep} step=30 val="Bien sur!" />
			<div style="clear:both" />
		</div>
	{/if}
	
	{#if epiqStep==30}
		<div class="reveal">
			<div>
				{pseudo}, j'ai tellement confiance en toi, voici les connectés:
				<br/>
				{#each pseudoList as p}
					<span>{p.toString()}</span> <span> </span>
				{/each}
			</div>
			{#if etatOmega && etatOmega.etape >= 1}
				<div>Le challenge a démarré. Passe à l'étape suivante</div>
				<Btn bind:refStep={epiqStep} step=50 val="Etape suivante" />
			{:else}
				<div class="blinkMsg" style="color:red">
					Vérifie bien que tout le monde est prêt avant de lancer.
					<br/>
					Tu vas alors nous amener instantanément sous le Regard de Méphistophélès
				</div>
				<Btn bind:refStep={epiqStep} ifFct={async ()=> validateStart()} val="Top départ!" />
			{/if}
			<div style="clear:both" />
		</div>
	{/if}
	
	{#if epiqStep==50 && etatOmega && TBLCARAC}
		<div class="reveal">
			<div>
				<div class="info">
					Peu importe si c'est toi ou quelqu'un d'autre qui trouve en premier les bonnes réponses,
					l'important est de le faire le plus vite possible.
					Partage tes questions et solutions sur discord.
				</div>
				<img style="float:right; width:40%" src="{urlCdn}ff-7/runemetal.png" alt="" />
				<div>Quels sont les caractéristiques remarquables d'une rune Oméga?</div>
				{#each TBLCARAC as carac,i}
					<div>
						<input bind:checked={saisies.caracs[i]} type="checkbox" id="omegaS{i}" />
						<label for="omegaS{i}">{carac.desc}</label>
						<a href="{carac.uWiki}" alt="">
							(indice)
						</a>
					</div>
				{/each}
			</div>
			{#if etatOmega && etatOmega.etape >= 2}
				<Btn bind:refStep={epiqStep} step=60 val="Cette étape est terminée" />
			{:else}
				<Btn bind:refStep={epiqStep} ifFct={async ()=> validateCarac()} val="C'est mon dernier mot, Grande Peluche" />
			{/if}
			<div style="clear:both" />
		</div>
	{/if}
	
	{#if epiqStep==60 && etatOmega}
		<div class="reveal">
			<div style="margin: auto; text-align: center">
				<div>Retire prudemment les vis</div>
				<div class="info blinkMsg">Note bien celles que tu retires, attention aux malus</div>
				{#if etatOmega.nbVisDevissees >= 100}
					<div><Btn bind:refStep={epiqStep} step=70 val="Next!" /></div>
				{/if}
				<table class="parchemin" style="margin: auto; font-size:0.7em">
					<tbody style="text-align: center">
						{#each indexes as _,l }
							<tr>
								{#each indexes as _,c }
									{@const idx=l*indexes.length+c}
									{@const rune=etatOmega.runes[idx]}
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
			<div style="clear:both" />
		</div>
	{/if}

	{#if epiqStep==70 && etatOmega}
		<div class="reveal">
			<div style="margin: auto; text-align: center">
				<div>Contenu des Runes Oméga</div>
				{#if false}
					<div><Btn bind:refStep={epiqStep} step=80 val="Next!" /></div>
				{/if}
				<table class="parchemin" style="margin: auto; font-size:0.7em">
					<tbody style="text-align: center" onclick= {()=> {dspCodesOmega={valInput:[null,null,null]}}}>
						{#each indexes as _,l }
							<tr>
								{#each indexes as _,c }
									{@const idx=l*indexes.length+c}
									{@const rune=etatOmega.runes[idx]}
									{@const n= (rune)? rune.pseudos.length : 0}
									<td class="rune blinkRune">
										<div>{INDICES[idx].t}</div>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div style="clear:both" />
		</div>
	{/if}
	
	{#if epiqStep==80 }
		<div class="reveal">
			revoitr la video 
			challenge terminé etc...
			<div style="clear:both" />
		</div>
	{/if}

	{#if etatOmega && dspCodesOmega}
		{@const dejaTrouve = etatOmega.codesOmega.find((e) => e && e.pseudo==pseudo)  }
		{@const nbTrouve = etatOmega.codesOmega.reduce( (a,c) => a+ ((c)? 1:0), 0)}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspCodesOmega=null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent" style="margin: auto; text-align:center">
					<div>Désamorçage de l'Hégémonie</div>
					<div class="info" style="font-size:0.7em">
						Pour arrêter le timer,
						{etatOmega.codesOmega.length} joueurs doivent tourner
						les clefs en même temps.
					</div>
					<table class="parchemin" style="margin: auto; font-size:0.7em">
						<tbody>
							<tr>
								{#each etatOmega.codesOmega as c,i}
									<td style="cursor:pointer; width: 4em">
										{#if c}
											<div onclick={markClick} gpHelp="Code déjà indiqué">
												<div>{c.pseudo}</div>
												<div style="color:lightgreen">✅</div>
												<div>{c.phrase}</div>
											</div>
										{:else if dejaTrouve}
											<div onclick={markClick} gpHelp="Code à trouver par un autre que toi.">
												<div gpHelp="">-----</div>
												<div style="color:red; cursor: pointer">⛭</div>
												<div>{c && c.phrase || "???"}</div>
											</div>
										{:else}
											<div>
												<input bind:value={dspCodesOmega.valInput[i]} type="number" min=1 max=999
													onkeypress={(e) => e.key=="Enter" && dspCalcCode(i) }	/>
											</div>
											<div style="color:lightgreen; cursor: pointer" onclick={()=>dspCalcCode(i)}>⛭</div>
											<div>{c && c.phrase}</div>
										{/if}
										<div class="clef{nbTrouve}" onclick={()=>clefTry(i)}>🗝</div>
										<countdown dth={c && c.lastTryDth} txtTimeout="--:--:--">--:--:--</countdown>
									</td>
								{/each}
							</tr>
						</tbody>
					</table>
					<div class="info">Les codes sont sur le livre de correspondance</div>
					<div class="info">Tu ne peux déverouiller qu'un seul code</div>
				</div>
			</div>
		</div>
	{/if}

	{#if dspTraduire}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspTraduire=null} onkeypress={null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					<Ctrad ascVal={dspTraduire.nbAsc} cbResolve={async (r)=> {
							if (r) {
								let ret = await apiCall('/omega/codeTrouve/'+dspTraduire.i,'POST',r)
								if (ret.status==201) newInfoPopup("Erreur","Ce n'est pas le bon code",null,{ding:"prout-long"})
								// 200 via WS
							}
							dspTraduire=null
						} }
					/>
				</div>
			</div>
		</div>
	{/if}

</div>

<!-- p380.svelte -->
