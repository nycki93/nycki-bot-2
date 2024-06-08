import Readline from "node:readline/promises";
import { Event, BasePlugin } from "../lib";

export class ConsolePlugin extends BasePlugin {
    id = 'console';
    rl: Readline.Interface;

    constructor() {
        super();
        this.rl = Readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.rl.on('line', (line) => {
            // room <user> text
            const m = line.match(/(\w+)? ?<(.*)> (.*)/);
            if (m) {
                const [ _, room, user, text] = m;
                this.input(user, text, room);
            } else {
                this.input('console', line);
            }
        });
    }
    
    init() {
        this.write('[console] Plugin loaded!');
    }

    send(event: Event.Event): void {
        if (event.type === Event.INPUT && event.source !== this.id) {
            const { room, user, text } = event;
            if (room) {
                console.log(`${room} <${user}> ${text}`);
            } else {
                console.log(`<${user}> ${text}`);
            }
        }
        else if (event.type === Event.WRITE) {
            const room = event.room ? `${event.room} ` : ''; 
            console.log(`${room}<${this.id}> ${event.text}`);
        }
    }
}
