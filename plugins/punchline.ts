import { BasePlugin, Event } from "../lib";

const PROMPT_DEFAULT = "If you're reading this, the prompts engine isn't working yet. Just write whatever you like.";
const PROMPTS = [
    'Why did the chicken cross the road?',
    'How many librarians does it take to change a lightbulb?',
    "What's the worst thing to find under your bed?",
    "I might be wrong, but at least I'm not ____.",
    "What's the political party that nobody asked for?",
    "*slaps you around with a large ____*",
    "If I couldn't be a furry, what would I be instead?",
    "Don't talk to me until I've had my morning ____.",
    "What's an important source of fiber?",
    "How do I make a cake?",
    "What's a question whose answer is NOT 'soup'?",
] as string[];

type Bit = {
    prompt: string;
    players: Player[];
    responses: { player: Player, text: string }[];
};

enum Phase { Idle, Joining, Prompts, Judging };

type Player = {
    id: string;
    name: string;
    currentBit?: number;
    done?: boolean;
};

type Vote = {
    playerId: string;
    choice: number;
}

function shuffle<T>(items: T[]) {
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = items[i];
        items[i] = items[j];
        items[j] = t;
    }
}

function makeGroups<T>(count: number, size: number, items: T[]) {
    const pool = [] as T[];
    while (pool.length < count * size) {
        pool.push(...items);
    }
    shuffle(pool);
    const groups = [] as T[][];
    while (pool.length) {
        const item = pool.pop()!;
        let used = false;
        for (const g of groups) {
            if (g.length >= size) continue;
            if (g.includes(item)) continue;
            g.push(item);
            used = true;
            break;
        }
        if (used) continue;

        groups.push([item]);
        if (groups.length <= count) continue;

        throw new Error(`Can't make ${count} groups of ${size} from ${items.length} unique items!`);
    }
    return groups;
}

export class Punchline extends BasePlugin {
    id = 'punchline';
    phase = Phase.Idle;
    bits = [] as Bit[];
    players = [] as Player[];
    prompts = [] as string[];
    votes = [] as Vote[];
    
    handleCommand(event: Event.Input, args: string[]) {
        if (this.phase === Phase.Idle) return;
        if (args[0] === 'join') return this.handleJoin(event, args);
        if (args[0] === 'play') return this.handlePlay(event, args);
        if (args[0] === 'submit') return this.handleSubmit(event, args);
        if (args[0] === 'vote') return this.handleVote(event, args);
        if (args[0] === 'count') return this.handleCount(event, args);
    }

    start() {
        if (this.phase !== Phase.Idle) return false;
        this.players = [];
        this.prompts = [ ...PROMPTS ];
        shuffle(this.prompts);
        this.write('Game started, waiting for players (!join)')
        this.phase = Phase.Joining;
        return true;
    }

    stop() {
        this.write('Game cancelled.');
        this.phase = Phase.Idle;
        return true;
    }

    handleJoin(event: Event.Input, args: string[]) {
        if (this.phase !== Phase.Joining) return;
        if (!event.room) return;
        if (args.length !== 1) return;
        const player = {
            id: event.user,
            name: event.user,
        };
        this.players.push(player);
        const textPlayers = (this.players.length === 1) ? 'player' : 'players';
        this.write(
            `${player.name} joined! There are ${this.players.length} ${textPlayers}. Start game with !play.`
        );
    }

    handlePlay(event: Event.Input, args: string[]) {
        if (this.phase !== Phase.Joining) return;
        if (!event.room) return;
        if (args.length !== 1) return;

        // Generate prompts
        const groups = makeGroups(this.players.length, 2, this.players);
        this.bits = groups.map(group => ({
            prompt: this.prompts.pop() ?? PROMPT_DEFAULT,
            players: group,
            responses: [],
        }));
        this.write(`Game started! Sending out 2 prompts each...`);
        for (const p of this.players) {
            p.done = false;
            p.currentBit = -1;
            this.sendNextPrompt(p);
        }
        this.phase = Phase.Prompts;
    }

    sendNextPrompt(p: Player) {
        const first = p.currentBit! + 1;
        const i = (this.bits
            .slice(first)
            .findIndex(b => b.players.includes(p))
        );
        if (i < 0) {
            return false;
        }
        p.currentBit = first + i;
        this.writePriv(
            'Answer with !submit <text>.\n'
            + `${this.bits[first + i].prompt}`,
            p.id,
        );
        return true;
    }

    handleSubmit(event: Event.Input, args: string[]) {
        if (this.phase !== Phase.Prompts) return;
        if (event.room) return;
        if (args.length < 2) return;
        const player = this.players.find(p => event.user === p.id);
        if (!player) return;

        // Record new punchline for the current bit.
        const text = event.text.slice(args[0].length).trim();
        const bit = this.bits[player.currentBit!];
        bit.responses.push({ player, text });
        
        // If there are more prompts, repeat.
        const sent = this.sendNextPrompt(player);
        if (sent) return;

        // No more prompts for player -- is everyone done?
        this.reply(event, 'Thanks for your input!');
        player.done = true;
        if (!this.players.every(p => p.done)) return;

        // All players done.
        this.write("All responses collected!");
        this.phase = Phase.Judging;
        this.judgeNextBit();
    }

    judgeNextBit() {
        const bit = this.bits[0];
        this.votes = [];
        this.write(
            bit.prompt + '\n'
            + bit.responses.map((v, i) => `${i+1}. ${v.text}\n`).join('')
            + 'Vote for your favorite in DMs with !vote <number>.'
        );
    }

    handleVote(event: Event.Input, args: string[]) {
        if (this.phase !== Phase.Judging) return;
        if (event.room) return;
        if (args.length !== 2) return;
        const player = this.players.find(p => p.id === event.user);
        if (!player) return;
        if (this.votes.find(v => v.playerId === player.id)) {
            this.reply(event, 'Your vote has already been counted!');
            return;
        }
        const i = parseInt(args[1]);
        if (isNaN(i) || !(i-1 in this.bits[0].responses)) {
            this.reply(event, `${i} is not one of the choices.`);
            return;
        }
        this.votes.push({ playerId: player.id, choice: i });
        this.reply(event, 'Thank you for voting!');
        this.write(`${player.name} has voted! End voting with !count.`);
    }

    handleCount(event: Event.Input, args: string[]) {
        if (this.phase !== Phase.Judging) return;
        if (!event.room) return;
        if (args.length !== 1) return;
        const results = this.bits[0].responses.map((r, i) => {
            const { player, text } = r;
            const sum = this.votes.filter((v) => v.choice === i+1).length;
            return { player, text, sum };
        });
        results.sort((a, b) => b.sum - a.sum);
        this.write(
            'Results:\n'
            + results.map((r) => `${r.sum} - <${r.player.name}> ${r.text}\n`).join('')
            + '---'
        );
        
        this.bits.shift();
        if (this.bits.length) {
            this.judgeNextBit();
            return;
        }

        this.write("That's all, folks!\n");
        this.phase = Phase.Idle;
    }
}
