<script>
	import { onMount, onDestroy  } from 'svelte';
	import {
		loadIt, storeIt, newInfoPopup, apiCall, apiCallExtern, addNotification,
		urlImg, envName, urlCdn, markClick,
		playSound, playVideo, jjmmhhmmss, countDownTo, scrollTop, getEpsilon
	} from './storage.js'
	import Btn from './z/Btn.svelte';
	import Cpacman from './Cpacman.svelte'
	import Cupload from './Cupload.svelte'

	// export let page;
	
	/**
	 * @typedef {Object} Props
	 * @property {any} wsCallComponents
	 * @property {any} pseudo
	 * @property {any} [pageDesc] - export let pageDone = [];
	 * @property {number} [audioVolume]
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

	const pageEpiqLbl= "P"+pageDesc.n+"_epiqStep"
	
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback);  init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback) });

	async function myWsCallback(m) {
		if (m.op=="doctrineDuMal") loadContexte(m)
	}

	// init...
	let myConf = {}
	async function init() {
		loadContexte()
	}
	
	// Gestion de l'épique
	let epiqStep = $state(loadIt(pageEpiqLbl, 0));
	$effect(()=>storeIt(pageEpiqLbl,epiqStep))

	// gestion du contxte
	let tblPnjs = null // tableau des pnjs a proposer
	let ctx = $state(null)
	// {  
	//    pseudos: {pseudo} { etat: , pnjId: , lblLoc: , dthFin:, nbTry:, nbSucces: }
	//    trouves: [] { lettre: , pseudo: , dth: }]
	// }
	async function loadContexte(mWs) {
		let ret = mWs || await apiCall("/doctrineDuMal")
		if (ret.status==200) normalizeContexte(ret.o)
	}
	function normalizeContexte(tmpCtx) {
		console.log("normalizeContexte...")
		// Calcul le nombre de rune trouvées et si le challenge est terminé
	  tmpCtx.termine = tmpCtx.trouves.length == tmpCtx.trouves.reduce( (a, c) => a + ((c && c.pseudo)? 1: 0) ,0)
		if (tmpCtx.termine) playVideo("ff-7-doctrine-2")
		ctx = tmpCtx
	}

	// popup de choix et avancement
	let dspChoix = $state(null)
		
	// clic sur une rune ou simplement pour activer l'avancement (i peut-être nul)
	async function runeClic(i) {
		const now = Date.now() + getEpsilon()
		const iRune = parseInt(i,10)
		// si rune déjà trouvée
		let trouve = (!isNaN(iRune)) && (iRune>=0) && ctx.trouves[iRune]
		if (trouve) return dspChoix = { t:"trouve", trouve: trouve}
		// si rune en tentative par qqun...
		for (const [cPseudo, cStatus] of Object.entries(ctx.pseudos)) {
			if (cStatus.etat=="tentative" && cStatus.iRune==iRune && cPseudo!=pseudo && cStatus.dthFin > now) {
				// rune en cours de tentative...
				dspChoix = { t: "occupe", pseudo: cPseudo, status: cStatus }
				return
			}
		}
		// si challenge termine, on affiche termine
		if (ctx.termine) return dspChoix = { t: "termine" }
		// recupere le status du pseudo
		let status = ctx.pseudos[pseudo]
		// si rien fait ou que timer echu
		if (!status || status.dthFin<now) {
			if (iRune>=0) {
				if (!tblPnjs) {
					let ret= await apiCall("/pnjs/random")
					if (ret.status != 200) return addNotification("Erreur choix random","red",10,"prout-long")
					tblPnjs=ret.o
				}
				dspChoix = { t: "choix", lstPnj: tblPnjs, iRune:iRune }
			}
			else	
				dspChoix = { t: "clicRune"}
			return
		}
		switch(status.etat) {
			case 'tentative': dspChoix = { t: "tentative", status: status}; break
			case 'prison': epiqStep=100; dspChoix = { t: "prison", status: status}; break
			default: dspChoix = { t: "wait", status: status}; break
		}
	}

	async function selectionPnj(iRune,pnj) {
		let ret= await apiCall("/doctrineDuMal/tentative/"+iRune+"/"+pnj.iDb,'PUT')
		if (ret.status==200) dspChoix = { t: "infoEncours", nom: pnj.n, loc: pnj.loc }
		if (ret.status==201) dspChoix = { t: "infoErrDB", nom: pnj.n }
		if (ret.status==202) dspChoix = { t: "pasassezrapide" }
	}

	let reponseTentativeEnCours=false;
	async function reponseTentative() {
		if (reponseTentativeEnCours) return newInfoPopup("STOP","On ne bourrine pas le bouton...")
		reponseTentativeEnCours=true;
		let ret = await apiCall('/doctrineDuMal/proposition/'+dspChoix.X+'/'+dspChoix.Y,"POST",dspChoix.imageDataRaw)
		reponseTentativeEnCours=false;
		switch(ret.status) {
			case 200:
				newInfoPopup(dspChoix.status.nom+" est un Grand Pnj","Il t'a donné la rune #"+(ret.o.iRune+1));
				// ne pas envoyer la video si c'est terminé!
				if (!ctx.termine) playVideo("ff-7-doctrine-1")
				tblPnjs=null
				dspChoix=null;
				break;
			case 201:
				addNotification("Les coordonnées ne sont pas les bonnes","red",10,"prout-long");
				break;
			case 202:
				newInfoPopup(dspChoix.status.nom+" est un simple Pnj",
					["Tu n'as obtenu aucune info","Reprends ton exploration dans quelques secondes"]);
				tblPnjs=null
				dspChoix=null;
				break;
			case 203:
				newInfoPopup(dspChoix.status.nom+"est corrompu","Ton âme a été capturée");
				tblPnjs=null
				dspChoix=null
				epiqStep=100
				break;
		}
	}
		
	// sortie de prison
	function sortiePrison() {
		epiqStep=99
		apiCall("/doctrineDuMal/sortiePrison",'PUT')
		playVideo("ff-7-portemagique")
	}
	
	// saisies et resultat
	let saisies = $state({})
	let dspResultat = $state(null)

	// calcul de la synhèse de résultat
	async function calcResultat() {
		if (!ctx || !ctx.trouves) return addNotification("Résultats non disponibles")
		let tRes = { nb:0, total: ctx.trouves.length, pseudos: {} }
		ctx.trouves.forEach((e)=>{
			if (e) {
				tRes.pseudos[e.pseudo] ??= 0
				tRes.pseudos[e.pseudo]++
				tRes.nb++
			}
		})
		dspResultat=tRes
	}
	

	// variable de stockage du blog de l'image
	let imageDataRaw = null
	
</script>

<style>
		@import url('https://fonts.googleapis.com/css2?family=Bungee+Tint&display=swap');
	
	.rune {
	  padding: 0.3em;
		border-color: rgb(0, 0, 0, .2);
	  border-image-source: url("https://cdn.adhoc.click/ff-7/runemetal.png");
		border-image-repeat: stretch;
		border-image-slice: 2% 2% fill;
		display: inline-block;
		cursor: pointer;
	}
	.runeLetter {
		padding: 0;
		font-family: "Bungee Tint"; color: red; font-size:1.5em; font-weight: bold;
	}
	.runeIndex {
		font-size:0.5em; font-weight: bold; text-align: center
	}
	.Runes {
		font-family: "Bungee Tint"; color: red; font-size:3em; font-weight: bold;
	}

</style>
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div>
{#if pseudo.startsWith('Kikiadoc')}
	<div class="adminCadre">
		Admin: 
		<input type="button" onclick={async ()=>confirm('reset Challenge') && (dspObject= await apiCall("/doctrineDuMal",'DELETE'))} value="Reset" />
		<input type="button" onclick={async ()=>confirm('clear timer') && (dspObject= await apiCall("/doctrineDuMal/clrTimer",'PATCH'))} value="Clear Timer" />
		<input type="button" onclick={async ()=>confirm('setFull') && (dspObject= await apiCall("/doctrineDuMal/setFull",'PATCH'))} value="Set Full-1" />
		<input type="text" bind:value={saisies.lettre} size=5 placeholder="lettre" />
		<input type="button" onclick={async ()=> { dspObject = await apiCall("/pnjs/lettre/"+saisies.lettre) }} value=">" />
		<input type="button" onclick={async ()=> { dspObject = await apiCall("/pnjs/random/"+saisies.lettre) }} value="Random" />
		<input type="button" onclick={async ()=> { dspObject = await apiCall("/pnjs/data") }} value="gData" />
		<input type="text" bind:value={saisies.id} placeholder="id dans DB" />
		<input type="button" onclick={async () => {dspObject = await apiCall("/pnjs/id/"+saisies.id) }} value=">" />
		<input type="number" min=1 max=99 bind:value={saisies.iRune} placeholder="#1..X" />
		<input type="button" onclick={async () => {dspObject= await apiCall("/doctrineDuMal/clrRune/"+saisies.iRune,'PATCH') }} value=">" />
	</div>
{/if}

<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
<input type="button" value="Résultat" onclick={calcResultat} />
<input type="button" value="Que puis-je faire?" onclick={()=>runeClic()} />

{#if epiqStep==0}
	<div class="reveal">
		<img class="parchemin" style="float: right; width:30%" src="{urlCdn+'ff-7/eorzea-carte.png'}" alt="" />

		{pseudo}, tu sais que j'étudie très attentivement le Grimoire de la Magie.
		<div class="br"></div>
		Il y est fait référence d'une Doctrine qui semble être le mot d'ordre des Nouveaux Anciens.
		<div class="br"></div>
		Selon le Grimoire des Savoirs, de nombreux documents des Anciens ont été éparpillés en Eorzéa
		lors de la Fragmentation. La Doctrine doit en faire partie.
		<div class="br"></div>
		Un 
		<span onclick={markClick}
			gpHelp="Un habitant est un PNJ de FF14 dont les caractéristiques ont été sélectionnées pour ce challenge"
			style="cursor: pointer" >
			habitant
			<sup>🛈</sup>
		</span>
		pourrait avoir récupéré une des Runes composant la Doctrine.
		<div class="br"/>
		<Btn bind:refStep={epiqStep} step=10 val="Trouver un habitant, c'est facile!" />
		<div class="info">
			Lors de ce challenge, le serveur accède à des sites externes (Lodestone, Garland, xivApi)
			pour amender sa propre base de connaissance.
			<br/>
			En cas de soucis d'intégrité sur les infos d'un PNJ, MP @Kikiadoc
		</div>
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==10}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/Tour80jours.png"} style="width:30%; float:right" alt="" />
		Détrompe-toi,
		il y a des dizaines de milliers
		<span onclick={markClick}
			gpHelp="Un habitant est un PNJ de FF14 dont les caractéristiques ont été sélectionnées pour ce challenge"
			style="cursor: pointer" >
			d'habitants
			<sup>🛈</sup>
		</span>
		en Eorzéa.
		<div class="br"/>
		Trouver des habitants ayant trouvé une des Runes de la Doctrine
		ne me semble pas si simple que ça.
		<div class="br"/>
		Heureusement, lorsque 
		<a href="https://fr.wikipedia.org/wiki/Phileas_Fogg" target="_blank">
			Philéas Lodestone
		</a>
		a fait le tour d'Eorzéa en 80 jours, il a pu
		identifier le nom des habitants et les a répertoriés
		dans le Grimoire de Recensement que je conserve précieusement.
		J'en ai réduit la liste à seulement 5400.
		<div class="br"/>
		<Btn bind:refStep={epiqStep} step=20 val="5400! Et il faut tous les interroger?" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==20}
	<div class="reveal">
		<img class="parchemin" style="float: right; width:30%" src="{urlCdn+'ff-7/echantillons.png'}" alt="" />
		J'espère que non. Sinon, on va passer 25 ères australes et ombrales à tous les interroger!
		<div class="br"></div>
		La Peluche statisticienne
		<a href="https://fr.wikipedia.org/wiki/William_Cochran" target="_blank">William Cochran</a>
		(ne pas confondre avec 
		<a href="https://fr.wikipedia.org/wiki/Zefram_Cochrane" target="_blank">Zephram Cochrane</a>
		)
		m'a indiqué que pour trouver les runes, il faut procéder par
		<a href="https://fr.wikipedia.org/wiki/Plan_d%27exp%C3%A9riences" target="_blank">plans d'expériences</a>
		et
		<a href="https://fr.wikipedia.org/wiki/%C3%89chantillon_(statistiques)" target="_blank">échantillonnages</a>
		<div class="br"/>
		<Btn bind:refStep={epiqStep} step=30 val="Et c'est compliqué?" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==30}
	<div class="reveal">
		<img class="parchemin" style="float: right; width:30%" src="{urlCdn+'ff-7/echantillons.png'}" alt="" />
		Mais non!
		<div class="br"></div>
		Tu choisis une rune à découvrir,
		je t'indique un échantillon de 5 habitants possibles,
		tu choisis l'un d'entre eux,
		tu vas le voir et
		tu lui demandes s'il a des informations concernant la rune. Et c'est tout!
		<div class="br"/>
		<Btn bind:refStep={epiqStep} step=40 val="Et il n'y a pas de lézard?" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==40}
	<div class="reveal">
		<img class="parchemin" style="float: right; width:30%" src="{urlCdn+'ff-7/echantillons.png'}" alt="" />
		En fait, il y a juste quelques petits trucs...
		<div class="br" />
		La Peluche Philéas Lodestone n'a pas indiqué les coordonnées exactes d'un habitant
		dans le Grimoire de Recensement, seulement la zone où il se trouve.
		Alors il faudra un peu explorer la zone concernée pour le trouver..
		<div class="br" />
		Et pour compléter le Grimoire du Recensement, tu devras m'indiquer les
		coordonnées de l'habitant et faire un screen de toi avec lui.
		<div class="br"></div>
		Enfin, selon ton charisme, et s'il a trouvé une rune, il te la donnera.
		<br/>
		Je compléterai alors la Doctrine.
		<br/>
		Mais attention, si l'habitant est possédé, tu risques la prison des âmes.
		<div class="br"/>
		<Btn bind:refStep={epiqStep} step=50 val="Pff, je m'en doutais" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==50}
	<div class="reveal">
		<img class="parchemin" style="float: right; width:30%" src="{urlCdn+'ff-7/echantillons.png'}" alt="" />
		Allez, et n'oublie pas que d'autres Aventuriers vont aussi aller à la rencontre d'habitants
		mais ce ne seront pas les mêmes!
		Pour chaque rune à découvrir, je donne à chacun un échantillon d'habitants différent.
		<div class="br"></div>
		Autre petit truc, il te faut trouver l'habitant dans les 30 minutes suivant ton choix de Rune.
		Je ne peux me permettre d'attendre si tu dors!
		<div class="br"></div>
		Et si les voyages forment les Aventuriers, ca fatigue aussi, donc après chaque découverte,
		tu devras te reposer. Plus tu auras fait de découvertes, plus tu devras te reposer.
		<div class="br"/>
		<Btn bind:refStep={epiqStep} step=99 val="C'est bon, je peux explorer Eorzéa?" />
		<div style="clear:both" />
	</div>
{/if}

{#if epiqStep==99 && ctx}
	<div>
		<div>
			Doctrine des Nouveaux Anciens:
			<div>
				{#each ctx.trouves as descRune,i}
					<div class="rune" onclick={()=>runeClic(i)} role="button" tabindex=0 onkeypress={null}>
						<div class="runeLetter">{descRune && descRune.lettre || '?'}</div>
						<div class="runeIndex">#{i+1}</div>
					</div>
				{/each}
			</div>
		</div>
		{#if ctx.termine}
			<div>
				<Btn bind:refPage={page} bind:refPageDone={pageDone} page=0 pageDone={pageDesc.n} val="Le challenge est terminé" />
				<Btn video="ff-7-doctrine-2" val="Revoir la video" />
			</div>
		{:else}
			<div>
				Activités:
			</div>
			<div>
				{#each Object.keys(ctx.pseudos) as pseudo,i}
					{@const status=ctx.pseudos[pseudo]}
					{@const dthFin= status.dthFin+getEpsilon()}
					{@const isActive= dthFin > Date.now()}
					<div style="font-size:0.8em" >
						{pseudo}
						{#if status.etat=="prison" && isActive}
							est dans la prison des âmes
						{:else if status.etat=="tentative" && isActive}
							recherche la Rune #{status.iRune+1}: {status.nom}@{status.loc}
						{:else if status.etat=="relax" && isActive}
							doit se reposer
						{:else}
							peut tenter de découvrir une rune
						{/if}
						{#if isActive}
							(<countdown dth={dthFin} oncdTimeout={()=>ctx.pseudos[pseudo].dthFin=0} />)
						{/if}
					</div>
				{/each}
			</div>
		{/if}
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==100 && ctx}
	<Cpacman cbSuccess={sortiePrison} targetScore=1500 />
{/if}

{#if dspChoix}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspChoix=null} onkeypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div class="adminCadre" style="font-size: 0.8em">
					Debug: 
					typeAction={dspChoix.t}
					iRune={dspChoix.status && dspChoix.status.iRune || "na"}
					idDb={dspChoix.status && dspChoix.status.pnjId || "na"}
					targetDth={dspChoix.status && dspChoix.status.dthFin || "na"}
					ε={getEpsilon()}ms
				</div>
				{#if dspChoix.t=="termine"}
					<div>Le challenge est terminé</div>
				{/if}
				{#if dspChoix.t=="clicRune"}
					<div>Clique sur un rune non découverte de la Doctrine</div>
				{/if}
				{#if dspChoix.t=="occupe"}
					<div>{dspChoix.pseudo} tente déjà de découvrir cette rune</div>
				{/if}
				{#if dspChoix.t=="pasassezrapide"}
					<div>Un autre joueur vient de se lancer à la recherche de cette rune</div>
				{/if}
				{#if dspChoix.t=="choix"}
					<div>{pseudo}, choisis un pnj à interroger pour identifier la rune #{dspChoix.iRune+1}</div>
					<div style="font-size:0.8em; font-style: italic;">
						Plus la zone de recherche est haut niveau, plus tu as de chance de recueillir une information.
					</div>
					{#each dspChoix.lstPnj as pnj,i}
						<div style="cursor:pointer" onclick={()=>selectionPnj(dspChoix.iRune,pnj)} role="button" tabindex=0 onkeypress={null}>
							👉{pnj.n} ({pnj.loc})
						</div>
					{/each}
				{/if}
				{#if dspChoix.t == "tentative"}
					{pseudo}, il te reste
					<countdown dth={dspChoix.status.dthFin+getEpsilon()} oncdTimeout={()=>{dspChoix=null}}>
						{countDownTo(dspChoix.status.dthFin+getEpsilon())}
					</countdown>
					pour tenter de découvrir la rune #{dspChoix.status.iRune+1}
					<br/>
					Si tu as trouvé le PNJ nommé <u>{dspChoix.status.nom}</u>
					en {dspChoix.status.loc},
					indique moi ses coordonnées selon ta boussole IG et fait un screen de ton perso avec le PNJ.
					<i>(tu peux faire une photo de ton écran avec ton smartphone)</i>
					<table width="100%"><tbody><tr>
						<td style="vertical-align: top; text-align: right; width:49%">
							<div>X:<input bind:value={dspChoix.X} type="number" step="0.1" size=6 placeholder="xx.x" /></div>
							<div>Y:<input bind:value={dspChoix.Y} type="number" step="0.1" size=6 placeholder="yy.y" /></div>
							{#if dspChoix.X && dspChoix.Y && dspChoix.imageDataRaw}
								<input type="button" style="background-color:lightgreen" value="Je valide >" onclick={reponseTentative} />
							{:else if dspChoix.X && dspChoix.Y}
								<div style="color:red">Screen?</div>
							{:else}
								<div style="color:red">Coordonnées?</div>
							{/if}
						</td>
						<td style="width:50%">
							<Cupload cbImageRaw={(raw)=>dspChoix.imageDataRaw=raw}/>
						</td>
					</tr></tbody></table>
				{/if}
				{#if dspChoix.t == "wait"}
					Reposes-toi
					<countdown dth={dspChoix.status.dthFin+getEpsilon()} oncdTimeout={()=>dspChoix=null} >
						{countDownTo(dspChoix.status.dthFin+getEpsilon())}
					</countdown>
					avant de reprendre tes aventures.
				{/if}
				{#if dspChoix.t == "trouve"}
					<div style="text-align: center">
						<div>
							Rune déjà découverte
						</div>
						<div>
							({dspChoix.trouve.pseudo} {jjmmhhmmss(dspChoix.trouve.dth)})
						</div>
						<div class="Runes">{dspChoix.trouve.lettre.toUpperCase()}</div>
						<div>
							<img alt="" style="width:90%"
								src={urlImg+'AI-Generated/'+envName+'-doctrineDuMal-'+dspChoix.trouve.iRune+".upload"}
							/>
						</div>
					</div>
				{/if}
				{#if dspChoix.t == "infoEncours"}
					Rends-toi en {dspChoix.loc} à la recherche de {dspChoix.nom}.
					Quand tu l'auras trouvé reviens me voir.
					<div class="info">
						 Ferme ce popup (<countdown dth={Date.now()+15000} oncdTimeout={()=>dspChoix=null} />)
					</div>
				{/if}
				{#if dspChoix.t == "infoErrDB"}
					Hélas, la Peluche
					<a href="https://fr.wikipedia.org/wiki/Phileas_Fogg" alt="" target="_blank">
						Philéas Garland,
					</a>
					lors de son exploration d'Eorzéa,
					n'a pas noté correctement toutes les informations pour {dspChoix.nom}
					dans le Grimoire du Recensement.
					<br/>
					Je suis au regrêt de devoir te demander de choisir un autre PNJ
					<div class="info">
						Incohérence détectée entre le Lodestone, Garland et XIVapi
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if dspResultat}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspResultat=false} onkeypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>Découvreurs de runes:</div>
				{#each Object.keys(dspResultat.pseudos) as pseudo,i }
					<div>{pseudo}: {dspResultat.pseudos[pseudo]}</div>
				{/each}
				<div>Runes trouvées {dspResultat.nb}/{dspResultat.total}:</div>
			</div>
		</div>
	</div>
{/if}
</div>
<!-- P335.svelte -->

