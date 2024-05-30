import { Event, PluginBase } from "./lib";

export class ModPing extends PluginBase {
    handle(a: Event) {
        if (a.type === Event.INPUT && a.text.trim() === 'ping') {
            this.write('pong!');
        }
    }
}
