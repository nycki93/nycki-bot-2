import { Action } from "./lib";
import { createMod } from "./lib-functional";

export const parrot = createMod(({ action, write }) => {
    if (action.type === Action.INPUT) {
        const args = action.text.split(/\s+/);
        if (args[0] !== 'parrot') return;
        const reply = action.text.slice(args[0].length).trim();
        write(`Squawk! ${reply}!`);
    }
});
