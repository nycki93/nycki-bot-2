import { Bot } from "./lib";
import { Console } from "./plugins/console";

function main() {
    const bot = new Bot();
    bot.addPlugin(new Console());
    bot.start();
}

main();
