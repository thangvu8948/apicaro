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
var online = []
global.io = socketio(server);

io.on('connection', function (socket) {
    console.log("someone connected");

    console.log(online);
    //io.emit('FromAPI', JSON.stringify(online));
    socket.on("so_connect", data => {
        var b = online.filter((value, index) => {
            if (value[0] === data) {
                value[1].push(socket.id);
                return true;
            }
            return false;
        })

        if (b.length === 0) {
            online.push([data, [socket.id]])
        }
        socket.emit("FromAPI", JSON.stringify(online.map((value, index) => value[0])))

    })
    socket.on('disconnect', data => {
        console.log(socket.id + " disconnected + 123");
        var b = online.filter((value, index) => {
            var idx = value[1].indexOf(socket.id);
            if (idx >= 0) {
                value[1].splice(socket.id);
                if (value[1].length === 0) {
                    online.splice(index, 1);
                }
                return true;
            }
            return false;
        })
        socket.emit('FromAPI', JSON.stringify(online));

      
    });
});

server.listen(process.env.PORT || 3000, () => console.log('we up.'));

