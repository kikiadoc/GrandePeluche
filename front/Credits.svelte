<script>
	import { isDiscord, urlCdn } from "./ground.svelte.js"

	import { clearStorage } from './common.js'
	import { GBLCONST } from './ground.svelte.js'

	let dspItem=$state(false)
	function setDspItem(i) {
		dspItem = (dspItem==i)? null: i
	}
</script>
<style>
	.cadreFlottantContainer {
		position: relative;
		margin: 0 1em 0 1em;
	}
	.cadreFlottant {
		position: absolute;
		color:white;
		overflow: auto;
		background-color: black;
		padding: 0.5em;
		/* max-height: 20em; */
		border: 0.3em dotted red;
		font-style: italic;
	}
</style>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<section class="cards-section">
	<hr/>
</section>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div>
	<section class="privacy-section">
		<div class="privacy-title">Informations générales</div>
		<div class="privacy-pills">
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(31)}>Crédits</span>
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(32)}>Contacts</span>
		</div>
		{#if dspItem==31}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					<div>
						Ce site est un fan-site du jeu FF14 Online développé par
						Kikiadoc Lepetiot @Moogle à titre personnel
					</div>
					<div>
						<span class="gpLink" gpLink={urlCdn+'Architecture et conception du site ff14.adhoc.click.pdf'}>
							Le code du site	et sa documentation technique
						</span>
						sont publiques, copiables et libres de droits.
						Licenses:
						<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/Licence_publique_g%C3%A9n%C3%A9rale_GNU" target="gpHelp">
							GPL
						</span>
						et
						<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/Licence_CC0">CC0</span>
					</div>
					<div>Ce site utilise différentes ressources lors de l'éxécution ou pendant la phase de développement:</div>
					<div>
						➥Le rendu HTML utilise
						<span class="gpLink" gpLink="https://svelte.dev/" target="gpHelp">Svelte</span>
						(<span class="gpLink" gpLink="https://en.wikipedia.org/wiki/MIT_License">MIT</span>)
						et en phase "Build"
						<span class="gpLink" gpLink="https://vite.dev/" target="gpHelp">Vite</span>
						(<span class="gpLink" gpLink="https://en.wikipedia.org/wiki/MIT_License">MIT</span>)
					</div>
					<div>
						➥Le rendu des scènes 3D utilise
						<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/Babylon.js">BabylonJS</span>
						(<span class="gpLink" gpLink="https://www.apache.org/licenses/LICENSE-2.0">Apache2.0</span>)
					</div>
					<div>➥Des musiques remixées avec talent...
						<span class="gpLink" gpLink="https://www.youtube.com/watch?v=cZQbVRJQD3Q">DJ Genesis</span>
					</div>
					<div>➥Des samples de musiques et vidéos remixées depuis différentes sources publiques dont
						<span class="gpLink" gpLink="https://youtube.com/">SQUARE ENIX CO., LTD. All Rights Reserved</span>
						<span class="gpLink" gpLink="https://youtube.com/">Youtube</span>
					</div>
					<div>➥Des images de musées, bibliothèques et autres sites. A titre d'exemple:
						<span class="gpLink" gpLink="https://collections.musee-rodin.fr/">le Musée Rodin</span>
						<span class="gpLink" gpLink="https://www.bnf.fr/fr">La Bibliothèque Nationale de France</span>
						<span class="gpLink" gpLink="https://pngtree.com/fr">pngtree.com</span>
						<span class="gpLink" gpLink="https://www.gifsgratuits.fr">gifsgratuits.fr/</span>
					</div>
					<div>➥Des polices de caractères téléchargeables
						<span class="gpLink" gpLink="https://fonts.google.com/">Google Fonts</span></div>
					<div>➥Des fragments de code refactorés depuis
						<span class="gpLink" gpLink="https://github.com/">Github</span>
						ou
						<span class="gpLink" gpLink="https://stackoverflow.com/">Stackoverflow</span>
					</div>
					<div>
						➥Les modèles 3D sont conçus avec
						<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/Blender">Blender</span>
						(<span class="gpLink" gpLink="https://www.gnu.org/licenses/gpl-3.0.html">GNU-3</span>).
					</div>
					<div>
						➥Les modèles 3D sont souvent basés sur des oeuvres
						(<span class="gpLink" gpLink="https://creativecommons.org/licenses/by/4.0/deed.fr">CC4</span>)
						disponibles dans la communaute
						<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/Blender">Blender</span>
						et
						<span class="gpLink" gpLink="https://sketchfab.com/">sketchfab</span>, par exemple:
						<span class="gpLink" gpLink="https://skfb.ly/ozWSJ">Stargate lik-ish Ring Portal by Kim.David.Hauser</span>
					</div>
					<div>
						➥Divers modèles, textures et objets sont importés depuis la 
						<span class="gpLink" gpLink="https://doc.babylonjs.com/toolsAndResources/assetLibraries/">
							bibliothèque d’assets de BabylonJS
						</span>
					</div>
					<div>
						➥Des informations sont récupérées dynamiquement en utilisant uniquement l'identité du serveur depuis
						<span class="gpLink" gpLink="https://fr.finalfantasyxiv.com/lodestone/playguide/db">le Lodestone FF14</span>,
						<span class="gpLink" gpLink="https://discord.com/">Discord</span>,
						et
						<span class="gpLink" gpLink="https://www.garlandtools.org">Garland</span>
					</div>
					<div>
						➥Enfin ton équipement, en utilisant ce site, peut récupérer dynamiquement des informations depuis des sites publics tels que
						<span class="gpLink" gpLink="https://fr.finalfantasyxiv.com/lodestone/playguide/db">le Lodestone FF14</span>,
						<span class="gpLink" gpLink="https://discord.com/">Discord</span>,
						<span class="gpLink" gpLink="https://xivapi.com/">XIVAPI</span>,
						<span class="gpLink" gpLink="https://ffxivteamcraft.com/">Teamcraft</span>,
						<span class="gpLink" gpLink="https://universalis.app/">Universalis</span>,
						<span class="gpLink" gpLink="https://www.garlandtools.org">Garland</span>.
					</div>
				</div>
			</div>
		{/if}
		{#if dspItem==32}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					<div>
						Ce site est un fan-site du jeu FF14 Online développé par
						Kikiadoc Lepetiot @Moogle à titre personnel
					</div>
					<div>
						Contacts:
						{#each GBLCONST.CONTACTS as c}
							<div class="gpLink" gpLink={c.url}>🔹 {c.nom}</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
		<div class="privacy-title">Vie privée préservée</div>
		<div class="privacy-pills">
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(1)}>Pas de traçage</span>
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(2)}>Aucun cookie</span>
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(3)}>Sans publicité</span>
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(4)}>RGPD: 100%</span>
		</div>
		{#if dspItem==1}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					Sur ce site, aucun mécanisme de traçage n'est mis en oeuvre.
					<br/>
					Les informations stockées sur le serveur sont uniquement les informations
					strictement nécessaires à ta cybersécurité, celle du site
					et à ta participation aux jeux et challenges.
				</div>
			</div>
		{:else if dspItem==2}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					Sur ce site, aucun cookie, aucun cookie tiers,
					aucun lien entre ton navigateur et un autre site dévoreur d'information.
					<br/>
					C'est pourquoi il n'est pas nécessaire de te demander un consentement.
					{#if isDiscord}
						<br/>
						<span class="cOrange">
							Il faut noter toutefois que la technique d'embedded Discord
							impose l'utilisation de cookies techniques de
							<span class="gpLink" gpLink="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/">
								CloudFlare
							</span>
						</span>
					{/if}
				</div>
			</div>
		{:else if dspItem==3}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					Sur ce site, tu ne verras aucune publicité.
					<br/>
					De nombreux sites sont financés par la publicité
					et souvent de façon peu respectueuse de ta vie privée.
					<br/>
					Ce site, purement ludique et altruiste, est financé par Kikiadoc Lepetiot @ Moogle sur ses propres deniers.
				</div>
			</div>
		{:else if dspItem==4}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/R%C3%A8glement_g%C3%A9n%C3%A9ral_sur_la_protection_des_donn%C3%A9es">
						Le RGPD est le Règlement Général sur la Protection des Données.
					</span>
					<br/>
					Ce site respecte toutes les recommandations et obligations du RGPD (à date de Mars 2026).
					<br/>
					Afin de protéger ta vie privée du 
					<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/CLOUD_Act">
						Cloud Act des USA
					</span>,
					ce site stocke tes données sensibles sur ton équipement
					et ces données restent inconnues de tout intermédiaire technique et même du serveur.
					<br/>
					A ce jour, seul ton genre peut être considéré comme sensible.
					Il est stocké et reste dans ton navigateur.
					<br/>
					Le site de la Grande Peluche est accessible de deux façons:
					<br/>
					🔸Via une "activité" Discord (sécurité oAuth)
					<br/>
					🔸Directement depuis un navigateur (sécurité webAuthn)
					<br/>
					Discord	impose l'usage de
					<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/Cloudflare" >
					CloudFlare
					</span>
					qui décrypte/crypte systématiquement tes données, images, videos et est soumis au
					<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/CLOUD_Act">
						Cloud Act des USA
					</span>.
					<br/>
					L'accès direct au site depuis un navigateur et
					<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/Authentification_forte" >
						authentication forte (biométrie etc...)
					</span>
					n'impose aucun intermédiaire technique de cette nature et n'autorise
					la connexion que depuis un de tes équipements personnels.
					<br/>
					Dans tous les cas, le site ne te demande aucune information personnelle
					(mail, numéro de téléphone, etc ...).
					<br/>
					Ton DiscordID (identifiant techniques de Discord), ton FF14ID (identifiant technique de FF14),
					le RawID webAuthn (association entre le site et ton équipement personnel)
					et ton nom/prenom/monde de ton personnage sur FF14 sont les seules informations personnelles
					stockées sur le serveur. Elles peuvent être supprimées sur simple demande.
				</div>
			</div>
		{/if}
		<div class="privacy-title">Sécurité renforcée</div>
		<div class="privacy-pills">
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(11)}>TLS 1.3 post-quantique</span>
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(12)}>OAuth 2, PassKeys WebAuthn</span>
			<span class="pill pill-t" role="button" onclick={()=>setDspItem(13)}>ISO27002, NIS2, ReCyF...</span>
		</div>
		{#if dspItem==11}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					Pour ta 
					<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/R%C3%A9colter_maintenant,_d%C3%A9chiffrer_plus_tard">
						cybersécurité actuelle et future
					</span>, 
					le serveur impose une communication cryptée de dernière génération (TLS 1.3 et
					échange de clefs en post-quantique)
					tel que précaunisé par
					<span class="gpLink" gpLink="https://messervices.cyber.gouv.fr/documents-guides/transition_post_quantique_tls_1_3.pdf">
						divers organismes internationaux et agences
					</span>.
					<br/>
					Ton navigateur doit être "à jour" et <u>implémenter certaines fonctions récentes (Mars 2026)</u>.
				</div>
			</div>
		{:else if dspItem==12}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					En cas d'accès via Discord, le site utilise les services
					<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/OAuth">
						OAuth 2
					</span>
					de Discord
					<br/>
					En cas d'accès via
					<span class="gpLink" gpLink="https://fr.wikipedia.org/wiki/Authentification_forte">
						authentification forte
					</span> (obligatoire pour les "superadmins"),
					le site utilise
					<span class="gpLink" gpLink="https://developer.mozilla.org/fr/docs/Web/API/Web_Authentication_API">
						Webauthn
					</span>
					vulgarisée sous le nom de "PassKey".
					<br/>
					Ce dernier implique l'usage de biométrie, code pin ou autre moyen d'authenfication forte.
					Seulement un de tes équipments personnels sera autorisé à accéder au site.
					<br/>
					Ainsi, que ce soit via Discord ou en webAuthn,
					tu n'as pas besoin de mot de passe pour accéder au site (tu ne peux donc en réutiliser un)
					et t'interdit d'utiliser directement tes identifiants
					Google, Discord, FesseLivre, FakeX, Instagrimé, TikToqué ou autres...
				</div>
			</div>
		{:else if dspItem==13}
			<div class="cadreFlottantContainer">
				<div class="cadreFlottant petit">
					Ce site met en oeuvre,
					autant que faire se peut et dans les limites organisationnelles d'un site personnel,
					les recommandations techniques
					ISO27002 (Norme internationale de sécurité de l'information, 2022),
					NIS2 (Directive Européenne Network and Information Security, 2022),
					DORA (Directive Européenne Digital Operational Resilience Act - Résilience du secteur financier, 2025)
					et
					ReCyF (Référentiel Cyber France, mars 2026)
					<br/>
					Dans sa version "embedded" au sein de Discord, il respecte la
					<span class="gpLink" gpLink="https://support-dev.discord.com/hc/en-us/articles/8562894815383-Discord-Developer-Terms-of-Service">
					politique Discord d'usage
					</span>
				</div>
			</div>
		{/if}
	</section>
</div>
<!-- Credits.svelte -->
