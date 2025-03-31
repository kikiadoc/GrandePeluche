
const http = require('http');
const process = require('process');

const gbl = require('../infraback/gbl.js');
const pseudos = require('../infraback/pseudos.js');
const collections = require('../infraback/collections.js');

var callBackHttp = () => { gbl.exception("httpCallBack not defined", 500); };


function listenerFct(req, res) {
    try {
			const reqDth= process.hrtime.bigint() // Date.now();
      let bodyData = "";
      req.on("data", (chunk) => {
        // bodyData = bodyData.concat(chunk);
        bodyData += chunk // += est le + optimum vs concat etc..
				/// limite à 10M utile (20M en encode)
				if (bodyData.length > 20000000) { 
					console.log(">>>>>>>>>>>>>>>>> Taille upload invalide (max 20M)",req.url,"taille recue:",bodyData.length)
					req.destroy()
				}
      });

      req.on("end", async () => {
				const startDth= process.hrtime.bigint() // Date.now();
        try {
      		const myUrl = new URL("http://localhost" + req.url);
      		const reqPaths = myUrl.pathname.split('/');
      		const pseudo = myUrl.searchParams.get('u');
      		const pwd = myUrl.searchParams.get('p');
	  			console.log("-->Req",req.method,req.url,bodyData.length);
	  			if (req.method=="HEAD") gbl.exception("Not available",404);
	  			await callBackHttp(req,res,req.method,reqPaths,bodyData,pseudo,pwd); 
	  			gbl.exception("Bad path",404);
        }
        catch(e) {
				 	res.setHeader('Access-Control-Allow-Origin', '*');
					res.setHeader('Access-Control-Max-Age', '86400');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
					const endDth= process.hrtime.bigint() // Date.now();
					const tr = { load: Number(startDth-reqDth)/1000000, run: Number(endDth-startDth)/1000000, dth: Date.now()  }
          res.setHeader('Server-Timing','load;dur='+tr.load+', run;dur='+tr.run)
          if (e.code && e.msg) {
						e.tr=tr
						res.statusCode=e.code;
           	res.end(JSON.stringify(e));
						jsonTime = Number(process.hrtime.bigint()-endDth)/1000000
	  				console.log("<--Ret",req.method,req.url,e.code, "load/run/json en ms:", tr.load, tr.run, jsonTime);
          }
          else {
						res.statusCode=500;
            res.end('{ "code": "500", "msg" : "voir log serveur" }');
	  				console.log("Ret=",req.method,req.url,e,"ms:", tr);
          }
        }
				if (bodyData.length > 1000000 && global.gc) {
					bodyData = null
					let mem=""
          for (const [key,value] of Object.entries(process.memoryUsage())) mem += " "+key+"="+Math.floor(value/1000000)
					console.log("BigBody: Before GC", mem)
					global.gc()
					mem=""
          for (const [key,value] of Object.entries(process.memoryUsage())) mem += " "+key+"="+Math.floor(value/1000000)
					console.log("BigBody: After  GC", mem)
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


