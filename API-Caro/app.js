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
const { v4: uuidv4 } = require('uuid');

const middlewareAuth = require('./app/middlewares/Authentication');
const { createServer } = require('tls');
const CaroGameList = require('./app/game/caro-game-list');
const CaroGame = require('./app/game/caro-game');
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

var gameData = new CaroGameList(10, 20, generateAnId)

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
    socket.on('disconnect', data => {
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
        let games = gameData.FindGamesOfSocketId(socket.id);
        games.forEach((game, index) => {
            let isExist = false;
            var player = game.FindPlayerBySocket(socket.id);
            if (player == null) return;
            //for (let i = 0; i < game.players.length; i++) {
            game.players = game.players.filter((player, index) => player.getVar('socket').id != socket.id);
            game.readyPlayers = game.readyPlayers.filter((player, index) => player.getVar('socket').id != socket.id);
            for (let i = 0; i < game.players.length; i++) {
                game.players[i].getVar('socket').emit('caro-game', JSON.stringify({ type: "player-left", data: { player: player, players: game.players } }));
            }
            if (game.IsPlaying && game.readyPlayers.length < 2) {
                game.readyPlayers.forEach((p, i) => {
                    EndGameHandler(game, p, player);
                })
            }
            //}
        });
        io.emit("user-online", JSON.stringify(Object.keys(online)));
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

    function RequestAllRoom(msgData) {
        socket.emit('caro-game', JSON.stringify({ type: "response-all-room", data: { games: gameData.games } }));
    }

    function NewRoomHandler(msgData) {
        const player = msgData.data.player;
        const row = msgData.data.row;
        const col = msgData.data.col;
        const room_name = msgData.data.room_name;
        var game = new CaroGame(generateAnId(16), row, col, room_name);
        if (game) {
            gameData.AddGame(game);
            //game.CreatePlayer(player.Id, player.Username);
            socket.emit('caro-game', JSON.stringify({ type: "request-new-room-result", data: { isSuccess: true, game: game } }));
        } else {
            socket.emit('caro-game', JSON.stringify({ type: "request-new-room-result", data: { isSuccess: false, game: game } }));
        }
    }

    function JoinRoomHandler(msgData) {
        const game = gameData.FindGame(msgData.data.gameId);
        const player = msgData.data.player;
        if (game) {
            for (let i = 0; i < game.players.length; i++) {
                const client = game.players[i].getVar('socket');
                if (!client.connected) {
                    game.players.splice(i, 1);
                }
            }
            if (game.FindPlayer(player.ID)) {
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
    }

    function MovingHandler(msgData) {
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
                    EndGameHandler(game, player, loser);
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
            }
        }
    }

    function LeftRoomHandler(msg) {

    }

    function LeftRoomBySocket(socketid) {

    }

    async function EndGameHandler(game, winner, loser) {
        const battle = {
            WinnerID: winner.id,
            LoserID: loser.id,
            GUID: uuidv4(),
            Row: game.row,
            Col: game.col,
            //SignOfWinner: 
        }

        //var sign = game.readyPlayers[0].id === winner.id ? "X" : "O";
        for (let i = 0; i < game.players.length; i++) {
            const client = game.players[i].getVar('socket');
            client.emit("caro-game", JSON.stringify({ type: "game-end", data: { winner: winner } }));
        }
        console.log(game.getMoves());
        winner.getVar('socket').emit('caro-game', JSON.stringify({ type: "win-game" }));
        loser.getVar('socket').emit('caro-game', JSON.stringify({ type: "lose-game" }));

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
        game.EndGame();

    }
});

server.listen(process.env.PORT || 3000, () => console.log('we up.'));

