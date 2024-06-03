import { Event, BasePlugin } from "../lib";

export class PingPlugin extends BasePlugin {
    send(event: Event) {
        if (event.type === Event.INPUT && event.text.startsWith('ping')) {
            this.write('pong');
        }
    }
}
