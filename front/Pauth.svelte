<script>
	import { onMount, onDestroy  } from 'svelte';
	import { scrollPageToTop, capitalizeFirstLetter, isPseudoValid, // crypoCreateKeyPair,
					 addNotification, apiCall, storeIt, loadIt, removeIt,
					 displayInfo, displayObject,
					 markClick, countDownInit, disconnectFromServer,
					 str_u8, u8_b64u, b64u_u8, cryptoNewElliptic, abElipticSignature,
				 } from './common.js' 
	import { G }  from './privacy.js'
	import { GBLCONST, GBLSTATE, GBLSTATIC, rawConsole, authContexte } from "./ground.svelte.js"

	import Credits from './Credits.svelte' 
	
	let {
		pseudo=$bindable(),
		webAuth=$bindable(),
		discordAuth=null
	} = $props() 
	
	const	MONDES= [
		"Cerberus","Louisoix","Moogle","Omega","Phantom","Ragnarok","Sagittarius","Spriggan",
		"Alpha","Lich","Odin","Phoenix","Raiden","Shiva","Twintania","Zodiark"
	]
	const PAGESAISIESLBL="Pauth_saisies"
	let saisies = $state(loadIt(PAGESAISIESLBL,{}))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	onMount(async () => {
		console.log("** pAuth mount") 
	});
	/////////////////////////////////////////////////////////////////////
	// Vérification lodestone 
	/////////////////////////////////////////////////////////////////////
	async function checkLodestone(prenom,nom,monde) {
		addNotification("Pré-vérification Lodestone","lightgreen",3)
		// acces lodestone via proxy sur adhoc.click (pour eviter les reponses opaques,sans atttente WS)
		let ret = await apiCall("/lodestone/check/"+prenom+"/"+nom+"/"+monde,"GET",null,true,'-lodestone-')
		// console.log("ret=",ret)
		switch (ret.status) {
			case 200:
				return ret.o.ff14Id
			case 202:
				displayInfo({
					titre:"Tu es inconnu du lodestone", back: "rouge", ding: "explosion",
					body: [
						"Je n'ai pas trouvé "+prenom+" "+nom+"@"+monde+" sur le Lodestone de FF14",
						"Vérifie bien les prénom, nom et monde que tu as indiqués",
						"Si le jeu est en maintenance, patiente un peu",
					],
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
			b64uAuthenticatorData: u8_b64u(publicKeyCredentialCreate.response.getAuthenticatorData()),
			b64uPublicKey: u8_b64u(publicKeyCredentialCreate.response.getPublicKey()),
			algorithm: publicKeyCredentialCreate.response.getPublicKeyAlgorithm(),
			transports: publicKeyCredentialCreate.response.getTransports(),
		}
	}
	async function webAuthVaultGet(rpId,b64uRawId,challenge) { 
		addNotification("Signature cryptographique...","lightgreen",3)
		const publicKeyGet = {
			publicKey : {
				allowCredentials: [ { id: b64u_u8(b64uRawId), type: "public-key" }, ],
				challenge: str_u8(challenge) ,
				rpId: rpId,
				userVerification: "required",
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
	async function getFromVault() { 
		try {
			if (webAuth.b64uRawId) { // Le serveur connait l'équipement 
				webAuth.step="webAuthVaultGet"
				return await webAuthVaultGet(webAuth.rpId,webAuth.b64uRawId,webAuth.ephemere) 
			}
			else { // Le serveur ne connait pas l'équipement
				webAuth.step="webAuthVaultCreate"
				return await webAuthVaultCreate(webAuth.rpId,webAuth.rpName,
																			webAuth.prenom+' '+webAuth.nom+' @'+webAuth.monde,
																			webAuth.ephemere)
			}
		}
		catch(e) {
			displayInfo( {titre:"Erreur getFromVault", back:"rouge", ding: "explosion",
										body: [
											"Une erreur s'est produite lors de l'accès à ton coffre numérique",
											"⚠️Un seul équipement est autorisé en authentification forte",
											"⚠️Si tu as changé d'équipement pour te connecter, contacte un admin",
											"Raison: "+e.toString()
										]
									 })
		}
		return null
	}
	async function getFromDiscord() { 
		return {
			discordToken: discordAuth?.access_token,
			discordCode: discordAuth?.discordCode,
			discordId: discordAuth?.user?.id,
		}
	}
	////////////////////////////////////////////////////////////////////
	// auth  
	////////////////////////////////////////////////////////////////////
	let flagSaisieDisable=$state(null) // falg permettant le disable de la zone de saisie du nom
	function concatPNMLD(dId) {
			return "/"+webAuth.prenom+"/"+webAuth.nom+"/"+webAuth.monde+"/"+webAuth.ff14Id+"/"+dId
	}
	async function buildAuthPayload(webAuth,oldEs,newEs,aWeb,aDis ) {
		console.log("aWeb",aWeb)
		return {
			typeAuth: webAuth.typeAuth,
			ff14Id: webAuth.ff14Id,
			prenom: webAuth.prenom,
			nom: webAuth.nom,
			monde: webAuth.monde,
			challengeUsed: webAuth.ephemere,
			oldJwkPublicKey: oldEs?.jwkPublicKey,
			newJwkPublicKey: newEs?.jwkPublicKey,
			discordToken: aDis?.access_token,
			discordCode: aDis?.discordCode,
			discordId: aDis?.user?.id,
			b64uRawId: aWeb?.b64uRawId,
			b64uVaultPublicKey: aWeb?.b64uPublicKey,
			b64uVaultSignature: aWeb?.b64uVaultSignature,
			b64uElipticSignature: webAuth.b64uElipticSignature, // newEs && await u8_b64u(abElipticSignature(webAuth.ephemere,newEs)), // u8_b64u(aWeb?.u8ElipticSignature),
			b64uClientDataJSON: aWeb?.b64uClientDataJSON,
			b64uAuthenticatorData: aWeb?.b64uAuthenticatorData,
			vaultAlgorithm: aWeb?.algorithm,
			vaultTransports: aWeb?.transports,
		}
	}
	async function normalisePNML() {
		if ( (typeof saisies.prenom === "undefined") ||
				 (typeof saisies.nom === "undefined") ||
				 (typeof saisies.monde === "undefined") ||
				 (!saisies.prenom) || (!saisies.nom) || (!saisies.monde)
			 ) {
			console.log("normalisePNML retun FALSE",saisies) 
			return false
		}
		if ( (!saisies.prenom) || (!saisies.nom) || (!saisies.monde)) return false
		saisies.prenom =  capitalizeFirstLetter(saisies.prenom.replaceAll(' ','').toLowerCase())
		saisies.nom = capitalizeFirstLetter(saisies.nom.replaceAll(' ','').toLowerCase())
		saisies.monde = capitalizeFirstLetter(saisies.monde.replaceAll(' ','').toLowerCase())
		if (!isPseudoValid(saisies.prenom) ) return false
		if (!isPseudoValid(saisies.nom) ) return false
		if (!isPseudoValid(saisies.monde) ) return false
		let newPNM = saisies.prenom+saisies.nom+saisies.monde
		if (!saisies.ff14Id || saisies.oldPNM != newPNM) {
			saisies.ff14Id = await checkLodestone(saisies.prenom,saisies.nom,saisies.monde)
			if (!saisies.ff14Id) return false
			saisies.oldPNM = newPNM
		}
		webAuth.prenom = saisies.prenom
		webAuth.nom = saisies.nom
		webAuth.monde = saisies.monde
		webAuth.ff14Id = saisies.ff14Id
		return true 
	}

	////////////////////////////////////////////////////////////////////
	// auth NEW OU RENEW 
	////////////////////////////////////////////////////////////////////
	async function authUpdate(ev) {
		flagSaisieDisable="disabled"
		await doAuthUpdate()
		flagSaisieDisable=null 
	}
	async function doAuthUpdate() { 
		rawConsole.log("doAuthUpdate",webAuth) 
		// patch le webAuth avec le PNML
		if (! await normalisePNML() ) {
			addNotification("mauvais prénom/nom/monde","red",15)
			return
		}
		webAuth = await authContexte(webAuth,discordAuth,apiCall,loadIt,displayInfo)
		// Si pas de webAuth depuis le serveur, il y a un soucis, donc on arrete
		if (!webAuth) return
		// apres un état serveur, il ne communique pas le ff14Id ni discordId 
		webAuth.ff14Id = saisies.ff14Id
		webAuth.discordId = discordAuth?.user?.id
		// si changement d'avis serveur (plus new ni renew) 
		if (webAuth.etat != "new" && webAuth.etat != "renew" ) return
		
		let aWeb = (!GBLSTATIC.isDiscord) ? await getFromVault() : null
		let aDis = (GBLSTATIC.isDiscord) ? await getFromDiscord() : null
		if (!aWeb && !aDis) throw new Error ("Erreur de logique dans doAuthUpdate: !aWeb && !aDis")
		let oldEs = loadIt('elipticSecurity',null) 
		let newEs = await cryptoNewElliptic()
		webAuth.b64uElipticSignature = u8_b64u(await abElipticSignature(webAuth.ephemere,newEs))
		webAuth.toServer = await buildAuthPayload(webAuth,oldEs,newEs,aWeb,aDis )
		let ret = await apiCall("/pseudos/auth"+webAuth.etat+concatPNMLD(webAuth.discordId),"PUT", webAuth.toServer,true,'-register-')
		// 200: ok, 202: existant, autre erreur
		if (ret.status!=200) {
			displayInfo({titre: "Inscription refusée", back:"rouge", ding:"explosion",
									 body:["La Grande Peluche ne te fait pas confiance",
												 "Raison: "+ret.msg,
												 "Les raisons probables de ce refus sont:",
												 "* Tu as utilisé précédemment un autre équipement pour te connecter",
												 "* Tes informations ne sont pas suffisamment vérifiables",
												],
									})
			return
		}
		// new ou renew OK 
		addNotification("Inscription acceptée","lightgreen",5)
		storeIt("elipticSecurity",newEs)
		delete webAuth.toServer
		delete webAuth.step
		pseudo =ret.o.pseudo
		webAuth.pseudo = ret.o.pseudo
		webAuth.etat="ok"
	}
	////////////////////////////////////////////////////////////////////
	// Cas particullier de reset global
	////////////////////////////////////////////////////////////////////
	async function clearPseudo() {
		removeIt('elipticSecurity')
		removeIt('pseudo')
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
{#if webAuth?.etat=="new" || webAuth?.etat=="renew"}
	<div use:scrollPageToTop>
		<div>Bienvenue,</div> 
		<div>je suis la Grande Peluche.</div>
		<br/>
		<div class="adminCadre papier {flagSaisieDisable}">
			<div>Indique moi ton prénom, nom et monde InGame:</div>
			<div>
				<input bind:value={saisies.prenom} type="text" placeholder="prénomIG" size=15 maxlength=15>
				<input bind:value={saisies.nom} type="text" placeholder="nomIG" size=15 maxlength=15>
				<select bind:value={saisies.monde} >
					{#each MONDES as m}<option>{m}</option>{/each}
				</select>
				<button class="button" value="Valider ►" onclick={authUpdate}>
					Valider ►
				</button>
			</div>
			{#if webAuth.typeAuth=="discord"}
				<div class="petit">
					ℹ️Ton nickName Discord doit mentionner ton prénom IG.
				</div>
			{/if}
			{#if webAuth.etat == "renew"}
				<div class="petit">
					ℹ️Afin de vérifier ta chaine complete de sécurité,
					<!--
					<span class="gpLink" gpLink="https://eur-lex.europa.eu/legal-content/FR/TXT/PDF/?uri=CELEX:32022R2554">
						DORA
					</span>
					-->
					je dois vérifier périodiquement ton accès.
				</div>
			{/if}
		</div>
		<div class="info">
			<div><label><input type="checkbox" bind:checked={saisies.flagDebug}>Afficher les infos techniques</label></div>
			{#if saisies.flagDebug}
				<div class="adminCadre info">
					<div>webAuth</div>
					<pre>{JSON.stringify(webAuth,null,2)}</pre>
				</div>
			{/if}
		</div>
		<Credits />
	</div>
{/if}
<!-- Pauth.svelte --> 
