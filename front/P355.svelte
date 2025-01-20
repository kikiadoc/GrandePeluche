<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		loadIt, storeIt, apiCall, urlImg,
		addNotification, newInfoPopup, playVideo, playDing, jjmmhhmmss, getHautFait
	} from "./storage.js"

	import Btn from './z/Btn.svelte'
	import Ctrad from './Ctrad.svelte'
	
	/**
	 * @typedef {Object} Props
	 * @property {any} wsCallComponents
	 * @property {any} pseudo
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
	
	// Gestion des reload, refresh etc..
	onMount(() => {
		console.log("mount P355")
		if (wsCallComponents) wsCallComponents.add(myWsCallback)
		chercheDelay = 15 // reinit au load
		loadEtat(null)
	})
	onDestroy(() => {
		console.log("destroy P355")
		if (wsCallComponents) wsCallComponents.delete(myWsCallback)
	})
	// callback sur le websocket
	function myWsCallback(m) {
		// if (m.op=="torches") {	console.log('reloadEtat'); loadEtat(m); return true }
	}

	// etape epique
	const pageEpiqLbl = "P"+pageDesc.n + "_epiqStep"
	let epiqStep = $state(loadIt(pageEpiqLbl,0))
	$effect(()=>storeIt(pageEpiqLbl,epiqStep))

	// etat des saisies
	const pageSaisiesLbl = "P"+pageDesc.n + "_saisies"
	let saisies = $state(loadIt(pageSaisiesLbl,{tableaux:[],nombres:[],traductions:[]}))
	$effect(()=>storeIt(pageSaisiesLbl,saisies))

	// gestion du delay s'inpertinence
	let chercheDelay = $state(15)
	
	const tableaux = [
		{ n: "Le bazar argenté", t:1 },
		{ n: "Le Moulin des Bois", t:4 },
		{ n: "Les Piques pendues", t:2 },
		{ n: "Pierrechantantes", t:5 },
		{ n: "La Tour de Cristal", t:3 },
		{ n: "Le temple enseveli de Qarn", t:0 }
	]
	const peluches = [
		{n: 48},
		{n: 3},
		{n: 4},
		{n: 5},
		{n: 6},
		{n: 16}
	]
	// etat actue du challenge (maj par get ou WS)
	let etat = null

	// chargement de l'état (mWs msg du websocket ou d'un autre requete null)
	async function loadEtat(mWs) {
		/*
		let ret = (!mWs)?  await apiCall("/torches/etat") : mWs
		if ( !ret.o || !ret.o.historique)
			return addNotification("Erreur sur chargement de l'état du challenge, contacte Kikiadoc","red",30)
		ret.o.dthDiffered = ret.o.relaxDthByPseudo[pseudo] || 0
		etat = ret.o
		recalcEtat()
		*/
	}

	// vérif si tous les tableaux sont OK
	function isTableauxValid() {
		for (let i=0;i<tableaux.length;i++) 
			if (saisies.tableaux[i] != i) return false
		return true
	}

	// popup de traduciton des nombres
	let dspTraduire = $state(null)
	function traduire(i) {
		console.log("traduire",i,saisies.nombres[i])
		dspTraduire = { i: i, nbAsc: saisies.nombres[i] }
	}

	// verif si traductions faites (mais pas forcement valides)
	function isTraductionsFaites() {
		for (let i=0;i<peluches.length;i++) 
			if (!saisies.traductions[i]) return false
		return true
	}
	
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
	  <input type="button" onclick={()=> saisies={tableaux:[],nombres:[],traductions:[]}} value="ResetSaisies" />
	  <input type="button" onclick={()=> confirm('resetHautFait') && apiCall('/hautsFaits/decouvreurDeLaSource','DELETE')} value="ResetHautFaits" />
	</div>
{/if}

<div>
  <input type="button" onclick={()=> epiqStep=0} value="Revoir le lore" />
  <input type="button" onclick={async ()=> dspResultats = await getHautFait("decouvreurDeLaSource")} value="Résultats" />
</div>

