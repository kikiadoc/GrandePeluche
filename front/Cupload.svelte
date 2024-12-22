<script>
	import {addNotification, urlImg} from './storage.js'
	
	/**
	 * @typedef {Object} Props
	 * @property {any} cbImageRaw
	 * @property {number} [maxSize]
	 */

	/** @type {Props} */
	let { cbImageRaw, maxSize = 16000000 } = $props();
	
	// e=event change d'un input type=file
	function validateImageUpload(eventFileInput,tagImg) {
		// console.log(eventFileInput)
		const file = eventFileInput.target.files[0]
		const reader = new FileReader();
		const image = eventFileInput.target.nextElementSibling // <img>
		if (!file || !reader || !image) return addNotification("Erreur interne client sur validateImageUpload","red",60)
		reader.addEventListener("loadstart", () => {
			image.src = urlImg+"sablierAnime.gif"
		}, false);
		reader.addEventListener("load", () => {
			image.src = urlImg+"uploadFile.png"
			const PREFIX='data:image/'
			const raw=reader.result
			// verifs
			// console.log("image size=",raw.length);
			if (reader.result.length > maxSize)
				return addNotification("Image trop grosse (max "+(maxSize/2000000)+' Mégas)',"red",10,'prout-long')
			if (! raw.startsWith(PREFIX))
				return addNotification("Image invalide","red",10,'prout-long')
		  // index des séparateurs
		  const pPointVirg = raw.indexOf(';')
			const pVirg = raw.indexOf(',')
		  // extraction du type et encoding
		  const mimeType = raw.substring(PREFIX.length,pPointVirg)
		  const encoding = raw.substring(pPointVirg+1,pVirg)
			// vérif....
		  if (mimeType!="jpg" && mimeType != "jpeg" && mimeType !="png")
				return addNotification("Image JPG, JPEG, PNG requis","red",10,'prout-long')
			// image OK
		  console.log("image: mime:",mimeType,"encoding:",encoding,"size",reader.result.length);
			image.src = reader.result
			// callback
			cbImageRaw && cbImageRaw(reader.result)
		}, false);
		reader.readAsDataURL(file);
	}
</script>
<style>
	.dropZone {cursor:pointer; width:100% }
	/* .dragOver { outline: 5px solid red } */
</style>

<label>
	<input type="file" accept="image/jpeg, image/jpg, image/png"
		style="display: none"
		onchange={(e)=>validateImageUpload(e,'dspChoixPreview')}
	/>
	<img class="dropZone" alt=""
		ondrop={(e)=>{ 
			console.log('drop',e)
			e.preventDefault();
			e.target.classList.remove("dragOver");
			if (e.dataTransfer.files) {
				let fileInp=e.target.previousElementSibling // <input file>
				fileInp.files = e.dataTransfer.files;
				const event = new Event("change",{ bubbles: false} );
				fileInp.dispatchEvent(event);
			}
		}}
		onpaste={(e)=>{ e.preventDefault(); console.log('paste');
			let fileInp=null // !!!!e.target.previousElementSibling // <input file>
			fileInp.files = e.clipboardData.files;
		}}
		ondragover={(e)=>{ e.preventDefault(); e.target.classList.add("dragOver");}}
		ondragleave={(e)=>{ e.preventDefault(); e.target.classList.remove("dragOver");}}
		src="{urlImg}uploadFile.png"
	/>
</label>

