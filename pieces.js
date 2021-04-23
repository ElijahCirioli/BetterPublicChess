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
		const single = { x: this.x, y: this.y + this.dir };
		if (canMove(single, this.color)) {
			moves.push(single);
			if (!this.hasMoved) {
				const double = { x: this.x, y: this.y + 2 * this.dir };
				if (canMove(double, this.color)) moves.push(double);
			}
		}
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
