const socket = io("localhost:3000"); //process.env.LOCAL_SOCKET_URL (didn't work)
let username = "";
let opponent = "";

// Handle setting the username
document.getElementById("usernameForm").addEventListener("submit", (event) => {
    event.preventDefault();
    username = document.getElementById("usernameInput").value;
    socket.emit("setUsername", username);
    document.getElementById("playerName").innerText = `${username}`;
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
});

// Update available players list
socket.on("updatePlayers", (players) => {
    let dropdown = document.getElementById("playersList");
    dropdown.innerHTML = "";
    players.forEach((player) => {
        if (player !== username) {
            let option = document.createElement("option");
            option.value = player;
            option.innerText = player;
            dropdown.appendChild(option);
        }
        if (opponent && player != opponent) {
            // CHECK IF OPPONENT LEFT/Joined diff game
            document.getElementById("gameStatus").innerText = `${opponent} left...`;
            document.getElementById("playersList").disabled = false;
            document.getElementById("challengeButton").disabled = false;
        }
    });
});

// Handle challenging an opponent
document.getElementById("challengeButton").addEventListener("click", () => {
    opponent = document.getElementById("playersList").value;
    socket.emit("challengePlayer", opponent);
    // FIXED // FIX, NEED TO CONFIRM IF BOTH PLAYERS CHOOSE EACHOTHER BEFORE STARTING
    // AFTER SELECT (WAITING FOR OPPONENT (REPLACE 'PLAYING AGAINST ...'))
    // SEND CHALLENGE MESSAGE TO OPPONENT ([NAME] IS CHALLENGING YOU (REPLACE 'SELECT AN OPPONENT'))

    document.getElementById("playersList").disabled = true;
    document.getElementById("challengeButton").disabled = true;
    document.getElementById("gameStatus").innerText = `Waiting for opponent...`;
});

let opponents = [];
socket.on("challenger", (opponent) => {
    opponents.push(opponent);
    let opps = "Player(s) " + opponents.join(", ");
    // for (opp in opponents)
    //     document.getElementById("challengeOpp").innerText = `${opp}, `;
    document.getElementById("selectOpp").innerText = `${opps} challenged you!`;
})

// Game starts
socket.on("matchStart", (data) => {
    document.getElementById("playersList").disabled = true;
    document.getElementById("challengeButton").disabled = true;
    opponents = [];
    if (data.player1 === username || data.player2 === username) {
        document.getElementById("gameStatus").innerText = `Playing against ${opponent}`;
        document.getElementById("gameChoices").style.display = "flex";
        document.getElementById("pscore").innerText = `${data.player1}: 0`;
        document.getElementById("oscore").innerText = `${data.player2}: 0`;
        document.getElementById("gameResult").innerText = "Select a hand";
        // document.getElementById("forfeit").style.display = "flex";
    }
});

// Handle sending a move
document.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => {
        const choice = button.getAttribute("data-choice");
        disableButtons();
        document.getElementById("gameResult").innerText = `Waiting for ${opponent}'s move...`;
        socket.emit("playerMove", { playerName: username, opponentName: opponent, move: choice });
    });
});

// Handle receiving game results
socket.on("roundResult", ({ opMove, result, score }) => { // make sure moves is {name (not id) : choice}
    // if 0 = 'tied', 1 = 'win', -1 = 'lose' // You 'insert' !
    document.getElementById("gameResult").innerText = `${opponent} threw ${opMove}! You ${result}!`;
    document.getElementById("pscore").innerText = `${username}: ${score[username]}`;
    document.getElementById("oscore").innerText = `${opponent}: ${score[opponent]}`;
    enableButtons();
});

function disableButtons() {
    document.querySelectorAll(".choice").forEach((button) => {
        button.disabled = true;
    })
}

function enableButtons() {
    document.querySelectorAll(".choice").forEach((button) => {
        button.disabled = false;
    })
}

document.getElementById("forfeit").addEventListener("click", () => {

})

function forfeitGame() {

    let button = document.getElementById("forfeit-rematch");
    button.innerText = "Rematch";
    button.onclick = rematchGame;
    document.getElementById("leave").display = "block";
}

function rematchGame() { //if click forfeit or end match
    let button = document.getElementById("forfeit-rematch");
    button.innerText = "Forfeit";
    button.onclick = forfeitGame;
}

// click forfeit, determine winner, higher score/rounds won or person who did not click forfeit
// click forfeit/end of round: forfeit becomes rematch, leave button appears
// if rematch, reset score, change button back to forfeit, hide leave
// if leave, disband room, put both in availablePlayers, hide ui, enable dropdown and challenge
