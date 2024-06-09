import { BasePlugin, Event } from "../lib";

const PROMPT_DEFAULT = "If you're reading this, the prompts engine isn't working yet. Just write whatever you like.";
const PROMPTS = [] as string[];

enum Phase { Idle, Joining, Prompts, Judging };

type Player = {
    id: string;
    name: string;
    currentBit?: number;
    done?: boolean;
};

type Bit = {
    prompt: string;
    players: Player[];
    responses: { player: Player, text: string }[];
};

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
    
    handleCommand(event: Event.Input, args: string[]) {
        if (this.phase === Phase.Idle) return;
        if (args[0] === 'join') return this.handleJoin(event, args);
        if (args[0] === 'play') return this.handlePlay(event, args);
        if (args[0] === 'submit') return this.handleSubmit(event, args);
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
        const bit = this.bits.pop()!;
        this.write(
            bit.prompt + '\n'
            + bit.responses.map((v, i) => `${i}. ${v.text}\n`).join('')
            + '(TODO: Count votes or something here)'
        );
        // TODO: count votes or something here

        if (this.bits.length) {
            this.write('---');
            this.judgeNextBit();
            return;
        }

        this.write("---\nThat's all, folks!");
        this.phase = Phase.Idle;
    }
}
