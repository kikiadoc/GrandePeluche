
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const pCloud = require('../infraback/pCloudTools.js');

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
	const ret = await gbl.apiCallExtern(url,null,null,null)
	if (ret.status!=200) { console.log("****ERREUR LODESTONE**",ret.status, ret, url); return null;  }
	return lodestoneParse(ret.text,fullName)
}

// recupere l'icone du personnage et le publie vers le cdn
// test indique qu'il ne faut pas publier mais seulement tester le lodestone
// retourne le FF14 id si ok, null sinon
async function publishFace(pseudo,test) {
	const SCLS = 'class="frame__chara__face"'
	const SIMG = 'img src="'
	const ff14Id = pseudos.get(pseudo)?.ff14Id
	if (!ff14Id) gbl.exception("ERREUR SERVER COHERENCE PSEUDO",500)
	const url = "https://fr.finalfantasyxiv.com/lodestone/character/"+ff14Id
	let ret = await gbl.apiCallExtern(url,null,null,null)
	if (ret.status!=200) { console.log("****ERREUR LODESTONE**",ret.status, ret, url); return null;  }
	// recher l'url de l'icone du perso
	const sCls = ret.text.indexOf(SCLS)
	if (sCls<0) { console.log("****ERREUR LODESTONE**",ret.status, ret, url); return null;  }
  const sImg = ret.text.indexOf(SIMG,sCls) // doit contenir l'url de l'image
	if (sImg<0) { console.log("****ERREUR LODESTONE**",ret.status, ret, url); return null;  }
  const eImg = ret.text.indexOf('"',sImg+SIMG.length) // quote de fin
	if (eImg<0) { console.log("****ERREUR LODESTONE**",ret.status, ret, url); return null;  }
	const imgUrl = ret.text.substring(sImg+SIMG.length,eImg) // url de l'image 
	console.log("url icone pour",pseudo,sImg,eImg,imgUrl)

	// recupere l'image du lodestone
	ret = await gbl.apiCallExtern(imgUrl,null,null, { 'Content-Type': 'image/*; charset=UTF-8'}, 'raw')
	if (ret.status!=200) { console.log("****ERREUR LODESTONE**",ret.status, ret, imgUrl); return null;  }
	// ret.raw contient l'image
	console.log("image",pseudo,ret)
	// verification du type
	if ( ret.raw?.type != "image/jpeg")  { console.log("****ERREUR LODESTONE BAD IMAGE**",ret.status, ret, imgUrl); return null;  }

	// si test, on ne publie pas
	if (test) return ff14Id

	// publication de l'image du pseudo sur le cdn
	let pub = await pCloud.putPublicBlob(ret.raw,'pseudo-'+pseudo+'.jpg')
	if (pub.result!==0) { console.log("****ERREUR PCLOUD publish icone pseudo**",pseudo, imgUrl, pub); return null;  }
	return ff14Id
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
exports.publishFace = publishFace
exports.httpCallback = httpCallback


console.log("lodestone loaded");
