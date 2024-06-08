import { Bot } from "./lib";
import { ConsolePlugin } from "./plugins/console";
import { DiscordPlugin } from "./plugins/discord";
import { ParrotPlugin } from "./plugins/parrot";
import { PingPlugin } from "./plugins/ping";
import { Punchline } from "./plugins/punchline";
import { TictactoePlugin } from "./plugins/tictactoe";
import { Vote } from "./plugins/vote";

function main() {
    const bot = new Bot([
        new ConsolePlugin(),
        new DiscordPlugin(),
        new ParrotPlugin(),
        new PingPlugin(),
        new Punchline(),
        new TictactoePlugin(),
        new Vote(),
    ]);
    bot.init();
}

main();
