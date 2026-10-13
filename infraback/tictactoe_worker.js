// CECI EST LE WORKER DU TICTACTOE
// CECI EST LE WORKER DU TICTACTOE
// CECI EST LE WORKER DU TICTACTOE

const { worker, isMainThread, parentPort } = require('node:worker_threads'); 

const computer = 'X'
const human = 'O'
const	bSize = 5;
const winLen = 4;

// liste des vecteurs de solution possibles
const tblIndexWinner = initIndexWinner()

// calcul des vecteurs de solutions (utilisé lors de l'init)
function initIndexWinner() {
 	let l;
 	let c;
 	let i;
	let ret = [];
 	// horizontales
 	for (l=0; l<bSize; l++) {
 		for (c=0; c<=bSize-winLen; c++) {
 			i = l*bSize+c;
			ret.push([i,i+1,i+2,i+3])
		}
	}	
 	// verticales
 	for (c=0; c<bSize; c++) {
   	for (l=0; l<=bSize-winLen; l++) {
   		i = l*bSize+c;
			ret.push([i,i+bSize,i+bSize*2,i+bSize*3])
		}
	}	
 	// obliques vers bas/droite
 	for (l=0; l<=bSize-winLen; l++) {
   	for (c=0; c<=bSize-winLen; c++) {
     	i = l*bSize+c;
			ret.push([i,i+bSize+1,i+bSize*2+2,i+bSize*3+3])
		}
	}	
 	// Test les obliques vers bas/gauche
 	for (l=0; l<=bSize-winLen; l++) {
   	for (c=winLen-1; c<bSize; c++) {
     	i = l*bSize+c;
			ret.push([i,i+bSize-1,i+bSize*2-2,i+bSize*3-3])
		}
	}	
	return ret;
}

// debug affichage du board
function printBoard(cBoard,header,pseudo) {
 	let result = '------------ '+header+' ('+pseudo+')\n';
 	for (let index = 0; index < bSize*bSize; index++) {
   	const value = cBoard[index]
		result += (value=== null) ? index : value;
   	result += '\t'
   	if ((index + 1) % bSize === 0) result += '\n'
 	}
 	result += '------------\n'
 	console.log(result)
}

// Test si gagnant return false ou le tableau de la soluce gagnante trouvée
// ex: false ou [0,1,2,3]
// test en brute force pour l'instant et en dur pour 4 jetons
// optimisation possible en listant les "possibles" et en les annulant
// c'est bourrin pas top, mais voila !!
function isWinner(cBoard, player) {
	for (let iSol=0; iSol < tblIndexWinner.length; iSol++) {
		const sol= tblIndexWinner[iSol];
   	if (cBoard[sol[0]]==player && cBoard[sol[1]]==player && cBoard[sol[2]]==player && cBoard[sol[3]]==player) {
			return sol;
		}
	}		
   return false;
 }

// test si on peut encore jouer (au moins une case vide)
function canPlay(cBoard) {
 	for (let i = 0; i< bSize*bSize; i++) 
   	if (cBoard[i] === null) return true;
 	return false;
}

// Test si player gagne en 1 coup possible
function checkOne(cBoard,player,possibles) {
	for (let i of possibles) {
		cBoard[i] = player;
		const win = isWinner(cBoard,player);
		cBoard[i] = null;
		if (win) return i;
	}
	return null;
}
// Test si player gagne en 2 coups possibles
function checkTwo(cBoard,player,possibles) {
	for (let i of possibles) {
		cBoard[i] = player;
		for (let j of possibles) {
			if (i!=j) {
				cBoard[j] = player;
				const win = isWinner(cBoard,player);
				cBoard[j] = null;
				if (win) {
					cBoard[i] = null;
					return j;
				}
			}
		}
		cBoard[i] = null;
	}
	return null;
}
// Test si player gagne en 3 coups possibles
function checkThree(cBoard,player,possibles) {
	for (let i of possibles) {
		cBoard[i] = player;
		for (let j of possibles) {
			if (i!=j) {
				cBoard[j] = player;
				for (let k of possibles) {
					if (k!=i && k!=j) {
						cBoard[k] = player;
						const win = isWinner(cBoard,player);
						cBoard[k] = null;
						if (win) {
							cBoard[j] = null;
							cBoard[i] = null;
							return k;
						}
					}
				}
				cBoard[j] = null;
			}
		}
		cBoard[i] = null;
	}
	return null;
}

