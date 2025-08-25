<script>
	import { isProd, countDownInit, getEpsilon,
					 displayInfo
				 } from './common.js'

	import { G }  from './privacy.js'
	import Btn from './Btn.svelte'
	
	let {
		t=null,
		p={}, // parametre divers
		pageDesc = null,
		refStep = $bindable(null),
		epiqStepChangeDth= $bindable(null)
	} = $props();

	let dsp=$state(true) // Suivi de l'état d'affichage
	
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
{#if t=="popupDebutChallenge" && dsp}
	{@const challengeDebutDth = (isProd)? pageDesc.start+getEpsilon()+pageDesc.delaiDebut*60000 : Date.now()+getEpsilon()+pageDesc.delaiDebut*1000}
	{#if challengeDebutDth > Date.now()}
		<div class="popupCadre alien">
			<div class="close" onclick={()=>dsp=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<countdown dth={challengeDebutDth} oncdTimeout={()=>dsp=false} use:countDownInit />
					<br/><br/><br/><br/>
					Le challenge n'est pas commencé.
					<br/>
					➥Ferme ce popup et lis le lore !
				</div>
			</div>
		</div>
	{/if}
{/if}

<!-- svelte-ignore element_invalid_self_closing_tag -->
{#if t=="waitDebutChallenge"}
	{@const challengeDebutDth = (isProd)? pageDesc.start+getEpsilon()+pageDesc.delaiDebut*60000 : Date.now()+3000}
	<div>
		{#key dsp}
			{#if challengeDebutDth < Date.now()}
				<Btn bind:refStep={refStep} step=90 val="Go!" />
			{:else}
				<span style="color:red">Début dans
					<countdown dth={challengeDebutDth} oncdTimeout={()=>dsp=false}  use:countDownInit />
				</span>
				<Btn bind:refStep={refStep} step=0 val="Revoir le Lore" />
			{/if}
		{/key}
	</div>
{/if}

<!-- svelte-ignore element_invalid_self_closing_tag -->
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

<!-- Common.svelte -->
