<script>
	import { onMount, onDestroy  } from 'svelte';
	import { scrollPageToTop, capitalizeFirstLetter, isPseudoValid, // crypoCreateKeyPair,
					 addNotification, apiCall, storeIt, loadIt, removeIt, cryptoNewElliptic,
					 displayInfo, 
					 u8ElipticSign, markClick, countDownInit, disconnectFromServer,
					 b64_b64u, b64u_b64, u8_b64u, b64u_u8, b64u_str, str_b64u, str_u8
				 } from './common.js'
	import { G }  from './privacy.js'
	import { GBLCONST, GBLSTATE } from "./ground.svelte.js"

	import Credits from './Credits.svelte'
	
	let {
		pseudo=$bindable(),
		webAuth=$bindable(),
		CLIENTVERSION
	} = $props()

	const PAGESAISIESLBL="Pauth_saisies"
	let saisies = $state(loadIt(PAGESAISIESLBL,{}))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	onMount(() => {
		disconnectFromServer()
	});

	/////////////////////////////////////////////////////////////////////
	// Gestion du pseudo et creation compte
	/////////////////////////////////////////////////////////////////////
	// précondition lodestone - vérif locale lodestone mais sera vérifiée aussi coté server
	async function checkLodestone(prenom,nom,monde) {<!>
		addNotification("Pré-vérification Lodestone","lightgreen",3)
		// acces lodestone via proxy sur adhoc.click (pour eviter les reponses opaques,sans atttente WS)
		let ret = await apiCall("/lodestone/check/"+prenom+"/"+nom+"/"+monde,"GET",null,true,'-lodestone-')
		// console.log("ret=",ret)
		switch (ret.status) {
			case 200:
				return ret.o.ff14Id
			case 202:
				displayInfo({
					titre:"Tu es inconnu du lodestone",
					body: [
						"Je n'ai pas trouvé "+prenom+" "+nom+"@"+monde+" sur le Lodestone de FF14",
						"Vérifie bien les prénom, nom et monde que tu as indiqués",
					],
					back: "rouge", ding: "explosion",
					trailer: "si cette erreur persiste, contacte Kikiadoc sur discord"
				})
				return null			
			default:
				displayInfo({
					titre:"Erreur d'accès sur le lodestone",
					body: [
						"Je ne peux pas vérifier ton existance sur le lodestone de FF14",
						"car le lodestone ne me répond pas",
						"Ceci est normal si une maintenance du jeu est en cours"
					],
					trailer: "Recommence dans quelques minutes"
				})
				return null
		}
	}
	////////////////////////////////////////////////////////////////////
	// Webauthn Tools
	////////////////////////////////////////////////////////////////////
	async function webAuthVaultCreate(rpId,rpName,userName,challenge) {
		try {
			addNotification("Scellement cryptographique...","lightgreen",3)
			const publicKeyCreate = {
				publicKey: {
				  challenge: str_u8(challenge) ,
				  rp: { id: rpId, name:rpName },
					timeout: 30000,
				  user: {
						id: str_u8(rpId+userName),
				    name: userName,
				    displayName: userName,
				  },
				  pubKeyCredParams: [
						{ type: "public-key", alg: -7   }, // ES256-ECDSA 
						{ type: "public-key", alg: -8   }, // EdDSA 
						{ type: "public-key", alg: -257 }  // RS256
					],
				}
			}
			let publicKeyCredentialCreate = await navigator.credentials.create(publicKeyCreate)
			addNotification("Scellement cryptographique OK","lightgreen",3)
			// console.log("publicKeyCredentialCreate",publicKeyCredentialCreate)
			return {
				id: publicKeyCredentialCreate.id,
				challenge: challenge,
				b64uRawId: u8_b64u(publicKeyCredentialCreate.rawId),
				b64uClientDataJSON: u8_b64u(publicKeyCredentialCreate.response.clientDataJSON),
				b64uPublicKey: u8_b64u(publicKeyCredentialCreate.response.getPublicKey()),
				algorithm: publicKeyCredentialCreate.response.getPublicKeyAlgorithm(),
				transports: publicKeyCredentialCreate.response.getTransports(),
				b64uAuthenticatorData: u8_b64u(publicKeyCredentialCreate.response.getAuthenticatorData())
			}
		}
		catch (e) {
			displayInfo({titre:"Erreur lors de la création de clef privée enfouie",
									 body:[
										 "Je n'ai pas pu créer une clef privée enfouie dans ton coffre cryptographique, clef permettant de sécuriser ta connexion.",
										 "Les causes les plus probables sont:",
										 "* que tu as refusé la création de ta clef privée enfouie",
										 "* que ton équipement ne dispose pas d'un processeur crytographique",
										 "* que ton navigateur n'est pas à jour",
										 {cls: "blinkMsg", txt: "En cas de doute, contacte Kikiadoc"},
										 "Cause technique: "+e.message,
										 "Fonction: webAuthVaultCreate",
										 "rpId: "+ (rpId || "null"),
										 "rpName: "+ (rpName || "null"),
										 "userName: "+ (userName || "null")
									 ],
									 back:"rouge", ding: "explosion",
									 trailer: "Fais un screen et contacte Kikiadoc sur Discord"
									})
			return null
		}
	}
	async function webAuthVaultGet(rpId,b64uRawId,challenge) {
		try {
			addNotification("Signature cryptographique...","lightgreen",3)
			const publicKeyGet = {
				publicKey : {
					allowCredentials: [ { id: b64u_u8(b64uRawId), type: "public-key" }, ],
				  challenge: str_u8(challenge) ,
					rpId: rpId,
					userVerification: "discouraged", // "required",
					timeout: 30000,
				}
			}
			let publicKeyCredentialGet = await navigator.credentials.get(publicKeyGet)
			addNotification("Signature cryptographique OK","lightgreen",3)
			return {
				id: publicKeyCredentialGet.id,
				chalenge: challenge,
				b64uRawId: u8_b64u(publicKeyCredentialGet.rawId),
				b64uClientDataJSON: u8_b64u(publicKeyCredentialGet.response.clientDataJSON),
				b64uAuthenticatorData: u8_b64u(publicKeyCredentialGet.response.authenticatorData),
				b64uVaultSignature: u8_b64u(publicKeyCredentialGet.response.signature),
				b64uUserHandle: u8_b64u(publicKeyCredentialGet.response.userHandle)
			}
		}
		catch(e) {
			displayInfo({titre:"Erreur lors de la signature cryptographique",
									 body:[
										 "Selon la Grande Peluche, tu disposais précédemment d'une clef d'accès dans ton coffre cryptographique, mais je n'ai pas réussi à la réutiliser",
										 "Les causes les plus probables sont:",
										 "* Tu as refusé la signature en annulant l'opération",
										 "* Tu as changé d'équipement",
										 "* Tu as supprimé ta clef d'accès de ton coffre cryptographique",
										 "* Ton équipement ne dispose pas des fonctions nécessaires",
										 {cls: "blinkMsg", txt: "En cas de doute, contacte Kikiadoc"},
										 "Cause technique: "+e.message,
										 "Fonction: webAuthVaultGet",
										 "rpId: "+ (rpId || "null"),
										 "b64uRawId: "+ (b64uRawId || "null") 
									 ],
									 back:"rouge", ding: "explosion",
									 trailer: "Contacte Kikiadoc sur Discord"
									})
			return null
		}
	}
	////////////////////////////////////////////////////////////////////
	// Webauthn UPGRADE avec la veille eliptic
	////////////////////////////////////////////////////////////////////
	async function webAuthUpgrade(webAuth,oldEs,newEs,ff14Id) {
		// addNotification("Upgrade sécurité vers webauthn","lightgreen",3)
		let create = await webAuthVaultCreate(webAuth.rpId,webAuth.rpName,
																		webAuth.prenom+' '+webAuth.nom+' @'+webAuth.monde,
																		webAuth.ephemere)
		if (!create) return
		webAuth.toServerUpgrade = {
			id: create.id,
			// challenge: "challenge",
			ff14Id: ff14Id,
			b64uSignature: u8_b64u(await u8ElipticSign(webAuth.ephemere,oldEs)),
			b64uRawId: create.b64uRawId,
			b64uClientDataJSON: create.b64uClientDataJSON,
			b64uVaultPublicKey: create.b64uPublicKey,
			algorithm: create.algorithm,
			transports: create.transports,
			b64uAuthenticatorData: create.b64uAuthenticatorData,
			newJwkPublicKey: newEs.jwkPublicKey,
			oldJwkPublicKey: oldEs.jwkPublicKey,
			prenom: webAuth.prenom,
			nom: webAuth.nom,
			monde: webAuth.monde,
			clientDth: Date.now()
		}
		addNotification("Demande d'upgrade sécurité au serveur","lightgreen",3)
		let ret = await apiCall("/pseudos/upgrade","PUT", webAuth.toServerUpgrade, true)
		if (ret?.status!=200) { 
			displayInfo({titre: "Erreur de migration vers webAuthn", back:"rouge", ding:"explosion",
									 body:["La Grande Peluche ne te fais pas confiance",
												 "Le coffre de sécurité de ton équipement, ton lodestone et discord doivent être totalement cohérents",
												 ret.msg
												],
									 trailer: "Relance une fois, et si toujours en erreur, contacte Kikiadoc" 
									})
			return
		}
		// Migration OK 
		addNotification("Migration acceptée par le serveur","lightgreen",3)
		storeIt("elipticSecurity",newEs)
		pseudo = webAuth.pseudo
		displayInfo({titre: "La capacité cryptographique de ton équipement a été validée.",
								 back:"stars", ding:"call-to-attention",
								 body: ["Ton coffre cryptographique doit maintenant signer un message afin de confirmer la validité de ton pseudo",
												{cls:"blinkMsg",txt: "Valide à nouveau ton nom/prénom/monde"},
											 ],
								 autoClose: 30,
								 trailer: "Ferme ce popup"
								})
		webAuth.etat="reload" // force recalc
	}
	////////////////////////////////////////////////////////////////////
	// Webauthn RENEW 
	////////////////////////////////////////////////////////////////////
	async function webAuthRenew(webAuth,oldEs,newEs,ff14Id) {
		if (!ff14Id || !newEs) return // oldEs non necessaire car signature du vault
		// le challenge est le challenge serveur
		let challenge = webAuth.ephemere
		// Tente un get car normalement les éléments sont connus,
		let get = await webAuthVaultGet(webAuth.rpId,webAuth.b64uRawId,challenge)
		if (!get) return
		let u8ElipticSignature = await u8ElipticSign(challenge,newEs)
		if (!u8ElipticSignature) return
		// Envoi la signature, la nouvelle clef publique au serveur
		webAuth.toServerRenew = {
			b64uVaultSignature: get.b64uVaultSignature,
			b64uElipticSignature: u8_b64u(u8ElipticSignature),
			b64uRawId: get.b64uRawId,
			b64uClientDataJSON: get.b64uClientDataJSON,
			b64uAuthenticatorData: get.b64uAuthenticatorData,
			jwkPublicKey: newEs.jwkPublicKey,
			ff14Id: ff14Id,
			prenom: webAuth.prenom,
			nom: webAuth.nom,
			monde: webAuth.monde,
			clientDth: Date.now()
		}
		addNotification("Demande de renew sécurité au serveur","lightgreen",3)
		let ret = await apiCall("/pseudos/renew","PUT", webAuth.toServerRenew,true,'-renew-')
		if (ret?.status!=200) { 
			displayInfo({titre: "Erreur de renew de ta chaine de sécurité", back:"rouge", ding:"explosion",
									 body:["La Grande Peluche ne te fais pas confiance",
												 "Le coffre cryptographique de ton équipement, ton lodestone et discord doivent être totalement cohérents",
												 ret.msg
												],
									 trailer: "Relance une fois, et si toujours en erreur, contacte Kikiadoc" 
									})
			return
		}
		addNotification("Renouvellement de ta clef de sécurité OK","lightgreen",3) 
		storeIt("elipticSecurity",newEs)
		pseudo=webAuth.pseudo
		webAuth.etat="reload" // force recalc 
	}
	////////////////////////////////////////////////////////////////////
	// Webauthn NEW
	////////////////////////////////////////////////////////////////////
	async function webAuthNew(webAuth,oldEs,newEs,ff14Id,prenom,nom,monde) {
		if (!ff14Id || !newEs) return // oldEs non necessaire car signature du vault
		// le challenge est le challenge serveur
		let create = await webAuthVaultCreate(webAuth.rpId,webAuth.rpName,
																		prenom+' '+nom+' @'+monde,
																		webAuth.ephemere)
		if (!create) return
		webAuth.toServerCreate = {
			ff14Id: ff14Id,
			b64uRawId: create.b64uRawId,
			b64uClientDataJSON: create.b64uClientDataJSON,
			b64uVaultPublicKey: create.b64uPublicKey,
			b64uAuthenticatorData: create.b64uAuthenticatorData,
			newJwkPublicKey: newEs.jwkPublicKey,
			challengeUsed: webAuth.ephemere,
			vaultAlgorithm: create.algorithm,
			vaultTransports: create.transports,
			prenom: prenom,
			nom: nom,
			monde: monde,
		}
		let ret = await apiCall("/pseudos/new","PUT", webAuth.toServerCreate,true,'-register-')
		// 200: ok, 202: existant, autre erreur 
		if (ret.status==202) {
			displayInfo({titre: "Inscription refusée", back:"papier", ding:"explosion",
									 body:["La Grande Peluche ne te fais pas confiance",
												 "Les raisons probables de ce refus sont:",
												 "* Tu as utilisé précédemment un autre équipement pour te connecter",
												 "Info: "+ret.msg
												],
									 trailer: "Contacte Kikiadoc pour changer d'équipement" 
									})
			return
		}
		if (ret.status!=200) {
			displayInfo({titre: "Inscription refusée", back:"rouge", ding:"explosion",
									 body:["La Grande Peluche ne te fais pas confiance",
												 "La raison du refus est technique de facon générique",
												 "Raison: "+ret.msg
												],
									 trailer: "Relance une fois, et si toujours en erreur, contacte Kikiadoc" 
									})
			return
		}
		// Creation OK 
		addNotification("Inscription acceptée","lightgreen",20)
		storeIt("elipticSecurity",newEs)
		pseudo = ret.o.pseudo
		webAuth.etat="reload" // force recalc
		console.log("webAuthNew Resultat",ret.o.pseudo,newEs)
	}

	////////////////////////////////////////////////////////////////////
	// Webauthn generic
	////////////////////////////////////////////////////////////////////
	async function webauthnRegisterTech() {
		try {
			if (!saisies.prenom || !saisies.nom || !saisies.monde) return
			let prenom = capitalizeFirstLetter(saisies.prenom.replaceAll(' ','').toLowerCase())
			let nom = capitalizeFirstLetter(saisies.nom.replaceAll(' ','').toLowerCase())
			let monde = capitalizeFirstLetter(saisies.monde.replaceAll(' ','').toLowerCase())
			if (!isPseudoValid(prenom) || !isPseudoValid(nom))
				return displayInfo({titre:"Invalide!",
														body:["Ton prénom et nom doivent respecter les règles de nommage de FF14"]})
			let ff14Id = await checkLodestone(prenom,nom,monde)
			if (!ff14Id) return
			let oldEs = loadIt('elipticSecurity',null)
			let newEs = await cryptoNewElliptic()
			if (!newEs) throw new Error("Creation de clef elliptique impossible")
			// requery avec les nouvelles infos et forcant un mauvais pseudo 
			let ret = await apiCall("/pseudos/webauthn/"+prenom+"/"+nom+"/"+monde,
				"GET",null,true,'-register-' )
			if (ret.status != 200)
				return displayInfo({titre:"Status webauthn invalide", back:"rouge", ding:"explosion",
														body:["Erreur de chargement de ton contexte de sécurité",
																	ret.msg
																 ],
														trailer:"Contacte Kikiadoc immédiatement"
													 })
			webAuth = ret.o
			console.log("newWebAuth",webAuth)
			switch (webAuth.etat) {
				case "new": 
					await webAuthNew(webAuth,oldEs,newEs,ff14Id,prenom,nom,monde)
					break
				case "ok": // si ok serveur mais sur cette page, necessite un renew depuis le vault
					webAuth.etat='forcerenew' // 'ca continue par renew'
				case "renew": 
					await webAuthRenew(webAuth,oldEs,newEs,ff14Id)
					break
				case "upgrade":
					await webAuthUpgrade(webAuth,oldEs,newEs,ff14Id)
					break
				// case "legacy": 
			}
		}
		catch(e) {
			webAuth={}
			throw e
		}
	}
	async function webauthnRegister() {
		flagDisable="disabled"
		await webauthnRegisterTech() 
		flagDisable=null
	}
	let flagDisable=$state(null)
	// Cas particullier de reset global
	async function clearPseudo() {
		removeIt('elipticSecurity')
		removeIt('pseudo')
		removeIt('pseudoPwd')
		pseudo=""
	}

	
