<script>
	import { onMount, onDestroy  } from 'svelte';
	import { urlCdn, addNotification, displayInfo, ssms, markClick,
					 loadIt, storeIt, apiCall, wsSend, isEquipementPC,
					 jjmmhhmmss, countDownTo, playVideo, playDing } from "./common.js"

	import Info from './Info.svelte'

	// function stopBlock {} // 

	let {
		wsCallComponents,
		pseudo,
		pseudoGenre,
		pseudoList,
		resetStep=0,
		epiqStep =  $bindable(),
		dspObject = $bindable()
	} = $props();

	let engine = null // reference sur l'engine 3D
	let scenePerf = null
	let sceneLoad = null
	let sceneMain = null
	let	sceneActive = null
	let syncIHM = $state( {} ) // synchro entre moteur 3D et IHM
	let dspParam= $state(null)
	let dspMessage= $state(null)
	let dspHarmo= $state(null)
	let lastSurchauffe = $state(loadIt('metro.lastSurchauffe',0))
	$effect(()=>storeIt('metro.lastSurchauffe',lastSurchauffe))
	let harmoTask = $state(null) // taches en cours
	let	debugClick= $state(false)  // sphere sur click


	let etat = null  // etat du mini-jeu , par image du server, non reactive pour limite impact moteur 3D
	let renderCommands=[] // file des commands à destination du renderloop
	const SYNCTIMERDELAI=200
	const POSITIONPOP= {x:0, y:1, z:-5 }
	const CAMERAMINY = 0.7
	const WORLDSIZE=100
	const DELAITABLEAUCLIC = 5*60000 // 1 tableau toutes les 5 minutes
	let syncTimerId = null //timer de sync server
	const NRV = { } // non reactive variables
	let debugEngine = true // afficahge des infos de l'engine
	let wheelDir = true // direction molette
	let modeIHM= isEquipementPC() // type IHM (PC ou SM)
	let sensibilite = 3

	
	onMount(async () => {
		console.log("** mount Cengine3D")
		window.addEventListener("resize",canvasResize)
		await engineLoad()
		wsCallComponents.add(myWsCallback)
		init()
	});
	onDestroy(() => {
		console.log("** unmount Ceneine3D")
		wsCallComponents.delete(myWsCallback)
		window.removeEventListener("resize",canvasResize)
		reset()
	})
	
	// function stop {}
	async function init() {
		let ret = await apiCall("/metropolis/etat")
		if (ret.status==200) {
			console.log("etat (ret.o):",ret.o)
			etat = ret.o.etat
			// recompose l'etat pour acces plan
			etat.objetsDesc = ret.o.objetsDesc
			// recalcul les nombres d'objets pour l'IHM
			recalcNbObjIhm(etat)
		}
		syncTimerId = setTimeout(serverSync,SYNCTIMERDELAI)
		await runBabylon()
	}
	function reset() {
		clearTimeout(syncTimerId)
		serverLeave3D()
		// libère les ressources WebGL de l'engine et l'engine 3D
		engineStop()
	}
	// gestion des commandes via le WS
	async function myWsCallback(m) {
		// console.log("wsEngine3D",m)
		switch(m.op) {
			case 'metro.sync':
				// enregisre l'etat server du pseudo
				etat.pseudos[m.o.p]=m.o
				renderCommands.push({op:"metro.sync",pseudo:m.o.p})
				return true
			case 'metro.objet':
				// refresh objet o.i
				const oldTermine = etat.objetsStatus[m.o.objetIdx].termine
				etat.objetsStatus[m.o.objetIdx] = m.o.objetStatus
				renderCommands.push({op:"metro.objet",idx:m.o.objetIdx})
				// recalcul les nombres d'objets pour l'IHM
				recalcNbObjIhm(etat)
				if (oldTermine != etat.objetsStatus[m.o.objetIdx].termine)
					playDing('orthoTempsTableau')
				return true
			case 'metro.harmoChallenge':
				// reception d'un nouveau challenge ou remplacement de l'existant
				setHarmoTask(m.o.objetIdx , m.o.byPseudo)
				return true
			case 'metro.harmoReset':
				// reinitialisation des harmoniques 
				resetHarmoTask()
				return true
			case 'metro.emote':
				// reception d'un emote metropolis
				switch (m.emote) {
					case 'coucou':
						if (m.orgPseudo==pseudo) dspMessage = {title:"harmonique",body:["Tu as fait coucou à "+m.dstPseudo], ding:"ding-ding"}
						else
						if (m.dstPseudo==pseudo) dspMessage = {title:"harmonique",body:[m.orgPseudo+" te fait coucou"], ding:"ding-ding"}
						else
							addNotification(m.orgPseudo+" fait coucou à "+m.dstPseudo)
				}
				return true
		}
		return false
	}

	//////////////////////////////////////////////
	// configuration du mini jeu
	//////////////////////////////////////////////
	function setModeIHM() {
		modeIHM = !modeIHM
		dspMessage = (modeIHM)? "IHM PC" : "IHM SmartPhone"
		renderCommands.push({op:"metro.ihm"})
	}
	function setWheelDir() {
		wheelDir = !wheelDir
		dspMessage = (wheelDir)? "Molette de souris: tirer pour avancer" : "Molette de souris: tirer pour reculer"
	}
	function setDebugClick(e) {
		debugClick = !debugClick
		debugEngine = debugClick
		dspMessage = (debugClick)? "Debug: une petite boule indiquera ton click" : "Arrêt du mode Debug"
		renderCommands.push({op:"metro.debug"})
	}

	function isMetroTermine(){
		return syncIHM.nbTableaux==syncIHM.currTableaux && syncIHM.nbBombes==syncIHM.currBombes
	}
	function recalcNbObjIhm(etat) {
		syncIHM.nbTableaux ??= etat.objetsDesc.reduce( (a,desc) => a + ((desc.t=="t")? 1: 0), 0)
		syncIHM.nbBombes ??= etat.objetsDesc.reduce( (a,desc) => a + ((desc.t=="b")? 1: 0), 0)
		let currTableaux = 0
		let currBombes = 0
		for (let i=0; i < etat.objetsStatus.length; i++) {
			switch (etat.objetsDesc[i].t) {
				case 't':
					// if (etat.objetsStatus[i].pseudos.findIndex( (s) => s.pseudo==pseudo) >= 0) currTableaux++
					if (etat.objetsStatus[i].termine) currTableaux++
					break
				case 'b':
					if (etat.objetsStatus[i].pseudos.findIndex( (s) => s.pseudo==pseudo) >= 0) currBombes++
			}
		}
		syncIHM.currTableaux = currTableaux // 
		syncIHM.currBombes = currBombes
	}

	//////////////////////////////////////////////
	// communication bidir avec le serveur
	//////////////////////////////////////////////
	let pushCtx = {} 	// contexte à remonter au serveur, max 5 par seconde
	function serverSync() {
		if (pushCtx.op) {
			// console.log('serverSync:',pushCtx)
			wsSend(pushCtx)
			// sync ihm
			syncIHM.x  = pushCtx.loc.cx
			syncIHM.y  = pushCtx.loc.cy // pas en usage FF14
			syncIHM.z  = pushCtx.loc.cz // pas en usgae FF14
			syncIHM.rx  = pushCtx.loc.rx
			syncIHM.ry  = pushCtx.loc.ry // pas en usage FF14
			syncIHM.rz  = pushCtx.loc.rz // pas en usgae FF14
			// resetpush
			pushCtx = {}
		}
		syncTimerId = setTimeout(serverSync,SYNCTIMERDELAI)
	}
	function serverLeave3D() {
		wsSend({op: "metro.sync", leave:true}) 
	}
	function serverEnter3D() {
		wsSend({op: "metro.sync", enter:true, g:pseudoGenre, loc: {cx:POSITIONPOP.x, cy:POSITIONPOP.y, cz:POSITIONPOP.z, rx: 0, ry:0, rz:0 }})
	}
	
	function pushToServer(op,o) {
		// console.log('push',op,o) 
		switch(op) {
			case 'loc':
				pushCtx.loc = o
				pushCtx.op = "metro.sync"
				break
			default: console.error("pushToServer bad op",op)
		}
	}

	//////////////////////////////////////////////
	// Gestionde l'harmonique
	//////////////////////////////////////////////
	//positionne le challenge dans l'harmonique
	function setHarmoTask(i,p) {
		// si le challenge n'as pas changé, ne rien faire
		console.log("setHarmoTask",i,p)
		if (harmoTask && harmoTask.i== i) return
		harmoTask = { i:i, p:p }
		playDing('orthoTempsMission')
	}
	function resetHarmoTask() {
		dspHarmo=null
		harmoTask = null
	}
	// tentative de reponse à un challenge
	function harmoTry(idxObjet,idxReponse) {
		apiCall("/metropolis/tryReponse/"+idxObjet+"/"+idxReponse,'POST')
		const desc = etat.objetsDesc[idxObjet]
		const status = etat.objetsStatus[idxObjet]
		if (desc.clg.r != idxReponse) {
			// mauvaise réponse... 
			dspMessage={ titre:desc.lbl,body: ["Mauvaise réponse"]}
			playDing("prout-long")
		}
		else {
			// mauvaise réponse...
			dspMessage={ titre:desc.lbl,body: ["Identification réussie"]}
			playDing("Applaudissements")
		}
		// maj de la surchauffe !!
		lastSurchauffe = Date.now()
		dspHarmo=null
	}
	function helpTermine(desc,status) {
		console.log('helpTermine')
		return { titre:desc.lbl,
						 body: desc.fini?.t, img: desc.fini?.img, url: desc.fini?.url,
						 trailer:"Résolu par "+status.termine.pseudo+" "+jjmmhhmmss(status.termine.dth) }
	}
	// construction du message avec la liste des ardoises
	function helpArdoises() {
		let m = { titre: "Etat des Ardoises:", body: [], back:"papier" }
		for (let i=0, n=etat.objetsStatus.length; i<n; i++) {
			const desc = etat.objetsDesc[i]
			const status = etat.objetsStatus[i]
			// console.log("desc",desc,"status",status)
			if (desc.t=='t') {
				m.body.push(null)
				if (status.termine) {
					// Ardoise totalement identifiée
					m.body.push(desc.lbl+" @x:"+desc.cx+",y:"+desc.cy+",z:"+desc.cz)
					m.body.push("✅identifiée par "+status.termine.pseudo+" "+jjmmhhmmss(status.termine.dth))
					m.body.push({txt:"👉Voir l'ardoise",cb:()=>dspMessage=helpTermine(desc,status)})
				}
				else if (status.pseudos.lenght>0) {
					// Ardoise cliqués non identifiées
					m.body.push(desc.lbl+" @x:"+desc.cx+",y:"+desc.cy+",z:"+desc.cz)
					m.body.push("➥non identifiée")
				}
				else {
					m.body.push(desc.lbl+": ")
					m.body.push("➥à découvrir")
				}
			}
		}
		m.body.push(null)
		return m
	}
	// construction du message avec la liste des ardoises
	function helpBombes() {
		let m = { titre: "Etat des Bombes:", body: [], back:"papier" }
		for (let i=0, n=etat.objetsStatus.length; i<n; i++) {
			const desc = etat.objetsDesc[i]
			const status = etat.objetsStatus[i]
			// console.log("desc",desc,"status",status)
			if (desc.t=='b') {
				m.body.push(null)
				if (status.pseudos.length>0) {
					// La bombe a été localisée par qqun
					m.body.push(desc.lbl+" @x:"+desc.cx+",y:"+desc.cy+",z:"+desc.cz)
					// le pseudo a localisé la bombe ?
					if (status.pseudos.findIndex( (p)=> p.pseudo==pseudo ) < 0 )
						m.body.push("➥à désamorcer")
					else
						m.body.push("✅désamorcée")
				}
				else {
					// personne n'a localisé la bombe
					m.body.push(desc.lbl+":")
					m.body.push("➥à découvrir")
				}
			}
		}
		m.body.push(null)
		return m
	}
	// construction du message avec la liste des teleports
	function helpTeleport() {
		let m = { titre: "Ortho-téléportation:", body: [], back:"papier" }
		pseudoList.forEach( (p) => m.body.push( { txt: "👉"+p, cb: ()=>teleportation(p) } ) )
		return m
	}
	function helpHarmo() {
		return { titre: "Etat de ton Harmonique",
						 body: "Si cet icone clignote, ton Harmonique te proposera une mission... ou pas!" }
	}
	function helpCoord() {
		return { titre: "Tes Ortho-Coordonnées",
						 body: ["Elles ne respectent pas le même référentiel Euclidien que celui d'Eorzéa:",
										"Y et Z sont inversées"] }
	}

	function teleportation(dstPseudo) {
		dspMessage=null
		if (sceneActive!=sceneMain) return addNotification("Ortho-téléporteur non activé","yellow",5,"prout-long")
		// determine les coordonnées de la cible
		let dst = etat.pseudos[dstPseudo]
		if (!dst || !dst.pre)  return addNotification("Ortho-téléporteur non synchronisable vers "+dstPseudo,"yellow",5,"prout-long")
		// ajoute la commande dans la renderLoop
		renderCommands.push({op:"metro.teleport", loc:dst.loc})
	}

	// admin
	function toutFini() {
		console.log('*** tout fini')
		for (let i=0; i<etat.objetsDesc.length;i++) {
			let desc =etat.objetsDesc[i]
			switch(desc.t) {
				case 't':
					apiCall("/metropolis/tryReponse/"+i+"/"+desc.clg.r,'POST')
					break
				case'b':
					apiCall("/metropolis/objet/"+i,'POST')
			}
		}
	}
	
	// constantes
	const gp3dUrl = urlCdn+"MetaCache/3D/"
	const engineUrl = urlCdn+"MetaCache/Babylon/"
	const urlBabylonjs = engineUrl+"babylon.js"
	const urlBabylonGUI = engineUrl+"gui/babylon.gui.js"
	const urlBabylonjsLoader = engineUrl+"loaders/babylonjs.loaders.min.js"

	// ajoute un tag script, promise sur le onLoad
	function addScriptTag(id,url) {
		return new Promise((ok)=>{
			// la promise retourne null si ok ou le nom de l'ID si erreur
			// verifie si deja chargé
			if (document.getElementById(id)) { 
				console.log(id+" déja chargé")
				// addNotification(id+" déja chargé","green",2)
				ok(null);
				return
			}
			const heads = document.getElementsByTagName("HEAD")
			if (heads.length != 1) return alert("nb HEAD invalide != 1")
			const newScript = document.createElement('script')
			newScript.id = id
			newScript.crossorigin = true
			// append avant les autres attributs
			heads[0].appendChild(newScript)
			// gestion des events AVANT le src
			newScript.onload = function () {
				newScript.gpDthLoad = Date.now()
				console.log("onload:",id,Date.now());
				console.log(id+" chargé en "+ssms(newScript.gpDthLoad-newScript.gpDthStart))
				// addNotification(id+" chargé","green",2)
				ok(null) // close promise
			}
			newScript.onerror = function (e) {
				newScript.gpDthError = Date.now()
				console.log("onerror:",id,Date.now(),e)
				console.log(id+" erreur en "+ssms(newScript.gpDthLoad-newScript.gpDthStart),"red",15)
				addNotification("Erreur chargement "+id,"red",30)
				// supprime le tag du DOM
				newScript.remove()
				ok(id) // close promise ok meme en erreur
			}
			// chargement du script
			newScript.gpDthStart=Date.now()
			newScript.src = url
			console.log(".src ok",id, Date.now()) 
		})
	}
	/////////////////////////////////////////////////
	// Gestion de l'Engine 3D
	/////////////////////////////////////////////////
	async function engineLoad() {
		addNotification("Chargement moteur 3D","green",2)
		// bug possible si chargemetn en async et que le babyonjs ne soit pas encore chargé
		// d'ou le async en sériel
		console.warn("Kiki: Chargement Engine sérialisé cause bug en chargement full parralèle")
		console.warn("Kiki: Trouver la cause du non dispose d'un WebGL context")
		let p1= await addScriptTag("idBabylon",urlBabylonjs)
		let p2= await addScriptTag("idBabylonGUI",urlBabylonGUI)
		let p3= await addScriptTag("idBabylonjsLoader",urlBabylonjsLoader)

		// vérificaztions
		let asyncLoad = await Promise.all([p1,p2,p3])
	  console.log("loadEnginePromisesEnErreur:",asyncLoad)
		let loadError = asyncLoad.some((e)=>e)
		if (loadError)	addNotification("Erreur de chargement du Moteur 3D","red",30)
		return !loadError
	}
	function engineStop() {
		console.log('Arret du 3D engine')
		if (engine) {
			addNotification('Arret du moteur 3D',"green",2)
			sceneActive=null
			sceneMain=null
			engine.stopRenderLoop()
			console.log("Suppression des #scenes:",engine.scenes.length,engine.scenes)
			// engine.scenes.forEach((s)=> {console.log('disposeScene:',s.name); s.dispose()})
			engine.dispose()
			console.log("#scenes après engine.dispose():",engine.scenes.length,engine.scenes)
			engine=null
		}	
		else
			console.log('Moteur 3D pas démarré')
	}
	function engineStart() {
		console.warn("Kiki: Vérifier impact Engine(antialias,preserveDrawingBuffer)")
		if (engine) engineStop()
		let canvas = document.getElementById("render-canvas")
		if (!canvas) return addNotification("Erreur DOM: CANVAS not ready","red",15)
		if (!engine) {
			engine = new BABYLON.Engine(canvas, true, {
				antialias: true, // peu forcer la copie des framesbuffers - a analyser
				loseContextOnDispose: true, // pour être tranquillou
				stencil: true,
			  preserveDrawingBuffer: false, // permet le swap des buffers du canvas WebGL
				doNotHandleContextLost: false
			})
			engine.maxFPS=60
			console.log("Lancement renderLoop, engine.scenes.length=",engine.scenes.length)
			const renderLoop = function () {
				try {
					// console.log('renderloop')
					sceneActive?.render()
					sceneActive?.gpRenderCb?.()
					if (debugEngine) scenePerf?.render()
				}
				catch(e) {
					displayInfo({titre: "Erreur fatale dans RenderLoop", body: ["Erreur FATALE","Clique sur le bouton 'J'ai un soucis' pour report à Kikiadoc","Cause:",e.toString()], back: "rouge", ding:"explosion"})
					throw e
				}
			};
			engine.runRenderLoop(renderLoop);
			addNotification("Moteur 3D Up and running","green",2)
		}
		else
			addNotification("Moteur 3D déjà opérationnel","green",2)
	}

	////////////////////////////////////////////////////////
	//Skybox & ground
	////////////////////////////////////////////////////////
	function buildSkyBox(scene,type) {
		const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:WORLDSIZE*2+10}, scene);
		const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
		skyboxMaterial.backFaceCulling = false;
		skyboxMaterial.disableLighting = true;
		switch(type) {
			case "space":
		    let files = [
		        gp3dUrl+"skybox/space_left.jpg", //left
		        gp3dUrl+"skybox/space_up.jpg", //up
		        gp3dUrl+"skybox/space_front.jpg", //front
		        gp3dUrl+"skybox/space_right.jpg",
		        gp3dUrl+"skybox/space_down.jpg",
		        gp3dUrl+"skybox/space_back.jpg",
		    ];
				skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture.CreateFromImages(files, scene)
				break
			default:
				// skybox nuages
				skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(gp3dUrl+"skybox/skybox", scene);
				// skybox.infiniteDistance = true;
				// skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
				// skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		}
		skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
		skybox.material = skyboxMaterial;
		return skybox
	}
	function buildGround(scene) {
		const groundMaterial = new BABYLON.StandardMaterial('goundMat', scene)
		// groundMaterial.diffuseTexture = new BABYLON.Texture(gp3dUrl+"tests/floor.png")
		groundMaterial.diffuseTexture = new BABYLON.Texture(gp3dUrl+"skybox/space_up.jpg")
		groundMaterial.diffuseTexture.uScale = 40.0 //Repeat on the Vertical Axes
		groundMaterial.diffuseTexture.vScale = 40.0 //Repeat on the Horizontal Axes
		const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:300, height:300, subdivisions: 1},scene)
		ground.material = groundMaterial
		ground.position.y = -0.01
	}

	/////////////////////////////////////////////////
	// Scene de metrologie
	/////////////////////////////////////////////////
	function createScenePerf(engine) {
	  const scene = new BABYLON.Scene(engine)
		scene.autoClear = false
		const camera = new BABYLON.Camera("camPerf",new BABYLON.Vector3(0,0,0),scene)
		let UIavt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UIPerf")

    // Instrumentation
    let instrumentation = new BABYLON.EngineInstrumentation(engine)
    instrumentation.captureGPUFrameTime = true;
    instrumentation.captureShaderCompilationTime = true;
    
    // GUI
    let stackPanel = new BABYLON.GUI.StackPanel();
    stackPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
    stackPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
		stackPanel.width="15%"
		// stackPanel.background="red"
    stackPanel.isVertical = true;
    UIavt.addControl(stackPanel);    

    var text1 = new BABYLON.GUI.TextBlock();
    text1.text = "";
    text1.color = "white";
    text1.fontSize = 16;
    text1.height = "30px";
    stackPanel.addControl(text1);       

    var text2 = new BABYLON.GUI.TextBlock();
    text2.text = "";
    text2.color = "white";
    text2.fontSize = 16;
    text2.height = "30px";
    stackPanel.addControl(text2);       

    var text3 = new BABYLON.GUI.TextBlock();
    text3.text = "";
    text3.color = "white";
    text3.fontSize = 16;
    text3.height = "30px";
    stackPanel.addControl(text3);       

    var text4 = new BABYLON.GUI.TextBlock();
    text4.text = "";
    text4.color = "white";
    text4.fontSize = 16;
    text4.height = "30px";
    stackPanel.addControl(text4);        

    var text5 = new BABYLON.GUI.TextBlock();
    text5.text = "";
    text5.color = "white";
    text5.fontSize = 16;
    text5.height = "30px";
    stackPanel.addControl(text5);       

    scene.registerBeforeRender(function () {
			text1.text = "GPU/Ш:" + (instrumentation.gpuFrameTimeCounter.current * 0.000001).toFixed(2) + "ms"
			text2.text = "GPU/X̄:" + (instrumentation.gpuFrameTimeCounter.lastSecAverage * 0.000001).toFixed(2) + "ms"
			text3.text = "GPU/X̄:" + (instrumentation.gpuFrameTimeCounter.max * 0.000001).toFixed(2) + "ms"
			text4.text = "Shader/X̄: " + (instrumentation.shaderCompilationTimeCounter.lastSecAverage).toFixed(2) + "ms"
			text5.text = "FPS:" + (engine.getFps() ).toFixed(2) + "ms"
			// text4.text = "Shader/X̄: " + (instrumentation.shaderCompilationTimeCounter.average).toFixed(2) + "ms"
			// text3.text = "Shader/Ш: " + (instrumentation.shaderCompilationTimeCounter.total).toFixed(2) + "ms"
			// text4.text = "Shader/X̄: " + (instrumentation.shaderCompilationTimeCounter.average).toFixed(2) + "ms"
			// text5.text = "Shader/n: " + instrumentation.shaderCompilationTimeCounter.count
    })

		return scene
	}
	
	///////////////////////////
	// loading scene
	///////////////////////////
	async function createSceneLoading(engine) {
		let dthStart=performance.now()
	  const scene = new BABYLON.Scene(engine)
    const camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI/2, Math.PI/3, 10, new BABYLON.Vector3(0, 0, 0), scene);
		let canvas = document.getElementById("render-canvas")
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(-15, 0, -10),scene)
		let loading = null // batterie qui se charge
		let skyBox = buildSkyBox(scene)

		// indicateur de chargement...
		let pChargement = await BABYLON.SceneLoader.ImportMeshAsync(null, gp3dUrl+"tests/", "mod__charge.glb", scene)
		loading = pChargement.meshes[0]
    loading.position = new BABYLON.Vector3(0,0,-3)
		loading.scaling = new BABYLON.Vector3(-10000, 10000, 10000)

		// cannette
		const canMaterial = new BABYLON.StandardMaterial("material", scene);
		canMaterial.diffuseTexture = new BABYLON.Texture(gp3dUrl+"tests/kikiEvent.png")
		const faceUV = [];
		faceUV[0] =	new BABYLON.Vector4(0, 0, 0, 0);
    faceUV[1] =	new BABYLON.Vector4(1, 0, 0.25, 1); // x, z swapped to flip image
    faceUV[2] = new BABYLON.Vector4(0, 0, 0.24, 1);
		const faceColors = [ ]
    faceColors[0] = new BABYLON.Color4(0.5, 0.5, 0.5, 1)
		const can = BABYLON.MeshBuilder.CreateCylinder("can", {height:1.16, faceUV: faceUV, faceColors: faceColors});
		can.material = canMaterial
		can.position.x = 5
		can.scaling = new BABYLON.Vector3(3, 3, 3)
		BABYLON.Animation.CreateAndStartAnimation("animP", can, "rotation.y", 30,120,
							0,2*Math.PI,BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
		)
		const can2 = can.clone()
		can2.position.x = -5
		BABYLON.Animation.CreateAndStartAnimation("animP", can2, "rotation.y", 30,120,
							2*Math.PI,0,BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
		)

		// stargate
		let cStargate = null
		const pStargate = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kiki-stargate.glb", scene).then((r)=>cStargate=r)
		await Promise.all([pStargate])
		let refMesh = cStargate.rootNodes[0]
		refMesh.position=new BABYLON.Vector3(0,0,0)
		refMesh.rotation=new BABYLON.Vector3(Math.PI,-Math.PI/2,Math.PI/2)
		refMesh.scaling=new BABYLON.Vector3(0.03,0.03,0.03)
		let cloned = cStargate.instantiateModelsToScene(undefined, false, { doNotInstantiate: true });
		cloned.name="kikiWelcomeStargate"
		cloned.animationGroups[0].start();
    cloned.animationGroups[0].loopAnimation = true
		
		// boutton de lancement du challenge
		let manager = new BABYLON.GUI.GUI3DManager(scene)
		let anchor = new BABYLON.AbstractMesh("anchorButton", scene)
    let button = new BABYLON.GUI.HolographicButton("btnGoMiniJeu")
    manager.addControl(button)
    button.linkToTransformNode(anchor)
    button.position = new BABYLON.Vector3(0,0,0)
		button.scaling = new BABYLON.Vector3(2,2,3)
    button.text = "l'Ortho-temps"
    button.imageUrl = gp3dUrl+"tests/"+"GrandePeluche-lion.png"
		button.onPointerUpObservable.add(function(){ mainSceneSwitchTo() })

		/*
		// tore avec gizmo
		const torus = BABYLON.MeshBuilder.CreateTorus("torus",{diameter:4, thickness: 0.5, tessellation:64 }, scene);
		torus.position.x = -6
		// torus.rotation.x = Math.PI/2
		const gizmoManager = new BABYLON.GizmoManager(scene)
		console.log('***** après 8',engine,scene)
		gizmoManager.positionGizmoEnabled = true;
		gizmoManager.rotationGizmoEnabled = true;
		// gizmoManager.attachableMeshes = [torus]
		gizmoManager.attachToMesh(torus);

		let cGoaRing = null
		const pGoaRing = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kiki-GoaRing.glb", scene).then((r)=>cGoaRing=r)
		await Promise.all([pGoaRing])
		let refMesh = cGoaRing.meshes[0]
		refMesh.position=new BABYLON.Vector3(0,0,0)
		refMesh.rotation=new BABYLON.Vector3(Math.PI,0,Math.PI/2)
		refMesh.scaling=new BABYLON.Vector3(1,1,1)
		let cloned = cGoaRing.instantiateModelsToScene(undefined, false, { doNotInstantiate: true });
		cloned.animationGroups[0].start();
    cloned.animationGroups[0].loopAnimation = true;
		*/



		// OK scene de chargement disponible
		scene.gpRenderCb = ()=>{
			// rotations
			// can.rotation.y = (can.rotation.y + 0.02) % (2*Math.PI)
			// orus.rotation.x = (torus.rotation.x + 0.02) % (2*Math.PI)
		}
		scene.gpMainLoaded = () => {
			loading.dispose()
		}
		let dthEnd=performance.now()
		apiCall("/metrologie/engine3D.loadLoading",'POST',{start:dthStart, end:dthEnd})
		return scene
	}

	
	///////////////////////////
	// main scene
	///////////////////////////
	async function createSceneMain(engine) {
		const scene = new BABYLON.Scene(engine);
		// Camera
		const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 0.1, 0),scene);
		// scene.gravity = new BABYLON.Vector3(0, -0.15, 0);
		// camera.applyGravity = true;
		camera.speed=0.2
		camera.minZ = 0.2;
		camera.maxZ = 250;
		camera.position = new BABYLON.Vector3(POSITIONPOP.x,POSITIONPOP.y,POSITIONPOP.z)
		camera.rotation = new BABYLON.Quaternion.Zero()
		camera.ellipsoid = new BABYLON.Vector3(0.19, 0.19, 0.19)
		camera.inputs.clear()
		camera.inputs.addMouse()
		camera.attachControl(false);
		// Light
		const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 10, 0));
		light.diffuse = new BABYLON.Color3(0.8, 0.3, 0.6);
		// light.specular = new BABYLON.Color3(0, 1, 0);
		// light.groundColor = new BABYLON.Color3(0, 1, 0);

		console.warn("Téléchargement multiplexés lancés","green",2)

		// Dude, ville...
		let dlStart = performance.now()
		// let dude = null
		// let pDude = BABYLON.SceneLoader.ImportMeshAsync("him", gp3dUrl+"Dude/", "Dude.babylon", scene).then((r)=>dude=r)
		// let skull= null
		// let pSkull = BABYLON.SceneLoader.ImportMeshAsync(null, gp3dUrl+"tests/", "skull.babylon", scene).then((r)=>skull=r)
		let ville= null
		// let pVille = BABYLON.SceneLoader.ImportMeshAsync(null, gp3dUrl+"tests/", "after_the_rain.glb", scene).then((r)=>ville=r)
		let pVille = BABYLON.SceneLoader.ImportMeshAsync(null, gp3dUrl+"tests/", "city_rtx.glb", scene).then((r)=>ville=r)
		let cBombeRouge = null
		const pBombeRouge = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kikiBomb-rouge13.glb", scene).then((r)=>cBombeRouge=r)
		let cBombeVerte = null
		const pBombeVerte = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kikiBomb-vert2.glb", scene).then((r)=>cBombeVerte=r)
		let cBombeOrange = null
		const pBombeOrange = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kikiBomb-orange.glb", scene).then((r)=>cBombeOrange=r)
		let cBoy = null
		const pBoy = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kiki-boy3.glb", scene).then((r)=>cBoy=r)
		let cGirl = null
		const pGirl = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kiki-girl2.glb", scene).then((r)=>cGirl=r)
		let cTableauCheck = null
		const pTableauCheck = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kiki-tableauNoir-check.glb", scene).then((r)=>cTableauCheck=r)
		let cTableauUncheck = null
		const pTableauUncheck = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kiki-tableauNoir-uncheck.glb", scene).then((r)=>cTableauUncheck=r)
		let cGoaRing = null
		const pGoaRing = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kiki-GoaRing.glb", scene).then((r)=>cGoaRing=r)
		let cHarmonique = null
		const pHarmonique = BABYLON.LoadAssetContainerAsync(gp3dUrl+"tests/kiki-harmonique2.glb", scene).then((r)=>cHarmonique=r)
		// Attente téléchargements
		await Promise.all([pVille,pBombeRouge,pBombeVerte,pBombeOrange,pBoy,pGirl,pTableauCheck,pTableauUncheck,pGoaRing,pHarmonique])
		let dlEnd = performance.now()
		console.warn("Téléchargement multiplexés OK")
		addNotification("Fin des téléchargements","green",2)
		
		// Post traitements
		// skybox
		let skyBox = buildSkyBox(scene,"space")
		// Gound
		let ground = buildGround(scene)

		/*
		// foret
		const spriteManagerTrees = new BABYLON.SpriteManager("treesManager",
			gp3dUrl+"sprites/palm.png", 2000, {width: 512, height: 1024}, scene);
		for (let i = 0; i < 500; i++) {
			const tree = new BABYLON.Sprite("tree", spriteManagerTrees);
			tree.position.x = Math.random() * (-30);
			tree.position.z = Math.random() * 20 + 8;
			tree.position.y = 0.5;
		}
		*/

		// empehce la camera sous le sol et au dela su skybox
		// scene.collisionsEnabled = true;
		// camera.checkCollisions = true;
		// ground.checkCollisions = true;
		// skyBox.checkCollisions = true;

		///////////////////////////////////////
		// gestion des cclicks
		///////////////////////////////////////
		// click sur 'harmonique'
		function harmoClick() {
			if (!harmoTask) {
				dspMessage = {titre: "Harmonique",
											body: ["Je suis ton Harmonique de l'Ortho-temps",
														 "Je recois parfois des messages trans-temporels",
														 "Je n'en conserve que le dernier"]	}
				return
			}
			if (Date.now() < lastSurchauffe + DELAITABLEAUCLIC) {
				dspMessage = { titre: "Harmonique",
											 body: ["Mes transistors trans-temporels sont en surchauffe",
															"Attend encore "+countDownTo(lastSurchauffe + DELAITABLEAUCLIC)+" qu'ils refroidissent",
															"Tu peux solliciter tes amis pour le job!" ]	}
				return
			}
			let desc = etat.objetsDesc[harmoTask.i]
			let status = etat.objetsStatus[harmoTask.i]
			console.warn("kiki: manque le test de delai d'harmonique")
			let m = {
				titre: 'Harmonique:',
				body: [desc.lbl+":",desc.clg.t],
				trailer: 'tu peux fermer ce popup et recliquer plus tard'
			}
			// ajoute les options du challenge
			desc.clg.o.forEach( (txt, idx) => m.body.push( { txt: txt, cb: ()=>harmoTry(harmoTask.i,idx) } ) )
			dspHarmo = m
		}
		// clic sur un perso 
		function persoClick(mOrg,m) {
			if (m.metadata.p==pseudo) {
				harmoClick()
			}
			else {
				dspMessage={titre:"Harmonique", body:[
					"En Eorzéa je pense que c'est "+m.metadata.p,
					{txt:"Faire Coucou",
					 cb:()=>{wsSend({op:'metro.emote',emote:'coucou',orgPseudo:pseudo,dstPseudo:m.metadata.p});
									 dspMessage=null} }
				] }
			}
		}
		function tableauClick(i,desc,status,todo) {
			if (status.termine) {
				dspMessage = helpTermine(desc,status)
				return
			}
			// si delai non respecté
			if (Date.now() < lastSurchauffe + DELAITABLEAUCLIC) {
				dspMessage = { titre:desc.lbl, body: ["Tu ne peux tenter d'identifier cette Ardoise car les transistors trans-temporels de ton Harmonique sont en surchauffe",
																							"Patiente encore "+countDownTo(lastSurchauffe + DELAITABLEAUCLIC),
																							"Tu peux aussi indiquer ce lieu à tes amis pour qu'ils tente de l'identifier"
																						 ]}
				return
			}
			lastSurchauffe = Date.now()	
			apiCall("/metropolis/objet/"+i,'POST')
			dspMessage = { titre: desc.lbl, body: "Tu as activé une énigme. Consulte ton harmonique", trailer:"Manque le test de delai"}
			switch(todo) {
				case 0: // Premier pseudo à cliquer
				case 1: // un autre a deja cliqué
				case 2: // Déjà cliqué 
			}
		}
		function bombeClick(i,desc,status,todo) {
			// dans tous es cas on clique sur le server
			apiCall("/metropolis/objet/"+i,'POST')
			switch (todo) {
				case 0: // Premier pseudo à cliquer 
					dspMessage = { titre:desc.lbl, body:["Tu as désamorcé cette bombe en premier","Propose à tes amis de s'Ortho-Téléporter"] }
					break;
				case 1: // Pas le premier à cliquer
					dspMessage = { titre:desc.lbl, body:"Tu as désamorcé cette bombe" }
					break;
				case 2: // Déjà cliqué
					dspMessage = { titre:desc.lbl, body:"Tu as déjà désamorçé cette bombe"}
					break;
			}
		}
		function ringClick(i,desc,status,todo) {
			apiCall("/metropolis/objet/"+i,'POST')
			if (!isMetroTermine())
					dspMessage = { titre:'Anneaux de retour', 
												 body:["Il te reste des trucs à faire dans l'Ortho-Temps",
															 "Tes amis et toi doivent avoir identifié toutes les Ardoises",
															 "Tu dois avoir désamorcé toutes les bombes"
															] }
			else	
					dspMessage = { titre:'Anneaux de retour',
												 body: [
													 "Tu as effectué toutes tes tâches dans l'Ortho-Temps",
													 "Vérifie que c'est aussi le cas de tes amis",
													 {txt:"Retour en Eorzéa",cb: ()=>{epiqStep=90}}
												 ]
											 }
			// activation de l'animation du ring
		}
		///////////////////////////////////////
		// gestion des objets
		///////////////////////////////////////
		let objetsModel = [] // reference aux mesh ds objets
		function objetClick(meshOrg,meshMeta) {
			let i = meshMeta.metadata.i // numéro de l'objet
			// contexte de l'objet et regarde si l'objet a déjà été trouvé, et/ou par le joueur
			let desc = etat.objetsDesc[i]
			let status = etat.objetsStatus[i]
			let premier = status.pseudos[0]
			let idxTrouve = status.pseudos.findIndex((e)=>e.pseudo==pseudo)
			if (debugClick) addNotification("objetClick:"+i+" idxTrouve:"+idxTrouve,"blue")
			// 0 personne n'a encore cliqué, sera la premier
			// 1 qqun a déjà cliqué, mais pas encore le joueur
			// 2 le joueur a déjà cliqué
			let todo = (!premier)? 0 : (idxTrouve<0)? 1 : 2
			switch(desc.t) {
				case 'b': bombeClick(i,desc,status,todo); break
				case 't': tableauClick(i,desc,status,todo); break
				case 'r': ringClick(i,desc,status,todo); break
				default: throw new Error("objetClick: Erreur sur type d'objet, idx="+i)
			}
			return true
		}
		function objetGetRefContainer(desc,status,idxObjet) {
			let idxTrouve = status.pseudos.findIndex((e)=>e.pseudo==pseudo)
			switch (desc.t) {
				case "b": // bombe
					// vert si trouve, organe si trouve par un autre, rouge si pas trouve
					return (status.pseudos.length==0)?	cBombeRouge // personne n'a trouvé
						: (idxTrouve<0)? cBombeOrange : cBombeVerte
				case "t": // tableau indice
					return (status.termine)? cTableauCheck : cTableauUncheck
				case "r": // anneau goa-ring
					console.warn("Kiki: Completer le choix du mesh du ring")
					return cGoaRing
				default:
					dspObject = desc
					throw new Error("Erreur sur type d'objet dans objetGetRefContainer")
			}
		}
		function objetSetMesh(i) {
			// supprime le mesh actuel si existe
			objetsModel[i]?.dispose()
			// description de l'objet
			let desc=etat.objetsDesc[i]
			// si pas de type d'objet, skip l'objet
			if (!desc.t) return
			// status de l'objet
			let status = etat.objetsStatus[i]
			// recupere le mesh 
			let refContainer = objetGetRefContainer(desc,status,i)
			// defini le mesh
			let cloned = refContainer.instantiateModelsToScene((name) => "kikiObj-"+i+"." + name, false, { doNotInstantiate: true });
			// console.warn('cloned:',i,cloned)
			let newMesh = cloned.rootNodes[0]
			// position, rotation,scaling
			newMesh.position=new BABYLON.Vector3(desc.cx,desc.cy,desc.cz)
			newMesh.rotation=new BABYLON.Vector3(desc.rx,desc.ry,desc.rz)
			newMesh.scaling=new BABYLON.Vector3(desc.size,desc.size,desc.size)
			// set callback
			newMesh.metadata={gpClick:objetClick, i:i}
			// si animation prédéfinie
			if (cloned.animationGroups?.[0]) {
				cloned.animationGroups[0].start()
		    cloned.animationGroups[0].loopAnimation = true
			}
			// animations complementaires eventuelles
			if (desc.anim=="r") {
				BABYLON.Animation.CreateAndStartAnimation("animP", newMesh, "rotation.y", 30,120,
							0,2*Math.PI,BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
				)
			}
			objetsModel[i]=cloned
		}
		// initialisation des objets
		// methode déclarées en async pour éviter les soucis de dection de boucle dans le playground
		async function objetsInit() {
			const startDth = Date.now()
			const nb = etat.objetsStatus.length
			for (let i=0; i < nb; i++) {
				await objetSetMesh(i)
			}
			console.log("*** objInit (ms):",Date.now()-startDth)
		}
		await objetsInit()


		///////////////////////////////////////
		// gestion des persos connectés
		///////////////////////////////////////
		///// DEBUG PERSOS
		/*
		let newBoy = cBoy.meshes[0].clone("KikiBoy1")
		newBoy.position=new BABYLON.Vector3(-2,0,0)
		newBoy.rotation=new BABYLON.Vector3(0,0,0)
		newBoy.scaling=new BABYLON.Vector3(0.01,0.01,0.01)
		let newGirl = cGirl.meshes[0].clone("KikiGirl1")
		newGirl.position=new BABYLON.Vector3(2,0,0)
		newGirl.rotation=new BABYLON.Vector3(0,0,0)
		newGirl.scaling=new BABYLON.Vector3(0.01,0.01,0.01)
		*/
		// positionne le mesh du persos selon ses caractéristiques vu depuis le server
		// [] { m:mesh, p:animP, r: animR}
		let persosDesc = {}
		function persoSetMesh(nomPerso){
			let srvPersoDesc=etat.pseudos[nomPerso]
			let  isMoi = nomPerso==pseudo
			if (srvPersoDesc.pre) {
				// le personnage est présent
				let desc = persosDesc[srvPersoDesc.p]
				if (!desc) {
					// le perso n'a pas de mesh on le crée
					let isBoy
					switch(srvPersoDesc.g) {
						case 'M':isBoy=true; break;
						case 'F':isBoy=false; break;
						default: isBoy=Math.random()<0.5
					}
					let container = (isMoi)?cHarmonique: (isBoy)? cBoy : cGirl
					let cloned = container.instantiateModelsToScene((name) => srvPersoDesc.p+"."+name, false, { doNotInstantiate: true });
					let newMesh = cloned.rootNodes[0]
					// newMesh.checkCollisions = true;
					newMesh.position=new BABYLON.Vector3(0,0,0)
					newMesh.rotation=new BABYLON.Vector3(0,0,0)
					newMesh.scaling=(isMoi)? new BABYLON.Vector3(0.005,0.005,0.01) : new BABYLON.Vector3(0.02,0.02,0.02)
					// si animation prédéfinie
					if (cloned.animationGroups?.[0]) {
						cloned.animationGroups[0].start()
				    cloned.animationGroups[0].loopAnimation = true
					}
					newMesh.metadata = { gpClick : persoClick, p: srvPersoDesc.p }
					desc = {m: newMesh, p:null, r:null }
					persosDesc[srvPersoDesc.p] = desc
				}
				// deplace le pseudo a l'endroit indiqué par ee server
		    let startPosition,endPosition,startRotation,endRotation
				if (isMoi) { // Harmonique en fiat
					startPosition = desc.m.position.clone()
					endPosition = new BABYLON.Vector3(srvPersoDesc.loc.cx-0.2,srvPersoDesc.loc.cy,srvPersoDesc.loc.cz+0.2)
					startRotation = desc.m.rotation.clone()
			    endRotation = new BABYLON.Vector3(srvPersoDesc.loc.rx+Math.PI/10,srvPersoDesc.loc.ry,srvPersoDesc.loc.rz)
					// endRotation.x -= Math.PI/4
				}
				else {
					startPosition = desc.m.position.clone()
					endPosition = new BABYLON.Vector3(srvPersoDesc.loc.cx,srvPersoDesc.loc.cy,srvPersoDesc.loc.cz)
					startRotation = desc.m.rotation.clone()
			    endRotation = new BABYLON.Vector3(srvPersoDesc.loc.rx,srvPersoDesc.loc.ry,srvPersoDesc.loc.rz)
				}
				if (! startPosition.equals(endPosition)) {
					// console.log('animp1')
					desc.p?.stop()
					desc.p = BABYLON.Animation.CreateAndStartAnimation("animP", desc.m, "position", 30,15,
							startPosition, endPosition,
							BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
							// null, // new BABYLON.BackEase(1),
							// null // ()=>console.log('animPend')
					)
					// console.log('animp2')
				}
				if (! startRotation.equals(endRotation)) {
					// console.log('animr1')
					desc.r?.stop()
					desc.r = BABYLON.Animation.CreateAndStartAnimation("animP", desc.m, "rotation", 30,15,
							startRotation, endRotation,
							BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
							null, // new BABYLON.BackEase(1),
							null // ()=>console.log('animRend'))
					)
					// console.log('animr2')
				}
			}
			else {
				// Le personnage n'est plus préent
				if (persosDesc[srvPersoDesc.p]) {
					// supprime le mesh
					console.log("Perso deco:",srvPersoDesc.p)
					persosDesc[srvPersoDesc.p].p?.stop()
					persosDesc[srvPersoDesc.p].r?.stop()
					persosDesc[srvPersoDesc.p].m?.dispose()
					delete persosDesc[srvPersoDesc.p]
				}
			}
		}

		Object.keys(etat.pseudos).forEach( (nomPseudo)=> persoSetMesh(nomPseudo) )

			

		///////////////////////////////////////
		// Gestion de l'IHM
		///////////////////////////////////////
		let globalTextureUI = null // reference texture IHM
		let ihmObs = [] // liste des observers posés dans l'ihm

		const padButtonsPC1 =[
			{ txt:" ", state: false },
			{ txt:"⇈", state: false, camMove: BABYLON.Vector3.Forward() },
			{ txt:" ", state: false },
			{ txt:"↶", state: false, camRota: new BABYLON.Vector2(0,-0.01) },
			{ txt:"⇡", state: false, camSlow: BABYLON.Vector3.Forward()  },
			{ txt:"↷", state: false, camRota: new BABYLON.Vector2(0,0.01)},
			{ txt:"↥", state: false, camRota: new BABYLON.Vector2(-0.01,0) },
			{ txt:"⇊", state: false, camMove: BABYLON.Vector3.Backward() },
			{ txt:"↧", state: false, camRota: new BABYLON.Vector2(0.01,0)}
		]
		const padButtonsPC2 =[
			{ txt:" ", state: false},
			{ txt:" ", state: false},
			{ txt:" ", state: false},
			{ txt:" ", state: false},
			{ txt:" ", state: false},
			{ txt:" ", state: false},
			{ txt:" ", state: false},
			{ txt:" ", state: false},
			{ txt:" ", state: false}
		]
		const padButtonsSM1 =[
			{ txt:"⇈", state: false, camMove: BABYLON.Vector3.Forward()  },
			{ txt:"⇡", state: false, camSlow: BABYLON.Vector3.Forward() },
			{ txt:"↷", state: false, camRota: new BABYLON.Vector2(0,0.01) },
			{ txt:"↥", state: false, camRota: new BABYLON.Vector2(-0.01,0) }
		]
		const padButtonsSM2 =[
			{ txt:"⇊", state: false, camMove: BABYLON.Vector3.Backward() },
			{ txt:"⇣", state: false, camSlow: BABYLON.Vector3.Backward() },
			{ txt:"↶", state: false, camRota: new BABYLON.Vector2(0,-0.01) },
			{ txt:"↧", state: false, camRota: new BABYLON.Vector2(0.01,0) }
		]
		function padDoAction(padButton) {
			if (padButton.camMove)
					camera.cameraDirection.addInPlace(camera.getDirection(padButton.camMove).scale(sensibilite/30))
			if (padButton.camSlow)
					camera.cameraDirection.addInPlace(camera.getDirection(padButton.camSlow).scale(sensibilite/300))
			if (padButton.camRota)
					camera.cameraRotation.addInPlace(padButton.camRota.scale(0.1))
			switch (padButton.a) {
				case 'pipoTest':
				default:
					// addNotification('touche non attribuee',"red",1)
			}
		}
		function padPcSetup(padGrid,padButtons,v,h) {
	    padGrid.verticalAlignment = v
	    padGrid.horizontalAlignment = h
	    padGrid.width = "30%"
	    padGrid.height = "24%"
	    padGrid.addRowDefinition(0.2)
	    padGrid.addRowDefinition(0.2)
	    padGrid.addRowDefinition(0.2)
	    padGrid.addColumnDefinition(0.5)
	    padGrid.addColumnDefinition(0.5)
	    padGrid.addColumnDefinition(0.5)
			for (let i=0; i <padButtons.length; i++) {
				let button = BABYLON.GUI.Button.CreateSimpleButton("PAD_"+i, padButtons[i].txt)
		    button.width = "100%";
		    button.height = "100%";
		    button.color = "white";
		    button.background = "green";
		    button.onPointerDownObservable.add(function () { padButtons[i].etat = true })
		    button.onPointerUpObservable.add(function () { padButtons[i].etat = false })
				padGrid.addControl(button, Math.floor(i/3), i%3)
	    }
			console.warn("kiki: onBeforeRenderObservable peut faire une fuite mémoire")
	    ihmObs.push(
		    scene.onBeforeRenderObservable.add( () => {
					for (let i=0; i <padButtons.length; i++) {
						if (padButtons[i].etat) {
							padDoAction(padButtons[i])
						}
					}
				})
			)
		}
		function padSmSetup(padGrid,padButtons,v,h) {
	    padGrid.verticalAlignment = v
	    padGrid.horizontalAlignment = h
	    padGrid.width = "10%"
	    padGrid.height = "90%"
			for (let i=0; i <padButtons.length; i++) {
		    padGrid.addRowDefinition(1/padButtons.length)
			}
	    padGrid.addColumnDefinition(1)
			for (let i=0; i <padButtons.length; i++) {
				let button = BABYLON.GUI.Button.CreateSimpleButton("PAD_"+i, padButtons[i].txt)
		    button.width = "100%";
		    button.height = "100%";
		    button.color = "white";
		    button.background = "green";
		    button.onPointerDownObservable.add(function () { padButtons[i].etat = true })
		    button.onPointerUpObservable.add(function () { padButtons[i].etat = false })
				padGrid.addControl(button, i, 0)
	    }
			console.warn("kiki: onBeforeRenderObservable peut faire une fuite mémoire")
	    ihmObs.push(
				scene.onBeforeRenderObservable.add( () => {
					for (let i=0; i <padButtons.length; i++) {
						if (padButtons[i].etat) {
							padDoAction(padButtons[i])
						}
					}
				})
			)
		}
		function checkBoxSetup(parentGrid,l,c,txt,init,cbChecked) {
			let checkbox = new BABYLON.GUI.Checkbox()
	    checkbox.isChecked = init
			checkbox.color = "white"
			checkbox.name="ckBox"+l+c
	    checkbox.onIsCheckedChangedObservable.add(cbChecked)
	    checkbox.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
	    let header = new BABYLON.GUI.TextBlock();
	    header.text = txt;
			header.name="hdr"+l+c
	    header.color = "white"
	    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
			parentGrid.addControl(header, l, c)
			parentGrid.addControl(checkbox, l, c+1)
		}
		
		function buildIhmCommon(globalTextureUI) {
		}
		
		function buildIhmPC(globalTextureUI) {
			let padPcGrids= [new BABYLON.GUI.Grid(),new BABYLON.GUI.Grid()]
			padPcSetup(padPcGrids[0],padButtonsPC1,BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM,BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT)
			padPcSetup(padPcGrids[1],padButtonsPC2,BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM,BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT)
			globalTextureUI.addControl(padPcGrids[0])
	    globalTextureUI.addControl(padPcGrids[1])
		}
		function buildIhmSM(globalTextureUI) {
			let padSmGrids= [new BABYLON.GUI.Grid(),new BABYLON.GUI.Grid()]
			padSmSetup(padSmGrids[0],padButtonsSM1,BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP,BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT)
			padSmSetup(padSmGrids[1],padButtonsSM2,BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP,BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT)
			globalTextureUI.addControl(padSmGrids[0])
	    globalTextureUI.addControl(padSmGrids[1])
		}
		
		function newIhm() {
			if (globalTextureUI) globalTextureUI.dispose()
			// remove tous les observer d'IHM
			console.warn("Kiki: vérfier le remove des ihm observer")
			let o
			while (o = ihmObs.pop()) {
				scene.onBeforeRenderObservable.remove(o)
			}
			// construction de l'ihm
			globalTextureUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI")
			if (modeIHM) {
				buildIhmCommon(globalTextureUI)
				buildIhmPC(globalTextureUI)
			}
			else {
				buildIhmCommon(globalTextureUI)
				buildIhmSM(globalTextureUI)
			}
		}

		// consturction e l'IHMM
		newIhm()

		///////////////////////////////////////
		// Gestion du pointer / wheel
		///////////////////////////////////////
    let sphereClick = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.3, segments: 32}, scene);
		// cherche une callbakc de click		
		function doGpClickOnMesh(meshOrg) {
			if (sceneActive!=sceneMain) return console.log('pickedMesh, hors main scene',meshOrg.name)
			// remonte la chaine des parent a la recherc d'un metadata de click
			let m = meshOrg
			let i = 0
			while (m && i++ < 10) {
				if (m.metadata?.gpClick?.(meshOrg,m) ) return
				m = m.parent
			}
			if (debugClick) console.log('pickedMesh pas de metadata.gpClick (orgmesh,nbIter):',meshOrg,i)
		}
	  // When a pointer event is observed, handle it
    scene.onPointerObservable.add((eventData) => {
			switch(eventData.type) {
				case BABYLON.PointerEventTypes.POINTERTAP:
					let mesh = eventData.pickInfo.pickedMesh
					// console.log(eventData)
					if (debugClick && eventData.pickInfo.pickedPoint) {
						console.log("pickInfo",eventData,eventData.pickInfo.pickedPoint,eventData.pickInfo.pickedMesh)
						let pick = eventData.pickInfo.pickedPoint
						sphereClick.position.x = pick.x
						sphereClick.position.y = pick.y
						sphereClick.position.z = pick.z
						addNotification("Mesh:"+mesh?.name+" x:"+pick.x.toFixed(2)+" y:"+pick.y.toFixed(2)+" z:"+pick.z.toFixed(2),"blue",14)
					}
					// si click sur un mesh...
					if (mesh) doGpClickOnMesh(mesh)
					break;
				case BABYLON.PointerEventTypes.POINTERWHEEL:
					// console.log(eventData)
					let wc = (wheelDir)? 1:-1
					let dir = (eventData.event.deltaY>0)? 1:-1
					padDoAction(padButtonsPC1[ (wc*dir>0)? 1 : 7])
					break;
			}
    })
		// gestion des touches
		scene.onKeyboardObservable.add((kbInfo) => {
		  switch (kbInfo.type) {
		    case BABYLON.KeyboardEventTypes.KEYDOWN:
					switch (kbInfo.event.key) {
						case "q":
						case "ArrowLeft":
							padDoAction(padButtonsPC1[3])
							break
						case "d":
						case "ArrowRight":
							padDoAction(padButtonsPC1[5])
							break
						case "z":
						case "ArrowUp":
							padDoAction(padButtonsPC1[4])
							break
						case "s":
						case "ArrowDown":
							padDoAction(padButtonsPC1[7])
							break
					}
		      // console.log("KEY DOWN: ", kbInfo.event.key);
		      break;
		    // case BABYLON.KeyboardEventTypes.KEYUP:
		    //  console.log("KEY UP: ", kbInfo.event.code);
		    //  break;
		  }
		});

		// const axes = new BABYLON.Debug.AxesViewer(scene, 1)
		console.log("Fin des post-traitements")

		///////////////////////////////////////
		// Main scene render loop
		///////////////////////////////////////
		let lastCamCoord = BABYLON.Vector3.Zero()
		let lastCamRota = BABYLON.Vector3.Zero()
		function renderCamera() {
			// noramlize la camera
			if (camera.position.y< CAMERAMINY) camera.position.y = CAMERAMINY
			if (camera.position.x< -WORLDSIZE) camera.position.x = -WORLDSIZE
			if (camera.position.x>  WORLDSIZE) camera.position.x = WORLDSIZE
			if (camera.position.z< -WORLDSIZE) camera.position.z = -WORLDSIZE
			if (camera.position.z>  WORLDSIZE) camera.position.z = WORLDSIZE
			// si la camera a bougé, notify server on test les coord de rota pour éviter le quaternion issue
			if ( (! camera.position.equals(lastCamCoord)) ||
					 (camera.rotation.x != lastCamRota.x) ||
					 (camera.rotation.y != lastCamRota.y) ||
					 (camera.rotation.z != lastCamRota.z)
				 ) {
				// console.log("cam not equals",camera.rotation,lastCamRota )
				lastCamCoord = camera.position.clone()
				lastCamRota = camera.rotation.clone()
				pushToServer('loc',{
					cx: lastCamCoord.x, cy: lastCamCoord.y, cz: lastCamCoord.z,
					rx: lastCamRota.x, ry: lastCamRota.y, rz: lastCamRota.z
				})
			}
		}
		// dépile les commandes depuis le main
		function renderExeCmds() {
			let cmd=null
			while (cmd=renderCommands.shift()) {
				// console.log("renderCmd=",cmd)
				switch (cmd.op) {
					case "metro.sync": // provenance server
						persoSetMesh(cmd.pseudo)
						break
					case "metro.objet": // provenance server
						objetSetMesh(cmd.idx)
						break
					case "metro.home": // provenance locale
						console.log("camReset")
						camera.position = new BABYLON.Vector3(POSITIONPOP.x,POSITIONPOP.y,POSITIONPOP.z)
						camera.rotation = new BABYLON.Quaternion.Zero()
						break
					case "metro.zero": // provenance locale
						console.log("camReset")
						camera.position = new BABYLON.Vector3(0,0,0)
						camera.rotation = new BABYLON.Quaternion.Zero()
						break
					case "metro.ihm": // provenance locale
						newIhm()
						break
					case "metro.debug": // provenance locale
						sphereClick.position.x = 0
						sphereClick.position.y = 0
						sphereClick.position.z = 0
						break

					case "metro.teleport": // provenance locale
						// camera.cameraDirection=new BABYLON.Vector3(cmd.dst.cx,cmd.dst.cy,cmd.dst.cz+5)
						// camera.cameraRotation=new Vector3(padButton.camRota.scale(0.1))
						// let animateCameraToPosition = function(cam, speed, frameCount, newPos) {
				    // let aable2 = BABYLON.Animation.CreateAndStartAnimation('at4', cam, 'position', speed, frameCount, cam.position, newPos, 0, ease, camPosAnimEnded);
						// console.log("metro.teleport",cmd.loc.cx,cmd.loc.cy,cmd.loc.cz+5)
						// camera.cameraDirection = new BABYLON.Vector3(cmd.loc.cx,cmd.loc.cy,cmd.loc.cz+5)
						// camera.cameraDirection.addInPlaceFromFloats(cmd.loc.cx,cmd.loc.cy,cmd.loc.cz+5)
						console.log("****setAnimTeleport")
						const SPEED=30
						const FRAMECOUNT=90
				    let ease = new BABYLON.ElasticEase(2,2)
						let newPos = new BABYLON.Vector3(cmd.loc.cx,cmd.loc.cy,cmd.loc.cz)
				    ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
				    let aTeleport = BABYLON.Animation.CreateAndStartAnimation('teleport', camera, 'position',
							SPEED, FRAMECOUNT, camera.position, newPos, 0, //BABYLON.ANIMATIONLOOPMODE_CONSTANT,
							ease , ()=>console.log("aTeleport fini"), scene)
				    aTeleport.disposeOnEnd = true;
				    aTeleport.loopAnimation = false;
						break
					default: console.error('renderCommands invalide:',cmd)
				}
			}
		}
		function renderCb() {
			try {
				renderExeCmds()
				renderCamera()
			}
			catch (e) {
				console.error("renderCb error", e)
			}
		}
		// register postByFrame
		scene.gpRenderCb = renderCb

		///////////////////////////////////////
		// fin création de la main scene
		///////////////////////////////////////
		let dlPost = performance.now()
		// remontée timer sur server
		apiCall("/metrologie/engine3D.loadMain",'POST',{dthStart:dlStart, dthEnd:dlEnd, dthPost:dlPost})
		return scene
	}

		
		/*
		const box = BABYLON.MeshBuilder.CreateBox("box", {height: 1, width: 0.75, depth: 0.25, updatable: true});
    const box1 = box.clone("box2");
    box.position.x = -1;
    box.material = new BABYLON.StandardMaterial("mat");
    box.material.diffuseTexture = new BABYLON.Texture("textures/grass.png");
    box1.position.x = 1;
    box1.material = new BABYLON.StandardMaterial("mat1");
    box1.material.diffuseTexture = new BABYLON.Texture("textures/crate.png");
		console.log("box:",box,"box1",box1)
		*/
		/*
		console.log("Dude Posttraitement", pDude)
		let mDude = dude.meshes[0]
		// mDude.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
		// mDude.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
		scene.beginAnimation(dude.skeletons[0], 0, 100, true, 1.0);
		// setTimeout(()=> scene.stopAnimation(result.skeletons[0]),10000)
		*/
		/*
		console.log("Ville Posttraitement", pVille)
		let mVille = ville.meshes[0];
		// mVille.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
		mVille.position.y = 0
		*/


	//////////////////////////////////////////
	// basculement des scenes, demarrage 3D, resize
	//////////////////////////////////////////
	function mainSceneSwitchTo() {
		console.log('basculement sur mainScene')
		if (!sceneMain) return addNotification('Patiente, Chargement non terminé','yellow',5)
		console.warn('Kiki: timer moisi pour attente dequeue clicks / touches')
		setTimeout( () => {
			sceneActive?.dispose()
			sceneActive = sceneMain
			debugEngine=false
			playVideo("ff-10/ff-10-tunnelmetropolis")
		} , 300)
		
	}
	async function runBabylon() {
		try {
			engineStart()
			addNotification("Chargement 3D en cours","green",2)
			console.log('createSceneLoading démarré')
			scenePerf = createScenePerf(engine)
			sceneLoad= await createSceneLoading(engine)
			console.log('createSceneLoading terminé')
			sceneActive = sceneLoad
			// addNotification("Chargement mini-jeu","green",2)
			sceneMain = await createSceneMain(engine)
			addNotification("Scenes 3D construites","green",2)
			serverEnter3D() // remonte la présence au serveur
			sceneLoad.gpMainLoaded()
		}
		catch(e) {
			displayInfo({titre: "Erreur fatale", body: ["Erreur FATALE","Cause:",e.toString()], back: "rouge", ding:"explosion"})
			throw e
		}
	}
	function canvasResize() {
		console.log('AVANTcanvasResize',engine!=null)
		engine?.resize()
		console.log('APREScanvasResize')
	}
	function resetBabylon() {
		exitFullScreen()
		epiqStep=resetStep
	}
	function nop(e) {
		console.warn('nop',e)
	}
	function enterFullScreen() {
		document.getElementById("kikiFullArea")?.requestFullscreen().then(nop).catch(nop)
	}
	function exitFullScreen() {
		document.exitFullscreen().then(nop).catch(nop)	
	}

