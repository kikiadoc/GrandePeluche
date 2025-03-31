<script>
	import { onMount, onDestroy  } from 'svelte';
	import { scrollPageToTop, capitalizeFirstLetter, isPseudoValid, crypoCreateKeyPair 
				 } from './common.js'
	import { G }  from './privacy.js'
	
	import Credits from './Credits.svelte'
	
	let {	pseudo } = $props()

	/////////////////////////////////////////////////////////////////////
	// Gestion du pseudo et creation compte
	/////////////////////////////////////////////////////////////////////
	async function registerPseudo()	{
		let enregistrer = document.getElementById("enregistrerPseudo");
		if (enregistrer.style.color=="red")	return infoPopup({titre:"Patience...",body: "Les vérifications sont en cours",trailer:"Patience"})
		enregistrer.style.color="red";
		try {	await registerPseudoTech();	} catch(e) {console.log(e)} ;
		enregistrer.style.color="black";
	}

	async function registerPseudoTech()	{
		let newPseudo = capitalizeFirstLetter(document.getElementById("pseudoRequest").value.replaceAll(' ','').toLowerCase())
		let nomIG = capitalizeFirstLetter(document.getElementById("nomRequest").value.replaceAll(' ','').toLowerCase())
		let monde = capitalizeFirstLetter(document.getElementById("mondeRequest").value.replaceAll(' ','').toLowerCase())
		if (!isPseudoValid(newPseudo) || !isPseudoValid(nomIG))
			return infoPopup({titre:"Invalide!",body:"Ton prénom et nom doivent respecter les règles de nommage de FF14"});

		let ret = null; // resulta de requete
		addNotification("Vérif / lodestone","green",3)
		// acces lodestone via proxy sur adhoc.click (pour eviter les reponses opaques,sans atttente WS)
		ret = await apiCall("/lodestone/check/"+newPseudo+"/"+nomIG+"/"+monde,"GET",null,true)
		if (ret.status==202)
			return infoPopup({
				titre:"Tu es inconnu du lodestone",
				body: [
					"Je n'ai pas trouvé "+newPseudo+" "+nomIG+"@"+monde+" sur le Lodestone de FF14",
					"Vérifie bien les prénom, nom et monde que tu as indiqué",
					"Attention, il ne faut pas indiquer ton mot de passe pour FF14",
				],
				trailer: "si cette erreur persiste, contacte Kikiadoc sur discord"
			})
		if (ret.status!=200)
			return infoPopup({
				titre:"Erreur d'accès sur le lodestone",
				body: [
					"Je ne peux pas vérifier ton existance sur le lodestone de FF14",
					"car le lodestone ne me répond pas"
				],
				trailer: "Recommence dans quelques minutes"
			})
		const ff14Id = ret.o.ff14Id

		if (! confirm(newPseudo+" "+nomIG+"@"+monde+"(Lodestone Id="+ff14Id+"),\n"+
								"tu vas recevoir un pseudo et une clé personnelle sera enregistrée sur ton appareil (PC ou smartphone).\n"+
								"En cas de changement d'équipement ou d'erreur, il faudra contacter Kikiadoc sur discord"))
			return;
		
		addNotification("Création de ta clé de crypto elliptique...","green",3)
		let jwkPublicKey = await crypoCreateKeyPair()
		if (! jwkPublicKey )
			return infoPopup({
				titre: "ATTENTION erreur GRAVE",
				back:"rouge",
				body: "Génération de la clé de crypto elliptique impossible",
				trailer:"Contacte Kikiadoc"
			})
		addNotification("Enregistrement de ton perso sur le server...","green",3)
		// propositon du pseudo au serveur sans attendre le WS
		ret = await apiCall("/pseudos","PUT",
			{pseudo: newPseudo, nom: nomIG, monde: monde, ff14Id: ff14Id, jwkPublicKey: jwkPublicKey},
			true
		)
		if (ret.status==200) {
			addNotification(ret.o.pseudo+" enregistré");
 			storeIt("pseudo",ret.o.pseudo)
			pseudo=ret.o.pseudo;
			if (newPseudo!=ret.o.pseudo)
				infoPopup({
					titre: "Note bien ton pseudo "+ret.o.pseudo,
					body: "Le pseudo "+newPseudo+" est déjà attribué, je t'ai donc assigné le pseudo "+ret.o.pseudo
				})
		}
		else if (ret.status==403) {
			infoPopup({
				titre: "Contacte Kikiadoc sur Discord",
				body: "Un joueur identique existe déjà dans mon Grimoire de Sécurité, tu as peut-être effacé les données de ton appareil ou changé d'appareil",
				trailer: "Impossible d'enregistrer ton pseudo"
			})
		}
		else {
			addNotification(ret.erreur+"("+ret.status+")","red",60 );
			infoPopup({
				titre:"ATTENTION",
				body: [
				 "il y a eu un soucis lors de l'enregistrement de ton Pseudo",
				 "Info: "+ret.msg
				],
				trailer: "Contacte Kikiadoc sur Discord"
			})
		}
	}
</script>
<style>
</style>
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore element_invalid_self_closing_tag) -->
<div use:scrollPageToTop>
	<p>Bienvenue.</p> 
	<p>Je suis la Grande Peluche Oracle Des Savoirs du Bois Bandé.</p>
	<div>Pour participer, tu dois m'indiquer EXACTEMENT ton prénom, nom et monde InGame:</div>
	<div>
		<label><input type="text" placeholder="prénomIG" id="pseudoRequest" maxlength=15></label>
		<label><input type="text" placeholder="nomIG" id="nomRequest" maxlength=15></label>
		<select id="mondeRequest">{#each GBLCONST.MONDES as m}<option>{m}</option>{/each}</select>
		<label><input type="button" value="Valider ►" id="enregistrerPseudo" onclick={registerPseudo}></label>
	</div>
	<Credits />
</div>

<!-- Pauth.svelte -->