// Test si player gagne en 4 coups possibles
function checkFour(cBoard,player,possibles) {
	for (let i of possibles) {
		cBoard[i] = player;
		for (let j of possibles) {
			if (i!=j) {
				cBoard[j] = player;
				for (let k of possibles) {
					if (k!=i && k!=j) {
						cBoard[k] = player;
						for (let l of possibles) {
							if (l!=i && l!=j && l!=k) {
								cBoard[l] = player;
								const win = isWinner(cBoard,player);
								cBoard[l] = null;
								if (win) {
									cBoard[k] = null;
									cBoard[j] = null;
									cBoard[i] = null;
									return l;
								}
							}
						}
						cBoard[k] = null;
					}
				}
				cBoard[j] = null;
			}
		}
		cBoard[i] = null;
	}
	return null;
}

// Trouve le meilleur coup pour l'ordi parmi les coups possibles
function findBestPlay(cBoard,possibles) {
	let move = null;
	// Test 1/2/3 pour computer/human...
	move=checkOne(cBoard,computer,possibles);
	if (move!==null) return move;
	move=checkOne(cBoard,human,possibles);
	if (move!==null) return move;
	move=checkTwo(cBoard,computer,possibles);
	if (move!==null) return move;
	move=checkTwo(cBoard,human,possibles);
	if (move!==null) return move;
	if (cBoard[12]==null) return 12;
	move=checkThree(cBoard,computer,possibles);
	if (move!==null) return move;
	move=checkThree(cBoard,human,possibles);
	if (move!==null) return move;
	move=checkFour(cBoard,computer,possibles);
	if (move!==null) return move;
	move=checkFour(cBoard,human,possibles);
	if (move!==null) return move;
 	return move
}

// deplacement humain, retourne true si gagnant
function humanPlay(cBoard,i) {
	cBoard[i] = human
  return isWinner(cBoard,human) !== false
}

// deplacement computer, retourne true si gagnant
function computerPlay(cBoard) {
	// détermine les cases jouables
	let possibles = [];
	for (let i=0; i < bSize*bSize; i++) {
		if (cBoard[i]==null) possibles.push(i);
	}	
	// intégrité
	if (possibles.lenght==0) return false;
	// le mouvement déterminé
	let move = null;
	// cas particulier du 1er coup ordi pour pimenter le jeu
	if (possibles.length== bSize*bSize-1) {
		if (cBoard[12]==null) {
			move = 12;
		}
		else {
			// tire au hasard un truc adjacent
			const adjacents = [6,7,8,11,13,16,17,18];
			move = adjacents[Math.floor(Math.random()*adjacents.length)]
		}
	}
	// test les configs gagnantes
	if (move==null) {
		move = findBestPlay(cBoard,possibles)
	}
	// si Pas de cuop gagnant trouvé, tire au hasard dans les possibles
	if (move==null) {
		console.log('RANDOM!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
		move = possibles[Math.floor(Math.random()*possibles.length)]
	}
	cBoard[move] = computer
	return isWinner(cBoard,computer) !== false
}

// Joue un coup humain suivi d'un coup computer si possible
// retourne -1 si humain gagne, 1 si computer gagne, 0 si pas terminée, null si PAT
function play(cBoard,i) {
	if (cBoard[i] !== null ) return 0;
	// coup humain puis coup computer puis vérif si jeu peut continuer
	// -1 humain gagne, 1 computer gagne, 0 jeu peux continuer, null PAT/egalité
	let ret = (humanPlay(cBoard,i))? -1 :
					  (computerPlay(cBoard))? 1 :
						(canPlay(cBoard))? 0 :
						 null;

	return ret
}

function reponse(id, pseudo, status, cBoard, playStatus) {
	const o = { id: id, pseudo: pseudo, status:status, board: cBoard, playStatus: playStatus }
	parentPort.postMessage(JSON.stringify(o));
}

// Worker main des operations asynchrones
function workerMain() {
	// receive parent message
  parentPort.on('message', (message) => {
		// recupère l'objet requete
		// { id, op, board, pseudo, idx }
		let req = JSON.parse(message);
	
		// operations...
		switch(req.op) {
			case "JOUER":
					let playStatus = play(req.board,req.idx);
					reponse(req.id,req.pseudo,200,req.board,playStatus);
					break;
			default:
					reponse(req.id,req.pseudo,500);
		}
 	});
 	parentPort.on('exit', () => {
		 console.log('tictactoe worker closing');
  });
}

if (isMainThread) { 
	// mainthread (ie require)
	exports.computer = computer
	exports.human = human
	exports.bSize = bSize
	exports.winLen = winLen
	exports.isWinner = isWinner
	exports.canPlay = canPlay
	console.log("TicTacToe loaded");
}
else {
	// ! mainthread (ie new Worker)
	workerMain();
	console.log("TicTacToe worker started");
}


