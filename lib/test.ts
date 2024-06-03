import { AsyncQueue } from "./async-queue";
import { Bot } from "./bot";
import { Event } from "./event";

export class TestBot extends Bot {
    log = new AsyncQueue<Event>();
    timeoutMs = 5000;

    send(event: Event) {
        super.send(event);
        this.log.push(event);
    }

    inject(event: Event) {
        // send without logging
        super.send(event);
    }

    async next(timeoutMs=this.timeoutMs) {
        let timeout: NodeJS.Timeout;
        const t = new Promise<Event>((_, rej) => timeout = setTimeout(
            () => rej(new Error(`[testbot] did not receive an event within ${timeoutMs} ms.`)),
            timeoutMs,
        ));
        const p = new Promise<Event>(async (res) => {
            const event = await this.log.shift();
            clearTimeout(timeout);
            res(event);
        });
        return Promise.race([p, t]);
    }

    async expect(expected: Event, timeoutMs=this.timeoutMs) {
        const actual = await this.next(timeoutMs);
        if (Event.equals(actual, expected)) return;
        throw new Error(`Expected:\n${JSON.stringify(expected)}\nreceived:\n${JSON.stringify(actual)}`);
    }
}
