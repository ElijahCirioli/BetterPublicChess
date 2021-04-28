let check = false; //is the current player in check (exclusively for castling)
let pieces = []; //all the pieces
let lastMove = { to: { x: -1, y: -1 }, from: { x: -1, y: -1 } }; //the last move to be highlighted
let board, turn; //the board array, who's turn it is
let winHistory, listener; //who won all the past games, the listener for updating the game
let gameNumber, turnNumber; //the game and turn number that we're currently in
let maxGameNumber, maxTurnNumber, viewDate; //the maximum possible game and turn number and the date to display
let rotated = false; //did the player rotate 180 degrees?

//return if the given king is in check
const testForCheck = (king) => {
	//for every square on the board
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			const piece = board[y][x];
			//if it's an enemy piece
			if (piece instanceof Piece && piece.color !== king.color) {
				//see if any of its moves can get the king
				const moves = piece.getMoves();
				for (const m of moves) {
					if (m.x === king.x && m.y === king.y) return true;
				}
			}
		}
	}
	return false;
};

//return whether the given king is in checkmate
const testForCheckmate = (king) => {
	/* assumes king is already in check */
	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			const piece = board[y][x];
			//for every piece of our own color
			if (piece instanceof Piece && piece.color === king.color) {
				//see if it can make any legal moves
				const moves = piece.getMoves();
				piece.removeCheckMoves(moves);
				if (moves.length > 0) return false;
			}
		}
	}
	return true;
};

//return a deep copy of the board object
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

//the standard chess setup
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

//create the html board
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

//our heavy duty function (I could probably break this up)
//populate the html board with pieces
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

		//add the piece images
		const piece = board[p.y][p.x];
		$(`#${p.x}-${p.y}`).append(`<img src="${piece.image}" alt="${p.type}" draggable="true">`);
		if (current && p.color === turn) {
			//make it movable
			$(`#${p.x}-${p.y}`).css("cursor", "pointer");
			$(`#${p.x}-${p.y}`).on("mousedown ondragstart", () => {
				$(`#${p.x}-${p.y}`).addClass("highlight");
				const moves = piece.getMoves();
				piece.removeCheckMoves(moves);
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

//draw dots for all the possible moves
const drawMoves = (moves, piece) => {
	for (const move of moves) {
		const target = board[move.y][move.x];
		//decide what color to draw dot
		let color = "";
		if (target !== 0) color = "red";
		else {
			//en passant red highlight
			if (piece.type === "pawn" && piece.x !== move.x) color = "red";
		}
		//add dot
		$(`#${move.x}-${move.y}`).append(`<div class="chess-dot ${color}"></div>`);
		//add click and drag events
		$(`#${move.x}-${move.y}`)
			.children(".chess-dot")
			.on("mousedown drop", (e) => {
				e.stopPropagation();
				switchTurn();
				piece.move(move);
				createPieceList();
				postData(false);
			});
		$(`#${move.x}-${move.y}`)
			.children(".chess-dot")
			.on("dragover", (e) => {
				e.preventDefault();
			});
	}
};

//highlight the last move
const drawLastMove = () => {
	if (lastMove && lastMove.to.x >= 0) {
		$(`#${lastMove.to.x}-${lastMove.to.y}`).addClass("highlight");
		$(`#${lastMove.from.x}-${lastMove.from.y}`).addClass("highlight");
	}
};

//update the UI elements
const updateUI = () => {
	//are we up to date
	const current = maxGameNumber === gameNumber && maxTurnNumber === turnNumber;
	//who's turn is it
	if (turn === "white") {
		$("#white-label").show();
		$("#black-label").hide();
	} else {
		$("#black-label").show();
		$("#white-label").hide();
	}
	//update icons bar
	const displayTurn = Math.floor((turnNumber - 1) / 2) + 1; //still needs work
	$("#number-icon").text(`Game ${gameNumber + 1} Turn ${displayTurn}`);
	if (current) {
		//up to date
		$("#date-icon").hide();
		$("#lock-icon").hide();
		$("#new-icon").hide();
		$("#flag-button").show();
		$("#chess-board").css("outline", "none");
	} else {
		//in the past
		$("#date-icon").show();
		$("#date-icon").text(viewDate);
		$("#lock-icon").show();
		$("#flag-button").hide();
		$("#chess-board").css("outline", "4px dashed #808080");
	}

	updateButtons();
	displayWinHistory();
};

//display the game over screen
const displayWinner = (winner, resigned) => {
	$("#winner-wrap").show();
	$(".winner-label").hide();
	$("#flag-button").hide();
	$("#new-game-button").hide();
	$(".tile").off("mousedown ondragstart");
	//who won
	if (winner === "white") {
		$("#white-winner-label").show();
	} else {
		$("#black-winner-label").show();
	}
	//is this a checkmate or resignation
	if (resigned) {
		$("#checkmate-label").hide();
		$("#resignation-label").show();
	} else {
		$("#checkmate-label").show();
		$("#resignation-label").hide();
	}
	//see if we're in the past or not
	if (maxGameNumber === gameNumber && maxTurnNumber === turnNumber) {
		//display button to create a new game
		$("#new-game-button").show();
		$("#new-game-button").off("click");
		$("#new-game-button").on("click", () => {
			postWin(winner);
		});
	}
};

//toggle whose turn it is
const switchTurn = () => {
	if (turn === "white") turn = "black";
	else turn = "white";
};

//update the time travel buttons
const updateButtons = () => {
	$("#controls-wrap").children("button").removeClass("disabled");
	if (turnNumber === maxTurnNumber) {
		$("#double-forward-button").addClass("disabled");
		$("#forward-button").addClass("disabled");
	}
	if (turnNumber === 1) {
		$("#double-back-button").addClass("disabled");
		$("#back-button").addClass("disabled");
	}
};

//display the colors of past wins
const displayWinHistory = () => {
	$("#scroll-container").empty();
	$("#scroll-container").append(`<div class="past-game current-game"></div>`);
	//bring ourselves up to date
	$("#scroll-container")
		.children()
		.last()
		.click(() => {
			endListener();
			gameNumber = maxGameNumber;
			turnNumber = 1;
			maxTurnNumber = 1;
			startListener();
		});
	//all the old games
	for (let i = winHistory.length - 1; i >= 0; i--) {
		const game = winHistory[i];
		$("#scroll-container").append(`<div class="past-game past-${game}"></div>`);
		$("#scroll-container")
			.children()
			.last()
			.click(function () {
				endListener();
				gameNumber = i;
				turnNumber = 1;
				maxTurnNumber = 0;
				startListener();
			});
	}
	//highlight the selected game
	$("#scroll-container")
		.children()
		.eq(winHistory.length - gameNumber)
		.addClass("active-past-game");
};

$((ready) => {
	createBoard();

	//reveal what's behind game over screen
	$("#eye-button").on("mousedown", () => {
		$("#winner-wrap").css("opacity", "0");
	});
	$("#winner-wrap").on("mouseup mouseleave", () => {
		$("#winner-wrap").css("opacity", "1");
	});

	//resignation button
	$("#flag-button").click(() => {
		postData(true);
	});

	//click notification to jump to present
	$("#new-icon").click(() => {
		$("#double-forward-button").click();
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

	//rotate board 180 degrees
	$("#rotate-button").click(() => {
		if (rotated) $("#chess-board").removeClass("rotated");
		else $("#chess-board").addClass("rotated");
		rotated = !rotated;
	});
});
