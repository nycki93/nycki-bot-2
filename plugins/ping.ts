import { Event, PluginBase } from "../lib";

export class Ping extends PluginBase {
    send(event: Event) {
        if (event.type === Event.INPUT && event.text.startsWith('ping')) {
            this.emit(Event.write(this.constructor.name, 'pong'));
        }
    }
}
