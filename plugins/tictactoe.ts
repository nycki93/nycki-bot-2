import { Event, BasePlugin } from "../lib";

enum Phase { Idle, Joining, Playing }

export class TictactoePlugin extends BasePlugin {
    phase: Phase = Phase.Idle;
    board = [] as string[];
    player_o?: string;
    player_x?: string;
    turn = '';

    handleCommand(event: Event.Input, args: string[]): void {
        if (args[0] === 'start') this.handleStart();
        if (args[0] === 'join') this.handleJoin(event, args);
        if (args[0] === 'play') this.handlePlay(event, args);
    }

    handleStart() {
        if (this.phase === Phase.Joining) {
            this.write('A game is already starting!');
            return;
        }
        if (this.phase === Phase.Playing) {
            this.write('A game is already in progress!');
            return;
        }
        this.write('Starting tictactoe. Join as x or o. (!join <x|o>)')
        this.board = Array(9).fill(null).map((_v, i) => (i+1).toString());
        this.player_o = undefined;
        this.player_x = undefined;
        this.phase = Phase.Joining;
    }

    handleJoin(event: Event.Input, args: string[]) {
        if (this.phase === Phase.Idle) {
            this.write('There is no game to join. Start one? (!start)');
            return;
        }
        if (this.phase === Phase.Playing) {
            this.write('A game is already in progress!');
            return;
        }

        if (args.length !== 2) {
            this.write('Usage: join <x|o>');
            return;
        }

        const choice = args[1];
        if (!['x', 'o'].includes(choice)) {
            this.write('Usage: join <x|o>');
            return;
        }

        if (
            choice === 'x' && this.player_x
            || choice === 'o' && this.player_o
        ) {
            this.write('That seat is already occupied.');
            return;
        }

        if (choice === 'x') {
            this.player_x = event.user;
            this.write(`${event.user} joined as player x.`);
        } else {
            this.player_o = event.user;
            this.write(`${event.user} joined as player o.`);
        }

        if (this.player_x && this.player_o) {
            this.turn = 'x';
            this.write('Game started!');
            this.write(this.drawBoard());
            this.phase = Phase.Playing;
        }
    }

    handlePlay(event: Event.Input, args: string[]) {
        if (this.phase === Phase.Idle) {
            this.write('There is no game to join. Start one? (!start)');
            return;
        }
        if (this.phase === Phase.Joining) {
            this.write('Not enough players to begin. (!join <x|o>)');
            return;
        }
        const { user } = event;
        if (user !== this.player_x && user !== this.player_o) {
            this.write(`${user} is not in this game!`);
            return;
        }

        let piece;
        if(this.turn === 'x' && user === this.player_x) {
            piece = 'x';
        } else if (this.turn === 'o' && user === this.player_o) {
            piece = 'o';
        } else {
            this.write(`${user}, it is not your turn!`);
            return;
        }

        const target = Number(args.length > 1 && args[1]) - 1;
        if (args.length !== 2 || !(target in this.board)) {
            this.write('Usage: play <1-9>');
            return;
        }

        if (['x', 'o'].includes(this.board[target])) {
            this.write('That spot is already claimed!');
            return;
        }

        this.board[target] = piece;
        this.turn = piece === 'x' ? 'o' : 'x';
        this.write(this.drawBoard());

        const winner = this.getWinner();
        if (winner) {
            this.write(`${winner} is the winner!`);
            this.phase = Phase.Idle;
            return;
        }

        if (this.isFull()) {
            this.write('The game is a draw!');
            this.phase = Phase.Idle;
            return;
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
    drawBoard() {
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
        return this.board.every(cell => ['x', 'o'].includes(cell));
    }
}
