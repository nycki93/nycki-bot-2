import { BasePlugin } from "./plugin";
import { AsyncQueue } from "./async-queue";
import { Event } from "./event";

export class Bot extends BasePlugin {
    eventBus = new AsyncQueue<Event>();

    async start() {
        super.start();
        while (true) {
            const event = await this.eventBus.shift();
            this.children.forEach(c => c.plugin.send(event));
        }
    }

    send(event: Event) {
        this.eventBus.push(event);
    }
}
