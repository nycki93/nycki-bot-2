type ActionInit = { type: 'init' };
const init: ActionInit = { type: 'init' };

type ActionTextIn = { type: 'text_in', text: string };
function textIn(text: string): ActionTextIn {
    return { type: 'text_in', text };
}

type ActionTextOut = { type: 'text_out', text: string };
function textOut(text: string): ActionTextOut {
    return { type: 'text_out', text };
}

export type Action = ActionInit | ActionTextIn | ActionTextOut;

interface Mod {
    handle: (action: Action) => void;
    next: () => void | Action | Promise<Action>;
}

class ModHello implements Mod {
    actions = [] as Action[];

    handle(a: Action) {
        if (a.type !== 'text_in') return;
        if (a.text !== 'hello') return;
        this.actions.push(textOut('Hello, World!'));
    }

    next() {
        return this.actions.shift();
    }
}

class ModConsole implements Mod {
    actions = [] as Action[];

    constructor() {
        this.actions.push(textIn('hello'));
    }

    handle(a: Action) {
        if (a.type === 'text_out') {
            console.log(a.text);
        }
    }

    next() {
        return this.actions.shift();
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
        const reactions = await Promise.all(this.mods.map(mod => {
            if (a) mod.handle(a);
            return mod.next();
        }));
        this.actions = reactions.filter(a => a) as Action[];
    }
}

async function main() {
    const bot = new Bot();
    await bot.load('console');
    await bot.load('hello');
    return bot.start();
}

main();
