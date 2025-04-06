const registerServiceWorker = async () => {
	console.log("(main html) Register Service Worker")
	if ("serviceWorker" in navigator) {
		try {
			const registration = await navigator.serviceWorker.register("./serviceWorker.js")
			console.log("(main html) Service worker Registration: ",registration);
      if (registration.installing) {
      	console.log("(main html) Service worker installing");
      } else if (registration.waiting) {
      	console.log("(main html) Service worker installed (waiting for work");
      } else if (registration.active) {
        console.log("(main html) Service worker active");
      }
    }
    catch (error) { console.error("*** serviceWorker Registration failed: ",error) }
	}
  else
    console.log("(main html) Service worker non activé");
  }
// register serviceWorker
registerServiceWorker()
// remove splash
setTimeout(() => { document.getElementById("splash")?.remove() } , 1500)
