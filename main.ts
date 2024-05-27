type ActionTextIn = { type: 'text_in', text: string };
function textIn(text: string): ActionTextIn {
    return { type: 'text_in', text };
}

type ActionTextOut = { type: 'text_out', text: string };
function textOut(text: string): ActionTextOut {
    return { type: 'text_out', text };
}

export type Action = ActionTextIn | ActionTextOut;

type Actions = void | Action | Action[] | Promise<void | Action | Action[]>;

interface Mod {
    send: (action: Action) => void;
    next: () => Promise<void | Action>;
}

class ModBase implements Mod {
    incoming = [] as Action[];
    outgoing = [] as Action[];

    constructor(fn?: (action: Action) => Actions) {
        if (fn) this.handle = fn;
    }
    
    send(action: Action) {
        this.incoming.push(action);
    }
    
    async next(): Promise<void | Action> {
        if (this.outgoing.length) {
            return this.outgoing.shift();
        }
        if (!this.incoming.length) {
            return;
        }
        const a = await this.handle(this.incoming.shift()!);
        if (!a) {
            return;
        }
        if (Array.isArray(a)) {
            this.outgoing = a;
            return this.next();
        }
        return a;
    }

    handle(action: Action): Actions {
        throw new Error('not implemented');
    }
}

class ModHello extends ModBase {
    handle(action: Action) {
        if (action.type === 'text_in' && action.text === 'hello') {
            return textOut('Hello, World!');
        }
    }
}

class ModConsole extends ModBase {
    constructor() {
        super();
        this.outgoing.push(textIn('hello'));
    }

    handle(a: Action) {
        if (a.type === 'text_out') {
            console.log(a.text);
        }
    }
}

class Bot {
    mods = [] as Mod[];
    actions = [] as Action[];

    async start() {
        while (true) {
            await this.tick();
            if (!this.actions.length) break;
        }
    }

    async load(modName: string) {
        let mod: Mod;
        if (modName === 'console') {
            mod = new ModConsole();
        } else if (modName === 'hello') {
            mod = new ModHello();
        } else {
            return;
        }
        this.mods.push(mod);
    }
    
    async tick() {
        console.log('tick');
        console.log(this.actions);
        const a = this.actions.shift();
        if (a) this.mods.map(m => m.send(a));
        const reactions = await Promise.all(this.mods.map(m => m.next()));
        this.actions.push(...reactions.filter(a => a) as Action[]);
    }
}

async function main() {
    const bot = new Bot();
    await bot.load('console');
    await bot.load('hello');
    return bot.start();
}

main();
