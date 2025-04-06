// Filtrage d'accès vers Cloudfront https://cdn.adhoc.click
// suite aux scans russes, chinois et turcs depuis des ips non authorisées

function handler(event) {
  // const refVal = event.request.headers?.referer?.value // non supporté par JS cloudfront
  const referer = event.request.headers.referer
  const refVal = referer && referer.value
  const clientIP = event.viewer.ip
  const isKiki = clientIP=="91.164.33.248" || clientIP=="2a01:e0a:108:7e30:9da9:71eb:8610:7ef5" // adresses de Kiki en IPV4 ou IPV6

  if ( refVal && (refVal.startsWith("https://ff14.adhoc.click/") || refVal.startsWith("https://cdn.adhoc.click/") || refVal.startsWith("https://svelte.dev/")) || isKiki)
    return event.request

  let  hdrDump = "clientIp:"+clientIP+";\n"
  Object.keys(event.request.headers).forEach( (h)=>hdrDump+= h+":"+event.request.headers[h].value+";\n")
  // reponse 404 si mauvaise origine
  return {
    statusCode: 404,
    statusDescription: "Indisponible",
    headers: { "content-type":{ value:"text/html"}, "gp-invalid-ip":{value: clientIP} },
    body: "<!DOCTYPE html><html><body><pre>Ce document n'est pas disponible\n"+hdrDump+"</pre></body></html>"
  }
}


