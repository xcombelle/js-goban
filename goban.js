var Goban = (function() {
    'use strict';

    var goban = {};
    // for node test
    try {
        module.exports = this;
    } catch (e) {
    }
	goban.EMPTY = 0;
    goban.BLACK = 1;
    goban.WHITE = 2;
	goban.BORDER = 3;
    goban.CLIView = function(options) {
        this.board = options.board;

        this.render = function() {
            for ( var i = 0; i < this.board.size; i++ ) {
                var line = "|";
                for ( var j = 0; j < this.board.size; j++ ) {
                    var val = this.board.data[i*(this.board.size+2) + j];
                    var char;
                    switch ( val ) {
                        case goban.BLACK:
                            char = "×";
                            break;
                        case goban.WHITE:
                            char = "○";
                            break;
                        case goban.EMPTY:
                            char = " ";
                            break;
                    }
                    line += char;
                }
                console.log(line + '|');
            };
        };
        return this;
    };

    goban.Board = function(options)
    {
        this.size = options.size;

        this.data = [];
        for (var i = 0; i < (this.size+2) * (this.size+2); i++ ) {
			if (i%(this.size+2)==0 
				|| i%(this.size+2)==this.size+1 
				|| i<(this.size+2) 
				|| i>=(this.size+2)*(this.size+2)-(this.size+2)) {
				this.data[i] = goban.BORDER
			} else {            
				this.data[i] = goban.EMPTY;
			}
        }

        this.point = function(x, y, value) {
            if (value == undefined) {
				
                return this.data[(y+1) * (this.size+2) + (x+1)];
            } else {
                this.data[(y+1) * (this.size+2) + (x+1)] = value;
            }
        };

        this.turn = goban.BLACK;

        this.viewClass = options.viewClass ? options.viewClass : goban.CLIView;
        this.viewOptions = options.viewOptions ? options.viewOptions : {};

        this.changeTurn = function() {
            if (this.turn == goban.BLACK) {
                this.turn = goban.WHITE;
            } else {
                this.turn = goban.BLACK;
            }
        };

        this.move = function(x, y) {
			if (this.point(x, y) == goban.EMPTY) {
                this.point(x, y, this.turn);
                this.evaluate(x, y);
                this.changeTurn();
                this.lastMove= { x:x, y:y };
            } else {
                throw "Can't move to this position "+ x +","+ y +":"+this.point(x, y);
            }
        };

        this.evaluate = function(x, y) {
			
            var otherTurn = 2-this.turn+1;
			var p = (y+1)*(this.size+2)+(x+1);
			var self = this;
			this.forneighbourg (p, function (n) {
				if(self.isDead(n, otherTurn)) {
                    self.remove(n,otherTurn);
				}
            });
			if(this.isDead(p, this.turn)) {
                    this.remove(p,this.turn);
			}
		}
        this.isDead = function(n, color) {
            var isChecked = [];
            return !this.isAlive(n, color, isChecked);
        };

        this.DEBUG_IS_ALIVE = false;
        this.debugIsAlive = function(msg) {
            if ( this.DEBUG_IS_ALIVE ) {
                console.log(msg);
            }
        };
		this.forneighbourg = function (p,f) {
			f(p+1);
			f(p-1);
			f(p+this.size+2);
			f(p-(this.size+2));
		};
        this.remove = function (p,color) {
			if (this.data[p]!= color) {
				return;
			}            
			this.data[p] = goban.EMPTY;
			this.debugIsAlive("removing "+p+" "+this.data[p]);
            			
			var self = this;
            this.forneighbourg (p, function (n) {
			    self.remove(n, color) ;
            });
        };
        
        this.isAlive = function(p, color, isChecked) {
            if ( isChecked[p] ) {
                return false;
            }
            isChecked[p] = true;
			this.debugIsAlive("############ called isAlive p: " + p + " "+color);
            			
			if ( this.data[p]== goban.EMPTY) {
				this.debugIsAlive("############ found alive p: " + p );
            				
				return true;
			}
			if ( this.data[p]!= color) {
				this.debugIsAlive("############ not this color p: " + p+" "+color );		
				return false;
			}
			var self = this
			var alive = false
            this.forneighbourg (p, function (n) {
				if (self.isAlive(n,color,isChecked)) {
					self.debugIsAlive("############ neighbourg is alive p: " + p );	
					alive = true;
				}				
			});
			this.debugIsAlive("############ neighbourg is alive p: " + p + "alive");	
					
            return alive;
        };

        this.render = function() {
            
            this.view.render();
        }
        this.viewOptions.board = this;
        this.view = new this.viewClass(this.viewOptions);
            
        return this;
    };

    goban.CanvasView = function(options) {

        this.backgroundColor = options.backgroundColor ? options.backgroundColor : 'rgb(172, 130, 70)';

        this.board = options.board;
        this.dom = options.document.getElementById(options.id);
        this.canvas = this.dom.getContext('2d');

        this.getCursorPosition= function(e) {
            var x;
            var y;
            if (e.pageX != undefined && e.pageY != undefined) {
	            x = e.pageX;
	            y = e.pageY;
            }
            else {
	            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            x -= this.dom.offsetLeft;
            y -= this.dom.offsetTop;
            x = Math.min(x, this.dom.width );
            y = Math.min(y, this.dom.height);
            var cell = {x:Math.floor(x/(this.dom.width / this.board.size)),y:Math.floor(y/(this.dom.height / this.board.size))};
            return cell;
        }
        var self = this;
        this.onClick = function(e) {
            var cell = self.getCursorPosition(e);
            self.board.move(cell.x, cell.y);
			self.board.render();
	    }

        
        this.render = function() {
            this.drawBoard();
            for (var i = 0; i < this.board.size; i++) {
                for (var j = 0; j < this.board.size; j++) {
					                    
					this.drawStone(i, j);
                }
            }
			if (this.board.lastMove) {
		        if (goban.EMPTY != this.board.lastMove ) {
		            this.drawCircle(this.board.lastMove.x,this.board.lastMove.y);
		        }
			}
        };

        this.drawStone = function(x, y) {
            var value = this.board.point( x,y);
            switch (value) {
                case goban.EMPTY:
                    break;
                case goban.BLACK:
                    this.canvas.fillStyle = 'rgb(0, 0, 0)';
                    this.canvas.strokeStyle = 'rgb(0, 0, 0)';
                    break;
                case goban.WHITE:
                    this.canvas.fillStyle = 'rgb(255, 255, 255)';
                    this.canvas.strokeStyle = 'rgb(0, 0, 0)';
                    break;
            }
            if (value != goban.EMPTY) {
                var unit_radius = this.dom.width / this.board.size / 2 * 0.8;
                this.point(x, y, unit_radius);
            }

        }

        this.drawCircle = function(x, y) {
            var value = this.board.point( x,y);
            switch (value) {
                case goban.EMPTY:
                    this.canvas.fillStyle = 'rgb(0, 0, 0, 0)';
                    this.canvas.strokeStyle = 'rgb(0, 0, 0)';
                    break;
                case goban.BLACK:
                    this.canvas.fillStyle = 'rgb(0, 0, 0,0)';
                    this.canvas.strokeStyle = 'rgb(255, 255, 255)';
                    break;
                case goban.WHITE:
                    this.canvas.fillStyle = 'rgb(0, 0, 0,0)';
                    this.canvas.strokeStyle = 'rgb(0, 0, 0)';
                    break;
            }
            var unit_radius = this.dom.width / this.board.size / 4 * 0.8;
            this.point(x, y, unit_radius,true);
            
        }

        this.drawBoard = function() {
            this.drawBackground();
            this.canvas.fillStyle = 'rgb(0, 0, 0)';
            this.canvas.strokeStyle = 'rgb(0, 0, 0)';

            var unit_height = this.dom.height / this.board.size;
            var unit_width = this.dom.width / this.board.size;

            // vertical line
            for (var i = 0; i < this.board.size; i++) {
                this.canvas.beginPath();
                var start_coordinate = this.getCoordinate(i, 0);
                this.canvas.moveTo(start_coordinate[0], start_coordinate[1]);
                var finish_coordinate = this.getCoordinate(i, this.board.size - 1);
                this.canvas.lineTo(finish_coordinate[0], finish_coordinate[1]);
                this.canvas.closePath();
                this.canvas.stroke();
            }

            // horizontal line
            for (var j = 0; j < this.board.size; j++) {
                this.canvas.beginPath();
                var start_coordinate = this.getCoordinate(0, j);
                this.canvas.moveTo(start_coordinate[0], start_coordinate[1]);
                var finish_coordinate = this.getCoordinate(this.board.size - 1, j);
                this.canvas.lineTo(finish_coordinate[0], finish_coordinate[1]);
                this.canvas.closePath();
                this.canvas.stroke();
            }

            var radius = 2;
            switch (this.board.size) {
                case 9:
                    this.point(2, 2, radius);
                    this.point(2, 5 - 1, radius);
                    this.point(2, 9 - 1 - 2, radius);
                    this.point(5 - 1, 9 - 1 - 2, radius);
                    this.point(9 - 1 - 2, 9 - 1 - 2, radius);
                    this.point(9 - 1 - 2, 5 - 1, radius);
                    this.point(9 - 1 - 2, 2, radius);
                    this.point(5 - 1, 2, radius);

                    this.point(5 - 1, 5 - 1, radius);
                    break;
                case 13:
                    // TODO
                    break;
                case 19:
                    this.point(3, 3, radius);
                    this.point(3, 10 - 1, radius);
                    this.point(3, 19 - 1 - 3, radius);
                    this.point(10 - 1, 19 - 1 - 3, radius);
                    this.point(19 - 1 - 3, 19 - 1 - 3, radius);
                    this.point(19 - 1 - 3, 10 - 1, radius);
                    this.point(19 - 1 - 3, 3, radius);
                    this.point(10 - 1, 3, radius);
                    this.point(10 - 1, 10 - 1, radius);
                    break;
                default:
                    break;
            }
        };

        this.point = function(x, y, r, width) {
            var coordinates = this.getCoordinate(x, y);
            
            this.canvas.beginPath();
            this.canvas.arc(coordinates[0], coordinates[1], r, 0, Math.PI * 2, false);
            this.canvas.closePath();
            

            if(width!=undefined) {
                this.canvas.stroke();            
            } else {
                this.canvas.fill();
            }
            
        };

        // return real coordinates from virtual coodinate.
        this.getCoordinate = function(x, y) {
            var unit_height = this.dom.height / this.board.size;
            var unit_width = this.dom.width / this.board.size;
            return [unit_width / 2 + unit_width * x, unit_height / 2 + unit_height * y];
        }

        this.drawBackground = function() {
            this.canvas.fillStyle = this.backgroundColor;
            this.canvas.fillRect(0, 0, this.dom.width, this.dom.height);
        }
        
        this.dom.addEventListener("click", this.onClick, false);
        return this;
    };

    return goban;
})();

