/*     Lode Runner

Aluno 1: 55226 Jose Murta
Aluno 2: 56153 Diogo Rodrigues

Comentario:

O trabalho foi totalmente realizado, com algumas especificações escolhidas 
pessoalmente, visto que nao eram especificadas no enunciado, nomeadamente,
diminuimos a velocidade dos robots, decidimos que os golds transportados pelos
robots nao podem ser largados por cima de ladders e ropes.

01234567890123456789012345678901234567890123456789012345678901234567890123456789
*/


// GLOBAL VARIABLES

// tente não definir mais nenhuma variável global

let empty, hero, control;


// ACTORS

class Actor {
    constructor(x, y, imageName) {
		this.x = x;
		this.y = y;
		this.imageName = imageName;
		this.show();
	}
	draw(x, y) {
		control.ctx.drawImage(GameImages[this.imageName],
				x * ACTOR_PIXELS_X, y* ACTOR_PIXELS_Y);
	}
    move(dx, dy) {
		this.hide();
		this.x += dx;
		this.y += dy;
		this.show();
	}

	/**
	 * Checks if the actor is movable
	 */
	isMovable() {
		return false;
	}

	/**
	 * Checks if the actor is empty (if there is no image associated)
	 */
	isEmpty() {
		return false;
	}
}

class PassiveActor extends Actor {
	show() {
		control.world[this.x][this.y] = this;
		this.draw(this.x, this.y);
	}
	hide() {
		control.world[this.x][this.y] = empty;
		empty.draw(this.x, this.y);
	}

	/**
	 * Checks if one active actor can move to this passive actor
	 */
	isDuro() {
		return false;
	}

	/**
	 * Checks if the passive actor can be climbed by an active
	 * actor
	 */
	isScalable() {
		return false;
	}

	/**
	 * Checks if an active actor can hang to this actor
	 */
	isHangable(){
		return false;
	}

	/**
	 * Checks if this passive actor is a reward
	 */
	isReward() {
		return false;
	}

	/**
	 * Checks if this passive actor can be broke
	 */
	isBreakable() {
		return false;
	}

	/**
	 * Checks if this passive was shooted
	 */
	wasShooted() {return false;}
}

class ActiveActor extends Actor {
    constructor(x, y, imageName) {
		super(x, y, imageName);
		this.time = 0; // timestamp used in the control of the animations
	}
	show() {
		control.worldActive[this.x][this.y] = this;
		this.draw(this.x, this.y);
	}
	hide() {
		control.worldActive[this.x][this.y] = empty;
		control.world[this.x][this.y].draw(this.x, this.y);
	}
	animation() {
	}

	/**
	 * Checks if the actor is one villain 
	 */
	badActor() {
		return false;
	}

	isMovable () {
		return true;
	}

}

class Brick extends PassiveActor {
	constructor(x, y) { super(x, y, "brick"); }
	isDuro() {return true;}
	isBreakable() {return true;}
}
class ShootableBrick extends PassiveActor {
	constructor(x, y) { super(x, y, "empty"); }
	show(){}
	hide(){}
	isEmpty() {return true;}
	wasShooted () {return true;}
}

class Chimney extends PassiveActor {
	constructor(x, y) { super(x, y, "chimney"); }
	isEmpty () {return true};
}

class Empty extends PassiveActor {
	constructor() { super(-1, -1, "empty"); }
	show() {}
	hide() {}
	isEmpty() {return true;}
}


class Gold extends PassiveActor {
	constructor(x, y) { super(x, y, "gold"); }
	isEmpty() {return true;}
	isReward() {return true;}
}

class Invalid extends PassiveActor {
	constructor(x, y) { super(x, y, "invalid"); }
}

class Ladder extends PassiveActor {
	constructor(x, y) {
		super(x, y, "empty");
	}
	makeVisible() {
		this.imageName = "ladder";
		this.show();
	}

	isScalable() {return true;}

}


class Rope extends PassiveActor {
	constructor(x, y) { super(x, y, "rope"); }
	isHangable() {
		return true;
	}
	isDuro() {
		return true;
	}
	
}

