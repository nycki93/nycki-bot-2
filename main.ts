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
    handle(action: Action): Action | void | Promise<Action | void>;
}

class ModHello implements Mod {
    handle(a: Action) {
        if (a.type !== 'text_in') return;
        if (a.text !== 'hello') return;
        return textOut('Hello, World!');
    }
}

class ModConsole implements Mod {
    handle(a: Action) {
        if (a.type === 'init') {
            return textIn('hello');
        }
        if (a.type === 'text_out') {
            console.log(a.text);
        }
    }
}

class Bot {
    mods = [] as Mod[];
    actions = [] as Action[];

    async start() {
        while (this.actions.length) await this.tick();
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
        const a = await mod.handle(init);
        if (a) {
            this.actions.push(a);
        }
        this.mods.push(mod);
    }
    
    async tick() {
        const reactions = [];
        for (const action of this.actions) {
            for (const mod of this.mods) {
                const reaction = await mod.handle(action);
                if (!reaction) continue;
                reactions.push(reaction);
            }
        }
        this.actions = reactions;
    }
}

async function main() {
    const bot = new Bot();
    await bot.load('console');
    await bot.load('hello');
    return bot.start();
}

main();
