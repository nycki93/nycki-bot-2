type Init = { type: 'init' };
type Expect = { type: 'expect', event: Partial<Event> };
type Message = { type: 'message', text: string, room?: string, user: string };
type Ok = { type: 'ok' };
type Write = { type: 'write', text: string, room: string };
type WritePriv = { type: 'write-priv', text: string, user: string };
type Event = Init | Expect | Message | Ok | Write | WritePriv;

// This entire exercise is based around Plugin having this definition:
type Plugin<T> = (event: Event, state?: T) => { event: Event, state: T };

type DoublePingState = {
    phase: 'idle' | 'pong-again';
    totalPongs: number;
    room?: string;
}
const doublePingDefaults: DoublePingState = {
    phase: 'idle',
    totalPongs: 0,
}
export const doublePing: Plugin<DoublePingState> = (
    event: Event, 
    state: DoublePingState = doublePingDefaults,
) => {
    if (
        state.phase === 'idle'
        && event.type === 'message' 
        && event.room !== undefined
        && event.text === 'ping'
    ) {
        // Produce the first pong...
        const newTotalPongs = state.totalPongs + 1;
        const newEvent: Event = { 
            type: 'write', 
            room: event.room,
            text: `pong ${newTotalPongs}!`,
        };
        // ...and save your place so you remember the second pong.
        const newState: DoublePingState = { 
            ...state,
            phase: 'pong-again',
            totalPongs: newTotalPongs,
            room: event.room,
        };
        return { event: newEvent, state: newState };
    }

    if (state.phase === 'pong-again') {
        if (event.type !== 'ok') {
            throw new Error(`Interrupted while ponging! Expected ok but got ${event.type}.`);
        }
        // Here's the second pong.
        const newTotalPongs = state.totalPongs + 1;
        const newEvent: Event = {
            type: 'write',
            room: state.room!,
            text: `pong ${newTotalPongs}!`
        };
        const newState: DoublePingState = {
            ...state,
            phase: 'idle',
            totalPongs: newTotalPongs,
        }
        return { event: newEvent, state: newState };
    }

    // Otherwise, ignore the event and wait for another one.
    const newEvent: Event = { type: 'expect', event: { } };
    return { event: newEvent, state };
}

type PluginArgs<T> = {
    event: Event;
    state: Partial<T>;
    update: (state: Partial<T>) => Partial<T>;
    write: (room: string, text: string) => void;
}
type PluginFunction<T> = (a: PluginArgs<T>) => void;
type PendingEvents = { pending: Event[] };

export function makePlugin<T>(fn: PluginFunction<T>): Plugin<Partial<T & PendingEvents>> {
    return (newEvent: Event, state: Partial<T & PendingEvents> = { }) => {
        const [ oldEvent, ...pending ] = state.pending ?? [];
        const expectedType = (
            !oldEvent ? undefined
            : oldEvent.type === 'expect' ? oldEvent.event.type
            : 'ok'
        );

        if (expectedType && newEvent.type !== expectedType) {
            // Unexpected bnuuy in bagging area.
            // TODO: return error as an event instead of throwing?
            throw new Error(`Next input should be ${expectedType}, but is ${newEvent.type}!`);
        }
        
        if (expectedType === 'ok' && pending.length) {
            // No new input needed, just return the next pending event.
            const event = pending[0];
            return { event, state: { ...state, pending } };
        }

        // Pass new input to wrapped fn and collect outputs.
        const emit = (event: Event) => {
            pending.push(event);
        };
        const write = (room: string, text: string) => emit({ 
            type: 'write', room, text,
        });
        const update = (changes: Partial<T>) => {
            state = { ...state, ...changes };
            return state;
        };
        fn({ event: newEvent, state, write, update });
        const event = pending[0] ?? { type: 'expect', event: { } };
        return { event, state: { ...state, pending } };
    }
}

type DoublePingState2 = {
    totalPongs: number;
}
export const doublePing2 = makePlugin<DoublePingState2>(({ event, state, write, update }) => {
    if (event.type === 'init') {
        update({ totalPongs: 0 });
        return;
    }
    if (event.type === 'message' && event.room && event.text === 'ping') {
        write(event.room, `pong ${state.totalPongs! + 1}!`);
        write(event.room, `pong ${state.totalPongs! + 2}!`);
        update({ totalPongs: state.totalPongs! + 2 });
        return;
    }
});

function makeBot<T>(
    plugin: Plugin<T>, 
    perform: (event: Event) => Event | null,
) {
    let prev: { event: Event, state: T } | undefined;
    const sync = (event: Event) => {
        let work: Event | null = event;
        while (work) {
            prev = plugin(work, prev?.state);
            work = perform(prev.event);
        }
    }
    const init = () => sync({ type: 'init' });
    const send = (room: string, user: string, text: string) => sync({
        type: 'message', room, user, text,
    });
    return { init, sync, send };
}

function performConsole(event: Event): Event | null {
    if (event.type === 'write') {
        console.log(event.text);
        return { type: 'ok' };
    }
    return null;
}

function main() {
    const room = 'console';
    const user = 'user';
    const bot = makeBot(doublePing2, performConsole);
    bot.init();
    bot.send(room, user, 'ping');
    bot.send(room, user, 'ping');
}

main();
