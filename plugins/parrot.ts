import { Event, BasePlugin } from "../lib";

export class ParrotPlugin extends BasePlugin {
    send(event: Event) {
        if (event.type === Event.INPUT) {
            const args = event.text.split(/\s+/);
            if (args[0] !== 'parrot') return;
            const reply = event.text.slice(args[0].length).trim();
            this.write(`Squawk! ${reply}!`);
        }
    }
}
