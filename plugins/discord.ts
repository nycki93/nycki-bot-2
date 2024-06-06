import { Client, Events, GatewayIntentBits, TextChannel, userMention } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import { Event, BasePlugin } from '../lib';

type Config = {
    prefix: string;
    token: string;
    channel: string;
};

const DEFAULT_CONFIG = {
    prefix: '!',
    token: '',
    channel: '',
};

function readWriteConfig(path = 'config.json') {
    let config: Config;
    try {
        const data = readFileSync(path, { encoding: 'utf-8' });
        config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch {
        console.log("[discord] Can't read config! Using defaults.");
        config = DEFAULT_CONFIG;
    }
    writeFileSync(path, JSON.stringify(config, null, 2));
    return config;
}

export class DiscordPlugin extends BasePlugin {
    config: Config;
    client: Client;
    channel?: TextChannel;

    constructor() {
        super();
        this.config = readWriteConfig();
        this.client = new Client({ intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ]});
    }

    async init() {
        this.client.once(Events.ClientReady, async (c) => {
            console.log(`[discord] connected as ${c.user.tag}`);
            const ch = await c.channels.fetch(this.config.channel);
            if (!ch?.isTextBased) {
                console.log("[discord] can't connect to non-text channel");
                return;
            }
            this.channel = ch as TextChannel;
            this.write('[discord] app started.');
        });

        this.client.on(Events.MessageCreate, (m) => {
            if (!m.content.startsWith(this.config.prefix)) return;
            const text = m.content.slice(this.config.prefix.length);
            const user = userMention(m.author.id);
            this.input(user, text);
        });

        await this.client.login(this.config.token);
    }

    async send(action: Event) {
        if (action.type === Event.INPUT) {
            if (action.source === this.constructor.name) return;
            await this.channel?.send(`<${action.user}> ${action.text}`);
        }
        if (action.type === Event.WRITE) {
            if (!this.channel) {
                console.log('[discord] error: unable to write to channel');
                return;
            }
            await this.channel.send(action.text);
        }
    }
}
