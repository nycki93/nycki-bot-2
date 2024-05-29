// A game for one player. Given a hand of cards, play the highest one!

import { Action } from "./lib";
import { createMod } from "./lib-functional";

enum Step {
    Init
}

type State = {
    step: Step;
};

export const highcard = createMod<State>((bot) => {
    if (bot.action.type !== Action.INPUT) return;

    if (!bot.state) {
        bot.setState({ step: Step.Init });
    }

    if (bot.state?.step === Step.Init) {
        bot.write('[highcard] Started successfully!');
    }
});
