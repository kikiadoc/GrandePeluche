<script>
	import { onMount, onDestroy } from 'svelte'
	import { apiCall, parseJJMMHHMM, jjmmhhmmss, newInfoPopup, newObjectPopup, sortCmp } from "./storage.js"
	import { crypoCreateKeyPair, cryptoSign, cryptoVerify, cryptoClearKey } from "./storage.js"
	import { storeIt, removeIt } from "./storage.js"

	// export let pseudo;
	
	
	/**
	 * @typedef {Object} Props
	 * @property {any} wsCallComponents - export let jetons;
	 * @property {any} dspObject - export let initWS;
	 */

	/** @type {Props} */
	let { wsCallComponents, dspObject = $bindable() } = $props();

	onMount(() => { console.log('mount P0 Admin'); if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => { console.log('destroy P0 Admin'); if (wsCallComponents) wsCallComponents.delete(myWsCallback) });

	async function myWsCallback(m) {
	}
	
	function init() {
		loadDiscordActions();
	}

	// generique
	
	/////////////////////////////////////////////////////////////////////
	// Gestion discord
	/////////////////////////////////////////////////////////////////////
	let admDiscordActions = $state(null);
	let newId = $state(0);
	let newOp = $state(null);
	let newDth = $state(null);
	let newTxt = $state(null);
	let newChan = $state(null);
	let newAll = $state(null);
	async function loadDiscordActions() {
		let ret = await apiCall("/discord/admActions",'GET')
		if (ret.status==200) admDiscordActions = ret.o
	}
	async function addAction() {
		let dth = newDth
		if (dth <=0) { alert("Bad dth:"+newDth); return; }
		console.log("adminAdd:",newId, newOp, newDth, dth, newChan, newTxt, newAll)
		let desc = { id: newId, op: newOp, dth: newDth, chan: newChan, txt: newTxt, all: newAll }
		let ret = await apiCall("/discord/admActions","POST", desc)
		if (ret.status==200) admDiscordActions = ret.o
	}
	async function delAction() {
		let ret = await apiCall("/discord/admActions/"+newId,"DELETE")
		if (ret.status==200) admDiscordActions = ret.o
	}
	function discordDthFromInputs() {
		let mo = document.getElementById("admDiscordMO").value;
		let jj = document.getElementById("admDiscordJJ").value;
		let hh = document.getElementById("admDiscordHH").value;
		let mm = document.getElementById("admDiscordMM").value || 0;
		let ss = document.getElementById("admDiscordSS").value || 0;
		let yy = new Date().getFullYear();
		if ( mo < new Date().getMonth() ) yy++; 
		console.log("dthfromInputs",yy,mo-1,jj,hh,mm,ss);
		newDth = new Date(yy,mo-1,jj,hh,mm,ss).valueOf();
	}

	async function clearFf14IdDiscord() {
		const ff14Id = document.getElementById('admClearDiscord').value;
		let retJson = await apiCall("/discord/ff14Id/"+ff14Id,"DELETE");
		newObjectInfo(retJson)
	}

/*
	/////////////////////////////////////////////////////////////////////
	// Jetons
	/////////////////////////////////////////////////////////////////////
	async function incJetons()	{ 
		const pseudo = document.getElementById('admJetonPseudo').value;
		let retJson = await apiCall("/jetons/admInc/"+pseudo);
		newInfoPopup("incJetons "+pseudo, retJson.o.data[pseudo].solde,"");
	}
	async function decJetons()	{ 
		const pseudo = document.getElementById('admJetonPseudo').value;
		let retJson = await apiCall("/jetons/admDec/"+pseudo);
		newInfoPopup("decJetons "+pseudo, retJson.o.data[pseudo].solde,"");
	}
	async function queryJetons()	{ 
		const pseudo = document.getElementById('admJetonPseudo').value;
		let retJson = await apiCall("/jetons/admQuery/"+pseudo);
		newInfoPopup("queryJetons "+pseudo, retJson.o.data[pseudo].solde,"");
	}
	async function resetJetonGratuit()	{ 
		const pseudo = document.getElementById('admJetonPseudo').value;
		let retJson = await apiCall("/jetons/admResetGratuit/"+pseudo);
		newInfoPopup("resetJetonGratuit "+pseudo, retJson.msg,"");
	}
	async function clearJetons()	{ 
		const pseudo = document.getElementById('admJetonPseudo').value;
		let retJson = await apiCall("/jetons/admClear/"+pseudo);
		newInfoPopup("clearJetons:"+pseudo, retJson.msg,"");
	}
*/

	/////////////////////////////////////////////////////////////////////
	// Pseudos
	/////////////////////////////////////////////////////////////////////
	let dspPseudo = $state(null);
	async function clearPseudoServer()	{ 
		const pseudo = document.getElementById('admClearPseudo').value;
		let retJson = await apiCall("/pseudos/"+pseudo,"DELETE");
		newInfoPopup("deletePeudo:",retJson.o.pseudo,"status="+retJson.status); 
	}
	async function infoGlobalPseudos() {
		const ret = await apiCall("/pseudos");
		if (ret.status==200) {
			dspPseudo = Object.entries(ret.o)
		}
	}
	async function infoGlobalDiscord() {
		const ret = await apiCall("/discord/admGetRaw");
		if (ret.status==200) {
			dspObject = ret.o
		}
	}
/*
	function infoGlobalJetons() {
		let res = [];
		Object.keys(jetons).forEach( p => {
			res.push(p+":"+jetons[p].solde);
		});
		newInfoPopup("Synthèse jetons",res,"admin!");
	}
*/
	/////////////////////////////////////////////////////////////////////
	// Hauts faits
	/////////////////////////////////////////////////////////////////////
	async function infoGlobalHautsFaits() {
		let ret = await apiCall("/hautsFaits");
		let res=[];
		Object.keys(ret.o.id).forEach( id => {
			res.push(id);
			let lst= "";
			Object.keys(ret.o.id[id].pseudos).forEach( p => {
				lst = lst + p + " ";
			});
			res.push("->"+lst);
		});
		newInfoPopup("Synthèse hautsFaits",res,"admin!");
	}
	/////////////////////////////////////////////////////////////////////
	// test 
	/////////////////////////////////////////////////////////////////////
	let cryptoTestVal = null; // resulat signature crypto

</script>
<style>
	input {font-size: 0.7em}
</style>
<div style="font-size: 0.7em">
	<div class="adminCadre">
		<input type="button" value="infoGlobalPseudos" onclick={()=>infoGlobalPseudos()} />
		<!-- <input type="button" value="infoGlobalJetons" on:click={()=>infoGlobalJetons()} /> -->
		<input type="button" value="infoGlobalHautsFaits" onclick={()=>infoGlobalHautsFaits()} />
		<input type="button" value="infoGlobalDiscord" onclick={()=>infoGlobalDiscord()} />
	</div>
	<div class="adminCadre">
		<input type="text" placeholder="pseudo" id="admClearPseudo">
		<input type="button" value="ClearServer/pseudo" onclick={clearPseudoServer}>
		<input type="text" placeholder="ff14Id" id="admClearDiscord">
		<input type="button" value="ClearDiscord/ff14Id" onclick={clearFf14IdDiscord}>
	</div>

	<!--
	<div class="adminCadre">
		<input type="button" value="clearKey" on:click={async ()=> cryptoClearKey() }>
		<input type="button" value="generateKey" on:click={async ()=> crypoCreateKeyPair() }>
		<input type="button" value="signText" on:click={async ()=> cryptoTestVal = await cryptoSign('Ceci est un texte') }>
		<input type="button" value="verifyText" on:click={async ()=> await cryptoVerify('Ceci est un texte',cryptoTestVal) }>
		<input type="button" value="clearClientPublicKey" on:click={async ()=> {removeIt("elipticSecurity") } }>
		<input type="button" value="clearServerPublicKey" on:click={async ()=> {let r= await apiCall("/adminTest/clearServerPublicKey",'DELETE'); console.log("r=",r)} }>
		<input type="button" value="resetWS" on:click={async ()=> {initWS()} }>
	</div>
	<div class="adminCadre">
		<input type="button" value="patchPseudos" on:click={async ()=> {let r= await apiCall("/pseudos",'PATCH'); console.log("r=",r)} }>
		<input type="button" value="forceBadPage" on:click={()=> {storeIt("page",12345)} }>
	</div>
	-->
	<div class="adminCadre">
		<input type="text" id="admTxtTTS" />
		<input type="button" value="testTTS" onclick={async ()=> {let r= await apiCall("/tts/test/"+document.getElementById("admTxtTTS").value); dspObject= r.o }}>
		<input type="button" value="dumpTTS" onclick={async ()=> {let r= await apiCall("/tts/dump"); dspObject=r.o}}>
		<input type="button" value="clearTTS" onclick={async ()=> {let r= await apiCall("/tts/clear"); dspObject=r.o}}>
		<input type="button" value="testSeq" onclick={async ()=> {let r= await apiCall("/tts/testSeq"); dspObject=r.o}}>
	</div>
	<div class="adminCadre">
		{#if admDiscordActions!=null}
			Liste des actions discord, Total:{admDiscordActions.waiting.length}
			<br/>
			{#each admDiscordActions.waiting as action, i }
				<div class="adminCadre">
					Id={action.id} op={action.o.op} dth={jjmmhhmmss(action.dth)} chan={action.o.chan} evry={action.o.all}
					<br/>
					{action.o.txt}
					<br>
					<input type="button" value={"Edit "+action.id}
						onclick={() => {newId=action.id; newDth=action.dth; newOp=action.o.op; newChan=action.o.chan; newTxt=action.o.txt; newAll=action.o.all}} />
	 			</div>
			{/each}
			<div class="adminCadre">
				Nouvelle action discord :
				<br/>
				Id:<input bind:value={newId} type="text" placeholder="id"/>
				<br/>
				Op:<input bind:value={newOp} type="text" placeholder="op"/>
				<input type="button" value="opTest" onclick={() => { newOp="test"}} />
				<input type="button" value="opMsg" onclick={() => { newOp="msg"}} />
				<br/>
				Dth:<input bind:value={newDth} type="text" placeholder="epoch" size=14/>
				({jjmmhhmmss(newDth)})
				<input id="admDiscordJJ" type="text" placeholder="jour" size=5/>
				<input id="admDiscordMO" type="text" placeholder="mois" size=5/>
				<input id="admDiscordHH" type="text" placeholder="hh" size=5/>
				<input id="admDiscordMM" type="text" placeholder="mm" size=5/>
				<input id="admDiscordSS" type="text" placeholder="ss" size=5/>
				<input type="button" value="Convert" onclick={()=> discordDthFromInputs()}/>
				<input type="button" value="nextMinute" onclick={() => { newDth=Math.floor((Date.now()+60000)/60000)*60000 }} />
				<br/>
				Channel:<input bind:value={newChan} type="text" placeholder="id de chan"/>
				<!--
				<input type="button" value="ChanAvant" on:click={() => { newChan="avant2024"} } />
				<input type="button" value="ChanJungle" on:click={() => { newChan="jungleBoogie"} } />
				<input type="button" value="deepAI" on:click={() => { newChan="deepAI"} } />
				<input type="button" value="uchronie" on:click={() => { newChan="uchronie"} } />
				<input type="button" value="innommable" on:click={() => { newChan="innommable"} } />
				<input type="button" value="test" on:click={() => { newChan="test"} } />
				-->
				<input type="button" value="discussion" onclick={() => { newChan="discussion"}} />
				<input type="button" value="annonces" onclick={() => { newChan="annonces"}} />
				<input type="button" value="hegemonie" onclick={() => { newChan="hegemonie"}} />
				Everyone: <input type="checkbox" bind:checked={newAll} onclick={() => { newAll=!newAll; console.log("newAll",newAll)}} />
				<br/>
				<textarea bind:value={newTxt} maxlength=1750 rows=15 cols=80></textarea>
				<br/>
				<input type="button" value="add/update" onclick={addAction} />
				<input type="button" value="delete" onclick={delAction} />
				<input type="button" value="ResetInput" onclick={() => {newId=0;newOp=null;newDth=null;newChan=null;newTxt=null;newAll=false;}} />
			</div>
		{:else}
			Waiting Discord Actions
		{/if}
	</div>

	{#if dspPseudo}
		<div class="popupCadre papier">
			<div class="close" onclick={()=>dspPseudo=null} onkeypress={null} role="button" tabindex=0>X</div>
			<div class="popupZone">
				<div class="popupContent">
					<div>
						<table>
							<tbody>
								<tr>
									<td><input type="button" value="Tri" onclick={()=>{dspPseudo=dspPseudo.sort((a,b)=>sortCmp(a[0],b[0]))}} /></td>
									<td><input type="button" value="Tri" onclick={()=>{dspPseudo=dspPseudo.sort((a,b)=>sortCmp(a[1].ip || "z",b[1].ip || "z"))}} /></td>
									<td><input type="button" value="Tri" onclick={()=>{dspPseudo=dspPseudo.sort((a,b)=>sortCmp(b[1].lastLogin,a[1].lastLogin))}} /></td>
									<td>IG</td>
									<td>FF14Id</td>
								</tr>
								{#each dspPseudo as p}
									<tr>
										<td>{p[0]}</td>
										<td>{p[1].ip}</td>
										<td>{jjmmhhmmss(p[1].lastLogin)}</td>
										<td>{p[1].prenom} {p[1].nom} @{p[1].monde}</td>
										<td>{p[1].ff14Id}</td>
										<td style="color:red">{(p[1].fullName)? "notNormalized":""}</td>
										<td style="color:red">{(p[1].jwkPublicKey)? "":"No eliptic key"}</td>
										<td ><input type="button" value="discord" onclick={async ()=> {let ret = await apiCall('/discord/admGetByFf14Id/'+p[1].ff14Id); if (ret.status==200) newObjectPopup(ret.o) }} /></td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}

</div>

<!--
	<div class="adminCadre">
		<input type="text" placeholder="pseudo" id="admJetonPseudo" size=20>
		<input type="button" value="info jetons/id" on:click={queryJetons}>
		<input type="button" value="inc jetons/id" on:click={incJetons}>
		<input type="button" value="dec jetons/id" on:click={decJetons}>
		<input type="button" value="resetGratuit/id" on:click={resetJetonGratuit}>
		<input type="button" value="DELETE jetons/id" on:click={clearJetons}>
	</div> 
-->
		<!--
		<input type="button" value="testTTS" on:click={async ()=> {let r= await apiCall("/adminTest/tts"); console.log("r=",r)} }>
		<input type="button" value="doWait" on:click={async ()=> {let r= await apiCall("/adminTest/doWait"); console.log("r=",r)} }>
		<input type="button" value="doWaitLong" on:click={async ()=> {let r= await apiCall("/adminTest/doWaitLong"); console.log("r=",r)} }>
		<input type="button" value="pCloudInfo" on:click={async ()=> {let r= await apiCall("/adminTest/pCloudInfo"); console.log("r=",r)} }>
		<input type="button" value="pCloudUpload" on:click={async ()=> {let r= await apiCall("/adminTest/pCloudUpload"); console.log("r=",r)} }>
		<input type="button" value="chatGPTinit" on:click={async ()=> {let r= await apiCall("/adminTest/pCloudUpInfo"); console.log("r=",r)} }>
		<input type="button" value="chatGPTnext" on:click={async ()=> {let r= await apiCall("/adminTest/pCloudUpInfo"); console.log("r=",r)} }>
		<input type="button" value="discordClose" on:click={async ()=> {let r= await apiCall("/discord/admClose"); console.log("r=",r)} }>
		-->

	
<!-- p0.svelte -->



