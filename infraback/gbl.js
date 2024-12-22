
exports.staticFsPath="../inframain/datastore/";
exports.grimoireFsPath="/var/www/static/grimoire/";
exports.grimoireUrlPath= "https://ff14.adhoc.click/grimoire/"
exports.pCloudUrl= "https://filedn.eu/lxYwBeV7fws8lvi48b3a3TH/"
exports.cdnUrl= "https://cdn.adhoc.click/"
exports.vaultPath="/home/ec2-user/.vault.donotdelete";
exports.ipAdmin="91.164.33.248" // adrese PC perso Kikiadoc


function padValue(v) { return "00".concat(v).slice(-2); } ;
function padValue3(v) { return "000".concat(v).slice(-3); } ;

exports.isLowerNumeric = str => /^[a-z0-9]+$/g.test(str);
exports.capitalizeFirstLetter = str => { return str.charAt(0).toUpperCase() + str.slice(1); } ;
exports.lowerFirstLetter = str => { return str.charAt(0).toLowerCase() + str.slice(1); } ;
exports.alphanum2placer = str => { return str.replace(/[a-z0-9]/g,"﹇") } ;
exports.stripBlank = str => { return str.replace(/[ \:\.\,]/g,"") };
exports.isPseudoValid = (str) => { return /^['\-A-Za-z0-9]+$/g.test(str); }

const flagProd = __filename.indexOf('/prod/') > 0
exports.isProd = () => {
	return flagProd
}

exports.countDownTo = (dth) => {
	if (dth==null || dth==undefined)
		return "--:--:--";
	const nbSec = Math.floor( (dth- Date.now()) / 1000);
	if (nbSec <= 0) return "00:00:00";
	const h = Math.floor(nbSec/3600);
	const m = Math.floor( (nbSec - h*3600) / 60);
	const s = Math.floor( nbSec % 60);
	return padValue(h) + "h" + padValue(m) + "m" + padValue(s)+"s";
}

exports.hhmmssms = ms => {
	if (ms) {
		let dth = new Date(ms);
		return	 padValue(dth.getHours())+":"
			+padValue(dth.getMinutes())+":"
			+padValue(dth.getSeconds())+"."
			+padValue3(dth.getMilliseconds());
	}
	return "--:--:--.---";
};

// ms est un nombre de millisecond
exports.jjmmhhmmss = (ms) => {
	if (ms) {
		let dth = new Date(ms);
		return "le "+padValue(dth.getDate())+"/"+padValue(dth.getMonth()+1)+" à "+padValue(dth.getHours())+":"+padValue(dth.getMinutes())+":"+padValue(dth.getSeconds());
	}
	return "...";
	
}

exports.hexToUint8Array = (hexString) => {
	const hexStr = (hexString)? hexString :  "0000"
	var bytes = new Uint8Array(Math.ceil(hexStr.length / 2));
	for (var i = 0; i < bytes.length; i++) bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
	return bytes
}


exports.uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// compacte un objet pour optimisation mémoire
exports.deepCompact = (val) => {
  const data = Array.isArray(val) ? val.filter(Boolean) : val;
  return Object.entries(data).reduce(
    (acc, [key, value]) => {
      if (Boolean(value))
        acc[key] = typeof value === 'object' ? exports.deepCompact(value) : value;
      return acc;
    },
    Array.isArray(val) ? [] : {}
  );
};

exports.exception = (message,code,startDth) => {
	// console.log("----------------------------------------");
	// console.log(message,code,startDth);
	// console.log("----------------------------------------");
	throw {
		code: code, 
		msg : (typeof message == "string")? message : "nomsg",
		o : (typeof message == "object")? message : null,
		dth: Date.now(),
		startDth: startDth
	}
}

// vérification du parametre, retourne la valeur ou gbl exception 400 sinon
exports.checkInt = (v,min,max) => {
	let i = parseInt(v,10);
	if (isNaN(i) || i < min || i > max) exports.exception("bad int param",400)
	return i;
}
exports.checkFloat = (v,min,max) => {
	let i = parseFloat(v);
	if (isNaN(i) || i < min || i > max) exports.exception("bad float param",400)
	return i;
}

// return true/false selon la distance quadratique
exports.isDistance = (x,y,tX,tY,d) => {
	return (x>=tX-d && x<=tX+d && y>=tY-d && y<=tY+d)
}

exports.apiCall = async (fullUrl,method,body,headers) => {
	try {
		const res = await fetch(fullUrl, {
			method: method? method: 'GET', 	
			mode: "cors",
			cache: "no-store",
			body: (body)? JSON.stringify(body) : null,
			headers: (headers)? headers : { 'Content-Type': 'application/json; charset=UTF-8'}
		});
	  const json = await res.json();
		json.status = res.status;
		return json;
	}
	catch(e) {
		console.log(e);
		return { status: 503 };
	}
}

exports.apiCallExtern = async (fullUrl,method,body,headers,parseType) => {
	let res;
	try {
		res = await fetch(fullUrl, {
			method: method? method: 'GET', 	
			mode: "cors",
			cache: "no-store",
			body: (body)? JSON.stringify(body) : null,
			headers: (headers)? headers : { 'Content-Type': 'application/json; charset=UTF-8'}
		});
		if (!parseType || parseType=="text") return { status: res.status, text: await res.text() }
		if (parseType=="json") return { status: res.status, json: await res.json() }
		if (parseType=="raw") return { status: res.status, raw: await res.blob() }
		return { status: 503, statusReq: res.status, msg: "apiCallExtern bad parseType" }
	}
	catch(e) {
		console.log("-----------------------");
		console.log(e,"RES=",res);
		console.log("-----------------------");
		return { status: 503 };
	}
}

exports.getImgSuffix = (contentType) => {
	if ( !contentType.startsWith('image/') ) return null
	return contentType.substring(contentType.indexOf('/')+1)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 
exports.sleep = async (sec) => {
	await(delay(sec*1000));
}

console.log("****************************************************");
console.log("Running envronment: ", (flagProd)? "PRODUCTION" : "STAGING");
console.log("****************************************************");
console.log("gbl loaded");

