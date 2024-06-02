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

main();

// class TestBot extends Plugin {
//     eventBus = new AsyncQueue<Event>();
//     eventLog = [] as Event[];

//     send(event: Event) {
//         this.eventBus.push(event);
//         this.eventLog.push(event);
//     }
// }

// async function test() {
//     const bot = new TestBot();
//     bot.addPlugin(new PingBot());
//     bot.send(Event.input('console', 'console', 'ping'));
    
//     await bot.start();

//     console.log(bot.eventLog);
// }

// test();
