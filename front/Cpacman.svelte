<script>
	import { onMount, onDestroy } from 'svelte';
	import { addNotification, urlCdn, playDing } from "./storage.js"

	
  /**
   * @typedef {Object} Props
   * @property {any} [cbSuccess] - export let cbFailure = null
   * @property {number} [targetScore]
   */

  /** @type {Props} */
  let { cbSuccess = null, targetScore = 1000 } = $props();
	
	// Gestion des reload, refresh etc..
	onMount(() => {
		// if (wsCallComponents) wsCallComponents.add(myWsCallback);
	  let el = document.getElementById("pacman")
		if (!el) { addNotification("Erreur de syncrhonisation du DOM, contacte kikiadoc","red",60,"call-to-attention"); return}
		console.log("pacman mount");
		PACMAN.init(el, urlCdn);
	})
	onDestroy(() => {
		// if (wsCallComponents) wsCallComponents.delete(myWsCallback);
		console.log("pacman destroy");
		PACMAN.unload()  // clearinterval etc...
	})
	
/////////////////////////////////////////////////////////////////////////////////////
// JAVASCRIPT PACMAN LOGIC, from https://codepen.io/hellokatili/pen/xwKRmo
/////////////////////////////////////////////////////////////////////////////////////
const NONE        = 4,
    UP          = 3,
    LEFT        = 2,
    DOWN        = 1,
    RIGHT       = 11,
    WAITING     = 5,
    PAUSE       = 6,
    PLAYING     = 7,
    COUNTDOWN   = 8,
    EATEN_PAUSE = 9,
    DYING       = 10,
    Pacman      = {};

Pacman.FPS = 30 // 30;

Pacman.Ghost = function (game, map, colour) {

    let position  = null,
        direction = null,
        eatable   = null,
        eaten     = null,
        due       = null;
    
    function getNewCoord(dir, current) { 
        let speed  = isVunerable() ? 1 : isHidden() ? 4 : 2,
            xSpeed = (dir === LEFT && -speed || dir === RIGHT && speed || 0),
            ySpeed = (dir === DOWN && speed || dir === UP && -speed || 0);
        return {
            "x": addBounded(current.x, xSpeed),
            "y": addBounded(current.y, ySpeed)
        };
    };

    /* Collision detection(walls) is done when a ghost lands on an
     * exact block, make sure they dont skip over it 
     */
    function addBounded(x1, x2) { 
        let rem    = x1 % 10, 
            result = rem + x2;
        if (rem !== 0 && result > 10) {
            return x1 + (10 - rem);
        } else if(rem > 0 && result < 0) { 
            return x1 - rem;
        }
        return x1 + x2;
    };
    
    function isVunerable() { 
        return eatable !== null;
    };
    
    function isDangerous() {
        return eaten === null;
    };

    function isHidden() { 
        return eatable === null && eaten !== null;
    };
    
    function getRandomDirection() {
        let moves = (direction === LEFT || direction === RIGHT) ? [UP, DOWN] : [LEFT, RIGHT]
        return moves[Math.floor(Math.random() * 2)]
    };
    
    function reset() {
        eaten = null;
        eatable = null;
        position = {"x": 90, "y": 80};
        direction = getRandomDirection();
        due = getRandomDirection();
    };
    
    function onWholeSquare(x) {
        return x % 10 === 0;
    };
    
    function oppositeDirection(dir) { 
        return dir === LEFT && RIGHT || dir === RIGHT && LEFT || dir === UP && DOWN || UP;
    };

    function makeEatable() {
        direction = oppositeDirection(direction);
        eatable = game.getTick();
    };

    function eat() { 
        eatable = null;
        eaten = game.getTick();
    };

    function pointToCoord(x) {
        return Math.round(x / 10);
    };

    function nextSquare(x, dir) {
        let rem = x % 10;
        if (rem === 0) { 
            return x; 
        } else if (dir === RIGHT || dir === DOWN) { 
            return x + (10 - rem);
        } else {
            return x - rem;
        }
    };

    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    };

    function secondsAgo(tick) { 
        return (game.getTick() - tick) / Pacman.FPS;
    };

    function getColour() { 
        if (eatable) { 
            if (secondsAgo(eatable) > 5) { 
                return game.getTick() % 20 > 10 ? "#FFFFFF" : "#0000BB";
            } else { 
                return "#0000BB";
            }
        } else if(eaten) { 
            return "#222";
        } 
        return colour;
    };

    function draw(ctx) {
        let s    = map.blockSize, 
            top  = (position.y/10) * s,
            left = (position.x/10) * s;
        if (eatable && secondsAgo(eatable) > 8) {
            eatable = null;
        }
        if (eaten && secondsAgo(eaten) > 3) { 
            eaten = null;
        }
        let tl = left + s;
        let base = top + s - 3;
        let inc = s / 10;
        let high = game.getTick() % 10 > 5 ? 3  : -3;
        let low  = game.getTick() % 10 > 5 ? -3 : 3;
        ctx.fillStyle = getColour();
        ctx.beginPath();
        ctx.moveTo(left, base);
        ctx.quadraticCurveTo(left, top, left + (s/2),  top);
        ctx.quadraticCurveTo(left + s, top, left+s,  base);
        // Wavy things at the bottom
        ctx.quadraticCurveTo(tl-(inc*1), base+high, tl - (inc * 2),  base);
        ctx.quadraticCurveTo(tl-(inc*3), base+low, tl - (inc * 4),  base);
        ctx.quadraticCurveTo(tl-(inc*5), base+high, tl - (inc * 6),  base);
        ctx.quadraticCurveTo(tl-(inc*7), base+low, tl - (inc * 8),  base); 
        ctx.quadraticCurveTo(tl-(inc*9), base+high, tl - (inc * 10), base); 
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#FFF";
        ctx.arc(left + 6,top + 6, s / 6, 0, 300, false);
        ctx.arc((left + s) - 6,top + 6, s / 6, 0, 300, false);
        ctx.closePath();
        ctx.fill();
        let f = s / 12;
        let off = {};
        off[RIGHT] = [f, 0];
        off[LEFT]  = [-f, 0];
        off[UP]    = [0, -f];
        off[DOWN]  = [0, f];
        ctx.beginPath();
        ctx.fillStyle = "#000";
        ctx.arc(left+6+off[direction][0], top+6+off[direction][1], 
                s / 15, 0, 300, false);
        ctx.arc((left+s)-6+off[direction][0], top+6+off[direction][1], 
                s / 15, 0, 300, false);
        ctx.closePath();
        ctx.fill();
    };

    function pane(pos) {
        if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) {
            return {"y": 100, "x": -10};
        }
        if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
            return position = {"y": 100, "x": 190};
        }
        return false;
    };
    
    function move(ctx) {
        let oldPos = position,
            onGrid = onGridSquare(position),
            npos   = null;
        if (due !== direction) {
            npos = getNewCoord(due, position);
            if (onGrid &&
                map.isFloorSpace({
                    "y":pointToCoord(nextSquare(npos.y, due)),
                    "x":pointToCoord(nextSquare(npos.x, due))})) {
                direction = due;
            } else {
                npos = null;
            }
        }
        if (npos === null) {
            npos = getNewCoord(direction, position);
        }
        if (onGrid &&
            map.isWallSpace({
                "y" : pointToCoord(nextSquare(npos.y, direction)),
                "x" : pointToCoord(nextSquare(npos.x, direction))
            })) {
            
            due = getRandomDirection();            
            return move(ctx);
        }
        position = npos;        
        let tmp = pane(position);
        if (tmp) { 
            position = tmp;
        }
        due = getRandomDirection();
        return {
            "new" : position,
            "old" : oldPos
        };
    };
    
    return {
        "eat"         : eat,
        "isVunerable" : isVunerable,
        "isDangerous" : isDangerous,
        "makeEatable" : makeEatable,
        "reset"       : reset,
        "move"        : move,
        "draw"        : draw
    };
};