class Stone extends PassiveActor {
	constructor(x, y) { super(x, y, "stone"); }
	isDuro() {return true;}
}

class Boundary extends Stone {
	constructor(x, y) { super(-1,-1); }
	show() {}
	hide() {}
}

class Hero extends ActiveActor {
	constructor(x, y) {
		super(x, y, "hero_runs_left");
		this.fall = false; //Checks if the hero is falling
		this.changehands = false; //Change hands in ladders
		this.countGolds = 0; //Count the number of golds cacthed by the hero
	}
	move(dx, dy) {
		if (control.get(this.x+dx,this.y+dy).isMovable() && 
		control.get(this.x+dx,this.y+dy).badActor()) {
			control.get(this.x, this.y).hide();
			control.timeouts.push(setTimeout(() => {
				alert('Game Over');
				b1();
				return;}, 100));
		} 
		else {
			super.move(dx,dy);	
		}
	}

	shoot(a,b) {
		this.show();
		control.getBehind(a, b).hide();
		control.world[a][b] = new ShootableBrick(a,b);
		control.timeouts.push(setTimeout(() => {
			if  (!control.get(a,b).isMovable()) {
				control.world[a][b] = new Brick(a,b);
			} else {
				if (control.get(a,b).badActor()) {
					control.get(a,b).move(0,-1);
					control.world[a][b] = new Brick(a,b);
				} else {
					alert ('Game Over');
					b1();
					return;
				}
			}
		}, 5000));
	}
	
	/**
	 * The hero shoots to his left
	 */
	shootLeft() {
		if(!control.get(this.x-1, this.y).isMovable() && 
		control.getBehind(this.x-1, this.y+1).isBreakable()&& 
		control.getBehind(this.x-1, this.y).isEmpty() && 
		!control.getBehind(this.x-1, this.y).isReward()) {
			this.imageName = "hero_shoots_left";
			let a = this.x-1;
			let b = this.y+1;
			this.shoot(a,b);
			this.heroRight(1,0);
			this.imageName = "hero_shoots_left";
			this.show();
		}
	}

	/**
	 * The hero shoots to his right
	 */
	shootRight() {
		if(!control.get(this.x+1, this.y).isMovable() && 
		control.getBehind(this.x+1, this.y+1).isBreakable()&& 
		control.getBehind(this.x+1, this.y).isEmpty() && 
		!control.getBehind(this.x+1, this.y).isReward()) { 
			this.imageName = "hero_shoots_right";
			let a = this.x+1;
			let b = this.y+1;
			this.shoot(a,b);
			this.heroLeft(-1,0);
			this.imageName  = "hero_shoots_right";
			this.show();
		}
	}

	/**
	 * The hero falls
	 */
	fallHero() {
		if (control.getBehind(this.x, this.y+1).isHangable()) {
			if (this.imageName == "hero_falls_right") {
				this.imageName = "hero_on_rope_right";
				
			} else {
				this.imageName = "hero_on_rope_left";
			}
			this.fall = false;
		} else {
			if (!control.get(this.x, this.y+1).isEmpty()) {
				if (this.imageName == "hero_falls_right") {
					this.imageName = "hero_runs_right";
					this.show();
					
				} else {
					this.imageName = "hero_runs_left";
					this.show();
				}
				this.fall = false;
				return;
			}
		}
		this.move(0, 1);
	}

	/**
	 * It shows the complete last ladder of the current level, 
	 * when the hero catch all the gold
	 */
	showLastLadder() {
		if (this.countGolds == control.goldCounter)  {
			for (let i = 0; i < WORLD_WIDTH; i++) {
				for (let j = 0; j < WORLD_HEIGHT; j++) {
					if (control.getBehind(i,j).isScalable() && 
					control.getBehind(i,j).imageName == "empty") {
						control.getBehind(i,j).makeVisible();
					}
				}
			}
		}
	}
	/**
	 * The hero keeps the gold when move to the position
	 * where the gold was
	 */
	hideGolds() {
		if(control.getBehind(this.x, this.y).isReward())	{
			control.getBehind(this.x, this.y).hide();
			control.get(this.x, this.y).show();
			this.countGolds++;
			let gl = document.getElementById('goldLeft');
			gl.value = control.goldCounter - this.countGolds;
		}
	}

