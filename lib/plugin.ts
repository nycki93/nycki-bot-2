import { Event } from "./event";

export class Plugin {
    upstream = [] as Plugin[];
    downstream = [] as Plugin[];

    addPlugin(plugin: Plugin) {
        this.downstream.push(plugin);
        plugin.upstream.push(this);
    }

    send(event: Event) {
        throw new Error('Not Implemented');
    }

    emit(event: Event) {
        this.upstream.forEach(p => p.send(event));
    }
}
