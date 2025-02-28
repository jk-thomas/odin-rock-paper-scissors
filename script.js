let playerScore = 0;
let computerScore = 0;
let playerSelect = '';
let computerSelect = '';
let roundWinner = '';

// GAME

function computerChoice() {
    let choice = Math.floor(Math.random() * 3);
    switch (choice) {
        case 0:
            return 'rock';
        case 1:
            return 'paper';
        case 2:
            return 'scissor';
    }

}

function playRound(playerSelect, computerSelect) {
    if (playerSelect == computerSelect) {
        roundWinner = 'tie';
    } else if (
        (playerSelect == 'rock' && computerSelect == 'scissor') ||
        (playerSelect == 'paper' && computerSelect == 'rock') ||
        (playerSelect == 'scissor' && computerSelect == 'paper')
    ) {
        playerScore++;
        roundWinner = 'player';
        round++;
    } else if (
        (computerSelect == 'rock' && playerSelect == 'scissor') ||
        (computerSelect == 'paper' && playerSelect == 'rock') ||
        (computerSelect == 'scissor' && playerSelect == 'paper')
    ) {
        computerScore++;
        roundWinner = 'computer';
        round++;
    }
}

function gamePlay(playerChoice) {
    playerSelect = playerChoice;

    computerSelect = computerChoice();
    playRound(playerSelect, computerSelect);
    updateUI(roundWinner);

    if (gameOver()) {
        endGame();
    }
}

function updateUI(roundWinner) {
    if (roundWinner == 'player')
        roundInfo.innerHTML = `${playerSelect} beats ${computerSelect}! <br>Player wins round ${round}!`;
    else if (roundWinner == 'computer')
        roundInfo.innerHTML = `${computerSelect} beats ${playerSelect}! <br>Computer wins round ${round}!`;
    else
        roundInfo.innerHTML = `${playerSelect} equals ${computerSelect}! <br>Tied round!`;

    playerScoreInfo.textContent = `Player: ${playerScore}`;
    computerScoreInfo.textContent = `Computer: ${computerScore}`;
}

function gameOver() {
    console.log(playerScore); console.log(computerScore); console.log(winScore);
    return (playerScore === winScore || computerScore === winScore);
}

function endGame() {
    rockBtn.disabled = true;
    paperBtn.disabled = true;
    scissorBtn.disabled = true;

    if (playerScore > computerScore)
        resultInfo.textContent = "PLAYER WINS!";
    else
        resultInfo.textContent = "COMPUTER WINS...";
}

function restartGame() {
    playerScore = 0;
    computerScore = 0;
    round = 0;
    roundInfo.textContent = "Click hand to start!";
    playerScoreInfo.textContent = "Player: 0";
    computerScoreInfo.textContent = "Computer: 0";
    resultInfo.textContent = "";
    let dropdown = document.getElementById("dropdown-container").querySelector("select");
    if (dropdown) {
        dropdown.disabled = false;
        dropdown.value = ''; 
    }
}

// UI

let round = 0;
let rounds = 0;
let winScore = 0;
let rock = '✊';
let paper = '✋';
let scissor = '✌';

const dropdownContainer = document.getElementById("dropdown-container");

const rockBtn = document.getElementById("rock");
const paperBtn = document.getElementById("paper");
const scissorBtn = document.getElementById("scissor");
const restartBtn = document.getElementById("restart");

const roundInfo = document.getElementById("round-result");
const playerScoreInfo = document.getElementById("pscore");
const computerScoreInfo = document.getElementById("cscore");
const resultInfo = document.getElementById("final-result");

rockBtn.addEventListener('click', () => gamePlay('rock'));
paperBtn.addEventListener('click', () => gamePlay('paper'));
scissorBtn.addEventListener('click', () => gamePlay('scissor'));
restartBtn.addEventListener('click', () => restartGame());

function calcWin(rounds) {
    // winScore = Math.ceil(rounds/2 + 0.5);
    winScore = Math.floor(rounds/2) + 1;
    console.log(`winScore: ${winScore}`);
}

// Function to create and return a <select> element
function createDropdown() {
    var sel = document.createElement("select");
    sel.appendChild(new Option('Select an option', '')); // Default placeholder

    for (var i = 1; i <= 11; i+=2) {
        sel.appendChild(new Option(i, i));
    }

    return sel;
}

// Function to handle the dropdown selection
function handleSelection(event) {
    rounds = event.target.value;
    if (rounds !== '') { // Ensure an option is selected
        event.target.disabled = true;  // Disable dropdown after selection
        rockBtn.disabled = false;
        paperBtn.disabled = false;
        scissorBtn.disabled = false;
        console.log("rounds:", rounds); // Log selected value
        calcWin(rounds);
        roundInfo.innerHTML = `Best of ${rounds}! First to ${winScore}!<br>Click a hand to start!`;
    }
}

// Function to initialize the dropdown and add event listeners
function init() {
    // var dropdownContainer = document.getElementById("dropdown-container");
    var dropdown = createDropdown();
    
    dropdown.addEventListener("change", handleSelection);
    dropdownContainer.appendChild(dropdown);
}

init();
