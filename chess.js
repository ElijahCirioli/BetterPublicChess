let check = false;
let pieces = [];
let lastMove = { to: { x: -1, y: -1 }, from: { x: -1, y: -1 } };
let board, turn;
let winHistory, listener;
let gameNumber, turnNumber;
let maxGameNumber, maxTurnNumber, viewDate;

const testForCheck = (king) => {
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			const piece = board[y][x];
			if (piece instanceof Piece && piece.color !== king.color) {
				const moves = piece.getMoves();
				for (const m of moves) {
					if (m.x === king.x && m.y === king.y) return true;
				}
			}
		}
	}
	return false;
};

const testForCheckmate = (king) => {
	/* assumes king is already in check */
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			const piece = board[y][x];
			if (piece instanceof Piece && piece.color === king.color) {
				const moves = piece.getMoves();
				piece.removeCheckMoves(moves);
				if (moves.length > 0) return false;
			}
		}
	}
	return true;
};

const copyBoard = () => {
	const copy = [];
	for (let y = 0; y < 8; y++) {
		let row = [];
		for (let x = 0; x < 8; x++) {
			let orig = board[y][x];
			if (orig === 0) row.push(0);
			//this line is wild but that's the best way I could come up with to clone the class object
			else row.push(Object.assign(Object.create(Object.getPrototypeOf(orig)), orig));
		}
		copy.push(row);
	}
	return copy;
};

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
	lastMove = { from: { x: -1, y: -1 }, to: { x: -1, y: -1 } };
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
};

const populateBoard = () => {
	//are we viewing an up to date turn
	const current = maxGameNumber === gameNumber && maxTurnNumber === turnNumber;
	//reset html
	$(".tile").empty();
	$(".tile").css("cursor", "default");
	$(".tile").removeClass("highlight");
	$(".tile").removeClass("check");
	$("#winner-wrap").hide();
	$(".tile").off("mousedown ondragstart");
	if (current) {
		$(".tile").on("mousedown", () => {
			$(".tile").removeClass("highlight");
			$(".chess-dot").remove();
			drawLastMove();
		});
	}
	//I actually need this flag exclusively for castling out of check it kinda sucks
	check = false;

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
		$(`#${p.x}-${p.y}`).append(`<img src="${piece.image}" alt="${p.type}" draggable="true">`);
		if (current && p.color === turn) {
			$(`#${p.x}-${p.y}`).css("cursor", "pointer");
			$(`#${p.x}-${p.y}`).on("mousedown ondragstart", () => {
				$(`#${p.x}-${p.y}`).addClass("highlight");
				const moves = piece.getMoves();
				piece.removeCheckMoves(moves, undefined);
				drawMoves(moves, piece);
			});
		}
	}

	//highlight check
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			const p = board[y][x];
			if (p.type === "king" && testForCheck(p)) {
				if (p.color === turn) check = true;
				$(`#${p.x}-${p.y}`).addClass("check");
				if (testForCheckmate(p)) {
					const winnerColor = p.color === "white" ? "black" : "white";
					displayWinner(winnerColor, false);
				}
			}
		}
	}

	drawLastMove();
	updateUI();
};

const drawMoves = (moves, piece) => {
	for (const move of moves) {
		const target = board[move.y][move.x];
		let color = "";
		if (target !== 0) color = "red";
		else {
			//en passant red highlight
			if (piece.type === "pawn" && piece.x !== move.x) color = "red";
		}
		$(`#${move.x}-${move.y}`).append(`<div class="chess-dot ${color}"></div>`);
		$(`#${move.x}-${move.y}`)
			.children(".chess-dot")
			.on("mousedown drop", (e) => {
				e.stopPropagation();
				switchTurn();
				piece.move(move);
				createPieceList();
				postData();
			});
		$(`#${move.x}-${move.y}`)
			.children(".chess-dot")
			.on("dragover", (e) => {
				e.preventDefault();
			});
	}
};

const drawLastMove = () => {
	if (lastMove && lastMove.to.x >= 0) {
		$(`#${lastMove.to.x}-${lastMove.to.y}`).addClass("highlight");
		$(`#${lastMove.from.x}-${lastMove.from.y}`).addClass("highlight");
	}
};

const updateUI = () => {
	const current = maxGameNumber === gameNumber && maxTurnNumber === turnNumber;
	if (turn === "white") {
		$("#white-label").show();
		$("#black-label").hide();
	} else {
		$("#black-label").show();
		$("#white-label").hide();
	}
	//update icons bar
	if (current) {
		//up to date
		$("#number-icon").text(`Game ${gameNumber + 1} Turn ${turnNumber}`);
		$("#date-icon").hide();
		$("#lock-icon").hide();
		$("flag-button").show();
		$("#chess-board").css("outline", "none");
	} else {
		//in the past
		$("#number-icon").text(`Game ${gameNumber + 1} Turn ${turnNumber}`);
		$("#date-icon").show();
		$("#date-icon").text(viewDate);
		$("#lock-icon").show();
		$("#flag-button").hide();
		$("#chess-board").css("outline", "4px dashed #808080");
	}

	updateButtons();
};

const displayWinner = (winner, resigned) => {
	$("#winner-wrap").show();
	$(".winner-label").hide();
	$("#flag-button").hide();
	$(".tile").off("mousedown ondragstart");
	if (winner === "white") {
		$("#white-winner-label").show();
	} else {
		$("#black-winner-label").show();
	}
	if (resigned) {
		$("#checkmate-label").hide();
		$("#resignation-label").show();
	} else {
		$("#checkmate-label").show();
		$("#resignation-label").hide();
	}
	if (maxGameNumber === gameNumber && maxTurnNumber === turnNumber) {
		$("#new-game-button").off("click");
		$("#new-game-button").on("click", () => {
			postWin(winner);
		});
	}
};

const switchTurn = () => {
	if (turn === "white") turn = "black";
	else turn = "white";
};

const updateButtons = () => {};

$((ready) => {
	createBoard();

	$("#eye-button").on("mousedown", () => {
		$("#winner-wrap").css("opacity", "0");
	});
	$("#winner-wrap").on("mouseup mouseleave", () => {
		$("#winner-wrap").css("opacity", "1");
	});
	$("#flag-button").click(() => {
		const winnerColor = turn === "white" ? "black" : "white";
		displayWinner(winnerColor, true);
	});

	//timeline buttons
	$("#double-forward-button").click(() => {
		turnNumber = maxTurnNumber;
		startListener();
	});
	$("#forward-button").click(() => {
		turnNumber++;
		if (turnNumber > maxTurnNumber) turnNumber = maxTurnNumber;
		startListener();
	});
	$("#back-button").click(() => {
		turnNumber--;
		if (turnNumber < 1) turnNumber = 1;
		startListener();
	});
	$("#double-back-button").click(() => {
		turnNumber = 1;
		startListener();
	});
});
