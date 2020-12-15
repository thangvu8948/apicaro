function CaroPlayer(id, name) {
    this.id;
    this.name;
    this.char = null;
    this.ready = false;

    var _game = null;
    var _socket = null;

    this.getVar = function (key) {
        switch (key) {
            case 'game': return _game;
            case 'socket': return _socket;
        }
    }

    this.setVar = function (key, value) {
        switch (key) {
            case 'game':
                _game = value;
                break;
            case 'socket':
                _socket = value;
                break;
        }
    }

    CaroPlayer.prototype.MarkReady = function (value) {
        if (value) {
            var game = this.getVar('game');
            if (typeof (game) !== undefined && game != null && !game.CanStart()) {
                this.ready = true;
                return true;
            }
        } else {
            if (this.ready) {
                this.ready = false;
                return true;
            }
        }
        return false;
    }
}

module.exports = CaroPlayer;