	/**
	 * The hero goes up
	 * @param {*} dx - direction in X axis
	 * @param {*} dy - direction in Y axis
	 */
	heroUp(dx, dy) {
		if(control.getBehind(this.x, this.y).isScalable() 
		&& control.getBehind(this.x, this.y).imageName != "empty") {
			if (this.changehands == false) {
				this.imageName = "hero_on_ladder_right";
				this.changehands = true;
			} else {
				this.imageName = "hero_on_ladder_left";
				this.changehands = false;
			}
			this.move(dx, dy);
		}
	}

	/**
	 * The hero goes down
	 * @param {*} dx - direction in X axis
	 * @param {*} dy - direction in Y axis
	 */
	heroDown(dx,dy) {
		//para descer do fim duma escada
		if(control.getBehind(this.x, this.y+1).isEmpty() && 
		control.getBehind(this.x, this.y).isScalable()){
			this.imageName = "hero_falls_right";
			this.fall = true;
			return;
		}
		if(control.getBehind(this.x, this.y+1).isScalable()) {
			if (this.changehands == false) {
				this.imageName = "hero_on_ladder_right";
				this.changehands = true;
			} else {
				this.imageName = "hero_on_ladder_left";
				this.changehands = false;
			}
			this.move(dx, dy);
			}	
		if(control.getBehind(this.x, this.y).isHangable()) {
			if (this.imageName == "hero_on_rope_left") {
				this.imageName = "hero_falls_left";
				this.fall = true;
			} else {
				this.imageName = "hero_falls_right";
				this.fall = true;
			}	
		}
	}

	/**
	 * The hero goes right
	 * @param {*} dx - - direction in X axis
	 * @param {*} dy - - direction in Y axis
	 */
	heroRight(dx, dy) {
		let a = control.getBehind(this.x + dx, this.y + dy);
		if(!a.isDuro()) {
			this.imageName = "hero_runs_right";
			this.move(dx, dy);
		} 
		if (a.isHangable()) {
			this.imageName = "hero_on_rope_right";
			this.move(dx, dy);
		} else {
			if(control.getBehind(this.x, this.y+1).isEmpty() && 
			!control.getBehind(this.x, this.y).isScalable()) { 
				this.fall = true;
				this.imageName = "hero_falls_right";
			} 
		}
		if(control.getBehind(this.x, this.y+1).isHangable()) {
			this.fall = true;
			this.imageName = "hero_falls_right";
		} 
	}

	/**
	 * The hero goes left
	 * @param {*} dx - direction in X axis
	 * @param {*} dy - direction in Y axis
	 */
	heroLeft(dx, dy) {
		let a = control.getBehind(this.x + dx, this.y + dy);
		if(!a.isDuro()) {
			this.imageName = "hero_runs_left";
			this.move(dx, dy);
		}
		if (a.isHangable()) {
			this.imageName = "hero_on_rope_left";
			this.move(dx, dy);
		} else {
			if(control.getBehind(this.x, this.y+1).isEmpty() && 
			!control.getBehind(this.x, this.y).isScalable()) {
				this.fall = true;
				this.imageName = "hero_falls_left";
			}
		}
		if(control.getBehind(this.x, this.y+1).isHangable()) {
			this.fall = true;
			this.imageName = "hero_falls_left";
		}
	}

	animation() {
		if (this.fall) {
			this.fallHero();
		} else {
			let k = control.getKey();
			//DISPARO
        	if( k == ' ' ) { 
				//falta recuo
				 if(this.imageName == "hero_runs_right" || 
				 this.imageName == "hero_shoots_right"){
					this.shootRight();
					
				 }
				 else if(this.imageName == "hero_runs_left" || 
				 this.imageName == "hero_shoots_left") {
					this.shootLeft();
				 }
				return; 
			}
        	if( k == null ) return;
			let [dx, dy] = k;

			//Subida
			if(dx == 0 && dy == -1 )  {
				this.heroUp(dx, dy);
				if(this.y == -1) {
					control.levelNumber++;
					control.loadNewLevel (control.levelNumber);
					alert("Congratulations! Next level: " + 
					control.levelNumber);
					return;
				}
			}
			//Descida
			if(dx == 0 && dy == 1) {
				this.heroDown(dx,dy);
			}
			//Direita
			if(dx == 1 && dy == 0) {
				this.heroRight(dx,dy);
			}
			//Esquerda
			if (dx == -1 && dy == 0) {
				this.heroLeft(dx, dy);
			} 
		}

		this.hideGolds();
		this.showLastLadder();
	}
}

