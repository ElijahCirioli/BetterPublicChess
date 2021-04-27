const storage = firebase.firestore();
let uid, username;
let warned = false,
	warningID;

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
			uid = user.uid;
			updateMessages();
			$("#submit-button").click((e) => {
				e.preventDefault();
				sendMessage();
			});
		}
	});
};

const updateMessages = () => {
	storage
		.collection("messages")
		.orderBy("date", "desc")
		.limit("25")
		.onSnapshot(
			(snapshot) => {
				if (!snapshot.docChanges().empty) {
					$("#messages-wrap").empty();
					if (warned && (warningID === undefined || warningID.length === 0)) sendWarningMessage();
					for (let i = snapshot.docs.length - 1; i >= 0; i--) {
						const doc = snapshot.docs[i];
						const msg = doc.data();
						//make sure message is from last 12 hours
						if (msg.date && Date.now() - msg.date.seconds * 1000 < 43200000) {
							let type = "other";
							if (msg.uid === uid) type = "self";
							const identifier = msg.date.seconds + msg.date.nanoseconds;
							$("#messages-wrap").append(
								`<div class="message ${type}">
                                    <h3 class="message-name">${msg.name}</h3>
                                    <p class="message-content">${msg.content}</p>
                                    <p class="identifier" hidden>${identifier}</p>
                                </div>`
							);
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

const sendMessage = () => {
	const msg = $("#text-field").val();
	if (msg.length === 0 || msg.length > 500) return;
	if (username === undefined) return;
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
			$("#text-field").val("");
		})
		.catch((error) => {
			console.error("Error adding document: ", error);
		});
};

const generateName = () => {
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
	const verb = verbs[Math.floor(Math.random() * verbs.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	username = `${adj}-${verb}-${noun}`;
	$("#name-field").val(username);
};

const updateName = () => {
	const newName = $("#name-field").val();
	if (newName.length <= 3 || newName.length > 30) {
		$("#name-field").addClass("bad-input");
		return;
	}
	$("#name-field").removeClass("bad-input");
	username = newName;
};

const sendWarningMessage = () => {
	$("#messages-wrap").append(
		`<div class="warning-message"><p>This is NOT a secure messaging service. Please be kind and do not share personal information.</p></div>`
	);
};

$((ready) => {
	generateName();
	signIn();

	$("#text-field").click(() => {
		if (!warned) {
			warned = true;
			warningID = $("#messages-wrap").children().last().children(".identifier").text();
			sendWarningMessage();
			$("#messages-wrap").animate({ scrollTop: $("#messages-wrap").prop("scrollHeight") }, "slow");
		}
	});

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
	"calling",
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