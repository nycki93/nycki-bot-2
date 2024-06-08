import { BasePlugin, Event } from "../lib";

enum Phase { Idle, Nominating, Voting };

type Player = {
    name: string;
    choice: number[];
}

export class Vote extends BasePlugin {
    id = 'vote';
    phase = Phase.Idle;
    choices = [] as string[];
    players = {} as Record<string, Player>;

    handleCommand(event: Event.Input, args: string[]): void {
        if (this.phase === Phase.Idle) return;
        if (args[0] === 'nominate') return this.handleNominate(event, args);
        if (args[0] === 'election') return this.handleElection(args);
        if (args[0] === 'vote') return this.handleVote(event, args);
        if (args[0] === 'count') return this.handleCount(args);
    }

    start() {
        if (this.phase !== Phase.Idle) return false;
        this.players = {};
        this.choices = [];
        this.phase = Phase.Nominating;
        this.write('Starting vote! Propose options now (!nominate <value>).');
        return true;
    }

    handleNominate(event: Event.Input, args: string[]) {
        if (this.phase !== Phase.Nominating) return;
        const nominee = event.text.slice(args[0].length).trim();
        this.choices.push(nominee);
        this.write(`Nominated ${nominee}. Add more with !nominate or end with !election.`);
    }

    handleElection(args: string[]) {
        if (this.phase !== Phase.Nominating) return;
        if (args.length !== 1) return;
        if (!this.choices.length) {
            this.write('No nominations! (!nominate <value>)');
            return;
        }
        this.write(
            'The election has begun! Vote with !vote [a] [b] ...\n'
            + this.choices.map((v, i) => `${i+1}: ${v}\n`).join('')
        )
        this.phase = Phase.Voting;
    }

    handleVote(event: Event.Input, args: string[]) {
        if (this.phase !== Phase.Voting) return;
        const p = event.user;
        if (p in this.players) {
            this.reply(event, 'Your vote has already been counted!');
            return;
        }
        const player = { name: p, choice: [] as number[] };
        for (const arg of args.slice(1)) {
            const n = parseInt(arg);
            if (isNaN(n) || !(n-1 in this.choices)) {
                this.reply(event, `${arg} is not one of the choices.`);
                return;
            }
            if (player.choice.includes(n)) {
                this.reply(event, `Cannot vote for ${n} more than once.`);
                return;
            }
            player.choice.push(n);
        }
        this.players[p] = player;
        this.write(`${player.name} has voted! End voting with !count.`);
    }

    handleCount(args: string[]) {
        if (this.phase !== Phase.Voting) return;
        if (args.length !== 1) return;
        const players = Object.values(this.players);
        const results = this.choices.map((value, i) => {
            const sum = players.filter((p) => p.choice.includes(i+1)).length;
            return { value, sum };
        });
        results.sort((a, b) => b.sum - a.sum);
        this.write(
            'Results:\n'
            + results.map((r) => `${r.sum} - ${r.value}\n`).join('')
        );
        this.phase = Phase.Idle;
    }

    stop() {
        this.write('Vote canceled.');
        this.phase = Phase.Idle;
        return true;
    }
}