class Robot extends ActiveActor {
	constructor(x, y) {
		super(x, y, "robot_runs_right");
		this.dx = 1;
		this.dy = 0;
		this.changehands = false; //To change hands in ladder
		this.fall = false; //If he is falling
		this.hasGold = false; //If the robot has gold
		this.dropGold = false; //If he can drop the gold
		this.timeid = 0; //Timeout id to the drop time
	  }
	  badActor() {
		  return true;
	  }
	  
	  /**
	   * Calculate the minim distance to the 4 blocks right 
	   * near to him
	   */
	  minimDistance (){
		  let minimD1 = distance(hero.x, hero.y,this.x-1,this.y);
		  let minimD2 = distance(hero.x, hero.y, this.x+1,this.y);
		  let minimD3 = distance(hero.x, hero.y, this.x,this.y-1);
		  let minimD4 = distance(hero.x, hero.y,this.x,this.y+1);
		  let blocks = [minimD1,minimD2, minimD3, minimD4];
		  let number = minimD1;
		  blocks.forEach(function(b) { 
			  if(b<=number) {
				  number = b;
			  }
		  })
		  if (number == minimD1) {
			  this.dx = -1;
			  this.dy = 0;
		  }
		  if (number == minimD2) {
			this.dx = 1;
			this.dy = 0;
		}
		if (number == minimD3) {
			this.dx = 0;
			this.dy = -1;
		}
		if (number == minimD4) {
			this.dx = 0;
			this.dy = 1;
		}
	  }
	  
	  /**
	   * When the hero is caught by a robot, the game ends
	   */
	  gameOver() {
		if(this.x == hero.x && this.y == hero.y) {
			alert ('Game Over');
			b1();
			return;
		}
	  }
	  
	  /**
	   * The robot falls
	   */
	  robotFall() {
		if (control.getBehind(this.x, this.y+1).isHangable()) {
			if (this.imageName == "robot_falls_right") {
				this.imageName = "robot_on_rope_right";
				
			} else {
				this.imageName = "robot_on_rope_left";
			}
			this.fall = false;
			//para nao se juntarem quando caem na corda
			if (control.get(this.x, this.y+1).isMovable() && 
			control.get(this.x, this.y+1).badActor()) {
				control.get(this.x, this.y+1).move(1,0);
			}
			if (control.get(this.x, this.y+1).isMovable() && 
			!control.get(this.x, this.y+1).badActor()) {
				this.move(0,1);
				control.timeouts.push(setTimeout(() => {
					alert('Game Over');
					b1();
					return;}, 100));
			}
		} else {
			if (!control.get(this.x, this.y+1).isEmpty()) {
				if(control.get(this.x, this.y+1).isMovable() && 
				!control.get(this.x, this.y+1).badActor()) {
					this.move(0,1);
					control.timeouts.push(setTimeout(() => {
						alert('Game Over');
						b1();
						return;}, 100));
				}
				this.fall = false;
				return;
			}
		}
		this.move(0,1);
	  }

	  /**
	   * The robot goes up
	   * @param {*} dx - direction in X axis
	   * @param {*} dy - direction in Y axis
	   */
	  robotUp(dx,dy) {
		if(control.getBehind(this.x, this.y).isScalable()) {
			if (this.changehands == false) {
				this.imageName = "robot_on_ladder_right";
				this.changehands = true;
			} else {
				this.imageName = "robot_on_ladder_left";
				this.changehands = false;
			}
			if (control.get(this.x+this.dx,this.y +this.dy).isMovable() 
			&& control.get(this.x+this.dx,this.y +this.dy).badActor())
				return;
			this.move(this.dx,this.dy);
		}
	  }

