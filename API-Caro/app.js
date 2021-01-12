'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var cors = require('cors')
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const socketio = require('socket.io');
const http = require('http');
const battleM = require('./app/models/battle');
const chatM = require('./app/models/conversation');
const movingM = require('./app/models/moving');
const mAccount = require('./app/models/account');
const { v4: uuidv4 } = require('uuid');

const middlewareAuth = require('./app/middlewares/Authentication');
const { createServer } = require('tls');
const CaroGameList = require('./app/game/caro-game-list');
const CaroGame = require('./app/game/caro-game');
const { log } = require('util');
//const { delete } = require('./routes');
var app = express();

app.use(cors())
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/user', middlewareAuth.isUser, require('./app/areas/user/controller/user'));
app.use('/admin', middlewareAuth.isAdmin, require('./app/areas/admin/controller/admin'));
app.use('/', require('./app/areas/guest/controller/guest'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
app.use(logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms'));

app.set('port', process.env.PORT || 3000);

var server = http.createServer(app);
var online = {}
global.io = socketio(server);

// generate an ID:
function generateAnId(len) {
    var text = "";
    var possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < len; i++)
        text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    return text;
}

var gameData = new CaroGameList(10, 100, generateAnId)

io.on('connection', function (socket) {
    console.log("someone connected");

    //io.emit('FromAPI', JSON.stringify(online));
    socket.on("user-online", data => {
        if (online[data] == null) {
            online[data] = [socket.id];
        } else {
            online[data].push(socket.id);
        }
        console.log(online);
        io.emit("user-online", JSON.stringify(Object.keys(online)));
    })
    socket.on('disconnect', (data) => {
        for (const [key, value] of Object.entries(online)) {
            if (value.indexOf(socket.id) >= 0) {
                value.splice(value.indexOf(socket.id), 1);
                if (value.length === 0) {
                    delete online[key];
                }
            }
        }
        console.log(socket.id + " disconnected");
        console.log(online);
        gameData.pendingPlayer.forEach((p, i) => {
            if (p.getVar('socket').id === socket.id) {
                gameData.pendingPlayer.splice(i, 1);
            }
        })
        let games = gameData.FindGamesOfSocketId(socket.id);
        for (let game of games) {
            let isExist = false;
            var player = game.FindPlayerBySocket(socket.id);
            if (player == null) return;
            var sign = "";
            if (game.readyPlayers.length > 0) {
                sign = game.readyPlayers[0].getVar('socket').id == socket.id ? "O" : "X";
            }
            //for (let i = 0; i < game.players.length; i++) {
            game.players = game.players.filter((player, index) => player.getVar('socket').id != socket.id);
            game.readyPlayers = game.readyPlayers.filter((player, index) => player.getVar('socket').id != socket.id);
            for (let i = 0; i < game.players.length; i++) {
                game.players[i].getVar('socket').emit('caro-game', JSON.stringify({ type: "player-left", data: { player: player, players: game.players } }));
            }
            if (game.IsPlaying && game.readyPlayers.length < 2) {
                game.readyPlayers.forEach((p, i) => {
                    EndGameHandler(game, p, player, sign);
                })
            }

            if (game.players.length === 0 && !game.IsDefault) {
                gameData.RemoveGame(game);
                console.log("remove game");
            }

            //}
        }
        io.emit("user-online", JSON.stringify(Object.keys(online)));
        socket.broadcast.emit('caro-game', JSON.stringify({ type: "response-all-room", data: { games: gameData.AllPublicGames() } }));
    });

    socket.on("caro-game", (msg) => {

        let msgData = JSON.parse(msg);
        switch (msgData.type) {
            case 'request-all-room':
                RequestAllRoom(msgData);
                break;
            case 'request-new-room':
                NewRoomHandler(msgData);
                break;
            case 'go-to-room-by-id':
                GotoRoomByIdHandler(msgData);
                break;
            case 'join-room':
                JoinRoomHandler(msgData);
                break;
            case 'moving':
                MovingHandler(msgData);
                break;
            case 'ready':
                ReadyHandler(msgData);
                break;
            case 'send-message':
                ChatHandler(msgData);
                break;
            case 'left-room':
                LeftRoomHander(msgData);
                break;
            case "request-draw":
                RequestDrawHandler(msgData);
                break;
            case "accept-draw":
                AcceptDrawHandler(msgData);
                break;
            case "denied-draw":
                DeniedDrawHandler(msgData);
                break;
            case "move-timeout": 
                MoveTimeoutHandler(msgData);
                break;
            case "withdraw":
                WithdrawHandler(msgData);
                break;
        }
    })

    socket.on("caro-game-chat", (msg) => {
        let msgData = JSON.parse(msg);
        switch (msgData.type) {
            case 'send-message':
                ChatHandler(msgData);
                break;
        }
    })

    socket.on("invite-game", (msg) => {
        let msgData = JSON.parse(msg);
        switch (msgData.type) {
            case "invite-by-id":
                InviteHandler(msgData);
                break;
            case "accept":
                AcceptInviteHandler(msgData);
                break;
            case "denied":
                DeniedInviteHandler(msgData);
                break;
        }
    })

    socket.on("quick-game", (msg) => {
        let msgData = JSON.parse(msg);
        switch (msgData.type) {
            case "find-game":
                QGFindGameHandler(msgData);
                break;
            case "cancel":
                QGCancelHandler(msgData);
                break;
        }
    })

    function RequestAllRoom(msgData) {
        socket.emit('caro-game', JSON.stringify({ type: "response-all-room", data: { games: gameData.games } }));
    }

    function NewRoomHandler(msgData) {
        const player = msgData.data.player;
        const row = msgData.data.row;
        const col = msgData.data.col;
        const room_name = msgData.data.room_name;
        const public_room = msgData.data.public;
        const password = msgData.data.password;
        var game = new CaroGame(generateAnId(16), row, col, room_name, public_room, password);
        if (game) {
            gameData.AddGame(game);
            socket.broadcast.emit('caro-game', JSON.stringify({ type: "response-all-room", data: { games: gameData.AllPublicGames() } }));

            if (!game.isPublic) {
                game.approved.push(player.ID);
            }
            //game.CreatePlayer(player.Id, player.Username);
            socket.emit('caro-game', JSON.stringify({ type: "request-new-room-result", data: { isSuccess: true, game: game } }));
        } else {
            socket.emit('caro-game', JSON.stringify({ type: "request-new-room-result", data: { isSuccess: false, game: game } }));
        }
    }

    function GotoRoomByIdHandler(msgData) {
        const roomId = msgData.data.id;
        const password = msgData.data.password;
        const player = msgData.data.player;
        const game = gameData.FindGame(roomId);
        if (game) {
            console.log(game.password);
            if (!game.isPublic) {
                if (game.password !== password) {
                    socket.emit('caro-game', JSON.stringify({ type: "response-join-room-by-id", data: { isSuccess: false, id: roomId, errCode: 2 } }));
                    return;
                } else {
                    if (!game.approved.includes(player.ID)) {
                        game.approved.push(player.ID);
                    }
                    socket.emit('caro-game', JSON.stringify({ type: "response-join-room-by-id", data: { isSuccess: true, id: roomId, errCode: 0 } }));
                }
            }
            else {
                socket.emit('caro-game', JSON.stringify({ type: "response-join-room-by-id", data: { isSuccess: true, id: roomId, errCode: 0 } }));
            }
        } else {
            socket.emit('caro-game', JSON.stringify({ type: "response-join-room-by-id", data: { isSuccess: false, id: roomId, errCode: 1 } }));
        }
    }

    function JoinRoomHandler(msgData) {
        const game = gameData.FindGame(msgData.data.gameId);
        const player = msgData.data.player;
        const password = msgData.data.password;
        if (game) {
            if (!game.isPublic) {
                if (!game.approved.includes(player.ID)) {
                    socket.emit('caro-game', JSON.stringify({ type: "room-no-valid" }));
                    return;
                }
            }
            for (let i = 0; i < game.players.length; i++) {
                const client = game.players[i].getVar('socket');
                if (!client.connected) {
                    game.players.splice(i, 1);
                }
            }
            if (game.FindPlayer(player.ID)) {
                console.log("existed");
                socket.emit('caro-game', JSON.stringify({ type: "player-existed" }));
                return;
            }
            console.log("joined");
            const p = game.CreatePlayer(player.ID, player.Username);
            p.setVar('socket', socket);
            console.log(game.players);
            socket.emit('caro-game', JSON.stringify({ type: "you-joined", data: { game: game, players: game.players } }));

            for (let i = 0; i < game.players.length; i++) {
                const client = game.players[i].getVar('socket');
                if (client !== socket) {
                    client.emit("caro-game", JSON.stringify({ type: "player-joined", data: { player: player, players: game.players } }));
                }
            }
            if (game.IsPlaying) {
                socket.emit("caro-game", JSON.stringify({ type: "moved-guest", data: { board: game.square } }));
            }
        } else {
            console.log("no-valid")
            socket.emit('caro-game', JSON.stringify({ type: "room-no-valid" }));
        }
        socket.broadcast.emit('caro-game', JSON.stringify({ type: "response-all-room", data: { games: gameData.AllPublicGames() } }));

    }

    async function MovingHandler(msgData) {
        const game = gameData.FindGame(msgData.data.gameId);
        if (game) {
            const player = game.FindPlayer(msgData.data.player.ID);
            const move = msgData.data.move;
            const sign = msgData.data.sign;
            let opp = null;
            if (game.setMove(move, sign) != null) {
                console.log("moved");
                //for (let i = 0; i < game.readyPlayers.length; i++) {
                //    if (game.read)
                //}
                for (let i = 0; i < game.readyPlayers.length; i++) {
                    const client = game.readyPlayers[i].getVar('socket');
                    if (client !== socket) {
                        client.emit("caro-game", JSON.stringify({ type: "moved", data: { move: msgData.data.move, sign: sign, } }));
                    }
                }

                let temp = game.readyPlayers.map(item => item.id);
                let guests = game.players.filter(player => !temp.includes(player.id));
                for (let i = 0; i < guests.length; i++) {
                    const client = guests[i].getVar('socket');
                    if (client !== socket) {
                        client.emit("caro-game", JSON.stringify({ type: "moved-guest", data: { board: game.square } }));
                    }
                }

                let loser = null;
                if (game.CheckWin(move)[0] == true) {
                    //find loser
                    for (let i = 0; i < 2; i++) {
                        if (game.readyPlayers[i].id != player.id) {
                            loser = game.readyPlayers[i];
                        }
                    }
                    await EndGameHandler(game, player, loser, sign);
                }
            }
            //for (let i = 0; i < game.players.length; i++) {
            //    const client = game.players[i].getVar('socket');
            //    if (client !== socket) {
            //        client.emit("caro-game", JSON.stringify({ type: "moved", data: { board: msgData.data.board, move: msgData.data.move } }));
            //    }
            //}
        }
    }

    function ChatHandler(msgData) {
        console.log("send message");
        const game = gameData.FindGame(msgData.data.gameId);
        const message = msgData.data.message;
        const senderId = msgData.data.senderId;
        const senderUsername = msgData.data.senderUsername;
        if (game) {
            const messageInfo = {
                senderId: senderId,
                senderUsername: senderUsername,
                message: message,
            }
            game.AddMessage(messageInfo);
            console.log(game.players);
            for (let i = 0; i < game.players.length; i++) {
                const client = game.players[i].getVar('socket');
                if (client !== socket) {
                    client.emit("caro-game-chat", JSON.stringify({ type: "received-message", data: { message: message, player: game.players[i] } }));
                }
            }
        }
    }

    function ReadyHandler(msgData) {
        console.log("ready");
        const game = gameData.FindGame(msgData.data.gameId);
        if (game && game.readyPlayers.length < 2) {
            let player = game.FindPlayer(msgData.data.player.ID);
            if (player && game.readyPlayers.filter((value, index) => value.id == player.id).length === 0) {
                player.ready = true;
                game.AddReadyPlayer(player);
            }
            console.log(game.readyPlayers);
            for (let i = 0; i < game.players.length; i++) {
                const client = game.players[i].getVar('socket');
                client.emit("caro-game", JSON.stringify({ type: "player-ready", data: { players: game.players } }));
            }

            if (game.readyPlayers.length == 2) {
                console.log("game start");
                game.StartNewGame();
                for (let i = 0; i < game.players.length; i++) {
                    const client = game.players[i].getVar('socket');
                    client.emit("caro-game", JSON.stringify({ type: "game-start", data: { ball: game.readyPlayers[0] } }));
                }
                for (let i = 0; i < 2; i++) {
                    const client = game.readyPlayers[i].getVar('socket');
                    client.emit("caro-game", JSON.stringify({ type: "game-start-for-players", data: { ball: game.readyPlayers[0] } }));
                }
                socket.broadcast.emit('caro-game', JSON.stringify({ type: "response-all-room", data: { games: gameData.AllPublicGames() } }));
            }
        }
    }

    function MoveTimeoutHandler(msgData) {
        const gameId = msgData.data.gameId;
        const game = gameData.FindGame(gameId);
        if (game) {
            let winner = null, loser = null, sign = "";
            for (let i = 0; i < 2; i++) {
                if (game.readyPlayers[i].getVar('socket').id == socket.id) {
                    loser = game.readyPlayers[i];
                } else {
                    winner = game.readyPlayers[i];
                    sign = i == 0 ? "X" : "O";
                }
            }
            EndGameHandler(game, winner, loser, sign);
        }
    }

    async function EndGameHandler(game, winner, loser, sign, isDraw = false, fullboard = false) {
        const battle = {
            WinnerID: winner.id,
            LoserID: loser.id,
            GUID: uuidv4(),
            Row: game.row,
            Col: game.col,
            IsDraw: isDraw ? 1 : 0,
            SignOfWinner: sign
        }

        //var sign = game.readyPlayers[0].id === winner.id ? "X" : "O";
        game.players.forEach((p, i) => {
            p.ready = false;
        })
        console.log(game.winRow);
        for (let i = 0; i < game.players.length; i++) {
            const client = game.players[i].getVar('socket');
            client.emit("caro-game", JSON.stringify({ type: "game-end", data: { winner: winner, players: game.players, winRow: game.winRow.length == 5 ? game.winRow : [] } }));
        }


        const insertId = await battleM.insert(battle);
        console.log(insertId);
        const moving = {
            GameID: insertId,
            Moves: JSON.stringify(game.getMoves())
        }
        const conversation = {
            GameID: insertId,
            Messages: JSON.stringify(game.getMessages())
        }
        console.log(moving);
        await movingM.insert(moving);
        await chatM.insert(conversation);

        const winA = await mAccount.getByID(winner.id);
        const loseA = await mAccount.getByID(loser.id);
        const win = winA[0];
        const lose = loseA[0];
        let pointPlus = 5;
        let pointMinus = 3;
        if (!isDraw) {
            if (win.Score - lose.Score < -10) {
                pointPlus += Math.abs(Math.ceil((win.Score - lose.Score)/3));
                pointMinus += Math.abs(Math.ceil((win.Score - lose.Score) / 3));
            }

            pointMinus = Math.min(pointMinus, lose.Score)
        } else if (fullboard) {
            pointPlus = 1;
            pointMinus = -1;
        } else {
            pointPlus = 1;
            pointMinus = 1;
        }


        win.Score += pointPlus;
        win.WinBattle += 1;

        lose.Score -= pointMinus;
        lose.DefeatBattle += 1;

        await mAccount.update(win);
        await mAccount.update(lose);
        //var obj = Object.assign({}, item, entity);
        console.log("aa");
        console.log(win);
        console.log(lose);
        game.EndGame();
        for (let i = 0; i < game.players.length; i++) {
            const client = game.players[i].getVar('socket');
            client.emit("caro-game", JSON.stringify({ type: "saved-game", data: {} }));
        }

        if (!isDraw) {
            winner.getVar('socket').emit('caro-game', JSON.stringify({ type: "win-game", data: { message: `You win this game.\n +${pointPlus} points`, point: pointPlus } }));
            loser.getVar('socket').emit('caro-game', JSON.stringify({ type: "lose-game", data: { message: `Ooops, You lose this game.\n -${pointMinus} points`, point: pointMinus } }));
        } else {
            winner.getVar('socket').emit('caro-game', JSON.stringify({ type: "draw-game", data: { message: `Draw game.\n +${pointPlus} points`, point: pointPlus } }));
            loser.getVar('socket').emit('caro-game', JSON.stringify({ type: "draw-game", data: { message: `Draw game.\n ${pointMinus < 0 ? "+" : "-"}${Math.abs(pointMinus)} points`, point: pointMinus } }));
        }


        socket.broadcast.emit('caro-game', JSON.stringify({ type: "response-all-room", data: { games: gameData.AllPublicGames() } }));

    }

    function WithdrawHandler(msgData) {
        MoveTimeoutHandler(msgData);
    }

    function RequestDrawHandler(msgData) {
        const gameId = msgData.data.gameId;
        const player = msgData.data.player;
        const game = gameData.FindGame(gameId);
        if (game) {
            const opp = game.readyPlayers.filter((p, i) => p.id !== player.ID)[0];
            opp.getVar('socket').emit("caro-game", JSON.stringify({
                type: "draw-request",
                data: { player: player }
            }));
        }

    }

    async function AcceptDrawHandler(msgData) {
        const gameId = msgData.data.gameId;
        const player = msgData.data.player;
        const game = gameData.FindGame(gameId);
        if (game) {
            const opp = game.readyPlayers.filter((p, i) => p.id !== player.ID)[0];
            const p = game.readyPlayers.filter((p, i) => p.id == player.ID)[0];
            const sign = game.readyPlayers[0].id == player.ID ? "X" : "0";
            opp.getVar('socket').emit("caro-game", JSON.stringify({
                type: "draw-accepted",
                data: { player: player }
            }));

            await EndGameHandler(game, p, opp, sign, true);
        }
    }

    function DeniedDrawHandler(msgData) {
        const gameId = msgData.data.gameId;
        const player = msgData.data.player;
        const game = gameData.FindGame(gameId);
        if (game) {
            const opp = game.readyPlayers.filter((p, i) => p.id !== player.ID)[0];
            opp.getVar('socket').emit("caro-game", JSON.stringify({
                type: "draw-denied",
                data: { player: player }
            }));
        }
    }

    function InviteHandler(msgData) {
        const person = msgData.data.id;
        const sender = msgData.data.sender;

        if (online[person]) {
            console.log("exist to invite");
            online[person].forEach((sk, idx) => {
                io.to(sk).emit('invite-game', JSON.stringify({ type: "invite-to-game", data: { sender: sender, senderSK: socket.id } }));
            })
        }
    }

    function AcceptInviteHandler(msgData) {
        console.log("accepted");
        const sourceSK = msgData.data.sourceSK;
        const user = msgData.data.user;

        var game = new CaroGame(generateAnId(16), 20, 30, "Unnamed Room", true, "");
        if (game) {
            gameData.AddGame(game);
            io.to(sourceSK).emit("invite-game", JSON.stringify({ type: "invite-accepted", data: { roomId: game.id } }));
            socket.emit("invite-game", JSON.stringify({ type: "invite-accepted", data: { roomId: game.id } }));
        }

    }

    function DeniedInviteHandler(msgData) {
        const sourceSK = msgData.data.sourceSK;
        const user = msgData.data.user;
        io.to(sourceSK).emit("invite-game", JSON.stringify({ type: "invite-denied", data: { user: user, sk: socket.id } }));
    }

    function QGFindGameHandler(msgData) {
        const user = msgData.data.user;
        const op = gameData.MatchingPlayer(user.ID, user.Username, socket);
        if (op) {
            var game = new CaroGame(generateAnId(16), 20, 30, "Unnamed Room", true, "");
            if (game) {
                gameData.AddGame(game);
                op.getVar('socket').emit("invite-game", JSON.stringify({ type: "invite-accepted", data: { roomId: game.id } }));
                socket.emit("invite-game", JSON.stringify({ type: "invite-accepted", data: { roomId: game.id } }));
            }
        }

        console.log(gameData.pendingPlayer);
    }

    function QGCancelHandler(msgData) {
        gameData.RemovePendingPlayerBySocket(socket.id);
        console.log(gameData.pendingPlayer);
    }
});

server.listen(process.env.PORT || 3000, () => console.log('we up.'));

