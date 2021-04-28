const storage = firebase.firestore();
let uid, username, warningID; //user's unique id, their displau name, where to display the warning message
let warned = false; //have we warned them about chat security yet?

//authenticate anonumously with firebase
const signIn = () => {
	firebase
		.auth()
		.signInAnonymously()
		.then(() => {
			console.log("signed in");
		})
		.catch((error) => {
			console.log("error signing in: " + error);
		});

	firebase.auth().onAuthStateChanged((user) => {
		if (user) {
			uid = user.uid; //set user id

			purgeOldMessages();
			updateMessages();

			displayNumPeople();
			setInterval(displayNumPeople, 10000); //sad that I have to do this but I don't think it's possible with listeners

			//allow messages to be sent
			$("#submit-button").click((e) => {
				e.preventDefault();
				sendMessage();
			});
		}
	});
};

//delete messages older than 12 hours from the server
const purgeOldMessages = () => {
	storage
		.collection("messages")
		.get()
		.then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				const ms = doc.data().date.toDate();
				if (Date.now() - ms >= 43200000) {
					doc.ref.delete();
				}
			});
		});
};

//listen for messages and then add them to the list
const updateMessages = () => {
	storage
		.collection("messages")
		.orderBy("date", "desc")
		.limit("30")
		.onSnapshot(
			(snapshot) => {
				if (!snapshot.docChanges().empty) {
					$("#messages-wrap").empty();
					//insert the warning message at the beginning of flow
					if (warned && (warningID === undefined || warningID.length === 0)) sendWarningMessage();
					//go through all messages from oldest first
					for (let i = snapshot.docs.length - 1; i >= 0; i--) {
						const doc = snapshot.docs[i];
						const msg = doc.data();
						//make sure message is from last 12 hours
						if (msg.date && Date.now() - msg.date.toDate() < 43200000) {
							let type = "other";
							if (msg.uid === uid) type = "self"; //appear on left or right?
							const identifier = msg.date.seconds + msg.date.nanoseconds;
							//actually add to html
							$("#messages-wrap").append(
								`<div class="message ${type}">
                                    <h3 class="message-name"></h3>
                                    <p class="message-content"></p>
                                    <p class="identifier" hidden>${identifier}</p>
                                </div>`
							);
							//set as text to avoid XSS
							$("#messages-wrap").children().last().children(".message-name").text(msg.name);
							$("#messages-wrap").children().last().children(".message-content").text(msg.content);
							//insert the warning message at the right point in the flow
							if (identifier + "" === warningID) sendWarningMessage();
						}
					}
					$("#messages-wrap").animate({ scrollTop: $("#messages-wrap").prop("scrollHeight") }, "slow");
				}
			},
			(err) => {
				console.log(err);
			}
		);
};

//post a message to the server
const sendMessage = () => {
	const msg = $("#text-field").val();
	//scenarios where we can't send
	if (msg.length === 0 || username === undefined) return;
	if (msg.length > 500) {
		$("#messages-wrap").append(
			`<div class="warning-message"><p>Character limit exceeded: ${msg.length}/500</p></div>`
		);
		return;
	}
	$("#text-field").val(""); //empty field
	//actually add
	storage
		.collection("messages")
		.add({
			uid: uid,
			name: username,
			content: msg,
			date: firebase.firestore.FieldValue.serverTimestamp(),
		})
		.then(() => {
			console.log("message sent successfully");
		})
		.catch((error) => {
			console.error("Error adding document: ", error);
			$("#messages-wrap").append(`<div class="warning-message"><p>Message failed to send: ${msg}</p></div>`);
		});
};

