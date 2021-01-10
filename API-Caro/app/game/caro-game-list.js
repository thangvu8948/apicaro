var CaroGame = require('./caro-game.js');
const CaroPlayer = require('./caro-player.js');

function CaroGameList(defaultRoomNo, maximumRoomNo, genIdFunc) {
    this.games = [];
    this.pendingPlayer = [];
    this.defaultRoom = defaultRoomNo;
    this.maximumRoom = maximumRoomNo;
    if (typeof (genIdFunc) === undefined) {
        this.generateIdFunc = function (hashValue) {
            return new Date().getTime();
        }
    } else {
        this.generateIdFunc = genIdFunc;
    }

    for (let i = 0; i < this.defaultRoom; i++) {
        var game = new CaroGame(this.generateIdFunc(16), 20, 30, "Default " + (i+1), true, "", true);
        this.AddGame(game);
    }

}

CaroGameList.prototype.AddPendingPlayer = function (player) {
    this.pendingPlayer.push(player);
}

CaroGameList.prototype.GetAndRemoveOnePendingPlayer = function (player) {
    let p = null;
    for (let i = 0; i < this.pendingPlayer.length; i++) {
        if (this.pendingPlayer[i].id !== player.id && this.pendingPlayer[i].getVar('socket').id !== player.getVar('socket').id) {
            p = this.pendingPlayer[i];
            this.pendingPlayer.splice(i, 1);
            return p;
        }
    }
    return null;
}

CaroGameList.prototype.MatchingPlayer = function (id, name, socket) {
    var player = new CaroPlayer(id, name);
    player.setVar('socket', socket);
    var matchPlayer = this.GetAndRemoveOnePendingPlayer(player);
    if (matchPlayer === null) {
        this.AddPendingPlayer(player);
    } else {
    }
    return matchPlayer;
}

CaroGameList.prototype.RemovePendingPlayerBySocket = function (socketid) {
    for (let i = 0; i < this.pendingPlayer.length; i++) {
        if (this.pendingPlayer[i].getVar('socket').id === socketid) {
            this.pendingPlayer.splice(i, 1);
        }
    }
}

CaroGameList.prototype.FindGame = function (gameId) {
    for (var i = 0; i < this.games.length; i++) {
        if (this.games[i].id === gameId)
            return this.games[i];
    }
    return null;
};

CaroGameList.prototype.RemoveGame = function (game) {
    for (var i = 0; i < this.games.length; i++)
        if (this.games[i].id == game.id) {
            this.games.splice(i, 1);
            break;
        }
};

CaroGameList.prototype.AddGame = function (game) {
    if (this.maximumRoom > this.games.length) {
        var found, room;
        for (room = 1; room < this.games.length + 2; room++) {
            found = false;
            for (let j = 0; j < this.games.length; j++) {
                if (this.games[j].room == room) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                break;
            }
        }
        game.room = room;
        this.games.push(game);
        return game;
    }
    return null;
};

CaroGameList.prototype.FindGamesOfSocketId = function (socketid) {
    let res = [];
    for (let i = 0; i < this.games.length; i++) {
        for (let j = 0; j < this.games[i].players.length; j++) {
            if (this.games[i].players[j].getVar('socket').id == socketid) {
                res.push(this.games[i]);
                break;
            }

        }
    }
    return res;
}

CaroGameList.prototype.AllPublicGames = function () {
    return this.games.filter((game, index) => game.isPublic == true);
}
module.exports = CaroGameList;