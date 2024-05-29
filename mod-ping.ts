import { Action, ModBase } from "./lib";

export class ModPing extends ModBase {
    handle(a: Action) {
        if (a.type === Action.INPUT && a.text.trim() === 'ping') {
            this.write('pong!');
        }
    }
}
