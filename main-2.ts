type Event = string;

type Plugin<T> = (event: Event, state?: T) => { events: Event[], state?: T };

export type PluginArgs<T> = {
    state?: T;
    setState: (newState: T) => T;
    event: Event;
    write: (text: string) => void;
}

type PluginFunction<T> = (a: PluginArgs<T>) => void;

export function plugin<T = undefined>(fn: PluginFunction<T>): Plugin<T> {
    return (event: Event, state?: T) => {
        const setState = (newState: T) => state = newState;
        const events = [] as Event[];
        const write = (text: string) => events.push(text);
        fn({ state, setState, event, write });
        return { state, events };
    }
}

type PingState = {
    id: string;
    count: number;
}
export const ping = plugin<PingState>(({ state, setState, event, write }) => {
    state = state ?? setState({ id: 'pingbot', count: 0 });
    if (event === 'ping') {
        write('pong');
        state = setState({ ...state, count: state.count + 1 });
    }
});

function main() {
    const log = [] as { state?: PingState, events: Event[] }[];
    log.push(ping('ping', undefined));
    log.push(ping('pringle', log[0].state));
    log.push(ping('ping', log[1].state));

    console.log(log);
}

main();
