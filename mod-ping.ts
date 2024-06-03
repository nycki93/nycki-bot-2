import { Event, BasePlugin } from "./lib";

export class ModPing extends BasePlugin {
    handle(a: Event) {
        if (a.type === Event.INPUT && a.text.trim() === 'ping') {
            this.write('pong!');
        }
    }
}
