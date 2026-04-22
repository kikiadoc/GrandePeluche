<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo, displayObject,
					 markClick, isAdmin,
					 urlCdn, urlCdnAI, apiCall, apiCallExtern, getEpsilon,
					 addNotification, mediaPlay,countDownInit,
					 addTexteTTS, isPlaying, isProd,
					 playDing, playVideo,
					 intCountBits32
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE,calcCagnotte, calcCagnotteNb }  from './ground.svelte.js'
	import { babylonSetOption, babylonGetOption,
					 babylonStart, babylonStop, babylonPreload,
					 babylonSetSceneActive, sceneLoadingCreate, babylonHome,
					 babylonGetMetrologie, babylonIsSceneActive,
					 babylonMainSceneCreate, babylonObjetActifUpdate
				 } from './BabRoot.js'
	import Btn from './Btn.svelte'
	import Info from './Info.svelte'
	import Common from './Common.svelte'
	import BabHeader from './BabHeader.svelte'
	
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

	// svelte-ignore state_referenced_locally
	const PAGEEPIQLBL= "P"+pageDesc.n+"_epiqStep"
	// svelte-ignore state_referenced_locally
	const PAGESAISIESLBL = "P"+pageDesc.n + "_saisies"
	// svelte-ignore state_referenced_locally
	const APIROOT = '/'+pageDesc.rootName+'/'
	
	const APICONFIG = APIROOT+'config'	
	const APIETAT = APIROOT+'etat'	
	const APIOBJCLICK = APIROOT+'objetClick/'	
	const APIPROPOSITION = APIROOT+'proposition/'	
	const APIDIVULGUE = APIROOT+'divulguer/'	
	// svelte-ignore state_referenced_locally
	const WSMSGETAT = pageDesc.rootName+".etat"
	const CAGNOTTECOEF2=1.4 // 
	const VIDEOFINALE = "X-lesfailles/lesfailles-f"
	
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// afficahge des popups standards
	let dspResultats=$state(false) 	// affichage des résltats

	// appelé apres mount du component
	function init() { console.log('**mount P'+pageDesc.n+'**'); getConfig() }
	
	// appelé apres unmount du component
	function reset() { console.log('**unmunt P'+pageDesc.n+'**'); babylonStop()	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op==WSMSGETAT && m.o) { getEtat(m); return true }
		return false
	}

	// normalization des saisies persistantes 
	function normalizedSaisies(s) {
		// s.caracs ??= [] // exemple de normalized
		// s.pipoVal ??= 0 // exemple de normalized
		s.targetPseudo = null // cible actuelle
		s.nextIndiceEcheance ??= 1 // 1ms pour forcer le refresh timer
		s.nextIndiceEcheance ||= 1 // 1ms pour forcer le refresh timer
		s.sensibilite3D ??= 3
		s.lastPropositionEcheance ??= 1
		return s
	}

	// appelé lors d'un changement de step de l'épique
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
	}

	let CONFIG = $state.raw(null) // Important, CONFIG doi être init avant l'état 
	let etat = $state(null)
	async function getConfig() {
		let ret = await apiCall(APICONFIG);
		if (ret.status != 200) throw new Error("erreur sur "+APICONFIG+"("+ret.status+')')
		CONFIG = ret.o
		await getEtat()
		babylonPreload(CONFIG.WORLD3DDESC)
	}
	// chargement etat du challenge
	async function getEtat(msgWs) {
		if (!CONFIG) return // il est obligatoire que CONFIG soit définie avant l'etat
		let ret = msgWs || await apiCall(APIETAT);
		if (ret.status != 200) return console.error("erreur sur",APIETAT,ret.status)
		recalcEtat(ret.o)
	}
	async function recalcEtat(tEtat) {
		// etat contient pseudos[] et objets[] 
		console.log("recalcEtat",tEtat)
		etat=tEtat
		resyncEtat3D()
		resyncEtatResult()
	}

	let lastObjetsUpdateDth = null // table de dth d'update 3D
	async function resyncEtat3D() {
		if (babIHM.debug) console.log("resyncEtat3D",lastObjetsUpdateDth)
		// si pas de babylon main actif, ne rien faire 
		if (! babylonIsSceneActive("main")) return console.log("**** resyncEtat3D scene non main")
		// initialise si besoin la reference d'update des objets
		lastObjetsUpdateDth ??= new Array(CONFIG.WORLD3DDESC.OBJSTATIC.length).fill(-1)
		if (babIHM.debug) console.log("resyncEtat3D",lastObjetsUpdateDth)
		let objTrouve=etat.pseudos[pseudo]?.objTrouve
		let objResolu=etat.pseudos[pseudo]?.objResolu
		etat.objets.forEach( (o,i) => {
			if (o?.updDth > lastObjetsUpdateDth[i] ) {
				lastObjetsUpdateDth[i] = o.updDth
				// calcul de l'index du mesh
				let idxMesh = 0
				if (objTrouve & 1<<i) idxMesh++
				if (objResolu & 1<<i) idxMesh++
				// complete l'obet en transitoire 
				o.mName= CONFIG.WORLD3DDESC.OBJSTATIC[i].byNbClick[idxMesh]?.m
				babylonObjetActifUpdate(i,o)
			}
		})
	}
	let videoVue=false
	async function resyncEtatResult() {
		// calcul des coefs de chacun
		etat.totalCoefs = 0
		etat.totalT = 0
		etat.totalR = 0
		etat.totalD = 0
		Object.keys(etat.pseudos).forEach( (pseudo)=>{
			let p=etat.pseudos[pseudo]
			p.t = intCountBits32(p.objTrouve)
			p.r = intCountBits32(p.objResolu)
			p.d = intCountBits32(p.objDivulgue)
			if (p.t) etat.totalT++
			if (p.r) etat.totalR++
			if (p.d) etat.totalD++
			p.coef = 1*p.t+2*p.r+1*p.d
			etat.totalCoefs += p.coef
		})
		// challenge terminé POUR LE PSEUDO? 
		let e = etat.pseudos[pseudo]
		etat.chalengeTermine =  e &&
														((e.objTrouve & CONFIG.MASKI) == CONFIG.MASKI) &&
														((e.objTrouve & CONFIG.MASKL) == CONFIG.MASKL) &&
														((e.objResolu & CONFIG.MASKQ) == CONFIG.MASKQ)
		if (etat.chalengeTermine) {
			videoVue=true
			playVideo(VIDEOFINALE)
		}
		// calcul de la cagnotte
		etat.cagnotte=calcCagnotte(etat.totalR,CONFIG.GILS,etat.totalD*CAGNOTTECOEF2)
		etat.cagnotteNb=calcCagnotteNb(etat.totalR,etat.totalD*CAGNOTTECOEF2).toFixed(0)
	}

	/////////////////////
	// Gestion l'avancement
	/////////////////////
	let dspEnigme=$state(null)
	function cbEnigme(ligne,i,e) {
		calcEnigme(i)
	}
	// calcule l'énigme i, defTrouve et defResolu sont des valeurs si besoin d'anticipation server
	function calcEnigme(i, defTrouve, defResolu) {
		let obj= CONFIG.WORLD3DDESC.OBJSTATIC[i]
		let trouve= defTrouve || (etat.pseudos[pseudo]?.objTrouve & 1<<i)
		let resolu= defResolu || (etat.pseudos[pseudo]?.objResolu & 1<<i)
		switch(obj.t) {
			case "i": // information, affiche le message
			case "l": // indice de lieu
				if (trouve)
					babIHM.msg = obj.dsp
				else
					babIHM.msg = { titre: obj.nom, body:["Tu n'as pas encore localisé cette faille"]}
				break
			case "q":
				babIHM.msg = null
				dspEnigme = {
					i:i,
					trouve:trouve,
					resolu:resolu
				}	
				break
			default: addNotification("type objet invalide:"+obj.t)
		}
	}
	function calcAvancement() { 
		let objTrouve=etat.pseudos[pseudo]?.objTrouve
		let objResolu=etat.pseudos[pseudo]?.objResolu
		let dsp= {back:'papier petit', titre: "Parchemin des failles", body: [], trailer:"Total à trouver/résoudre:"+CONFIG.NBO}
		etat.objets.forEach( (o,i) => {
			let obj= CONFIG.WORLD3DDESC.OBJSTATIC[i]
			let trouve = objTrouve & 1<<i
			let resolu = objResolu & 1<<i
			if (resolu || (trouve && (obj.t=='i' || obj.t=='l')) ) {
				dsp.body.push( {txt:"✅"+ obj.res, cb: cbEnigme} )
			}
			else if (trouve) {
				dsp.body.push( {txt:"👉"+ obj.nom, cb: cbEnigme} )
			}
			else {
				dsp.body.push( {txt:"❓"+ obj.nom, cb: cbEnigme } )
			}
		})
		babIHM.msg = dsp		
	}
	// Gestion click objet en local
	function localClick3d(objDesc) {
		apiCall(APIOBJCLICK+objDesc.i,'POST') // marque le click au serveur (a la va que je te pousse)
		// par anticipation réponse serveur
		calcEnigme(objDesc.i,true,false)
	}
	function proposition(nuObj,choix) {
		dspEnigme=null
		saisies.lastPropositionEcheance = Date.now() + CONFIG.TIMERPROPOSITION
		let obj= CONFIG.WORLD3DDESC.OBJSTATIC[nuObj]
		if (obj.qcu.r==choix) {
			apiCall(APIPROPOSITION+nuObj+"/"+choix,'POST')
			babIHM.msg ={titre:"Bonne réponse",body:[obj.res,"a utilisé ta distorsion intertemporelle"],ding:"X-longwayhome"}
		}
		else {
			babIHM.msg ={titre:"Mauvaise réponse",body:["Ta distorsion intertemporelle s'est refermée"],ding:"prout-long"}
		}
	}
	function calcResultats() {
		dspResultats=etat
	}

	/////////////////////////////////////////////////////////////////////////////////////
	// chargement de la scene 3D
	/////////////////////////////////////////////////////////////////////////////////////
	let babIHM = $state({x:0,y:0,z:0,msg:null})
	// let babMessage = $state(null)
	let dspBabParam = $state(false)
	async function start3D() {
		console.log("****************** start3D")
		await babylonStart(pseudo,babIHM)
		babylonSetSceneActive(await sceneLoadingCreate(),"loading")
		// babylonSetOption('perf',false,true)
	}
	// Callback depuis le moteur 3D 
	async function event3d(e) {
		let o = e.srcElement.Event3D // recupere les complements de l'event {action,obj,extra} 
		if (babIHM.debug) console.log('Event 3D:',o,e)
		if (!o) return
		if(o.action=="btnGo") {
			playVideo("commons/voyage-orthotemps")
			babylonSetOption('perf',false,true)
			babylonSetSceneActive(await babylonMainSceneCreate(CONFIG.WORLD3DDESC),"main")
			resyncEtat3D()
			return
		}
		if (o.action=="clickMesh") {
			if (o.nom?.startsWith("gpObjet=")) {
				let objNum = parseInt(o.nom.substring(8))
				if (babIHM.debug) addNotification("Click sur objet #"+objNum)
				let objDesc = CONFIG.WORLD3DDESC.OBJSTATIC[objNum]
				if (!objDesc) { addNotification("Serveur unsynch, contacte Kikiadoc","red",10); return}
				localClick3d(objDesc) // traitement local, le global par le broadcast server
				return
			}
			switch(o.nom) {
				case "cannette#1":
				case "cannette#2":
				case "OrthoStargate":
					babIHM.msg={titre:"Porte de l'Ortho-Temps",body:["Clique au centre du Chronogyre pour accéder à l'Ortho-temps"]}
				return
			}
		}
		if (babIHM.debug) addNotification("Event 3D ignoré:"+o.action+" "+o.nom)
	}
