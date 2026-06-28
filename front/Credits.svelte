<script>
	import { urlCdn, clearStorage } from './common.js'

	let dspAssistance=$state(false)
	let dspCredits=$state(false)
	let dspPrivacy=$state(false)
	function setDspPrivacy(i) {
		dspPrivacy = (dspPrivacy==i)? null: i
	}
</script>
<style>
	
</style>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag -->
<section class="cards-section">
	<hr/>
	<div>
		<div class="card-wide" onclick={() => dspAssistance = !dspAssistance}  role="button" tabindex=0>
			<div class="card-wide-container">
				<div class="card-wide-icon icon-blue">{#if dspAssistance}👇{:else}🆘{/if}</div>
				<div class="card-wide-body">
					<div class="card-wide-title">Assistance technique</div>
					<div class="card-wide-desc">Contacte l'équipe pour tout problème rencontré.</div>
				</div>
				<div class="ti ti-chevron-right card-wide-chevron" aria-hidden="true"></div>
				</div>
			{#if dspAssistance}
				<div class="adminCadre petit">
					<div>Si tu as des "erreurs imprévues" ou un soucis d'accès au site:</div>
					<div>
						👉
						<a class="active" href="https://help.adhoc.click/HELP" target="gpHelp">
							Affichage de la page de diagnostic et assistance du site
						</a>
					</div>
					<hr />
					<div>N'utilise l'options suivante qu'en cas de soucis et après avoir contacté Kikiadoc sur discord</div>
					<div>
						👉
						<a style="cursor: pointer; color: orange"  href="./menage.html" target="_self">
							Faire le ménage (caches etc...) du site et uniquement du site.
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div>
		<div class="card-wide" onclick={() => dspCredits = !dspCredits}  role="button" tabindex=0>
			<div class="card-wide-container">
				<div class="card-wide-icon icon-blue">{#if dspCredits}👇{:else}👋{/if}</div>
				<div class="card-wide-body">
					<div class="card-wide-title">Crédits</div>
				</div>
				<div class="ti ti-chevron-right card-wide-chevron" aria-hidden="true"></div>
			</div>
			{#if dspCredits}
				<div class="adminCadre petit" style="font-style: italic">
					<div>Ce site est développé à titre personnel par Kikiadoc Lepetiot @Moogle.</div>
					<div>
						Certaines fonctions sont le fruit de la collaboration avec
						l'équipe du Discord FFIVX - France, en particulier Eleana Kirisane @Spriggan.
					</div>
					<div>
						<a class="active" href={urlCdn+'Architecture et conception du site ff14.adhoc.click.pdf'} target="gpHelp">
							Le code du site	et sa documentation technique
						</a>
						sont publiques, copiables et libres de droits.
						Licenses:
						<a class="active" href="https://fr.wikipedia.org/wiki/Licence_publique_g%C3%A9n%C3%A9rale_GNU" target="gpHelp">GPL</a>
						et
						<a class="active" href="https://fr.wikipedia.org/wiki/Licence_CC0" target="gpHelp">CC0</a>
					</div>
					<div>Ce site utilise différentes ressources lors de l'éxécution ou pendant la phase de développement:</div>
					<div>
						➥Le rendu HTML utilise
						<a href="https://svelte.dev/" target="gpHelp">Svelte</a>
						(<a href="https://en.wikipedia.org/wiki/MIT_License" target="gpHelp">MIT</a>)
						et en phase "Build"
						<a href="https://vite.dev/" target="gpHelp">Vite</a>
						(<a href="https://en.wikipedia.org/wiki/MIT_License" target="gpHelp">MIT</a>)
					</div>
					<div>
						➥Le rendu des scènes 3D utilise
						<a href="https://fr.wikipedia.org/wiki/Babylon.js" target="gpHelp">BabylonJS</a>
						(<a href="https://www.apache.org/licenses/LICENSE-2.0" target="gpHelp">Apache2.0</a>)
					</div>
					<div>➥Des samples de musiques et vidéos remixées depuis différentes sources publiques dont
						<a class="active" href="https://youtube.com/" target="gpHelp">Youtube</a>
					</div>
					<div>➥Des images de musées, bibliothèques et autres institutions. A titre d'exemple:
						<a class="active" href="https://collections.musee-rodin.fr/" target="gpHelp">le Musée Rodin</a>
						<a class="active" href="https://www.bnf.fr/fr" target="gpHelp">La Bibliothèque Nationale de France</a>
					</div>
					<div>➥Des polices de caractères téléchargeables <a class="active" href="https://fonts.google.com/" target="gpHelp">Google Fonts</a></div>
					<div>➥Des fragments de code refactorés depuis
						<a class="active" href="https://github.com/" target="gpHelp">Github</a>
						ou
						<a class="active" href="https://stackoverflow.com/" target="gpHelp">Stackoverflow</a>
					</div>
					<div>
						➥Les modèles 3D sont conçus avec
						<a href="https://fr.wikipedia.org/wiki/Blender" target="gpHelp">Blender</a>
						(<a href="https://www.gnu.org/licenses/gpl-3.0.html" target="gpHelp">GNU-3</a>).
					</div>
					<div>
						➥Les modèles 3D sont souvent basés sur des oeuvres
						(<a href="https://creativecommons.org/licenses/by/4.0/deed.fr" target="gpHelp">CC4</a>)
						disponibles dans la communaute
						<a href="https://fr.wikipedia.org/wiki/Blender" target="gpHelp">Blender</a>
						et
						<a href="https://sketchfab.com/" target="gpHelp">sketchfab</a>, par exemple:
						<a href="https://skfb.ly/ozWSJ" target="gpHelp">Stargate lik-ish Ring Portal by Kim.David.Hauser</a>
					</div>
					<div>
						➥Divers modèles, textures et objets sont importés depuis la 
						<a href="https://doc.babylonjs.com/toolsAndResources/assetLibraries/" target="gpHelp">
							bibliothèque d’assets de BabylonJS
						</a>
					</div>
					<div>
						➥Des informations sont récupérées dynamiquement en utilisant uniquement l'identité du serveur depuis
						<a class="active" href="https://fr.finalfantasyxiv.com/lodestone/playguide/db" target="gpHelp">le Lodestone FF14</a>,
						<a class="active" href="https://discord.com/" target="gpHelp">Discord</a>,
						et
						<a class="active" href="https://www.garlandtools.org" target="gpHelp">Garland</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<section class="privacy-section">
	<div class="privacy-title">Vie privée préservée</div>
	<div class="privacy-pills">
		<span class="pill pill-t" role="button" onclick={()=>setDspPrivacy(1)}>Pas de traçage</span>
		<span class="pill pill-t" role="button" onclick={()=>setDspPrivacy(2)}>Aucun cookie</span>
		<span class="pill pill-t" role="button" onclick={()=>setDspPrivacy(3)}>Sans publicité</span>
		<span class="pill pill-t" role="button" onclick={()=>setDspPrivacy(4)}>RGPD: 100%</span>
	</div>
	{#if dspPrivacy==1}
		<div class="adminCadre petit">
			Sur ce site, aucun mécanisme de traçage n'est mis en oeuvre.
			<br/>
			Les informations stockées sur le serveur sont uniquement les informations
			strictement nécessaires à ta cybersécurité, celle du site
			et à ta participation aux jeux et challenges.
		</div>
	{:else if dspPrivacy==2}
		<div class="adminCadre petit">
			Sur ce site, aucun cookie, aucun cookie tiers,
			aucun lien entre ton navigateur et un autre site dévoreur d'information.
			<br/>
			C'est pourquoi il n'est pas nécessaire de te demander un consentement.
		</div>
	{:else if dspPrivacy==3}
		<div class="adminCadre petit">
			Sur ce site, tu ne verras aucune publicité.
			<br/>
			De nombreux sites sont financés par la publicité
			et souvent de façon peu respectueuse de ta vie privée.
			<br/>
			Ce site est financé par Kikiadoc Lepetiot @ Moogle sur ses propres deniers.
		</div>
	{:else if dspPrivacy==4}
		<div class="adminCadre petit">
			<a href="https://fr.wikipedia.org/wiki/R%C3%A8glement_g%C3%A9n%C3%A9ral_sur_la_protection_des_donn%C3%A9es" target="gpHelp">
				Le RGPD est le Règlement Général sur la Protection des Données.
			</a>
			<br/>
			Ce site respecte toutes les recommandations et obligations du RGPD (à date de Mars 2026).
			<br/>
			Afin de protéger ta vie privée du 
			<a href="https://fr.wikipedia.org/wiki/CLOUD_Act" target="gpHelp">
				Cloud Act des USA
			</a>,
			ce site stocke l'intégralite des données sensibles sur ton navigateur
			et ces données restent inconnues du serveur.
			<br/>
			A ce jour, seul ton genre peut être considéré comme sensible.
			Il est stocké et reste dans ton navigateur.
			<br/>
			Bien que sécurisé et, si besoin, avec
			<a href="https://fr.wikipedia.org/wiki/Authentification_forte" target="gpHelp">
				authentication forte
			</a>,
			le site ne te demande aucune information personnelle
			(mail, numéro de téléphone, etc ...).
			<br/>
			Les informations de facteurs multiples "MFA" sont
			ta présence sur le Lodestone de FF14 et ton identification sur Discord.
			<br/>
			Ces informations sont stockées sur le server sous la fome de tes identifiants techniques Discord
			et ton "FF14ID", identifiant technique de ton personnage dans le jeu FF14.
			<br/>
			L'ensemble de tes identifiants techniques sont supprimés dès que tu quittes
			le Discord de la Grande Peluche	ou sur simple demande.
		</div>
	{/if}
	<div class="privacy-title">Sécurité renforcée</div>
	<div class="privacy-pills">
		<span class="pill pill-t" role="button" onclick={()=>setDspPrivacy(11)}>TLS 1.3 post-quantique</span>
		<span class="pill pill-t" role="button" onclick={()=>setDspPrivacy(12)}>PassKeys / WebAuthn</span>
		<span class="pill pill-t" role="button" onclick={()=>setDspPrivacy(13)}>ISO27002 / NIS2 / DORA / ReCyF</span>
	</div>
	{#if dspPrivacy==11}
		<div class="adminCadre petit">
			Pour ta 
			<a href="https://fr.wikipedia.org/wiki/R%C3%A9colter_maintenant,_d%C3%A9chiffrer_plus_tard" target="gpHelp">
				cybersécurité actuelle et future
			</a>, 
			le serveur impose une communication cryptée de dernière génération (TLS 1.3 et
			échange de clefs en post-quantique)
			tel que précaunisé par
			<a href="https://messervices.cyber.gouv.fr/documents-guides/transition_post_quantique_tls_1_3.pdf" target="gpHelp">
				divers organismes internationaux et agences
			</a>.
			<br/>
			Ton navigateur doit être "à jour" et <u>implémenter certaines fonctions récentes (Mars 2026)</u>.
		</div>
	{:else if dspPrivacy==12}
		<div class="adminCadre petit">
			Pour assurer, si besoin, ton
			<a href="https://fr.wikipedia.org/wiki/Authentification_forte" target="gpHelp">
				authentification forte
			</a>,
			le site utilise des "PassKeys", vulgarisation de la technique
			<a href="https://developer.mozilla.org/fr/docs/Web/API/Web_Authentication_API" target="gpHelp">
				Webauthn
			</a>.
			<br/>
			Cela implique l'usage de biométrie, code pin ou autre moyen d'authenfication forte.
			<br/>
			Ainsi, tu n'as pas besoin de mot de passe (tu ne peux donc en réutiliser un)
			et t'interdit d'utiliser tes identifiants
			Google, Discord, FesseLivre, FakeX, Instagrimé, TikToqué ou autres...
		</div>
	{:else if dspPrivacy==13}
		<div class="adminCadre petit">
			Ce site est personnel et développé à titre privé par Kikiadoc Lepetiot @moogle.
			<br/>
			Il n'est donc pas assujetti à de multiples règlements relatifs
			aux entités importantes, essentielles, bancaires, financières ou stratégiques.
			<br/>
			Toutefois et bien que ce ne soit pas une obligation,
			ce site met en oeuvre, autant que faire se peut,
			les recommandations techniques
			ISO27002 (Norme internationale de sécurité de l'information, 2022),
			NIS2 (Directive Européenne Network and Information Security, 2022),
			DORA (Directive Européenne Digital Operational Resilience Act - Résilience du secteur financier, 2025)
			et
			ReCyF (Référentiel Cyber France, mars 2026)
		</div>
	{/if}
</section>
<!-- svelte-ignore element_invalid_self_closing_tag -->
<section class="privacy-section-legacy">
	<hr/>
	<div style="font-size: 0.7em; font-style: italic;">
		Sur ce site, ta vie privée est préservée au maximum:
		aucun cookie basique ou tiers, pas de publicite,
		pas de traçage, aucun envoi de données à des tiers,
		aucune information sensible (mail, numéro de téléphone...).
		<div class="br"/>
		Le stockage des informations nécessaires privilégie le stockage local sur ton appareil, 
		le serveur ne conserve que les infos strictement liées aux challenges et activités
		que tu sollicites volontairement mais aussi, évidemment,
		les informations nécessaires à ta cybersécurité et celle du site.
		<div class="br"/>
		Pour ta 
		<a href="https://fr.wikipedia.org/wiki/R%C3%A9colter_maintenant,_d%C3%A9chiffrer_plus_tard" target="gpHelp">
			cybersécurité actuelle et future
		</a>, 
		le serveur impose une communication cryptée de dernière génération (TLS 1.3 et
		échange de clefs en post-quantique)
		tel que précaunisé par
		<a href="https://messervices.cyber.gouv.fr/documents-guides/transition_post_quantique_tls_1_3.pdf" target="gpHelp">
		divers organismes internationaux et agences
		</a>. Ton navigateur doit être "à jour" et <u>implémenter certaines fonctions récentes (Mars 2026)</u>.
		<div class="br"/>
		Pour assurer ton authentification, le site utilise des "PassKeys", vulgarisation de la technique
		<a href="https://developer.mozilla.org/fr/docs/Web/API/Web_Authentication_API" target="gpHelp">
			Webauthn
		</a>.
		Cela implique l'usage de biométrie, code pin ou autre moyen d'authenfication forte.
		Ainsi, tu n'as pas besoin de mot de passe (tu ne peux donc en réutiliser un)
		et t'interdit d'utiliser tes identifiants Google, Discord, FesseLivre, FakeX, Instagrimé, TikToqué ou autres...
		<div class="br"/>
		<!--
		Ce site respecte, hors contraintes organisationnelles,
		100% des recommandations de 
		<a href="https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on" target="gpHelp">
			la CNIL et du RGPD
		</a>,
		et s'inspire, autant que faire se peut et dans les limites d'un site personnel,
		des bonnes pratiques de 
		<a href="https://fr.wikipedia.org/wiki/ISO/CEI_27002" target="gpHelp">
			l'ISO/CEI 27002
		</a>, des 
		<a href="https://messervices.cyber.gouv.fr/nis2#:~:text=Qu'est%2Dce%20que%20NIS,pays%20membres%20de%20l'UE." target="gpHelp" >
			normes NIS2 (entitées importantes ou essentielles)
		</a>
		et
		<a href="https://fr.wikipedia.org/wiki/Digital_Operational_Resilience_Act" target="gpHelp">
			DORA (services financiers)
		</a>
		<div class="br"/>
		-->
		Ce site est développé par Kikiadoc Lepetiot @Moogle à titre privé. Si besoin, MP sur Discord.
	</div>
</section>
