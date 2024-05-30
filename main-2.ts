type Message = {
    user: string;
    room: string;
    text: string;
}

type Quote = {
    user: string;
    room: string;
    text: string;
}

type Actor = {
    write: (text: string) => void;
}

export class QuoteBot {
    actor: Actor;
    memory: Quote[] = [];

    constructor(actor: Actor) {
        this.actor = actor;
    }

    handle(e: Message) {
        this.remember(e.user, e.room, e.text);
        const args = e.text.split(/\s+/);
        if (args[0] === 'recall') {
            if (args.length !== 2) {
                this.actor.write('usage: recall <word>');
                return;
            }
            const quote = this.recall(args[1]);
            if (!quote) {
                this.actor.write(`I have no memories of ${args[1]}.`);
                return;
            }
            this.actor.write(`${quote.user} said: ${quote.text}`);
        }
    }

    remember(user: string, room: string, text: string ) {
        this.memory.push({ user, room, text });
    }

    recall(word: string) {
        const quote = this.memory.find(q => q.text.includes(word));
        return quote;
    }
}

function main() {
    const chatlog: string[] = [];
    const actor = { 
        write: (text: string) => chatlog.push(text),
    }
    const bot = new QuoteBot(actor);
    bot.handle({ user: 'alice', room: 'general', text: 'i ate a donut today' });
    bot.handle({ user: 'bob', room: 'general', text: 'what flavor was it? '});
    bot.handle({ user: 'alice', room: 'general', text: 'recall donut' });
    console.log(chatlog);
}

main();
