<script>

	import { onMount, onDestroy  } from 'svelte';
	import {
		loadIt, storeIt, newInfoPopup,
		apiCall, addNotification, urlImg, urlCdn, urlRaw,
		playSound, playVideo, jjmmhhmmss, scrollTop, clickSur, getEpsilon
	} from './storage.js'
	
	import Btn from './z/Btn.svelte'
	import Cupload from './Cupload.svelte'

	/**
	 * @typedef {Object} Props
	 * @property {any} wsCallComponents
	 * @property {any} pseudo
	 * @property {any} page
	 * @property {any} [pageDone]
	 * @property {any} [pageDesc]
	 * @property {any} audioBack
	 * @property {any} audioAmbiance
	 * @property {any} audioVolume
	 */

	/** @type {Props} */
	let {
		wsCallComponents,
		pageDesc = null,
		pseudo,
		pseudoList,
		etatTTS = null,
		page = $bindable(),
		pageDone = $bindable([]),
		audioBack = $bindable(),
		audioAmbiance = $bindable(),
		audioVolume = $bindable(),
		dspObject = $bindable()
	} = $props();

	const LBL_NOVICIAT = "l'Hégémonie" // usage en texte
	const TEC_NOVICIAT = "hegemonieInitiatique" // usage en code pour haut fait
	const DIS_NOVICIAT = "hegemonie" // usage en code pour discord
	const WS_NOVICIAT = "hf_"+TEC_NOVICIAT
	const MAXNOVICES = 20
	const pageEpiqLbl= "P"+pageDesc.n+"_epiqStep"
	const pageIpLbl= "P"+pageDesc.n+"_ip"
	
	onMount(() => { if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { if (wsCallComponents) wsCallComponents.delete(myWsCallback) });

	async function myWsCallback(m) {
		if (m.op=="notif" && m.fromPseudo==pseudo && epiqStep==30) {
			epiqStep=35;
			newInfoPopup("Voila !","tu sais maintenant envoyer un message aux autres joueurs connectés");
			scrollTop()
		}
		else
		if (m.op==WS_NOVICIAT) {
			getNovices(m);
		}
	}

	// Gestion de l'épique
	let epiqStep = $state(loadIt(pageEpiqLbl, 0));
	$effect(()=>storeIt(pageEpiqLbl,epiqStep))

	// init...
	async function init() {
		getNovices();
	}
	
	// données saisies
	let saisies = $state({})

	// gestion des novices
	let novices = $state(null)
	let dspNoviciat = $state(false);
	async function getNovices(msgWs) {
		let ret = msgWs || await apiCall('/hautsFaits/'+TEC_NOVICIAT);
		if (ret.status == 200) novices = ret.o;
		novices.nb = Object.keys(novices.pseudos).length
	}
	async function addNovice() {
		const hfLvl = (novices && novices.nb < MAXNOVICES)? 0:1
		let ret
		ret = await apiCall('/discord/reqGrant/'+DIS_NOVICIAT,'PUT')
		ret = await apiCall('/hautsFaits/'+TEC_NOVICIAT+'/'+hfLvl,'PUT')
		if (ret.status==200) addNotification("Tu es déjà un novice de "+LBL_NOVICIAT,"lightgreen",10)
		if (ret.status==201 && hfLvl>=1) newInfoPopup("Attention","Je t'ai inscrit dans la liste d'attente car le quota de participants est atteint","Contacte Kikiadoc sur Discord")
		return true
	}

	// boutons d'assistance pour le reglage audio
	async function audioRien() {
		audioAmbiance = true;
		audioBack=false
		audioVolume=50
		playSound("LOTR-connaissances",true)
		newInfoPopup("Aucun son n'est audible",
								[
									"J'ai réinitialisé le volume d'AudioBlaster à 50% et relancé la bande sonore depuis le début",
									"Si tu n'entends toujours rien, vérifie que le son du navigateur est activé au niveau du mixer global de ton appareil",
									"Sur Windows, vérifie aussi que tu n'as pas 'mute' l'onglet du site et que le son de ton navigateur est autorisé",
									"Sur Smartphone, vérifie aussi que tu n'as pas désactivé l'autorisation de son du site",
									"Si tu n'entends toujours rien, contacte Kikiadoc sur Discord"
								])
		
	}
	async function audioFaible() {
		audioAmbiance = true;
		audioBack=false
		playSound("LOTR-connaissances",true)
		newInfoPopup("Le volume est trop faible",
								[
									"Clique sur ton pseudo en haut de ton écran et augmente le volume d'AudioBlaster",
									"Si, même à 100%, c'est toujours trop faible, augmente le volume du navigateur dans le mixer global de ton appareil",
									"Si tu as encore un soucis, contacte Kikiadoc sur Discord"
								])
	}
	async function audioFort() {
		audioAmbiance = true;
		audioBack=false
		playSound("LOTR-connaissances",true)
		newInfoPopup("Le volume est trop fort",
								[
									"Clique sur ton pseudo en haut de ton écran et baisse le volume d'AudioBlaster jusque 10%",
									"Si tu entends trop fort, même à 10%, baisse le volume du navigateur dans le mixer global de ton appareil",
									"Si tu as encore un soucis, contacte Kikiadoc sur Discord"
								])
	}

</script>

<style>
	
</style>
<!-- svelte-ignore element_invalid_self_closing_tag -->
<div>
	
{#if pseudo.startsWith('Kikiadoc')}
	<div class="adminCadre">
		Admin: 
		<input type="button" value="resetNoviciat" onclick={()=>apiCall('/hautsFaits/'+TEC_NOVICIAT,'DELETE')} />
		<input type="button" value="ReEnd" onclick={()=>{epiqStep=90}} />
	</div>
{/if}


<input type="button" value="Revoir le Lore" onclick={() => epiqStep=0} />
<input type="button" value="Voir le noviciat" onclick={() => dspNoviciat=true} />

{#if epiqStep==0 && novices}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
		Bienvenue {pseudo} dans <b>{LBL_NOVICIAT}</b>, le Kiki's Event IX.
		{#if novices.nb >= MAXNOVICES && !novices.pseudos[pseudo]}
			<div class="adminCadre">
				<div style="color:red">Les inscriptions automatiques sont closes, car le quota de participants est atteint.</div>
				<div class="blinkMsg">Si tu souhaites participer car tu es motivé, termine ce challenge puis contacte Kikiadoc sur Discord.</div>
				<i>Pour voir la liste des inscrits, clique sur le bouton "voir le noviciat" en haut de la page.</i>
			</div>
		{/if}
		<div class="br"></div>
		Comme lors du précédent événement, 
		Kikiadoc m'a confié la lourde mission d'être ton Game Master Numérique.
		<div class="br"></div>
		<u>Lit attentivement mes instructions</u>
		<br/>
		Les quelques minutes nécessaires à terminer cette quête Initiatique pourront te
		paraître pénibles mais c'est le moyen pour que tu participes aux futurs challenges
		dans les meilleures conditions.
		Tu découvriras aussi le début de la trame épique de l'événement.
		<div class="br"></div>
		Lorsque, comme maintenant, je t'indique des éléménts du Lore,
		tu auras souvent des boutons à la fin de mes explications.
		Il te faudra choisir l'une des options proposées.
		<br/>
		Ici, il n'y en a qu'une: J'ai compris. Clique dessus!
		<br/>
		<Btn bind:refStep={epiqStep} step=5 val="J'ai compris" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==5}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"gamemaster.jpg"} style="width:20%; float:right" alt="" />
		En cas de soucis, d'incompréhension ou d'une simple hésitation,
		c'est MP @Kikiadoc sur Discord ou via le canal #discussions.
		Kikiadoc ne supporterai pas que tu sois bloqué, ennuyé ou frustré!
		<br/>
		Il n'y a pas de mauvaise question:
		Si Kikiadoc considère la réponse à ta question comme un "spoiler", il te dira que c'est un "spoiler" 😜
		<br/>
			Et si tu découvres un bug notable, il y a même un
			<a href="https://fr.wikipedia.org/wiki/Prime_aux_bogues" target="_blank">
				bug bounty
			</a>
			avec des gils en récompense!
		<br/>
		<Btn bind:refStep={epiqStep} step=10 val="C'est cool" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}
	
{#if epiqStep==10}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"audio.jpg"} style="width:20%; float:right" alt="" />
		Tu as probablement déjà entendu mon Assistant AudioBlaster.
		Il gère la musique d'ambiance, les notifications sonores, la synthèse vocale et les vidéos(*).
		<div class="br"></div>
		Je vais t'aider à bien le paramétrer.
		<div class="br"></div>
		A tout moment, en <u>cliquant sur 🔊 ou 🔇, en haut à droite de ton écran</u>,
		tu peux activer ou désactiver l'ambiance sonore
		tout en laissant les autres flux actifs
		car ils peuvent être sources d'informations importantes.
		<div class="br"></div>
		<div class="br"></div>
		{#if audioAmbiance}
			Pour modifier les paramètres d'AudioBlaster, <span class="blinkMsg">clique sur ton pseudo en haut à droite de ton écran</span>.
			Des conseils pour règler les paramètres te seront prodigués.
			<br/>
			De nouveaux réglages sont disponibles pour <u>la synthèse vocale</u>.
		{:else}
			<span style="color:red" class="blinkMsg">Active l'ambiance sonore en cliquant sur 🔇 afin de parametrer AudioBlaster</span>.
		{/if}
		<div class="br"></div>
		{#if audioAmbiance}
			<div>Comment est l'audio d'ambiance du site actuellement?</div>
			<div>
				<input type="button" onclick={audioRien} value="Je n'entend rien" />
				<input type="button" onclick={audioFaible} value="Le son est trop faible" />
				<input type="button" onclick={audioFort} value="Le son est trop fort" />
				<Btn bind:refStep={epiqStep} step=15 val="C'est parfait" 
						msg="N'oublie pas que tu peux toujours activer/désactiver l'ambiance sonore avec les boutons 🔊 ou 🔇, alors ne mute pas le site pour toujours recevoir les éléments sonores importants"	/>
			</div>
			<div class="br"></div>
		{/if}
		<div style="font-size:0.7em">
			(*) Lors de l'affichage de vidéos, tu gardes la possibilité de te positionner, de faire pause,
			ou d'en modifier le volume. Toutefois, ces modifications ne s'appliquent qu'à la vidéo en cours.
		</div>
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==15}
	{@const epsilon=getEpsilon()}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"audio.jpg"} style="width:20%; float:right" alt="" />
		Je vais aussi utiliser ma Voix pour te commander.
		Vérifie le niveau sonore de la Synthèse Vocale:
		<div>
			Tu dois entendre distictement la Voix même avec l'ambiance sonore active.
		</div>
		<div class="blinkMsg">
			Clique sur ton pseudo en haut à droite de ton écran et
			clique sur le bouton de test vocal.
		</div>
		<Btn bind:refStep={epiqStep} step=20 val="J'entend parfaitement ta Voix" />
		<Btn bind:refStep={epiqStep} step=20 val="J'ai un soucis"
			msg="Contacte Kikiadoc sur Discord, Il t'aidera a compléter tes reglages en paramétrant aussi le mixer de ton appareil"	/>
		<div style="clear:both" class="br"></div>
	</div>
{/if}

		
{#if epiqStep==20 && novices}
	{@const epsilon=Math.abs(getEpsilon())}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"lore.jpg"} style="width:20%; float:right" alt="" />
		N'hésite pas à cliquer sur les liens marqués d'une
		<a href="https://fr.wikipedia.org/wiki/Hyperlien" target="_blank">loupe</a>
		d'un
		<span class="imgLink" gpImg='ff-7/kiki-1.png'>appareil photo</span>
		ou d'un
		<span class="videoLink" onclick={()=>playVideo('ff-7-teaser0c')} role=button tabindex=0 onkeypress={null}>
			projecteur vidéo
		</span>,
		ça peut être une surprise ou une explication importante! 
		<div class="br"></div>
		Prendre le temps de lire le texte du Lore, regarder les vidéos en intégralité,
		et même les vidéos qui peuvent poper au milieu d'un challenge, 
		<u>celà n'impacte jamais tes résultats</u>, et est parfois une source d'info pour aller plus vite!
		<div class="br"></div>
		A tout moment, tu peux cliquer sur "Revoir le lore" en haut de page,
		tu ne perdras aucune donnée saisie ou Haut Fait réalisé.
		<div class="br"></div>
		Tu vas participer à des challenges où le timing est important aussi
		j'applique une "correction temporelle" pour rendre équitable tous les challenges.
		<br/>
		Pour ton équipement, elle est actuellement de
		{#if epsilon < 300}
			<span style="color:lightgreen">{epsilon} millisecondes, tu n'as donc pas de soucis</span>
		{:else if epsilon < 1000}
			<span style="color:yellow">{epsilon} millisecondes, c'est un peu trop mais je peux gérer</span>
		{:else}
			<span class="blinkMsg" style="color:red">{epsilon} millisecondes, c'est trop, contacte Kikiadoc</span>
		{/if}
		(*).
		<div class="br"></div>
		Enfin, attention à ne pas purger les "données de site" de ton navigateur(**).
		Si tu fais cela, tu perdras ta clé privée(***), tes données saisies et tu ne pourras pas te reconnecter.
		Il faudra alors contacter Kikiadoc sur Discord.
		<div class="br"></div>
		<Btn bind:refStep={epiqStep} step=30 val="J'ai compris" />
		<div style="font-size:0.8em">
			(*) la correction temporelle est l'écart entre l'horloge du serveur et celle de ton équipement.
			Cet écart est compensé par les algorithmes utilisés dans la limite du raisonnable,
			mais un écart de plus d'un seconde indique un soucis avec ton équipement.
			Tu peux vérifier à tout moment la correction temporelle en cliquant sur ton pseudo
			en haut à droite de ton écran
			et en scollant en bas du popup.
			<br/>
			(**) Il est facile de purger les "données de site" par inadvertance, souvent en purgeant les cookies ou en
			utilisant des utilitaires de "ménage". Si c'est possible, paramètre le ménage en indiquant de ne pas purger
			les informations relatives à "ff14.adhoc.click" ou "api.adhoc.click"
			<br/>
			(***) Ta clé privée est utilisée pour générer des "mots de passe" aléatoires, éphémères et signés.
			C'est bien plus sécurisé que l'usage d'un mot de passe classique.
			Elle est obligatoire pour que le serveur t'authentifie.
		</div>
		<div style="clear:both" class="br"></div>
	</div>
{/if}
	
{#if epiqStep==30}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"multijoueurs.jpg"} style="width:30%; float:right" alt="" />
		Dans le bandeau supérieur, <u>ton pseudo et l'indicateur "multijoueurs" doivent toujours être verts</u>.
		Cela indique que tu es bien connecté à mes assistants LogicServer et SyncServer.
		Tu peux alors participer aux challenges, qu'ils soient en solo, en compétition ou en coopération temps réel.
		<div class="br"></div>
		Si pour une quelconque raison, ils deviennent rouge, recharge la page.
		<br/>
		Si cela ne suffit pas, contacte immédiatement Kikiadoc sur Discord.
		<br/>
		<Btn bind:refStep={epiqStep} step=35 val="J'ai compris" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==35}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/checksec.png"} style="width:30%; float:right" alt="" />
		SyncServer, LogicServer, Hildiscord, AudioBlaster...
		<div class="br"></div>
		Il me reste à te présenter CheckSec, mon Tank Gardien. 
		Il nous protège des incessantes agressions liées à la cybersécurité.
		J'espère que tu n'attireras jamais son regard. Quand il enrage, il est pire que l'œuil de Sauron.
		<div class="br"></div>
		Si le site ne répond pas alors que d'autres sites
		répondent correctement, c'est probablement que tu as attiré sur toi l'œuil de CheckSec
		et qu'il t'a bloqué.
		<div class="br"></div>
		Si tel est le cas, c'est probablement parce que:
		<br/>
		➤ Ton IP est "proche" d'une IP malveillante
		<br/>
		➤ Tu n'as pas respecté la navigation prévue sur le site (même involontairement)
		<div class="br"></div>
		CheckSec vérifie aussi en temps réel le nombre de connexions actives vers le site.
		Si vous êtes plusieurs à partager ta connexion Internet, indique le à Kikiadoc.
		Normalement à 2, ca doit passer, mais à 3 ça bloque et tu risques le bannissement automatique.
		<div class="br"></div>
		En cas de soucis technique, Kikiadoc te demandera de consulter la
		<a href={urlRaw+'securite/index.html'} target="_blank">
			page d'assistance
		</a>
		Jettes-y un coup d'oeuil tout de suite, cela t'évitera le mode panique en cas de soucis.
		<div class="br"></div>
		<Btn bind:refStep={epiqStep} step=40 val="J'ai regardé la page d'assistance" />
		<div class="br"></div>
		PS: Si le développement d'un site comme la Grande Peluche t'intéresse, consulte le document
		<a href="{urlCdn}Architecture et conception du site ff14.adhoc.click.pdf" target="_blank">
			Architecture, conception, et code source
		</a>
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==40}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"hof-lalalex.png"} style="width:30%; float:right" alt="" />
		Maintenant, passons aux choses sérieuses!
		<p>
			Lors du Kiki's Event VIII, les 
			<span class="videoLink" onclick={()=>playVideo('ff-6-trailer')} onkeypress={null} role="button" tabindex=0>
				Aventuriers de l'Uchronie
				ont restauré l'Histoire
			</span>.
		</p>
		<p>
			Un peu après, les Aventuriers ont résolu l'énigme du damier à ruban du Premier Age
			et ont permis d'identificer 
			<span class="videoLink" onclick={()=>playVideo('ff14-innommable-trailer')} onkeypress={null} role="button" tabindex=0>
				Méphitophélès
			</span>
			comme le véritable maître de la Magie.
			C'est lui qui avait tenté de reprendre le contrôle d'Eorzéa en utilisant l'Uchronie.
		</p>
		Te souviens-tu de tout celà?
		<div class="br"></div>
		<Btn val="Non, je n'y ai pas participé"
			msg="Alors clique sur les liens videos de cette page pour voir ce que tu as manqué" />
		<Btn bind:refStep={epiqStep} step=50 val="Oui. J'y étais"
			msg="Si tu souhaites revoir les vidéos de ces aventures plus tard, tu pourras te rendre à l'IPA, l'Institut Peluchique de l'Audiovisuel (dans la liste de tes Possibles)"/>
		<Btn bind:refStep={epiqStep} step=50 val="Je viens de regarder les vidéos"
			msg="Si tu souhaites revoir les vidéos de ces aventures plus tard, tu pourras te rendre à l'IPA, l'Institut Peluchique de l'Audiovisuel (dans la liste de tes Possibles)"/>
		<div style="clear:both" class="br"></div>
	</div>
{/if}
{#if epiqStep==50}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"hof-lalalex.png"} style="width:30%; float:right" alt="" />
		Depuis quelques temps, je suis très inquiète car 
		j'ai découvert de nouveaux chapîtres dans le Grimoire de la Magie.
		Ils mentionnent {LBL_NOVICIAT}, mais je n'en comprend pas de nombreux passages.
		<p>
			Et surtout, je ne comprend pas pourquoi de nombreuses Peluches semblent avoir perdu leurs âmes.
			Elles semblent encore en vie, capable de se nourrir et de travailler, mais leurs âmes semblent totalement possédées.
		</p>
		<p>
			J'ai pu établir une communication avec les Quatre qui explorent toujours l'Ortho-Temps.
			Ils m'ont affirmé que les	5 dimensions de l'Univers Connu ne sont pas corrompues.
		</p>
		<Btn bind:refStep={epiqStep} step=70 val="C'est inquiétant" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==70}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"deepAI/ref-cl.png"} style="width:30%; float:right" alt="" />
		Oui, c'est même très inquiétant. Je pense que c'est le commencement de nouvelles aventures!
		<div class="br"></div>
		Il me reste à vérifier avec toi quelques points.
		Le premier est que tu peux facilement te TP vers les maisons de Kikiadoc.
		<div class="br"></div>
		Si tu n'es pas encore ami IG avec Kikiadoc Lepetiot @ Moogle,
		envoie lui une demande d'ami pour avoir les TP directs vers ses maisons.
		S'il n'est pas connecté sur le jeu, tu peux le mp @Kikiadoc sur discord!
		<div class="br"></div>
		Fais maintenant un TP vers la maison de CL de Kikiadoc
		(Moogle, Brumée, secteur 19, slot 5). 
		Si ton perso n'est pas sur Moogle, tu peux utiliser
		l'éthérite d'une capitale pour changer de monde.
		<a href="https://fr.finalfantasyxiv.com/lodestone/playguide/contentsguide/worldvisit/" alt="" target="_blank">
			(Tutorial)
		</a>
		<br/>
		<u>Ces TPs sont gratuits! Surtout, n'utilise pas les options payantes de transfert de monde</u>
		<div class="br"></div>
		Quand tu es devant la maison de CL de Kikiadoc, va dans le jardin et dirige toi vers le servant Kikiadoc Lebogosse
		<br/>
		<Btn bind:refStep={epiqStep} step=80 val="Je suis dans le jardin" />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==80}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"boussole.png"} style="width:50%; float:right" alt="" />
		<div class="info">
			Cette étape semble chiante, mais c'est justifié. Voir en fin de page.
		</div>
		Maintenant que tu es dans le jardin de la maison de CL de Kikiadoc,
		tu es à proximité du servant Kikiadoc Lebogosse. (voir l'image)
		<div class="br"></div>
		Entraine-toi à te positionner juste à coté d'un pnj (ici Kikiadoc Lebogosse),
		à m'indiquer ses coordonnées (ici X:8.6 Y:11.7)
		et faire un screen où les noms des servants ou pnjs sont lisibles.
		<table width="95%"><tbody><tr>
			<td style="vertical-align: top; text-align: right; width: 50%">
				X:<input type="number" placeholder="*8.6*" size=6 step="0.1" bind:value={saisies.X} />
				<br/>
				Y:<input type="number" placeholder="*11.7*" size=6 step="0.1" bind:value={saisies.Y} />
				<br/>
				{#if saisies.X!='8.6' || saisies.Y!='11.7'}
					<span style="color:red">Coordonnées?</span>
				{:else if !saisies.imageDataRaw}
					<span style="color:red">Screen non défini</span>
				{:else}
					<Btn style="color:green" bind:refStep={epiqStep} step=90 val="C'est OK ➤" />
				{/if}
				<br/>
			</td>
			<td style="vertical-align: top; width: 50%">
				<Cupload cbImageRaw={(raw)=>saisies.imageDataRaw=raw} />
			</td>
		</tr></tbody></table>
		<div style="clear:both" class="br"></div>
		<div class="info">
			Cette étape d'entrainement peut sembler très chiante, mais c'est lié aux difficultés
			rencontrées par des participants lors de précédents événements.
			<br/>
			Dans certains cas, des "assistants à la saisie"
			peuvent perturber la saisie de valeurs numériques ou un upload.
			Exemple: la "locale" n'est pas "fr-FR" (français de france),
			un clavier "custom" est utilisé (en particulier sur iPhone) etc...
			<br/>
			Pour vous éviter un soucis au milieu d'un challenge, je préfère faire un
			test dès maintenant en espérant que j'ai traité tous les cas rencontrés précédemment.
			<br/>
			Lors de cet entrainement, ton screen ne sera pas réellement stocké sur le serveur.
			N'en profite pas pour mettre une
			<span class="videoLink" onclick={()=>playVideo('ff-7/photocopie-fesses')} role=button tabindex=0 onkeypress={null}>
				photocopie de tes fesses!
			</span>
			<!--
			<br/>
			N.B: Contrairement à Google, Discord, FesseLivre, Tiktoké, X-Fake etc.. 
			je ne télécharge par les "métadatas" de tes images sur le serveur
			(style tes coordonnées GPS, le nom de ton équipement etc...).
			Le filtrage pour ne garder que l'image est réalisé localement par ton équipement et
			le serveur n'accepte que des données "brutes".
			<br/>
			-->
			
		</div>
	</div>
{/if}

{#if epiqStep==90}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"ff-7/livre-correspondance.png"} style="width:50%; float:right" alt="" />
		Ton initiation touche à sa fin.
		<br/>
		Entre dans la maison de CL de Kikiadoc et consulte le message du propriétaire sur le livre de correspondance.
		Suis alors les consignes.
		<div class="br"></div>
		<Btn val="Explique moi pour le livre de correspondance"
			msg="Le livre se trouve dans la maison, près de l'entrée et à gauche en entrant, sur une demi-cloison. Clic sur l'icon 🠟 au dessus du livre. Lis alors le message du propriétaire et laisse un message selon la consigne en cliquant sur l'icon crayon 🖉" />
		<Btn bind:refStep={epiqStep} step=99 val="J'ai écrit le message demandé sur le livre" ifFct={()=>addNovice()} />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if epiqStep==99}
	<div class="reveal">
		<img class="parchemin" src={urlImg+"hautfait.png"} style="width:30%; float:right" alt="" />
		Bravo {pseudo}, tu as fini la quête initiatique de {LBL_NOVICIAT} et tu as déjà gagné
		1 million de gils sous reserve de ta participation aux challenges.
		<div class="br"></div>
		<u>Je t'ai envoyé un MP sur Discord car tu as maintenant accès au canal Discord de cet événement.</u>
		<div class="br"></div>
		En haut de page, tu auras souvent un bouton indiquant la progression
		actuelle des Aventuriers dans le challenge en cours. Ici, tu peux cliquer sur 'Voir le noviciat'
		<div class="br"></div>
		Tu peux revenir à cette quête initiatique depuis ta Liste des Possibles
		en cliquant sur <i>{pageDesc.texte}</i> puis la rebalayer en cliquant sur "Revoir le Lore"
		<div class="br"></div>
		<Btn bind:refPageDone={pageDone} pageDone={pageDesc.n} bind:refPage={page} page=0 val="Merci Grande Peluche"  />
		<div style="clear:both" class="br"></div>
	</div>
{/if}

{#if dspNoviciat}
	<div class="popupCadre papier">
		<div class="close" onclick={()=>dspNoviciat=false} onkeypress={null} role="button" tabindex=0>X</div>
		<div class="popupZone">
			<div class="popupContent">
				<div>Novices de {LBL_NOVICIAT}:</div>
				{#each Object.keys(novices.pseudos) as p,i}
					{@const confirmer = (novices.pseudos[p].lvl)? "(à confirmer)":""}
					<div style="font-size:0.9em">{p}: {jjmmhhmmss(novices.pseudos[p].dth)} {confirmer}</div>
				{/each}
				<div>{novices.nb} participants</div>
			</div>
		</div>
	</div>
{/if}
	
</div>

<!-- P330.svelte -->

