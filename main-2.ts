import { Bot } from "./lib";
import { Console } from "./plugins/console";
import { Ping } from "./plugins/ping";

function main() {
    const bot = new Bot();
    bot.addPlugin(new Console());
    bot.addPlugin(new Ping());
    bot.start();
}

main();
