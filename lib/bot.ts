import { BasePlugin } from "./plugin";
import { AsyncQueue } from "./async-queue";
import { Event } from "./event";
import { Plugin } from "./plugin";

export class Bot extends BasePlugin {
    eventBus = new AsyncQueue<Event>();
    plugins = [] as Plugin[];
    app?: Plugin;

    constructor(plugins: Plugin[] = []) {
        super();
        for (const plugin of plugins) {
            this.addPlugin(plugin);
        }
    }

    emit(event: Event.Event) {
        this.eventBus.push(event);
    }

    addPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
        plugin.addListener((event) => this.emit(event));
    }

    async init() {
        for (const plugin of this.plugins) {
            plugin.init();
        }
        while (true) {
            const event = await this.eventBus.shift();
            this.send(event);
            this.plugins.forEach(plugin => plugin.send(event));
        }
    }

    handleCommand(event: Event.Input, args: string[]) {
        if (args[0] === 'load') return this.handleLoad(args);
        if (args[0] === 'start') return this.handleStart(args);
        if (args[0] === 'stop') return this.handleStop(args);
    }

    async handleLoad(args: string[]) {
        if (args.length !== 2) {
            this.write('Usage: !load <plugin>');
            return;
        }
        const pluginName = args[1];

        let module;
        try {
            module = await import(`../plugins/${pluginName}`);
        } catch {
            this.write(`Can't read ${pluginName}, does the file exist?`);
            return;
        }
        let ctor = module.default;
        if (!ctor) {
            const t = Object.entries(module).find(([k, v]) => typeof v === 'function');
            ctor = t && t[1];
        }
        if (!ctor) {
            this.write(`Can't find plugin ${pluginName}, did you export it?`);
        }
        const plugin = new (ctor as ObjectConstructor) as Plugin;
        if (this.plugins.find((p) => p.id === plugin.id)) {
            this.write(`Can't load ${pluginName}, it is already loaded!`);
            return;
        }
        this.addPlugin(plugin);
        this.write(`${plugin.id} loaded!`);
    }

    handleStart(args: string[]) {
        if (args.length !== 2) {
            this.write('Usage: !start <plugin>');
            return;
        }
        if (this.app) {
            this.write(`Already running ${this.app.id}. (!stop ${this.app.id})`);
            return;
        }
        const id = args[1];
        const app = this.plugins.find(p => p.id === id);
        if (!app) {
            this.write(`Cannot find plugin with id ${id}, is it loaded?`);
            return;
        }
        const started = app.start();
        if (started) {
            this.app = app;
        }
    }

    handleStop(args: string[]) {
        if (args.length !== 2) {
            this.write('Usage: !stop <plugin>');
            return;
        }
        if (!this.app) return;
        const id = args[1];
        if (this.app.id !== id) {
            this.write(`No running app named ${id}.`);
            return;
        } 
        const stopped = this.app.stop();
        if (stopped) {
            this.app = undefined;
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

    inject(event: Event) {
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
