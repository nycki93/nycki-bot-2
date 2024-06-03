import { Event } from "./event";

export type EventHandler = (event: Event) => void;

export interface Plugin {
    addListener(cb: EventHandler): void;
    emit(event: Event): void;
    send(event: Event): void;
    start(): void;
}

export class BasePlugin implements Plugin {
    listeners = [] as EventHandler[];

    // Core Interface

    addListener(cb: EventHandler) {
        this.listeners.push(cb);
    }

    emit(event: Event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    send(event: Event) {
        throw new Error('Not Implemented');
    }

    start() { }

    // Event Helpers

    input(user: string, text: string) {
        this.emit(Event.input(this.constructor.name, user, text));
    }

    write(text: string) {
        this.emit(Event.write(this.constructor.name, text));
    }
}
