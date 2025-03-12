const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let challengeQ = {};
let allPlayers = {Computer:"Computer"}; // not best place to keep computer
let activePlayers = {Computer:"Computer"}; // Store active players available
let rooms = {} // no repeats, just single overwrite by second joiner // new Set();

app.use(express.static(__dirname));
//app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    console.log("A player connected:", socket.id);

    // Handle username submission
    socket.on("setUsername", (username) => {
        console.log(`${socket.id} : ${username}`);
        allPlayers[String(socket.id)] = username;
        activePlayers[String(socket.id)] = username;
        io.emit("updatePlayers", Object.values(activePlayers)); // Send updated player list
    });

    // Handle opponent selection
    socket.on("challengePlayer", (opponent) => {
        //if (!activePlayers[socket.id] || !activePlayers[opponent]) return;
        let player1 = socket.id;
        if (opponent === 'Computer') {
            challengeComputer(socket.id);
            return;
        }
        let player2 = getId(opponent) //Object.keys(activePlayers).find(key => activePlayers[key] === opponent);
        // FIX, NEED TO CONFIRM IF BOTH PLAYERS CHOOSE EACHOTHER BEFORE STARTING
        if (!(challengeQ[player2] === player1)) {
            challengeQ[player1] = player2;
            console.log(`Sending challenge from ${player1} (${allPlayers[player1]}) to ${player2} (${allPlayers[player2]})`);
            io.to(player2).emit("challenger", allPlayers[player1]);
            return;
        }

        //player2 executes the following
        let roomId = [player1, player2].sort().join("-"); //`${player1}-${player2}`;
        console.log(`${allPlayers[player1]} vs ${allPlayers[player2]}! Room: ${roomId}`);
        rooms[roomId] = {
            player1,
            player2,
            moves: {},
            scores: {[player1] : 0, [player2] : 0},
        };

        delete challengeQ[player2];
        delete activePlayers[player1];
        delete activePlayers[player2];
        io.emit("updatePlayers", Object.values(activePlayers));
        io.to(player1).emit("matchStart", { player1: allPlayers[player1], player2: allPlayers[player2] }); //{ player1: players[socket.id], player2: opponent });
        io.to(player2).emit("matchStart", { player1: allPlayers[player1], player2: allPlayers[player2] });
    });

    // Handle game moves
    socket.on("playerMove", ({ playerName, opponentName, move }) => { 
        // if (opponent === "Computer") {
        //     let computerHand = computerChoice();
        // }
        console.log(rooms);
        console.log(`player: ${playerName}, opp: ${opponentName}`);
        let gameId = getGameIdByName(playerName, opponentName); 
        const room = rooms[gameId];
        console.log(`gameId: ${gameId}, room: ${room}`);
        let playerId = getId(playerName);
        room.moves[playerId] = move; 

        if (opponentName === 'Computer') {
            setTimeout(() => {
                computerChoice(room);
                let result = getRoundResult(room);
                const winLoss = {[-1] : "lost", 0 : "tie", 1 : "won"};
                let data1 = {
                    opMove: room.moves[room.player2],
                    result: winLoss[result],
                    score: { [allPlayers[room.player1]] : room.scores[room.player1], [allPlayers[room.player2]] : room.scores[room.player2], },
                };
                io.to(room.player1).emit("roundResult", (data1));
                room.moves = {};
            }, Math.floor(Math.random() * 1000 + 250));
            return;
        }

        if (room.moves[room.player1] && room.moves[room.player2]) { // only second mover will finish function, not both
            let result = getRoundResult(room);
            const winLoss = {[-1] : "lost", 0 : "tie", 1 : "won"};
            let data1 = {
                opMove: room.moves[room.player2],
                result: winLoss[result],
                score: { [allPlayers[room.player1]] : room.scores[room.player1], [allPlayers[room.player2]] : room.scores[room.player2], },
            };
            let data2 = {
                opMove: room.moves[room.player1],
                result: winLoss[-result],
                score: { [allPlayers[room.player1]] : room.scores[room.player1], [allPlayers[room.player2]] : room.scores[room.player2], },
            }
            io.to(room.player1).emit("roundResult", (data1));
            io.to(room.player2).emit("roundResult", (data2));
            room.moves = {}; // clear for next round
        }
    });

    //socket.on("forfeit") => restart, after finish or forfeit = socket.on("leave") appears/not disabled 


    // Handle player disconnect
    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete allPlayers[socket.id];
        delete activePlayers[socket.id];
        io.emit("updatePlayers", Object.values(activePlayers));
    });
});

server.listen(3000, () => { //server.listen(3000, '0.0.0.0', () => {
    console.log("Server running on port 3000");
});

function challengeComputer(socket) {
    let player1 = socket;
    let player2 = 'Computer';
    let roomId = [player1, player2].sort().join("-"); //`${player1}-${player2}`;
    console.log(`${allPlayers[player1]} vs ${allPlayers[player2]}! Room: ${roomId}`);
    rooms[roomId] = {
        player1,
        player2,
        moves: {},
        scores: {[player1] : 0, [player2] : 0},
    };

    delete activePlayers[player1];
    io.emit("updatePlayers", Object.values(activePlayers));
    io.to(player1).emit("matchStart", { player1: allPlayers[player1], player2: allPlayers[player2] });
}

function getId(username) { 
    console.log(allPlayers);
    let id = Object.keys(allPlayers).find(id => allPlayers[id] == username);
    console.log(`Username: ${username}, ID: ${id}`);
    return id;
}

function getGameIdByName(player1, player2) {
    let p1Id = getId(player1);
    let p2Id = getId(player2);
    console.log(`p1Id: ${p1Id}, p2Id: ${p2Id}`);
    return [p1Id, p2Id].sort().join("-");
}

function computerChoice(room) {
    let moves = [ 'rock', 'paper', 'scissor' ];
    let choice = moves[Math.floor(Math.random() * moves.length)];
    room.moves['Computer'] = choice;
}

function getRoundResult(room) {
    //const room = rooms[gameId]; //playerMove, oppMove
    const beats = { rock: "scissors", paper: "rock", scissors: "paper" };
    let result;
    let player1Move = room.moves[room.player1];
    let player2Move = room.moves[room.player2];
    
    result = (beats[player1Move] === player2Move) ? 1 : -1;
    if (player1Move === player2Move) result = 0;

    if (result === 1) {
        room.scores[room.player1]++;
    } else if (result === -1) {
        room.scores[room.player2]++;
    }

    return result;
    //io.to(playerid).emit("moveResult", {})
}
