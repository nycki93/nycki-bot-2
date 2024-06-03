import Readline from "node:readline/promises";
import { Event, BasePlugin } from "../lib";

export class ConsolePlugin extends BasePlugin {
    rl: Readline.Interface;

    constructor() {
        super();
        this.rl = Readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.rl.on('line', (line) => this.input('user', line));
    }
    
    start() {
        this.write('[console] Plugin loaded!');
    }

    send(event: Event.Event): void {
        if (event.type === Event.INPUT) {
            console.log(`<${event.user}> ${event.text}`);
        }
        else if (event.type === Event.WRITE) {
            console.log(`<bot> ${event.text}`);
        }
    }
}
