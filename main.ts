import { Bot } from "./lib";
import { ModConsole } from "./mod-console";
import { ModDiscord } from "./mod-discord";
import { highcard } from "./mod-highcard";
import { parrot } from "./mod-parrot";
import { ModPing } from "./mod-ping";
import { ModTictactoe } from "./mod-tictactoe";

function main() {
    const bot = new Bot(
        new ModConsole(),
        // new ModDiscord(),
        highcard(),
        // parrot(),
        new ModPing(),
        // new ModTictactoe(),
    );
    bot.start();
}

main();
