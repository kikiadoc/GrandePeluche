<script>
	import { onMount, onDestroy } from 'svelte';
	import { apiCall, loadIt, storeIt } from "./storage.js"
	import { addNotification, newInfoPopup, playVideo } from "./storage.js"
	import { countDownTo, jjmmhhmmss, urlImg } from "./storage.js"

	import Epiq from './z/Epiq.svelte'
	
	export let wsCallComponents
  export let pseudo
  // export let page
  export let pageDesc = null
  // export let pageDone = []
	export let pseudoList = []
	
	const pageEpiqLbl = "P"+pageDesc.n + "_epiqStep"
	let step = loadIt(pageEpiqLbl,0);
  $: storeIt(pageEpiqLbl,step);

	// Gestion des reload, refresh etc..
	onMount(() => {
		if (wsCallComponents) wsCallComponents.add(myWsCallback);
		intervalId = setInterval(timerTick,1000)
		loadEtat()
	});
	onDestroy(() => {
		if (wsCallComponents) wsCallComponents.delete(myWsCallback);
		clearInterval(intervalId)
	});
	// callback sur le websocket
	function myWsCallback(m) {
		if (m.op=="innommable") {	console.log('reloadEtat'); loadEtat(m); return true }
	}
	
	// timer
	let intervalId = null;
	function timerTick() {
		// si l'etat du challenge est disponible
		if (statusDamier) {
			let dthNow = Date.now() + 500 // ajout d'une demi seconde pour eviter le blink si delta serveur
			flagsIHM.countEnigme = (dthNow >= statusDamier.enigmeNextDth)? null : countDownTo(statusDamier.enigmeNextDth)
			flagsIHM.countShift = (dthNow >= statusDamier.shiftNextDth)? null : countDownTo(statusDamier.shiftNextDth)
			flagsIHM.countGift = (dthNow >= statusDamier.giftNextDth)? null : countDownTo(statusDamier.giftNextDth)
			flagsIHM.countProposition = (dthNow >= statusDamier.propositionNextDth)? null : countDownTo(statusDamier.propositionNextDth)
			// sync IHM
			flagsIHM = flagsIHM
			// console.log('timer',statusDamier!=null,'flags',flagsIHM, 'enigmeNext', statusDamier.enigmeNextDth,'now',Date.now())
		}
		// console.log("**************3",flagsIHM)
	}

	// chargement de l'état du challenge
	// force état si e indiqué, e doit être une reponse style http avec status et o et un dth
	// si e normalement, provenance du ws
	async function loadEtat(e) {
		// if (e) console.log("prise en compte WS", e)
		let ret = e || await apiCall("/innommable/etat")
		// if (!e) console.log("prise en compte GET", ret)
		
		if (ret.status==200) { 
			statusDamier = ret.o;
			let now = Date.now()
			statusDamier.shiftNextDth= statusDamier.shiftNextDthByPseudo[pseudo] || 0
			statusDamier.giftNextDth= statusDamier.giftNextDthByPseudo[pseudo] || 0
			// console.log("giftNextDth",statusDamier.giftNextDth)
			statusDamier.enigmeNextDth= statusDamier.enigmeNextDthByPseudo[pseudo] || 0
			statusDamier.propositionNextDth= statusDamier.propositionNextDthByPseudo[pseudo] || 0
			transformEtatToIHM()
		}
		else {
			console.log('BAD STATUS')
		}
			
	}

	// lines.length doit être impair pour avoir une "ligne du milieu"
	// ATTENTION le nonbre de lignes doit être le meme sur le serveur
	const lines=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
	// cols.length doit être la longeur de la chaine résultat à trouver
	// ATTENTION le nonbre de colonnes doit être le meme sur le serveur
	const cols=[0,1,2,3,4,5,6,7,8,9,10,11,12,13]
	
	// statusDamier: structure de la réponse server:
	// reponse = { enigmeNextDth, propositionNextDth, nomTrouve,  enigmes[], shiftNextDthByPseudo[] }
	// enigmes = [ null ou { n,s,finder,locker, finderDth, lockerDth} ]
	// n=nom, s=shift vertical, finder=pseudo qui a trouvé, locker=pseudo qui a bien positioné, dthFinder/dthLocker=timestamp
	// les champs shiftNextDth, giftNextDth sont calculés
	let statusDamier = null
	// tableau d'affichage
	let charsIHM = null
	// flag divers IHM
	let flagsIHM = {}

	function transformEtatToIHM() {
		let tmpCharsIHM = new Array(lines.length * cols.length)
		for (let idxNom = 0; idxNom < statusDamier.enigmes.length; idxNom++) {
			const e = statusDamier.enigmes [idxNom]
			if (e) {
				const l = e.n.length
				const fIdx = idxNom + e.s * cols.length
				for (let idx=0; idx<l; idx++) {
					tmpCharsIHM[fIdx + idx*cols.length] = { c: e.n.charAt(idx), cls: "mid" }
				}
				tmpCharsIHM[fIdx].cls = 'top mid';
				tmpCharsIHM[fIdx + (l-1)*cols.length].cls = 'bot mid';
			}
		}
		// ligne du milieu
		const ll=((lines.length-1)/2) * cols.length
		let nbLock = 0
		for (let cc=0; cc < cols.length; cc++) {
			let e = tmpCharsIHM[ll+cc]
			if (e) {
				if (statusDamier.enigmes[cc].locker) {
					e.cls += ' milGood'
					nbLock ++;
				}
				else
					e.cls += ' milBad'
			}
		}
		// sync ihm
		flagsIHM.toutTrouve = (nbLock == cols.length)
		charsIHM = tmpCharsIHM
		timerTick();
		// console.log("**************2",flagsIHM)
		if (flagsIHM.toutTrouve && !flagsIHM.videoDone) {
			// console.log("**************3",flagsIHM)
			playVideo("ff14-innommable-trailer")
			flagsIHM.videoDone = true
		}
	}

	// gestion des enigmes
	let dspEnigme = null;
	// table des lieux -- DOIT ETRE IDENTIQUE COTE SERVEUR
	let tblLieuEnigme = [ "Noscea", "Sombrelinceul", "Thanalan", "Coerthas", "Mor Dhona", "Abalathia", "Dravania"]
	// recupère une énigme
	async function tryEnigme(cc) {
		if (flagsIHM.countEnigme) { addNotification("Patience, découverte impossible","yellow",5,"prout-long"); return }
		let ret = await apiCall("/innommable/enigme/"+cc)
		if (ret.status==200) {
			let tmpDspEnigme = ret.o
			const iBlanc = tmpDspEnigme.h.indexOf(' ') >= 0
			const iAccent = tmpDspEnigme.h.indexOf('é') >= 0
			const iTiret = tmpDspEnigme.h.indexOf('-') >= 0
			const iApostrophe = tmpDspEnigme.h.indexOf("'") >= 0
			tmpDspEnigme.indice = (iBlanc)? "plusieurs mots":"un seul mot"
			tmpDspEnigme.indice += (iAccent)? ", une lettre accentuée ou plus" : ", pas d'accent"
			tmpDspEnigme.indice += (iTiret)? ", un tiret ou plus" : ", pas de tiret"
			tmpDspEnigme.indice += (iApostrophe)? ", une apostrophe ou plus" : ", pas d'apostrophe"
			dspEnigme = tmpDspEnigme
		}
	}
	// demande résolution enigme
	async function resoudreEnigme() {
		
		let ret = await apiCall("/innommable/resoudre/"+dspEnigme.i+"/"+dspEnigme.reponse+"/"+dspEnigme.z,'PUT')
		// 202 unsynch, 201 reponse OK,  200 mauvaise réponse
		if (ret.status==200) { loadEtat(ret); addNotification("Mauvaise réponse","red",10,"prout-long") } 
		if (ret.status==201) { /* bonne réponse, maj viw ws */ } 
		if (ret.status==202) { loadEtat(ret); addNotification("Un autre joueur vient d'indiquer la réponse avant toi","red",10,"prout-long") } 
		dspEnigme = null
	}

	// demande décalage ruban cc, en "up" ou "down"
	async function shiftRuban(cc,dir) {
		if (flagsIHM.countShift) { addNotification("Patience, décalage impossible, demande un boost","yellow",5,"prout-long"); return }
		let ret = await apiCall("/innommable/shiftRuban/"+ cc +"/"+ dir,'PUT')
		if (ret.status==202) { addNotification("Decalage du ruban impossible","red",10,"prout-long") } 
		if (ret.status==200) { /* ok maj viw ws */ } 
	}

	// gestion des cadeaux
	let dspGift=null
	async function souhaitGift() {
		let ret = await apiCall("/innommable/souhaitGift",'PUT')
		if (ret.status==200) { dspGift = ret.o }
	}
	async function reponseGift() {
		if (dspGift.p==null || dspGift.r==null || statusDamier.shiftNextDthByPseudo[dspGift.p] <= Date.now() )
			return; // tout non sélectionné ou soucis de date
		let ret = await apiCall("/innommable/reponseGift/"+dspGift.p+"/"+dspGift.r,'PUT')
		if (ret.status==202) { addNotification(dspGift.p=" peut déjà décaler un ruban","yellow",10) }
		if (ret.status==201) { dspGift = null; addNotification("Mauvaise réponse...","red",10,"prout-long") }
		if (ret.status==200) { dspGift = null }
	}

	// gestion des propositions
	let dspProposition=null
	async function faireProposition() {
		let nom = dspProposition.nom
		dspProposition=null // synch ihm
		let ret = await apiCall("/innommable/proposition/"+nom,'PUT')
		if (ret.status==200) { loadEtat(ret); newInfoPopup("Hélas","Ce n'est pas le nom de l'innommable","",{back:"papier",ding: "prout-long"}) }
		if (ret.status==201) { newInfoPopup("WOW!!!!","Tu as découvert le nom de l'innommable!","",{ding:"Applaudissements"} ) }
	}

	// affichage des résultats temporaires
	let dspResultats=null
	async function calcResultats() {
		// oraganise les resultats par pseudo
		// compte les rubans
		let rubanCountByPseudo = {}
		statusDamier.enigmes.forEach( (e) => {
			if (e && e.finder) {
				rubanCountByPseudo[e.finder] ??= 0;
				rubanCountByPseudo[e.finder] ++
			}
		})
		// calcule le tableau des pseudos 
		let pseudos = Array.from(new Set(
				Object.keys(rubanCountByPseudo).concat(
				Object.keys(statusDamier.shiftCountByPseudo),
				Object.keys(statusDamier.giftCountByPseudo)
				)));
		// sync IHM
		dspResultats = { pseudos: pseudos, rubanCountByPseudo: rubanCountByPseudo }
	}
	
