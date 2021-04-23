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

		if (turn === "white") turn = "black";
		else turn = "white";

		createPieceList();
		populateBoard();
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

		return moves;
	}

	move(m) {
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
		if (!this.hasMoved) {
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