Pacman.User = function (game, map) {
    let position  = null,
        direction = null,
        eaten     = null,
        due       = null, 
        lives     = null,
        score     = 5

    function addScore(nScore) { 
        score += nScore;
        if (score >= 10000 && score - nScore < 10000) { 
            lives += 1;
        }
    };

    function theScore() { 
        return score;
    };

    function loseLife() { 
        lives -= 1;
    };

    function getLives() {
        return lives;
    };

    function initUser() {
        score = 0;
        lives = 3;
        newLevel();
    }
    
    function newLevel() {
        resetPosition();
        eaten = 0;
    };
    
    function resetPosition() {
        position = {"x": 90, "y": 120};
        direction = DOWN // LEFT;
        due = DOWN // LEFT;
    };
    
    function reset() {
        initUser();
        resetPosition();
    };        
    
    function keyDownByName(keyName) {
			switch(keyName) {
				case "arrowleft":
				case "q":
					due=LEFT;
					break;
				case "arrowright":
				case "d":
					due=RIGHT;
					break;
				case "arrowup":
				case "z":
					due=UP;
					break;
				case "arrowdown":
				case "s":
					due=DOWN;
					break;
			}
	};

    function getNewCoord(dir, current) {   
        return {
            "x": current.x + (dir === LEFT && -2 || dir === RIGHT && 2 || 0),
            "y": current.y + (dir === DOWN && 2 || dir === UP    && -2 || 0)
        };
    };

    function onWholeSquare(x) {
        return x % 10 === 0;
    };

    function pointToCoord(x) {
        return Math.round(x/10);
    };
    
    function nextSquare(x, dir) {
        let rem = x % 10;
        if (rem === 0) { 
            return x; 
        } else if (dir === RIGHT || dir === DOWN) { 
            return x + (10 - rem);
        } else {
            return x - rem;
        }
    };

    function next(pos, dir) {
        return {
            "y" : pointToCoord(nextSquare(pos.y, dir)),
            "x" : pointToCoord(nextSquare(pos.x, dir)),
        };                               
    };

    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    };

    function isOnSamePlane(due, dir) { 
        return ((due === LEFT || due === RIGHT) && 
                (dir === LEFT || dir === RIGHT)) || 
            ((due === UP || due === DOWN) && 
             (dir === UP || dir === DOWN));
    };

    function move(ctx) {
        let npos        = null, 
            nextWhole   = null, 
            oldPosition = position,
            block       = null;
        if (due !== direction) {
            npos = getNewCoord(due, position);
            if (isOnSamePlane(due, direction) || 
                (onGridSquare(position) && 
                 map.isFloorSpace(next(npos, due)))) {
                direction = due;
            } else {
                npos = null;
            }
        }
        if (npos === null) {
            npos = getNewCoord(direction, position);
        }
        if (onGridSquare(position) && map.isWallSpace(next(npos, direction))) {
            direction = NONE;
        }
        if (direction === NONE) {
            return {"new" : position, "old" : position};
        }
        if (npos.y === 100 && npos.x >= 190 && direction === RIGHT) {
            npos = {"y": 100, "x": -10};
        }
        if (npos.y === 100 && npos.x <= -12 && direction === LEFT) {
            npos = {"y": 100, "x": 190};
        }
        position = npos;        
        nextWhole = next(position, direction);
        block = map.block(nextWhole);        
        if ((isMidSquare(position.y) || isMidSquare(position.x)) &&
            block === Pacman.BISCUIT || block === Pacman.PILL) {
            map.setBlock(nextWhole, Pacman.EMPTY);           
            addScore((block === Pacman.BISCUIT) ? 10 : 50);
            eaten += 1;
            if (eaten === 182) {
                game.completedLevel();
            }
            if (block === Pacman.PILL) { 
                game.eatenPill();
            }
        }   
        return {
            "new" : position,
            "old" : oldPosition
        };
    };

    function isMidSquare(x) { 
        var rem = x % 10;
        return rem > 3 || rem < 7;
    };

    function calcAngle(dir, pos) { 
        if (dir == RIGHT && (pos.x % 10 < 5)) {
            return {"start":0.25, "end":1.75, "direction": false};
        } else if (dir === DOWN && (pos.y % 10 < 5)) { 
            return {"start":0.75, "end":2.25, "direction": false};
        } else if (dir === UP && (pos.y % 10 < 5)) { 
            return {"start":1.25, "end":1.75, "direction": true};
        } else if (dir === LEFT && (pos.x % 10 < 5)) {             
            return {"start":0.75, "end":1.25, "direction": true};
        }
        return {"start":0, "end":2, "direction": false};
    };

    function drawDead(ctx, amount) { 
        let size = map.blockSize, 
            half = size / 2;
        if (amount >= 1) { 
            return;
        }
        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();        
        ctx.moveTo(((position.x/10) * size) + half, 
                   ((position.y/10) * size) + half);
        ctx.arc(((position.x/10) * size) + half, 
                ((position.y/10) * size) + half,
                half, 0, Math.PI * 2 * amount, true); 
        ctx.fill();    
    };

    function draw(ctx) { 
        let s     = map.blockSize, 
            angle = calcAngle(direction, position);

        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();        
        ctx.moveTo(((position.x/10) * s) + s / 2,
                   ((position.y/10) * s) + s / 2);
        ctx.arc(((position.x/10) * s) + s / 2,
                ((position.y/10) * s) + s / 2,
                s / 2, Math.PI * angle.start, 
                Math.PI * angle.end, angle.direction); 
        ctx.fill();    
    };
    
    initUser();

    return {
        "draw"          : draw,
        "drawDead"      : drawDead,
        "loseLife"      : loseLife,
        "getLives"      : getLives,
        "score"         : score,
        "addScore"      : addScore,
        "theScore"      : theScore,
        "keyDownByName" : keyDownByName,
        "move"          : move,
        "newLevel"      : newLevel,
        "reset"         : reset,
        "resetPosition" : resetPosition
    };
};

