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
            this.write_in(line, 'user');
        });
        this.write('[console] Mod loaded!');
    }

    handle(a: Action) {
        if (a.type === Action.INPUT) {
            console.log(`<${a.user}> ${a.text}`);
            return;
        }
        if (a.type === Action.WRITE) {
            console.log(`<bot> ${a.text}`);
            return;
        }
    }
}
