<script>
	import { onMount, onDestroy  } from 'svelte';
	import { urlCdn, urlCdnSTATIC, GBLSTATIC, GBLCONST } from "./ground.svelte.js"
	
	
	import { scrollPageToTop, loadIt, storeIt,
					 jjmmhhmmss, countDownTo, displayInfo, playMusic,
					 countDownInit, markClick,
					 isAdmin, isPrivilege, isAdminServer, apiCall, displayObject
				 } from './common.js'
	import { G }  from './privacy.js'

	import Credits from './Credits.svelte'
	
	let {
		webAuth,
		wsCallComponents,
		pageDesc,
		pageList,
		pseudo,
		pseudoGenre,
		pseudoList,
		page = $bindable(0),
		pageDone = $bindable([]),
		localCtx = $bindable({}),
	} = $props();

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()

	const URLWEBHOOKSTART = "https://discord.com/api/webhooks/"
	const ABOTAGLENMAX = 10 // En dur dans le client car mode non public - identique au serveur conf
  const ABOTAGLENMIN = 4  // En dur dans le client car mode non public - identique au serveur conf

	onMount(() => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });
	// gestion des commandes via le WS
	async function myWsCallback(m) { 
		// if (m.op=="????" && m.o) .... return true 
		return false
	}
	// etat des saisies persistantes
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))
	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		s.debug ??= false
		// s.isFull = false
		// s.isJump = false
		return s
	}

	
	let forceReloadCount = $state(0) // force le reload sur timeout

	const DELAI = 24*3600000 // passage de la date au coundown

	function init() {
		// si besoin init des pages
		pageList.forEach ( (p) => {
			localCtx.page[p.n] ??= {}
		})
	}
	function reset() {
	}
	// click dans la liste 
	function listClic(pageDesc,cls) {
		// Mise à jour du niveau de click sur le menu
		localCtx.page[pageDesc.n].menuClick = true
		// localCtx.page[pageDesc.n].menuTip = pageDesc.tip?.idx || 0
		// 
		if ( !cls.a && !saisies.isJump ) {
			// challenge non disponible
			displayInfo({titre:"Challenge à venir", music: pageDesc.music,
				img: urlCdnSTATIC+"delai-anim.gif",
				// imgClass: "parchemin",
				body:[
					"Ce challenge n'est pas encore disponible.",
					pageDesc.tip || "", //  {cls:"blinkMsg", txt: pageDesc.tip?.txt}
				]})
			return
		}
		// Prerequis ?
		if (pageDesc.prereq && !localCtx.page[pageDesc.prereq]?.menuClick) {
			// Recherche la description de la page en preReq
			let wPageDesc = pageList.find((e) => e.n == pageDesc.prereq)
			displayInfo({titre:"Attention, challenge prérequis", ding: "prout-long",
				body:["Je te conseille de faire d'abord "+wPageDesc.texte]})
			return
		}
		// Avant première ?
		if (cls.isBeta) {
			displayInfo({titre:"Accès en avant-première", ding:"ding-ding",
				body:["Tu peux participer à ce challenge en avant-première",
							"Ce challenge peut encore évoluer avant sa date de début"]})
		}
		// intention (async)
		// apiCall("/clientConfig/intentions/"+pageDesc.n,'POST')
		page=pageDesc.n // basculement de la page
		playMusic(pageDesc.music)
	}

	// Calcul du style d'un des elements de mnu de pageDesc p
	function calcStyle(p) {
		// ignore le pageDesc car privilege insuffisant
		if (p.privilege && !(p.privilege & webAuth?.privilege)) return null
		// Si page cachée
		if (p.hidden && !saisies.isFull ) return null
		// par defaut
		let cls = {a: false, m: true, c: "lRed", h: "Masqué par une brume éthérée"}
		let now = Date.now()
		// calcul par rapport au temps
		let isAvantBcpDebut = now < p.start-DELAI
		let isAvantDebut = now < p.start 
		let isAvantBcpFin = now < p.end-DELAI
		let isAvantFin = now < p.end
		let isBetween = now >= p.start && now <= p.end
		let isBeta = now >= p.beta && now <= p.start
		let isAfter = p.after && now >= p.end
		// accessible ?
		if (isBeta) { cls.a=true; cls.isBeta=true; cls.c = "lOrange" }
		if (isBetween) { cls.a=true; cls.c = "lGreen" }
		if (isAfter) { cls.a=true; cls.c = "lBlue"; cls.h = "Terminé, voir les résulats" }
		// timer ou date de debut/fin
		if (isAvantDebut && p.start != Infinity) {
			cls.h = null
			if (isAvantBcpDebut) cls.dDt = p.start; else cls.dCd = p.start
		}
		if (isAvantFin && p.end != Infinity) {
			cls.h = null
			if (isAvantBcpFin) cls.fDt = p.end; else cls.fCd = p.end
		}
		if (isBetween)
			cls.h = p.help || "En cours"
		// indique dans cls si le la page a deja été vue 
		// cls.menuTip = (localCtx.page[p.n]?.menuTip || 0) < (p.tip?.idx || 0)
		return cls
	}
	function forceReload() {
		forceReloadCount++
	}

