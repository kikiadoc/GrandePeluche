<script>
	import { onMount, onDestroy } from 'svelte'
	import { apiCall, apiCallExtern, parseJJMMHHMM, jjmmhhmmss, sortCmp, urlCdn,
					 playDing, displayObject,
					 storeIt, removeIt } from "./common.js"

	let { wsCallComponents } = $props();

	onMount(() => {if (wsCallComponents) wsCallComponents.add(myWsCallback); init() });
	onDestroy(() => {if (wsCallComponents) wsCallComponents.delete(myWsCallback) });

	async function myWsCallback(m) {	}
	
	async function init() {
		loadDiscordActions()
		enumMusiques= await apiCallExtern(urlCdn+"musiques/index.json","GET")
	}

	let saisies = {} // generique non sauvegardées 
	let showAdmin=$state(false)
	let showMusiques=$state(false)
	let enumMusiques=$state(false)
	
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

	/////////////////////////////////////////////////////////////////////
	// Pseudos
	/////////////////////////////////////////////////////////////////////
	let dspPseudo = $state(null);
	async function infoGlobalPseudos() {
		const ret = await apiCall("/pseudos");
		if (ret.status==200) {
			dspPseudo = Object.entries(ret.o)
		}
	}
	/////////////////////////////////////////////////////////////////////
	// test 
	/////////////////////////////////////////////////////////////////////
	async function displayMusiqueDetail(i) {
		let detail = await apiCallExtern(urlCdn+"musiques/item_"+enumMusiques[i].itemId+".json","GET")
		displayObject(detail)
	}
</script>
<style>
	input {font-size: 0.7em}
</style>
<div class="adminCadre" style="font-size: 0.4em">
	<input type="button" value="show/hide Admin" onclick={() => showAdmin=!showAdmin} />
	<input type="button" value="show/hide Musiques" onclick={() => showMusiques=!showMusiques} />
	<input type="button" value="test handler d'erreur" onclick={() => ceciEstUnTestDuHandlerErreur()} />
</div>
{#if showAdmin}
	<div style="font-size: 0.7em">
		<div class="adminCadre">
			<input type="button" value="infoGlobalPseudos" onclick={async ()=>await infoGlobalPseudos()} />
			<input type="button" value="infoGlobalHautsFaits" onclick={async ()=>displayObject(await apiCall("/hautsFaits"))} />
			<input type="button" value="infoGlobalDiscord" onclick={async ()=>displayObject(await apiCall("/discord/admGetRaw"))} />
		</div>
		<div class="adminCadre">
			<!-- svelte-ignore binding_property_non_reactive -->
			<input bind:value={saisies.admPseudo} type="text" placeholder="pseudo" />
			<input type="button" value="ClearServer/pseudo"
				onclick={async ()=> confirm('Delete pseudo?'+saisies.admPseudo) && displayObject(await apiCall("/pseudos/"+saisies.admPseudo,"DELETE"))}
			/>
			<!-- svelte-ignore binding_property_non_reactive -->
			<input bind:value={saisies.admNumPage} type="number" min=0 max=999 placeholder="numPage">
			<input type="button" value="GoToPage/pseudo"
				onclick={async ()=> confirm('gotoPage pseudo?'+saisies.admPseudo) && displayObject(await apiCall("/adminTest/gotoPage/"+saisies.admPseudo+"/"+saisies.admNumPage,'PATCH'))}
			/>
		</div>
		<div class="adminCadre">
			<input type="text" placeholder="ff14Id" id="admClearDiscord">
			<input type="button" value="ClearDiscord/ff14Id" onclick={clearFf14IdDiscord}>
		</div>
		<div class="adminCadre">
			<input type="text" placeholder="pCloudFolderId" id="pCloudFolderId" />
			<input type="button" value="ListFolder" onclick={async ()=> {let r= await apiCall("/adminTest/pCloudListFolder/"+document.getElementById("pCloudFolderId").value); displayObject(r.o) }}>
		</div>
		<div class="adminCadre">
			<input type="text" id="admTxtTTS" />
			<input type="button" value="generateTTS" onclick={async ()=> {let r= await apiCall("/tts/genTexte/"+document.getElementById("admTxtTTS").value); displayObject(r.o) }}>
			<!--
			<input type="button" value="generateTTS" onclick={async ()=> {let r= await apiCall("/tts/test/"+document.getElementById("admTxtTTS").value); displayObject(r.o) }}>
			<input type="button" value="dumpTTS" onclick={async ()=> {let r= await apiCall("/tts/dump"); displayObject(r.o)}}>
			<input type="button" value="clearTTS" onclick={async ()=> {let r= await apiCall("/tts/clear"); displayObject(r.o)}}>
			<input type="button" value="testSeq" onclick={async ()=> {let r= await apiCall("/tts/testSeq"); displayObject(r.o)}}>
			-->
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
											<td ><input type="button" value="discord" onclick={async ()=> {let ret = await apiCall('/discord/admGetByFf14Id/'+p[1].ff14Id); if (ret.status==200) displayObject(ret.o) }} /></td>
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
{/if}
{#if showMusiques && enumMusiques}
	<div class="adminCadre">
		<audio id="debugMusiqueOgg" src="" autoplay controls loop style="position: fixed"></audio>
		<div style="height:4em"> </div>
		<div class="blinkMsg">
			Utiliser uniquement la colonne m.itemId. C'est le seul élément qui semble stable
			entre les versions.
		</div>
		<table>
			<tbody>
				<tr>
					<td></td>
					<td>i</td>
					<td>m.itemId</td>
					<td>m.oggId</td>
					<td>m.ad.fields.Name</td>
					<td>m.ad.fields.Description</td>
				</tr>				
				{#each enumMusiques as m,i}
					{@const urlOgg=urlCdn+"musiques/item_"+m.itemId+"_"+m.oggId+".ogg"}
					<tr style="border: 1px solid white">
						<td>
							<input type="button" value="🔊" onclick={()=>document.getElementById("debugMusiqueOgg").src=urlOgg} />
							<input type="button" value="🔎" onclick={()=>displayMusiqueDetail(i)}/>
						</td>
						<td>{i}</td>
						<td style="border: 1px solid white">{m.itemId}</td>
						<td>{m.oggId}</td>
						<td>{m.ad.fields.Name}</td>
						<td>{m.ad.fields.Description}</td>
					</tr>				
				{/each}
				
			</tbody>
		</table>
	</div>
{/if}
<!-- Padmin.svelte -->