{#if epiqStep==0}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/peinture.png"} style="width:30%; float:right" alt="" />
		La Torchère de l'Hégémonie n'est plus qu'un souvenir.
		Encore bravo!
		<div class="br"></div>
		Souviens-toi {pseudo},
		<br/>
		il y a quelques jours, OSS117 a, la première, envoyé la Torchère dans les Limbes.
		<br/>
		Elle a réussi à s'enfuir après avoir fait exploser le site de production de Station Neuf.
		<div class="br"></div>
		De retour de mission, elle m'a confié de nombreux débris de l'explosion.
		Six d'entre-eux ont attiré mon attention car ils indiquent des lieux d'Eorzéa:
		Ils cachent peut-être un message des Nouveaux Anciens.
		<div class="br"></div>
		Je les ai exposés sous la forme de 6 tableaux que tu peux voir dans la Crypte des Valeureux, au sous-sol de la maison de CL de Kikiadoc.
		Sauras-tu m'aider en identifiant les lieux associés?
		<br/>
		<Btn msg="Pff, je t'ai déjà dit de lire le Lore ATTENTIVEMENT" val="C'est ou?" />
		<Btn bind:refStep={epiqStep} step=10 val="J'en suis sûr" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==10}
	<div class="reveal">
		<div>Identifie les lieux des tableaux:</div>
		<img class="parchemin" src={urlImg+"ff-7/maison-cl-sous-sol.png"} style="width:30%; float:right" alt="" />
		{#each tableaux as _,n}
			<div>
				{n+1}:
				<select style="width:40%" bind:value={saisies.tableaux[n]}>
					<option value=0>Choisir...</option>
					{#each tableaux as t,i}
						<option value={t.t}>{t.n}</option>
					{/each}
				</select>
			</div>
		{/each}
		<Btn bind:refStep={epiqStep} step=15 val="J'ai identifié les lieux" ifFct={()=>isTableauxValid()}
			koMsg="Tu n'as pas correctement identifié les tableaux"
			/>
		<div class="info">Les tableaux 1,2,3 sont au nord, les 4,5,6 au sud.</div>
		<div class="info">Chacune des 6 possibilités est à associer à un tableau.</div>
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==15}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/geomaticien.jpg"} style="width:30%; float:right" alt="" />
		Merci {pseudo}.
		<div class="br"></div>
		J'ai indiqué ces différents lieux aux
		<a href="https://fr.wikipedia.org/wiki/G%C3%A9omatique" target="_blank">
			Peluches Géomaticiennes
		</a>
		<div class="br"></div>
		Elles sont unanimes, ce sont les 
		<a href="https://fr.wikipedia.org/wiki/Offuscation" target="_blank">
			coordonnnées offusquées
		</a>
		d'un lieu	appelé la Chambre du 4ème Pouvoir, lui même situé dans la maison de CL de Kikiadoc.
		<div class="br"></div>
		Peux-tu t'y rendre?
		<br/>
		<Btn msg="Pff, je t'ai déjà dit de lire le Lore attentivement" val="C'est ou?" />
		<Btn bind:refStep={epiqStep} step=17 val="Tout de suite!" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==17}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/chambre4eme.png"} style="width:30%; float:right" alt="" />
		Bien {pseudo}, décris moi un peu ce qui s'y trouve.
		<div class="info">Tous les objets sont visibles</div>
		Il y a...
		<br/>
		<input type="number" min=0 max=10 size=5 bind:value={saisies.p4NbTableaux} />tableaux sur les murs
		<br/>
		<input type="number" min=0 max=10 size=5 bind:value={saisies.p4NbTables} />tables tactiques
		<br/>
		<input type="number" min=0 max=50 size=5 bind:value={saisies.p4NbPeluches} />peluches de Bunbuku sur les tables
		<br/>
		<Btn bind:refStep={epiqStep} step=20 val="J'ai fait l'inventaire!"
			ifFct={()=>saisies.p4NbTableaux==4 && saisies.p4NbTables==6 && saisies.p4NbPeluches==37}
			koMsg="Recompte encore!"
			/>
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==20}
	<div class="reveal">
		Ok, je suppose que les Peluches de Bunbuku sont disposées de façon géométrique sur les tables tactiques.
		<br/>
		Selon le Grimoire des Savoirs, les Anciens utilisaient parfois le 
		<span class="videoLink" onclick={()=>playVideo('ff-7-boulier')} role='button' onkeypress={null} tabindex=0>
			code du Boulier Bunbuku
		</span>.
		<div class="br"></div>
		<img class="parchemin" src={urlImg+"ff-7/ChambrePouvoir.png"} style="width:30%; float:right" alt="" />
		Examine les tables tactiques qui s'y trouvent et note ci-dessous les nombres indiqués
		par les Nouveaux Anciens.
		<br/>
		<div class="info">Pour chaque nombre, traduit le en langage Eorzéen en cliquant sur "➤".</div>
		{#each peluches as _,i}
			<div>
				{i+1}: 
				<input type="number" placeholder="nombre" min=1 max=99 bind:value={saisies.nombres[i]} />
				<input type="button" value="➤" onclick={()=>traduire(i)} />
				{saisies.traductions[i] || ""}
			</div>
		{/each}
		<div>Quand tu as fini, clique ci-dessous</div>
		<Btn bind:refStep={epiqStep} step=30 val="J'ai tout traduit" ifFct={()=>isTraductionsFaites()}
			msg="En cas d'erreur, tu peux cliquer sur revoir le lore et modifier tes informations"
			koMsg="Tu n'as pas traduits les 6 nombres, LIS LE LORE BORDEL" koDing='prout-long'
			/>
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==30}
	<div class="reveal">
		Selon tes traductions, les Nouveaux Anciens mentionne un lieu à
		<br/>
		{#each peluches as _,i}
			{saisies.traductions[i]}
			&nbsp;
		{/each}
		<div class="br"></div>
		Vas-y et indique-moi comment ce lieu est nommé par les Nouveaux Anciens.
		<div class="info">(c'est indiqué sur le livre de correspondance par un nombre Ancien qu'il faut traduire)</div>
		<input type="number" placeholder="nombre" min=0 max=99 bind:value={saisies.nombres[6]} />
		<input type="button" value="➤" onclick={()=>traduire(6)} />
		{saisies.traductions[6] || "??"}
		<br/>
		<Btn bind:refStep={epiqStep} step=0 val="Je ne trouve pas"
			msg="Relis le lore, vérifie toutes les infos que tu as indiquées et modifie-les si tu t'es trompé" />
		<Btn bind:refStep={epiqStep} step=40 val="J'ai trouvé" ifFct={()=>saisies.traductions[6]=="La Source"}
			koMsg="Impossible de faire réagir le Grimoire des Savoirs avec ce nom" koDing="prout-long" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==40}
	<div class="reveal">
		La Source, j'ai lu quelque chose à ce propos dans le Grimoire des Savoirs.
		<br/>
		Patiente 
		<countdown style="color:red" dth={Date.now()+(chercheDelay*1000)} oncdTimeout={()=>epiqStep=45}></countdown>
		, je cherche dans le Grimoire...
		<br/>
		<Btn bind:refStep={epiqStep} step=40 val="Grouille-toi!" ifFct={()=> chercheDelay+=30 }
			msg="Mais tu te prends pour qui? Faut pas pousser la Grande Peluche dans l'escalier... Pour ta peine, je me fais un café et tu vas poiroter un peu plus!" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==45}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/lasource-cartes.png"} style="width:50%; float:right" alt="" />
		La Source.. J'ai trouvé !
		<br/>
		<Btn bind:refStep={epiqStep} step=50 val="Explique-moi!" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==50}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/lasource-cartes.png"} style="width:40%; float:right" alt="" />
		<div style="br"></div>
		{pseudo}, c'est un endroit TRES dangereux.
		C'est là que se trouve le générateur du Gaz de Possession.
		<br/>
		Surtout, ne t'en n'approche pas, il est au fond de La Source!
		<br/>
		La diffusion du Gaz se fait par des cartes à Avaloirs.
		Elles ressemblent à des 
		<a target="_blank" href="https://fr.finalfantasyxiv.com/lodestone/playguide/db/item/cc090f63109/" alt="">
			cartes astrales.
		</a>
		<br/>
		Combien y-a-t-il de cartes à Avaloirs dans La Source ?
		<br/>
		<input type="number" placeholder="nombre" min=0 max=99 bind:value={saisies.nbCartes} />
		<Btn bind:refStep={epiqStep} step=60 val="➤" ifFct={()=> saisies.nbCartes==10 }
			bind:refPageDone={pageDone} pageDone={pageDesc.n}
			hautFait="decouvreurDeLaSource"
			koMsg="Recompte encore" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==60}
	<div class="reveal">
		10 cartes, ca fait 40 lieux...
		C'est énorme...
		<br/>
		Et pour chaque lieu, il faut boucher l'avaloir et aller à... 
		<br/>
		Holala, c'est tellement long pour une seule personne que je vais solliciter tous les Aventuriers!
		<br/>
		Je t'expliquerai comment faire un peu plus tard.
		<br/>
		Encore bravo {pseudo}.
		<br/>
		<Btn bind:refPage={page} page=0 val="Merci Grande Peluche" />
		<div class="info">
			Ce challenge est terminé, tu peux le rebalayer en cliquant sur 'revoir le Lore'
			et voir les résultats actuels en cliquant sur 'Résultats'.
			<br/>
			Tu peux revenir ici en cliquant sur <b>{pageDesc.texte}</b> dans ta liste des possibles
		</div>
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==99 && etat}
	<div>
	</div>
{/if}

{#if dspTraduire}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspTraduire=false} onkeypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				traduction... {dspTraduire.nbAsc}
				<Ctrad ascVal={dspTraduire.nbAsc} cbResolve={(r)=>{if (r) saisies.traductions[dspTraduire.i] = r.phrase || r.nbEor; dspTraduire=null}} />
			</div>
		</div>
	</div>
{/if}

{#if dspResultats}
	{@const pseudos=Object.entries(dspResultats.pseudos)}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspResultats=false} onkeypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>Découvreurs de la Station Alpha</div>
				<hr/>
				{#each pseudos as p,i}
					<div>{p[0]} {jjmmhhmmss(p[1].dth)}</div>
				{/each}
				<hr/>
				<div>Total: {pseudos.length}</div>
			</div>
		</div>
	</div>
{/if}
</div>

<!-- P355.svelte -->
