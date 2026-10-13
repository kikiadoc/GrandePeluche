
const http = require('node:http');
const process = require('process');

const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');

var callBackHttp = () => { gbl.exception("httpCallBack not defined", 500); };


function listenerFct(req, res) {
    try {
			const reqDth= process.hrtime.bigint() // Date.now();
			let bodyChunks = [];
			let bodySize = 0
			req.on('data', (chunk) => {
				bodyChunks.push(chunk);
				bodySize += chunk.length
				if (bodySize > 10000000) {
					console.log(">>>>>>>>>>>>>>>>> Taille upload invalide (max 10M)",req.url,"taille recue:",bodySize)
					req.destroy()
				}
			} )

			/*
      let bodyData = "";
      req.on("data", (chunk) => {
        // bodyData = bodyData.concat(chunk);
        bodyData += chunk // += est le + optimum vs concat etc..
				/// limite à 5M utile (10M en encode)
				if (bodyData.length > 10000000) { 
					console.log(">>>>>>>>>>>>>>>>> Taille upload invalide (max 10M)",req.url,"taille recue:",bodyData.length)
					req.destroy()
				}
      });
			*/

      req.on("end", async () => {
				const startDth= process.hrtime.bigint() // Date.now();
				const rawBodyBuffer = Buffer.concat(bodyChunks);
				const rawBodyStr = rawBodyBuffer.toString('utf8');
        try {
				 	res.setHeader('Access-Control-Allow-Origin', '*');
					res.setHeader('Access-Control-Max-Age', '86400');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
      		const myUrl = new URL("http://localhost" + req.url);
      		const reqPaths = myUrl.pathname.split('/');
      		const pseudo = myUrl.searchParams.get('u');
      		const pwd = myUrl.searchParams.get('p');
	  			console.log("-->Req",req.method,req.url,/*bodyData.length*/bodySize);
	  			// a priori inutile if (req.method=="HEAD") gbl.exception("Not available",404);
	  			await callBackHttp(req,res,req.method,reqPaths,/*bodyData*/ rawBodyStr,pseudo,pwd, rawBodyBuffer); 
	  			gbl.exception("Bad path",404);
        }
        catch(e) {
					const endDth= process.hrtime.bigint() // Date.now();
					const tr = { load: Number(startDth-reqDth)/1000000, run: Number(endDth-startDth)/1000000, dth: Date.now()  }
          if (e.code==999) {
						// cas particulier pour le webhook discord
						// la reponse a été traitée et il ne faut pas faire de traitement "standard"
	  				console.log("Code 999, pas de traitement complementaire");
					}
					else if (e.code && e.msg) {
          	res.setHeader('Server-Timing','load;dur='+tr.load+', run;dur='+tr.run)
						e.tr=tr
						res.statusCode=e.code;
           	res.end(JSON.stringify(e,gbl.jsonReplacerDeletePrivKey)) // on supprime les "p_" de la réponse
						jsonTime = Number(process.hrtime.bigint()-endDth)/1000000
	  				console.log("<--Ret",req.method,req.url,e.code, "load/run/json en ms:", tr.load, tr.run, jsonTime);
					}
          else {
						res.statusCode=500;
            res.end('{ "code": "500", "msg" : "voir log serveur" }');
	  				console.log("Ret=",req.method,req.url,e,"ms:", tr);
          }
        }
      });
    }
    catch(e) {
      console.log(e);
    }
}


exports.start = (callback,port) => {
	callBackHttp = callback;
	const server = http.createServer(listenerFct)
	server.listen(port);
	console.log("Http server started:",port);
}


console.log('httpserver loaded');


