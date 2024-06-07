type Event = string;

type Plugin<T> = (event: Event, state?: T) => { events: Event[], state?: T };

export type PluginArgs<T> = {
    state?: T;
    event: Event;
    write: (text: string) => void;
}

type PluginFunction<T> = (a: PluginArgs<T>) => void;

export function plugin<T>(fn: PluginFunction<T>): Plugin<T> {
    return (event: Event, state?: T) => {
        const stateCopy = state && { ...state };
        const events = [] as Event[];
        const write = (text: string) => events.push(text);
        const bot = { state: stateCopy, event, write };
        fn(bot);
        return { state: bot.state, events };
    }
}

type PingState = {
    id: string;
    count: number;
}
export const ping = plugin<PingState>((bot) => {
    bot.state = bot.state ?? { id: 'pingbot', count: 0 };
    if (bot.event === 'ping') {
        bot.write('pong');
        bot.state.count += 1;
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
