import { Action } from "./lib";
import { createMod } from "./lib-functional";

export const parrot = createMod(({ action, write }) => {
    if (action.type === Action.INPUT) {
        write(`Squawk! ${action.text}!`);
    }
});
