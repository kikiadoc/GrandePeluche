<script>
	import { babylonHome, babylonSetOption, babylonGetOption,
					 babylonGotoPos, babylonObjetActifUpdate
				 } from './BabRoot.js'
	import { isAdmin } from './common.js'
	import Info from './Info.svelte'

	let {
		dspBabParam=$bindable(0),
		babIHM=$bindable({}),
		saisies=$bindable({}),
		CONFIG=null,  // optionnel pour obtenir la liste des models 3D
		pseudo=null
	} = $props() 
	
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if dspBabParam}
	<div style="position: absolute" class="popupCadre papier">
		<div class="close" onclick={()=>dspBabParam=null} role="button">X</div>
		<div class="popupZone">
			Paramètres/actions:
			<div class="popupContent" style="font-size:0.8em">
				<input type="button" value="Retour à l'entrée" onclick={()=>babylonHome()} />
				<hr/>
				<input type="button" value="Mode PC/SM" onclick={()=>babylonSetOption("IHM")} />
				<input type="button" value="Molette▲▼" onclick={()=>babylonSetOption("wheelDir")} />
				<hr/>
				<input type="button" value="Fullscreen" onclick={()=>babylonSetOption("fullscreen",true)} />
				<input type="button" value="Normal" onclick={()=>babylonSetOption("fullscreen",false)} />
				<hr/>
				<label>
					debug:
					<input type="checkbox" checked={babylonGetOption("debug")} onchange={(e)=>babylonSetOption("debug",e.srcElement?.checked)}/>
				</label>
				<label>
					Perf:
					<input type="checkbox" checked={babylonGetOption("perf")} onchange={(e)=>babylonSetOption("perf",e.srcElement?.checked)}/>
				</label>
				<label>
					Axes:
					<input type="checkbox" checked={babylonGetOption("axes")} onchange={(e)=>babylonSetOption("axes",e.srcElement?.checked)}/>
				</label>
			</div>
			{#if isAdmin(pseudo)}
				<div class="adminCadre">
					Admin:
					{#if CONFIG}
						<br/>
						<input bind:value={saisies.add3Di} type="number" min=0 max=100 step=1 placeholder="i" />
						<select bind:value={saisies.add3Dn}>
							{#each Object.keys(CONFIG.WORLD3DDESC.OBJ3DDESC) as n,i }
								<option value={n}>{n}</option>
							{/each}
						</select>
						Size:
						<input bind:value={saisies.add3Ds} type="number" placeholder="size" min=0.0001 max=100 step=0.0001 />
						<br>
						pX:{babIHM.lx?.toFixed(4)}
						pY:{babIHM.ly?.toFixed(4)}
						pZ:{babIHM.lz?.toFixed(4)} 
						<input type="button" value="Update@Lock" onclick={()=>	babylonObjetActifUpdate(
									saisies.add3Di, { 
									mName: saisies.add3Dn, 
									x:babIHM.lx, y:babIHM.ly, z:babIHM.lz, s:saisies.add3Ds 
						})} />
					{:else}
						CONFIG non paramétré
					{/if}
					<hr/>
					<input type="number" placeholder="x" min=-100 max=100 step=0.0001 bind:value={saisies.adminGoPosX}  />
					<input type="number" placeholder="y" min=-100 max=100 step=0.0001 bind:value={saisies.adminGoPosY}  />
					<input type="number" placeholder="z" min=-100 max=100 step=0.0001 bind:value={saisies.adminGoPosZ}  />
					<input type="button" value="gotoPos" onclick={()=>
								babylonGotoPos(saisies.adminGoPosX,saisies.adminGoPosY,saisies.adminGoPosZ)																				
							} />
				</div>
			{/if}
		</div>
	</div>
{/if}
{#if babIHM.msg}
	<Info bind:dspInfo={babIHM.msg} />
{/if}
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<span role="button" class="simpleLink" onclick={()=>babIHM.msg="Vitesse de distortion dans l'Ortho-Temps"}>🚶‍♂️</span>
<input type="range" min=1 max=19 step=1 style="width:20%"
	bind:value={saisies.sensibilite3D}
	onchange={(e)=>babylonSetOption("sensibilite",e.srcElement.value/19)} />
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<span role="button" class="simpleLink" onclick={()=>babIHM.msg="Vitesse de distortion dans l'Ortho-Temps"}>🏃</span>
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<span role="button" style="cursor:pointer" onclick={()=>dspBabParam=!dspBabParam}>&nbsp;⚙️&nbsp;</span>
<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<span role="button" class="simpleLink"
		onclick={()=>babIHM.msg={ 
			body:["Tes Coordonnées dans l'Ortho-temps","Contrairement à Eorzéa, elles peuvent être négatives"]}
		} >
	🔮
	<span style="font-family:monospace; font-size:0.9em">
		X:{(100*babIHM.x/babIHM.ws).toFixed(1)}
		Y:{(100*babIHM.z/babIHM.ws).toFixed(1)}
		Z:{(100*babIHM.y/babIHM.ws).toFixed(1)}
	</span>
</span>
{#if babIHM.debug}
	<div style="font-size:0.5em">
		Worldsize:{babIHM.ws }
		<br/>
		X:{babIHM.x?.toFixed(4)}
		Y:{babIHM.y?.toFixed(4)}
		Z:{babIHM.z?.toFixed(4)}
		rX:{babIHM.rx?.toFixed(4)}
		rY:{babIHM.ry?.toFixed(4)}
		rZ:{babIHM.rz?.toFixed(4)} 
		<br/>
		pX:{babIHM.px?.toFixed(4)}
		pY:{babIHM.py?.toFixed(4)}
		pZ:{babIHM.pz?.toFixed(4)} 
		Lock:
		x:{babIHM.lx?.toFixed(4)},
		y:{babIHM.ly?.toFixed(4)},
		z:{babIHM.lz?.toFixed(4)}
		<br/>
		mesh:{babIHM.pMesh}
	</div>
{/if}
<!-- BabHeader.svelte -->
