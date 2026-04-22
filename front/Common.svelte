<script>
	import { isProd, countDownInit, getEpsilon,
					 displayInfo, displayObject, markClick,
					 isEquipementPC, apiCall,
				 } from './common.js'

	import { G }  from './privacy.js'
	import { GBLCONST, GBLSTATE } from "./ground.svelte.js"
	
	let {
		t=null,
		p={}, // parametre divers
		pageDesc = null,
		refStep = $bindable(null),
		// epiqStepChangeDth= $bindable(null)
	} = $props();

	let ttsTexte=$state(null)

	async function aideDemande() {
		apiCall('/tts/aideDemande/','POST');
	}
	async function aideMessage() {
		if (ttsTexte)
			apiCall('/tts/aideMessage/','POST',{message: ttsTexte})
		else {
			displayInfo({titre:"Message en synthèse vocale",
									 body: ["Indique dans la zone message un petit texte,",
													"il sera envoyé en synthèse vocale aux autres connectés et sur Discord",
													{cls:"info cRed", txt:"N'abuse pas de cette fonction"}
												 ],
									})
		}
		ttsTexte=""
	}
	
</script>
<style>
progress[value] {
  --background: red; /* the background color */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: 0.1em solid white;
  width: 10%;
	height: 0.4em;
  border-radius: 10em;
  background: var(--background);
	vertical-align: baseline
}
progress::-webkit-progress-bar { border-radius: 10em; background: var(--background); }
progress[class~="p3"]::-webkit-progress-value { border-radius: 10em; background: green ! important; }
progress[class~="p2"]::-webkit-progress-value { border-radius: 10em; background: lightgreen ! important; }
progress[class~="p1"]::-webkit-progress-value { border-radius: 10em; background: blue ! important; }
progress[class~="p0"]::-webkit-progress-value { border-radius: 10em; background: orange ! important; }
	/*
progress[value="100"]::-moz-progress-bar { border-radius: 10em; background: var(--color2); }
progress[value="100"]::-webkit-progress-value { border-radius: 10em; background: var(--color2); }
progress[value=100]::-webkit-progress-value { border-radius: 10em; background: var(--color2); }
progress[value]::-webkit-progress-value { border-radius: 10em; background: var(--color); }
progress[value]::-moz-progress-bar { border-radius: 10em; background: var(--color); }
progress[value]::-webkit-progress-bar { border-radius: 10em; background: var(--background); }
progress::-moz-progress-bar { border-radius: 10em; background: var(--color); }
	*/
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
{#if t=="headerPage"}
	{#if !isEquipementPC()}<br/>{/if}
	{#if pageDesc?.delaiDebut}
		{@const challengeDebutDth = (isProd)? pageDesc.start+getEpsilon()+(pageDesc?.delaiDebut || 1) *60000 : Date.now()+3000}
		<span style="cursor:pointer" role="button" oncdTimeout={(e)=>e.currentTarget.remove()}
			onclick={markClick} gpHelp="Temps restant dédié à la lecture du Lore">
			📖<countdown dth={challengeDebutDth} use:countDownInit />
		</span>
	{/if}
	<span>
		<span role="button" style="font-size:0.8em; cursor:pointer" onclick={aideMessage}>📢</span>
		<input type="text" placeholder="message..." bind:value={ttsTexte}
			onkeypress={(e) => e.key=="Enter" && aideMessage()}
			maxlength=60 />
	</span>
	
{:else if t=="waitDebutChallenge"}
	{@const challengeDebutDth = (isProd)? pageDesc.start+getEpsilon()+pageDesc.delaiDebut*60000 : Date.now()+4000}
	<div>
		<input type="button" value="Revoir le Lore" onclick={()=> refStep=0} />
		<input type="button" value={p.txt || "Go!"} onclick={()=> {
			if (Date.now() >= challengeDebutDth)
					refStep=90
				else
					displayInfo({
						titre:"Ne rushe pas les explications !!",
						img: "commons/coyote.gif",
						imgClass: "img50",
						body:[
							"Il y a un temps pour chaque chose:",
							"Le temps imparti à la lecture du Lore n'est pas échu.",
							"Le temps restant est indiqué à coté de l'icone 📖 en haut de la page."
						],
						ding: "prout-long"
					})
			} } />
	</div>
{:else if t=="jauge"}
	{@const c= (p.val>=p.max)? "p3" : (p.s2 && p.val>=p.s2)? "p2": (p.s1 && p.val>=p.s1)? "p1" : "p0" }
	<span>
		{p.lbl}
		<progress class={c} min="0" max={p.max} value={p.val} />
	</span>
{:else if t=="checklist3D"}
	<div>
		{#if GBLSTATE.swcReady}
			<div class="greenPointer">
				✅Métacache est active, tes téléchargements sont optimés et dédupliqués.
			</div>
		{:else}
			<div class="redPointer blinkMsg">
				🛑Métacache n'est pas active.
				Recharge la page et si cela ne suffit pas, 
				ferme TOUS les onglets sur le site, puis FERME TON NAVIGATEUR et
				reviens visiter le site.
				<br/>
				Contacte Kikiadoc si cela ne suffit pas.
			</div>
		{/if}

		{#if navigator.connection?.saveData}
			<div class="orangePointer">
				⚠️Tu as activé l'option de limitation de téléchargement
				mais une scene 3D peut necessiter de télécharger plusieurs centaines de Mo.
				En cas de soucis ou si tu as des questions, contacte Kikiadoc.
			</div>
		{:else}
			<div class="greenPointer">
				✅Tu n'as pas limité les téléchargements (Pour une scène 3D, je télécharge une centaine de Mo)
			</div>
		{/if}
		{#if navigator.connection?.type=="ethernet"}
			<div class="greenPointer">
				✅Tu es connecté en Ethernet directement sur ta box.
			</div>
		{:else if navigator.connection?.type=="wifi"}
			<div class="greenPointer">
				⚠️Tu es connecté en Wifi (via ta box ou ton smartphone).
				A priori, c'est OK, mais je manque d'information.
			</div>
		{:else if navigator.connection?.effectiveType}
			{#if navigator.connection.effectiveType=="4g" || navigator.connection.effectiveType=="5g" }
				<div class="greenPointer">
					✅Ta connexion semble suffisante, mais je manque d'information (??{navigator.connection.effectiveType}+).
				</div>
			{:else}
				<div class="redPointer blinkMsg">
					🛑Ta connexion semble insuffisante ({navigator.connection.effectiveType}).
					Contacte Kikiadoc.
				</div>
			{/if}
		{:else}
			<div class="orangePointer blinkMsg">
				⚠️Ton navigateur ne permet pas l'analyse de ta connexion internet.
			</div>
		{/if}
		{#if navigator.getBattery}
			{#await navigator.getBattery() }
				<div>Je récupère les informations de ta batterie...</div>
			{:then battery}
				{@const batLvl=Math.floor((battery.level*100))}
				<div role="button" style="cursor:pointer"
					onclick={()=>displayObject({level:battery.level,charging:battery.charging,chargingTime:battery.chargingTime,dischargingTime:battery.dischargingTime})}>
					{#if batLvl<40 && !battery.charging}
						<div class="redPointer blinkMsg">
							⚠️Tu devrais recharger ton équipement (batterie à {batLvl}%).
							<sup>(i)</sup>
						</div>
					{:else}
						<div class="greenPointer">
							✅Ton équipement est sur secteur, suffisamment chargé ou en charge ({batLvl}%).
							<sup>(i)</sup>
						</div>
					{/if}
				</div>
			{:catch}
				<div class="blinkMsg">
					⚠️Je n'ai pas pu acceder aux informations de batterie.
				</div>
			{/await}
		{:else}
			<div class="blinkMsg">
				⚠️Je n'ai pas accès à l'état de la batterie de ton équipement.
			</div>
		{/if}
		{#if navigator.storage?.persist}
			{#await navigator.storage.persist()}
				<div>Demande de stockage persistant en cours...</div>
			{:then ex}
				<div role="button" onclick={()=>displayObject(ex)}
					class={ex?'greenPointer':'redPointer blinkMsg'}>
					{ex?'✅':'🛑'}Demande de stockage persistant: {ex?"OK":"Erreur, Contacte immédiatement Kikiadoc"}
					<sup>(i)</sup>
				</div>
				{#if ex}
					{#await navigator.storage.persisted()}
						<div>Verification de stockage persistant en cours...</div>
					{:then ev}
						<div role="button" onclick={()=>displayObject(ev)}
							class={ev?'greenPointer':'redPointer blinkMsg'}>
							{ev?'✅':'🛑'}Autorisation de stockage persistant: {ev?"OK":"Erreur, contacte immédiatement Kikiadoc"}
							<sup>(i)</sup>
						</div>
					{:catch errv}
						<div role="button" onclick={()=>dspObject=errv}	class="redPointer blinkMsg">
							🛑Erreur sur navigator.storage.persisted():{errv.message}.
							Contacte immediatement Kikiadoc
							<sup>(i)</sup>
						</div>
					{/await}
				{/if}
			{:catch err}
					<div role="button" onclick={()=>dspObject=err} class="redPointer blinkMsg">
						🛑Erreur sur navigator.storage.persist():{err.message}.
						Contacte immediatement Kikiadoc
						<sup>(i)</sup>
					</div>
			{/await}
		{:else}
			<div class="redPointer blinkMsg">
				🛑Ton navigateur ne gère pas le stockage persistant.
				Contacte Kikiadoc immédiatement.
			</div>
		{/if}
		{#if navigator.storage?.estimate}
			{#await navigator.storage.estimate()}
				<div>Analyse en cours...</div>
			{:then e}
				{@const qOk = e.quota > 1024*1024*1024}
				<div role="button" class="{qOk?'greenPointer':'redPointer blinkMsg'}"
					onclick={()=>displayObject(e)}>
					{qOk?'✅':'🛑'}
					Stockage Persistant:
					{(e.usage/(1024*1024*1024)).toFixed(2)}/{(e.quota/(1024*1024*1024)).toFixed(2)}Go
					<sup>(i)</sup>
				</div>
			{:catch error}
				<div style="color: red">{error.message}</div>
			{/await}
		{:else}
			<div style="color:yellow">
				Ton navigateur ne permet pas l'analyse du stockage associé au site par storage.estimate
			</div>
		{/if}
	</div>
{:else}
	<div class="ERREUR">ERREUR Common t={t}</div>
{/if}

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!--
{#if t=="delayStep"}
	{#if Date.now() < epiqStepChangeDth+p.nbMs}
		<div class="info">
			Lis attentivement le lore (<countdown dth={epiqStepChangeDth+p.nbMs} txtTimeout="Ok"/>)
		</div>
	{/if}
	<input type="button" value={p.lbl || "J'ai compris"} onclick={()=>{
		if (Date.now() < epiqStepChangeDth+p.nbMs) {
			epiqStepChangeDth=Date.now()
			displayInfo({
				titre:"Ne rushe pas les explications !!",
				img: "commons/coyote.gif",
				imgClass: "img50",
				body:[
					"Pour toi, lire atentivement les explications, c'est l'assurance de bien comprendre le Lore.",
					"Pour moi, c'est parfois faire des opérations importantes invisibles pour toi.",
					"En rushant les explications, tu ne nous en as pas laissé le temps.",
					"On doit recommencer, et toi, tu dois patienter encore plus...",
					"Bref, ne rushe pas et lis attentivement le Lore.",
					"Si tu l'avais fait, tu aurais vu le timer de lecture."
				],
				ding: "prout-long"
			})
		}
		else
			refStep=p.step
	} } />
{/if}
-->


<!-- Common.svelte -->