Pacman.Map = function (size) {
    let height    = null, 
        width     = null, 
        blockSize = size,
        pillSize  = 0,
        map       = null;
    
    function withinBounds(y, x) {
        return y >= 0 && y < height && x >= 0 && x < width;
    }
    
    function isWall(pos) {
        return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === Pacman.WALL;
    }
    
    function isFloorSpace(pos) {
        if (!withinBounds(pos.y, pos.x)) {
            return false;
        }
        let peice = map[pos.y][pos.x];
        return peice === Pacman.EMPTY || 
            peice === Pacman.BISCUIT ||
            peice === Pacman.PILL;
    }
    
    function drawWall(ctx) {
        let i, j, p, line;
        ctx.strokeStyle = "#0000FF";
        ctx.lineWidth   = 5;
        ctx.lineCap     = "round";
        
        for (i = 0; i < Pacman.WALLS.length; i += 1) {
            line = Pacman.WALLS[i];
            ctx.beginPath();
            for (j = 0; j < line.length; j += 1) {
                p = line[j];
                if (p.move) {
                    ctx.moveTo(p.move[0] * blockSize, p.move[1] * blockSize);
                } else if (p.line) {
                    ctx.lineTo(p.line[0] * blockSize, p.line[1] * blockSize);
                } else if (p.curve) {
                    ctx.quadraticCurveTo(p.curve[0] * blockSize, 
                                         p.curve[1] * blockSize,
                                         p.curve[2] * blockSize, 
                                         p.curve[3] * blockSize);   
                }
            }
            ctx.stroke();
        }
    }
    
    function reset() {       
        map    = Pacman.MAP.clone();
        height = map.length;
        width  = map[0].length;        
    };

    function block(pos) {
        return map[pos.y][pos.x];
    };
    
    function setBlock(pos, type) {
        map[pos.y][pos.x] = type;
    };

    function drawPills(ctx) { 
				let i,j
        if (++pillSize > 30) {
            pillSize = 0;
        }
        for (i = 0; i < height; i += 1) {
			    for (j = 0; j < width; j += 1) {
						if (map[i][j] === Pacman.PILL) {
							ctx.beginPath();
							ctx.fillStyle = "#000";
							ctx.fillRect((j * blockSize), (i * blockSize), blockSize, blockSize);
							ctx.fillStyle = "#FFF";
							ctx.arc((j * blockSize) + blockSize / 2,
											(i * blockSize) + blockSize / 2,
											Math.abs(5 - (pillSize/3)), 
											0, 
											Math.PI * 2, false); 
							ctx.fill();
						}
						// console.log('la',i,j,height,width); 
			    }
		    }
    };
    
    function draw(ctx) {
      let i, j, size = blockSize;
      ctx.fillStyle = "#000";
	    ctx.fillRect(0, 0, width * size, height * size);
      drawWall(ctx);
      for (i = 0; i < height; i += 1) {
		    for (j = 0; j < width; j += 1) {
			    drawBlock(i, j, ctx);
			  }
		  }
    }
    
    function drawBlock(y, x, ctx) {
        let layout = map[y][x];
        if (layout === Pacman.PILL) {
            return;
        }
        ctx.beginPath();
        if (layout === Pacman.EMPTY || layout === Pacman.BLOCK || 
            layout === Pacman.BISCUIT) {
            ctx.fillStyle = "#000";
				    ctx.fillRect((x * blockSize), (y * blockSize), blockSize, blockSize);
            if (layout === Pacman.BISCUIT) {
              ctx.fillStyle = "#FFF";
		        ctx.fillRect((x * blockSize) + (blockSize / 2.5), 
                             (y * blockSize) + (blockSize / 2.5), 
                             blockSize / 6, blockSize / 6);
	        }
        }
        ctx.closePath();	 
    };

    reset();
    
    return {
        "draw"         : draw,
        "drawBlock"    : drawBlock,
        "drawPills"    : drawPills,
        "block"        : block,
        "setBlock"     : setBlock,
        "reset"        : reset,
        "isWallSpace"  : isWall,
        "isFloorSpace" : isFloorSpace,
        "height"       : height,
        "width"        : width,
        "blockSize"    : blockSize
    };
};

