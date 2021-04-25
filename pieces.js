class Piece {
	constructor(x, y, hasMoved, color) {
		this.x = x;
		this.y = y;
		this.hasMoved = hasMoved;
		this.color = color;
		this.image = "";
		this.type = "";
	}

	getMoves() {
		return [];
	}

	removeCheckMoves(moves, king) {
		//find king if needed
		if (!king) {
			for (let y = 0; y < 8; y++) {
				for (let x = 0; x < 8; x++) {
					const piece = board[y][x];
					if (piece instanceof King && piece.color === this.color) {
						king = piece;
						break;
					}
				}
			}
		}

		//remove check moves
		const backup = { x: this.x, y: this.y };
		for (let i = 0; i < moves.length; i++) {
			const m = { ...moves[i] };
			const copy = copyBoard();

			board[this.y][this.x] = 0;
			board[m.y][m.x] = this;
			this.x = m.x;
			this.y = m.y;
			if (this.type === "king") king = this;
			if (testForCheck(king)) {
				moves.splice(i, 1);
				i--;
				//castling through check
				if (this.type === "king") {
					for (let j = 0; j < moves.length; j++) {
						const other = moves[j];
						if (other.y === m.y && Math.sign(other.x - this.x) === Math.sign(m.x - backup.x)) {
							moves.splice(j, 1);
							j--;
						}
					}
				}
			}
			board = copy;
			this.x = backup.x;
			this.y = backup.y;
		}
	}

	canMove(m) {
		if (m.x < 0 || m.x > 7) return false;
		if (m.y < 0 || m.y > 7) return false;
		const target = board[m.y][m.x];
		if (target === 0) return true;
		return target.color !== this.color;
	}

	isEnemy(m) {
		if (m.x < 0 || m.x > 7) return false;
		if (m.y < 0 || m.y > 7) return false;
		const target = board[m.y][m.x];
		if (target === 0) return false;
		return target.color !== this.color;
	}

	getLineMoves(moves, dir) {
		for (let i = 1; true; i++) {
			const m = { x: this.x + i * dir.x, y: this.y + i * dir.y };
			if (this.canMove(m)) {
				moves.push(m);
				if (this.isEnemy(m)) break;
			} else break;
		}
		return moves;
	}

	move(m) {
		lastMove.from = { x: this.x, y: this.y };
		lastMove.to = { x: m.x, y: m.y };

		board[this.y][this.x] = 0;
		board[m.y][m.x] = this;
		this.x = m.x;
		this.y = m.y;
		this.hasMoved = true;
	}
}

class Pawn extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-pawn.png`;
		this.type = "pawn";
		this.dir = color === "black" ? 1 : -1;
	}

	getMoves() {
		let moves = [];

		//forward moves
		const single = { x: this.x, y: this.y + this.dir };
		if (this.canMove(single) && !this.isEnemy(single)) {
			moves.push(single);
			if (!this.hasMoved) {
				const double = { x: this.x, y: this.y + 2 * this.dir };
				if (this.canMove(double) && !this.isEnemy(double)) moves.push(double);
			}
		}

		//captures
		const diagLeft = { x: this.x - 1, y: this.y + this.dir };
		const diagRight = { x: this.x + 1, y: this.y + this.dir };
		if (this.canMove(diagLeft) && this.isEnemy(diagLeft)) moves.push(diagLeft);
		if (this.canMove(diagRight) && this.isEnemy(diagRight)) moves.push(diagRight);

		//en passant
		if (lastMove.to.x >= 0 && board[lastMove.to.y][lastMove.to.x] instanceof Pawn) {
			//if it just moved two spaces
			if (Math.abs(lastMove.to.y - lastMove.from.y) === 2) {
				const avgY = (lastMove.to.y + lastMove.from.y) / 2;
				const passingPos = { x: lastMove.to.x, y: avgY };
				if (diagLeft.y === passingPos.y) {
					if (diagLeft.x === passingPos.x) moves.push(diagLeft);
					if (diagRight.x === passingPos.x) moves.push(diagRight);
				}
			}
		}
		return moves;
	}

	move(m) {
		//en passant
		if (m.x !== this.x && board[m.y][m.x] === 0) {
			board[lastMove.to.y][lastMove.to.x] = 0;
		}
		//parent version
		super.move(m);
		//promotion
		if ((this.color === "white" && this.y === 0) || (this.color === "black" && this.y === 7)) {
			board[this.y][this.x] = new Queen(this.x, this.y, this.hasMoved, this.color);
			createPieceList();
			populateBoard();
		}
	}
}

class Knight extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-knight.png`;
		this.type = "knight";
	}

	getMoves() {
		let moves = [];
		for (let xOffset = -2; xOffset <= 2; xOffset++) {
			for (let yOffset = -2; yOffset <= 2; yOffset++) {
				if (Math.abs(xOffset) + Math.abs(yOffset) === 3) {
					const m = { x: this.x + xOffset, y: this.y + yOffset };
					if (this.canMove(m)) moves.push(m);
				}
			}
		}
		return moves;
	}
}

class Bishop extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-bishop.png`;
		this.type = "bishop";
	}

	getMoves() {
		let moves = [];

		this.getLineMoves(moves, { x: 1, y: 1 });
		this.getLineMoves(moves, { x: -1, y: 1 });
		this.getLineMoves(moves, { x: 1, y: -1 });
		this.getLineMoves(moves, { x: -1, y: -1 });

		return moves;
	}
}

class Rook extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-rook.png`;
		this.type = "rook";
	}

	getMoves() {
		let moves = [];

		this.getLineMoves(moves, { x: 1, y: 0 });
		this.getLineMoves(moves, { x: -1, y: 0 });
		this.getLineMoves(moves, { x: 0, y: 1 });
		this.getLineMoves(moves, { x: 0, y: -1 });

		return moves;
	}
}

class King extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-king.png`;
		this.type = "king";
	}

	getMoves() {
		let moves = [];
		for (let xDir = -1; xDir <= 1; xDir++) {
			for (let yDir = -1; yDir <= 1; yDir++) {
				if (yDir === 0 && xDir === 0) continue;
				const m = { x: this.x + xDir, y: this.y + yDir };
				if (this.canMove(m)) moves.push(m);
			}
		}

		//castling
		if (!this.hasMoved && !check) {
			let right = board[this.y][7];
			//make sure the rook hasn't moved
			if (right instanceof Rook && !right.hasMoved) {
				//check for empty space between
				if (board[this.y][5] === 0 && board[this.y][6] === 0) {
					moves.push({ x: this.x + 2, y: this.y });
				}
			}
			let left = board[this.y][0];
			//make sure the rook hasn't moved
			if (left instanceof Rook && !left.hasMoved) {
				//check for empty space between
				if (board[this.y][3] === 0 && board[this.y][2] === 0 && board[this.y][1] === 0) {
					moves.push({ x: this.x - 2, y: this.y });
				}
			}
		}
		return moves;
	}

	move(m) {
		//castling
		if (Math.abs(m.x - this.x) === 2) {
			if (m.x > this.x) {
				board[this.y][7].move({ x: this.x + 1, y: this.y });
			} else {
				board[this.y][0].move({ x: this.x - 1, y: this.y });
			}
		}
		super.move(m);
	}
}

class Queen extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-queen.png`;
		this.type = "queen";
	}

	getMoves() {
		let moves = [];
		for (let xDir = -1; xDir <= 1; xDir++) {
			for (let yDir = -1; yDir <= 1; yDir++) {
				if (yDir === 0 && xDir === 0) continue;
				this.getLineMoves(moves, { x: xDir, y: yDir });
			}
		}
		return moves;
	}
}
