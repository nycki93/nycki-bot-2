import Readline from "readline/promises";
import { Action, ModBase, textIn, textOut } from "./lib";

export class ModConsole extends ModBase {
    rl: Readline.Interface;

    constructor() {
        super();
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
        if (a.type === 'text_in') {
            console.log(`<console> ${a.text}`);
            return;
        }
        if (a.type === 'text_out') {
            console.log(`<bot> ${a.text}`);
            return;
        }
    }
}