const PACMAN = (function () {
		const ghostSpecs = ["#00FFDE", "#FF0000", "#FFB8DE", "#FFB847"]
    let state        = WAITING,
        audio        = null,
        ghosts       = [],
        eatenCount   = 0,
        level        = 0,
        tick         = 0,
        ghostPos, userPos, 
        stateChanged = true,
        timerStart   = null,
        lastTime     = 0,
        ctx          = null,
        timer        = null,
        map          = null,
        user         = null,
        stored       = null;

    function getTick() { 
        return tick;
    };

    function drawScore(text, position) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font      = "12px BDCartoonShoutRegular";
        ctx.fillText(text, 
                     (position["new"]["x"] / 10) * map.blockSize, 
                     ((position["new"]["y"] + 5) / 10) * map.blockSize);
    }
    
    function dialog(text) {
        ctx.fillStyle = "#FFFF00";
        // ctx.font      = "18px Calibri";
        ctx.font      = "36px Calibri";
        let width = ctx.measureText(text).width,
            x     = ((map.width * map.blockSize) - width) / 2;        
        // ctx.fillText(text, x, (map.height * 10) + 8);
        ctx.fillText(text, x, map.height * 8 - 10)
    }

    function soundDisabled() {
        return localStorage["soundDisabled"] === "true";
    };
    
    function startLevel() {        
        user.resetPosition();
        for (let i = 0; i < ghosts.length; i += 1) { 
            ghosts[i].reset();
        }
        playDing("pacmanStart");
        timerStart = tick;
        setState(COUNTDOWN);
    }    

    function startNewGame() {
        setState(WAITING);
        level = 1;
        user.reset();
        map.reset();
        map.draw(ctx);
        startLevel();
    }

		function keyDownByName(kn) {
			let keyName = kn.toLowerCase()
			// verif jeu en cours
			if (!timer) return
			if (keyName === 'c') {
					startNewGame();
			} else if (keyName === 'p' && state === PAUSE) {
					map.draw(ctx);
					setState(stored);
			} else if (keyName === 'p' ) {
					stored = state;
					setState(PAUSE);
					map.draw(ctx);
					dialog("Pause!");
			} else if (state !== PAUSE) {   
					user.keyDownByName(keyName);
			}
		}
    function keyDown(e) {
      e.preventDefault();
      e.stopPropagation();
			keyDownByName(e.key)
    }    

    function loseLife() {        
        setState(WAITING);
        user.loseLife();
        if (user.getLives() > 0) {
            startLevel();
        }
    }

    function setState(nState) { 
        state = nState;
        stateChanged = true;
    };
    
    function collided(user, ghost) {
        return (Math.sqrt(Math.pow(ghost.x - user.x, 2) + 
                          Math.pow(ghost.y - user.y, 2))) < 10;
    };

    function drawFooter() {
        let topLeft  = (map.height * map.blockSize),
            textBase = topLeft + 17;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, topLeft, (map.width * map.blockSize), 30);
        ctx.fillStyle = "#FFFF00";
        for (let i = 0, len = user.getLives(); i < len; i++) {
            ctx.fillStyle = "#FFFF00";
            ctx.beginPath();
            ctx.moveTo(150 + (25 * i) + map.blockSize / 2,
                       (topLeft+1) + map.blockSize / 2);
            
            ctx.arc(150 + (25 * i) + map.blockSize / 2,
                    (topLeft+1) + map.blockSize / 2,
                    map.blockSize / 2, Math.PI * 0.25, Math.PI * 1.75, false);
            ctx.fill();
        }
        ctx.fillStyle = !soundDisabled() ? "#00FF00" : "#FF0000";
        ctx.font = "bold 16px sans-serif";
        //ctx.fillText("♪", 10, textBase);
        ctx.fillText("s", 10, textBase);
        ctx.fillStyle = "#FFFF00";
        ctx.font      = "14px Calibri";
        // ctx.fillText("Score: " + user.theScore(), 30, textBase);
        ctx.fillText("Porte Magique: " + (targetScore-user.theScore()), 30, textBase);
        // ctx.fillText("Level: " + level, 260, textBase);
    }

    function redrawBlock(pos) {
        map.drawBlock(Math.floor(pos.y/10), Math.floor(pos.x/10), ctx);
        map.drawBlock(Math.ceil(pos.y/10), Math.ceil(pos.x/10), ctx);
    }

    function mainDraw() { 
        let diff, u, i, len, nScore;
        ghostPos = [];
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghostPos.push(ghosts[i].move(ctx));
        }
        u = user.move(ctx);
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            redrawBlock(ghostPos[i].old);
        }
        redrawBlock(u.old);
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            ghosts[i].draw(ctx);
        }                     
        user.draw(ctx);
        userPos = u["new"];
        for (i = 0, len = ghosts.length; i < len; i += 1) {
            if (collided(userPos, ghostPos[i]["new"])) {
                if (ghosts[i].isVunerable()) { 
                    playDing("pacmanEatGhost");
                    ghosts[i].eat();
                    eatenCount += 1;
                    nScore = eatenCount * 50;
                    drawScore(nScore, ghostPos[i]);
                    user.addScore(nScore);                    
                    setState(EATEN_PAUSE);
                    timerStart = tick;
                } else if (ghosts[i].isDangerous()) {
                    playDing("pacmanDie");
                    setState(DYING);
                    timerStart = tick;
                }
            }
        }                             
    };

    function mainLoop() {
			if (state !== PAUSE) { ++tick; }
			map.drawPills(ctx);
			if (state === PLAYING) {
					mainDraw();
			} else if (state === WAITING && stateChanged) {            
					stateChanged = false;
					map.draw(ctx);
					// dialog("Press N to start a New game");            
					dialog("Commencer (C)");            
			} else if (state === EATEN_PAUSE && 
								 (tick - timerStart) > (Pacman.FPS / 3)) {
					map.draw(ctx);
					setState(PLAYING);
			} else if (state === DYING) {
					if (tick - timerStart > (Pacman.FPS * 2)) { 
							loseLife();
					} else { 
							redrawBlock(userPos);
							for (let i = 0, len = ghosts.length; i < len; i += 1) {
									redrawBlock(ghostPos[i].old);
									ghostPos.push(ghosts[i].draw(ctx));
							}                                   
							user.drawDead(ctx, (tick - timerStart) / (Pacman.FPS * 2));
					}
			} else if (state === COUNTDOWN) {
					let diff = 5 + Math.floor((timerStart - tick) / Pacman.FPS);
					if (diff === 0) {
							map.draw(ctx);
							setState(PLAYING);
					} else {
							if (diff !== lastTime) { 
									lastTime = diff;
									map.draw(ctx);
									// dialog("Starting in: " + diff);
									dialog(" " + diff + " ");
							}
					}
			} 
			drawFooter();
			if (user.theScore()>=targetScore) {
				setState(PAUSE)
				dialog("Terminé")
				unload()
				if (cbSuccess) cbSuccess()
			}
    }

    function eatenPill() {
        playDing("pacmanEatPill");
        timerStart = tick;
        eatenCount = 0;
        for (let  i = 0; i < ghosts.length; i += 1) {
            ghosts[i].makeEatable(ctx);
        }        
    };
    
    function completedLevel() {
        setState(WAITING);
        level += 1;
        map.reset();
        user.newLevel();
        startLevel();
    };

    function keyPress(e) { 
        if (state !== WAITING && state !== PAUSE) { 
            e.preventDefault();
            e.stopPropagation();
        }
    };
    
    async function init(wrapper, root) {
        let i, len,
            blockSize = wrapper.offsetWidth / 19,
            canvas    = document.createElement("canvas");
        canvas.setAttribute("width", (blockSize * 19) + "px");
        canvas.setAttribute("height", (blockSize * 22) + 30 + "px");
        wrapper.appendChild(canvas);
				// init var	
        ctx  = canvas.getContext('2d');
        eatenCount   = 0,
        level        = 0,
        tick         = 0,
		    state        = WAITING,
				ghostPos     = null,
				userPos      = null, 
        stateChanged = true,
        timerStart   = null,
        lastTime     = 0,
        timer        = null,
        stored       = null;

        map   = new Pacman.Map(blockSize);
        user  = new Pacman.User({ 
            "completedLevel" : completedLevel, 
            "eatenPill"      : eatenPill 
        }, map);
        for (i = 0, len = ghostSpecs.length; i < len; i += 1) {
            ghosts.push(new Pacman.Ghost({"getTick":getTick}, map, ghostSpecs[i]));
        }
        map.draw(ctx);
        dialog("Chargement.");
	      loaded()
    };
    function loaded() {
			// annule les resdus eventuels
			unload()
			console.log("PACMAN.loaded")
			// dialog("Press N to Start");
			dialog("Commencer (C)")          
			document.addEventListener("keydown", keyDown, true);
			document.addEventListener("keypress", keyPress, true); 
			timer = window.setInterval(mainLoop, 1000 / Pacman.FPS);
    };

		function updateTimer(fps) {
			Pacman.FPS = fps
			window.clearInterval(timer)
			timer = window.setInterval(mainLoop, 1000 / Pacman.FPS);
		}

    function unload() {
			console.log("PACMAN.unload")
			window.clearInterval(timer)
			timer = null

      document.removeEventListener("keydown", keyDown, true);
      document.removeEventListener("keypress", keyPress, true); 
		}
	
    return { "init" : init, "unload" : unload, "keyDownByName": keyDownByName, "updateTimer": updateTimer }
    
}());

