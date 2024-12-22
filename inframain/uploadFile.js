
const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const wsserver = require('../infraback/wsserver.js');
const pCloud = require('../infraback/pCloudTools.js');
const fsPromises = require('node:fs/promises');

const PREFIX='"data:image/' // body est un json, donc encadré ppar des "
const TMPFSDIR="/home/ec2-user/tmp/"


// telecharge un fichier image contenu dans body, vers pCloud, avec le nom nomFichier et si besoin, le traking via WS à psuedo
async function uploadFileByName(nomFichier, body, pseudo) {
	// verif car on peut patcher le fs
	if (nomFichier.indexOf('/') >= 0 || nomFichier.indexOf('.') >= 0) gbl.exception("Erreur server, parse nomFichier sur uploadFileByName dangeureux, contate immédiatement Kikiadoc",500)
	// telecher un fichier depuis le steam d'entree du serveur
	console.log("upload",nomFichier,"Size=",body.length,body.substring(0,100));
	// body doit commencer par data:image/???;base64,
	console.log("prefix:",body.substring(0,PREFIX.length), body.startsWith(PREFIX) );
	// body doit commencer par data:image/???;base64,
	if (! body.startsWith(PREFIX)) gbl.exception("Erreur Client, not a data:image/*",400);
	// index des séparateurs
	const pPointVirg = body.indexOf(';')
	const pVirg = body.indexOf(',')
	// extraction du type et encoding
	const mimeType = body.substring(PREFIX.length,pPointVirg)
	const encoding = body.substring(pPointVirg+1,pVirg)
	console.log("mime:",mimeType,"encoding:",encoding);
	// vérif....
	if (mimeType!="jpg" && mimeType != "jpeg" && mimeType !="png") gbl.exception("Erreur Client, not a png/jpg/jpeg",400);
	if (encoding!="base64")  gbl.exception("Erreur Client, not a base64 encoding",400);
	// decode et ecrit les datas raw
	const localFilename = TMPFSDIR+nomFichier+".upload"
	await fsPromises.writeFile(localFilename,Buffer.from(body.substring(pVirg+1,body.length-1),'base64') )
	// telecharge le fichier sur pCloud	
	await pCloud.putPublicFile(localFilename,nomFichier+".upload")
	// menage
	await fsPromises.unlink(localFilename, (e)=> console.log("postUpload unlink:",localFilename,e) )
}

exports.uploadFileByName = uploadFileByName
exports.httpCallback = async (req, res, method, reqPaths, body, pseudo, pwd) => {
	pseudos.check(pseudo,pwd,true); // admin
	switch (method) {
		case "POST":
			uploadFileByName("test",body);
			gbl.exception("bad op",200)
	}
	gbl.exception("bad meth",400)
}

console.log("uploadFile loaded");

/*
	// eventFileInput=event d'un input type=file, tagImg est le preview, et cb est appelé lors du fullfill des datas
	function validateImageUpload(eventFileInput,maxSize,tagImg,cbData) {
		const file = eventFileInput.target.files[0]
	  const reader = new FileReader();
		const image = document.getElementById(tagImg)
		if (!file || !reader || !image) return addNotification("Erreur interne cllent sur displayImageFile")
		reader.addEventListener("loadstart", () => {
			image.src = urlImg+"sablierAnime.gif"
		}, false);
		reader.addEventListener("load", () => {
			console.log("image size=",reader.result.length);
			image.src = reader.result
			cbData && cbData(reader.result)
		}, false);
    reader.readAsDataURL(file);
	}

	// variable de stockage du blog de l'image
	let imageDataRaw = null

 		<div>
	    <input type="file" accept="image/jpeg, image/jpg, image/png" name="image" id="file" style="display: none;"
				on:change={()=>validateImageUpload(event,8000000,'idPreview',(raw)=>imageDataRaw=raw)} >
	    <label for="file" style="cursor: pointer;">Upload Image</label>
	    <img id="idPreview" style="width: 30%" alt=""/>
			<input type="button" value="checkUpload"
				on:click={() => {
					console.log("rawImageDataLength=",imageDataRaw.length);
					apiCall('/upload/',"POST",imageDataRaw)}
				}
				/>
		</div>
*/
