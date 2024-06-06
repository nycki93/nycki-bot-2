import { Event, TestBot } from '../lib';
import { PingPlugin } from './ping';

async function test() {
    const bot = new TestBot();
    bot.addPlugin(new PingPlugin());
    bot.init();
    
    bot.send(Event.input('console', 'console', 'ping'));
    await bot.expect(Event.write('PingPlugin', 'pong'));

    console.log('All passed!');
}

test();
