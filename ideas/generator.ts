type Init = { type: 'init' };
type Expect = { type: 'expect', event: Partial<Event> };
type Message = { type: 'message', text: string, room?: string, user: string };
type Ok = { type: 'ok' };
type Write = { type: 'write', text: string, room: string };
type WritePriv = { type: 'write-priv', text: string, user: string };
export type Event = Init | Expect | Message | Ok | Write | WritePriv;

// This entire exercise is based around Plugin having this core:
type Plugin = {
    next: (event: Event) => Event;
}

class DoublePing implements Plugin {
    gen?: Generator<Event, void, Event>;
    pongCount = 0;

    next(event: Event) {
        while (true) {
            this.gen = this.gen ?? this.main();
            const { done, value } = this.gen.next(event);
            if (done) this.gen = undefined;
            if (value) return value;
        }
    }

    * main(): Generator<Event, void, Event> {
        const event = yield { type: 'expect', event: { }};
        if (
            event.type === 'message'
            && event.room !== undefined
            && event.text === 'ping'
        ) {
            yield { 
                type: 'write', 
                room: event.room, 
                text: `pong ${this.pongCount + 1}!`,
            };

            yield { 
                type: 'write', 
                room: event.room, 
                text: `pong ${this.pongCount + 2}!`,
            };

            this.pongCount += 2;
        }
    }
}

type Performer = {
    next(event: Event): Event | null;
}

class ConsolePerformer implements Performer {
    next(event: Event): Event | null {
        if (event.type === 'write') {
            console.log(event.text);
            return { type: 'ok' };
        }
        return null;
    }
}

class Bot {
    plugin: Plugin;
    performer: Performer;
    
    constructor(plugin: Plugin, performer: Performer) {
        this.plugin = plugin;
        this.performer = performer;
    }

    sync(event: Event) {
        let work: Event | null = event;
        while (work) {
            const todo = this.plugin.next(work);
            work = this.performer.next(todo);
        }
    }

    init() {
        this.sync({ type: 'init' });
    }

    send(room: string, user: string, text: string) {
        this.sync({ type: 'message', room, user, text });
    }
}

function nextEvent(expected = {}): Expect {
    return { type: 'expect', event: expected };
}

function write(room: string, text: string): Write {
    return { type: 'write', room, text };
}

const makePlugin = (fn: () => Generator<Event, void, Event>) => () => {
    let gen: Generator<Event, void, Event> | null = null;
    function next(event: Event): Event {
        while (true) {
            gen = gen ?? fn();
            const { done, value } = gen.next(event);
            if (done) gen = null;
            if (value) return value;
        }
    }
    return { next };
}

const doublePing2 = makePlugin(function * () {
    let pongCount = 0;
    while (true) {
        const event = yield nextEvent();
        if (
            event.type === 'message'
            && event.room !== undefined
            && event.text === 'ping'
        ) {
            yield write(event.room, `pong ${pongCount + 1}!`);
            yield write(event.room, `pong ${pongCount + 2}!`);
            pongCount += 2;
        }
    }
});

function main() {
    const plugin = doublePing2();
    const performer = new ConsolePerformer();
    const bot = new Bot(plugin, performer);
    bot.init();
    bot.send('room', 'user', 'ping');
    bot.send('room', 'user', 'ping');
}

main();
