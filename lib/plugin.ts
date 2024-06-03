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

    addPlugin(p: Plugin) {
        this.children.push(p);
        p.plugin._setParent(this);
    }

    _setParent(p: Plugin) {
        this.parent = p;
    }

    send(event: Event) {
        throw new Error('Not Implemented');
    }

    emit(event: Event) {
        if (!this.parent) return;
        this.parent.plugin.send(event);
    }

    start() {
        for (const child of this.children) {
            child.plugin.start();
        }
    }
}
