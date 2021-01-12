const CaroPlayer = require('./caro-player.js');

function CaroGame(id, rows = 20, cols = 30, room_name, public, password, isDefault = false) {
    function getBoardSize(key) {
        switch (key) {
            case 'small':
                this.col = 15;
                this.row = 15;
                return { 'row': 15, 'column': 15 };
            case 'medium':
                return { 'row': 20, 'column': 30 };
            case 'large':
                return { 'row': 40, 'column': 40 };
        }
        return { 'row': 15, 'column': 15 };
    }

    this.name = room_name;
    this.id = id;
    this.room = -1;
    this.col = cols;
    this.row = rows;
    this.isPublic = public;
    this.password = password;
    this.square = new Array(rows * cols).fill(null);
    this.players = [];
    this.approved = [];
    this.readyPlayers = [];
    this.guests = [];
    this.board = [];
    this.messages = [];
    this.IsPlaying = false;
    this.IsDefault = isDefault;
    var _movingPlayerId = null;
    this.resetCurrentMovePlayerId = function () {
        _movingPlayerId = null;
    }
    this.getCurrentMovingPlayerIndex = function () {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].id === _movingPlayerId) {
                return i;
            }
        }
        return -1;
    }


    this.getNextMovePlayerIndex = function () {
        var _muPlayerIdx = this.getCurrentMovePlayerIndex();
        for (var i = _muPlayerIdx + 1, k = 0; k < this.players.length; i++, k++) {
            var tempIdx = i % this.players.length;
            if (tempIdx != _muPlayerIdx && this.players[tempIdx].ready) {
                _muPlayerIdx = tempIdx;
                _muPlayerId = this.players[tempIdx].id;
                break;
            }
        }
        return _muPlayerIdx;
    }

    var moves = [];
    this.hasMove = function (move) {
        //for (var i = 0; i < moves.length; i++) {
        //    if (moves[i].row == move.row && moves[i].column == move.column)
        //        return true;
        //}
        return (this.square[move])
        //return false;
    };
    this.setMove = function (move, sign) {
        if (!this.hasMove(move)) {
            this.square[move] = sign;
            moves.push(move);
            return move;
        }
        return null;
    };
    this.getMoves = function () {
        return moves;
    };
    this.getMessages = function () {
        return this.messages;
    }
    this.emptyMoves = function () {
        moves = [];
    };

    this.created = new Date().getTime();
    this.winRow = [];
    function listToMatrix(list, elementsPerSubArray) {
        var matrix = [],
            i,
            k;

        for (i = 0, k = -1; i < list.length; i++) {
            if (i % elementsPerSubArray === 0) {
                k++;
                matrix[k] = [];
            }

            matrix[k].push(list[i]);
        }

        return matrix;
    }
    this.checkWin = function (square, just) {
        const col = this.col;
        const _square = listToMatrix(square, col);
        let cell = { x: Math.floor(just / col), y: just % col };
        if (
            this.isHorizontalCheck(_square, cell.x, cell.y) ||
            this.isVerticalCheck(_square, cell.x, cell.y) ||
            this.isPrimaryDiagCheck(_square, cell.x, cell.y) ||
            this.isSubDiagCheck(_square, cell.x, cell.y)
        ) {
            return [true, square[just]];
        }
        return [false, square[just]];
    };
    this.isHorizontalCheck = function (square, i, j) {
        this.winRow = [];
        this.winRow.push(i*this.col + j);
        let col = this.col;
        //int di = 0;
        let dj = -1; // Di qua trai
        //int startI = i;
        let startJ = j;
        //left
        let countLeft = 1;
        while (startJ + dj >= 0) {
            startJ += dj; // Di qua trai
            if (square[i][j] == square[i][startJ]) {
                this.winRow.push(i * this.col + startJ);
                // Tang bien dem
                countLeft++;
            } else {
                break;
            }
        }
        //right
        startJ = j;
        dj = 1;
        let countRight = 0;
        while (startJ + dj < col) {
            startJ += dj; // Di qua phai
            if (square[i][j] == square[i][startJ]) {
                this.winRow.push(i * this.col + startJ);
                // Tang bien dem
                countRight++;
            } else {
                break;
            }
        }
        return countLeft + countRight >= 5;
    }

    this.isVerticalCheck = function (square, i, j) {
        this.winRow = [];
        this.winRow.push(i * this.col + j);
        let row = this.row;
        let di = -1;
        let startI = i;
        //top
        let countTop = 1;
        while (startI + di >= 0) {
            startI += di; // Di len
            if (square[i][j] == square[startI][j]) {
                this.winRow.push(startI * this.col + j);
                // Tang bien dem
                countTop++;
            } else {
                break;
            }
        }
        //right
        startI = i;
        di = 1;
        let countDown = 0;
        while (startI + di < row) {
            startI += di; // Di xuong
            if (square[i][j] == square[startI][j]) {
                this.winRow.push(startI * this.col + j);
                // Tang bien dem
                countDown++;
            } else {
                break;
            }
        }

        return countTop + countDown >= 5;
    }

    this.isPrimaryDiagCheck = function (square, i, j) {
        this.winRow = [];
        this.winRow.push(i * this.col + j);
        let col = this.col;
        let row = this.row;
        let di = -1;
        let dj = -1;
        let startI = i;
        let startJ = j;
        // .....
        let countTop = 1;
        while (startI + di >= 0 && startJ + dj >= 0) {
            startI += di; // Di len
            startJ += dj; // ?i qua trái
            if (square[startI][startJ] == square[i][j]) {
                this.winRow.push(startI * this.col + startJ);
                // Tang bien dem
                countTop++;
            } else {
                break;
            }
        }
        //.....
        startI = i;
        di = 1;
        startJ = j;
        dj = 1;
        let countDown = 0;
        while (startI + di < row && startJ + dj < col) {
            startI += di; // Di xuong
            startJ += dj; // ?i qua ph?i
            if (square[startI][startJ] == square[i][j]) {
                this.winRow.push(startI * this.col + startI);
                // Tang bien dem
                countDown++;
            } else {
                break;
            }
        }

        return countTop + countDown >= 5;
    }

    this.isSubDiagCheck = function (square, i, j) {
        this.winRow = [];
        this.winRow.push(i * this.col + j);
        let col = this.col;
        let row = this.row;
        let di = -1;
        let dj = 1;
        let startI = i;
        let startJ = j;
        // .....
        let countTop = 1;
        while (startI + di >= 0 && startJ + dj < col) {
            startI += di;
            startJ += dj;
            if (square[startI][startJ] == square[i][j]) {
                this.winRow.push(startI * this.col + startI);
                // Tang bien dem
                countTop++;
            } else {
                break;
            }
        }
        //.....
        startI = i;
        di = 1;
        startJ = j;
        dj = -1;
        let countDown = 0;
        while (startI + di < row && startJ + dj >= 0) {
            startI += di;
            startJ += dj;
            if (square[startI][startJ] == square[i][j]) {
                this.winRow.push(startI * this.col + startI);
                // Tang bien dem
                countDown++;
            } else {
                break;
            }
        }

        return countTop + countDown >= 5;
    }

}


