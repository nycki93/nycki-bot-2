import { Event, BasePlugin } from "../lib";

export class PingPlugin extends BasePlugin {
    handleCommand(event: Event.Input, args: string[]): void {
        if (args[0] !== 'ping') return;
        if (args.length !== 1) return;
        const { user, room } = event;
        if (room) {
            this.write(`${user}, pong!`);
        } else {
            this.write(`${user}, pong!`, user);
        }
    }
}
