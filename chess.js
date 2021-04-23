let playable = false;
let pieces = [];
let board;
let turn;

const defaultSetup = () => {
	pieces = [];
	pieces.push({ x: 3, y: 0, color: "black", type: "queen", hasMoved: false });
	pieces.push({ x: 3, y: 7, color: "white", type: "queen", hasMoved: false });

	pieces.push({ x: 4, y: 0, color: "black", type: "king", hasMoved: false });
	pieces.push({ x: 4, y: 7, color: "white", type: "king", hasMoved: false });

	pieces.push({ x: 2, y: 0, color: "black", type: "bishop", hasMoved: false });
	pieces.push({ x: 2, y: 7, color: "white", type: "bishop", hasMoved: false });
	pieces.push({ x: 5, y: 0, color: "black", type: "bishop", hasMoved: false });
	pieces.push({ x: 5, y: 7, color: "white", type: "bishop", hasMoved: false });

	pieces.push({ x: 1, y: 0, color: "black", type: "knight", hasMoved: false });
	pieces.push({ x: 1, y: 7, color: "white", type: "knight", hasMoved: false });
	pieces.push({ x: 6, y: 0, color: "black", type: "knight", hasMoved: false });
	pieces.push({ x: 6, y: 7, color: "white", type: "knight", hasMoved: false });

	pieces.push({ x: 0, y: 0, color: "black", type: "rook", hasMoved: false });
	pieces.push({ x: 0, y: 7, color: "white", type: "rook", hasMoved: false });
	pieces.push({ x: 7, y: 0, color: "black", type: "rook", hasMoved: false });
	pieces.push({ x: 7, y: 7, color: "white", type: "rook", hasMoved: false });

	for (let i = 0; i < 8; i++) {
		pieces.push({ x: i, y: 6, color: "white", type: "pawn", hasMoved: false });
		pieces.push({ x: i, y: 1, color: "black", type: "pawn", hasMoved: false });
	}

	turn = "white";
};

const createBoard = () => {
	const board = $("#chess-board");
	board.empty();
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			let color = "";
			if ((x + y) % 2 === 0) color = "white";
			board.append(`<div id="${x}-${y}" class="tile ${color}"><div>`);
		}
	}
	populateBoard();
};

const populateBoard = () => {
	$(".tile").empty(); //clear out html tiles
	$(".tile").off("click");
	$(".tile").css("cursor", "default");

	//create board array
	board = [];
	for (let y = 0; y < 8; y++) {
		let row = [];
		for (let x = 0; x < 8; x++) {
			row.push(0);
		}
		board.push(row);
	}

	//populate with pieces
	for (const p of pieces) {
		switch (p.type) {
			case "pawn":
				board[p.y][p.x] = new Pawn(p.x, p.y, p.hasMoved, p.color);
				break;
			case "knight":
				board[p.y][p.x] = new Knight(p.x, p.y, p.hasMoved, p.color);
				break;
			case "bishop":
				board[p.y][p.x] = new Bishop(p.x, p.y, p.hasMoved, p.color);
				break;
			case "rook":
				board[p.y][p.x] = new Rook(p.x, p.y, p.hasMoved, p.color);
				break;
			case "queen":
				board[p.y][p.x] = new Queen(p.x, p.y, p.hasMoved, p.color);
				break;
			case "king":
				board[p.y][p.x] = new King(p.x, p.y, p.hasMoved, p.color);
				break;
		}

		const piece = board[p.y][p.x];
		$(`#${p.x}-${p.y}`).append(`<img src="${piece.image}" alt="${p.type}">`);
		$(`#${p.x}-${p.y}`).on("click", () => {
			const moves = piece.getMoves();
			drawMoves(moves, piece);
		});
		if (p.color === turn) {
			$(`#${p.x}-${p.y}`).css("cursor", "pointer");
		}
	}
};

const drawMoves = (moves, piece) => {
	$(".chess-dot").remove();
	for (const move of moves) {
		const target = board[move.y][move.x];
		let color = "";
		if (target !== 0) color = "red";
		$(`#${move.x}-${move.y}`).append(`<div class="chess-dot ${color}"></div>`);
		$(`#${move.x}-${move.y}`)
			.children(".chess-dot")
			.on("click", (e) => {
				e.stopPropagation();
				piece.move(move);
			});
	}
};

const createPieceList = () => {
	pieces = [];
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			const p = board[y][x];
			if (p instanceof Piece) {
				pieces.push({ x: p.x, y: p.y, color: p.color, type: p.type, hasMoved: p.hasMoved });
			}
		}
	}
};

$((ready) => {
	defaultSetup();
	createBoard();
});