	  /**
	   * The robot goes down
	   * @param {*} dx - direction in X axis
	   * @param {*} dy - direction in Y axis
	   */
	  robotDown(dx, dy) {
		//para descer do fim duma escada
		if(control.getBehind(this.x,this.y+1).isEmpty() && 
		control.getBehind(this.x,this.y).isScalable()){
			this.fall = true;
			return;
		}
		if(control.world[this.x][this.y+1].isScalable()) {
			if (this.changehands == false) {
				this.imageName = "robot_on_ladder_right";
				this.changehands = true;
			} else {
				this.imageName = "robot_on_ladder_left";
				this.changehands = false;
			}
			if (control.get(this.x+this.dx,this.y +this.dy).isMovable()
			 && control.get(this.x+this.dx,this.y +this.dy).badActor())
				return;
			this.move(this.dx,this.dy);
		}
		if(control.getBehind(this.x, this.y).isHangable()) {
			if (this.imageName == "robot_on_rope_left") {
				this.imageName = "robot_falls_left";
				this.fall = true;
			} else {
				this.imageName = "robot_falls_right";
				this.fall = true;
			}	
		}
	  }

	  /**
	   * The robot goes right.
	   * @param {*} dx - direction in X axis
	   * @param {*} dy - direction in Y axis
	   */
	  robotRight(dx, dy) {
		let a = control.getBehind(this.x + this.dx, this.y + this.dy);
		if(!a.isDuro()) {
			this.imageName = "robot_runs_right";
			if (control.get(this.x+this.dx,this.y +this.dy).isMovable() 
			&& control.get(this.x+this.dx,this.y +this.dy).badActor())
				return;
			this.move(this.dx,this.dy);
		} 
		if (a.isHangable()) {
			this.imageName = "robot_on_rope_right";
			if (control.get(this.x+this.dx,this.y +this.dy).isMovable()
			 && control.get(this.x + this.dx,this.y + this.dy).badActor())
				return;
			this.move(this.dx,this.dy);	
		} else {
			if(control.get(this.x, this.y +1).isEmpty()) {
				this.fall = true;
				this.imageName = "robot_falls_right";
			}	 
		}
		if(control.getBehind(this.x, this.y +1).isHangable()) {
			this.fall = true;
			this.imageName = "robot_falls_right";
		}
	  }


	  /**
	   * The robot goes left
	   * @param {*} dx - direction in X axis
	   * @param {*} dy - direction in Y axis
	   */
	  robotLeft(dx, dy) {
		let a = control.getBehind(this.x + this.dx, this.y + this.dy);
		if(!a.isDuro()) {
			this.imageName = "robot_runs_left";
			if (control.get(this.x+this.dx,this.y +this.dy).isMovable() 
			&& control.get(this.x+this.dx,this.y +this.dy).badActor())
				return;
			this.move(this.dx,this.dy);	
		}
		if (a.isHangable()) {
			this.imageName = "robot_on_rope_left";
			if (control.get(this.x+this.dx,this.y +this.dy).isMovable() 
			&& control.get(this.x+this.dx,this.y +this.dy).badActor())
				return;
			this.move(this.dx,this.dy);
		} else {
			if(control.get(this.x,this.y+1).isEmpty()) {
				this.fall = true;
				this.imageName = "robot_falls_left";
			}
		}
		if(control.getBehind(this.x, this.y +1).isHangable()) {
			this.fall = true;
			this.imageName = "robot_falls_left";
		} 
	  }

	  /**
	   * Checks if the robot has gold when falls into a hole made 
	   * by the hero, if he has drop it
	   */
	  robotWithGoldInHole() {
		if (this.hasGold){
			clearTimeout(this.timeid);
			control.world[this.x][this.y-1] = new Gold (this.x,this.y-1);
			this.hasGold = false;
			this.dropGold = false;
		}
	  }

