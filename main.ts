import { Bot } from "./lib";
import { ModConsole } from "./mod-console";
import { ModDiscord } from "./mod-discord";
import { ModPing } from "./mod-ping";
import { ModTictactoe } from "./mod-tictactoe";

function main() {
    const bot = new Bot();
    bot.addMod(new ModConsole());
    bot.addMod(new ModDiscord());
    bot.addMod(new ModPing());
    bot.addMod(new ModTictactoe());
    bot.start();
}

main();
