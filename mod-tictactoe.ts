import { Event, PluginBase } from "./lib";

export class ModTictactoe extends PluginBase {
    player_x?: string;
    player_o?: string;
    board = Array(9).fill(null).map((_v, i) => (i+1).toString());
    turn?: string;
    done = false;

    handle(action: Event) {
        if (action.type !== Action.INPUT) return;
        const args = action.text.trim().split(/\s+/);
        if (args[0] === 'join') return this.join(action, args);
        if (args[0] === 'play') return this.play(action, args);
    }

    join(action: Action.Input, args: string[]) {
        if (this.player_x && this.player_o) {
            return this.write('cannot join, game in progress');
        }
        if (args.length !== 2 || !['x', 'o'].includes(args[1])) {
            return this.write('usage: join <x|o>');
        }
        if (
            (args[1] === 'x' && this.player_x)
            || (args[1] === 'o' && this.player_o)
        ) {
            return this.write('that seat is already occupied!');
        }

        // successfully seat new player
        if (args[1] === 'x') {
            this.player_x = action.user;
            this.write(`${action.user} joined as player x.`);
        } else {
            this.player_o = action.user;
            this.write(`${action.user} joined as player o.`);
        }

        if (this.player_x && this.player_o) {
            this.turn = 'x';
            this.write('game started!');
            this.write(this.draw());
        }
    }

    play(action: Action.Input, args: string[]) {
        if (this.done) {
            return this.write('the game has ended');
        }
        
        if (!this.player_x || !this.player_o) {
            return this.write('not enough players to begin.');
        }

        if (action.user !== this.player_x && action.user !== this.player_o) {
            return this.write('you are not in this game!');
        }

        let team;
        if(this.turn === 'x' && action.user === this.player_x) {
            team = 'x';
        } else if (this.turn === 'o' && action.user === this.player_o) {
            team = 'o';
        } else {
            return this.write('it is not your turn!');
        }

        const target = Number(args.length > 1 && args[1]) - 1;
        if (args.length !== 2 || !(target in this.board)) {
            return this.write('usage: play <1-9>');
        }

        if (['x', 'o'].includes(this.board[target])) {
            return this.write('that spot is already claimed!');
        }

        this.board[target] = team;
        this.turn = team === 'x' ? 'o' : 'x';
        this.write(this.draw());

        const winner = this.getWinner();
        if (winner) {
            this.done = true;
            this.write(`${winner} is the winner!`);
            return;
        }

        if (this.isFull()) {
            this.done = true;
            this.write('the game is a draw.');
        }

        // otherwise, continue the game as normal
    }

    template = ('```\n' +
        ' 1 | 2 | 3 \n' +
        '---|---|---\n' +
        ' 4 | 5 | 6 \n' +
        '---|---|---\n' +
        ' 7 | 8 | 9 \n```'
    );
    draw() {
        let r = this.template;
        this.board.forEach((v, i) => {
            r = r.replace((i+1).toString(), v);
        });
        return r;
    }

    lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];
    getWinner() {
        const line = this.lines.find(([a, b, c]) => (
            this.board[a]
            && this.board[a] === this.board[b] 
            && this.board[a] === this.board[c]
        ));
        if (line) {
            return this.board[line[0]];
        } else {
            return null;
        }
    }

    isFull() {
        return this.board.filter(a => ['x', 'o'].includes(a)).length === 9;
    }
}
