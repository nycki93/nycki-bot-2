import { Action, ModBase, textOut } from "./lib";

export class ModPing extends ModBase {
    handle(a: Action) {
        if (a.type === 'text_in' && a.text.trim() === 'ping') {
            return textOut('pong!');
        }
    }
}
