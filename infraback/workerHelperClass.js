
const { Worker, isMainThread, parentPort } = require('node:worker_threads'); 

class workerHelper {

	// Fields
	nom = null;
	id = 0;	// utilisé par le main
	recevoirReponse = null;
	doTheJob = null;
	worker = null;

	// Constructor... et registering fonctions
	constructor (nom, recevoirReponse, doTheJob) {
		console.log("worker:",nom,"mainThread=",isMainThread)
		this.nom= nom;
		this.recevoirReponse = recevoirReponse;
		this.doTheJob = doTheJob;
		if (isMainThread) {
			this.worker = new Worker(this.nom);
			console.log("Mainthred: Worker started:",nom);
			// reception message du worker
  		this.worker.on('message', (msg) => {
				try {
					this.recevoirReponse(JSON.parse(msg));
				}
				catch (e) {
					console.log("Erreur sur message from worker", this.nom, e);
				}
			});
		}
		else {
			// receive parent message
  		parentPort.on('message', async (message) => {
				try {
					console.log("worker request:",message);
					const msg = JSON.parse(message);
					const res = await this.doTheJob(msg.req,msg.id );
					parentPort.postMessage(JSON.stringify( {id: msg.id, res: res, req: msg.req } ));
				}
				catch (e) {
					console.log("Erreur sur message vers worker", this.nom, e);
				}
			});
 			parentPort.on('exit', () => {
		 		console.log('worker closing:', this.nom);
  		});
			console.log("Worker listening:",this.nom);
		}
	}

	// Main: sendRequest (retourne l'id de la requete)
	// a utiliser dans le threadMain
	sendRequest(req) {
		this.id ++;
		this.worker.postMessage(JSON.stringify({ id: this.id, req: req} ));
		return this.id;
	}

}

module.exports = workerHelper;
