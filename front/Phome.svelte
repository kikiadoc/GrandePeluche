<script>
	import { onMount, onDestroy  } from 'svelte';
	import { urlCdn, scrollPageToTop,
					 jjmmhhmmss, countDownTo, displayInfo, playMusic,
					 capitalizeFirstLetter, isPseudoValid, crypoCreateKeyPair } from './common.js'
	import { G }  from './privacy.js'

	import Credits from './Credits.svelte'
	
	let {	pseudo,	pageList, page= $bindable() } = $props()

	let forceReload = $state(0) // force le reload sur timeout

	const DELAI = 24*3600000 // passage de la date au coundown
	// click dans la liste
	function listClic(pageDesc,cls) {
		if (cls.h) displayInfo({body:cls.h})
		if (cls.a || (pseudo.startsWith("Kikiadoc") && confirm('Acces Admin?')))
			page=pageDesc.n // basculement de la page
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
	<p>Bienvenue {pseudo}</p> 
	<p>Je suis la Grande Peluche Oracle Des Savoirs du Bois Bandé.</p>
	<div>Voici la liste de tes Possibles:</div>
	<div>
		<a class="green" target="_blank" 
			href="https://docs.google.com/spreadsheets/d/1_hho3TD2dr0kqIE-XBVhf6OW62lo2s3RAz_xc_Tkd2Y/edit?usp=sharing"
			onclick={() => playMusic("Money")}	>
			👉 Consulter le grimoire des gains et plannings
		</a>
	</div>
	<div>
		{#key forceReload}
			{#each pageList as p, i}
				{@const isBcpDebut = Date.now() < p.start-DELAI}
				{@const isAvantDebut = Date.now() < p.start }
				{@const isBcpFin = Date.now() < p.end-DELAI}
				{@const isAvantFin = Date.now() < p.end }
				{@const cls =
					(p.always)? { c:"green",a:true } :
					(!p.start)? { c:"red", t: "Masqué par une brume éthérée", h:["Aucune date n'est connue,","Profite de la musique d'ambiance"] } :
					(p.beta && isAvantDebut)? { c:"green", dt:p.start, t: "Début ", a:true, h:["Accès en avant première","tout n'est pas finalisé mais tes gains en avant-première sont garantis"] } :
					(isBcpDebut)? { c:"orange", dt: p.start, cd:p.start-DELAI, t:"Début ", h:["Ce challenge n'est pas encore commencé"] } :
					(isAvantDebut)? { c:"orange", cd:p.start, t:"Début dans ", h:["Ce challenge commencera bientôt"] } :
					(isBcpFin)? { c:"green", dt:p.end, cd:p.end-DELAI, t:"En cours, fin ", a:true } :
					(isAvantFin)? { c:"green", cd:p.end, t:"En cours, fin dans ", a:true } :
					(p.after)? { c:"blue", t:"Terminé ", dt:p.end, a:true, h:["Ce challenge est terminé","tu peux en revoir le lore et les résultats"]} :
					{ c:"red", t:"Terminé ", dt:p.end, h:["Ce challenge est terminé"]}
				}
				<div class="{cls.c}" >
					<div style="cursor: pointer" onclick={() => listClic(p,cls)} role="button" tabindex=0>
						👉
						{#if p.beta}<span class="beta">Avant-première</span>{/if}
						{p.texte}
					</div>
					<div>
						{#if cls.t}{cls.t}{/if}
						{#if cls.dt}
							{jjmmhhmmss(cls.dt)}
						{:else if cls.cd}
							<countdown dth={cls.cd} txtTimeout="" oncdTimeout={()=>forceReload++}>
								{countDownTo(cls.cd)}
							</countdown>
						{/if}
					</div>
				</div>
			{/each}
		{/key}
	</div>
	<Credits />
</div>
<!-- Phome.svelte -->
