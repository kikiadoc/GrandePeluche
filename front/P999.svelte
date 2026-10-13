<script>
	import { onMount, onDestroy  } from 'svelte';
	import { rawConsole, urlCdn, hostDesc, urlCdnAI, GBLSTATIC, GBLCONST } from "./ground.svelte.js"
	import { loadIt, storeIt, scrollPageToTop,
					 displayInfo, displayObject, addNotification, playVideo,
					 aaaammjjThhmm,
					 markClick, apiCall, apiCallExtern,
					 isAdmin, isAdminServer, isPrivilege
				 } from './common.js'
	import { G, getConsole }  from './privacy.js'

	let {
		GBLCTX,
		wsCallComponents,
		pageDesc,
		pseudo,
		pseudoGenre,
		pseudoList,
		page = $bindable(0),
		pageDone = $bindable([]),
		webAuth,
		localCtx
	} = $props()

	const PAGEEPIQLBL= (()=>"P"+pageDesc.n+"_epiqStep")()
	const PAGESAISIESLBL = (()=>"P"+pageDesc.n + "_saisies")()
	const APIROOT = (()=>'/'+pageDesc.rootName+'/')()

	onMount(async () => { wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { wsCallComponents.delete(myWsCallback); reset() });

	// Gestion de l'épique 
	let epiqStep = $state(loadIt(PAGEEPIQLBL, 0))
	$effect(()=>storeIt(PAGEEPIQLBL,epiqStep))
	$effect(()=>epiqStepChange(epiqStep))

	// etat des saisies persistantes 
	let saisies = $state(normalizedSaisies(loadIt(PAGESAISIESLBL,{})))
	$effect(()=>storeIt(PAGESAISIESLBL,saisies))

	// appelé apres mount du component
	async function init() {
		await getConf()
		await getEtat()
	}
	
	// appelé apres unmount du component
	function reset() {	}

	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// if (m.op=="????" && m.o) .... return true 
		if (m.op=="S-enigme.etat" && m.o) getEtat(m.o)
		return false
	}

	// normalization des saisies persistantes 
	function normalizedSaisies(s) {
		s.debug ??= false
		s.tri ??= "pseudoA"
		return s
	}

	// appelé lors d'un changement de step de l'épique
	let epiqStepChangeDth=$state(Date.now())
	function epiqStepChange(newStep) {
		console.log("epiqStepChange="+newStep)
		epiqStepChangeDth=Date.now()
	}
	
	// gestion ETAT et CONF etc...
	let CONF = $state(null)
	let etat = $state(null)
	let dspPseudo = $state(null)
	let inputDisable = $state(null)
	
	async function getConf() {
		// let ret = await apiCall(APIROOT+"conf",'GET')
		// if (ret.status==200) CONF = ret.o  
	}
	async function getEtat(wso=null) {
		let tEtat = null
		if (wso) 
			tEtat=wso
		else {
			const ret = await apiCall("/pseudos/adminClient");
			if (ret.status==200) { tEtat=ret.o }
		}
		etat=recalcEtat(tEtat)
	}
	function recalcEtat(tEtat) {
		let aTrier = Object.values(tEtat)
		// on trie le tableau selon les critères 
		switch (saisies.tri){
			case "loginA": aTrier.sort( (a,b) => a.lastLogin - b.lastLogin); break
			case "loginD": aTrier.sort( (a,b) => b.lastLogin - a.lastLogin); break
			case "pseudoA": aTrier.sort( (a,b) => a.pseudo.localeCompare(b.pseudo)); break
			case "pseudoD": aTrier.sort( (a,b) => b.pseudo.localeCompare(a.pseudo)); break
			case "ipA": aTrier.sort( (a,b) => b.ip.localeCompare(a.ip)); break
			case "ipD": aTrier.sort( (a,b) => a.ip.localeCompare(b.ip)); break
			default : aTrier.sort( (a,b) => b.lastLogin - a.lastLogin); break
		}
		return { pseudos: aTrier }
	}
	
	function triEtat(type="pseudoA") {
		saisies.tri = type
		etat = recalcEtat(etat.pseudos)
	}
	async function getBannedIds() {
		let ret = await apiCall("/pseudos/getBannedIds",'GET')
		if (ret.status==200) {
			ret.o.sort( (a,b) => a[1].localeCompare(b[1] ))
		}
		return ret
	}
	async function togglePriv(pseudoDesc,mask) {
		let ret = await apiCall("/pseudos/togglePriv/"+pseudoDesc.pseudo+"/"+mask,'PATCH')
		switch (ret.status) { 
			case 200:	pseudoDesc.privilege = ret.o.privilege; break
			case 299:	displayInfo({ding:"prout-long",body:["Privileges insuffisants",ret.msg]}); break
		}
	}
	async function toggleBan(pseudoDesc,mask) {
		let ret = await apiCall("/pseudos/toggleBan/"+pseudoDesc.pseudo,'PATCH')
		switch (ret.status) { 
			case 200:	pseudoDesc.isBan = ret.o.isBan; break
			case 299: displayInfo({ding:"prout-long",body:["Privileges insuffisants",ret.msg]}); break
		}
	}
	async function deletePseudo(pseudoDesc) {
		let ret = await apiCall("/pseudos/deletePseudo/"+pseudoDesc.pseudo,'PATCH')
		switch (ret.status) { 
			case 200:	dspPseudo= null; await getEtat(); break
			case 299: displayInfo({ding:"prout-long",body:["Privileges insuffisants",ret.msg]}); break
		}
	}
