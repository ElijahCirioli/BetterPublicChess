const database = firebase.database();

const updateWinHistory = () => {
	database.ref("/win-history/").on("value", (snapshot) => {
		if (snapshot.exists()) {
			winHistory = snapshot.val();
			endListener();

			//get the number for our current game
			gameNumber = winHistory.length;
			viewGameNumber = gameNumber;
			startListener();
		} else {
			//we have no games stored in the history
			gameNumber = 0;
			viewGameNumber = 0;
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
			viewDate = frame.date ? frame.date : getDateString();
		} else {
			turnNumber = 0;
			viewDate = getDateString();
			defaultSetup();
			postData();
		}
		viewTurnNumber = turnNumber;
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
	if (turnNumber === undefined) turnNumber = -1;
	const date = getDateString();
	database.ref(`/games/${gameNumber}/${turnNumber + 1}/`).set({
		pieces: pieces,
		turn: turn,
		lastMove: lastMove,
		date: date,
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

const getDateString = () => {
	const d = new Date();
	const str = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
	return str;
};

$((ready) => {
	updateWinHistory();
});
