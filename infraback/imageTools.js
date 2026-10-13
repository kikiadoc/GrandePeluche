
function decodeImageBase64(base64) {
	// base64 ::= data:image/webp;base64,UklGRhoAAABX...
	if (! base64.startsWith("data:image/") ) return null
	const [header, base64Data] = base64.split(',');

	const sl = header.indexOf('/')
	const pv = header.indexOf(';')
	if (sl<0 || pv < sl) return null

	return { ext: header.substring(sl+1,pv), buffer: Buffer.from(base64Data, 'base64') } 
}

exports.decodeImageBase64 = decodeImageBase64

console.log("imageTools loaded");