</script>
<style>
	
</style>
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_missing_attribute  -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore (element_invalid_self_closing_tag -->
<div class="cards-section">
	<div>
		<button class="button" onclick={()=>playVideo("S-GrandePeluche/GP-admin")}>Revoir la vidéo</button>
		<button class={(epiqStep== 0)? "cOrange button":"button"} onclick={()=>epiqStep= 0}>Pseudos</button>
		<button class={(epiqStep==10)? "cOrange button":"button"} onclick={()=>epiqStep=10}>BannedId</button>
		<button class="button" onclick={()=>displayObject(etat)}>RawPseudos</button>
	</div>
	{#if epiqStep==0 && etat}
		<div {@attach scrollPageToTop}>
			<div class="card-wide petit">
				🔎<input type="text" bind:value={saisies.filtre} placeholder="recherche" />
				<sup gpHelp="Un peu nimp: prenom, nom, monde IG, FF14Id ou DiscordId">(ℹ)</sup>
				<span onclick={()=>triEtat("pseudoA")}>🔽</span>Pseudo<span onclick={()=>triEtat("pseudoD")}>🔼</span>
				<span onclick={()=>triEtat("loginD")}>🔽</span>Login<span onclick={()=>triEtat("loginA")}>🔼</span>
			</div>
			<div class="card-wide petit">
				{#key saisies.filtre}
					{@const f = saisies.filtre?.toLowerCase()}
					{#each etat.pseudos as p,i}
						{@const dsp =
							!f || 
							(p.prenom && p.prenom.toLowerCase().indexOf(f))>=0 ||
							(p.nom && p.nom.toLowerCase().indexOf(f))>=0 ||
							(p.monde && p.monde.toLowerCase().indexOf(f))>=0 ||
							(p.ff14Id && p.ff14Id.toString().indexOf(f))>=0 ||
							(p.discordId && p.discordId.toString().indexOf(f))>=0
						}
						{#if dsp}
							<div class={(p.isBan)? "cRed" : (p.privilege)? "cGreen" : ""} onclick={()=>dspPseudo=p} >
								{p.pseudo} ({p.prenom} {p.nom} @{p.monde})
								<br/>
								FF14:{p.ff14Id} Discord:{p.discordId}
								<br/>
								LastLogin: {aaaammjjThhmm(p.lastLogin)}
							</div>
							<hr/>
						{/if}
					{/each}
				{/key}
			</div>
		</div>
	{/if}
	{#if epiqStep==10 && etat}
		<div class="card-wide petit" {@attach scrollPageToTop}>
			{#await getBannedIds()}
				Chargement...
			{:then ret}
				{#if ret.status != 200}
					<div>Erreur</div>
					<pre>{JSON.stringify(ret,null,2)}</pre>
				{:else}
					<div>Liste des identifiants bannis</div>
					<div class="petit">Les FF14ID sont numériques et de moins de 11 chiffres</div>
					<div class="petit">Les DISCORDID sont numériques et de plus de 18 chiffres</div>
					<div class="petit">Les RAWID(webauthn) sont des clefs de longue taille</div>
					<hr/>
					{#each ret.o as b,i}
							<div>{b[1]}: {b[0]}</div>
					{/each}
					<hr/>
					<div>Total: {ret.o.length} ids bannis</div>
					<!-- <pre>{JSON.stringify(ret.o,null,2)}</pre> -->
				{/if}
			{:catch err}
				<div>Erreur</div>
				<pre>{JSON.stringify(err,null,2)}</pre>
			{/await}
		</div>
	{/if}
	{#if dspPseudo}
		{#snippet modifPriv(en,mask,text)}
			<div class="cPointer" onclick={async ()=> await togglePriv(en,mask)}>
				{#if en.privilege & mask}✔️{:else}❌{/if}
				{text}
			</div>
		{/snippet}
		<div class="popupCadre papier">
			<div class="close" onclick={dspPseudo=null} role="button">X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div class="petit">
						<div class={(dspPseudo.isBan)? "cRed" : (dspPseudo.privilege)? "cGreen" : ""}>
							<div>Pseudo: {dspPseudo.pseudo}</div>
							<div>FF14: {dspPseudo.prenom} {dspPseudo.nom} @{dspPseudo.monde}</div>
							<div>FF14Id: {dspPseudo.ff14Id}</div>
							<div>DiscordId: {dspPseudo.discordId}</div>
							<div>rawId: {dspPseudo.b64uRawId}</div>
							<div>LastLogin: {aaaammjjThhmm(dspPseudo.lastLogin)}</div>
							<div>LastRenew: {aaaammjjThhmm(dspPseudo.lastRenewDth)}</div>
						</div>
						<hr/>
						{#if webAuth.privilege & GBLCONST.PRIVBAN}
							<div>
								<button class="button" onclick={async ()=> await toggleBan(dspPseudo)}>
									{#if dspPseudo.isBan}Authoriser{:else}Interdire{/if}
									l'accès au site à {dspPseudo.pseudo}
								</button>
								<div class="petit">
									⚠️Interdit aux FF14Id, discordId et rawId(webAuthn) utilisé par "{dspPseudo.pseudo}"
									de se connecter au site
								</div>
							</div>
						{/if}	
						{#if webAuth.privilege & GBLCONST.PRIVDELETE}
							<div>
								<button class="button" onclick={async ()=> await deletePseudo(dspPseudo)}>
									Suppression du pseudo "{dspPseudo.pseudo}" sur le serveur
								</button>
								<div class="petit">
									⚠️Ce n'est pas un bannissement, au contraire.
									<br/>
									<u>Ceci ne doit être utilisé QUE SI {dspPseudo.pseudo} ne peut plus se connecter</u>.
									Par exemple: changement d'équipement, de smartphone, de compte Discord.
									<br/>
									<u>Il faut alors que {dspPseudo.pseudo} se reidentifie rapidement sur le site,
									sinon son pseudo peut-être réutilisé.</u>
									<br/>
									Techniquement, cela libere le pseudo, le FF14Id, le DiscordID et le rawId(webauthn)
									et permet leur réutilisation.
								</div>
							</div>
						{/if}	
						<hr/>
						<div>Privileges 0x{(dspPseudo.privilege || 0)?.toString(16).toUpperCase().padStart(8,"0")}</div>
						{#if webAuth.privilege & GBLCONST.PRIVDROITS}
							<div class="cGreen">Privileges modifiables de {dspPseudo.pseudo}</div>
						{:else}
							<div class="cOrange">Privileges non modifiables de {dspPseudo.pseudo}</div>
						{/if}
						{@render modifPriv(dspPseudo,GBLCONST.PRIVCODEX,"Admin Codex")}
						{@render modifPriv(dspPseudo,GBLCONST.PRIVENIGME,"Admin Enigme")}
						{@render modifPriv(dspPseudo,GBLCONST.PRIVACCES,"Acces aux rubriques vérouillées")}
						{@render modifPriv(dspPseudo,GBLCONST.PRIVBAN,"Ban/delete pseudo")}
						<div class="cOrange">Privileges non modiables</div>
						{@render modifPriv(dspPseudo,GBLCONST.PRIVDROITS,"Modifs les droits des pseudos")}
						{@render modifPriv(dspPseudo,GBLCONST.PRIVDELETE,"Delete pseudo sur le serveur")}
						<!--{@render modifPriv(dspPseudo,GBLCONST.PRIVLISTE,"Superadmin client")}-->
						<hr/>
						<pre>{JSON.stringify(dspPseudo,null,2)}</pre>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- P999.svelte -->
