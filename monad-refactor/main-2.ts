type EventInit = { type: 'init' };
type EventWrite = { 
    type: 'write', 
    text: string,
    room: string,
};
type EventWritePriv = {
    type: 'write-priv',
    text: string,
    user: string,
}
type EventMessage = { 
    type: 'message', 
    text: string,
    room?: string,
    user: string,
};
type EventOk = { 
    type: 'ok',
};
type EventExpect = { 
    type: 'expect', 
    event: Partial<Event>,
};
export type Event = EventInit | EventWrite | EventWritePriv | EventMessage | EventOk | EventExpect;

// This entire exercise is based around Plugin having this definition:
type Plugin<T> = (event: Event, state?: T) => { event: Event, state: T };

export type PluginArgs<T> = {
    event: Event;
    state: Partial<T>;
    update: (state: Partial<T>) => Partial<T>;
    write: (room: string, text: string) => void;
}

type PluginFunction<T> = (a: PluginArgs<T>) => void;
type PendingEvents = { pending: Event[] };

const expectAny = { type: 'expect', event: { } };

export function plugin<T>(fn: PluginFunction<T>): () => Plugin<Partial<T & PendingEvents>> {
    return () => (newEvent: Event, state: Partial<T & PendingEvents> = { }) => {
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
        const event = pending[0] ?? expectAny;
        return { event, state: { ...state, pending } };
    }
}

type PingState = {
    id: string;
    count: number;
}
export const ping = plugin<PingState>(({ event, state, write, update }) => {
    if (event.type === 'init') {
        state = update({ id: 'pingbot', count: 0 });
        return;
    }
    if (event.type === 'message' && event.room && event.text === 'ping') {
        state = update({ count: state.count! + 1 });
        write(event.room, `pong ${state.count}!`);
        return;
    }
});

function main() {
    const room = 'console';
    const user = 'user';
    const gen = ping();
    let t = gen({ type: 'init' })
    const log = [] as Event[];
    const send = (text: string) => {
        const event = { type: 'message', room, user, text } as const;
        t = gen(event, t.state);
        while (true) {
            if (t.event.type === 'write') {
                log.push(t.event);
                t = gen({ type: 'ok' }, t.state);
                continue;
            }
            break;
        }
    }
    const next = () => {
        return log.shift();
    }

    send('ping');
    console.log(next());
    
    send('pringle');
    console.log(next());
    
    send('ping');
    console.log(next());
}

main();
