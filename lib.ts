export namespace Event {
    export const INPUT = 'input';
    export type Input = { 
        type: typeof INPUT;
        source: string;
        text: string;
        user: string;
    }
    export function input(
        source: string, 
        user: string,
        text: string, 
    ): Input {
        return { type: INPUT, source, user, text };
    }

    export const WRITE = 'write';
    export type Write = {
        type: typeof WRITE;
        source: string;
        text: string;
    }
    export function write(source: string, text: string): Write {
        return { type: WRITE, source, text };
    }

    export type Event = Input | Write;
}

export type Event = Event.Event;

export interface Plugin {
    _send(action: Event): void;
    _peek(): Promise<Event>;
    _next(): void;
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

export class PluginBase implements Plugin {
    _input = new AsyncQueue<Event>();
    _output = new AsyncQueue<Event>();
    _nextAction?: Promise<Event>;

    constructor() {
        this._start();
    }

    _send(action: Event) {
        this._input.push(action);
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

    _emit(event: Event) {
        this._output.push(event);
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

    handle(_action: Event): (
        void 
        | Event 
        | Event[] 
        | Promise<void | Event | Event[]>
    ) {
        throw new Error('not implemented');
    }

    write(text: string) {
        this._emit(Event.write(this.constructor.name, text));
    }

    input(source: string, user: string, text: string) {
        this._emit(Event.input(source, user, text));
    }
}

export class Bot implements Plugin {
    plugins: Plugin[];
    _nextAction?: Event;

    constructor(...mods: Plugin[]) {
        this.plugins = mods;
    }

    _send(event: Event.Event): void {
        this.plugins.map(p => p._send(event));
    }

    async _peek(): Promise<Event.Event> {
        if (!this._nextAction) {
            // get next action
            const ps = this.plugins.map(async (mod, index) => ({ 
                mod, 
                index, 
                action: await mod._peek(),
            }));
            const { mod, index, action } = await Promise.race(ps);
            
            // resolve action
            this._nextAction = action;
            mod._next();

            // move mod to end of turn order
            this.plugins = [ 
                ...this.plugins.slice(0, index), 
                ...this.plugins.slice(index + 1),
                mod,
            ];
        }
        return this._nextAction;
    }

    _next(): void {
        this._nextAction = undefined;
    }

    handle(event: Event) {
        this.plugins.map(p => p._send(event));
    }

    async start() {
        while(true) {
            const event = await this._peek();
            this.handle(event);
            this._next();
        }
    }
}
