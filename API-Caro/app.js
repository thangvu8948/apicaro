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
        console.log(online);
        io.emit("user-online", JSON.stringify(Object.keys(online)));
    }); 

    socket.on("caro-game", (msg) => {
        let msgData = JSON.parse(msg);
        switch (msgData.type) {
            case 'request-new-room':
                NewRoomHandler(msgData);
                break;
            case 'join-room':
                JoinRoomHandler(msgData);
                break;
        }
    })

    function NewRoomHandler(msgData) {
        const player = msgData.player;
        var game = new CaroGame(generateAnId(16), 'medium');
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
            console.log("joined");
            socket.emit('caro-game', JSON.stringify({ type: "you-joined" }));
            const p = game.CreatePlayer(player.Id, player.Username);
            p.setVar('socket', socket);

            for (let i = 0; i < game.players.length; i++) {
                const client = game.players[i].getVar('socket');
                if (client !== socket) {
                    client.emit("caro-game", JSON.stringify({ type: "player-joined", data: { player: player } }));
                }
            }
        } else {
            console.log("no-valid")
            socket.emit('caro-game', JSON.stringify({ type: "room-no-valid" }));
        }

    }
});

server.listen(process.env.PORT || 3000, () => console.log('we up.'));

