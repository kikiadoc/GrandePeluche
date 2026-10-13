<script>
	import { onMount, onDestroy  } from 'svelte'
	import { apiCall, getEpsilon, urlImg, markClick, addNotification } from './common.js'
	import { G }  from './privacy.js'
	
	let {
		wsCallComponents,
		pseudo,
		pseudoGenre,
		pseudoList,
		cbEtat = null,
		nom, // nom du ruban, doit être connu du server
		dspObject = $bindable()
	} = $props();

	onMount(() => { wsCallComponents?.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents?.delete(myWsCallback); reset() });

	let apiRadix = "/rubans/"+nom+"/"  // prefix d'URL a utiliser
	let wsRadix = "ruban."+nom // commande WS de maj

	// element recus du server
	let ruban = $state({taille: 0, termine: false, soluce: [], pseudos: {}, solPos: 5 })
	// local
	let debug = $state(false)
	let godMode = $state(false)

	async function reset() {}
	async function init() {
		let ret = await apiCall(apiRadix) // recupere l'etat
		if (ret.status == 200) updateRuban(ret.o)
	}
	async function myWsCallback(m) {
		if (m.op==wsRadix) { updateRuban(m.o); return true }
		return false
	}
	function updateRuban(mwo) {
		ruban = mwo // ruban depuis le server
		cbEtat?.(ruban.termine)
	}
	function deplaceRuban(c,s) {
		// Autorise le déplacement si le ruban est toujours dans la position solPos
		const dLigne=ruban.solPos-ruban.pos[c]
		if ((dLigne <= 0 && s==0) || (dLigne >= ruban.taille-1 && s==1)) {
			addNotification("Déplacement impossible","yellow",5,"prout-long")
			return
		}
		// si le ruban est a la bonne position, impossible de le déplacer
		if (ruban.solPos-ruban.pos[c]==ruban.soluce[c]) {
			addNotification("Ruban vérouillé","yellow",5,"prout-long")
			return
		}
		// verifie la dth de click possible
		if ( getNextClickDth(ruban,pseudoList,pseudo) > Date.now() ) {
			addNotification("Tu n'es pas reposé","yellow",5,"prout-long")
			return
		}
		apiCall(apiRadix+"/"+c+"/"+s,'POST') // ignore reponse, maj via le ws broadcast
	}
	// determine le dth de click selon le nb de co instantané et le dernier click d'un pseudo
	function getNextClickDth(ruban,pseudoList,pseudo) {
		// recupere l'heure server du dernier click du pseudo ou 0
		let dth = ruban.pseudos[pseudo]?.moveDth || 0
		// godmode pour tests
		if (godMode) dth=0
		// shift dth selon nb joueurs instantanés (imposé server ou par defaut)
		switch(pseudoList.length) {
			case  1: dth += ruban.timers?.[1] || 2*60*60000; break // defaut: 2 heures pour le perso solo
			case  2: dth += ruban.timers?.[2] ||   60*60000; break // toutes les 1 heure --> 30 minutes/groupe
			case  3: dth += ruban.timers?.[3] ||   15*60000; break // toutes les 15 minutes --> 5 minutes/groupe
			case  4: dth += ruban.timers?.[4] ||    4*60000; break // toutes les 4 minutes --> 1 minute/groupe
			case  5: dth += ruban.timers?.[5] ||     100000; break // toutes les 100 Secondes --> 20 secondes/groupe
			case  6: dth += ruban.timers?.[6] ||      30000; break // toutes les 30 Secondes --> 5 secondes/groupe
			default: dth += ruban.timers?.[6] ||      21000; break // toutes les 21 Secondes --> 3 secondes/groupe
		}
		// resync heure locale sur heure server
		return dth + getEpsilon() 
	}
</script>
<style>
	table { margin: 0; padding:0; border: 1px solid yellow; margin:auto; font-size:1em; text-align:center; vertical-align:top }
	caption { caption-side: top }
	tbody { margin: 0; padding: 0}
	tr { margin: 0; padding: 0}
	td { margin: 0; padding: 0}
	.notSolPos { border: 5px outset black}
	.solPosKo { border: 5px outset red}
	.solPosOk { border: 5px outset lightgreen}
	/* .solPosTr { } */
	.horsRuban { color:red; border: 1px solid blue }
	.icone { width:1.2em; height:1.2em } 
</style>
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_missing_attribute -->
	<table>
		<caption style="cursor:pointer" >
			<span onclick={markClick} 
				gpHelp="Temps avant de pouvoir bouger {ruban.texte} (dépend du nombre de connectés)">
				⏳<countdown dth={getNextClickDth(ruban,pseudoList,pseudo)} txtTimeout="Go!"></countdown><sup>(i)</sup>
			</span>
			<span onclick={markClick}
				gpHelp="Nombre de joueurs connectés (influe sur le temps de repos après déplacement)">
			😔{pseudoList.length}<sup>(i)</sup>
			</span>
			{#if pseudo.startsWith("Kikiadoc")}
				<span role="button" onclick={()=> dspObject= ruban}>🆘</span>
				<span role="button" onclick={()=> debug= !debug}>🄳</span>
				<span role="button" onclick={()=> godMode= !godMode}>🄶</span>
			{/if}
		</caption>
		<tbody>
			<tr style="cursor:pointer">
				{#each Array(ruban.soluce.length) as _,c}
					<td onclick={()=>deplaceRuban(c,1)}>▲</td>
				{/each}
			</tr>
			{#each Array(ruban.taille) as _,l}
				{@const isLinSol= (l==ruban.solPos)}
				<tr onclick={markClick} gpHelp="Utilise ▲ ou ▼ pour déplacer {ruban.texte} ">
					{#each Array(ruban.soluce.length) as _,c}
						{@const dLigne=l-ruban.pos[c]}
						{@const hors=(dLigne<0 || dLigne>=ruban.taille)}
						{@const isOk= ruban.solPos-ruban.pos[c]==ruban.soluce[c]}
						<td class={(hors)?"horsRuban": (!isLinSol)? "notSolPos" : (isOk)? "solPosOk" : "solPosKo "}>
							{#if debug}({l}-{c}){dLigne}{/if}
							{#if !hors}<img class="icone" src={urlImg+ruban.img+dLigne+".png"} />{/if}
						</td>
					{/each}
				</tr>
			{/each}
			<tr style="cursor:pointer">
				{#each Array(ruban.soluce.length) as _,c}
					<td onclick={()=>deplaceRuban(c,0)}>▼</td>
				{/each}
			</tr>
		</tbody>
	</table>

<!-- Ruban.svelte -->
