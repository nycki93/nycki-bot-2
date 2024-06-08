import { Bot } from "./lib";
import { ConsolePlugin } from "./plugins/console";
import { ParrotPlugin } from "./plugins/parrot";
import { PingPlugin } from "./plugins/ping";
import { Punchline } from "./plugins/punchline";

function main() {
    const bot = new Bot([
        new ConsolePlugin(),
        new ParrotPlugin(),
        new PingPlugin(),
        new Punchline(),
    ]);
    bot.init();
}

main();
