export namespace Event {
    export const INPUT = 'input';
    export type Input = { 
        type: typeof INPUT;
        source: string;
        room?: string;
        text: string;
        user: string;
    }
    export function input(args: Omit<Input, 'type'>): Input {
        return { type: INPUT, ...args };
    }

    export const WRITE = 'write';
    export type Write = {
        type: typeof WRITE;
        source: string;
        text: string;
        user?: string;
    }
    export function write(args: Omit<Write, 'type'>): Write {
        return { type: WRITE, ...args };
    }

    export type Event = Input | Write;

    export function equals(a: Event, b: Event) {
        const keys = Object.keys(a) as (keyof Event)[];
        if (keys.length !== Object.keys(b).length) return false;
        for (const k of keys) {
            if (a[k] !== b[k]) return false;
        }
        return true;
    }
}

export type Event = Event.Event;
