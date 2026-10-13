const isDiscord = window.location.host.indexOf("discordsays") > 0
console.log("host:",location.host,"isDiscord",isDiscord)
	
if (isDiscord) {
	console.info("(home.js): Discord détecté, pas de service Worker, mp4 en splash")
}
else {
	const registerServiceWorker = async () => {
		console.log("(home.js) Register Service Worker")
		if ("serviceWorker" in navigator) {
			try {
				const registration = await navigator.serviceWorker.register("./serviceWorker.js")
				// console.log("(main html) Service worker Registration:",registration);
      	if (registration.installing) {
      		console.log("(home.js) Service worker installing:",registration);
      	} else if (registration.waiting) {
      		console.log("(home.js) Service worker installed:",registration);
      	} else if (registration.active) {
        	console.log("(home.js) Service worker actif:",registration);
      	}
    	}
    	catch (error) { console.error("*** serviceWorker Registration failed: ",error) }
		}
  	else
    	console.error("(home.js) Service worker non disponible");
	  }
	// register serviceWorker
	registerServiceWorker()
	// remove splash
	// setTimeout(() => { document.getElementById("splash")?.remove() } , 1500)
}
// dans tous les cas, on remove le splash apres 20 secondes
setTimeout(() => { document.getElementById("kikiSplash")?.remove() } , 20000)
