import Readline from "readline/promises";
import { Action, ModBase, textIn, textOut } from "./lib";

export class ModConsole extends ModBase {
    isFirstTick: boolean;
    rl: Readline.Interface;

    constructor() {
        super();
        this.isFirstTick = true;
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
        if (a.type === 'text_in' && a.text.trim() === 'ping') {
            return textOut('pong!');
        }
        if (a.type === 'text_out') {
            console.log(a.text);
            return;
        }
    }
}
