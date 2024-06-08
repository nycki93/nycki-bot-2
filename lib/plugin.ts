import { Event } from "./event";

export type EventHandler = (event: Event) => void;

export interface Plugin {
    id: string;
    addListener(cb: EventHandler): void;
    send(event: Event): void;
    init(): void;
    start(): boolean;
    stop(): boolean;
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

    init() { }

    start() { 
        return false;
    }

    stop() { 
        return false;
    }

    // Event Helpers

    emit(event: Event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }

    handleCommand(event: Event.Input, args: string[]) { }

    input(user: string, text: string, room?: string) {
        this.emit(Event.input({
            source: this.id, 
            user, 
            text,
            room,
        }));
    }

    write(text: string) {
        this.emit(Event.write({
            source: this.id,
            text,
        }));
    }

    writePriv(text: string, user: string) {
        this.emit(Event.write({
            source: this.id,
            text,
            user,
        }))
    }

    reply(event: Event.Input, text: string) {
        if (event.room) return this.write(text);
        return this.writePriv(text, event.user);
    }
}
