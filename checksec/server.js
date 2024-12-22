#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const Tail = require("tail").Tail;
const { spawn, exec } = require("child_process");
const dataStorePath="/home/ec2-user/checksec/datastore/"

// PORT du serveur d'analyse temps réel
const PORT=9999
const RET_TEXT=		"<div style='background-color:red'>Mauvaise URL (pot de miel)<br/>Utilise exactement l'URL indiqu&eacute;e sur Discord</div>"
const ROBOT_TEXT=	"User-agent: *\nDisallow: /\n"+
									"User-agent: Googlebot\nDisallow: /\n"+
									"User-agent: GoogleOther\nDisallow: /\n"+
									"User-agent: Google-Extended\nDisallow: /\n"
//
// liste des urls toléréés, ne pas oublier qu'un "/" est ajouté par le reverse proxy
const whiteListUrl = [
	{ m: "GET", u:"//", s: 200, r: RET_TEXT},
	{ m: "GET", u:"//favicon.ico", s: 404},
	{ m: "GET", u:"//images/favicon.ico", s: 404},
	{ m: "GET", u:"//robots.txt", s: 200, r: ROBOT_TEXT},
	{ m: "GET", u:"//sitemap.xml", s: 404},
	{ m: "GET", u:"//ads.txt", s: 404},
	{ m: "GET", u:"//app-ads.txt", s: 404},
	{ m: "GET", u:"//sellers.json", s: 404},
	{ m: "GET", u:"//apple-touch-icon-precomposed.png", s: 404},
	{ m: "GET", u:"//apple-touch-icon.png", s: 404},
	{ m: "OPTIONS", u:"//", s: 404},
	{ m: "HEAD", u:"//", s: 404}
]

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gestion persistance et exceptions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exception = (message,code) => {
	throw {
		code: code || 500, 
		msg : (typeof message == "string")? message : "nomsg",
		o : (typeof message == "object")? message : null,
		dth: Date.now()
	}
}