</script>
<style>
	.lRed { color: #6C0299 /* red */ }
	.lGreen { color: lightgreen}
	.lOrange { color: orange}
	.lBlue { color: lightblue}
	.beta { color:white; background-color: green; font-size: 0.6em; padding: 0.1em; 
					border: 2px solid white; border-radius: 5px }
</style>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag) -->
<div use:scrollPageToTop>
  <section class="hero-section">
		{#if pseudo}<div class="hero-eyebrow">Bienvenue {pseudo},</div>{/if}
	</section>
	{#if isPrivilege(webAuth,0x7FFFFFFF)}
		<div class="adminCadre papier">
			Admin:
			{#if isPrivilege(webAuth,GBLCONST.PRIVSADMIN)}
				<label><input type="checkbox" bind:checked={saisies.isFull} />Tout afficher</label>
			{/if}
			{#if isPrivilege(webAuth,GBLCONST.PRIVACCES)}
				<label><input type="checkbox" bind:checked={saisies.isJump} />Toujours accéder</label>
			{/if}
			<button class="button" onclick={() => {webAuth.privilege=0; saisies.isJump=false; saisies.isFull=false}  }>
				Vue sans privilege
			</button>
		</div>
	{/if}
	{#if !localCtx?.popupConfig}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<section class="cards-section" onclick={markClick} gpHelp="Noob, il faut LIRE avant de cliquer n'importe où!">
			<div class="card-wide petit blinkFlag">
				Bienvenue {pseudo},
				<br/>
				Profite de ta première connexion pour prendre le temps de lire les rubriques d'info en bas de page.
				<br/>
				Et tu n'as pas encore indiqué ton genre, réglé ton audio...
				<br/>
				Pour cela, clique sur ton pseudo en haut à droite.
			</div>
		</section>
	{/if}
	<section class="cards-section">
		<div class="cards-grid">
			{#key forceReloadCount}
				{#each pageList as p, i}
					{@const cls = calcStyle(p)}
					{#if cls}
						<div class={"card "+cls.c}  onclick={() => listClic(p,cls)} role="button" tabindex=0>
							<div class="card-gpIcon-gauche" style="vertical-align:top">
									<span>👉</span>
							</div>
							<!-- Les tips sont perturbants, a analyser
							{#if cls.menuTip}
								<div style="position:relative">
									<div class="card-gpIcon-droite" style="position:absolute; top: -1.5em; left: -1.5em">
										<img style="width: 2em" src={urlCdnSTATIC+"pointescla-anim.gif"} alt=""/>
									</div>
								</div>
							{/if}
							-->
							<div>
								{#if cls.isBeta}<span class="beta">Avant-première</span>{/if}
								<span class={cls.c}>
									{p.texte}
								</span>
								<div class="petit">
									{#if cls.dDt}<span class="lOrange">Début {jjmmhhmmss(cls.dDt)}</span>{/if}
									{#if cls.dCd}
										<span class="lOrange">
											Début dans
											<countdown dth={cls.dCd} txtTimeout="" oncdTimeout={forceReload} use:countDownInit/>
										</span>
									{/if}
									{#if cls.h}{cls.h}{/if}
									{#if cls.fDt}Fin {jjmmhhmmss(cls.fDt)}{/if}
									{#if cls.fCd}
										<span class="lOrange">
											Fin dans
											<countdown dth={cls.fCd} txtTimeout="" oncdTimeout={forceReload} use:countDownInit/>
										</span>
									{/if}
								</div>
								{#if webAuth.privilege & p.privilege}
									<div class="petit">Admin: {"0x"+p.privilege.toString(16).toUpperCase().padStart(8,'0')}</div>
								{/if}
								{#if saisies.isFull}
									<div class="adminCadre petit">
										Adm:
										{#if p.public}
											(public)
										{:else}
											{#if p.privilege}
												({"0x"+p.privilege.toString(16).padStart(8,'0')})
											{:else}
												(auth)
											{/if}
										{/if}
										{#if cls.a}(accès){/if}
										{#if isAdminServer(pseudo)}
											<input type="button" value="?"
												onclick={async () => {displayObject(await apiCall("/clientConfig/getChallenge/"+p.n))} } />
										{/if}
									</div>
								{/if}
							</div>
							<div class="card-gpIcon-droite">
								{#if p.icon}
									<img style="width: 2em" src={urlCdnSTATIC+p.icon} alt=""/>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			{/key}
		</div>
	</section>
	<Credits />
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if !localCtx.popupNewUser && pseudo && webAuth?.etat=="ok"}
	<div class="popupCadre stars">
		<div class="close" onclick={()=>localCtx.popupNewUser=true} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<img class="parchemin" src={urlCdn+"X-ventesPrivees/gamemaster.jpg"} style="width:30%; float:right" alt="" />
				<div>
					{pseudo},
					<br/>
					Ton accès sécurisé est validé sur cet appareil.
					<br/>
					N'oublie pas:
					<br/>
					🔸De lire les rubriques en bas de page exprimant notre volonté
					de convialité, de cybersécurité et de respect de ta vie privée.
					<br/>
					🔸De configurer le site pour parfaire ton confort (audio, synthèse vocale, genre etc...).
					Pour cela, clique sur ton pseudo en haut à droite de ton écran.
				</div>
			</div>
		</div>
	</div>
{/if}


<!-- Phome.svelte -->
