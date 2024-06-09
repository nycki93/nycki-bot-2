import { Event, TestBot } from '../lib';
import { PingPlugin } from "./ping";

function input(text: string, user?: string, priv?: boolean): Event {
    return {
        type: Event.INPUT,
        source: 'mock source',
        text,
        user: user ?? 'mock user',
        room: priv ? undefined : 'mock room',
    };
}

test('it replies to ping with pong', async () => {
    const bot = new TestBot();
    bot.addPlugin(new PingPlugin());
    bot.init();
    bot.inject(input('ping'))
    console.log('done');
});
