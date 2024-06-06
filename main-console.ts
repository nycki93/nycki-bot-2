import { Bot } from "./lib";
import { ConsolePlugin } from "./plugins/console";
import { ParrotPlugin } from "./plugins/parrot";
import { PingPlugin } from "./plugins/ping";

function main() {
    const bot = new Bot([
        new ConsolePlugin(),
        new ParrotPlugin(),
        new PingPlugin(),
    ]);
    bot.init();
}

main();
