<script lang="ts">
	import { playVideo, playMusic, markClick, urlCdn,
					 apiCall, displayInfo, scrollPageToTop,
					 loadIt, storeIt, removeIt, isAdmin, displayObject,
					 isProd 
				 } from './common.js'

	let {
		CLIENTVERSION,
		pseudo=$bindable(),
		webAuth=$bindable()
	} = $props();

/*	
	const PAGESAISIESLBL="kikitestSaisies"
	let saisies = $state(loadIt(PAGESAISIESLBL,{}))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	const RPID = "svelte.dev"
	const RPNAME = "La Grande Peluche"
	const USERNAME = "prenom nom monde"
	let webauthnClient = {}
	$effect(()=>storeIt('webauthnClient',webauthnClient))
	let webauthnServer = {}
	$effect(()=>storeIt('webauthnServer',webauthnServer))
	function dump() {
		console.log("webauthnClient",webauthnClient)
		console.log("webauthnServer",webauthnServer)
	}
	function u8_hex(buffer) {
		return new Uint8Array(buffer).toHex()
	}
	function str_u8(txt :string) :ArrayBuffer {
    return Uint8Array.from(txt, c => c.charCodeAt(0)).buffer
	}
	function u8_str(buffer :ArrayBuffer) :string {
    return String.fromCharCode(...new Uint8Array(buffer))
	}
	/*
	function isB64(txt :string) :boolean {
    return txt.match(/^[a-zA-Z0-9\-_]+=*$/) !== null
	}
	function b64_b64u(b64) {
    return b64.replaceAll('+', '-').replaceAll('/', '_')
	}
	function b64u_b64(b64u) {
		return b64u.replaceAll('-', '+').replaceAll('_', '/') // base64url -> base64
	}
	function u8_b64u(u8) {
		return new Uint8Array(u8).toBase64({alphabet:"base64url"})
	}
	function b64u_u8(b64u) {
    return Uint8Array.fromBase64(b64u, {alphabet:"base64url"} )
	}
	function b64u_str(b64u) {
    return atob(b64u_b64(b64u))
	}
	function str_b64u(txt) {
		return b64_b64u(btoa(txt))
	}
	function randomChallengeU8() {
    return crypto.getRandomValues(new Uint8Array(32))
	}
	function randomChallengeB64u() {
    return u8_b64u(randomChallengeU8())
	}
	async function sha256(buffer) {
    return await crypto.subtle.digest('SHA-256', buffer)
	}
	function concatenateBuffers(buffer1 :ArrayBuffer, buffer2  :ArrayBuffer) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp;
	}
	/*
	async function isValid(validator :any, value :any) :Promise<boolean> {
   if(typeof validator === 'function') {
        const res = validator(value)
        if(res instanceof Promise)
					return await res
        else
            return res
    }
    // the validator can be a single value too
    return validator === value
	}
	async function isNotValid(validator :any, value :any) :Promise<boolean> {
	    return !(await isValid(validator, value))
	}
	function convertASN1toRaw(signatureBuffer) {
    // Convert signature from ASN.1 sequence to "raw" format
    const signature = new Uint8Array(signatureBuffer);
    const rStart = signature[4] === 0 ? 5 : 4;
    const rEnd = rStart + 32;
    const sStart = signature[rEnd + 2] === 0 ? rEnd + 3 : rEnd + 2;
    const r = signature.slice(rStart, rEnd);
    const s = signature.slice(sStart);
    return new Uint8Array([...r, ...s]);
	}

	/////////////////////////////////////////////////////////////////////////

	async function clientCreateKey(rpId,rpName,userName,b64uChallenge) {
		const publicKeyCreate = {
			publicKey: {
			  challenge: b64u_u8(b64uChallenge) ,
			  rp: { id: rpId, name:rpName },
				timout: 30000,
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
		console.log("publicKeyCredentialCreate",publicKeyCredentialCreate)
		return {
			id: publicKeyCredentialCreate.id,
			challengeFromServer: b64uChallenge,
			rawId: u8_b64u(publicKeyCredentialCreate.rawId),
			clientDataJSON: u8_b64u(publicKeyCredentialCreate.response.clientDataJSON),
			publicKey: u8_b64u(publicKeyCredentialCreate.response.getPublicKey()),
			algorithm: publicKeyCredentialCreate.response.getPublicKeyAlgorithm(),
			transports: publicKeyCredentialCreate.response.getTransports(),
			authenticatorData: u8_b64u(publicKeyCredentialCreate.response.getAuthenticatorData())
		}
	}
	async function clientGetKey(rpId,b64uRawId,b64uChallenge) {
		const publicKeyGet = {
			// mediation: 
			// signal:
			publicKey : {
				allowCredentials: [ { id: b64u_u8(b64uRawId), type: "public-key" }, ],
			  challenge: b64u_u8(b64uChallenge) ,
				// hints: 
			  rpId: rpId,
				// timeout: 
				// userVerification: "discouraged", // "required",
			}
		}
		let publicKeyCredentialGet = await navigator.credentials.get(publicKeyGet)
		return {
			id: publicKeyCredentialGet.id,
			chalenge: b64uChallenge,
			rawId: u8_b64u(publicKeyCredentialGet.rawId),
			clientDataJSON: u8_b64u(publicKeyCredentialGet.response.clientDataJSON),
			authenticatorData: u8_b64u(publicKeyCredentialGet.response.authenticatorData),
			signature: u8_b64u(publicKeyCredentialGet.response.signature),
			userHandle: u8_b64u(publicKeyCredentialGet.response.userHandle)
		}
	}
	//////////////////////////////////////////////////////////////////////////////
	function getAlgoName(num) {
    switch(num) {
        case -7: return "ES256"
        case -8: return "EdDSA"
        case -257: return "RS256"
        default: throw new Error(`Unknown algorithm code: ${num}`)
    }
	}
	function getAlgoParams(algorithm) {
    switch (algorithm) {
        case 'RS256': return { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
        case 'ES256': return { name: 'ECDSA', namedCurve: 'P-256', hash: 'SHA-256' };
        // case 'EdDSA': Not supported by browsers
        default: throw new Error("getAlgoParams algo invalide (RS256 OU ES256):"+algorithm)
    }
	}
	async function parseCryptoKey(algoParams, publicKey ): Promise<CryptoKey> {
    return crypto.subtle.importKey('spki', publicKey, algoParams, false, ['verify'])
	}
	function b64uEquals(a,b) {
		let aa = a?.replaceAll('=','')
		let bb = b?.replaceAll('=','')
		console.log('b64uEquals',a,b,aa==bb)
		return a && b && (aa==bb)
	}
	function extractAaguid(authenticatorData) {
		console.log('authenticatorData.byteLength',authenticatorData.byteLength)
    if (authenticatorData.byteLength < 53) return null // "00000000-0000-0000-0000-000000000000"
    const buffer = authenticatorData.slice(37, 53) // 16 byte
    const hex = u8_hex(buffer)
    const aaguid = `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20,32)}`
    return aaguid // ex "d41f5a69-b817-4144-a13c-9ebd6d9254d6"
	}
	function parseAuthenticator(b64uAuthenticatorData) {
		let authenticatorData = b64u_u8(b64uAuthenticatorData).buffer
    let flags = new DataView(authenticatorData.slice(32,33)).getUint8(0)
    return {
        rpIdHash: u8_b64u(authenticatorData.slice(0,32)),
        flags: {
                userPresent: !!(flags & 1),
                //reserved1: !!(flags & 2),
                userVerified: !!(flags &  4),
                backupEligibility: !!(flags & 8),
                backupState: !!(flags & 16),
                //reserved2: !!(flags & 32),
                attestedData: !!(flags & 64),
                extensionsIncluded: !!(flags & 128)
        },
        signCount: new DataView(authenticatorData.slice(33,37)).getUint32(0, false),  // Big-Endian!
        aaguid: extractAaguid(authenticatorData),
        //credentialId: extractCredentialId() 
    }
	}

	async function verifySignature({ algorithm, b64uPublicKey, b64uAuthenticatorData,
																	 b64uClientData, b64uSignature, verbose
																 }) {
		console.log('Algorithm: ', algorithm)
		console.log('b64uPublicKey:', b64uPublicKey)
		console.log('b64uSignature:', b64uSignature)
		console.log('b64uClientData:', b64uClientData)
    let clientHash = await sha256(b64u_u8(b64uClientData))
    // during "login", the authenticatorData is exactly 37 bytes
    let comboBuffer = concatenateBuffers(b64u_u8(b64uAuthenticatorData), clientHash)
		console.log('ComboBuffer: ', comboBuffer)
    let signatureBuffer = b64u_u8(b64uSignature)
		let algoName = getAlgoName(algorithm)
    if(algoName == 'ES256') signatureBuffer = convertASN1toRaw(signatureBuffer)
    const algoParams = getAlgoParams(algoName)
    let cryptoKey = await parseCryptoKey(algoParams, b64u_u8(b64uPublicKey) )
    console.log('CryptoKey:',cryptoKey)
    const isValid = await crypto.subtle.verify(algoParams, cryptoKey, signatureBuffer, comboBuffer)
    console.log('Signature: isValid:',isValid)
    return isValid
	}
	async function verifyRegistration(toServerCreate,expected) {
		console.log('verifyRegistration',toServerCreate,expected)
		const clientJson = JSON.parse(b64u_str(toServerCreate.clientDataJSON))
    const authenticator = parseAuthenticator(toServerCreate.authenticatorData)
    const aaguid = authenticator.aaguid
		console.log("clientJson",clientJson)
		console.log("authenticator",authenticator)
		console.log("aaguid",aaguid)
		const expectedRpIdHash = u8_b64u(await sha256(str_u8(RPID)))
    if (clientJson.type !== "webauthn.create") throw new Error(`Mauvais clientJson type: : ${clientJson.type}`)
    if (authenticator.rpIdHash !== expectedRpIdHash) throw new Error(`Mauvais RpIdHash: ${authenticator.rpIdHash},${expectedRpIdHash}`)
		if (clientJson.origin !== expected.origin) throw new Error(`Mauvais origine: ${clientJson.origin},${expected?.origin}`)
    if (! b64uEquals(clientJson.challenge,expected.challenge)) throw new Error(`Mauvais Challenge: ${clientJson.challenge},${expected.challenge}`)
		if (!authenticator.flags.userVerified) throw new Error("Pas d'intération utilisateur pour valider")
    if (!aaguid) throw new Error("Unexpected error, no AAGUID.")
		console.log('*** verifyRegistration OK ***')
}

	async function verifyAuthentication(toServerCreate, toServerGet, expected ){
    if (! b64uEquals(toServerGet.rawId,expected.rawId)) throw new Error(`Credential ID mismatch: ${toServerGet.rawId}, ${expected.rawId}`)
    const isValidSignature = await verifySignature({
        algorithm: toServerCreate.algorithm,
        b64uPublicKey: toServerCreate.publicKey,
        b64uAuthenticatorData: toServerGet.authenticatorData,
        b64uClientData: toServerGet.clientDataJSON,
        b64uSignature: toServerGet.signature
    })
    if (!isValidSignature) throw new Error(`Erreur signature: ${get.clientCredential.response.signature}`)
		const clientJson = JSON.parse(b64u_str(toServerGet.clientDataJSON))
		console.log('clientJson',clientJson)
    if (clientJson.type !== "webauthn.get") throw new Error(`Mauvais clientData type: ${clientJson?.type}`)
		if (clientJson.origin !== expected.origin) throw new Error(`Mauvais origine: ${clientJson?.origin},${expected?.origin}`)
		if (! b64uEquals(clientJson.challenge,expected?.challenge)) throw new Error(`Mauvais challenge: ${clientJson.challenge},${expected?.challenge}`)
		const expectedRpIdHash = u8_b64u(await sha256(str_u8(RPID)))
    const authenticator = parseAuthenticator(toServerGet.authenticatorData);
    if (authenticator.rpIdHash !== expectedRpIdHash) throw new Error(`Mauvais RpIdHash: ${authenticator.rpIdHash},${expectedRpIdHash}`)
		console.log('authenticator',authenticator)
		console.log('*** verifyAuthentication OK ***')
    if (!authenticator.flags.userPresent)
        throw new Error(`Unexpected authenticator flags: missing userPresent`)
    if (!authenticator.flags.userVerified && expected.userVerified)
        throw new Error(`Unexpected authenticator flags: missing userVerified`)
    if (expected.counter && authenticator.signCount <= expected.counter)
        throw new Error(`Unexpected authenticator counter: ${authenticator.signCount} (should be > ${expected.counter})`)
    return toAuthenticationInfo(authenticationJson, authenticator)
}
	function toAuthenticationInfo(authenticationJson :AuthenticationJSON, authenticator :AuthenticatorParsed) :AuthenticationInfo {
    return {
        credentialId: authenticationJson.id,
        userId: authenticationJson.response.userHandle,
        counter: authenticator.signCount,
        userVerified: authenticator.flags.userVerified,
        authenticatorAttachment: authenticationJson.authenticatorAttachment
    }
	}

	async function uiCreateKey() {
		let b64uChallengeCreate = randomChallengeB64u() // simul recu serveur
		webauthnClient.toServerCreate = await clientCreateKey(RPID,RPNAME,USERNAME,
																													b64uChallengeCreate)
		dump()
	}
	async function uiServerCheckCreate() {
		await verifyRegistration(webauthnClient.toServerCreate,
														 { origin: "https://"+RPID, challenge: webauthnClient.toServerCreate.b64uChallengeCreate} )
		dump()
	}
	async function uiGetKey() {
		let b64uChallengeGet = randomChallengeB64u() // simul recu serveur
		let b64uRawId = webauthnClient.toServerCreate.rawId
		webauthnClient.toServerGet = await clientGetKey(RPID,b64uRawId,b64uChallengeGet)
		dump()
	}
	async function uiServerCheckGet() {
		verifyAuthentication(webauthnClient.toServerCreate,webauthnClient.toServerGet,{
			origin: "https://"+RPID,
			rawId: webauthnClient.b64uRawId,
			publicKey: webauthnClient.b64uPublicKey,
			challenge: webauthnClient.b64uChallengeGet} )
		dump()
	}

		// si rawid, le pseudo est valide, mais peut etre a renew
		if (webAuth.pseudo && webAuth.rawid) {
			if ( (webAuth.dthEcheance || 0) < Date.now() ) {
				// necessite un nouveau get webauthn 
				addNotification("Nouveau Get webauthn")
			}
			else {
				// la clef éphémère est valide, on lance le web socket
				init(pseudo)
			}
		}
		else {
			// necessite un nouveau create webauthn
			addNotification("Nouveau create webauthn")
		}
	}  
*/
	async function debugUndoUpgrade() {
		let ret= await apiCall("/pseudos/debugUndoUpgrade",'PUT',null,true)
		if (ret.status==200) {
			console.log("debugUndoUpgrade",ret.o)
			storeIt('elipticSecurity',ret.o)
			webAuth = {} // force recalc
		}
	} 
	async function clearPseudo() {
		removeIt('elipticSecurity')
		removeIt('pseudo')
		removeIt('pseudoPwd')
		pseudo=""
	}
</script>
<style>
	
</style>
 
<div class="adminCadre" style="font-size:0.5em">
	<div>Test WebAuthn ADMIN hors PROD Etat={webAuth?.etat}</div>
	<input type="button" value="ClearPseudo" onclick={clearPseudo} />
	<input type="button" value="SetPseudo" onclick={()=> {pseudo='Kikiadoc'}} />
	<input type="button" value="UnsetWebAuth" onclick={()=> {webAuth={}}} />
	<input type="button" value="UndoUpgrade" onclick={debugUndoUpgrade} />
</div>
<!-- 
<div> 
	<input type="button" value="Aff cli" onclick={()=>displayObject(cli)} />
	<input type="button" value="Aff srv" onclick={()=>displayObject(srv)} />
</div> 
<div> 
	RawId: {webauthnClient.b64uRawId}
</div>
<div class="adminCadre">
	<input type="button" value="createKey" onclick={uiCreateKey} />
	<input type="button" value="getKey" onclick={uiGetKey} />
	<input type="button" value="serverCheckCreate" onclick={uiServerCheckCreate} />
	<input type="button" value="serverCheckGet" onclick={uiServerCheckGet} />
</div>
-->

