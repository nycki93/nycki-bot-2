import { AsyncQueue } from "./util";
import Readline from "readline/promises";

type ActionTextIn = { type: 'text_in', text: string };
function textIn(text: string): ActionTextIn {
    return { type: 'text_in', text };
}

type ActionTextOut = { type: 'text_out', text: string };
function textOut(text: string): ActionTextOut {
    return { type: 'text_out', text };
}

export type Action = ActionTextIn | ActionTextOut;

interface Mod {
    send(action: Action): void;
    peek(): Promise<Action>;
    next(): void;
}

class ModBase implements Mod {
    _input = new AsyncQueue<Action>();
    _output = new AsyncQueue<Action>();
    _next?: Promise<Action>;

    constructor() {
        this._start();
    }

    send(action: Action) {
        this._input.push(action);
    }

    emit(...actions: Action[]) {
        this._output.push(...actions);
    }

    peek() {
        if (this._next) {
            return this._next;
        }
        this._next = this._output.shift();
        return this._next;
    }

    next() {
        this._next = undefined;
    }

    async _start() {
        while (true) {
            const action = await this._input.shift();
            const reaction = await this.handle(action);
            if (!reaction) {
                continue;
            } else if (Array.isArray(reaction)) {
                this._output.push(...reaction);
            } else {
                this._output.push(reaction);
            }
        }
    }

    handle(_action: Action): (
        void 
        | Action 
        | Action[] 
        | Promise<void | Action | Action[]>
    ) {
        throw new Error('not implemented');
    }
}

class ModConsole extends ModBase {
    isFirstTick: boolean;
    rl: Readline.Interface;

    constructor() {
        super();
        this.isFirstTick = true;
        this.rl = Readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.rl.on('line', (line) => {
            this.emit(textIn(line));
        });
        this.emit(textOut('Console mod loaded!'));
    }

    handle(a: Action) {
        if (a.type === 'text_in' && a.text.trim() === 'ping') {
            return textOut('pong!');
        }
        if (a.type === 'text_out') {
            console.log(a.text);
            return;
        }
    }
}

class Bot {
    mods: Mod[] = [];
    
    async tick() {
        // get next action
        const ps = this.mods.map(async (m, i) => ({ m, i, a: await m.peek() }));
        const { m, i, a } = await Promise.race(ps);
        console.log(a);

        // resolve action
        this.mods.map(m => m.send(a));
        m.next();

        // move mod to end of turn order
        this.mods = [ 
            ...this.mods.slice(0, i), 
            ...this.mods.slice(i + 1),
            m,
        ]
    }

    async start() {
        const m = new ModConsole();
        this.mods.push(m);
        while(this.mods.length) {
            await this.tick();
        }
    }
}

function main() {
    const bot = new Bot();
    bot.start();
}

main();
