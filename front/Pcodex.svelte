<script>
	import { onMount, onDestroy  } from 'svelte';
	import { loadIt, storeIt, scrollPageToTop, displayInfo, displayObject, addNotification,
					 markClick, getEpsilon, apiCall, apiCallExtern,
					 isAdmin, aaaammjjThhmm, jjmmhhmmss, hhmmssms, isNumeric,
					 reviver
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
	} = $props()

	const PAGESAISIESLBL = (()=> "P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=> '/'+pageDesc.rootName+'/')() 
	const WSETAT =  (()=> pageDesc.rootName+'.etat')()
	
	onMount(() => { wsCallComponents.add(myWsCallback); init() })
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// etat des saisies persistantes 
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>  storeIt(PAGESAISIESLBL,saisies) )
	// normalization des saisies persistantes
	function normalizedSaisies(s) {
		// console.log("normalizedSaisies",s) 
		s.debug ??= false
		s.catDepsTag ??= []
		s.diffusionDateTime= null // force la selection si la page a été quittée
		s.diffusionIter= null // force la selection si la page a été quittée
		s.diffusionIterDate= null // force la selection si la page a été quittée
		s.adminMsgCat = null // force la selection si la page a été quittée
		return s
	}
	let diffusionTblDth = $state([]) // dates de diffusion répétée

	// appelé apres mount du component
	async function init() { getConf(); getEtat() }
	
	// appelé apres unmount du component
	let flagStopAll = false
	function reset() { flagStopAll = true	}

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
	let flagDiffusionsAdd = $state(false)
	let flagAbonnesAdd = $state(false)
	let flagCategoriesAdd = $state(false)
	let flagMessagesAdd = $state(false)
	let flagReporting = $state(false)
	let flagConfig = $state(false)
	let dspAbonne = $state(null)
	let dspMessageEdit = $state(null)
	let dspMessageSend = $state(null)

	// reset les flags d'ihm retourne retVal pour positionner le flag a activer
	function resetFlagIhm(retVal) {
		return retVal
	}
	async function getConf() {
		// console.log("getConf")
		let ret = await apiCall(APIROOT+"conf")
		if (ret.status==200) CONF = ret.o 
	}	
	async function getEtat(wsm) {
		// console.log("getEtat")
		if (!wsm) {
			let ret = await apiCall(APIROOT+"etat")
			if (ret.status==200) etat = ret.o 
		}
		else {
			etat = wsm.o
		}
	}
	//////////////////////////////////////////////////////////// 
	////////////////////////////////////////////////////////////
	function pretty(contenu) {
		let vJson = contenuValidation(contenu,true) 
		return (vJson)? vJson : contenu
	}
	// validation d'un contenu
	// Attention, contenuValidation retourne un string ou un stringify de la version modifiée
	// contenu est un string
	function contenuValidation(contenu,upateContenu) {
		try { 
			let ctn = JSON.parse(contenu)
			console.log("contenuValidation",ctn)
			if (ctn.content) {
				addNotification("Le contenu ne doit pas inclure un 'content'","red",10,"prout-long")
				if (!upateContenu) return null
				delete ctn.content
			}
			if (ctn.attachments) {
				addNotification("Le contenu ne doit pas inclure un 'attachment'","red",10,"prout-long")
				if (!upateContenu) return null
				delete ctn.attachments
			}
			if (ctn.components) {
				addNotification("Le contenu ne doit pas inclure un 'component'","red",10,"prout-long")
				if (!upateContenu) return null
				delete ctn.components
			}
			if (ctn.webhook_id) {
				addNotification("Le contenu ne doit pas inclure un 'webhook_id'","red",10,"prout-long")
				if (!upateContenu) return null
				delete ctn.webhook_id
			}
			if (!ctn.embeds) {
				addNotification("Le contenu doit inclure au moins un 'embeds'","red",10,"prout-long")
				return null
			}
			return (upateContenu)? JSON.stringify(ctn,null,2) : contenu
		}
		catch(e) { 
			displayInfo({ 
				titre:"Erreur de syntaxe dans le contenu", ding: "prout-long",
				body: [ e.message ],
				trailer: "Corrige le contenu du message"
			})
			return null
		}
	}
	////////////////////////////////////////////////////////////
	// Diffusions 
	// Diffusions
	// Diffusions
	////////////////////////////////////////////////////////////
	function getDiffusionById(id) {
		return etat.diffusions.find( (c)=> c.id==id)
	}
	function getDiffusionByDth(dth) {
		return etat.diffusions.find( (c)=> c.dth==dth)
	}
	function diffusionRecalc() {
		diffusionTblDth = [] // recalcul systématique
		let dth = Date.parse(saisies.diffusionDateTime)
		if (!dth) {	addNotification("Date Invalide","red",10,"prout-long"); return null }
		if (dth< Date.now()+60000) { addNotification("Date trop proche ou dépassée","red",10,"prout-long"); return null }
		let cat=saisies.diffusionCat
		// date disponible ? 
		if (getDiffusionByDth(dth)) { addNotification("Diffusion déjà prévue à cette date","red",10,"prout-long"); return null }
		// Date de diffusion ok, teste si répétition
		if (saisies.diffusionIter && saisies.diffusionIterType && saisies.diffusionIterDate) {
			let iterDate = new Date(dth)
			let iterDateFin = new Date(Date.parse(saisies.diffusionIterDate)+24*3600*1000) // début du jour suivant
			let iterNb = 0
			while (iterNb < CONF.DIFITERMAX) {
				switch(saisies.diffusionIterType) {
					case "J":	iterDate.setDate(iterDate.getDate()+1); break;
					case "S":	iterDate.setDate(iterDate.getDate()+7);	break;
					case "M":	iterDate.setMonth(iterDate.getMonth()+1);	break;
					default: iterNb = CONF.DIFITERMAX	// Si type invalide, annule l'itération 
				}
				// Ajoute l'iterDate dans la liste des difusions si la date est avant la date de fin
				if ( (iterNb < CONF.DIFITERMAX) && (iterDate.valueOf() < iterDateFin.valueOf()) ) {
					diffusionTblDth.push(iterDate.valueOf())
				 }
				iterNb++
			}
		}
		return { dth:dth, cat:cat, rep:diffusionTblDth }
	}
	async function diffusionAdd() {
		let prm = diffusionRecalc()
		if (!prm) return 
		flagDiffusionsAdd=null
		let ret = await apiCall(APIROOT+"diffusions","POST", prm )
		if (ret.status==200) etat=ret.o
	}
	async function diffusionDelete(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		let dif = getDiffusionById(id)
		if (!dif) { addNotification("Erreur, id diffusion introuvable:"+id); return }
		if (!confirm("Confirmer la suppression de la diffusion prévue "+jjmmhhmmss(dif.dth)) ) return
		let ret = await apiCall(APIROOT+"diffusions/"+dif.id,"DELETE")
		if (ret.status==200) etat=ret.o 
	}
	async function diffusionDeleteRep(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		if (!confirm("Confirmer la suppression de diffusions répétées #"+id)) return  
		let ret = await apiCall(APIROOT+"diffusions/"+id,"DELETE")
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
	////////////////////////////////////////////////////////////
	// Categories
	// Categories
	// Categories
	////////////////////////////////////////////////////////////
	function getCategorieLblByType(type) {
		return CONF.CATTYPES.find( (c)=> c.t==type)
	}
	function getCategorieByTag(tag) {
		return etat.categories.find( (c)=> c.tag==tag)
	}
	function categorieValidation(m,newCat) {
		if (!m.tag || m.tag.length!=CONF.CATTAGLEN) {
			addNotification("Tag invalide (CONF.CATTAGLEN chars)")
			return
		}
		if ( !m.desc || m.desc.length > CONF.CATDESCLEN) {
			addNotification("Description invalide ou trop longue:"+m.desc,"red",10,"prout-long")
			return null
		}
		if (newCat && getCategorieByTag(m.tag)) {
			addNotification("Catégorie existante","red",10,"prout-long")
			return null
		}
		if (!newCat && !getCategorieByTag(m.tag)) {
			addNotification("Catégorie inexistante","red",10,"prout-long")
			return null
		}
		if (!contenuValidation(m.welcome)) return null
		return m 
	}
	
	// teste une categorie en l'envoyant sur discord
	async function categorieTest(ev,nouveau=true) { 
		let c = {tag:saisies.catTag, desc: saisies.catDesc, type: saisies.catType,
						 deps: saisies.catDepsTag, welcome: saisies.catWelcome, ale: saisies.catAle}
		if (!categorieValidation(c,nouveau)) return
		let ret = await apiCall(APIROOT+"catTest","POST",c)
		if (ret.status==200) { messageGoDiscord(); return }
	}
	async function categorieAdd(ev) {
		let c = {tag:saisies.catTag, desc: saisies.catDesc, type: saisies.catType,
						 deps: saisies.catDepsTag, welcome: saisies.catWelcome, ale: saisies.catAle}
		if (!categorieValidation(c,true)) return
		let ret = await apiCall(APIROOT+"categories","POST", c)
		if (ret.status==200) { messageGoDiscord(); flagCategoriesAdd=null; etat=ret.o }
	}
	async function categorieDelete(ev) {  
		let tag = ev.currentTarget.getAttribute("gpTag")
		if (!tag || tag.length!=3) { addNotification("Erreur valeur tag:"+tag,"red",30); return }
		if (!confirm("Confirme la suppression de la catégorie "+tag)) return
		let ret = await apiCall(APIROOT+"categories","DELETE",{ tag:tag })
		if (ret.status==200) { etat=ret.o;  saisies.messageCats=[] }
	}
	////////////////////////////////////////////////////////////
	// messages
	// messages
	// messages
	////////////////////////////////////////////////////////////
	function getMessageByDesc(desc) {
		return etat.messages.find( (m)=> m.desc==desc)
	}
	function getMessageById(id) {
		return etat.messages.find( (m)=> m.id==id)
	}
	function messageGoDiscord(msg) {
		displayInfo({
			title: "Vérification sur Discord", ding:"call-to-attention", back:"stars",
			body: [
				"J'ai publié une version de ce message dans le canal Discord de vérification",
				"Vérifie que tout est satisfaisant"
			]
		})
	}
	function messageValidation(m,newMsg) {
		if ( !m.desc || m.desc.length > CONF.MSGDESCLEN) {
			addNotification("Description invalide ou trop longue:"+m.desc,"red",10,"prout-long")
			return null
		}
		if (!getCategorieByTag(m.cat)) {
			addNotification("Catégorie invalide","red",10,"prout-long")
			return null
		}
		if (newMsg && getMessageByDesc(m.desc)) {
			addNotification("Un message existe dejà avec cette description","red",10,"prout-long")
			return null
		}
		if (!contenuValidation(m.contenu)) return null
		return m
	}
	// teste un message en l'envoyant sur discord
	async function messageTest(msg,nouveau) {
		if (!messageValidation(msg,nouveau)) return 
		let ret = await apiCall(APIROOT+"msgTest","POST",msg)
		if (ret.status==200) { messageGoDiscord(); return }
	}
	async function messageAddTest() {
		let msg = { desc: saisies.messageDesc, cat: saisies.messageCat, contenu: saisies.messageContenu  }
		if (!messageValidation(msg,true)) return
		let ret = await apiCall(APIROOT+"msgTest","POST",msg)
		if (ret.status==200) { messageGoDiscord(); return }
	}
	async function messageAdd() {
		let msg = { desc: saisies.messageDesc, cat: saisies.messageCat, contenu: saisies.messageContenu  }
		if (!messageValidation(msg,true)) return
		flagMessagesAdd=null
		let ret = await apiCall(APIROOT+"messages","POST",msg)
		switch (ret.status) {
			case 200: etat=ret.o; break 
			case 202: displayInfo({ ding:"prout-long", body: [ret.msg] })
		}
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
	async function messageEdit(ev) {
		let id = ev.currentTarget.getAttribute("gpId") 
		if (!id) { addNotification("Erreur message id:"+id,"red",30); return }
		let ret = await apiCall(APIROOT+"messages/"+id,"GET") 
		if (ret.status!=200) { addNotification("Erreur Recuperation message id:"+id,"red",30); return }
		dspMessageEdit = { ...ret.o, contenu: JSON.stringify(ret.o.contenu,null,2) }
	}
	async function messageUpdate(msg) {
		if (!messageValidation(msg,false)) return 
		let ret = await apiCall(APIROOT+"messages/"+msg.id,"PATCH", msg)
		if (ret.status!=200) { addNotification("Erreur mise à jour du message id:"+msg.id,"red",30); return }
		dspMessageEdit = null
		etat=ret.o
	}

	////////////////////////////////////////////////////////////
	// abonnes
	// abonnes
	// abonnes
	////////////////////////////////////////////////////////////
	function getAbonneById(id) {
		return etat.abonnes.find( (a)=> a.id==id)
	}
	async function abonneAdd(ev) {
		// Verif des parametres
		if (saisies.typeRoleId=="2" && !isNumeric(saisies.roleId)) {
			displayInfo({ back: "papier", ding:"prout-long",
				body: [ "Un roleID est numérique","Pour connaitre le roleId, consulte les tutos sur Internet"]	})
			return
		}

		let ret = await apiCall(APIROOT+"abonnes","POST",
			{
				cat: saisies.abonneCat, url:saisies.abonneUrl,
				roleType:saisies.typeRoleId, roleId: saisies.roleId,
				tag: saisies.abonneTag, bypass: saisies.abonneBypass
			})
		switch (ret.status) {
			case 200: etat=ret.o; break 
			case 202: displayInfo({ ding:"prout-long", body: [ret.msg]})
		}
	}
	async function abonneDelete(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		if (!id) { addNotification("Erreur abonne id:"+id,"red",30); return }
		let abo = getAbonneById(id)
		if (!abo) { addNotification("Erreur search abonne id:"+id,"red",30); return }
		let confirmTxt = "Confirme la suppression de l'abonné "+abo.tag+"(#"+abo.id+")"
		if (abo.id==abo.root) confirmTxt += " et de ses dépendances"
		if (!confirm(confirmTxt)) return
		let ret = await apiCall(APIROOT+"abonnes/"+id,"DELETE")
		if (ret.status==200) { etat=ret.o }
	}
	async function abonneView(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		let abo = getAbonneById(id)
		if (!abo) { addNotification("Erreur search abonne id:"+id,"red",30); return }
		dspAbonne = abo
	}
	async function abonneMessage(ev) {
		let id = ev.currentTarget.getAttribute("gpId")
		dspMessageSend = { abo: getAbonneById(id) } 
	}
	async function abonneMessageTest(ev) {
		let ret = await apiCall(APIROOT+"abonneMessage","POST",
														{ op:"test", aboId:dspMessageSend.abo.id, texte:saisies.admMessageSend  })
		if (ret.status==200) addNotification("Message de test envoyé, voir sur Discord")
	}
	async function abonneMessageSend(ev) {
		let ret = await apiCall(APIROOT+"abonneMessage","POST",
														{ op:"send", aboId:dspMessageSend.abo.id, texte:saisies.admMessageSend  })
		if (ret.status==200) {
			addNotification("Message d'admin envoyé")
			dspMessageSend = null
		}
	}
	////////////////////////////////////////////////////////////
	// report
	// report
	// report
	////////////////////////////////////////////////////////////
	let rawReport = $state(null)
	let dspReactCount = $state(null)
	let dspReactTotal = $state(null)
	let dspReactEcheance = $state(null)
	async function calcReport() {
		let ret = await apiCall(APIROOT+"report")
		if (ret.status != 200) throw new Error("Erreur lors du fetch du report")
		rawReport = ret.o
		// Balayage de tous les elements du report pour résultat
		rawReport.allByDth = []
		// report.allByMsg = new Map() 
		// report.allByAbo = new Map()
		// Ajout dans l'export
		rawReport.envByAbo.forEach ( (tblEnv,aboId) => {
			let abo = getAbonneById(aboId)
			tblEnv.forEach( (e) => {
				// complete l'element
				e.a = aboId
				e.abo = abo
				e.msg = getMessageById(e.m)
				e.cat = getCategorieByTag(abo?.cat)
				// ajout dans Tableaux
				rawReport.allByDth.push( e ) // tableau par dth
			})
		})
		// tri de allByDth
		rawReport.allByDth.sort( (a,b) => b.d- a.d ) // tri descroissant  
		// commit
		return true
	}
	async function reportCSV() {
		let report = {}
		report.export = []
		report.export.push('TYPECOL,TYPE,DESC\n')
		CONF.CATTYPES.forEach( (t) => { report.export.push('TYPE,'+t.t+','+t.d+'\n') } )
		report.export.push('\nCATCOL,ID,PSEUDO,TIMESTAMP,TAG,DESC,TYPE,DEP,ALERTE\n')
		etat.categories.forEach( (c) => {report.export.push( 'CAT,'+c.id+',"'+c.pseudo+'",'+c.dth+','+c.tag+','+c.desc+','+c.type+','+(c.dep||'')+','+c.ale+'\n')})
		report.export.push('\nMSGCOL,ID,PSEUDO,TIMESTAMP,CAT,DESC\n')
		etat.messages.forEach( (c) => { report.export.push( 'MSG,'+c.id+',"'+c.pseudo+'",'+c.dth+','+c.cat+','+c.desc+'\n') })
		report.export.push('\nABOCOL,ID,CAT,TAG\n')
		etat.abonnes.forEach( (a) => { report.export.push( 'ABO,'+a.id+','+a.cat+','+a.tag+'\n') })
		report.export.push('\nDIFCOL,ABOID,MSGID,CATID,TIMESTAMP,DISCORDID,ABOTAG,MSGDESC,RESTE,GLOBAL,REACTIONS...\n')
		rawReport.allByDth.forEach ( (e) => {
			// console.log("*******",e)
			let strDif = 'DIF,'+e.a+','+e.m+','+e.abo?.cat+','+e.d+',"'+e.sId+'",'+e.abo?.tag+','+e.msg?.desc+','+e.dis+','+e.res
			if (e.reac) {
				strDif += ','+e.reac.t
				e.reac.e.forEach( (em) => { strDif += ',"'+em.n+'",'+em.nb })
			}
			else {
				strDif += ','
			}
			report.export.push( strDif+'\n')
		})
		if (window.showSaveFilePicker) {
			try {
				displayInfo({back:"papier", ding: 'ding-ding', autoClose: 5, body:[
					"Traitement en cours, patiente"
				]})
				let reportBlob = new Blob(report.export,{type:"text/csv"})
				const newHandle = await window.showSaveFilePicker(
					{suggestedName:"GrandePelucheReport.csv",startIn:"downloads"})
				const writableStream = await newHandle.createWritable();
				await writableStream.write(reportBlob);
				await writableStream.close()
				displayInfo({back:"stars", ding: 'call-to-attention', body:[
					"Tu as enregistré le rapport "+newHandle.name,
					"Il se trouve normalement dans tes téléchargements.",
					"Ouvre le dans ton tableur" 
				]})
			}
			catch(e) {
				displayInfo({titre:"Erreur de génération du rapport", ding:"explosion", back:"rouge",
										 body: [e.toString()] } )
			}
		}
		else {
			displayInfo({body:[
				"La fonction de rapport technique utilise des fonctions expérimentales",
				"Hélas, la fonction showSaveFilePicker n'est pas disponible sur ton équipement"
			]})
		}
	}

	// Timer pour interne de la loop de recup réactions
	const delayReaction = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

	async function getAllReactions() {
		dspReactCount = 0
		dspReactTotal = rawReport.allByDth.length
		// calcul échéance selon le nombre de requete à faire !! dans saisies pour garder si reload page
		saisies.reactEcheance = Date.now() + dspReactTotal*CONF.DISCORDDELAI + CONF.DISCORDGARDE
		// Boucle while pour eviter le parallèlisme d'un forEach																
		while (dspReactCount < dspReactTotal && !flagStopAll) {
			await delayReaction(CONF.DISCORDDELAI)
			let r = rawReport.allByDth[dspReactCount]
			if (!r) { addNotification("Erreur item null sur fetch réaction "+dspReactCount) ; return}
			r.reac = await getReactions(r.abo?.url,r.sId)
			dspReactCount++
		}
		// Dans tous les cas, on attend DISCORDGARDE ms avant d'autoriser les reactions 
		saisies.reactEcheance = Date.now() + CONF.DISCORDGARDE
		dspReactTotal = null
	}
	async function getReactions(url,sid) {
		let tblR = { t:0, e: [] }
		if (!url || !sid) return tblR
		let u = url+'/messages/'+sid
		let ret = await apiCallExtern(u)
		if (ret.status!=200) {
			console.log("getReaction",url,sid,ret)
			return tblR
		}
		// Parse les réactions
		if (ret.reactions) {
			ret.reactions.forEach( (r) => {
				tblR.t += r.count
				tblR.e.push( { n: r.emoji?.name, nb: r.count } )
			})
		}
		return tblR
	}
	async function reportClick(ev) {
		let dth = Number(ev.currentTarget.getAttribute("gpDth"))
		let aId = ev.currentTarget.getAttribute("gpAboId")
		let mId = ev.currentTarget.getAttribute("gpMsgId")
		let sId = ev.currentTarget.getAttribute("gpSndId")
		let abo = getAbonneById(aId)
		let cat = getCategorieByTag(abo?.cat)
		let msg = getMessageById(mId)
		let tblR = await getReactions(abo?.url,sId)
		let body = [
			"Dif: "+jjmmhhmmss(dth),
			"Cat: "+cat?.desc,
			"Abonné: "+abo?.tag,
			"Message: "+msg?.desc,
			"Discord: "+sId,
			"Réactions:"+tblR.t
		]
		tblR.e.forEach( (e) => { body.push( e.n+":"+e.nb ) } ) 
		displayInfo({
			title: "Détail du message envoyé",
			body: body
		})
	}
	/////////////////////////////////////////////////////////////////////////////////////////////
	// CONFIG 
	/////////////////////////////////////////////////////////////////////////////////////////////
	async function configUpdate(ev) {
		if (!confirm('CONFIRMER Modifier la configuration?')) return
		let ret = await apiCall(APIROOT+"configUpdate",'POST',{
			webHookLog: etat.webHookLog
		})		
		switch (ret.status) {
			case 200: etat=ret.o; break
			default: addNotification("Erreur status="+ret.status+" "+ret.msg,"red",10,"prout-long")
		}
	}
	function adminMsgContenuDefaut(ev) {
		if (!confirm("Reinitialiser le contenu du message d'admin par le contenu par defaut?")) return
		saisies.adminMsgContenu = JSON.stringify(
			{
				"embeds": [
					{
			      "description": "** MODIFIER** Message d’admin de test",
			      "color": 2199693,
			      "thumbnail": {
				      "url": "https://cdn.adhoc.click/STATIC/attention.gif"
			      }
			    }
			  ]
			},null, 2)
	}
	async function adminMsgContenuOp(ev,op) {
		let body = { cat: saisies.adminMsgCat, contenu: saisies.adminMsgContenu }
		let ret = await apiCall(APIROOT+op,'POST',body)
		if (ret.status != 200) { addNotification("Erreur envoi message d'admin","red",10,"explosion") }
	}
	function adminMsgContenuTest(ev) {
		adminMsgContenuOp(ev,"admMsgTest")
	}
	function adminMsgContenuSend(ev) {
		adminMsgContenuOp(ev,"admMsgSend")
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
		let nb = Number(ev.currentTarget.getAttribute("gpNb"))
		for (let i=0; i< nb; i++) {
			let content= '{ "embeds": [ { "color": 256, "footer": { "text": "test' + i + '"}}]}'
			let mBody = { desc: prefix+i, cat: "CDX", contenu: content, noDiscord: true }
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
	async function testCompoSend(ev) {
		let	ret = await apiCall(APIROOT+"admTestCompo","POST",
														{ url: saisies.compoUrl, body: JSON.parse(saisies.compoContenu) })
		displayObject(ret)
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
			<input type="button" value="DefMsg10" gpNb=10 onclick={admDefTestMsg} />
			<input type="button" value="ClrMsg" onclick={admDelTestMsg} />
			<input type="button" value="ClrHisto" onclick={admEffaceHistorique} />
			<input type="button" value="DELETEALL" onclick={admEffaceTout} />
			<label><input type="checkbox" bind:checked={saisies.debug} />Debug</label>
		</div>
	{/if}
	{#if CONF && etat}
		<div {@attach scrollPageToTop}>
			<div>Gestion des messages multidiscord à diffusion différée</div>
			<div style="cursor:pointer" onclick={()=> flagDiffusions= resetFlagIhm(!flagDiffusions)} role="button">
				{#if flagDiffusions}👇{:else}👉{/if}Diffusions ({etat.diffusions.length}/{CONF.DIFNBMAX}) 
			</div>
			{#if flagDiffusions} 
				<div class="adminCadre papier">
					<div>
						Filtre:
						<input type="button" value="↻"
							onclick={()=>{saisies.diffFilterCat=null;saisies.diffFilterOnly=null}} />
						🔎
						<select bind:value={saisies.diffFilterCat}>
							{#each etat.categories as cat,i}
								<option value={cat.tag}>{cat.desc}</option>
							{/each}
						</select>
						<label><input type="checkbox" bind:checked={saisies.diffFilterOnly} />Seulement</label>
					</div>
					<hr />
					<table>
						<tbody>
							{#each etat.diffusions as diffusion,i}
								{@const cat = getCategorieByTag(diffusion.cat)}
								{@const cls= (cat)? "cGreen": "cRed"}
								{@const cls2= (!saisies.diffFilterOnly && saisies?.diffFilterCat==cat?.tag)? "blinkFlag":""}
								{#if !saisies.diffFilterOnly || saisies.diffFilterCat==cat?.tag}
									<tr>
										<td style="font-size: 0.5em">
											#{diffusion.id} 
											<br />
											{diffusion.pseudo}
										</td>
										<td class="resTd">{jjmmhhmmss(diffusion.dth, true)}</td>
										<td class={cls+" "+cls2}>{cat?.desc || "Invalide"}</td>
										<td></td>
										<td style="cursor:pointer" gpId={diffusion.id} onclick={diffusionNow}>⚡</td>
										<td style="cursor:pointer" gpId={diffusion.id} onclick={diffusionDelete}>🗑</td>
										{#if diffusion.rep}
											<td style="cursor:pointer" gpId={diffusion.rep} onclick={diffusionDeleteRep}>
												♻<sup style="font-size: 0.5em">{diffusion.rep}</sup>
											</td>
										{/if}
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
					{#if !etat.diffusions.length}
						<div>Aucune diffusion prévue</div>
					{/if}
					<hr />
					<div style="cursor:pointer" onclick={()=>flagDiffusionsAdd=!flagDiffusionsAdd}>
						{#if flagDiffusionsAdd}👇{:else}👉{/if}Ajouter une diffusion
					</div>
					{#if flagDiffusionsAdd}
						{#if etat.diffusions.length < CONF.DIFNBMAX}
							<div> 
								<div>
									<div onchange={diffusionRecalc}>
										<input type="datetime-local" bind:value={saisies.diffusionDateTime} />
										<select bind:value={saisies.diffusionCat} >
											{#each etat?.categories as categorie,i}
												<option value={categorie.tag}>{categorie.desc}</option>
											{/each}
										</select>
										<label>
											<input type="checkbox" bind:checked={saisies.diffusionIter}/>
											Répeter
										</label>
										{#if saisies.diffusionIter}
											<select bind:value={saisies.diffusionIterType}>
												{#each CONF.DIFITERTYPE as t,i}
													<option value={t.t}>{t.lbl}</option>
												{/each}
											</select>
											jusqu'au
											<input type="date" bind:value={saisies.diffusionIterDate}
												min={aaaammjjThhmm(Date.now()+10*60000)} max={aaaammjjThhmm(Date.now()+31*24*3600*1000)} />
										{/if}
										{#if diffusionTblDth.length}
											<div class="petit">
												<span>Répété {diffusionTblDth.length} fois: </span> 
												{#each diffusionTblDth as dth,i}
													<span style="display:inline-block">
														{new Date(dth).toLocaleDateString(undefined,
															{weekday: "short", month: "numeric", day: "numeric"})
														}
														&nbsp;
													</span>
												{/each}
											</div>
										{/if}
									</div>
									<input type="button" onclick={diffusionAdd} value="Ajouter" />
								</div>
							</div>
						{:else}
							<div class="cRed">Limite de nombre de diffusions atteinte</div>
						{/if}
					{/if}
				</div>
			{/if}
			
			<div style="cursor:pointer" onclick={()=> flagMessages = resetFlagIhm(!flagMessages)} role="button">
				{#if flagMessages}👇{:else}👉{/if}Messages ({etat.messages.length}/{CONF.MSGNBMAX})
			</div>
			{#if flagMessages}
				<div class="adminCadre papier">
					<div>
						Filtre:
						<input type="button" value="↻"
							onclick={()=>{saisies.messageFilterCat=null;saisies.messageSearch=null}} />
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
								{#if (!saisies.messageFilterCat || m.cat==saisies.messageFilterCat) && 
									(!saisies.messageSearch || m.desc.indexOf(saisies.messageSearch)>=0)}
									{@const isValidCat = cat?.desc}
									<tr>
										<td class="petit"><sup>#{m.id}</sup></td>
										<td class={(isValidCat)?"resTd cGreen":"resTd cRed"}>{cat?.desc || m.cat}</td>
										<td class="resTd">{m.desc}</td>
										<td style="cursor:pointer" gpId={m.id} onclick={messageEdit}>✏️</td>
										<td style="cursor:pointer" gpId={m.id} onclick={messageDelete}>🗑</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
					{#if !etat.messages.length}
						<div>Aucun message défini</div>
					{/if}
					<hr />
					<div style="cursor:pointer" onclick={()=>flagMessagesAdd=!flagMessagesAdd}>
						{#if flagMessagesAdd}👇{:else}👉{/if}Ajouter un message
					</div>
					{#if flagMessagesAdd}
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
								<input type="button" onclick={()=>saisies.messageContenu=pretty(saisies.messageContenu)} value="Pretty" />
								<input type="button" onclick={messageAddTest} value="Tester" />
								<input type="button" onclick={messageAdd} value="Ajouter" />
							</div>
						{/if}
					{/if}
				</div>
			{/if}
	
			<div style="cursor:pointer" onclick={()=> flagCategories = resetFlagIhm(!flagCategories)} role="button">
				{#if flagCategories}👇{:else}👉{/if}Catégories d'abonnement ({etat.categories.length}/{CONF.CATNBMAX})
			</div>
			{#if flagCategories}
				<div class="adminCadre papier">
					<table>
						<tbody>
							{#each etat?.categories as categorie,i}
								<tr>
									<td class="petit">
										{categorie.pseudo}
										<br/>
										{jjmmhhmmss(categorie.dth)}
									</td>
									<td class="resTd">{categorie.desc} ({categorie.tag})</td>
									<td class="">
										{((getCategorieLblByType(categorie.type))?.d || "invalide")}
										<br/>
										Seuil d'alerte: {categorie.ale}
									</td>
									{#each categorie.deps as depTag}
										{@const dep = getCategorieByTag(depTag)}
										{@const cls = (dep)? "resTd petit":"resTd petit cRed"}
										<td class={cls}>
											Abo auto:
											<br>
											{(dep)?.desc || "Erreur"} ({depTag})
										</td>
									{:else}
										<td></td>
									{/each}
									<td><div style="cursor:pointer" gpTag={categorie.tag} onclick={categorieDelete}>🗑</div></td>
								</tr>
							{/each}
						</tbody>
					</table>
					{#if !etat.categories.length}
						<div>Aucune catégorie définie</div>
					{/if}
					<hr />
					<div style="cursor:pointer" onclick={()=>flagCategoriesAdd=!flagCategoriesAdd}>
						{#if flagCategoriesAdd}👇{:else}👉{/if}Ajouter une catégorie
					</div>
					{#if flagCategoriesAdd}
						{#if etat.categories.length < CONF.CATNBMAX}
							<div class="adminCadre papier">
								<div>
									<div>
										<input bind:value={saisies.catDesc} type="text" size=20 placeholder="Description"/>
										<select bind:value={saisies.catType}>
											{#each CONF.CATTYPES as ct,i}
												<option value={ct.t}>{ct.d}</option>
											{/each}
										</select>
									</div>
									<div>
										Tag d'abonnement:
										<input type="text" bind:value={saisies.catTag} minlength=3 maxlength=3 size=5 placeholde="___" />
										Seuil d'alerte:
										<select bind:value={saisies.catAle}>
											{#each Array(CONF.ALEMAX) as c,i}
												<option value={i}>{i}</option>
											{/each}
										</select>
									</div>
									<div>
										Si abonnement, abonne aussi à:
										{#each saisies.catDepsTag as catDepTag}
											<span style="cursor: pointer" class="resTd">
													{catDepTag}
													<span onclick={()=> {
														let idx = saisies.catDepsTag.indexOf(catDepTag)
														if (idx >= 0) saisies.catDepsTag.splice(idx,1)
														saisies.catDep=null} }
													>❌️</span>
											</span>
										{/each}
										<select bind:value={saisies.catDep} onchange={()=> {
											if (saisies.catDep) saisies.catDepsTag.push(saisies.catDep)} }>
											{#each etat.categories as c,i}
												{#if !saisies.catDepsTag.includes(c.tag)}
													<option value={c.tag}>{c.desc}</option>
												{/if}
											{/each}
										</select>
									</div>
									
									<div>Message de bienvenue:</div>
									<div><textarea rows=10 cols=80 bind:value={saisies.catWelcome}></textarea></div>
									<input type="button" value="Pretty" onclick={()=>{ saisies.catWelcome= pretty(saisies.catWelcome) }} />
									<input type="button" value="Tester" onclick={categorieTest}/>
									<input type="button" value="Ajouter" onclick={categorieAdd}/>
								</div>
							</div>
						{:else}
							<div class="cRed">Limite de catégories atteinte</div>
						{/if}
					{/if}
				</div>
			{/if} 
			
			<div style="cursor:pointer" onclick={()=> flagAbonnes = resetFlagIhm(!flagAbonnes)} role="button">
				{#if flagAbonnes}👇{:else}👉{/if}Abonnés ({etat.abonnes.length}/{CONF.ABONBMAX})
			</div>
			{#if flagAbonnes}
				<div class="adminCadre papier">
					{#if etat.abonnes.length}
						<table>
							<tbody>
								{#each etat.abonnes as abonne,i}
									<tr>
										<td class="petit">#{abonne.id}<br/>#{abonne.root}</td>
										<td class="resTd">{abonne.tag}</td>
										<td>@{abonne.role || "aucun"}</td>
										<td class="resTd">{getCategorieByTag(abonne.cat)?.desc}</td>
										<td style="cursor:pointer" gpId={abonne.id} onclick={abonneView}>👀</td>
										<td style="cursor:pointer" gpId={abonne.id} onclick={abonneMessage}>
											📢
										</td>
										<td style="cursor:pointer" gpId={abonne.id} onclick={abonneDelete}>
											{#if abonne.id==abonne.root}♻{:else}🗑{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<div>Aucun abonné défini</div>
					{/if}
					<hr />
					<div style="cursor:pointer" onclick={()=>flagAbonnesAdd=!flagAbonnesAdd}>
						{#if flagAbonnesAdd}👇{:else}👉{/if}Ajouter un abonné
					</div>
					{#if flagAbonnesAdd}
						<div>
							<input type="url" bind:value={saisies.abonneUrl} minlength=122 size=40
								placeholder="https://discord.com/api/webhooks/........"
								pattern="https://discord.com/api/webhooks/.*" />
							<br/>
							Catégorie:<select bind:value={saisies.abonneCat}>
								{#each etat?.categories as categorie,i}
									<option value={categorie.tag}>{categorie.desc}</option>
								{/each}
							</select>
							Tag: <input type="text" bind:value={saisies.abonneTag} maxlength=20 size=10 placeholder="guildeDiscord"/>
							<br/>
							@Rôle:
							<label>
								<input type="radio" name="saisieRoleId" value="0" bind:group={saisies.typeRoleId}/>
								aucun
							</label>
							<label>
								<input type="radio" name="saisieRoleId" value="1" bind:group={saisies.typeRoleId}/>
								everyone
							</label>
							<label>
								<input type="radio" name="saisieRoleId" value="2" bind:group={saisies.typeRoleId}/>
								{#if saisies.typeRoleId != "2"}
									roleId
								{:else}
									<input type="text" placeholder="roleId(numérique)" bind:value={saisies.roleId} />
								{/if}
							</label>
							<br/>
							<label>
								<input type="checkbox" bind:checked={saisies.abonneBypass}/>
								Bypass Webhook unique par Guilde Discord
							</label>
							<br/>
							<input type="button" onclick={abonneAdd} value="Ajouter" />
						</div>
					{/if}
				</div>
			{/if}
			
			<div style="cursor:pointer" onclick={()=> flagReporting = resetFlagIhm(!flagReporting)} role="button">
				{#if flagReporting}👇{:else}👉{/if}Reporting
			</div>
			{#if flagReporting}
				<div class="adminCadre papier">
					{#await calcReport()}
						<div class="cOrange blinkMsg">Récupération du rapport et calcul de synthèse en cours...</div>
					{:then e}
						<div class="cOrange">
							Certaines opérations peuvent être lentes (Historique:{rawReport.allByDth?.length})
						</div>
						<div>
							<input type="button" value="Download Tableur" onclick={reportCSV} />
							<input type="button" value="Debug Objet" onclick={()=>displayObject(rawReport)} />
							{#if dspReactTotal}
								<span onclick={markClick} class="infoLink cRed" gpHelp="Progression du fetch réactions">
									Discord: {dspReactCount}/{dspReactTotal}
								</span>
							{:else if saisies.reactEcheance}
								<span onclick={markClick} class="infoLink cRed" gpHelp="Temps de garde pour éviter le ban discord">
									<countdown dth={saisies.reactEcheance} oncdTimeout={()=>saisies.reactEcheance=null}></countdown>
								</span>
							{:else}
								<input type="button" value="Réactions" onclick={getAllReactions} />
							{/if}
								
						</div>
						<table><tbody>
							<tr>
								<td>
									Filtre:
									<input type="button" value="↻"
										onclick={()=>{saisies.reportFilterCat=null;saisies.reportFilterMsg=null;saisies.reportFilterAbo=null}} />
								</td>
								<td>
									<select bind:value={saisies.reportFilterCat}>
									{#each etat.categories as cat,i}
										<option value={cat.tag}>{cat.desc}</option>
									{/each}
									</select>
								</td>
								<td>
									<select bind:value={saisies.reportFilterAbo}>
									{#each etat.abonnes as abo,i}
										<option value={abo.id}>{abo.tag}</option>
									{/each}
									</select>
								</td>
								<td>
									<input type="text" size=15 bind:value={saisies.reportFilterMsg} />
								</td>
								<td>
									<span onclick={markClick} class="infoLink"
										gpHelp="Reste: Nombre message encore diponible pour prochaine diffusion, S: Seuil d'lerte, T: Total des messages">
										R/S/T
									</span>
								</td>
								<td>
									<span onclick={markClick} class="infoLink"
										gpHelp="Les réactions doivent être récupérées localement et ne sont pas disponibles par défaut, Utilise le bouton réactions quand il est disponible">
										Réactions
									</span>
								</td>
							</tr>
							{#each rawReport.allByDth as r}
								{#if
									(!saisies.reportFilterCat || saisies.reportFilterCat==r.cat?.tag) &&
									(!saisies.reportFilterAbo || saisies.reportFilterAbo==r.abo?.id) &&
									(!saisies.reportFilterMsg || r.msg?.desc.indexOf(saisies.reportFilterMsg)>=0)
								}
									{@const cls = (r.cat?.type=="R" && r.res <= r.cat.ale) ? "cRed":"cGreen"}
									{@const cls2 = (r.cat?.desc) ? "resTd cGreen":"resTd cRed"}
									<tr>
										<td>
											{jjmmhhmmss(r.d,true)}
										</td>
										<td class={cls2}>
											{r.cat?.desc || "Supprimée"} <span class="petit">({r.cat?.tag})</span>
										</td>
										<td>
											{r.abo?.tag}<sup>#{r.a}</sup>
										</td>
										{#if r.m}
											<td class="resTd">{r.msg?.desc}<sup>#{r.m}</sup></td>
										{:else}
											<td class="resTd cRed">➥FAMINE</td>
										{/if}
										<td class={cls}>
											{r.res-1}/{r.cat?.ale}/{r.dis}
										</td>
										<td class="resTd">
											{r.reac?.t}
											{#each r.reac?.e as e}
												<span>{e.n}:{e.nb}</span>
											{/each}
										</td>
										<td gpDth={r.d} gpMsgId={r.m} gpAboId={r.a} gpSndId={r.sId} onclick={reportClick}>
											👀
										</td>
									</tr>
								{/if}
							{/each}
						</tbody></table>
					{:catch e}
						<div>Erreur de calcul du report {e.message}</div>
					{/await}
				</div>
			{/if}

			<div style="cursor:pointer" onclick={()=> flagConfig = resetFlagIhm(!flagConfig)} role="button">
				{#if flagConfig}👇{:else}👉{/if}Configuration/Administration
			</div>
			{#if flagConfig}
				<div class="adminCadre papier">
					Broadcast message d'Admin
					<br/>
					<textarea rows=15 cols=80 bind:value={saisies.adminMsgContenu}></textarea>
					<br/>
					<select bind:value={saisies.adminMsgCat}>
						{#each etat.categories as cat,i}
							<option value={cat.tag}>{cat.desc}</option>
						{/each}
					</select>
					<input type="button" value="Reinit" onclick={adminMsgContenuDefaut } />
					<input type="button" value="Pretty" onclick={() => saisies.adminMsgContenu=pretty(saisies.adminMsgContenu) } />
					<input type="button" value="Tester" onclick={adminMsgContenuTest} />
					<input type="button" value="Envoyer" onclick={adminMsgContenuSend} />
					<hr/>
					Modif du WebHook de suivi:
					<br/>
					<input type="url" bind:value={etat.webHookLog} size=60 />
					<input type="button" value=">" onclick={configUpdate} />
				</div>
			{/if}
		</div>
		{#if saisies.debug}
			<hr/>
			<div class="adminCadre papier">
				Test COMPONENT
				<br/>
				<input type="url" bind:value={saisies.compoUrl}/>
				<br/>
				<textarea rows=15 cols=80 bind:value={saisies.compoContenu}></textarea>
				<br/>
				<input type="button" value="Pretty" onclick={() => saisies.compoContenu=JSON.stringify(JSON.parse(saisies.compoContenu),null,2) } />
				<input type="button" value="Envoyer" onclick={testCompoSend} />
			</div>
		{/if}
		<div style="height:60vh" />
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
						<div>Tag de guilde: {dspAbonne.tag}</div>
						<div>Role: {dspAbonne.role || "aucun"}</div>
						<div>Catégorie: {getCategorieByTag(dspAbonne.cat)?.desc} ({dspAbonne.cat})</div>
						<div>DiscordGuild: {dspAbonne.guild}</div>
						<div>DiscordChannel: {dspAbonne.channel}</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if dspMessageEdit} 
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspMessageEdit=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Visualisation ou modification du message</div>
					<div class="adminCadre">
						<div>#Id: {dspMessageEdit.id}</div>
						<div>
							Description:
							<input type="text" bind:value={dspMessageEdit.desc} />
						</div>
						<div>
							Catégorie:
							<select bind:value={dspMessageEdit.cat}>
								{#each etat.categories as cat,i}
									<option value={cat.tag}>{cat.desc}({cat.tag})</option>
								{/each}
							</select>
						</div>
						<div>Par: {dspMessageEdit.pseudo} {jjmmhhmmss(dspMessageEdit.dth,true)}</div>
						<textarea rows=15 cols=80 bind:value={dspMessageEdit.contenu}></textarea>
						<br/>
						<input type="button" value="Pretty" onclick={()=>{ dspMessageEdit.contenu= pretty(dspMessageEdit.contenu) }} />
						<input type="button" value="Tester" onclick={()=>{ messageTest(dspMessageEdit,false) }} />
						<input type="button" value="Modifier" onclick={()=>{ messageUpdate(dspMessageEdit)}} />
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if dspMessageSend} 
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspMessageSend=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>Envoi message Admin à un abonné</div>
					<div class="adminCadre">
						Id: {dspMessageSend.abo.id}
						<br />
						CodexNick: {dspMessageSend.abo.tag}
						<br />
						Texte du message:
						<br />
							<textarea bind:value={saisies.admMessageSend} rows="5" cols="80" placeholder="texte avec markup Discord"></textarea>
						<br />
						<input type="button" value="Tester" onclick={abonneMessageTest} />
						<input type="button" value="Envoyer" onclick={abonneMessageSend}/>
					</div>
				</div>
			</div>
		</div>
	{/if}

</div>

<!-- page Pcodex.svelte -->
