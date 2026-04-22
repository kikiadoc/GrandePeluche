<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo, displayObject, addNotification,
					 markClick, getEpsilon, apiCall, isAdmin, aaaammjjThhmm, jjmmhhmmss, hhmmssms 
				 } from './common.js'
	import { G }  from './privacy.js'
	
	let {
		GBLCTX,
		wsCallComponents,
		pageDesc,
		pseudo,
		pseudoGenre,
		pseudoList,
		webAuth,
		page = $bindable(0),
		pageDone = $bindable([]),
	} = $props();

	const PAGESAISIESLBL = (()=> "P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=> '/'+pageDesc.rootName+'/')()
	const WSETAT =  (()=> pageDesc.rootName+'.etat')()
	
	onMount(() => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// etat des saisies persistantes
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))
	// normalization des saisies persistantes 
	function normalizedSaisies(s) {
		s.debug ??= false
		return s
	}

	// appelé apres mount du component
	async function init() { getConf(); getEtat() }
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true
		if (m.op==WSETAT && m.o) { getEtat(m); return true }
		return false
	}

	// config et etat etc...
	let CONF = $state(null)
	let etat = $state(null)
	let flagDiffusions = $state(false)
	let flagAbonnes = $state(false)
	let flagCategories = $state(false)
	let flagMessages = $state(false)
	let dspAbonne = $state(null)
	let dspMessage = $state(null)

	// reset les flags d'ihm retourne retVal pour positionner le flag a activer
	function resetFlagIhm(retVal) {
		return retVal
	}
	async function getConf() {
		let ret = await apiCall(APIROOT+"conf")
		if (ret.status==200) CONF = ret.o 
	}	
	async function getEtat(wsm) {
		if (!wsm) {
			let ret = await apiCall(APIROOT+"etat")
			if (ret.status==200) etat = ret.o 
		}
		else {
			etat = wsm.o
		}
	}

	// Diffusions
	// Diffusions
	// Diffusions
	function getDiffusionById(id) {
		return etat.diffusions.find( (c)=> c.id==id)
	}
	async function diffusionAdd() {
		let dth = Date.parse(saisies.diffusionDth)
		if (!dth) {
			addNotification("Date Invalide","red",10,"prout-long")
			return
		}
		if (dth< Date.now()+60000) {
			addNotification("Date Trop proche","red",10,"prout-long")
			return
		}
		let ret = await apiCall(APIROOT+"diffusions","POST", { dth: dth, cat: saisies.diffusionCat } )
		if (ret.status==200) etat=ret.o
	}
	async function diffusionDelete(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		let dif = getDiffusionById(id)
		if (!dif) { addNotification("Erreur, id diffusion introuvable:"+id); return }
		if (!confirm("Confirmer la suppression de la diffusion du "+jjmmhhmmss(dif.dth)) ) return
		let ret = await apiCall(APIROOT+"diffusions/"+dif.id,"DELETE")
		if (ret.status==200) etat=ret.o 
	}
	async function diffusionNow(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		let dif = getDiffusionById(id)
		if (!dif) { addNotification("Erreur, id diffusion introuvable:"+id); return }
		let cat = getCategorieByTag(dif.cat)
		if (!cat) { addNotification("Erreur, cat diffusion introuvable:"+dif.cat); return }
		if (!confirm("Confirmer la diffusion immédiate de "+cat.desc+" prévue le "+jjmmhhmmss(dif.dth)) ) return
		let ret = await apiCall(APIROOT+"diffusions/"+dif.id,"GET")
		if (ret.status==200) etat=ret.o 
	}
	// Categories
	// Categories
	// Categories
	function getCategorieByTag(tag) {
		return etat.categories.find( (c)=> c.tag==tag)
	}
	async function categorieAdd(ev) { 
		if (!saisies.catTag || saisies.catTag.length!=CONF.CATTAGLEN) {
			addNotification("Tag invalide (3 chars)")
			return
		}
		if (getCategorieByTag(saisies.catTag)) {
			addNotification("Tag déjà utilisé","red",10,"prout-long")
			return
		}
		let ret = await apiCall(APIROOT+"categories","POST",
														{tag:saisies.catTag, desc: saisies.catDesc, type: saisies.catType  })
		if (ret.status==200) { 
			etat=ret.o
			saisies.catTag=null; saisies.catDesc=null; saisies.messageCats=[]
		}
	}
	async function categorieDelete(ev) {  
		let tag = ev.currentTarget.getAttribute("gpTag")
		if (!tag || tag.length!=3) { addNotification("Erreur valeur tag:"+tag,"red",30); return }
		if (!confirm("Confirme la suppression de la catégorie "+tag)) return
		let ret = await apiCall(APIROOT+"categories","DELETE",{ tag:tag })
		if (ret.status==200) { etat=ret.o;  saisies.messageCats=[] }
	}
	// messages
	// messages
	// messages
	function getMessageByDesc(desc) {
		return etat.messages.find( (m)=> m.desc==desc)
	}
	function getMessageById(id) {
		return etat.messages.find( (m)=> m.id==id)
	}
	function messageBuild() {
		let desc = saisies.messageDesc
		let cat = saisies.messageCat
		let contenu = saisies.messageContenu
		if (!desc || desc.length > CONF.MSGDESCLEN) {
			addNotification("Description invalide ou trop longue","red",10,"prout-long")
			return null
		}
		if (getMessageByDesc(desc)) { 
			addNotification("Un message existe dejà avec cette description","red",10,"prout-long")
			return null
		}
		return { desc: desc, cat: cat, contenu: contenu }

	}
	async function messageTest() {
		let mBody = messageBuild()
		if (!mBody) return
		let ret = await apiCall(APIROOT+"msgTest","POST",mBody)
		if (ret.status==200) { etat=ret.o } 
	}
	async function messageAdd() {
		let mBody = messageBuild()
		if (!mBody) return
		
		let ret = await apiCall(APIROOT+"messages","POST",mBody)
		if (ret.status==200) { etat=ret.o } 
	}
	async function messageDelete(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		if (!id) { addNotification("Erreur message id:"+id,"red",30); return }
		let msg = getMessageById(id)
		if (!msg) { addNotification("Erreur message introuvable id:"+id,"red",30); return }
		if (!confirm("Confirme la suppression du message '"+msg.desc+"' (id:"+id+")" )) return
		let ret = await apiCall(APIROOT+"messages/"+id,"DELETE")
		if (ret.status==200) { etat=ret.o; }
	}
	async function messageHistory(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		if (!id) { addNotification("Erreur message id:"+id,"red",30); return }
		addNotification("TODO Necessitera un postFetch sur tblEnv en prod id="+id,"orange",10)
		let msg = getMessageById(id)
		dspMessage = msg
	}

	// abonnes
	// abonnes
	// abonnes
	function getAbonneById(id) {
		return etat.abonnes.find( (a)=> a.id==id)
	}
	async function abonneAdd(ev) {
		let ret = await apiCall(APIROOT+"abonnes","POST",
			{p: saisies.abonnePrenom, n: saisies.abonneNom, m: saisies.abonneMonde,
			 cat: saisies.abonneCat, url:saisies.abonneUrl, role:saisies.abonneRole})
		if (ret.status==200) { etat=ret.o; }
	}
	async function abonneDelete(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		if (!id) { addNotification("Erreur abonne id:"+id,"red",30); return }
		let abo = getAbonneById(id)
		if (!abo) { addNotification("Erreur search abonne id:"+id,"red",30); return }
		if (!confirm("Confirme la suppression de l'abonné "+abo.nomHook+"(#"+abo.id+")")) return
		let ret = await apiCall(APIROOT+"abonnes/"+id,"DELETE")
		if (ret.status==200) { etat=ret.o; }
	}
	async function abonneHistory(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		if (!id) { addNotification("Erreur abonne id:"+id,"red",30); return }
		addNotification("TODO Necessitera un postFetch sur tblEnv en prod id="+id,"orange",10)
		let abo = getAbonneById(id)
		dspAbonne = abo
	}
	/////////////////////////////////////////////////////////////////////////////////////////////
	// ADMIN TEST
	/////////////////////////////////////////////////////////////////////////////////////////////
	async function admEffaceHistorique(ev) {
		if (!confirm('CONFIRMER Effacer les historiques')) return
		let ret = await apiCall(APIROOT+"xrefs",'DELETE')		
		if (ret.status==200) { etat=ret.o }
	}
	async function admEffaceTout(ev) {
		if (!confirm('CONFIRMER Effacer TOUT')) return
		let ret = await apiCall(APIROOT+"all",'DELETE')		
		if (ret.status==200) { etat=ret.o }
	}
	async function admDefTestMsg(ev) {
		if (!confirm("CONFIRMER générer Messages de test (LONG, ATTENDRE LA FIN")) return
		addNotification ("admDefTestMsg commencée","green",30)
		let ret=null 
		let prefix= "TST "+hhmmssms(Date.now())+"-"
		for (let i=0; i< 100; i++) {
			let content= '{ "embeds": [ { "color": 256, "footer": { "text": "test' + i + '"}}]}'
			let mBody = { desc: prefix+i, cat: "tst", contenu: content, noDiscord: true }
			ret = await apiCall(APIROOT+"messages","POST",mBody)
			if (ret.status!=200) break
		}
		etat = ret.o
		addNotification ("Définition admDefTestMsg terminée","green",30)
	}
	async function admDelTestMsg(ev) {
		if (!confirm("Supprimer tous les messages (LONG, ATTENDRE LA FIN")) return
		addNotification ("admDelTestMsg commencée","green",30)
		let ret=null 
		for (let i=0; i < etat.messages.length; i++) {
			ret = await apiCall(APIROOT+"messages/"+etat.messages[i].id,"DELETE")
			if (ret.status!=200) break
		}
		etat = ret.o
		addNotification ("admDelTestMsg terminée","green",30)
	}
	async function admDefTestAbo(ev) {
		
	}
