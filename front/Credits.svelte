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
			<div>Si tu as des "errreurs imprévues" ou un soucis d'accès au site:</div>
			<div>
				👉
				<a class="active" href={urlCdn+'securite/index.html'} target="_blank">
					Affichage de la page de diagnostic et assistance du site
				</a>
			</div>
			<hr />
			<div>N'utilise l'option suivante qu'en cas de soucis et après avoir contacté Kikiadoc sur discord</div>
			<div>
				👉 <span style="cursor: pointer; color: red" onclick={clearStorage} role="button" tabindex=0>
				Effacer les données stockées sur ton appareil et liées à ce site: ff14.adhoc.click</span>
			</div>
		</div>
	{/if}
	<div style="cursor: pointer; color:lightgreen" onclick={() => dspCredits = !dspCredits} role="button" tabindex=0>
		👉 Crédits {#if dspCredits}⏫{:else}⏬{/if}
	</div>
	{#if dspCredits}
		<div class="adminCadre" style="font-size: 0.7em; font-style: italic;">
			<div>
				<a class="active" href={urlCdn+'Architecture et conception du site ff14.adhoc.click.pdf'} target="_blank">
					Le code du site	et sa documentation technique
				</a>
				sont publiques, copiables et libres de droits.
				Licenses:
				<a class="active" href="https://fr.wikipedia.org/wiki/Licence_publique_g%C3%A9n%C3%A9rale_GNU" target="_blank">GPL</a>
				et
				<a class="active" href="https://fr.wikipedia.org/wiki/Licence_CC0" target="_blank">CC0</a>
			</div>
			<div>Ce site utilise différentes ressources lors de l'éxécution ou pendant la phase de développement:</div>
			<div>➥Des samples de musiques et vidéos remixées depuis différentes sources Internet dont
				<a class="active" href="https://youtube.com/" target="_blank">Youtube</a>
			</div>
			<div>➥Des images libres de droits. A titre d'exemple:
				<a class="active" href="https://pixabay.com/" target="_blank">Pixabay.com</a>
			</div>
			<div>➥Des images de musées, bibliothèques et autres institutions. A titre d'exemple:
				<br/>
				<a class="active" href="https://collections.musee-rodin.fr/" target="_blank">le Musée Rodin</a>
				<br/>
				<a class="active" href="https://www.bnf.fr/fr" target="_blank">La Bibliothèque Nationale de France</a>
			</div>
			<div>➥Des polices de caractères téléchargeables <a class="active" href="https://fonts.google.com/" target="_blank">Google Fonts</a></div>
			<div>➥Des fragments de code refactorés depuis
				<a class="active" href="https://github.com/" target="_blank">Github</a>
				ou
				<a class="active" href="https://stackoverflow.com/" target="_blank">Stackoverflow</a>
			</div>
			<div>➥Mention spéciale à Dale Harvey:
				<a class="active" href="https://github.com/daleharvey/pacman" target="_blank">https://github.com/daleharvey/pacman</a>.
			</div>
			<div>
				Le rendu des scènes 3D utilise
				<a href="https://fr.wikipedia.org/wiki/Babylon.js" target="_blank">BabylonJS</a>
				(<a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache2.0</a>)
				et
				les modèles 3D sont conçus avec
				<a href="https://fr.wikipedia.org/wiki/Blender" target="_blank">Blender</a>
				(<a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank">GNU-3</a>).
			</div>
			<div>
				Les modèles 3D sont souvent basés sur des oeuvres
				(<a href="https://creativecommons.org/licenses/by/4.0/deed.fr" target="_blank">CC4</a>)
				disponibles dans la communaute.
				<br/>
				➥<a href="https://skfb.ly/p8Qzx" target="_blank">Full Gameready City Buildings by Abhayexe</a>
				<br/>
				➥<a href="https://skfb.ly/6wBYp" target="_blank">Cherry Bomb by Flogo</a>
				<br/>
				➥<a href="https://skfb.ly/oqFNy" target="_blank">Restaurant Black Chalkboard Blackboard 4K by Rodrigo E. Maranzana</a>
				<br/>
				➥<a href="https://skfb.ly/ozWSJ" target="_blank">Stargate lik-ish Ring Portal by Kim.David.Hauser</a>
				<br/>
				➥<a href="https://skfb.ly/6CRHZ" target="_blank">Stargate by Yanez Designs</a>
				<br/>
				➥<a href="https://skfb.ly/oCOZT" target="_blank">Ouroboros The Calm by Tamminen</a>
				<br/>
				➥<a href="https://skfb.ly/oEsp8" target="_blank">Demon Dragon Full Texture by Endlessvoidmc</a>
			</div>
			<div>
				Divers modèles, textures et objets sont importés depuis la 
				<a href="https://doc.babylonjs.com/toolsAndResources/assetLibraries/" target="_blank">
					bibliothèque d’assets de BabylonJS
				</a>
			</div>
			<div>
				Des informations sont récupérées dynamiquement depuis les sites
				<a class="active" href="https://fr.finalfantasyxiv.com/lodestone/playguide/db" target="_blank">Lodestone FF14</a>,
				<a class="active" href="https://www.garlandtools.org" target="_blank">Garland</a>
				<a class="active" href="https://ipinfo.io" target="_blank">ipinfo.io</a>
				et
				<a class="active" href="https://www.ipify.org" target="_blank">ipify.org</a>
			</div>
		</div>
	{/if}
	<div style="font-size: 0.7em; font-style: italic;">
		Sur ce site, ta vie privée est préservée au maximum:
		aucun cookie tiers, pas de lien avec d'autres sites, pas de publicite, pas de traçage. 
		Le stockage des informations nécessaires privilégie le stockage local sur ton appareil, 
		le serveur ne conserve que ton pseudo IG, ta clé publique pour vérifier tes requêtes
		et les infos strictement liées aux challenges, ta sécurité et celle du site.
		<div class="br"></div>
		Pour assurer ta sécurité, tout en restant simple d'usage, tes transactions sont protégées
		contre l'usurpation d'identité par des clés éphémères et signées par
		une clé privée élliptique stockée uniquement sur ton appareil.
		Ces clés sont générées de façon transparente et sans action de ta part, 
		afin que tu ne puisses pas réutiliser 
		un mot de passe utilisé sur un autre site et t'interdire d'utiliser 
		tes identifiants Google, Discord, FesseLivre, FakeX, TikToqué ou autres...
	</div>
</div>

