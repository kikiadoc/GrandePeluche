// Filtrage d'accès vers Cloudfront https://cdn.adhoc.click
// suite aux scans russes, chinois et turques depuis des ips non authorisées

function handler(event) {
  // const referer = event.request.headers?.referer?.value // non supporté par JS cloudfront
  const referer = event.request.headers.referer
  const refVal = referer && referer.value
  const clientIP = event.viewer.ip
  const isKiki = clientIP=="91.164.33.248" || clientIP=="2a01:e0a:108:7e30:9da9:71eb:8610:7ef5" // adresses de Kiki en IPV4 ou IPV6

  if ( refVal && (refVal.startsWith("https://ff14.adhoc.click/") || refVal.startsWith("https://cdn.adhoc.click/") || refVal.startsWith("https://svelte.dev/")) || isKiki)
    return event.request

  // reponse 404 si mauvaise origine
  return {
    statusCode: 404,
    statusDescription: "Indisponible",
    headers: { "content-type":{ value:"text/html"}, "kiki-ip-origin":{value: event.viewer.ip} },
    body: "<!DOCTYPE html><html><body><p>Ce document n'est pas disponible</p></body></html>"
  }
}


