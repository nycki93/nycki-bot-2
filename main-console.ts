import { Bot } from "./lib";
import { ConsolePlugin } from "./plugins/console";
import { ParrotPlugin } from "./plugins/parrot";
import { PingPlugin } from "./plugins/ping";

function main() {
    const bot = new Bot();
    bot.addPlugin(new ConsolePlugin());
    bot.addPlugin(new ParrotPlugin());
    bot.addPlugin(new PingPlugin());
    bot.start();
}

main();
