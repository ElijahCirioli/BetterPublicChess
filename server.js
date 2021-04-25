const database = firebase.database();

const updateWinHistory = () => {
	database.ref("/win-history/").on("value", (snapshot) => {
		if (snapshot.exists()) {
			winHistory = snapshot.val();
			endListener();

			//get the number for our current game
			gameNumber = winHistory.length;
			startListener();
		} else {
			//we have no games stored in the history
			gameNumber = 0;
			startListener();
		}
	});
};

const startListener = () => {
	endListener();
	if (gameNumber === undefined) return; //we don't know what we're actually looking for
	listener = database.ref(`/games/${gameNumber}/`).on("value", (snapshot) => {
		if (snapshot.exists()) {
			const game = snapshot.val();
			turnNumber = game.length - 1;
			const frame = game[turnNumber];
			pieces = frame.pieces;
			turn = frame.turn;
			lastMove = frame.lastMove;
		} else {
			turnNumber = 0;
			defaultSetup();
			postData();
		}
		populateBoard();
	});
};

const endListener = () => {
	if (listener) {
		database.ref(`/games/${gameNumber}/`).off("value", listener);
		listener = undefined;
	}
};

const postData = () => {
	if (turnNumber === undefined) turnNumber = 0;
	database.ref(`/games/${gameNumber}/${turnNumber}/`).set({
		pieces: pieces,
		turn: turn,
		lastMove: lastMove,
	});
};

const postWin = (winner) => {
	let updates = {};
	updates[`${gameNumber}/`] = winner;
	database.ref("win-history").update(updates);
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
	updateWinHistory();
});
