import { Event, TestBot } from "../lib";
import { Punchline } from "./punchline";

function testInput(
    user: string, text: string, priv?: boolean,
): Event {
    return {
        type: Event.INPUT,
        source: 'mock source',
        text,
        user,
        room: priv ? undefined : 'mock room',
    };
}

function testWrite(text: string) {
    return Event.write({ source: 'punchline', text});
}

function testPriv(user: string, text: string) {
    return Event.write({ source: 'punchline', text, user });
}

test('punchline', async () => {
    const bot = new TestBot();
    bot.addPlugin(new Punchline());
    bot.init();

    bot.inject(testInput(
        'alice', 'start punchline'
    ));
    expect(await bot.next()).toEqual(testWrite(
        'Game started, waiting for players (!join)'
    ));
    bot.inject(testInput(
        'alice', 'join'
    ));
    expect(await bot.next()).toEqual(testWrite(
        'alice joined! There are 1 player. Start game with !play.'
    ));
    bot.inject(testInput(
        'bob', 'join'
    ));
    expect(await bot.next()).toEqual(testWrite(
        'bob joined! There are 2 players. Start game with !play.'
    ));
    bot.inject(testInput(
        'alice', 'play'
    ));
    expect(await bot.next()).toEqual(testWrite(
        'Game started! Sending out 2 prompts each...'
    ));
    expect(await bot.next()).toEqual(testPriv(
        'alice', "Answer with !submit <text>.\nIf you're reading this, the prompts engine isn't working yet. Just write whatever you like.",
    ));
    expect(await bot.next()).toEqual(testPriv(
        'bob', "Answer with !submit <text>.\nIf you're reading this, the prompts engine isn't working yet. Just write whatever you like.",
    ));
    bot.inject(testInput(
        'alice', 'submit alice answer 1', true,
    ));
    expect(await bot.next()).toEqual(testPriv(
        'alice', "Answer with !submit <text>.\nIf you're reading this, the prompts engine isn't working yet. Just write whatever you like.",
    ));
    bot.inject(testInput(
        'alice', 'submit alice answer 2', true,
    ));
    expect(await bot.next()).toEqual(testPriv(
        'alice', 'Thanks for your input!',
    ));
});