</script>
<style>
	.babylon {
	  margin: 0;
	  padding: 0;
	  width: 100%;
	  /* height: 800px; /* 100%; */
	  /* font-size: 0; */
	  color: rgba(204, 204, 204, 1);
	}
</style>
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if isAdmin(pseudo)}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin:
				{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<input type="button" value="ResetAll" onclick={() => confirm("Tout effacer?") && apiCall(APIROOT+'resetAll','DELETE') } />
				<input type="button" value="ResetTimerProposition" onclick={() => saisies.lastPropositionEcheance=Date.now()+5000 } />
				<input type="button" value="dspConfig" onclick={() => displayObject(CONFIG) } />
				<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}
	<div>
		<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
		<input type="button" value="Resultats" onclick={calcResultats} />
		<Common t="headerPage" pageDesc={pageDesc} />
	</div>
	{#if epiqStep==0}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			<div>
				{pseudo},
				les bases Pharao sur Eorzéa sont en construction,
				et l'horloge Pharao toujours à destination du Point de Lagrange L1 du système Eorzéen.
			</div>
			<div class="br" />
			<div>
				Il est maintenant temps de construire le Pharao de l'Ortho-Temps,
				mais tu le sais déjà, Méphistophélès a souillé les Dimensions.
				<br/>
				Tu dois te rendre dans l'ortho-temps pour nettoyer cette dimension.
			</div>
			<div class="br" />
			<div>
				L'Ortho-temps est surprenant...
				<br/>
				Ainsi, tu n'y es que sous la forme d'un esprit, tu peux donc traverser les murs.
				<br/>
				La majorité des habitants de l'ortho-temps sont sans épaisseur et
				certains ne sont visibles que de face.
				<br/>
				Et tu te retrouveras {G(pseudoGenre,"tout seul","toute seule")}
				dans une instance de l'Ortho-Temps.
			</div>
			<Btn bind:refStep={epiqStep} step=10 val="Surprenant!" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==10}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Lorsque Méphistophélès a bousculé les dimensions,
				des objets ont été arrachés au Bar à Thym, un lieu mythique d'Eorzéa.
				<br/>
				Même la signalétique du Bar à Thym a été arrachée, et pour que tu trouves ce lieu,
				il faudra trouver des indices dans l'Ortho-Temps.
				<br/>
				Il te faut aussi identifier toutes les failles et
				provoquer des distortions intertemporelles pour fermer ces failles.
			</div>
			<Btn bind:refStep={epiqStep} step=20 val="Et je fais ça {G(pseudoGenre,"tout seul","toute seule")}?" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if epiqStep==20}
		<div class="reveal" use:scrollPageToTop>
			<img class="parchemin" src={urlCdn+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
			<div>
				Oui, tu seras dans une instance personnelle de l'Ortho-Temps
				du fait des fluctuations de l'Orthogonalité des Dimensions.
				<br/>
				N'oublie pas que
				tu peux partager questions, solutions et stratégies sur Discord.
				<div class="br"/>
				Ton avancement est noté dans ton Parchemin des Failles: tu peux le consulter à tout moment
				lorsque tu es dans l'Ortho-Temps.
				<br/>
				Tu peux y réaliser quelques actions.
				Par exemple, si tu as fermé une faille, tu peux demander à Hildiscord
				de publier un indice sur Discord.
				<div class="br"/>
				<div class="blinkMsg">
					Attention, publier un indice peut faire que la cagnotte n'atteigne pas sa valeur maximale.
				</div>
				<div class="br"/>
				Tu trouveras divers objets dans l'Ortho-temps:
				<br/>
				Des ardoises d'information, des parchemins etc...
				Si un élément tourne, c'est que tu peux probablement cliquer dessus.
			</div>
			<Common t="waitDebutChallenge" pageDesc={pageDesc} bind:refStep={epiqStep} />
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div class="reveal" use:scrollPageToTop>
			<div {@attach start3D} id="kikiFullArea">
				{#if dspEnigme}
					{@const etatObj= etat.objets[dspEnigme.i] }
					{@const staticObj= CONFIG.WORLD3DDESC.OBJSTATIC[dspEnigme.i] }
					<!-- 
						dspEnigme = {
							i:i,
							enigme: CONFIG.WORLD3DDESC.OBJSTATIC[i],
							trouve:etat.pseudos[pseudo]?.objTrouve & 1<<i,
							resolu:etat.pseudos[pseudo]?.objResolu & 1<<i
						}	
					-->
					<div class="popupCadre papier">
						<div class="close" onclick={()=>dspEnigme=null} role="button">X</div>
						<div class="popupZone">
							<div class="popupContent">
								{#if dspEnigme.resolu}
									<div>🤩Tu as fermé la faille {staticObj.nom}.</div>
									{#if etatObj.dPseudo}
										{#if etatObj.dPseudo==pseudo}
											<div>😇Tu as divulgué un indice aux autres Aventuriers:</div>
										{:else}
											<div>
												😇{etatObj.dPseudo} a divulgué un indice aux autres Aventuriers:
											</div>
										{/if}
										<div>➥{staticObj.loc}</div>
									{:else}
										{#if (etat.pseudos[pseudo].objTrouve & CONFIG.MASKI) == CONFIG.MASKI }
											<div>
												➥Si tu souhaites aider les autres Aventuriers,
												UFO, grâce à son ami Hildiscord, peut partager un indice concernant cette faille.
												<br/>
												<input type="button" value="UFO, au dodo!" onclick={()=>{ dspEnigme=null }} />
												<input type="button" value="UFO, au boulot!" onclick={()=>{ apiCall(APIDIVULGUE+dspEnigme.i,'POST'); dspEnigme=null }} />
												<!--
												<br/>
												x:{(100*dspEnigme.obj.x/CONFIG.WORLD3DDESC.WORLDSIZE).toFixed(1)}
												y:{(100*dspEnigme.obj.y/CONFIG.WORLD3DDESC.WORLDSIZE).toFixed(1)}
												z:{(100*dspEnigme.obj.z/CONFIG.WORLD3DDESC.WORLDSIZE).toFixed(1)}
												-->
											</div>
										{:else}
											<div>
												👿Tu n'as pas encore activé UFO, le relai interdimensionnel d'Hildiscord,
												tu ne peux pas encore aider les autres Aventuriers.
												Pour l'activer, trouve le et clique dessus.
											</div>
										{/if}
									{/if}
								{:else if dspEnigme.trouve}
									<div>Faille: {staticObj.nom}</div>
									{#if saisies.lastPropositionEcheance > Date.now() }
										<div>
											🤩Tu as trouvé cette faille.
											<br/>
											👿Hélas tu ne peux pas encore provoquer une distorsion intertemporelle
											(<countdown dth={saisies.lastPropositionEcheance} oncdTimeout={()=>saisies.lastPropositionEcheance=1} />)
										</div>
									{:else}
										{#if staticObj.qcu}
											<div>Pour provoquer un distorsion intertemporelle, répond à la question suivante:</div>
											<div>{staticObj.qcu.q}</div>
											<div>
												{#each staticObj.qcu.o as o,i }
													<input type="button" value={' '+o+' '} onclick={()=>proposition(dspEnigme.i,i)}  />
												{/each}
											</div>
											<div class="info">Tu peux fermer ce popup et le retrouver en cliquant sur ton Parchemin des Failles</div>
										{/if}
									{/if}
								{:else}
									<div>Faille: {staticObj.nom}</div>
									<div>😞Tu n'as pas encore découvert cette faille</div>
									{#if etatObj.dPseudo}
										😇Un indice a été publié par {etatObj.dPseudo}:
										<br/>
										{staticObj.loc}
									{:else}
										😞Personne n'a encore publié d'indice concernant cette faille.
									{/if}
									{#if isAdmin(pseudo)}
										<div class="adminCadre">
											Admin: 
											<input type="button" value="force découvrir"
												onclick={()=>localClick3d(staticObj)} />
										</div>
									{/if}
								{/if}
								{#if saisies.debug}
									<div class="adminCadre">
										Admin:
										<pre style="white-space: pre-wrap; word-break: break-all;">{JSON.stringify({ dspEnigme: dspEnigme, staticObj: staticObj, etatObj: etatObj},null,2)}</pre>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
				<div>
					<span onclick={markClick} style="cursor:pointer" gpImg="commons/cagnotte.png" 
						gpHelp="C'est la cagnotte. Elle augmente de façon exponentielle
										selon le nombre d'Aventuriers ayant fermé	au moins une faille et
										dans une moindre mesure, le nombre d'Aventuriers ayant divulgué un indice.
										Tu peux cliquer sur le bouton 'résultat' pour voir la répartition actuelle.">
						💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}
					</span>
					<span style="cursor:pointer" onclick={()=>calcAvancement()}>
						📜
					</span>
					<!--
					<span style="cursor:pointer" onclick={()=>teleportation()}>
						🌐
					</span>
					-->
					<BabHeader
						bind:dspBabParam={dspBabParam}
						bind:babIHM={babIHM}
						bind:saisies={saisies}
						CONFIG={CONFIG}
						pseudo={pseudo}  />
				</div>
				<div>
					<canvas class="babylon" id="render-canvas-3D" onevent3d={event3d}></canvas>
				</div>
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	{#if dspResultats}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspResultats=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					Résultats: 💰{etat.cagnotteNb}/{GBLCONST.EQUILIBRAGE.NB}⇒ {etat.cagnotte.toFixed(1)}M/{CONFIG.GILS}M Gils
					<table class="resTable"><tbody>
						<tr class="petit">
							<td>Pseudo</td><td>Trouvés</td><td>Résolus</td><td>Divulgés</td><td>Coef</td><td>Gils</td>
						</tr>
						{#each Object.keys(etat.pseudos) as pn,i}
							{@const p = etat.pseudos[pn]}
							{@const coef=p.coef/etat.totalCoefs}
							<tr>
								<td class="resTd">
									<img style="width: 1em" alt="" src={urlCdnAI+"pseudo-"+pn+".jpg"} />
									{pn}
								</td>
								<td class="resTd">{p.t}</td>
								<td class="resTd">{#if p.r}🪙{/if}{p.r}</td>
								<td class="resTd">{#if p.d}🪙{/if}{p.d}</td>
								<td class="resTd">{Math.round(100*coef)}%</td>
								<td class="resTd">{(etat.cagnotte*coef).toFixed(3)}M</td>
								{#if saisies.debug}
									<td style="color:red">{p.coef}</td>
								{/if}
							</tr>
						{/each}
						<tr class="petit">
							<td></td>
							<td></td>
							<td>🪙{etat.totalR}</td>
							<td>🪙{etat.totalD}</td>
							<td></td>
							<td colspan=2>
								💰min({etat.totalR},{CAGNOTTECOEF2}x{etat.totalD},{GBLCONST.EQUILIBRAGE.NB})={etat.cagnotteNb}
							</td>
							{#if saisies.debug}
								<td style="color:red">{etat.totalCoefs}</td>
							{/if}
						</tr>
					</tbody></table>
					<div class="info">
						⚠️Les gains varient tant que le challenge n'est pas terminé
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- P425.svelte -->
