<script>
	import { onMount, onDestroy  } from 'svelte';
	import { urlCdn, urlCdnSTATIC } from "./ground.svelte.js"
	import { loadIt, storeIt, scrollPageToTop,
					 displayInfo, displayObject, addNotification, playVideo,
					 markClick, apiCall, isNumeric, isAdmin, isPseudoValid
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST,GBLSTATE }  from './ground.svelte.js'
	import Common from './Common.svelte'
	import Btn from './Btn.svelte'
	import Info from './Info.svelte'
	
	let {
		GBLCTX,
		wsCallComponents,
		pageDesc,
		pseudo,
		pseudoGenre,
		pseudoList,
		page = $bindable(0),
		pageDone = $bindable([]),
	} = $props();

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()

	const URLWEBHOOKSTART = "https://discord.com/api/webhooks/"
	const CAT="CDX"
	
	onMount(() => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique 
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes 
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// appelé apres mount du component
	async function init() { await getEtat() }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true 
		return false
	}

	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		s.debug ??= false
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}

	// 
	let etat = $state(null)
	let dspWebHook = $state(null)
	let dspTagGuilde = $state(null)
	let dspNotif = $state(null)
	async function getEtat() {
		let ret = await apiCall(APIROOT+"synthese/"+CAT,'GET',null)
		if (ret.status==200) etat = ret.o
	}
	function webHookCheckParams() {
		return body
	}
	async function abonnementCreate() {
		let body = { cat: CAT, url: saisies.webHookUrl, tag: pseudo, roleType:saisies.typeRoleId, roleId: saisies.roleId }
		// Verif des URL 
		if (!body.url || !body.url.startsWith(URLWEBHOOKSTART)) {
			displayInfo({ back: "papier", ding:"prout-long",
				body: [ "URL webhook invalide","Un WebHook commence par "+URLWEBHOOKSTART	]	})
			return null
		}
		// Verif des parametres RoleId
		if (body.roleType=="2" && (!isNumeric(body.roleId) || (body.roleId.length<10)) ) {
			displayInfo({ back: "papier", ding:"prout-long",
				body: [ "Un roleID est numérique et doit être d'au moins 9 chiffres",
								"Pour connaitre le roleId d'un role de ton serveur Discord, click sur le 'Notifications (i)'"]	})
			return null
		}
		let ret = await apiCall(APIROOT+"addWebHook",'POST',body)  
		switch (ret.status) {
			case 200: {
				displayInfo({
					titre:"Abonnement accepté", back: "stars", music: "FrontTitles", ding:"Applaudissements",
					img: urlCdn+"commons/gamemaster.jpg", 
					body: [
						"Tu as reçu un message sur ton discord de ma part.",
						{cls: "blinkMsg", txt:"Vérifie son contenu"},
						"➥Si tout est ok, retourne à ta Liste des Possibles en cliquant en haut à gauche de ton écran",
						"➥Si tu remarques une erreur, tu peux supprimer ton abonnement"
					]
				})
				etat = ret.o
				break
			}
			default: {
				displayInfo({
					titre:"Abonnement refusé", back: "rouge", ding:"prout-long",
					img: urlCdn+"commons/gamemaster.jpg", 
					body: [ "Ton abonnement est refusé",
									"Raison:"+ret.msg ]
				})
			}
		}
	}
	async function abonnementDelete() {
		let ret = await apiCall(APIROOT+"delWebHook",'POST', { cat: CAT, tag: pseudo }) 
		if (ret.status==200) {
				displayInfo({
					titre:"J'ai supprimé ton abonnement", back: "papier", music:"Amelie", ding:"Ding",
					img: urlCdn+"commons/gamemaster.jpg",
					body: [
						"Je suis terriblement triste car tu m'as demandé de supprimer ton abonnement",
						"Si tu souhaites te réabonner, clique sur 'Abonner mon Discord' après avoir modifié tes paramètres"
					]
				})
				etat = ret.o
		}
	}
</script>
 
<style>
	li { list-style-type: "🔷" }
	tr { vertical-align: top }
</style>

