export type ActionTextIn = { 
    type: 'text_in';
    source: string;
    text: string; 
    user: string;
};
export type ActionTextOut = { type: 'text_out', text: string };
export type Action = ActionTextIn | ActionTextOut;

export class Bot {
    mods: Mod[] = [];

    addMod(mod: Mod) {
        this.mods.push(mod);
    }
    
    async tick() {
        // get next action
        const ps = this.mods.map(async (mod, index) => ({ 
            mod, 
            index, 
            action: await mod.bot.peek(),
        }));
        const { mod, index, action } = await Promise.race(ps);

        // resolve action
        this.mods.map(m => m.bot.send(action));
        mod.bot.next();

        // move mod to end of turn order
        this.mods = [ 
            ...this.mods.slice(0, index), 
            ...this.mods.slice(index + 1),
            mod,
        ]
    }

    async start() {
        while(true) {
            await this.tick();
        }
    }
}

export interface Mod {
    bot: {
        send(action: Action): void;
        peek(): Promise<Action>;
        next(): void;
    }
}

export class ModBase implements Mod {
    private _input = new AsyncQueue<Action>();
    private _output = new AsyncQueue<Action>();
    private _nextAction?: Promise<Action>;
    bot = {
        next: this._next.bind(this),
        peek: this._peek.bind(this),
        send: this._send.bind(this),
        write: this._write.bind(this),
        write_in: this._write_in.bind(this),
    }

    constructor() {
        this._start();
    }

    private _send(action: Action) {
        this._input.push(action);
    }

    private _write_in(text: string, user: string) {
        this._output.push({ 
            type: 'text_in', 
            source: this.constructor.name,
            text, 
            user, 
        });
    }

    private _write(text: string) {
        this._output.push({ type: 'text_out', text });
    }

    private _peek() {
        if (this._nextAction) {
            return this._nextAction;
        }
        this._nextAction = this._output.shift();
        return this._nextAction;
    }

    private _next() {
        this._nextAction = undefined;
    }

    private async _start() {
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

export class AsyncQueue<T> {
    queue: T[] = [];
    resolve?: (item: T) => void;

    push(...items: T[]) {
        if (!items.length) {
            return;
        }
        if (this.resolve) {
            this.resolve(items.shift()!);
            this.resolve = undefined;
        }
        this.queue.push(...items);
    }

    async shift() {
        if (this.queue.length) {
            return this.queue.shift()!;
        }
        return new Promise<T>(r => this.resolve = r);
    }
}
