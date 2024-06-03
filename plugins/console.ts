import Readline from "node:readline/promises";
import { Event, Plugin } from "../lib";

export class Console extends Plugin {
    rl: Readline.Interface;

    constructor() {
        super();
        this.rl = Readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.rl.on('line', (line) => {
            this.emit(Event.input(this.constructor.name, 'user', line));
        });
    }
    
    start() {
        this.emit(Event.write(this.constructor.name, '[console] Plugin loaded!'));
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