
const gbl = require('../infraback/gbl.js');

// parse réponse du lodestone a la recherche de FullName,
// XIVAPI.com etant buggé, c'est un bypass...
// retourne son FF14ID ou null
// < a class="entry__link" href="/lodestone/character/ff14id/"> .... </a>
// dans contenu :
// <p class="entry__name">PRENON NOM</p>
function lodestoneParse(sTexte,fullName) {
	// debug affiche les <p class="entry__name">
	const dbgIndex = sTexte.indexOf('<p class="entry__name">')
	console.log("debug:", sTexte.substring(dbgIndex,dbgIndex+50) )
	let texte = sTexte.replaceAll('&#39;',"'");

  const sEntry='<p class="entry__name">'+fullName+'</p>'
  const sChar='href="/lodestone/character/'
  const k = texte.indexOf(sEntry)
  if (k<0) return null; // Aucune correspondance
  const s = texte.substring(k-500,k);
  const c = s.lastIndexOf(sChar)
  if (c<0) return null; // pas de FF14ID
  const f = c+sChar.length
  const ff14Id = parseInt(s.substring(f,f+20),10);
  console.log("Search:",fullName,"--> ff14Id:",ff14Id);
  return ff14Id
}

async function getFF14Id(prenom,nom,monde) {
	const fullName = prenom+" "+nom;
	const url = "https://fr.finalfantasyxiv.com/lodestone/character/?q="+fullName+"&worldname="+monde+"&order="
	// const headers = { 
			// "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
			// "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
			// "Accept-Encoding": "gzip, deflate, br",
			// "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
	// }
	console.log("getFF14Id",url);
	ret = await gbl.apiCallExtern(url,null,null,null)
	if (ret.status!=200) { console.log("****ERREUR LODESTONE**",ret.status, ret, url); return null;  }
	return lodestoneParse(ret.text,fullName)
}

// lodestone check: 200 { ff41Id: } si ok, 202 si introuvable
async function httpCallback(req, res, method, reqPaths, body, pseudo, pwd) {
	// pas de verif complete, l'acces doit être fait avec un user="" (dummy)
	if (pseudo!="nondefini") gbl.exception("bad user need nondefini dans la requete",400);
	switch (method) {
		case "GET":
			switch(reqPaths[2]) {
				case "check":
					if (!gbl.isPseudoValid(reqPaths[3]) || !gbl.isPseudoValid(reqPaths[4]) || !gbl.isPseudoValid(reqPaths[5]) )
						gbl.exception("bad pseudo",400)
					let ff14Id = await getFF14Id(reqPaths[3],reqPaths[4],reqPaths[5])
					if (ff14Id > 0) gbl.exception({ ff14Id: ff14Id },200)
					gbl.exception("Pseudo introuvable",202);
			}
	}
	gbl.exception("bad op",400)
}


exports.getFF14Id = getFF14Id
exports.httpCallback = httpCallback


console.log("lodestone loaded");