//create a name in format adjective-verb-noun
const generateName = () => {
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
	const verb = verbs[Math.floor(Math.random() * verbs.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	username = `${adj}-${verb}-${noun}`;
	$("#name-field").val(username);
};

//update the name when the user types in the name box
const updateName = () => {
	const newName = $("#name-field").val().trim();
	//validate length
	if (newName.length <= 3 || newName.length > 30) {
		$("#name-field").addClass("bad-input");
		return;
	}
	$("#name-field").removeClass("bad-input");
	username = newName;
};

//warn the user that this isn't really good code
const sendWarningMessage = () => {
	$("#messages-wrap").append(
		"<div class='warning-message'><p>This is NOT a secure messaging service. Please be kind and do not share personal information.</p></div>"
	);
};

//query the server to find out how many people are online and display it
const displayNumPeople = () => {
	//first update yourself in the database
	database
		.ref(`/people/${uid}/`)
		.set({
			date: Date.now(),
		})
		.then(() => {
			//then add all people who have updated in the last 15 seconds
			database
				.ref("/people/")
				.once("value")
				.then((snapshot) => {
					let numPeople = 0;
					Object.entries(snapshot.val()).forEach((person) => {
						if (Date.now() - person[1].date > 15000) {
							database.ref(`/people/${person[0]}`).remove();
						} else {
							numPeople++;
						}
					});
					//display the result
					$("#num-people").text(numPeople);
				});
		});
};

$((ready) => {
	generateName();
	signIn();

	//warn the user when they first go to send a message
	$("#text-field").click(() => {
		if (!warned) {
			warned = true;
			warningID = $("#messages-wrap").children().last().children(".identifier").text();
			sendWarningMessage();
			$("#messages-wrap").animate({ scrollTop: $("#messages-wrap").prop("scrollHeight") }, "slow");
		}
	});

	//prevent form from refreshing page
	$("form").on("submit", function (e) {
		e.preventDefault();
	});

	//update name in realtime as you type
	$("#name-field").on("keydown", () => {
		setTimeout(updateName, 10);
	});
});

const adjectives = [
	"adorable",
	"beautiful",
	"clean",
	"drab",
	"elegant",
	"fancy",
	"glamorous",
	"handsome",
	"plain",
	"quaint",
	"sparkly",
	"unsightly",
	"red",
	"orange",
	"yellow",
	"green",
	"blue",
	"purple",
	"gray",
	"black",
	"white",
	"alive",
	"better",
	"careful",
	"clever",
	"famous",
	"gifted",
	"helpful",
	"mushy",
	"odd",
	"rich",
	"shy",
	"tender",
	"angry",
	"clumsy",
	"grumpy",
	"helpless",
	"itchy",
	"jealous",
	"lazy",
	"nervous",
	"obnoxious",
	"panicky",
	"scary",
	"uptight",
	"worried",
	"brave",
	"calm",
	"eager",
	"faithful",
	"gentle",
	"happy",
	"jolly",
	"kind",
	"lively",
	"nice",
	"proud",
	"silly",
	"witty",
];

const verbs = [
	"acting",
	"baking",
	"building",
	"gaming",
	"climbing",
	"closing",
	"crying",
	"dancing",
	"dreaming",
	"drinking",
	"eating",
	"entering",
	"exiting",
	"falling",
	"fixing",
	"helping",
	"hopping",
	"joking",
	"jumping",
	"kicking",
	"hitting",
	"laughing",
	"leaving",
	"lifting",
	"making",
	"marching",
	"moving",
	"nodding",
	"playing",
	"pushing",
	"reading",
	"riding",
	"running",
	"shouting",
	"singing",
	"sitting",
	"smiling",
	"standing",
	"talking",
	"thinking",
	"throwing",
	"texting",
	"touching",
	"turning",
	"voting",
	"waiting",
	"walking",
	"writing",
	"yelling",
];

const nouns = [
	"area",
	"book",
	"business",
	"company",
	"country",
	"day",
	"eye",
	"fact",
	"family",
	"group",
	"hand",
	"home",
	"job",
	"life",
	"man",
	"money",
	"month",
	"mother",
	"father",
	"night",
	"number",
	"person",
	"place",
	"problem",
	"program",
	"question",
	"room",
	"school",
	"state",
	"story",
	"student",
	"study",
	"system",
	"thing",
	"time",
	"teacher",
	"water",
	"week",
	"woman",
	"word",
	"world",
	"year",
];
