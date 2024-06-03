import { Bot } from "./lib";
import { ConsolePlugin } from "./plugins/console";
import { DiscordPlugin } from "./plugins/discord";
import { ParrotPlugin } from "./plugins/parrot";
import { PingPlugin } from "./plugins/ping";
import { TictactoePlugin } from "./plugins/tictactoe";

function main() {
    const bot = new Bot([
        new ConsolePlugin(),
        new DiscordPlugin(),
        new ParrotPlugin(),
        new PingPlugin(),
        new TictactoePlugin(),
    ]);
    bot.start();
}

main();
