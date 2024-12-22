<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		loadIt, storeIt, apiCall, getEpsilon, jjmmhhmmss, markClick,
		addNotification, newInfoPopup, playVideo, urlCdn, countDownTo, isEquipementPC
	} from "./storage.js"

	// pour les screens: mascotte fantome triste ou poupée ascienne
	// gobelin de la mimine bleue
	
	import Btn from './z/Btn.svelte'
  
	/**
	 * @typedef {Object} Props
	 * @property {any} wsCallComponents
	 * @property {any} pseudo
	 * @property {any} [pageDesc] - export let page
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
  // export let pageDone = []
	// export let pseudoList = []

	
	// timeout pour les tick du reparateur
	let timeoutId = null

	// Gestion des reload, refresh etc..
	onMount(() => {
		if (wsCallComponents) wsCallComponents.add(myWsCallback)
		loadEtat(null)
		timeoutId = setInterval(onTimer,500)
	})
	onDestroy(() => {
		if (wsCallComponents) wsCallComponents.delete(myWsCallback)
		clearInterval(timeoutId)
	})
	// callback sur le websocket
	function myWsCallback(m) {
		if (m.op=="usinesGaz") {	loadEtat(m); return true }
	}
	
	const pageEpiqLbl = "P"+pageDesc.n + "_epiqStep"
	const pageSaisiesLbl = "P"+pageDesc.n + "_saisies"
	// etape de l'epique
	let epiqStep = $state(loadIt(pageEpiqLbl,0))
	$effect(()=>storeIt(pageEpiqLbl,epiqStep))
	// etat des saisies
	let saisies = $state(loadIt(pageSaisiesLbl,{}))
	$effect(()=>storeIt(pageSaisiesLbl,saisies))


	// etat actue du challenge (maj par get ou WS)
	const tblLigne = $state(new Array(10).fill(false))
	const tblCol = $state(new Array(4).fill(false))
	let etat = $state(null) // { divers, lieux[]: { status, unlockPseudo, unlockDth, trouvePseudo, trouveDth}}

	// calcul des parametres de rapidité
	const caractRate = [
		{ proba: 50, tick:6, fail:30000, lbl: "(1) Noob"},
		{ proba: 75, tick:4, fail:20000, lbl: "(2) Tranquillou"},
		{ proba:100, tick:2, fail:15000, lbl: "(3) Roxxor du PC"},
		{ proba:100, tick:1, fail:10000, lbl: "(4) Roxxor du Smartphone"},
	]
	let rate = $derived(caractRate[ (saisies.configRate!==null)? saisies.configRate : 3])

	// chargement de l'état (mWs msg du websocket ou d'un autre requete null)
	async function loadEtat(mWs) {
		let ret = (!mWs)?  await apiCall("/usinesGaz") : mWs
		if ( ret.status!=200) return
		etat = ret.o
		recalcEtat()
	}

	// recalcul les parametres d'affichage
	let dthLastFail = 0 //date du dernier fail de rapidité
	let finalDejaVu = false
	function recalcEtat() {
		let nbSurv = 0 // clacul du nombre de case surveillées par le réparateur alpha
		let nbTrouve = 0 // nombre de trouves
		let trouveMax = 0 // calcul le dth de dernier trouve du pseudo
		let unlockMax = 0 // calcul le dth de dernier unlock du pseudo
		let unlockNb = 0 // calcul le nb d'unlock actuel du pseudo
		let now=Date.now()-getEpsilon() // raccord sur l'horloge serveur
		for (let c=0;c<4;c++)
			for (let l=0;l<10;l++) {
				let lieu = etat.lieux[l*4+c]
				// lieu surveillé ?
				lieu.isSurv = !tblCol[c] || !tblLigne[l]
				if (lieu.isSurv) nbSurv++
				// calcul unlockDth et nbUnlock du joueur
				if (lieu.unlockPseudo==pseudo) {
					unlockNb ++
					if (lieu.unlockDth > unlockMax)
						unlockMax=lieu.unlockDth
				}
				// calcul du trouveDth du joueur
				if (lieu.trouvePseudo==pseudo && lieu.trouveDth > trouveMax)
					trouveMax=lieu.trouveDth
				if (lieu.status=="trouve") nbTrouve++
			}
		etat.unlockMax = Math.max(unlockMax+(etat.UNLOCKDELAI*unlockNb),dthLastFail+rate.fail) // dth de prochaine unlock possible
		etat.canUnlock = now>etat.unlockMax // indique si l'option de unlock est ok ou si il faut attendre
		etat.trouveMax = trouveMax+etat.TROUVEDELAI // dth de prochaine découverte possible
		etat.canTrouve = now>etat.trouveMax // indique si l'option de découverte est ok ou si il faut attendre
		etat.nbSurv = nbSurv // nombre de lieux surveillés
		etat.nbTrouve = nbTrouve
		etat.termine = nbTrouve==40
		etat.proba = Math.floor(rate.proba*(40-nbSurv)/40)
		// calcul classe d'affichage
		for (let c=0;c<4;c++) {
			for (let l=0;l<10;l++) {
				let i = l*4+c 
				let lieu = etat.lieux[i]
				// type du lieu
				switch(lieu.status) {
					case "lock":
						lieu.tdClass= (!etat.canUnlock || lieu.isSurv)? "lockSurv" : "lockFree"
						// si lock et que dspUnlock est affiché pour ce lieu... ferme le popup
						if (dspUnlock && dspUnlock.i == i)
							dspUnlock = null;
						break
					case "unlock":
						// si echeance timer... pass en lock
						if (lieu.unlockDth+etat.OUVERTDELAI <= now)
							lieu.status="lock"
						else
							lieu.tdClass= (etat.canTrouve)? "unlockCan" : "unlockCant"
						break
					case "trouve":
						lieu.tdClass="trouve"
						// si lock et que dspUnlock est affiché pour ce lieu... ferme le popup
						if (dspUnlock && dspUnlock.i == i)
							dspUnlock = null;
						break
					default:
						console.log('undef',lieu)
				}
			}
		}
		// gestion video finale
		if (nbTrouve == 40 && !finalDejaVu) {
			finalDejaVu = true
			playVideo('ff-7-stationalpha-final')
		}
	}

	//timer
	let currentTick= 0
	function onTimer() {
		if (!etat) return
		if (++currentTick >= rate.tick) {
			currentTick=0
			if (Math.random()<0.40)	
				clearCol(Math.floor(Math.random()*tblCol.length))
			clearLigne(Math.floor(Math.random()*tblLigne.length))
		}
		recalcEtat()
	}

	function clicLigne(e,l) {
		if (!etat.canUnlock) return addNotification("Tu dois attendre...","red",2,"prout-long")
		tblLigne[l]=Date.now()
		recalcEtat()
	}
	function clicCol(e,c) {
		if (!etat.canUnlock) return addNotification("Tu dois attendre...","red",2,"prout-long")
		tblCol[c]=Date.now()
		recalcEtat()
	}
	function clearLigne(l) {
		tblLigne[l]=false
		// recalcEtat()
	}
	function clearCol(c) {
		tblCol[c]=false
		// recalcEtat()
	}
	function markAll() {
		for (let c=0;c<4;c++)
			tblCol[c]=true
		for (let l=0;l<10;l++)
			tblLigne[l]=true
		recalcEtat()
	
}
	
	function clicLieu(l,c) {
		const idx=l*tblCol.length+c
		let lieu = etat.lieux[idx]
		switch(lieu.status) {
			case "lock":
				if (!etat.canUnlock) return addNotification("Repose toi un peu",'yellow',2,'prout-long')
				// Si case bloquée ou proba trop basse
				if (!tblLigne[l] || !tblCol[c]) return addNotification('Avaloir surveillé','yellow',2,'prout-long')
				if (etat.proba<20) return addNotification('Trop de risques','yellow',2,'prout-long')
				const rdn=100-Math.floor(Math.random()*100)
				if (rdn > etat.proba) {
					// tentative echouée
					dthLastFail = Date.now()-getEpsilon() // raccord heur serveur
					newInfoPopup("Pas de chance! ⚂"+rdn+">"+etat.proba,"le Réparateur a vu ton manège. Cache-toi un peu","Ferme ce popup pour continuer")
					return					
				}
				// tentative reussie
				apiCall('/usinesGaz/unlock/'+idx,'POST')
				newInfoPopup("Bravo! "+"⚂"+rdn+"<"+etat.proba,
										 [
											 "Tu as bouché un avaloir de la station Alpha",
											 "Tu peux cliquer dessus (ou sur un autre avaloir bouché) pour en découvrir l'extrémité"
										 ]
										 ,"Ferme ce popup pour continuer")
				break
			case "unlock":
				dspUnlock = lieu
				break
			case "trouve": 
				dspTrouve = lieu
				break
		}
		recalcEtat()
	}

	async function tryTrouve(e) {
		// dspUnlock est actif et est le lieu concerné
		let tmpNbTrouve = etat.nbTrouve // conserve le nbTrouve actuel car possible race condition
		// la maj se fera par le WS
		let ret = await apiCall("/usinesGaz/trouve/"+dspUnlock.i+"/"+saisies.X+"/"+saisies.Y,'POST')
		// si erreur de coordonnées
		if (ret.status==201) return addNotification("Mauvaise coordonnées","red",10,"prout-long")
		// si ok trouve, video et ferme le popup
		if (ret.status==200) { 
			// Si ce n'est pas le dernier trouve... 
			// video inter (nbTrouve pas encore incrémenté, ce sera par le ws)
			// test aussi finalDejaVu si le WS est + reactif que http
			if (tmpNbTrouve+1 < etat.lieux.length && !finalDejaVu )
				playVideo('ff-7-stationalpha-intermediaire')
			dspUnlock=null
			return
		}
	}
	
	//afichage detail...
	let dspUnlock=$state(null) // popup de présentation d'une recherche de trouve
	let dspTrouve=$state(null) // popup si trouve
	let dspResultats = $state(null)
	let admDebug=$state(false)
	function calcResultat() {
		let tRes = {}, totalUnlock=0, totalTrouve=0
		etat.lieux.forEach((lieu)=>{
			if (lieu && lieu.unlockPseudo) {
				tRes[lieu.unlockPseudo]??= {pseudo:lieu.unlockPseudo, nbUnlock:0, nbTrouve:0 }
				tRes[lieu.unlockPseudo].nbUnlock++
				totalUnlock++
			}
			if (lieu && lieu.trouvePseudo) {
				tRes[lieu.trouvePseudo]??= {pseudo:lieu.trouvePseudo, nbUnlock:0, nbTrouve:0 }
				tRes[lieu.unlockPseudo].nbTrouve++
				totalTrouve++
			}
		})
		dspResultats = {totalUnlock: totalUnlock, totalTrouve: totalTrouve, pseudos: Object.values(tRes) }
	}
</script>
<style>
	.unlockCan {background-color: lightgreen; width:20%; cursor: pointer}
	.unlockCant {background-color: orange; width:20%; cursor: pointer}
	.lockSurv {color:red; background-color: red; width:20%; cursor: not-allowed;}
	.lockFree {color:white; background-color: lightgreen; width:20%; cursor: pointer}
	.trouve {color:white; width:20%; cursor: pointer}
	.selDown { background-color: green; cursor:pointer}
	.selDown::before { content: "✅"}
	.unselDown { background-color: red; cursor:pointer}
	.unselDown::before { content: "⬇️"}
	.selRight { background-color: green; cursor:pointer}
	.selRight::after { content: "✅"}
	.unselRight { background-color: red; cursor:pointer}
	.unselRight::after { content: "➡️"}
	.nosel { background-color: red; cursor:wait}
	.nosel::before { content: "⏳"}
</style>


<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<div>
	
{#if pseudo.startsWith("Kikiadoc")}
	<div class="adminCadre">
		Admin:
		<input type="button" value="Reset Challenge" onclick={()=>confirm('reset challenge') && apiCall('/usinesGaz/admResetChallenge','DELETE')}/>
		<input type="button" value="Reset Timers" onclick={()=>confirm('reset timers') && apiCall('/usinesGaz/admResetTimers','DELETE')} />
		<input type="button" value="MarkAllClic" onclick={()=>markAll()} />
		<input type="button" value="MarkTrouve" onclick={()=>confirm('markTrouveALL') && apiCall('/usinesGaz/admTrouveAll','PUT')} />
		<input type="button" value="admDebug" onclick={()=>admDebug=!admDebug} />
	</div>
{/if}

{#if etat}
	<div>
	  <input type="button" onclick={()=> epiqStep=0} value="Revoir le lore" />
	  <input type="button" onclick={()=> dspResultat=calcResultat()} value="Resultats" />
		<span style="font-size:0.7em" role="button" tabindex=0 onclick={markClick}
			class="gpHelp" gphelp="Delai à respecter avant de pouvoir perturber le Réparateur de la Station Alpha afin d'inspecter un avaloir à gaz">
			⏳<countdown dth={etat.unlockMax}/><sup>🛈</sup>
		</span>
		<span style="font-size:0.7em" role="button" tabindex=0 onclick={markClick}
			class="gpHelp" gphelp="Delai à respecter avant de pouvoir identifier l'extrémité d'un avaloir à gaz bouché" >
			🔎<countdown dth={etat.trouveMax}/><sup>🛈</sup>
		</span>
		<span style="font-size:0.7em" role="button" tabindex=0 onclick={markClick}
			class="gpHelp" gphelp="Rapidité du réparateur de la station Alpha: {rate.lbl}">
			<input type="range" min=0 max={caractRate.length-1} bind:value={saisies.configRate} style="width: 3em; height:0.4em" />
			<sup>🛈</sup>
		</span>
	</div>
{/if}
{#if epiqStep==0}
	<div class="reveal">
		<img class="parchemin" src="{urlCdn}ff-7/lasource-infos.png" alt="" style="width:20%; float: right"/>
		{pseudo}, il faut détruire la Station Alpha sinon Eorzéa est perdu.
		<div class="br"></div>
		Au fond de la station Alpha se trouve le Générateur de Gaz, il ne faut pas s'en approcher!
		<br/>
		Il s'y trouve aussi le Réparateur-Alpha et les 40 Avaloirs situés aux 4 coins de chacune des 10 cartes astrales.
		<br/>
		Les Avaloirs sont donc organisés selon 10 lignes et 4 colonnes.
		<div class="br"></div>
		Chaque Avaloir diffuse du Gaz de Possession vers un lieu d'Eorzéa.
		<br/>
		En distrayant le Reparateur, tu peux augmenter ta chance d'identifier l'extrémité d'un Avaloir.
		Quand ta chance est suffisante, tu peux tenter de voir ce lieu et boucher temporairement l'Avaloir.
		<br/>
		Quand le lieu associé à un Avaloir est identifié, <u>même par un autre Aventurier</u>,
		tu peux t'y rendre et m'indiquer les coordonnées de ce lieu.
		Je bloquerai alors l'extrémité de l'Avaloir.
		<div class="br"></div>
		<div>
			J'y reviendrai en détail mais tu peux déjà
			<span class="videoLink" gpVideo="ff-7/ff-7-usines-intro-1">voir la démo</span>
		</div>
		<Btn bind:refStep={epiqStep} step=10 val="Et on fait ca tous ensemble?" />
		<div style="clear:both"></div>
	</div>
{/if}
{#if epiqStep==10}
	<div class="reveal">
		<img class="parchemin" src="{urlCdn}ff-7/lasource-infos.png" alt="" style="width:20%; float: right"/>
		Oui, il y a 40 Avaloirs, chaque opération est périlleuse, délicate et tu dois te reposer souvent.
		<div class="br"></div>
		C'est pourquoi j'ai sollicité tous les Aventuriers.
		<div class="br"></div>
		Tu l'as compris, il y a deux phases pour bloquer définitivement un avaloir mais
		tous les aventuriers peuvent faire un peu tout en même temps sur différents avaloirs!
		<div class="br"></div>
		Ca a l'air compliqué, mais tu verras que ce n'est pas le cas quand tu te lanceras dans l'Aventure!
		<div class="br"></div>
		Quelques explications avant que je ne te les détaille:
		<div class="imgLink" gpImg="ff-7/lasource-matrice.png">
			Voir la matrice des Avaloirs et ses principaux éléments
		</div>
		<div class="videoLink" gpVideo="ff-7/ff-7-usines-intro-1">
			Revoir la démo
		</div>
		<div class="br"></div>
		<Btn bind:refStep={epiqStep} step=20 val="Deux phases?" />
		<div style="clear:both"></div>
	</div>
{/if}
{#if epiqStep==20}
	<div class="reveal">
		<img class="parchemin" src="{urlCdn}ff-7/lasource-infos.png" alt="" style="width:20%; float: right"/>
		Oui, pour chaque Avaloir de la station Alpha, il y a deux phases. En voici la première:
		<div style="font-weight: bold; text-decoration: underline">
			Phase d'obturation d'un Avaloir dans la Station Alpha
		</div>
		Pour identifier l'extrémité d'un Avaloir tout en le bouchant, il faut d'abord distraire le Réparateur:
		<br/>
		C'est une phase de rapidité "solo", répétable toutes les {etat && etat.UNLOCKDELAI/60000}
		minutes en cas de réussite et quasi immédiatement en cas de défaillance.
		<br/>
		Lorsque cette phase est possible, des flèches ⬇️ et ➡️ sont affichées autour de la
		<span class="imgLink" gpImg="ff-7/lasource-matrice.png">Matrice des Avaloirs</span>.
		En cliquant sur ces flèches, tu va perturber le Réparateur,
		et dès que ta probabilité d'identification est "suffisante", tu peux cliquer sur la case d'un Avaloir.
		<br/>
		Si tu as de la chance, tu pourras visualiser le lieu d'Eorzéa à l'extrémité de cet Avaloir et
		boucheras temporairement cet Avaloir dans la station Alpha.
		<div class="videoLink" gpVideo="ff-7/ff-7-usines-intro-1">Revoir la démo</div>
		<div class="br"></div>
		<Btn bind:refStep={epiqStep} step=30 val="Et la deuxième phase?" />
		<div style="clear:both"></div>
	</div>
{/if}
{#if epiqStep==30}
	<div class="reveal">
		<img class="parchemin" src="{urlCdn}ff-7/lasource-infos.png" alt="" style="width:20%; float: right"/>
		La deuxième phase, c'est quand un Avaloir est bouché dans la station Alpha:
		tu peux en découvrir l'extrémité.
		<div style="font-weight: bold; text-decoration: underline">
			Phase d'identification d'une extrémité d'un Avaloir:
		</div>
		Quand un Avaloir est identifié/bouché, toi mais aussi tous les Aventuriers
		peuvent en identifier l'extrémité pendant {etat && etat.OUVERTDELAI/3600000} heures.
		Si l'extrémité d'un Avaloir n'a pas été identifiée pendant ce délai,
		le réparateur aura fini de déboucher l'Avaloir. Il faudra le reboucher.
		<div class="br"></div>
		Si tu as identifié une extrémité d'un Avaloir, tu ne peux en découvrir une autre
		qu'après un repos de {etat && (etat.TROUVEDELAI/3600000)} heures.
		Mais tu peux continuer à boucher des avaloirs,
		car même si tu ne peux pas identifier une extrémite,
		tu aideras les autres Aventuriers et si un autre Aventutier identifie l'extrémité
		d'un Avaloir que tu as bouché,
		tu récupèreras une partie des gains.
		<div class="br"></div>
		<Btn bind:refStep={epiqStep} step=20 val="Redis moi la phase une" />
		<Btn bind:refStep={epiqStep} step=40 val="J'ai tout compris" />
		<div style="clear:both"></div>
	</div>
{/if}
{#if epiqStep==40}
	{@const isPC = isEquipementPC()}
	<div class="reveal">
		<img class="parchemin" src="{urlCdn}ff-7/lasource-infos.png" alt="" style="width:20%; float: right"/>
		Il te reste à paramétrer la difficulté de la phase solo
		permettant de pertuber le réparateur de la Station Alpha
		<div class="br"></div>
		Je te laisse libre de définir cette difficulté.
		Tu utilises un {(isPC)? "PC":"Smartphone"}, je te conseille de commencer
		avec la difficulté {(isPC)? "3":"4"}, 
		tu pourras la modifier même pendant le chalenge en utilisant le
		<a href="https://fr.wikipedia.org/wiki/Slider_(informatique)">slider</a>
		à droite du bouton "Revoir le Lore"
		<div style="font-weight: bold; text-decoration: underline">
			Réglage de la difficulté de la rapidité solo:
		</div>
		Difficulté:
		<input type="range" min=0 max={caractRate.length-1} bind:value={saisies.configRate}
			style="width: 6em; height:0.4em" />
		<br/>
		<div class="info">{rate.lbl}</div>
		<div class="info">Probabilité maximum={rate.proba}%</div>
		<div class="info">Tick du réparateur={rate.tick*0.5}s</div>
		<div class="info">Repos si vu par le réparateur={rate.fail/1000}s</div>
		<Btn bind:refStep={epiqStep} step=99 val="GO GO GO!" />
		<div style="clear:both"></div>
	</div>
{/if}
{#if epiqStep==99 && etat}
	<div>
		<table border=1 style="width: 100%; text-align: center">
		<tbody>
			<tr>
				<td></td>
				<td class={ (etat.canUnlock)? ((tblCol[0])? "selDown":"unselDown"): "nosel" } onclick={(e)=>clicCol(e,0)} ></td>
				<td class={ (etat.canUnlock)? ((tblCol[1])? "selDown":"unselDown"): "nosel" } onclick={(e)=>clicCol(e,1)} ></td>
				<td class={ (etat.canUnlock)? ((tblCol[2])? "selDown":"unselDown"): "nosel" } onclick={(e)=>clicCol(e,2)} ></td>
				<td class={ (etat.canUnlock)? ((tblCol[3])? "selDown":"unselDown"): "nosel" } onclick={(e)=>clicCol(e,3)} ></td>
			</tr>
			{#each tblLigne as _,l}
				<tr>
					<td class={  (etat.canUnlock)? ((tblLigne[l])? "selRight":"unselRight"): "nosel" } onclick={(e)=>clicLigne(e,l)} ></td>
					{#each tblCol as _,c}
						{@const lieu = etat.lieux[l*tblCol.length + c]}
						{@const status = lieu && lieu.status}
						<td class={lieu.tdClass} onclick={()=>clicLieu(l,c)} onkeypress={null} >
							{#if admDebug}
								<div style="font-size:0.5em">
									{Date.now()}
									{status}
									{lieu.unlockDth}
									{lieu.trouveDth}
								</div>
							{/if}
							{#if status=="lock"} 
								{etat.proba}%
							{:else if status=="unlock"}
								<table>
									<tbody><tr>
										<td>🔎</td>
										<td style="font-size:0.5em">
											<i>Bouché!</i>
											<br/>
											<countdown dth={lieu.unlockDth+etat.OUVERTDELAI}>
											</countdown>
										</td>
									</tr></tbody>
								</table>
							{:else if status=="trouve"}
								<table><tbody>
									<tr>
										<td>✅</td>
										<td style="font-size:0.5em">
											{lieu.unlockPseudo}
											<br/>
											{lieu.trouvePseudo}
										</td>
									</tr>
								</tbody></table>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
		</table>
		{#if etat.termine}
			<Btn bind:refPage={page} page=0 val="Le challenge est terminé" />
		{/if}
	</div>
{/if}

{#if dspUnlock}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspUnlock=null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				{#if etat.canTrouve}
					<div class="info">
						Si tu n'as pas tout de suite la solution,
						tu peux fermer ce popup,
						tu pourras choisir plus tard cet avaloir bouché, ou un autre, en cliquant sur sa case.
					</div>
				{:else}
					<div class="info">
						Tu ne peux pas identifier l'extrémité de cet avaloir car tu en as trouvé une récemment et
						tu dois te reposer encore
						<countdown dth={etat.trouveMax} />
						<br/>
						Tu peux fermer ce popup,
						tu pourras choisir plus tard cet avaloir bouché, ou un autre, en cliquant sur sa case.
					</div>
				{/if}
				{dspUnlock.unlockPseudo} a apercu l'extrémite de cet avaloir (#{dspUnlock.i+1})
				avant de le boucher.
				<br/>
				Le réparateur de la station Alpha va le déboucher dans 
				<countdown dth={dspUnlock.unlockDth+etat.OUVERTDELAI} />
				<br/>
				{#if etat.canTrouve}
					<div>
						Indique-moi les coordonnées de son extrémité
						(<u>c'est là où se trouve le Nouvel Ancien</u>).
						Je pourrai alors condamner définitivement cet avaloir en bouchant son extrémité.
					</div>
					<div>
						X:<input type="number" bind:value={saisies.X} min=0 max=50 step="0.1" />
						Y:<input type="number" bind:value={saisies.Y} min=0 max=50 step="0.1" />
						<input type="button" value="➤" onclick={(e)=>tryTrouve(e)} />
					</div>
				{/if}
				Voici l'extrémité vu par {dspUnlock.unlockPseudo}:
				<br/>
				<img src="{urlCdn}ff-7/usinesGaz/avaloir-{dspUnlock.i}.png" style="width:100%" alt=""/>
			</div>
		</div>
	</div>
{/if}

{#if dspTrouve}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspTrouve=null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				L'avaloir #{dspTrouve.i+1} a été bouché par {dspTrouve.unlockPseudo}
				{jjmmhhmmss(dspTrouve.unlockDth)}.
				<br/>
				{dspTrouve.trouvePseudo} a trouvé son extrémité 
				{jjmmhhmmss(dspTrouve.trouveDth)}.
				<br/>
				Je l'ai donc neutralisé.
				<br/>
				<img src="{urlCdn}ff-7/usinesGaz/avaloir-{dspTrouve.i}.png" style="width:100%" alt=""/>
			</div>
			<div class="info">Tu peux fermer cette popup et la rouvrir plus tard</div>
		</div>
	</div>
{/if}
	
{#if dspResultats}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspResultats=null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>Résultats actuels</div>
				<table border=1 class="info">
					<tbody>
						<tr>
							<td></td>
							<td>bouché</td>
							<td>extrémité</td>
							<td>%gains</td>
						</tr>
						{#each dspResultats.pseudos as p,i}
							<tr>
								<td>{p.pseudo}</td>
								<td>{p.nbUnlock}</td>
								<td>{p.nbTrouve}</td>
								<td>{Math.floor(100*(p.nbUnlock+4*p.nbTrouve)/200)}%</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
{/if}

</div>

<!-- P360.svelte -->
