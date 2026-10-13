const gbl = require('../infraback/gbl.js');
const vault = require('../infraback/vault.js');

const FF14MAXLEN = 40 // longeur maximale du prenom/nom dans FF14

let tblJetons = new Map() // Table des jetons valides indexée par l'access token
let tblMembres = new Map()	 // Table des derniers context discord indexée par discordId

//
// Ajout du membre pour un discordId
//
exports.setDiscordMembre = (discordId,membre) => {
	if (! discordId || ! gbl.isNumeric(discordId)) gbl.exception("setDiscordMembre, discordId invalide",400)
	tblMembres.set(discordId, membre )
	console.log("************ setDiscordMembre",discordId,membre)
}
//
// Verification de la coherence d'un nick
// usage non public
//
exports.isValidNick = (discordId,prenom,nom,monde) => {
	let membre = tblMembres.get(discordId)
	if (!membre) gbl.exception("isValidNick, discordId invalide",400)
	let nick = membre.nick || membre.user?.global_name || membre.user?.username
	if (!nick) gbl.exception("isValidNick, pas de nick valide",400)
	nick = nick.toLowerCase()
	console.log('isValidNick',discordId,prenom,nom,monde,nick,membre)
	if ( nick.indexOf(prenom.toLowerCase()) >=0 || nick.indexOf(nom.toLowerCase()) >=0) return true
	return false	
}
//
// Retourne la description d'un user qui a oAuth discord
// attention, access public, pipotron 200 en cas d'erreur
//
async function monNick(discordId) {
	return tblMembres.get(discordId)
} 

// verification/obtention d'un access token
//
async function discordAuth(body) {
	const oBody = JSON.parse(body)
	console.log("discordAuth",oBody)
	if (! gbl.isNumeric(oBody.clientId)) gbl.exception("badBody1 dans validation",400)
	const secret = vault.get("whDiscordAppToken_"+oBody.clientId) // app from vault
	const clientId = oBody.clientId
	const code = oBody.code
	if (!secret || !clientId || !code) gbl.exception("badBody2 dans validation",400)
  const tokenParams = new URLSearchParams({
  	client_id: clientId,
  	client_secret: secret,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: "https://127.0.0.1",
   });
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams
  });
  if (!tokenResponse.ok) {
		console.error("badBody3",tokenResponse)
		gbl.exception("badBody3 dans validation",400)
	} 
  let jsonToken = await tokenResponse.json()
	// ajoute le'auth dans les jetons valides
	console.log("***************Ajout",jsonToken,code)
	tblJetons.set(jsonToken.access_token,code)
	
	return jsonToken
}
// verification de validation d'un access toekn (usage unique)
exports.isValidToken = (token,code) => {
	console.log("***************Check",token,code)
	let jCode = tblJetons.get(token)
	tblJetons.delete(token)
	return token && jCode && code && jCode==code
} 
////////////////////////////////////////////
////////////////////////////////////////////
// Glocal & exports
////////////////////////////////////////////
////////////////////////////////////////////
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	switch (method) {
		// ATTENTION embDiscord est en mode acces public
		case 'GET':
			switch(reqPaths[2]) {
				case "monNick":
					gbl.exception(await monNick( reqPaths[3] ),200)
			}
			gbl.exception("bad op/get",400);
		case 'POST':
			switch(reqPaths[2]) {
				case "validation":
					gbl.exception(await discordAuth(body),200)
			}
			gbl.exception("bad op/post",400);
	}
	gbl.exception("bad op",400);
}

