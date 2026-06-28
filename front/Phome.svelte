<script>
	import { onMount, onDestroy  } from 'svelte';
	import { urlCdn, urlCdnSTATIC, scrollPageToTop,
					 jjmmhhmmss, countDownTo, displayInfo, playMusic,
					 capitalizeFirstLetter, isPseudoValid, countDownInit,
					 isAdmin, isPrivilege, isAdminServer, apiCall, displayObject
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'

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

	onMount(() => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });
	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		return false
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
		localCtx.page[pageDesc.n].menuTip = pageDesc.tip?.idx || 0
		// 
		if ( !cls.a && ! (isPrivilege(webAuth,pageDesc.privilege) && confirm("Acces Admin/privilege?") ) ) {
			// challenge non disponible
			displayInfo({titre:"Challenge à venir", music: pageDesc.music,
				img: urlCdnSTATIC+"delai-anim.gif",
				// imgClass: "parchemin",
				body:[
					(pageDesc.tip)?
						{cls:"blinkMsg", txt: pageDesc.tip?.txt} :
						// pageDesc.tip?.txt :
						"Ce challenge n'est pas encore planifié."
				]})
			return
		}
		// Prerequis ?
		if (pageDesc.prereq && !localCtx.page[pageDesc.prereq]?.menuTip) {
			// Recherche la description de la page en preReq
			let wPageDesc = pageList.find((e) => e.n == pageDesc.prereq)
			displayInfo({titre:"Impossible, challenge prérequis", ding: "prout-long",
				body:["Tu dois avoir terminé "+wPageDesc.texte]})
			return
		}
		// Avant première ?
		if (cls.isBeta) {
			displayInfo({titre:"Accès en avant-première", ding:"ding-ding",
				body:["Tu peux participer à ce challenge en avant-première",
							"Ce challenge peut encore évoluer avant sa date de début"]})
		}
		// intention (async)
		apiCall("/clientConfig/intentions/"+pageDesc.n,'POST')
		page=pageDesc.n // basculement de la page
		playMusic(pageDesc.music)
	}

	// Calcul du style d'un des elements de mnu de pageDesc p
	function calcStyle(p) {
		if (!isAdmin(pseudo)) {
			// ignore le pageDesc car privilege insuffisant et non public
			if (!p.public && p.privilege && !(p.privilege & webAuth?.privilege)) return null
			// Si acces public et pageDesc non publique
			if (GBLCONST.public && !p.public) return null
			// Si acces prive et pas d'accès privé
			if (!GBLCONST.public && p.pasPrive) return null
		}
		// Si page affiche (noramelemnt c'est unique la page 0) pas dans le menu
		if (p.n == page) return null
		// La page doit être dans le menu
		// par defaut
		let cls = {m: true, c: "lRed", h: "Masqué par une brume éthérée"}
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
			cls.h = p.help || (p.public && "Disponible") || ((p.privilege)? "Privilégié: 0x"+p.privilege.toString(16) : "En cours")
		// indique si le niveau de lecture est ok
		cls.menuTip = (localCtx.page[p.n]?.menuTip || 0) < (p.tip?.idx || 0)
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
		{#if GBLCONST.SKINNAME=="GP"}
			<div class="hero-eyebrow">je suis la Grande Peluche Oracle des Savoirs.</div>
			<div class="hero-sub">Le sanctuaire de ressources de la communauté FFXIV francophone.</div>
		{/if}
	</section>
	{#if !localCtx?.popupConfig}
		<div class="br" />
		<div class="adminCadre papier info">
			<div class="br"/>
			<div>Tu n'as pas encore configuré le site (audio, synthèse vocale, genre etc...)</div>
			<div class="blinkMsg red">
				Clique sur {#if GBLCONST.public}accès public{:else}ton pseudo{/if}, en haut à droite de ton écran.
			</div>
			<div class="br"/>
		</div>
	{/if}
	<section class="cards-section">
		{#if GBLCONST.SKINNAME=="GP"}
			<p class="cards-label">Voici la liste de tes Possibles:</p>
		{/if}
		<div class="cards-grid">
			{#key forceReloadCount}
				{#each pageList as p, i}
					{@const cls = calcStyle(p)}
					{#if cls}
						<div class={"card "+cls.c}  onclick={() => listClic(p,cls)} role="button" tabindex=0>
							<div class="card-gpIcon-gauche" style="vertical-align:top">
									<span>👉</span>
							</div>
							{#if cls.menuTip}
								<div style="position:relative">
									<div class="card-gpIcon-droite" style="position:absolute; top: -1.5em; left: -1.5em">
										<img style="width: 2em" src={urlCdnSTATIC+"pointescla-anim.gif"} alt=""/>
									</div>
								</div>
							{/if}
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
									&nbsp;
									{#if isAdminServer(pseudo)}
										<span class="adminCadre petit">
											<input type="button" value="?"
												onclick={async () => {displayObject(await apiCall("/clientConfig/getChallenge/"+p.n))} } />
										</span>
									{/if}
								</div>
							</div>
							{#if p.icon}
								<div class="card-gpIcon-droite">
									<img style="width: 2em" src={urlCdnSTATIC+p.icon} alt=""/>
								</div>
							{/if}
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
					Ton accès à la Grande Peluche est validée sur cet appareil.
					<br/>
					Si tu as reçu un MP de ma part, la Grande Peluche, sur Discord,
					lis le et clique sur le lien s'y trouvant pour afficher l'ensemble du Discord.
				</div>
			</div>
		</div>
	</div>
{/if}


<!-- Phome.svelte -->