CaroGame.prototype.FindPlayer = function (playerId) {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].id === playerId)
            return this.players[i];
    }
    return null;
};

CaroGame.prototype.FindPlayerBySocket = function (socketId) {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].getVar('socket').id === socketId)
            return this.players[i];
    }
    return null;
}

CaroGame.prototype.AddReadyPlayer = function (player) {
    this.readyPlayers.push(player);
}

CaroGame.prototype.StartNewGame = function () {
    this.IsPlaying = true;
    this.square = new Array(this.row * this.col).fill(null);
    //let temp = this.readyPlayers.map(item => item.id);
    //this.guests = this.players.filter(player => !temp.includes(player.id));
}

CaroGame.prototype.CreatePlayer = function (playerId, playerName) {
    var player = new CaroPlayer(playerId, playerName);
    player.setVar('game', this);
    this.players.push(player);
    return player;
};

CaroGame.prototype.RemovePlayer = function (player) {
    var index = this.players.indexOf(player);
    if (index >= 0) {
        player.setVar('game', null);
        this.players.splice(index, 1);
    }
};

CaroGame.prototype.GetReadyPlayers = function () {
    var result = [];
    for (var i = 0; i < this.players.length; i++)
        if (this.players[i].ready)
            result.push(this.players[i]);
    return result;
};

CaroGame.prototype.CanStart = function () {
    var count = 0;
    for (var i = 0; i < this.players.length; i++)
        if (this.players[i].ready)
            count++;
    return (count >= 2);
};

CaroGame.prototype.CheckWin = function (move) {
    return this.checkWin(this.square, move);
}

CaroGame.prototype.EndGame = function () {
    this.readyPlayers = [];
    this.IsPlaying = false;
    this.square = this.square.fill(null);
    this.emptyMoves();
    this.messages = []; 
    //this.resetCurrentMovePlayerId();
    for (var i = 0; i < this.players.length; i++) {
        //this.players[i].char = null;
        this.players[i].ready = false;
    }
};

CaroGame.prototype.AddMessage = function (message) {
    this.messages.push(message);
    console.log(this.messages);
};

CaroGame.prototype.CheckFullBoard = function () {
    return this.square.filter((v, i) => v).length === 0;
}
module.exports = CaroGame;