	  /**
	   * Robot drops the gold after a fixed time
	   */
	  robotDropGold() {
		if(this.dropGold && control.getBehind(this.x,this.y+1).isDuro() 
		&& !control.getBehind(this.x,this.y).isScalable()
		&& !control.getBehind(this.x,this.y).isHangable()) {
			control.world[this.x][this.y] = new Gold (this.x,this.y);
			control.get(this.x,this.y).show();
			this.dropGold = false;
			this.hasGold = false;	
		}
	  }

	  /**
	   * Robot catches the gold if he moves to a block where is a gold
	   */
	  robotCatchGold() {
		if (control.getBehind(this.x, this.y).isReward() && !this.hasGold) {
			this.hasGold = true;
			control.getBehind(this.x, this.y).hide();
			control.get(this.x,this.y).show();
			this.timeid = setTimeout(() => {
				this.dropGold = true;
				return;}, 2000);
			control.timeouts.push(this.timeid);
			
		}
	  }
     
	  animation() {  
		this.gameOver();
		if (control.getBehind(this.x,this.y).wasShooted()) {
			this.robotWithGoldInHole();
			return;
		} 
		else {
			this.robotDropGold();
			if (this.fall) {
				this.robotFall();
			}
			else {
				if (this.time % 2 == 0)
					return;
				this.minimDistance();

			//subir
				if (this.dx == 0 && this.dy == -1) {
					this.robotUp(this.dx, this.dy);
				}
				//descida
				if(this.dx == 0 && this.dy == 1) {
					this.robotDown(this.dx, this.dy);
				}
				//Direita
				if(this.dx == 1 && this.dy == 0) {
					this.robotRight(this.dx, this.dy);
				}
				//esquerda
				if (this.dx == -1 && this.dy == 0) {
					this.robotLeft(this.dx, this.dy);
				}	
			}
			this.robotCatchGold();
		}
		
	}
}

// GAME CONTROL

class GameControl {
	constructor() {
		control = this;
		this.timeouts = [];	
		this.key = 0;
		this.time = 0;
		this.ctx = document.getElementById("canvas1").getContext("2d");
		empty = new Empty();	// only one empty actor needed
		this.boundary = new Boundary();
		this.world = this.createMatrix();
		this.worldActive = this.createMatrix();
		this.levelNumber = 1; //Level of the game
		this.goldCounter = 0; //Number of golds on level
		this.loadLevel(this.levelNumber);
		this.setupEvents();
	}
	createMatrix() { // stored by columns
		let matrix = new Array(WORLD_WIDTH);
		for( let x = 0 ; x < WORLD_WIDTH ; x++ ) {
			let a = new Array(WORLD_HEIGHT);
			for( let y = 0 ; y < WORLD_HEIGHT ; y++ )
				a[y] = empty;
			matrix[x] = a;
		}
		return matrix;
	}
	loadLevel(level) {
		if( level < 1 || level > MAPS.length )
			fatalError("Invalid level " + level)
		let map = MAPS[level-1];  // -1 because levels start at 1
        for(let x=0 ; x < WORLD_WIDTH ; x++)
            for(let y=0 ; y < WORLD_HEIGHT ; y++) {
					// x/y reversed because map stored by lines
				GameFactory.actorFromCode(map[y][x], x, y);
			}
			this.goldCounter = this.numberGold();
			let gl = document.getElementById('goldLeft');
			gl.value = this.goldCounter;
			let l = document.getElementById('level');
			l.value = this.levelNumber;
	}
	getKey() {
		let k = control.key;
		control.key = 0;
		switch( k ) {
			case 37: case 79: case 74: return [-1, 0]; //  LEFT, O, J
			case 38: case 81: case 73: return [0, -1]; //    UP, Q, I
			case 39: case 80: case 76: return [1, 0];  // RIGHT, P, L
			case 40: case 65: case 75: return [0, 1];  //  DOWN, A, K
			case 0: return null;
			default: return String.fromCharCode(k);
		// http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
		};	
	}
	setupEvents() {
		addEventListener("keydown", this.keyDownEvent, false);
		addEventListener("keyup", this.keyUpEvent, false);
		setInterval(this.animationEvent, 1000 / ANIMATION_EVENTS_PER_SECOND);
	}
	animationEvent() {
		control.time++;
		for(let x=0 ; x < WORLD_WIDTH ; x++)
			for(let y=0 ; y < WORLD_HEIGHT ; y++) {
				let a = control.worldActive[x][y];
				if( a.time < control.time ) {
					a.time = control.time;
					a.animation();
				}
            }
	}
	keyDownEvent(k) {
		control.key = k.keyCode;
	}
	keyUpEvent(k) {
	}
	
