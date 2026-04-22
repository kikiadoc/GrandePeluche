<script>
	import { urlCdn, clearStorage } from './common.js'

	let dspAssistance=$state(false)
	let dspCredits=$state(false)
</script>
<style>
	
</style>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	<hr/>
	<div style="cursor: pointer; color:lightgreen" onclick={() => dspAssistance = !dspAssistance} role="button" tabindex=0>
		👉 Assistance technique	{#if dspAssistance}⏫{:else}⏬{/if}
	</div>
	{#if dspAssistance}
		<div class="adminCadre">
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
					Faire le ménage (caches etc...) de ff14.adhoc.click
				</a>
			</div>
		</div>
	{/if}
	<div style="cursor: pointer; color:lightgreen" onclick={() => dspCredits = !dspCredits} role="button" tabindex=0>
		👉 Crédits {#if dspCredits}⏫{:else}⏬{/if}
	</div>
	{#if dspCredits}
		<div class="adminCadre" style="font-size: 0.7em; font-style: italic;">
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
			<div>➥Des samples de musiques et vidéos remixées depuis différentes sources Internet dont
				<a class="active" href="https://youtube.com/" target="gpHelp">Youtube</a>
			</div>
			<div>➥Des images de musées, bibliothèques et autres institutions. A titre d'exemple:
				<br/>
				<a class="active" href="https://collections.musee-rodin.fr/" target="gpHelp">le Musée Rodin</a>
				<br/>
				<a class="active" href="https://www.bnf.fr/fr" target="gpHelp">La Bibliothèque Nationale de France</a>
			</div>
			<div>➥Des polices de caractères téléchargeables <a class="active" href="https://fonts.google.com/" target="gpHelp">Google Fonts</a></div>
			<div>➥Des fragments de code refactorés depuis
				<a class="active" href="https://github.com/" target="gpHelp">Github</a>
				ou
				<a class="active" href="https://stackoverflow.com/" target="gpHelp">Stackoverflow</a>
			</div>
			<div>➥Mention spéciale à Dale Harvey:
				<a class="active" href="https://github.com/daleharvey/pacman" target="gpHelp">https://github.com/daleharvey/pacman</a>.
			</div>
			<div>
				Le rendu des scènes 3D utilise
				<a href="https://fr.wikipedia.org/wiki/Babylon.js" target="gpHelp">BabylonJS</a>
				(<a href="https://www.apache.org/licenses/LICENSE-2.0" target="gpHelp">Apache2.0</a>)
				et
				les modèles 3D sont conçus avec
				<a href="https://fr.wikipedia.org/wiki/Blender" target="gpHelp">Blender</a>
				(<a href="https://www.gnu.org/licenses/gpl-3.0.html" target="gpHelp">GNU-3</a>).
			</div>
			<div>
				Les modèles 3D sont souvent basés sur des oeuvres
				(<a href="https://creativecommons.org/licenses/by/4.0/deed.fr" target="gpHelp">CC4</a>)
				disponibles dans la communaute
				<a href="https://fr.wikipedia.org/wiki/Blender" target="gpHelp">Blender</a>
				et
				<a href="https://sketchfab.com/" target="gpHelp">sketchfab</a>, par exemple:
				<br/>
				➥<a href="https://skfb.ly/p8Qzx" target="gpHelp">Full Gameready City Buildings by Abhayexe</a>
				<br/>
				➥<a href="https://skfb.ly/ozWSJ" target="gpHelp">Stargate lik-ish Ring Portal by Kim.David.Hauser</a>
			</div>
			<div>
				Divers modèles, textures et objets sont importés depuis la 
				<a href="https://doc.babylonjs.com/toolsAndResources/assetLibraries/" target="gpHelp">
					bibliothèque d’assets de BabylonJS
				</a>
			</div>
			<div>
				Des informations sont récupérées dynamiquement et anonymement depuis les sites
				<a class="active" href="https://fr.finalfantasyxiv.com/lodestone/playguide/db" target="gpHelp">Lodestone FF14</a>,
				<a class="active" href="https://www.garlandtools.org" target="gpHelp">Garland</a>
				<a class="active" href="https://ipinfo.io" target="gpHelp">ipinfo.io</a>
				et
				<a class="active" href="https://www.ipify.org" target="gpHelp">ipify.org</a>
			</div>
		</div>
	{/if}
	<div style="font-size: 0.7em; font-style: italic;">
		Sur ce site, ta vie privée est préservée au maximum:
		aucune affiliation à d'autres sites, aucun cookie tiers, pas de lien avec d'autres sites,
		pas de publicite, pas de traçage,
		pas d'information style mail ou numéro de téléphone.
		<div class="br"></div>
		Le stockage des informations nécessaires privilégie le stockage local sur ton appareil, 
		le serveur ne conserve que ton pseudo IG, deux clés publiques spécifiques au site pour ta sécurité
		et les infos strictement liées aux challenges.
		<div class="br"></div>
		Pour assurer ta sécurité, tout en restant simple d'usage, tes transactions sont protégées
		contre l'usurpation d'identité par des clefs éphémères basées sur une clef racine.
		Cette clef racine est validée par une clef enfouie dans le coffre cryptographique de ton équipement.
		<br/>
		Ainsi, tu n'as pas besoin de mot de passe (tu ne peux donc en réutiliser un)
		et t'interdit d'utiliser tes identifiants Google, Discord, FesseLivre, FakeX, TikToqué ou autres...
	</div>
</div>