Pacman.WALL    = 0;
Pacman.BISCUIT = 1;
Pacman.EMPTY   = 2;
Pacman.BLOCK   = 3;
Pacman.PILL    = 4;

Pacman.MAP = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
	[0, 4, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 4, 0],
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
	[0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
	[0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
	[0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
	[2, 2, 2, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 2, 2, 2],
	[0, 0, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 0, 0],
	[2, 2, 2, 2, 1, 1, 1, 0, 3, 3, 3, 0, 1, 1, 1, 2, 2, 2, 2],
	[0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
	[2, 2, 2, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 2, 2, 2],
	[0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
	[0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
	[0, 4, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 4, 0],
	[0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
	[0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
	[0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

Pacman.WALLS = [
    [{"move": [0, 9.5]}, {"line": [3, 9.5]},
     {"curve": [3.5, 9.5, 3.5, 9]}, {"line": [3.5, 8]},
     {"curve": [3.5, 7.5, 3, 7.5]}, {"line": [1, 7.5]},
     {"curve": [0.5, 7.5, 0.5, 7]}, {"line": [0.5, 1]},
     {"curve": [0.5, 0.5, 1, 0.5]}, {"line": [9, 0.5]},
     {"curve": [9.5, 0.5, 9.5, 1]}, {"line": [9.5, 3.5]}],

    [{"move": [9.5, 1]},
     {"curve": [9.5, 0.5, 10, 0.5]}, {"line": [18, 0.5]},
     {"curve": [18.5, 0.5, 18.5, 1]}, {"line": [18.5, 7]},
     {"curve": [18.5, 7.5, 18, 7.5]}, {"line": [16, 7.5]},
     {"curve": [15.5, 7.5, 15.5, 8]}, {"line": [15.5, 9]},
     {"curve": [15.5, 9.5, 16, 9.5]}, {"line": [19, 9.5]}],

    [{"move": [2.5, 5.5]}, {"line": [3.5, 5.5]}],

    [{"move": [3, 2.5]},
     {"curve": [3.5, 2.5, 3.5, 3]},
     {"curve": [3.5, 3.5, 3, 3.5]},
     {"curve": [2.5, 3.5, 2.5, 3]},
     {"curve": [2.5, 2.5, 3, 2.5]}],

    [{"move": [15.5, 5.5]}, {"line": [16.5, 5.5]}],

    [{"move": [16, 2.5]}, {"curve": [16.5, 2.5, 16.5, 3]},
     {"curve": [16.5, 3.5, 16, 3.5]}, {"curve": [15.5, 3.5, 15.5, 3]},
     {"curve": [15.5, 2.5, 16, 2.5]}],

    [{"move": [6, 2.5]}, {"line": [7, 2.5]}, {"curve": [7.5, 2.5, 7.5, 3]},
     {"curve": [7.5, 3.5, 7, 3.5]}, {"line": [6, 3.5]},
     {"curve": [5.5, 3.5, 5.5, 3]}, {"curve": [5.5, 2.5, 6, 2.5]}],

    [{"move": [12, 2.5]}, {"line": [13, 2.5]}, {"curve": [13.5, 2.5, 13.5, 3]},
     {"curve": [13.5, 3.5, 13, 3.5]}, {"line": [12, 3.5]},
     {"curve": [11.5, 3.5, 11.5, 3]}, {"curve": [11.5, 2.5, 12, 2.5]}],

    [{"move": [7.5, 5.5]}, {"line": [9, 5.5]}, {"curve": [9.5, 5.5, 9.5, 6]},
     {"line": [9.5, 7.5]}],
    [{"move": [9.5, 6]}, {"curve": [9.5, 5.5, 10.5, 5.5]},
     {"line": [11.5, 5.5]}],

    [{"move": [5.5, 5.5]}, {"line": [5.5, 7]}, {"curve": [5.5, 7.5, 6, 7.5]},
     {"line": [7.5, 7.5]}],
    [{"move": [6, 7.5]}, {"curve": [5.5, 7.5, 5.5, 8]}, {"line": [5.5, 9.5]}],

    [{"move": [13.5, 5.5]}, {"line": [13.5, 7]},
     {"curve": [13.5, 7.5, 13, 7.5]}, {"line": [11.5, 7.5]}],
    [{"move": [13, 7.5]}, {"curve": [13.5, 7.5, 13.5, 8]},
     {"line": [13.5, 9.5]}],

    [{"move": [0, 11.5]}, {"line": [3, 11.5]}, {"curve": [3.5, 11.5, 3.5, 12]},
     {"line": [3.5, 13]}, {"curve": [3.5, 13.5, 3, 13.5]}, {"line": [1, 13.5]},
     {"curve": [0.5, 13.5, 0.5, 14]}, {"line": [0.5, 17]},
     {"curve": [0.5, 17.5, 1, 17.5]}, {"line": [1.5, 17.5]}],
	
    [{"move": [1, 17.5]}, {"curve": [0.5, 17.5, 0.5, 18]}, {"line": [0.5, 21]},
     {"curve": [0.5, 21.5, 1, 21.5]}, {"line": [18, 21.5]},
     {"curve": [18.5, 21.5, 18.5, 21]}, {"line": [18.5, 18]},
     {"curve": [18.5, 17.5, 18, 17.5]}, {"line": [17.5, 17.5]}],
	
    [{"move": [18, 17.5]}, {"curve": [18.5, 17.5, 18.5, 17]},
     {"line": [18.5, 14]}, {"curve": [18.5, 13.5, 18, 13.5]},
     {"line": [16, 13.5]}, {"curve": [15.5, 13.5, 15.5, 13]},
     {"line": [15.5, 12]}, {"curve": [15.5, 11.5, 16, 11.5]},
     {"line": [19, 11.5]}],

    [{"move": [5.5, 11.5]}, {"line": [5.5, 13.5]}],
    [{"move": [13.5, 11.5]}, {"line": [13.5, 13.5]}],

    [{"move": [2.5, 15.5]}, {"line": [3, 15.5]},
     {"curve": [3.5, 15.5, 3.5, 16]}, {"line": [3.5, 17.5]}],
	
    [{"move": [16.5, 15.5]}, {"line": [16, 15.5]},
     {"curve": [15.5, 15.5, 15.5, 16]}, {"line": [15.5, 17.5]}],

    [{"move": [5.5, 15.5]}, {"line": [7.5, 15.5]}],
	
    [{"move": [11.5, 15.5]}, {"line": [13.5, 15.5]}],
    
    [{"move": [2.5, 19.5]}, {"line": [5, 19.5]},
     {"curve": [5.5, 19.5, 5.5, 19]}, {"line": [5.5, 17.5]}],
  
		[{"move": [5.5, 19]}, {"curve": [5.5, 19.5, 6, 19.5]},
     {"line": [7.5, 19.5]}],

    [{"move": [11.5, 19.5]}, {"line": [13, 19.5]},
     {"curve": [13.5, 19.5, 13.5, 19]}, {"line": [13.5, 17.5]}],
	
    [{"move": [13.5, 19]}, {"curve": [13.5, 19.5, 14, 19.5]},
     {"line": [16.5, 19.5]}],

    [{"move": [7.5, 13.5]}, {"line": [9, 13.5]},
     {"curve": [9.5, 13.5, 9.5, 14]}, {"line": [9.5, 15.5]}],
	
    [{"move": [9.5, 14]}, {"curve": [9.5, 13.5, 10, 13.5]},
     {"line": [11.5, 13.5]}],

    [{"move": [7.5, 17.5]}, {"line": [9, 17.5]},
     {"curve": [9.5, 17.5, 9.5, 18]}, {"line": [9.5, 19.5]}],
	
    [{"move": [9.5, 18]}, {"curve": [9.5, 17.5, 10, 17.5]},
     {"line": [11.5, 17.5]}],

    [{"move": [8.5, 9.5]}, {"line": [8, 9.5]}, {"curve": [7.5, 9.5, 7.5, 10]},
     {"line": [7.5, 11]}, {"curve": [7.5, 11.5, 8, 11.5]},
     {"line": [11, 11.5]}, {"curve": [11.5, 11.5, 11.5, 11]},
     {"line": [11.5, 10]}, {"curve": [11.5, 9.5, 11, 9.5]},
     {"line": [10.5, 9.5]}]
];

Object.prototype.clone = function () {
    let i, newObj = (this instanceof Array) ? [] : {};
    for (i in this) {
        if (i === 'clone') {
            continue;
        }
        if (this[i] && typeof this[i] === "object") {
            newObj[i] = this[i].clone();
        } else {
            newObj[i] = this[i];
        }
    }
    return newObj;
};

function roxxor() {
	PACMAN.updateTimer(30)
	addNotification("Mode Roxxor","yellow",5)
}
function noob() {
	PACMAN.updateTimer(15)
	addNotification("Mode Noob","yellow",5)
}

</script>
<style>

	.trNoborder {margin: 0 auto; border:0; }
	.tdLeft {margin: 0 auto; border:1px solid red; }
	.tdRight {margin: 0 auto; border:1px solid red; }
	.tdTop {margin: 0 auto; border:1px solid red; }
	.tdBot {margin: 0 auto; border:1px solid red; }
	.bigKey { font-size:2em }
	.roxxor { cursor: pointer; text-align: center; color: white; background-color: red; font-size: 0.9em}
	.noob { cursor: pointer; text-align: center; color: white; background-color: lightgreen; font-size: 0.9em}
	.tbCenter {margin: 0 auto; border:0; /* width:100% */ }
	.trNoborder {margin: 0 auto; border:0; }
	.rectangleContainer {
	  width: 80vw;
	  margin: 0 auto;
		/* background-color: green; */
	}
	#pacman {
		/* ratio  X/Y 0.81 pour un zone style smartphone */
	  border-radius: 10px;
	  margin: 0 auto;
		max-height: 50vh;
		/* background-color: red; */
		aspect-ratio: 0.81 / 1;
	}
</style>

<div class="rectangleContainer">
	<div id="pacman">
	</div>
</div>
<!-- boutons pour smartphones -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div>
	<table class="tbCenter">
		<tbody>
		<tr class="trNoborder">
			<td><input class="bigKey" type="button" value="C " onclick={()=>PACMAN.keyDownByName('c')} /></td>
			<td></td>
			<td class="tdTop"><input class="bigKey" type="button" value="▲" onclick={()=>PACMAN.keyDownByName('z')}/></td>
			<td></td>
			<td><input class="bigKey" type="button" value="⏸" onclick={()=>PACMAN.keyDownByName('p')}/></td>
		</tr>
		<tr class="trNoborder">
			<td></td>
			<td class="tdLeft"><input class="bigKey" type="button" value="◀" onclick={()=>PACMAN.keyDownByName('q')}/></td>
			<td></td>
			<td class="tdRight"><input class="bigKey" type="button" value="▶" onclick={()=>PACMAN.keyDownByName('d')}/></td>
			<td></td>
		</tr>
		<tr class="trNoborder">
			<td><div class="roxxor" role="button" onclick={()=>roxxor()}>Mode<br/>roxxor</div></td>
			<td></td>
			<td class="tdBot"><input class="bigKey" type="button" value="▼" onclick={()=>PACMAN.keyDownByName('s')}/></td>
			<td></td>
			<td><div class="noob" role="button" onclick={()=>noob()}>Mode<br/>noob</div></td>
		</tr>
		</tbody>
	</table>
</div>

