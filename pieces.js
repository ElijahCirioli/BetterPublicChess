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
}

class Knight extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-knight.png`;
		this.type = "knight";
	}
}

class Bishop extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-bishop.png`;
		this.type = "bishop";
	}
}

class Rook extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-rook.png`;
		this.type = "rook";
	}
}

class King extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-king.png`;
		this.type = "king";
	}
}

class Queen extends Piece {
	constructor(x, y, hasMoved, color) {
		super(x, y, hasMoved, color);
		this.image = `images/${color}-queen.png`;
		this.type = "queen";
	}
}
