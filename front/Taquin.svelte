<script>
	import { onMount, onDestroy  } from 'svelte'
	import { apiCall, getEpsilon, urlImg, markClick } from './storage.js'
	import { G }  from './privacy.js'
	
	let {
		wsCallComponents,
		pseudo,
		pseudoGenre,
		pseudoList,
		nom, // nom du taquin, doit être connu du server
		dspObject = $bindable()
	} = $props();

	onMount(() => { wsCallComponents?.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents?.delete(myWsCallback); reset() });

	let apiRadix = "/taquin/"+nom+"/"  // prefix d'URL a utiliser
	let wsRadix = "taquin/"+nom // commande WS de maj
	let imgRadix = urlImg+"ff-taquin/" // Url pour récup des images

	// element recus du server
	// cases contient des index pour la représentation dans le client
	// pseudos[].lastDth est denier click par pseudo
	// peut contenir pasDeVideMsg: "xx"
	let taquin = $state({size: 0, termine: false, cases: [], pseudos: {} })

	function reset() {}
	function init() {
		let rc = apiCall(apiRadix+"etat") // recupere l'etat
		if (rc.status == 200) updateTaquin(ret.o)
	}
	async function myWsCallback(m) {
		if (m.op==wsRadix) updateTaquin(ret.o)
		return false
	}
	function updateTaquin(mws) {
		taquin = mws // taquin depuis le server
	}

	// cherche la case vide...
	function getCaseVide(l,c) {
		const idx = l*taquin.size + c
		if ( (l>0)      && (! taquin.cases[idx-size]) ) return idx-size // vide ligne précédente
		if ( (l<size-1) && (! taquin.cases[idx+size]) ) return idx+size // vide ligne suivante
		if ( (c>0)      && (! taquin.cases[idx-1]) ) return idx-1 // vide case précédente
		if ( (c<size-1) && (! taquin.cases[idx+1]) ) return idx+1 // vide case suivante
		return -1
	}
	// determine le dth de click selon le nb de co instantané et le dernier click d'un pseudo
	function getNextClickDth(taquin,pseudoList) {
		// heure server du dernier deplacement par un pseudo (0 si aucun pour l'instant)
		let dth = Object.keys(taquin.pseudos).reduce( (a, p) => (p.dthClick > a) ? p.dthClick: a ,0)
		// shift la dth selon les connectés
		switch(pseudoList.length) {
			case  1: dth += 4*60000; break
			case  2: dth += 1*60000; break
			case  3: dth +=   30000; break
			case  4: dth +=   15000; break
			default: dth +=    5000; break
		}
		dth += getEpsilon() // resync heure locale sur heure server
		return dth // heure locale
	}
	function clickCase(l,c) {
		const dest = getCaseVide(l,c) // recupère la vide d'a coté
		if (dest < 0) {
			addNotification(taquin.pasDeVideMsg || "bad click/taquin","red",5) // pas de vide à coté
			return
		}
		// verif que le timer est ok
		const dthPossible = getNextClickDth(taquin,pseudoList)
		if (dthPossible <= Date.now())
			// demande de déplacer depuis l,c vers vide au server, reponse par le WS
			apiCall(apiRadix+"dep/"+(l*taquin.size+c)+"/"+dest,'POST')
		else
			addNotification(taquin.timerMsg || "Attends un peu","red",5) // timer..
	}
</script>
<style>
	caption { caption-side: top; font-size:0.7em }
	table { width:100%; border: 1px solid yellow }
	td { width: 15%; border: 1px solid blue }
</style>
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
	<table>
		<caption style="cursor:pointer" >
			<span onclick={markClick} 
				gpHelp="Temps avant de pouvoir bouger une pièce du taquin">
				⏳<countdown dth={getNextClickDth(taquin,pseudoList)} txtTimeout="Go!"></countdown><sup>(i)</sup>
			</span>
			<span onclick={markClick}
				gpHelp="Nombre de joueurs connectés (influe sur le temps de repos après déplacement)">
			😔{pseudoList.length}<sup>(i)</sup>
			</span>
			<span role="button" onclick={()=>dspObject=taquin}>🆘</span>
		</caption>
		<tbody>
			{#each Array(taquin.size) as _,l}
				<tr>
				{#each Array(taquin.size) as _,c}
					<td onclick={()=>clickCase(l,c)}>
						{l}-{c}
					</td>
				{/each}
				</tr>
			{/each}
		</tbody>
	</table>

<!-- Taquin -->

