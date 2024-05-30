import Readline from "readline/promises";
import { Event, PluginBase } from "./lib";

export class ModConsole extends PluginBase {
    rl: Readline.Interface;

    constructor() {
        super();
        this.rl = Readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.rl.on('line', (line) => {
            this.input('console', 'user', line);
        });
        this.write('[console] Mod loaded!');
    }

    handle(a: Event) {
        if (a.type === Event.INPUT) {
            console.log(`<${a.user}> ${a.text}`);
            return;
        }
        if (a.type === Event.WRITE) {
            console.log(`<bot> ${a.text}`);
            return;
        }
    }
}
