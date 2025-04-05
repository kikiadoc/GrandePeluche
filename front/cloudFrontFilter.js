// Filtrage d'accès vers Cloudfront https://cdn.adhoc.click
// suite aux scans russes, chinois et turques depuis des ips non authorisées

function handler(event) {
  // const referer = event.request.headers?.referer?.value // non supporté par JS cloudfront
  const referer = event.request.headers.referer
  const refVal = referer && referer.value
  const clientIP = event.viewer.ip

  if ( refVal && (refVal.startsWith("https://ff14.adhoc.click/") || refVal.startsWith("https://cdn.adhoc.click/")) || clientIP=="91.164.33.248")
    return event.request

  // reponse 404 si mauvaise origine
  return {
    statusCode: 404,
    statusDescription: "Indisponible",
    headers: { "content-type":{ value:"text/html"} },
    body: "<!DOCTYPE html><html><body><p>Ce document n'est pas disponible</p></body></html>"
  }
}


