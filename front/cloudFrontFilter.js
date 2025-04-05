// Filtrage d'accès vers Cloudfront https://cdn.adhoc.click
// suite aux scans russes, chinois et turques depuis des ips non authorisées

function handler(event) {
  var referer = event?.request?.headers?.referer?.value
  var clientIP = event?.viewer?.ip;

  if (referer=="https://ff14.adhoc.click/" || clientIP=="xx.yy.zz.tt")
    return request

  // reponse 404 si mauvaise origine
  return {
    statusCode: 404,
    statusDescription: "Indisponible",
    headers: { "content-type":{ value:"text/html"} },
    body: "<!DOCTYPE html><html><body><p>Ce document n'est pas disponible</p></body></html>"
  }
}