</script>
<style>
	.top { border-top: 1px solid white}
	.bot { border-bottom: 1px solid white}
	.mid { border-left: 1px solid white; border-right: 1px solid white; background-color: darkgrey}
	.milBad { color: white; background-color: red; outline: 2px solid red}
	.milGood { color: white; background-color: lightgreen; outline: 2px solid lightgreen}
	.vid { border: 1px solid rgba(170, 50, 220, 0.4) }
	.tblTr { text-align: center; margin:0; padding: 0; height: 1em}
	.tblTd { text-align: center; margin:0 0 0 0; padding: 0 2px 0 2px; font-size: 0.8em; height: 1.1em; width: 0.8em }
	.tblBorder { margin:0 auto; padding: 0; 
				  border: 5px solid pink;
				  /* border-image-source: repeating-linear-gradient(30deg, #4d9f0c, #9198e5, #4d9f0c 250px); */
					border-image-source: repeating-linear-gradient(30deg, #000000, #ffffff, #808080 250px);
				  border-image-slice: 5;
				  border-image-outset: 5px 5px 5px 5px;
				  border-spacing: 0;
				}
	.selOui {border: 4px inset red; cursor: pointer }
	.selNon { border: 4px outset #404040; cursor: pointer }
	.selBad { border: 4px solid #303030; color: #404040 }
	.playVideo { color: white;	text-decoration: unset;	cursor: pointer }
	.playVideo:hover { color:lightgreen; text-decoration: unset; cursor: pointer }
	.playVideo:after { content: "🎞️"; color: lightgreen	}
</style>

{#if pseudo.startsWith("Kikiadoc")}
	<div class="adminCadre">
		<input type="button" on:click={()=> confirm("Reset challenge?") && apiCall('/innommable/clearAll','PATCH') } value="resetChallenge" />
		<input type="button" on:click={()=> confirm("Reset timer?") && apiCall('/innommable/clearTimer','PATCH') } value="resetTimer" />
		<input type="button" on:click={()=> confirm("UnlockFirst?") && apiCall('/innommable/unlockFirst','PATCH') } value="unlockFirst" />
		<input type="button" on:click={()=> confirm("DeleteFirst?") && apiCall('/innommable/deleteFirst','PATCH') } value="deleteFirst" />
		T:{flagsIHM.toutTrouve}
	</div>
{/if}

<!-- preload video pour vitesse -->
<video preload="auto" src="{urlImg}ff14-innommable-trailer.mp4" style="display:none">
	<track kind="captions" />
</video>
	
<div>
  <input type="button" on:click={()=> step=0} value="Réafficher le lore" />
  <input type="button" on:click={()=> calcResultats()} value="Résultats"/>
	❓{flagsIHM.countEnigme || 'maintenant'}
	▲▼{flagsIHM.countShift || 'maintenant'}
	🎁
	{#if !flagsIHM.countGift}
		<input type="button" value="Boost" on:click={()=>souhaitGift()} />
	{:else}
		{ flagsIHM.countGift }
	{/if}
	💡
	{#if statusDamier && statusDamier.nomTrouve}
		{statusDamier.nomTrouve.pseudo}
	{:else if !flagsIHM.countProposition}
		<input type="button" value="J'ai trouvé'!" on:click={()=>dspProposition={} } />
	{:else}
		{ flagsIHM.countProposition }
	{/if}
</div>

{#if charsIHM && step==99}
	<div>
		<table class="tblBorder" >
			<tbody>
			<tr class="tblTr"><td class="tblTd" colspan=14 style="font-size:0.5em">❓Detego ▲▼Transeo 💡Linea IX</td></tr>
			<tr class="tblTr">
				{#each cols as cc}
					{@const e=statusDamier.enigmes[cc]}
					{#if e && !e.locker }
						<td class="tblTd" on:click={()=>shiftRuban(cc,'up')} style="font-size: 0.6em; cursor: pointer" on:keypress={null} >▲</td>
					{:else}
						<td class="tblTd">&nbsp;</td>
					{/if}
				{/each}
			</tr>
			<tr class="tblTr">
				{#each cols as cc}
					{@const e=statusDamier.enigmes[cc]}
					{#if e && !e.locker }
						<td class="tblTd" on:click={()=>shiftRuban(cc,'down')} style="font-size: 0.6em; cursor: pointer" on:keypress={null} >▼</td>
					{:else if !e }
						<td class="tblTd" style="font-size:0.6em; cursor:pointer" on:click={()=>tryEnigme(cc)}  on:keypress={null} >❓</td>
					{:else}
						<td class="tblTd">&nbsp;</td>
					{/if}
				{/each}
			</tr>
			{#each lines as ll}
				{@const tgt= ll==(lines.length-1)/2}
				<tr class="tblTr">
					{#each cols as cc}
						{@const e = charsIHM[ll*cols.length+cc] || {c:"", cls:"vid"} }
						<td class="tblTd {e.cls}">{e.c}</td>
					{/each}
				</tr>
			{/each}
			</tbody>
		</table>
	</div>
{/if}

{#if dspEnigme}
	<div class="popupCadre papier">
		<div class="close" on:click={()=>dspEnigme=null} on:keypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>Ruban #{dspEnigme.i + 1}</div>
				<hr/>
				<div>{dspEnigme.q}</div>
				<div style="font-size:0.8em; font-style: italic">
					Indice: {dspEnigme.indice}
				</div>
				<div>
					Nom: <input on:keypress={(e) => {if (e.keyCode==13) resoudreEnigme()} } bind:value={dspEnigme.reponse} type="text" size="20" />
				</div>
				<div>
					Ou peut-on en trouver?
				</div>
				<div>
					{#each tblLieuEnigme as zone,i}
						<span class="{(dspEnigme.z==zone)?'selOui':'selNon'}" on:click={()=>{dspEnigme.z=zone} } role="button" on:keypress={null} tabindex=0>
							{zone}
						</span>
					{/each}
				</div>
				<div>
					<input type="button" value="Valider mes choix ►" on:click={()=>resoudreEnigme()} />
				</div>
				<hr/>
				<div style="font-size:0.8em; font-style: italic">
					En cas de mauvaise réponse, tu devras patienter jusque demain pour une nouvelle proposition.
				</div>
			</div>
		</div>
	</div>
{/if}

{#if dspGift && statusDamier && statusDamier.shiftNextDthByPseudo}
	<div class="popupCadre papier">
		<div class="close" on:click={()=>dspGift=null} role="button" on:keypress={null} tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>Offrir un boost</div>
				<hr/>
				<div>
					Choisis un aventurier connecté:
				</div>
				<div>
					{#each pseudoList as p,i}
						{#if p==pseudo}
							<span class="selBad" on:click={()=>addNotification("Impossible de se booster soi-même","yellow",5,'prout-long')} role="button" on:keypress={null} tabindex=0>
								{p}
							</span>
						{:else if statusDamier.shiftNextDthByPseudo[p] > Date.now()}
							<span class="{(dspGift.p==p)?'selOui':'selNon'}" on:click={()=>{dspGift.p=p; reponseGift()} } role="button" on:keypress={null} tabindex=0>
								{p}
							</span>
						{:else}
							<span class="selBad" on:click={()=>addNotification(p+" peut actuellemet décaler un ruban","yellow",5,'prout-long')} role="button" on:keypress={null} tabindex=0>
								{p}
							</span>
						{/if}
					{/each}
				</div>
				<hr/>
				<div>Résoud cette énigme:</div>
				<div>{dspGift.q}</div>
				<div>
						{#each dspGift.o as o,i}
							{@const sel= (dspGift.r==i)?'selOui':'selNon'}
							<span class="{sel}" on:click={()=>{dspGift.r=i; reponseGift()}} role="button" on:keypress={null} tabindex=0>
							{o} 
							</span>
						{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

{#if dspProposition && statusDamier && statusDamier.nomTrouve==null}}
	<div class="popupCadre papier">
		<div class="close" on:click={()=>dspProposition=null} role="button" on:keypress={null} tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>Etudie attentivement le Lore!</div>
				<div>
					Tu pourras peut-être m'indiquer le nom de l'innommable,
					même sans connaitre tous les rubans ni leurs positions
				</div>
				<div> 
					Son nom est composé uniquement de lettres (a-z).
				</div>
				<div>
					<input type="text" size=28 bind:value={dspProposition.nom} on:keypress={(e) => {if (e.keyCode==13) faireProposition()} }/>
					<input type="button" value="►" on:click={()=>faireProposition()} />
				</div>
				<div>Attention, si tu te trompes, tu ne pourras faire une nouvelle proposition que demain!</div>
			</div>
		</div>
	</div>
{/if}

{#if dspResultats && statusDamier}
	<div class="popupCadre papier">
		<div class="close" on:click={()=>dspResultats=null} role="button" on:keypress={null} tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent" style="font-size:0.8em">
				<div>
					Résultats actuels:
				</div>
				<div>
					Les gains (20 millions de gils) seront répartis selon une formule secrète
					fonction des découvertes de ruban,
					des boosts offerts à d'autres joueurs,
					du nombre de décalages réalisés
					et si tu es le premier à avoir trouvé le nom de l'Innommable.
					N.B: le fait de vérouiller un ruban à sa position définitive ne compte pas.
					<hr/>
				</div>
				<div>
					{#if statusDamier.nomTrouve}
							{statusDamier.nomTrouve.pseudo} a découvert le nom de l'Innommable
							{jjmmhhmmss(statusDamier.nomTrouve.dth)}
					{:else}
							Personne n'a encore trouvé le nom de l'innommable
					{/if}
				</div>
				<hr />
				<div>
					<table style="text-align: center">
						<tbody>
						<tr><td>Pseudo</td><td>❓</td><td>▲▼</td><td>🎁</td></tr>
						{#each dspResultats.pseudos as p,i}
							<tr>
								<td>{p}</td>
								<td>{dspResultats.rubanCountByPseudo[p] || 0}</td>
								<td>{statusDamier.shiftCountByPseudo[p] || 0}</td>
								<td>{statusDamier.giftCountByPseudo[p] || 0}</td>
							</tr>
						{/each}
						</tbody>
					</table>
				</div>
				<hr />
				<div>
					{#each statusDamier.enigmes as e,i}
						<div>
							Ruban #{(i+1)}:
							{#if e && e.n}
								{e.n}
								<br/> Grâce à {e.finder} {jjmmhhmmss(e.finderDth)}, {e.e}
								{#if e.locker}
									<br/>Ruban vérouillé par {e.locker} {jjmmhhmmss(e.lockerDth)}
								{/if}
							{:else}
								A découvrir!
							{/if}
						</div>
						<hr />
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}


{#if step==0}
	<div>
		<p>
			Bienvenue {pseudo}, dans cette nouvelle aventure.
		</p>
		<p>
			Déjouer les plans de la Magie Maléfique lors de l'Uchronie a permis
			de restaurer l'Histoire d'Eorzéa.
			Tu sais aussi que je n'ai pas identifié la monstruosité qui se cachait
			derrière ces différentes incantations maléfiques.
		</p>
		<p>
			J'aime compléter mon équipe par des Peluches assistantes
			très compétantes chacune dans leur domaine.
			Tu connais déjà AudioBlaster qui gère l'audio du site et Hildiscord, le cousin d'Hildibrand,
			qui se charge de ma communication sur Discord.
		</p>
		<p>
			Quand une petite Peluche nommée
			<a href="https://fr.wikipedia.org/wiki/Johann_Wolfgang_von_Goethe" target="_blank">Goethe</a>
			s'est présentée en m'expliquant qu'elle était dramaturge,
			je me suis dit que c'était un domaine que je ne maitrisais pas et 
			qu'une autre lecture du Grimoire de la Magie pourrait être intéressante.
		</p>
	</div>
  <Epiq bind:step={step} oui=1 ouiVal="En quoi peut-elle nous aider?" />
{/if}
{#if step==1}
	<div>
		<p>
			<u><i>N'oublie pas que tu peux réafficher ces explications en
			cliquant sur "Réafficher le lore" à tout moment, sans perdre ton avancement dans le challenge.</i></u>
		</p>
		<img src="{urlImg}ff14-goethe.jpg" alt="" style="width: 15%; float:right" />
		<p>
			Alors que je feuilletais le Grimoire des Savoirs
			et lui relatais
			<span class="playVideo" on:click={()=>playVideo('ff-6-trailer')} on:keypress={null} role="button" tabindex=0 >
				les exploits des Aventuriers de l'Uchronie
			</span>
			, elle m'a regardée avec un petit sourire amusé et m'a dit:
			<br/>
			<i>Un personnage de ma célèbre tragédie ressemble à la Magie Maléfique.</i>
		</p>
		<p>
			En découvrant une page du Grimoire de la Magie comportant une sorte de damier vide,
			<a href="https://fr.wikipedia.org/wiki/Johann_Wolfgang_von_Goethe" target="_blank">Goethe</a>
			s'est à nouveau retournée vers moi et m'a dit:
			<br />
			<i>Cette page ressemble à un damier à rubans utilisé par les dramaturges 
			pour dissimuler le nom d'un personnage des plus importants d'une tragédie.</i>
		</p>
		<p>
			Elle a ajouté que la découverte d'un tel nom permettrait, selon les dramaturges des premières ères astrales,
			de découvrir ensuite la métaphysique du personnage mentionné.
		</p>
	</div>
  <Epiq bind:step={step} oui=2 ouiVal="Un damier à rubans?" />
{/if}
{#if step==2}
	<div>
		<p>
			Je te montrerai le damier un peu plus tard.
		</p>
		<p>
			<a href="https://fr.wikipedia.org/wiki/Johann_Wolfgang_von_Goethe" target="_blank">Goethe</a>
			m'a indiqué qu'un damier à rubans est une 
			<a href="https://fr.wikipedia.org/wiki/St%C3%A9ganographie" target="_blank">technique de stéganographie</a>
			permettant de dissimuler le nom d'un personnage.
		</p>
		<p>
			L'inscription <span style="border: 3px solid red">❓Detego ▲▼Transeo 💡Linea IX</span>
			en haut du damier explique son fonctionnement.
		</p>
		<p>
			L'usage du latin semble indiquer que le damier de cette page a été conçu par les Asciens d'Eorzéa
			lors de la premiere ère ombrale.
		</p>
		<p>
			Heureusement, selon le Grand Grimoire des Savoirs,
			un damier à rubans ne permet que de connaitre le nom d'un personnage et non l'invoquer.
		</p>
	</div>
  <Epiq bind:step={step} oui=3 ouiVal="Et ca fonctionne comment?" />
{/if}
{#if step==3}
	<div>
		<p>
			Voici les détails:
		</p>
		<p>
			<i>Linea IX</i> indique que le Nom Secret se révélera sur la ligne 9, il faut donc placer les rubans verticalement.
			<br/>
			Le damier comporte 14 colonnes, il y a donc 14 rubans à placer sur le damier.
			<br/>
			<i>Detego</i> indique qu'il faut découvrir un ruban à l'aide d'un indice.
			Cliquer sur un bouton ❓ devrait révéler cet indice.
			<br/>
			<i>Transeo</i> indique qu'il est nécessaire de faire glisser les rubans pour découvrir le Nom Secret.
			Cliquer sur un bouton ▲ ou ▼ devrait permettre de décaler un ruban sur le damier.
		</p>
		<p>
			Ce damier à rubans semble être d'un modèle très élaboré.
			<br />
			Il est possible de décaler un ruban au delà des limites du damier. Dans ce cas,
			les caractères du début ou de la fin du ruban pendouillent, invisibles, en haut ou en bas du damier.
			<br />
			Il doit comporter un mécanisme de vérouillage d'un ruban dès que celui-ci est bien positionné.
			<br />
			Il doit comporter des mécanismes limitant dans le temps les découvertes de rubans
			et les décalages afin de ne pas permettre une  
			<a href="https://fr.wikipedia.org/wiki/Attaque_par_force_brute" target="_blank">attaque par force brute</a>
			<br />
			Un mécanisme d'auto-destruction doit exister pour ne pas laisser le damier utilisable
			ad vitam æternam dès que le processus de découverte est enclenché.
		</p>
	</div>
  <Epiq bind:step={step} oui=4 ouiVal="Un dernier conseil?" />
{/if}
{#if step==4}
	<div>
		<p>
			<a href="https://fr.wikipedia.org/wiki/Johann_Wolfgang_von_Goethe" target="_blank">Goethe</a>
			m'a aussi indiqué qu'il était impossible à une personne seule de résoudre un tel
			damier à rubans dans le délai imparti. C'est un challenge comportant de la 
			compétition entre les participants quand il s'agit d'identifier les rubans,
			mais aussi de la collaboration pour décaler les rubans et découvrir le Nom Secret.
		</p>
		<p>
			Lors de ce mini jeu,
			<a href="https://www.philolog.fr/le-temps-est-il-notre-ennemi-ou-notre-allie/" target="_blank">
			le temps sera ton ennemi et ton allié
			</a>
			<br/>
			Ce sera ton ennemi car les timers sont importants et cela fera naître en toi l'Impatience.
			Ce sera aussi ton allié car ces timers importants te laisseront le temps de la réflexion
			et d'organiser la coopération entre Aventuriers.
			<br/>
			Kikiadoc me dit souvent que l'important c'est qu'il n'y ait pas de perdant, uniquement des valeureux.
		</p>
		<p>
			Pour faciliter le décalage des rubans, il est souhaitable de
			se <u><i>connecter à plusieurs en même temps</i></u>.
			Si un autre Aventurier a décalé un ruban récemment et que ta fonction de boost est disponible,
			tu peux l'utiliser pour lui permettre de décaler à nouveau un ruban.
			La fonction de boost a un timer, mais il est bien moins long que les autres.
		</p>
		<p>
			N'hésite pas à partager sur Discord
			tes idées ou organiser des rendez-vous
			(canal texte Discussions ou vocal Blablabla)
		</p>
	</div>
  <Epiq bind:step={step} oui=99 ouiVal="Montre moi le damier à rubans" />
{/if}

<!-- page P310.svelte -->
