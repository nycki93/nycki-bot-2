import Readline from "readline/promises";
import { Action, ModBase } from "./lib";

export class ModConsole extends ModBase {
    rl: Readline.Interface;

    constructor() {
        super();
        this.rl = Readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.rl.on('line', (line) => {
            this.bot.write_in(line, 'user');
        });
        this.bot.write('[console] Mod loaded!');
    }

    handle(a: Action) {
        if (a.type === 'text_in') {
            console.log(`<${a.user}> ${a.text}`);
            return;
        }
        if (a.type === 'text_out') {
            console.log(`<bot> ${a.text}`);
            return;
        }
    }
}