</script>
<style>
	div .disabled {
		pointer-events: none;
	  opacity: 0.5;
	}
	.rainbow { 
		animation-duration: 2s; animation-name: rainbowFrames; animation-iteration-count: infinite;
	}
	@keyframes rainbowFrames {
	  from { color: red; }
		20% {color: lightgreen }
	  to { color: green; }
	}

</style>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag) -->
<div use:scrollPageToTop>
	<p>Bienvenue,</p> 
	<p>Je suis la Grande Peluche Oracle des Savoirs.</p>
	<!-- 
	<div gpHelp="Cette opération utilise un challenge éphémère de sécurité valide quelques minutes. Pas de panique, il sera renouvellé automatiquement si tu mets trop de temps."
			 style="cursor: pointer" onclick={markClick} role="button" tabindex=0>
		<span class="rainbow"> 
			(<countdown dth={webAuth.ephemereDthEcheance} use:countDownInit
				oncdTimeout={()=>{ addNotification("Délai dépassé, reinitialisation","orange",10); webAuth={}}} />)
			<sup>ℹ️</sup>
		</span>
	</div>
	-->
	<div class="adminCadre papier {flagDisable}">
		<div>Indique moi ton prénom, nom et monde InGame:</div>
		<input bind:value={saisies.prenom} type="text" placeholder="prénomIG" maxlength=15>
		<input bind:value={saisies.nom} type="text" placeholder="nomIG" maxlength=15>
		<select bind:value={saisies.monde} >
			{#each GBLCONST.MONDES as m}<option>{m}</option>{/each}
		</select>
		<input type="button" value="Valider ►" id="enregistrerPseudo" onclick={webauthnRegister}>
	</div>
	<div class="info">
		<div><label><input type="checkbox" bind:checked={saisies.flagDebug}>Afficher les infos techniques</label></div>
		{#if saisies.flagDebug}
			<pre class="adminCadre info">{JSON.stringify(webAuth,null,2)}</pre>
		{/if}
	</div>
	<Credits />
</div>

<!-- Pauth.svelte --> 
