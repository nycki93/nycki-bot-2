import { Event, BasePlugin } from "../lib";

export class PingPlugin extends BasePlugin {
    handleCommand(event: Event.Input, args: string[]): void {
        if (args[0] !== 'ping') return;
        if (args.length !== 1) return;
        const { user, room } = event;
        this.write(`${user}, pong!`, room);
    }
}
