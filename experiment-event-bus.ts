import { Event, Plugin, TestBot } from "./lib";

class PingBot extends Plugin {
    send(event: Event) {
        if (event.type === Event.INPUT && event.text.startsWith('ping')) {
            this.emit(Event.write(this.constructor.name, 'pong'));
        }
    }
}

async function test() {
    const bot = new TestBot();
    bot.addPlugin(new PingBot());
    bot.start();
    
    bot.inject(Event.input('console', 'console', 'ping'));
    await bot.expect(Event.write('PingBot', 'pong'));

    console.log('All passed!');
}

test();
