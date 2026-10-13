
class Mutex {
  constructor() {
    this.lock = false	// État du verrou (false = libre, true = occupé)
    this.queue = []		// File d'attente des processus en attente (FIFO)
		this.lastD = 0		// dth du dernier D
  }

	// Globalemen 
	// try {
	//  await mutex.P()
	//  await mutex.D(ms) // optionnel si besoin pour attendre ms depuis le dernier D ex: si D(200) max 5 par secondes
	// }
	// finally {
	//   mutex.V()
	// }

  P() {
    if (!this.lock) {
      this.lock = true
      return Promise.resolve() // Le verrou est libre, on continue immédiatement
    }
    // Le verrou est occupé, on stocke la fonction de résolution de la promesse dans la file d'attente
    return new Promise((resolve) => { this.queue.push(resolve); })
  }

  V() {
    if (this.queue.length > 0) {
      // Il y a des processus en attente : on extrait le premier (FIFO) et on résout sa promesse pour le réveiller
      (this.queue.shift()) ()
    } else {
      // Personne n'attend, on passe simplement le verrou à l'état libre
      this.lock = false
    }
  }

	async D(ms) {
		// calcul du délai a attendre
		const delta = Date.now()-this.lastD
		if (delta < ms) await new Promise(resolve => setTimeout(resolve, ms-delta))
		this.lastD = Date.now()
	}
}

module.exports = Mutex