	/**
	 * Cleans the world and the worldActive matrix
	 */
	cleanMap() {
		for( let x = 0 ; x < WORLD_WIDTH ; x++ ) {
			for( let y = 0 ; y < WORLD_HEIGHT ; y++ ) {
				this.world[x][y].hide();
				this.worldActive[x][y].hide();
			}
		}
	}
	
	/**
	 * Calculates the number of gold in the current level
	 */
	numberGold () {
	let count = 0;
		for (let i = 0; i <WORLD_WIDTH ;i++) {
			for (let j = 0; j< WORLD_HEIGHT ; j++) {
				if (control.world[i][j].isReward()) {
					count++;
				}
			}
		}
	return count;
	}

	/**
	 * Checks if an actor is inside the canvas
	 * @param {*} x - coordinate in X axis
	 * @param {*} y - coordinate in X axis
	 */
	isInside(x,y) {
		return 0 <= x && x < WORLD_WIDTH && 0 <= y && y < WORLD_HEIGHT;  
	}

	/**
	 * Gets the active actor or the passive actor in the position
	 * @param {*} x - coordinate in X axis
	 * @param {*} y - coordinate in Y axis
	 */
	get(x,y) {
		if(!this.isInside(x,y))
			return this.boundary;
		if(control.worldActive[x][y] !== empty)
			return control.worldActive[x][y];
		else 
			return control.world[x][y];
	}

	/**
	 * Gets the passive actor in the position
	 * @param {*} x - coordinate in X axis
	 * @param {*} y - coordinate in Y axis
	 */
	getBehind(x,y) {
		if(!this.isInside(x,y))
			return this.boundary;
		return control.world[x][y];
	}

	/**
	 * Loads the new level n
	 * @param {*} n - the new level to load
	 */
	loadNewLevel (n) {
		if(n == 17) {
			alert("Congratulations! You won the Game!");
			b1();
			return;
		}
		this.key = 0;
		this.time = 0;
		empty = new Empty();	// only one empty actor needed
		this.boundary = new Boundary();
		this.cleanMap();
		this.world = control.createMatrix();
		this.worldActive = control.createMatrix();
		this.goldCounter = 0;
		this.levelNumber = n;
		this.loadLevel(n);
	}

	/**
	 * Clears all the timeouts that were still in progress 
	 * right before the end of the level
	 */
	clearTimeOuts(){
		this.timeouts.forEach(function(b) { 
			clearTimeout(b);
		})
	}
}


// HTML FORM

function onLoad() {
  // Asynchronously load the images an then run the game
	GameImages.loadAll(function() { new GameControl(); });
}
let audio = null;

/**
 * Restart the game
 */
function b1() {
	control.clearTimeOuts();
	control.loadNewLevel(1);
	alert("The game will restart!");
}


/**
 * Goes to level n
 * @param {*} n - the level to go 
 */
function levelButton (n) {
	control.loadNewLevel(n);
	alert("The game is going to level " + n);
}

/**
 * Music on
 */
function audioOn() {
	if(audio == null) {
	audio = new Audio (
	"http://ctp.di.fct.unl.pt/miei/lap/projs/proj2020-3/files/louiscole.m4a");
	}
	audio.loop = true;
	audio.play();
}

/**
 * Music off
 */
function audioOff() {
	if( audio != null) 
		audio.pause();
	else {
	alert("Music has not started yet! Click on MUSIC ON to start the music.");
	}
}

/**
 * Show and hide the help text
 */
function functionHelp() {
	let help = document.getElementById("HELP");
	if (help.style.display == "none") {
		help.style.display = "block";
	} else {
		help.style.display = "none";
	}
}

  
