export namespace Action {
    export const INPUT = 'input';
    export type Input = { 
        type: typeof INPUT;
        source: string;
        text: string;
        user: string;
    }

    export const WRITE = 'write';
    export type Write = {
        type: typeof WRITE;
        text: string;
    }

    export type Action = Input | Write;
}

export type Action = Action.Action;

export class Bot {
    mods: Mod[];

    constructor(...mods: Mod[]) {
        this.mods = mods;
    }

    addMod(mod: Mod) {
        this.mods.push(mod);
        return this;
    }
    
    async start() {
        while(true) {
            await this.tick();
        }
    }
    
    async tick() {
        // get next action
        const ps = this.mods.map(async (mod, index) => ({ 
            mod, 
            index, 
            action: await mod._peek(),
        }));
        const { mod, index, action } = await Promise.race(ps);

        // resolve action
        this.mods.map(m => m._send(action));
        mod._next();

        // move mod to end of turn order
        this.mods = [ 
            ...this.mods.slice(0, index), 
            ...this.mods.slice(index + 1),
            mod,
        ]
    }
}

export interface Mod {
    _send(action: Action): void;
    _peek(): Promise<Action>;
    _next(): void;
}

export class ModBase implements Mod {
    private _input = new AsyncQueue<Action>();
    private _output = new AsyncQueue<Action>();
    private _nextAction?: Promise<Action>;

    constructor() {
        this.start_base();
    }

    _send(action: Action) {
        this._input.push(action);
    }

    write_in(text: string, user: string) {
        this._output.push({ 
            type: Action.INPUT, 
            source: this.constructor.name,
            text, 
            user, 
        });
    }

    write(text: string) {
        this._output.push({ type: Action.WRITE, text });
    }

    _peek() {
        if (this._nextAction) {
            return this._nextAction;
        }
        this._nextAction = this._output.shift();
        return this._nextAction;
    }

    _next() {
        this._nextAction = undefined;
    }

    async start_base() {
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
