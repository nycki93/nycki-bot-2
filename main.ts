import { Bot } from "./lib";
import { ModConsole } from "./mod-console";

function main() {
    const bot = new Bot();
    bot.addMod(new ModConsole());
    bot.start();
}

main();
