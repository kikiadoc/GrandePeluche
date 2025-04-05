// Service Worker de la Grande Peluche pour caching objets du CDN
// sur path https://cdn.adhoc.click/... uniquement 

const CACHENAME="MetacacheGrandePeluche"
const URLPREFIX="https://cdn.adhoc.click/V10/MetaCache/"
const VERSION="V4"

self.addEventListener("install", (event) => {
	console.log("(serviceWorker) installed",CACHENAME)
	self.skipWaiting() // force reload du dernier service worker
})
self.addEventListener("activate", (event) => {
	console.log("(serviceWorker) activated",CACHENAME)
})
self.addEventListener("sync", (event) => {
  console.log("(serviceWorker) sync received")
})
self.addEventListener("push", (event) => {
  console.log("(serviceWorker) push received",event.data)
})

// liste des fonctions de gestion des messages recus
let registered= {}

// reception d'une commande du main thread selon opcode e.data.o.op
self.addEventListener("message", async (e) => {
  console.log("(serviceWorker) message received",e.data)
	registered[e.data.o.op] (e.source,e.data)	
})

// Message metaCacheTest
registered["metaCacheTest"] = async (client,m) => {
	let rc = { id: m.id, msg: "Test activité Métacache Ok", nomDuCache: CACHENAME, triggerURL: URLPREFIX, version: VERSION }
	if (client) client.postMessage(rc)
}
// Message metaCacheList
registered["metaCacheList"] = async (client,m) => {
	let rc = { id: m.id, msg: "Erreur, msg non set",  nomDuCache: CACHENAME, triggerURL: URLPREFIX, version: VERSION, entrees: [] }
	// liste les entrées du metacache
	let c = await caches.open(CACHENAME)
	if (!c)
		rc.msg="Erreur sur recup cache"
	else {
		rc.msg="Liste des entrées"
		let keys = await c.keys()
		keys.forEach((request, index, array) => { rc.entrees.push( {method: request.method, url: request.url} ) })
	}
	// console.log("rep:",rc)
	if (client) client.postMessage(rc)
}
// Message metaCacheClear
registered["metaCacheClear"] = async (client,m) => {
	let rc = { id: m.id, msg: "Erreur, msg non set", cache: CACHENAME, entrees: [] }
	// delete les entrées du metacache
	let c = await caches.open(CACHENAME)
	if (!c)
		rc.msg="Erreur sur recup cache"
	else {
		rc.msg="Suppression des entrées"
		let keys = await c.keys()
		keys.forEach((request, index, array) => { rc.entrees.push( {method: request.method, url: request.url} ); c.delete(request) })
	}
	// console.log("rep:",rc)
	if (client) client.postMessage(rc)
}

// Gestion du méta-cache
self.addEventListener("fetch", (event) => {

	// Si pas dans un */useLocalCache/* traitement standard du navigateur
	if (!event.request.url.startsWith(URLPREFIX)) return // standard processing...

  console.log("(serviceWorker) Url:", event.request.url)

	// Mise en cache local
  event.respondWith(
    caches.open(CACHENAME).then((cache) => {
      return cache
        .match(event.request)
        .then((response) => {
          if (response) {
            console.log("(serviceWorker) Réponse depuis le cache:", event.request.url);
            return response;
          }
          console.log("(serviceWorker) Pas dans le cache. Fetch from network…",event.request.url);
		  		// clone pour usage dual sur cache.put avec la request origine
          return fetch(event.request.clone()).then((response) => {
            console.log( "(serviceWorker) Reponse: ", event.request.url, response.status)
						// test si reponse ok (pas d'erreur network)
            if (response.status < 400 && response.headers.has("content-type")) {
			  		// put danns le cache
              console.log("(serviceWorker) Caching response vers le cache local", event.request.url);
              cache.put(event.request, response.clone());
            } else {
              console.log("(serviceWorker) Pas de caching pour: ", event.request.url);
            }
            // Retourne la reponse du fetch
            return response;
		  		});
        })
        .catch((error) => {
          console.error("(serviceWorker) Error fetch dans event handler:", error);
          throw error;
        });
    }),
  );
});

console.log("*** serviceWorker chargé", CACHENAME)
                                                                 
