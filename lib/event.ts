export namespace Event {
    export const INPUT = 'input';
    export type Input = { 
        type: typeof INPUT;
        source: string;
        text: string;
        user: string;
    }
    export function input(
        source: string, 
        user: string,
        text: string, 
    ): Input {
        return { type: INPUT, source, user, text };
    }

    export const WRITE = 'write';
    export type Write = {
        type: typeof WRITE;
        source: string;
        text: string;
    }
    export function write(source: string, text: string): Write {
        return { type: WRITE, source, text };
    }

    export type Event = Input | Write;
}

export type Event = Event.Event;
