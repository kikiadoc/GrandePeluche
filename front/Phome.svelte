<script>
	import { onMount, onDestroy  } from 'svelte';
	import { urlCdn, scrollPageToTop,
					 jjmmhhmmss, countDownTo, displayInfo, playMusic,
					 capitalizeFirstLetter, isPseudoValid, 
					 isAdmin, apiCall, displayObject
				 } from './common.js'
	import { G }  from './privacy.js'

	import Credits from './Credits.svelte'
	
	let {	pseudo,	pageList, pageDone, webAuth, page= $bindable(), localCtx= $bindable() } = $props()

	let forceReload = $state(0) // force le reload sur timeout

	const DELAI = 24*3600000 // passage de la date au coundown

	// click dans la liste 
	function listClic(pageDesc,cls) {
		if (cls.h) displayInfo({body:cls.h, img:"commons/help-anim.gif" })
		if (pageDesc.prereq && ! pageDone.includes(pageDesc.prereq)) {
			// Recherche la description de la page en preReq
			let wPageDesc = pageList.find((e) => e.n == pageDesc.prereq)
			displayInfo({titre:"Participation actuellement impossible",
				body:["Tu dois avoir terminé "+wPageDesc.texte]})
		}
		else if (cls.a || (webAuth.privilege & pageDesc.privilege) || ((isAdmin(pseudo)) && confirm('Acces Admin?'))) {
			apiCall("/clientConfig/intentions/"+pageDesc.n,'POST')
			page=pageDesc.n // basculement de la page
		}
		playMusic(pageDesc.music)
	}


</script>
<style>
	.red { color:red }
	.orange { color:orange }
	.green { color:lightgreen }
	.blue { color:lightblue }
	.white { color:white }
	.beta { color:white; background-color: green; font-size: 0.6em; padding: 0.1em; 
					border: 2px solid white; border-radius: 5px }
	.dejaFaite { color:orange; text-decoration: underline;  }
</style>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag) -->
<div use:scrollPageToTop>
	<div>Bienvenue {pseudo},</div> 
	<p>Je suis la Grande Peluche Oracle des Savoirs.</p>
	{#if !localCtx?.popupConfig}
		<div class="br" />
		<div class="adminCadre papier info">
			<div class="br"/>
			<div>Tu n'as pas encore configuré le site (audio, synthèse vocale, genre etc...)</div>
			<div class="blinkMsg red">
				Clique sur ton pseudo, en haut à droite de ton écran.
			</div>
			<div class="br"/>
		</div>
	{/if}
	<div class="br" />
	<div>Voici la liste de tes Possibles:</div>
	<div>
		{#key forceReload}
			{#each pageList as p, i}
				{#if p.privilege}
					{#if p.privilege & webAuth.privilege}
					<div class="cOrange" style="cursor: pointer" role="button" tabindex=0
						onclick={() => listClic(p,{} )}>
						👉{p.texte}
						<br/>
						(Privilege: 0x{ ("00000000"+Number(p.privilege).toString(16)).slice(-8)})
					</div>
					{/if}
				{:else}
					{@const isBcpDebut = Date.now() < p.start-DELAI}
					{@const isAvantDebut = Date.now() < p.start }
					{@const isPlanned = p.start || p.end }
					{@const isBcpFin = Date.now() < p.end-DELAI}
					{@const isAvantFin = Date.now() < p.end }
					{@const isBeta = p.beta && ( (Date.now() < p.end) || !p.start) }
					{@const cls = 
						(p.always)? { c:"green", a:true, t:"Challenge de Bienvenue" } :
						(p.beta && isAvantDebut)? { c:"green", dt:p.start, t: "Début ", a:true, h:["Accès en avant première.","Ce challenge peut encore évoluer"] } :
						(p.beta && !isPlanned)? { c:"orange", t: "Pas encore planifié", a:true, h:["Accès en avant première.","Ce challenge peut encore évoluer"] } :
						(!isPlanned)? { c:"red", t: "Masqué par une brume éthérée", h:["Ce challenge n'est pas encore planifié, profite de la musique d'ambiance"] } :
						(isBcpDebut)? { c:"orange", dt: p.start, cd:p.start-DELAI, t:"Début ", h:["Ce challenge n'est pas encore commencé"] } :
						(isAvantDebut)? { c:"orange", cd:p.start, t:"Début dans ", h:["Ce challenge commencera bientôt"] } :
						(isBcpFin)? { c:"green", dt:p.end, cd:p.end-DELAI, t:"En cours, fin ", a:true } :
						(isAvantFin)? { c:"green", cd:p.end, t:"En cours, fin dans ", a:true } :
						(p.after)? { c:"blue", t:"Terminé ", dt:p.end, a:true, h:["Ce challenge est terminé.","Tu peux en revoir le lore et les résultats.","N'oublie pas de réclamer tes gains."]} :
						{ c:"red", t:"Terminé ", dt:p.end, h:["Ce challenge est terminé"]}
					}
					<div class="{cls.c}" >
						<div style="cursor: pointer" onclick={() => listClic(p,cls)} role="button" tabindex=0>
							👉
							{#if isBeta}<span class="beta">Avant-première</span>{/if}
							{p.texte}
							<br/>
							<div class="petit">
								{#if cls.t}{cls.t}{/if}
								{#if cls.dt}
									{jjmmhhmmss(cls.dt)}
								{:else if cls.cd}
									<countdown dth={cls.cd} txtTimeout="" oncdTimeout={()=>forceReload++}>
										{countDownTo(cls.cd)}
									</countdown>
								{/if}
								{#if isAdmin(pseudo)}
									<span class="adminCadre petit">
										<input type="button" value="?"
											onclick={async () => {displayObject(await apiCall("/clientConfig/getChallenge/"+p.n))} } />
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			{/each}
		{/key}
	</div>
	<div>
	<a class="petit" style="color:darkgrey" target="gpHelp" 
		href="https://docs.google.com/spreadsheets/d/1_hho3TD2dr0kqIE-XBVhf6OW62lo2s3RAz_xc_Tkd2Y/edit?usp=sharing"
		onclick={() => playMusic("Money")}	>
		👉 (Obsolete) Grimoire des gains
	</a>
	</div>
	<Credits />
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if !localCtx.popupNewUser && pseudo} 
	<div class="popupCadre stars">
		<div class="close" onclick={()=>localCtx.popupNewUser=true} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<img class="parchemin" src={urlCdn+"X-ventesPrivees/gamemaster.jpg"} style="width:30%; float:right" alt="" />
				<div>
					{pseudo},
					<br/>
					Ton processus d'inscription touche à sa fin.
					<br/>
					Tu dois avoir reçu un MP de ma part, la Grande Peluche, sur Discord.
					<br/>
					Lis le et clique sur le lien s'y trouvant pour afficher le Discord des Kiki's Event.
				</div>
			</div>
		</div>
	</div>
{/if}


<!-- Phome.svelte -->
