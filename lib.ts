export type ActionTextIn = { type: 'text_in', text: string };
export function textIn(text: string): ActionTextIn {
    return { type: 'text_in', text };
}

export type ActionTextOut = { type: 'text_out', text: string };
export function textOut(text: string): ActionTextOut {
    return { type: 'text_out', text };
}

export type Action = ActionTextIn | ActionTextOut;

export class Bot {
    mods: Mod[] = [];

    addMod(mod: Mod) {
        this.mods.push(mod);
    }
    
    async tick() {
        // get next action
        const ps = this.mods.map(async (m, i) => ({ m, i, a: await m.peek() }));
        const { m, i, a } = await Promise.race(ps);

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
        while(true) {
            await this.tick();
        }
    }
}

export interface Mod {
    send(action: Action): void;
    peek(): Promise<Action>;
    next(): void;
}

export class ModBase implements Mod {
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

    isEmpty() {
        return !this.queue.length;
    }
}