</script>
<style>
	.babylon {
	  margin: 0;
	  padding: 0;
	  width: 100%;
	  /* height: 800px; /* 100%; */
	  /* font-size: 0; */
	  color: rgba(204, 204, 204, 1);
	}
</style>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div id="kikiFullArea">
	{#if dspParam}
		<div style="position: absolute" class="popupCadre papier">
				<div class="close" onclick={()=>dspParam=null} role="button">X</div>
				<div class="popupZone">
					Paramètres/actions:
					<div class="popupContent" style="font-size:0.8em">
						<hr/>
						Souci:
						<input type="button" onclick={()=>{confirm("Recharger le moteur?") && resetBabylon()}} value="↻ Recharger" />
						<input type="button" onclick={()=>{renderCommands.push({op:'metro.home'})}} value="⌖ A l'entrée" />
						<hr/>
						ATH:
						<input type="button" onclick={()=>{setModeIHM()}} value="PC/SM" />
						<input type="button" onclick={()=>{setWheelDir()}} value="Molette▲▼" />
						<input type="button" onclick={()=>{setDebugClick()}} value="Debug" />
						<hr/>
						Smartphone:
						<input type="button" onclick={()=>{enterFullScreen()}} value="FullScreen" />
						<input type="button" onclick={()=>{exitFullScreen()}} value="Standard" />
						<hr/>
						<div style="color:red">
							Ne pas utiliser sans Kikiadoc
							<br/>
							<input type="button" onclick={()=>{confirm('Effacer toutes tes objets trouvés?') && apiCall('/metropolis/objetsReset','POST')}} value="ResetObjets" />
							{#if pseudo.startsWith('Kikiadoc')}
								<input type="button" onclick={()=>dspObject={ etat: etat } } value="worldDump" />
								<input type="button" onclick={()=>{renderCommands.push({op:'metro.zero'})}} value="zero" />
								<input type="button" onclick={()=>lastSurchauffe=0} value="resetTimerClick" />
								<input type="button" onclick={()=>toutFini()} value="toutFini" />
							{/if}
						</div>
					</div>
				</div>
		</div>
	{/if}
	{#if dspMessage}
		<Info bind:dspInfo={dspMessage} />
	{/if}
	{#if dspHarmo}
		<Info bind:dspInfo={dspHarmo} />
	{/if}
	
	<div>
		<span role="button" class="simpleLink" onclick={()=>dspMessage=helpArdoises()} >
			☑:{syncIHM.currTableaux}/{syncIHM.nbTableaux}
		</span>
		<span role="button" class="simpleLink" onclick={()=>dspMessage=helpBombes()} >
			💣:{syncIHM.currBombes}/{syncIHM.nbBombes}
		</span>
		<span role="button" class={(harmoTask)? 'simpleLink blinkFlag':'simpleLink'} onclick={()=>dspMessage=helpHarmo()} >
			🐍
		</span>
		<span role="button" class="simpleLink" onclick={()=>dspMessage=helpTeleport()}>
			👤:{pseudoList.length}
		</span>
		<span role="button" class="simpleLink" onclick={()=>dspMessage=helpCoord()} >
			🔮:	X:{syncIHM.x?.toFixed(2)} Y:{syncIHM.y?.toFixed(2)} Z:{syncIHM.z?.toFixed(2)} 
			{#if debugClick}
				🔮:	rX:{syncIHM.rx?.toFixed(2)} rY:{syncIHM.ry?.toFixed(2)} rZ:{syncIHM.rz?.toFixed(2)} 
			{/if}
		</span>
		<input type="range" min=1 max=5 step=1
			onchange={(e)=>{sensibilite=e.srcElement.value; dspMessage="Vitesse de distorsion:"+sensibilite}} />
		<span role="button" style="cursor:pointer" onclick={()=>dspParam=!dspParam}>🆘</span>
	</div>
	<div>
		<canvas class="babylon" id="render-canvas"></canvas>
	</div>
</div>

<!-- Cengine3D.svelte -->