</script>
<style>
</style>
<!-- svelte-ignore element_invalid_self_closing_tag -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div>
	{#if true}
		<div class="adminCadre">
			ADMIN:
			<input type="button" value="dspConfig" onclick={() => displayObject(CONF) } />
			<input type="button" value="dspEtat" onclick={() => displayObject(etat) } />
			<input type="button" value="DefTestMsg" onclick={admDefTestMsg} />
			<input type="button" value="ClrTestMsg" onclick={admDelTestMsg} />
			<input type="button" value="EffaceHistorique" onclick={admEffaceHistorique} />
			<input type="button" value="DELETEALL" onclick={admEffaceTout} />
		</div>
	{/if}
	<div>Gestion des messages multidiscord à diffusion différée</div>
	{#if CONF && etat}
		<div>
			<div style="cursor:pointer" onclick={()=> flagDiffusions= resetFlagIhm(!flagDiffusions)} role="button">
				{#if flagDiffusions}⏬{:else}👉{/if}Diffusions ({etat.diffusions.length}/{CONF.DIFNBMAX}) 
			</div>
			{#if flagDiffusions}
				<div class="adminCadre papier">
					<table>
						<tbody>
							{#each etat.diffusions as diffusion,i}
								{@const cat = getCategorieByTag(diffusion.cat)}
								{@const cls= (cat)? "cGreen": "cRed"}
								<tr class={cls}>
									<td class="petit">@{diffusion.id}</td>
									<td>{jjmmhhmmss(diffusion.dth, true)}</td>
									<td class="resTd">{cat?.desc || "Invalide"}</td>
									<td>{diffusion.pseudo}</td>
									<td style="cursor:pointer" gpId={diffusion.id} onclick={diffusionNow}>⚡</td>
									<td style="cursor:pointer" gpId={diffusion.id} onclick={diffusionDelete}>🗑</td>
								</tr>
							{/each}
						</tbody>
					</table>
					{#if !etat.diffusions.length}
						<div>Aucune diffusion prévue</div>
					{/if}
					{#if etat.diffusions.length < CONF.DIFNBMAX}
						<div class="adminCadre papier"> 
							<div>
								Envoi à:
								<input type="datetime-local" bind:value={saisies.diffusionDth}
									min={aaaammjjThhmm(Date.now()+10*60000)} max={aaaammjjThhmm(Date.now()+31*24*3600*1000)} />
								<select bind:value={saisies.diffusionCat}>
									{#each etat?.categories as categorie,i}
										<option value={categorie.tag}>{categorie.desc}</option>
									{/each}
								</select>
								<input type="button" onclick={diffusionAdd} value="Ajouter" />
							</div>
						</div>
					{:else}
						<div class="cRed">Limite de nombre de diffusions atteinte</div>
					{/if}
				</div>
			{/if}
			
			<div style="cursor:pointer" onclick={()=> flagMessages = resetFlagIhm(!flagMessages)} role="button">
				{#if flagMessages}⏬{:else}👉{/if}Messages ({etat.messages.length}/{CONF.MSGNBMAX})
			</div>
			{#if flagMessages}
				<div class="adminCadre papier">
					<div>
						🔎
						<select bind:value={saisies.messageFilterCat}>
							{#each etat.categories as cat,i}
								<option value={cat.tag}>{cat.desc}</option>
							{/each}
						</select>
						🔎
						<input type="text" bind:value={saisies.messageSearch} />
					</div>
					<hr />
					<table>
						<tbody>
							{#each etat.messages as m,i}
								{@const cat = getCategorieByTag(m.cat)}
								<tr>
									<td class="petit">@{m.id}</td>
									<td class="resTd">{cat?.desc || "Supprimée"}</td>
									<td class="resTd">{m.desc}</td>
									<td style="cursor:pointer" gpId={m.id} onclick={messageHistory}>👀</td>
									<td style="cursor:pointer" gpId={m.id} onclick={messageEdit}>✏️</td>
									<td style="cursor:pointer" gpId={m.id} onclick={messageDelete}>🗑</td>
								</tr>
							{/each}
						</tbody>
					</table>
					<hr />
					{#if etat.messages.length >= CONF.MSGNBMAX}
						<div class="cRed">Limite de messages atteinte</div>
					{:else}
						<div class="adminCadre">
							<div>
								Catégories:
								<select bind:value={saisies.messageCat}>
									{#each etat.categories as cat,i}
										<option value={cat.tag}>{cat.desc}</option>
									{/each}
								</select>
							</div>
							Description:
							<input type="text" bind:value={saisies.messageDesc} />
							<br/>
							<textarea rows=10 cols=80 bind:value={saisies.messageContenu}></textarea>
							<br/>
							<input type="button" onclick={messageTest} value="Tester" />
							<input type="button" onclick={messageAdd} value="Ajouter" />
						</div>
					{/if}
				</div>
			{/if}
	
			<div style="cursor:pointer" onclick={()=> flagCategories = resetFlagIhm(!flagCategories)} role="button">
				{#if flagCategories}⏬{:else}👉{/if}Catégories ({etat.categories.length}/{CONF.CATNBMAX})
			</div>
			{#if flagCategories}
				<div class="adminCadre papier">
					<table>
						<tbody>
							{#each etat?.categories as categorie,i}
								<tr>
									<td class="resTd">{categorie.tag}</td>
									<td class="resTd">{categorie.desc}</td>
									<td class="resTd">{categorie.type}</td>
									<td class="resTd">{categorie.pseudo},{jjmmhhmmss(categorie.dth)}</td>
									<td>
										<div style="cursor:pointer" gpTag={categorie.tag} onclick={categorieDelete}>🗑</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
					{#if !etat.categories.length}
						<div>Aucune catégorie définie</div>
					{/if}
					<hr />
					{#if etat.categories.length < CONF.CATNBMAX}
						<div class="adminCadre papier">
							<div>
								<input bind:value={saisies.catTag} type="text" size=3 placeholder="Tag"/>
								<input bind:value={saisies.catDesc} type="text" size=20 placeholder="Description"/>
								<select bind:value={saisies.catType}>
									{#each CONF.CATTYPES as ct,i}
										<option value={ct.t}>{ct.d}</option>
									{/each}
								</select>
								<input type="button" value="Ajouter" onclick={categorieAdd}/>
							</div>
						</div>
					{:else}
						<div class="cRed">Limite de catégories atteinte</div>
					{/if}
				</div>
			{/if} 
			
			<div style="cursor:pointer" onclick={()=> flagAbonnes = resetFlagIhm(!flagAbonnes)} role="button">
				{#if flagAbonnes}⏬{:else}👉{/if}Abonnés ({etat.abonnes.length}/{CONF.ABONBMAX})
			</div>
			{#if flagAbonnes}
				<div class="adminCadre papier">
					{#if etat.abonnes.length}
						<table>
							<tbody>
								{#each etat.abonnes as abonne,i}
									<tr>
										<td class="petit">#{abonne.id}</td>
										<td class="resTd">{abonne.nomHook}</td>
										<td>{#if abonne.role}@{abonne.role}{/if}</td>
										<td>{getCategorieByTag(abonne.cat)?.desc}</td>
										<td style="cursor:pointer" gpId={abonne.id} onclick={abonneHistory}>👀</td>
										<td style="cursor:pointer" gpId={abonne.id} onclick={abonneDelete}>🗑</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<div>Aucun abonné défini</div>
					{/if}
					<hr />
					<div>
						<input type="url" bind:value={saisies.abonneUrl} minlength=122 size=40
							placeholder="https://discord.com/api/webhooks/........."
							pattern="https://discord.com/api/webhooks/.*" />
						<br/>
						Catégorie:<select bind:value={saisies.abonneCat}>
							{#each etat?.categories as categorie,i}
								<option value={categorie.tag}>{categorie.desc}</option>
							{/each}
						</select>
						Rôle:@<input type="text" bind:value={saisies.abonneRole} maxlength=20 size=10/>
						<br/>
						<input type="button" onclick={abonneAdd} value="Ajouter" />
					</div>
				</div>
			{/if}
		</div>
	{/if}
	
	{#if dspMessage}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspMessage=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Détail du message {dspMessage.desc}</div>
					<div class="adminCadre">
						<div>#Id: {dspMessage.id}</div>
						<div>Définition: {jjmmhhmmss(dspMessage.dth,true)}</div>
						<div>Catégorie: {getCategorieByTag(dspMessage.cat)?.desc} ({dspMessage.cat})</div>
					</div>
					<div>Historique d'utilisation de ce message (total:{dspMessage.tblEnv.length})</div>
					<hr/>
					<table class="resTable"><tbody>
						{#each dspMessage.tblEnv as env,i}
							{@const abo=getAbonneById(env.id)}
							<tr>
								<td >@{abo?.id}</td>
								<td class="resTd" >{abo?.nomHook || "Supprimé"}</td>
								<td >{jjmmhhmmss(env.dth)}</td>
							</tr>
						{/each}
					</tbody></table>
				</div>
			</div>
		</div>
	{/if}
	
	{#if dspAbonne}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspAbonne=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Détail de l'abonné {dspAbonne.nomHook}</div>
					<div class="adminCadre">
						<div>#Id: {dspAbonne.id}</div>
						<div>Inscription: {jjmmhhmmss(dspAbonne.dth,true)}</div>
						<div>Catégorie: {getCategorieByTag(dspAbonne.cat)?.desc} ({dspAbonne.cat})</div>
						<div>@Role: {dspAbonne.role || "aucun"}</div>
					</div>
					<div>Historiques des messages (total:{dspAbonne.tblEnv.length})</div>
					<hr/>
					<table class="resTable"><tbody>
						{#each dspAbonne.tblEnv as env,i}
							{@const msg=getMessageById(env.id)}
							<tr>
								<td >@{env.id}</td>
								<td class="resTd" >{msg?.desc || "Supprimé"}</td>
								<td >{jjmmhhmmss(env.dth)}</td>
							</tr>
						{/each}
					</tbody></table>
				</div>
			</div>
		</div>
	{/if}
</div>
<!-- page Pcodex.svelte -->
