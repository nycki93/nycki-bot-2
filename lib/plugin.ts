import { Event } from "./event";

export interface Plugin {
    plugin: {
        _setParent(plugin: Plugin): void;
        addPlugin(plugin: Plugin): void;
        emit(event: Event): void;
        send(event: Event): void;
        start(): void;
    }
}

export class PluginBase implements Plugin {
    children = [] as Plugin[];
    parent?: Plugin;
    plugin: Plugin['plugin'];

    constructor() {
        this.plugin = this;
    }

    // Core Interface

    _setParent(p: Plugin) {
        this.parent = p;
    }

    addPlugin(p: Plugin) {
        this.children.push(p);
        p.plugin._setParent(this);
    }

    emit(event: Event) {
        if (!this.parent) return;
        this.parent.plugin.send(event);
    }

    send(event: Event) {
        throw new Error('Not Implemented');
    }

    start() {
        for (const child of this.children) {
            child.plugin.start();
        }
    }

    // Event Helpers

    input(user: string, text: string) {
        this.emit(Event.input(this.constructor.name, user, text));
    }

    write(text: string) {
        this.emit(Event.write(this.constructor.name, text));
    }
}
