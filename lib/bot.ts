import { BasePlugin } from "./plugin";
import { AsyncQueue } from "./async-queue";
import { Event } from "./event";
import { Plugin } from "./plugin";

export class Bot extends BasePlugin {
    eventBus = new AsyncQueue<Event>();
    plugins = [] as Plugin[];

    constructor(plugins: Plugin[] = []) {
        super();
        for (const plugin of plugins) {
            this.addPlugin(plugin);
        }
    }

    addPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
        plugin.addListener((event) => this.eventBus.push(event));
    }

    async start() {
        for (const plugin of this.plugins) {
            plugin.start();
        }
        while (true) {
            const event = await this.eventBus.shift();
            this.plugins.forEach(plugin => plugin.send(event));
        }
    }
}

export class TestBot extends Bot {
    log = new AsyncQueue<Event>();
    timeoutMs = 5000;

    addPlugin(plugin: Plugin): void {
        super.addPlugin(plugin);
        plugin.addListener((event) => this.log.push(event));
    }

    send(event: Event) {
        this.eventBus.push(event);
    }

    async next(timeoutMs=this.timeoutMs) {
        let timeout: NodeJS.Timeout;
        const timeoutPromise = new Promise<void>((resolve) => {
            timeout = setTimeout(resolve, timeoutMs);
        });
        const getEvent = this.log.shift();
        const result = await Promise.race([getEvent, timeoutPromise]);
        if (result) {
            clearTimeout(timeout!);
            return result;
        } else {
            throw new Error(`Did not receive an event within ${timeoutMs} ms.`)
        }
    }

    async expect(expected: Event, timeoutMs=this.timeoutMs) {
        const actual = await this.next(timeoutMs);
        if (Event.equals(actual, expected)) return;
        throw new Error(`Expected:\n${JSON.stringify(expected)}\nreceived:\n${JSON.stringify(actual)}`);
    }
}
