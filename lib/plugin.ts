import { Event } from "./event";

export type EventHandler = (event: Event) => void;

export interface Plugin {
    id: string;
    addListener(cb: EventHandler): void;
    send(event: Event): void;
    start(): void;
}

export class BasePlugin implements Plugin {
    id = this.constructor.name;
    listeners = [] as EventHandler[];

    // Core Interface

    addListener(cb: EventHandler) {
        this.listeners.push(cb);
    }

    send(event: Event) {
        if (event.type === Event.INPUT) {
            if (event.source === this.id) return;
            const args = event.text.split(/\s+/);
            this.handleCommand(event, args);
        }
    }

    start() { }

    // Event Helpers

    emit(event: Event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    handleCommand(event: Event.Input, args: string[]) { }

    input(user: string, text: string) {
        this.emit(Event.input(this.id, user, text));
    }

    write(text: string) {
        this.emit(Event.write(this.id, text));
    }
}