// gestion de la serialisation JSON
function replacer(key, value) {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}
function reviver(key, value) {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

// gestion datastore
function saveObj(col) {
	if (! col.name ) exception("No name in object", 500);
	col.versionDth = Date.now();
	fs.writeFileSync(dataStorePath+col.name+".object",JSON.stringify(col,replacer));
	console.log("objet", col.name, "saved on fs");
}
function loadObj(colName,init) {
	let jsonCol = init;
	try {
  	const rawCol = fs.readFileSync(dataStorePath+colName+".object");
  	jsonCol = JSON.parse(rawCol,reviver);
		console.log("objet", jsonCol.name, "load from fs");
	}
	catch (e) {
		console.log("Using default for",colName,"e:",e.message);
	}
	if (jsonCol.name != colName) exception("No name in object "+colName, 500);
	return jsonCol;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Gestion de la liste des ip bans
// cette liste n'est pas sync sur FS dans la mesure ou n'apparaissent que des trucs qui ne sont pas dans l'IPTABLES actuelle
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// gestion des ip en whitelist
const ipsWhite = loadObj("ipWhite", { name: "ipWhite", ips:  new Map() } )
// liste des ip bans
const ipsBan = new Map()

function getIpWhite(ip) {
	return ipsWhite.ips.get(ip)
}
function setIpWhite(ip, desc) {
	ipsWhite.ips.set(ip, desc)
}
function getIpBan(ip) {
	return ipsBan.get(ip);
}
function setIpBan(ip,desc) {
	return ipsBan.set(ip,desc);
}

// ban une ip (file/null, line/null, ip) si pas deja ban
function addIpBan(f, l, ip) {
	// normalize de l'adresse en une string
	console.log("*** BAN IP",ip,f,l);
	let descBan = getIpBan(ip);
	// si ban ip deja existant...
	if (descBan) { console.log("**BAN IP ** Already banned",ip); return }
	// si en vhite list
	let descWhite = getIpWhite(ip);
	if (descWhite) { console.log("**BAN IP ** In white list",ip); return }
	// ajout d'un ban ip
	console.log("**BAN IP ** ADD IPTABLES ",ip)
	setIpBan(ip,{ file:f, line: l });
	// modif des IPTABLES
	let ipChunk = ip.split('.')
	ipChunk[3]='0'
	let ipRange = ipChunk.join('.')+'/24'
	let nowLbl = new Date().toUTCString()
	let chainId = ( "000"+ Math.floor(parseInt(ip,10) / 16) * 16 ).substr(-3)
	console.log("chain=",chainId);
	const doCmd = spawn('sudo', ['iptables','-A','NT'+chainId,'-s',ipRange,'-p','tcp','--dport','443','-j','DROP','-m','comment','--comment',ip+' NOT_YET_ANALYZED realtime added rule '+nowLbl])
	doCmd.stdout.on('data', (data) => { console.log(`stdout: ${data}`); })
	doCmd.stderr.on('data', (data) => { console.error(`stderr: ${data}`); })
	doCmd.on('close', (code) => { console.log(`iptables update exited with code ${code}`); })
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SERVICE DE TRACKING des LOGS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// analyse d'une ligne de log
function analyseLine(f,l) {
	// console.log("ligne:",f,l)
	const parseLine = l.split(" ");
	// parseLine[0]== adresse ip
	// parseLine[6]== "GET
	// parseLine[7]== path
	// parseLine[8]== codeHttp
	switch (parseLine[8]) {
		case "410":	// code gone - ban direct
			return addIpBan(f,l,parseLine[0]);
		case "418":	// code theiere - ban direct
			return addIpBan(f,l,parseLine[0]);
	}
}

// initialisation des tails & analyse
function initService() {
	let tailAccess = new Tail("/var/log/httpd/access_log");
	let tailAccessSSL = new Tail("/var/log/httpd/ssl_access_log");

	tailAccess.on("line", function(data) { analyseLine("access_log",data) });
	tailAccess.on("error", function(error) { console.log("accessr_log ERROR: ", error); });
	tailAccessSSL.on("line", function(data) { analyseLine("ssl_access_log",data) });
	tailAccessSSL.on("error", function(error) { console.log("ssl_access_log ERROR: ", error); });

	console.log('checkSec Tail logs Run');
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SERVEUR DE TRACKING pour les URLs identifiées
// sollicité depuis le reverse proxy en cas d'analyse complémentaire
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// taille des fichiers de logs selon la date
hp_req_day_size = [ 0,0,0,0,0,0,0 ]

// ajoute une requete dans le fichier de logs spécifique a la date
function dumpReq(req,bodyData) {
	// date etc...
	const dth = new Date()
	const dw = dth.getUTCDay();
	const hh = dth.getUTCHours();
	const mm = dth.getUTCMinutes();
	const ss = dth.getUTCSeconds();
	const ms = dth.getUTCMilliseconds();
	// entete du log
	let logData = "----------------- ".concat(dw," ",hh,":",mm,":",ss,".",ms," M=",req.method," R=",req.url,"\n")
	// log les headers
	for (let i=0; i < req.rawHeaders.length; i+=2) {
		logData = logData.concat("Header: ",req.rawHeaders[i],": ",req.rawHeaders[i+1],"\n");
	}
	// log le body
	logData = logData.concat("Body:\n",bodyData,"\n**** BODY END **\n");
	// fichier à utiliser
	const fileName = dataStorePath+"hp_req_day"+dw+".dump"
	// vérification taille du fichier du jour
	if (hp_req_day_size[dw] == 0) {
		const fileStat = fs.statSync(fileName, {throwIfNoEntry: false} );
		if (fileStat)
			hp_req_day_size[dw] = fileStat.size;	
	}
	// selon la taille du fichier	 (<100Mo)
	if (hp_req_day_size[dw] < 100000000) {
		// append dans le fichier de dump
		fs.appendFileSync(fileName,logData);
		hp_req_day_size[dw] += logData.length
	}
}

// retourne la description d'url tolérée  selon la requete
// retourne undefined si introuvable
function getDescReq(req) {
	return whiteListUrl.find( (e) => { return (req.url==e.u) && (req.method==e.m)  } ); 
}

function listenerFct(req, res) {
   try {
     let bodyData = "";
     req.on("data", (chunk) => {
			try {
				// limite la taille recue
				if (bodyData.length < 20000) bodyData = bodyData.concat(chunk);
			}
      catch(e) { console.log(e); }
		});

    req.on("error", async () => {
      try {
	 			console.log("HONEYPOT --> Error event ",req.method,req.url);
       }
      catch(e) { console.log(e); }
		});

    req.on("end", async () => {
      try {
	 			console.log("HONEYPOT -->Req",req.method,req.url);
				// dump de la requete
	 			dumpReq(req,bodyData); 
				// analyse url
				const desc=getDescReq(req);
				// si url tolérée
				if ( desc ) {
					res.statusCode=desc.s
					res.end(desc.r || RET_TEXT );
				}
				else {
					// ban direct
					const ipFor=req.headers['x-forwarded-for'];
					if (ipFor) addIpBan("banAtEndRequest",req.method+" "+req.url,ipFor)
					res.statusCode=418
					res.end("I'm a teapot");
				}
       }
      catch(e) { console.log(e); }
    });
  }
  catch(e) { console.log(e); }
}

startServer = () => {
	const server = http.createServer(listenerFct)
	server.listen(PORT);
	console.log("HoneyPot Http server started:",PORT);
}

initService();
startServer()

/*
 *  A SURVEILLER
 *
 * Ferme de proxy en liaison avec IPROYAL
 * 149.12.167.214 - - [21/Apr/2024:13:46:33 +0000] "HEAD /enjoy/ HTTP/1.1" 200 - "-" "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
*/


/*
 * sudo iptables -A INPUT -s 1.2.3.6 -p tcp --dport 443 -j DROP
 * sudo iptables -A INPUT -m iprange --src-range 216.24.219.0-216.24.219.255 -p tcp --dport 443 -j DROP
 * sudo iptables -F
 * sudo iptables -L --line-numbers -v
 * sudo iptables -D INPUT nnn
 * suivant a utiliser avec enorme précaution
 * sudo iptables -I INPUT nnn -p tcp --syn --dport 443 -m connlimit --connlimit-above 10 -j REJECT --reject-with tcp-reset
 * sudo service iptables save
*/