<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if isAdmin(pseudo)}
		<div class="adminCadre" style="font-size: 0.5em">
			<div>
				Admin: {pageDesc.n}/{epiqStep}
				<input type="number" min=0 max=99 placeholder="epiqStep" bind:value={saisies.admGoStep} />
				<input type="button" value="goEpiq" onclick={() => epiqStep=saisies.admGoStep} />
				<label><input type="checkbox" bind:checked={saisies.debug} />DebugLocal</label>
			</div>
		</div>
	{/if}

	<div>
		<button class="button" value="Début" onclick={() => epiqStep=0} >Début</button>
		<span onclick={markClick} class="petit" style="cursor:pointer"
			gpHelp="Nombre actuels d'abonnés. Au delà de la limite, tu ne peux plus t'abonner">
			Abonnés: {etat?.nbAbo || 0}/{etat?.nbAboMax || 0}
			<sup>(ℹ)</sup>
		</span>
	</div>
	{#if epiqStep==0 && etat}
		<div class="reveal2" {@attach scrollPageToTop}>
			<img src={urlCdnSTATIC+"Codex_Logo2.webp"} style="width:30%; float:right" alt="" />
			<div>
				<ul>
					<li>
						Le Codex est une rubrique hebdomadaire dédiée au lore de Final Fantasy XIV,
						portée par l'équipe du serveur Discord de Final Fantasy XIV - France.
						Son objectif est de mettre en lumière les richesses méconnues de l'univers d'Éorzéa.
					</li>
					<li>
						Le monde de Final Fantasy XIV regorge de détails, d'histoires et de secrets
						que la trame principale ne dévoile jamais.
						Le Codex s'attache à explorer le soft-lore :
						des anecdotes issues des quêtes secondaires et de l'Encyclopedia Eorzea,
						le livre de lore officiel du jeu.
						Chaque publication est conçue pour être accessible à tous, débutants comme vétérans,
						sans jamais spoiler l'histoire principale.
					</li>
					<li>
						Les publications sont automatisées via un système de Webhooks Discord,
						garantissant une diffusion régulière directement au sein des serveurs Discord inscrits.
					</li>
				</ul>
				<div>
					Comment recevoir le Codex?
				</div>
				<ul>
					<li>
						Pour recevoir le Codex sur votre serveur discord, vous devez avoir la permission
						de "Gérer les Webhooks"
					</li>
					<li>
						Si ce n'est pas le cas, demandez à votre administrateur de consulter cette page
						afin qu'il puisse recevoir le Codex sur son serveur.
					</li>
					<li>
						Si vous avez la permission ou que vous êtes administrateur, cliquez sur "Continuer"
						afin de bien préparer le paramétrage.
					</li>
				</ul>
			</div>
			<Btn bind:refStep={epiqStep} step=50 val="Continuer" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==50}
		<div class="reveal2" {@attach scrollPageToTop}>
			<img src={urlCdnSTATIC+"Codex_Logo2.webp"} style="width:30%; float:right" alt="" />
			<div>
				<ul>
					<li>
			 			Le Codex étant une rubrique hebdomadaire, 
						il est recommandé de lui dédier un salon spécifique
						afin que les publications ne se perdent pas dans un canal de discussion général.
					</li>
					<li>
						Nous vous conseillons de créer un rôle "Codex" sur votre Discord et qu'il soit attribué
						aux membres qui souhaitent recevoir une notification lors d'une publication du Codex.
						<br/>
						Pour que le Webhook puisse mentionner ce rôle, vous aurez besoin de son identifiant Discord.
					</li>
				</ul>
			</div>
			<Btn bind:refStep={epiqStep} step=0 val="Précédent" />
			<Btn bind:refStep={epiqStep} step=90 val="Parametrer le Codex" />
			<div style="clear:both" class="br"></div>
		</div>
	{/if}

	{#if epiqStep==90 && etat}
		<div class="reveal2" use:scrollPageToTop>
			<img src={urlCdnSTATIC+"Codex_Logo2.webp"}  style="width:30%; float:right" alt="" />
			{#if etat.isAbonne}
				{pseudo}, tu as abonné ton discord au Codex via ton webHook.
				<br/>
				Si tu souhaites que ton discord ne recoive plus de tels messages, supprime ton abonnement.
				<br/>
				<button class="button" onclick={abonnementDelete} >Supprimer l'abonnement</button>
			{:else}
				<div>
					Cliquez sur un <span class="cGreen">(ℹ)</span> pour des informations détaillées.
				</div>
				<table>
					<tbody>
						<tr>
							<td style="text-align:right" onclick={()=>dspWebHook=true} class="infoLink">
								WebHook:
							</td>
							<td><input bind:value={saisies.webHookUrl} type="url"	placeholder="https://discord.com/api/webhooks/...."	/></td>
						</tr>
						<tr>
							<td  style="text-align:right" onclick={()=>dspNotif=true} class="infoLink">
								Notifications:
							</td>
							<td style="text-align:left">
								<label>
									<input type="radio" name="saisieRoleId" value="0" bind:group={saisies.typeRoleId}/>
									Par défaut
								</label>
								<br/>
								<label>
									<input type="radio" name="saisieRoleId" value="2" bind:group={saisies.typeRoleId}/>
									{#if saisies.typeRoleId != "2"}
										Avec RoleId
									{:else}
										<input type="text" placeholder="roleId(numérique)" bind:value={saisies.roleId} />
									{/if}
								</label>
							</td>
						</tr>
					</tbody>
				</table>
				<Btn bind:refStep={epiqStep} step=50 val="Précédent" />
				<button class="button" onclick={abonnementCreate} >Abonner votre Discord</button>
			{/if}
			<div class="info">
				➥<span class="cOrange">
				Pour toute question ou difficulté, 
				contactez Eleana Kirisame sur le serveur Discord FFXIV France.
				</span>
				<br/>
				➥<span class="cOrange">
					Pour ta cybertranquilité, ne partage pas ton WebHook
					avec une autre personne ou un autre site.
					Crée un WebHook pour le Codex.
				</span>
				<br/>
				<!--
				➥<span class="cOrange">
					Choisis ton CodexNick avec soin.
					Ton abonnement pourra être résilié si un administrateur le considère comme inaproprié.
				</span>
				<br/>
				-->
				➥La technique "WebHook" est particulièrement respectueuse de
				ta vie privée: Contrairement à un Bot Discord qui, si autorisé, peut lire tous les messages
				de ton serveur Discord, un WebHook ne me permet que de poster des
				messages dans un salon que tu choisis, voir les réactions à ces messages et c'est tout.
			</div>
			<div style="clear:both" class="br"></div>
		</div>
	{/if}
	
	{#if dspWebHook}
		<Info bind:dspInfo={dspWebHook}>
			{#snippet template(t)}
				<div>
					Un webhook est une adresse unique qui permet au Codex d'envoyer automatiquement des messages
					dans un salon de votre serveur Discord.
					<br/>
					La création ne prend que quelques minutes et ne nécessite aucune compétence technique.
					<br/>
					Vous devez disposer des permissions Gérer le serveur ou Gérer les webhooks sur votre serveur Discord.
				</div>
				<div class="br"/>
				<div>
					Étapes:
				</div>
				<ul>
					<li>
						Rendez-vous dans le salon Discord dans lequel vous souhaitez recevoir les publications du Codex.
						Il est conseillé d'utiliser un salon dédié plutôt qu'un canal général.
					</li>
					<li>
						Cliquez sur la roue crantée ⚙️ à côté du nom du salon pour accéder à ses paramètres.
					</li>
					<li>
						Dans le menu de gauche, cliquez sur Intégrations.
					</li>
					<li>
						Cliquez sur Webhooks, puis sur Créer un Webhook.
					</li>
					<li>
						Donnez-lui un nom reconnaissable, par exemple Codex, et vérifiez que le salon sélectionné est bien le bon.
					</li>
					<li>
						Cliquez sur Enregistrer.
					</li>
					<li>
						Cliquez sur Copier l'URL du webhook et complétez le champ "Webhook" sur le site.
					</li>
				</ul>
			{/snippet}
		</Info>
	{/if}
	<!--
	{#if dspTagGuilde}
		<Info bind:dspInfo={dspTagGuilde}>
			{#snippet template(t)}
				<div>
						<ul>
							<li>
								Le CodexNick est un identifiant public unique qui sera visible lors des publications du Codex
								sur votre Discord.
							</li>
							<li>
								Vous êtes libre de le définir, il doit comporter entre 5 et 15 caractères alphabétiques.
							</li>
							<li>
								Un bon usage est que votre CodexNick laisse apparaitre, par exemple,
								le nom de votre serveur discord, le nom de votre compagnie libre IG ou un autre "tag" qui vous caractérise.
							</li>
						</ul>
				</div>
			{/snippet}
		</Info>
	{/if}
	-->
	{#if dspNotif}
		<Info bind:dspInfo={dspNotif}>
			{#snippet template(t)}
				<div>
					<div>
						Vous pouvez choisir entre:
						<ul>
							<li>
								Aucune Notification: Les paramètres de notification
								par défaut de Discord s'appliquent.
							</li>
							<li>Par RoleID: Les personnes disposant du rôle Discord choisi seront notifiées</li>
						</ul>
					</div>
					<div>
						Si vous choisissez "RoleID", il est nécessaire
						d'indiquer l'identifiant technique unique du rôle (le RoleID) de votre serveur.
						<br/>
						Pour celà, il faut
						<ul>
							<li>Activer le mode développeur</li>
							<li>Copier le RoleID du rôle</li>
						</ul>
					</div>
					<div>
						Activer le mode développeur
					</div>
					<ul>
						<li>
							Par défaut, Discord n'affiche pas les identifiants.
							Il faut au préalable activer le mode développeur, rassurez-vous,
							cela ne modifie rien au fonctionnement de Discord.
						</li>
						<li>
							Ouvrez vos Paramètres utilisateur en cliquant sur la roue crantée ⚙️ en bas à gauche, à côté de votre pseudo.
						</li>
						<li>
							Dans le menu de gauche, faites défiler jusqu'à la section Paramètres de l'application
							et cliquez sur Apparence ou Avancé selon votre version de Discord.
						</li>
						<li>
							Activez le Mode développeur.
						</li>
					</ul>
					<div>
						Copier l'identifiant du rôle
					</div>
					<ul>
						<li>
							Rendez-vous dans les paramètres de votre serveur en cliquant sur son nom en haut à gauche,
							puis sur Paramètres du serveur.
						</li>
						<li>
							Dans le menu de gauche, cliquez sur* Rôles*.
						</li>
						<li>
							Faites un clic droit sur le rôle dont vous souhaitez récupérer l'identifiant.
						</li>
						<li>
							Cliquez sur Copier l'identifiant, et complétez le champ "RoleID" sur le site
						</li>
					</ul>
				</div>
			{/snippet}
		</Info>
	{/if}
			
</div>
<!-- P100.svelte --> 

