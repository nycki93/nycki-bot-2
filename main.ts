import { Bot } from "./lib";
import { ModConsole } from "./mod-console";
import { ModPing } from "./mod-ping";

function main() {
    const bot = new Bot();
    bot.addMod(new ModConsole());
    bot.addMod(new ModPing());
    bot.start();
}

main();
