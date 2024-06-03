import { Plugin } from "./plugin";
import { AsyncQueue } from "./async-queue";
import { Event } from "./event";

export class Bot extends Plugin {
    eventBus = new AsyncQueue<Event>();

    async start() {
        for (const plugin of this.downstream) {
            if ('start' in plugin) {
                (plugin.start as Function)();
            }
        }
        while (true) {
            const event = await this.eventBus.shift();
            this.downstream.forEach(plugin => plugin.send(event));
        }
    }

    send(event: Event) {
        this.eventBus.push(event);
    }
}
