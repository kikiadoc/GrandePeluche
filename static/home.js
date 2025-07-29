const registerServiceWorker = async () => {
	// console.log("(main html) Register Service Worker")
	if ("serviceWorker" in navigator) {
		try {
			const registration = await navigator.serviceWorker.register("./serviceWorker.js")
			// console.log("(main html) Service worker Registration:",registration);
      if (registration.installing) {
      	console.log("(main html) Service worker installing:",registration);
      } else if (registration.waiting) {
      	console.log("(main html) Service worker installed:",registration);
      } else if (registration.active) {
        console.log("(main html) Service worker actif:",registration);
      }
    }
    catch (error) { console.error("*** serviceWorker Registration failed: ",error) }
	}
  else
    console.error("(main html) Service worker non disponible");
  }
// register serviceWorker
registerServiceWorker()
// remove splash
setTimeout(() => { document.getElementById("splash")?.remove() } , 1500)
