import { AsyncQueue } from "./lib-async-queue";
import { Event } from "./lib";

export class Plugin {
    upstream = [] as Plugin[];
    downstream = [] as Plugin[];

    addPlugin(plugin: Plugin) {
        this.downstream.push(plugin);
        plugin.upstream.push(this);
    }

    send(event: Event) {
        throw new Error('Not Implemented');
    }

    emit(event: Event) {
        this.upstream.forEach(p => p.send(event));
    }
}

class LogBot extends Plugin {
    send(event: Event) {
        if (event.type === Event.INPUT) {
            console.log(`<${event.user}> ${event.text}`);
        }
        if (event.type === Event.WRITE) {
            console.log(`<bot> ${event.text}`);
        }
    }
}

class PingBot extends Plugin {
    send(event: Event) {
        if (event.type === Event.INPUT && event.text.startsWith('ping')) {
            this.emit(Event.write(this.constructor.name, 'pong'));
        }
    }
}

class Bot extends Plugin {
    eventBus = new AsyncQueue<Event>();

    async start() {
        while (true) {
            const event = await this.eventBus.shift();
            this.downstream.forEach(plugin => plugin.send(event));
        }
    }

    send(event: Event) {
        this.eventBus.push(event);
    }
}

function main() {
    const bot = new Bot();
    bot.addPlugin(new LogBot());
    bot.addPlugin(new PingBot());
    bot.start();
    // bot.send(Event.input('console', 'console', 'Hello, World!'));
    bot.send(Event.input('console', 'console', 'ping'));
}

// main();

class TestBot extends Bot {
    log = [] as Event[];
    logTarget = 0;
    logResolve?: (log: Event[]) => void;
    timeoutMs = 5000;

    send(event: Event) {
        super.send(event);
        this.log.push(event);
        
        if (!this.logResolve) return;
        if (this.log.length < this.logTarget) return;
        this.logResolve(this.log);
        this.logResolve = undefined;
        this.log = this.log.slice(this.logTarget);
    }

    async logEvents(n: number, timeoutMs=this.timeoutMs) {
        if (n <= this.log.length) {
            return this.log.splice(0, n);
        }
        this.logTarget = n;
        let timeout: NodeJS.Timeout;
        const t = new Promise<Event[]>((_, rej) => timeout = setTimeout(
            () => rej(new Error(`[testbot] did not receive ${n} events within ${timeoutMs} ms.`)), 
            timeoutMs,
        ));
        const p = new Promise<Event[]>(res => this.logResolve = (log: Event[]) => {
            res(log);
            clearTimeout(timeout);
        });
        return Promise.race([p, t]);
    }

    inject(event: Event) {
        this.send(event);
        return this.expect(event);
    }

    async expect(expected: Event, timeoutMs=this.timeoutMs) {
        const [ actual ] = await this.logEvents(1, timeoutMs);
        const expectedEntries = Object.entries(expected);
        const actualEntries = Object.entries(actual);
        const keys = Object.keys(expected) as (keyof Event)[]
        if (
            expectedEntries.length == actualEntries.length
            && keys.every((k) => expected[k] === actual[k])
        ) {
            return;
        }
        throw new Error(`Expected:\n${JSON.stringify(expected)}\nreceived:\n${JSON.stringify(actual)}`);
    }
}

async function test() {
    const bot = new TestBot();
    bot.addPlugin(new PingBot());
    bot.start();
    
    await bot.inject(Event.input('console', 'console', 'ping'));
    await bot.expect(Event.write('PingBot', 'pong'));

    console.log('All passed!');
}

test();
