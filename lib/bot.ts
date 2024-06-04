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

    async loadPlugin(pluginName: string) {
        let module;
        try {
            module = await import(`../plugins/${pluginName}`);
        } catch {
            this.eventBus.push(Event.write('Bot', 
                `Can't read ${pluginName}, does the file exist?`,
            ));
            return;
        }
        let ctor = module.default;
        if (!ctor) {
            const t = Object.entries(module).find(([k, v]) => typeof v === 'function');
            ctor = t && t[1];
        }
        if (!ctor) {
            this.eventBus.push(Event.write('Bot', 
                `Can't find plugin ${pluginName}, did you export it?`
            ));
        }
        const plugin = new (ctor as ObjectConstructor) as Plugin;
        if (this.plugins.find((p) => p.id === plugin.id)) {
            this.eventBus.push(Event.write('Bot', `Can't load ${pluginName}, it is already loaded!`));
        }
        this.addPlugin(plugin);
    }

    async start() {
        for (const plugin of this.plugins) {
            plugin.start();
        }
        while (true) {
            const event = await this.eventBus.shift();
            if (event.type === Event.INPUT) {
                const args = event.text.split(/\s+/);
                if (args[0] === 'load') {
                    await this.handleLoad(event, args);
                    continue;
                }
            }
            this.plugins.forEach(plugin => plugin.send(event));
        }
    }

    handleLoad(event: Event.Input, args: string[]) {
        if (args.length !== 2) {
            this.eventBus.push(Event.write('Bot', 'Usage: !load <plugin>'));
            return;
        }
        return this.loadPlugin(args[1]);
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
