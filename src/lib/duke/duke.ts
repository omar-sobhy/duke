import mongoose, { Mongoose } from 'mongoose';
import { OpenRouter } from '@openrouter/sdk';
import { Client } from '../irc/framework/client.js';
import { Privmsg } from '../irc/privmsg.js';
import { RootConfig } from './config.js';
import { lookup, LookupHandler } from './handlers/lookup.js';
import { PrivmsgCommand } from './privmsgCommand.js';
import { RegisterHandler } from './handlers/register.js';
import { playerModel } from '../database/models/player.model.js';
import { Colour, FormattingBuilder } from '../irc/formatting.js';
import { SourceHandler } from './handlers/source.js';
import { CommandHandler } from './handlers/CommandHandler.js';
import { ChatHandler } from './handlers/chat.js';
import { HelpHandler } from './handlers/help.js';
import { PermissionHandler } from './handlers/permission.js';

export interface DukeConfig extends RootConfig {
  database: Mongoose;
}

export class Duke {
  public clients: Client[];

  public readonly commandHandlers: CommandHandler[] = [];

  public readonly openRouter: OpenRouter | null = null;

  constructor(public readonly config: DukeConfig) {
    this.clients = config.clients.map((c) => {
      return new Client(c);
    });

    // TODO refactor to dynamic import
    this.commandHandlers = [
      LookupHandler,
      RegisterHandler,
      SourceHandler,
      ChatHandler,
      HelpHandler,
      PermissionHandler,
    ].map((h) => new h(this));

    this.openRouter = new OpenRouter({
      apiKey: this.config.openRouterKey,
    });
  }

  public async connect() {
    this.clients.forEach(async (c) => {
      c.on('RawMessage', (message) => {
        console.log(`<<< ${message}`);
      });

      c.on('RawSend', (message) => {
        console.log(`>>> ${message}`);
      });

      c.on('Privmsg', (p) => this.privmsgListener(p));

      await c.connect();
    });
  }

  private async privmsgListener(privmsg: Privmsg) {
    const data = privmsg.text.split(' ');

    const first = data[0].toLowerCase();
    const prefix = this.config.privmsgCommandPrefix.toLowerCase();

    const nickname = privmsg.client.getNickname().toLowerCase();

    const regex = new RegExp(`^${nickname}[:,]?$`);

    if (first.startsWith(prefix)) {
      const command = data[0].substring(prefix.length);
      const params = privmsg.text.substring(first.length).trim().split(/\s+/);
      if (params[0] === '') {
        params.shift();
      }

      const privmsgCommand = new PrivmsgCommand(privmsg, command, params);

      this.commandHandlers.forEach(async (h) => {
        if (await h.match(this, privmsgCommand)) {
          const permitted = await h.checkPermission(this, privmsgCommand);
          if (!permitted) {
            privmsgCommand.privmsg.reply('Insufficient permissions.');
            return;
          }

          h.handle(this, privmsgCommand);
        }
      });

      return;
    }

    const match = first.match(regex);
    if (!match) {
      return;
    }

    const command = 'chat';
    const params = privmsg.text.substring(match[0].length).trim().split(/s+/);
    if (params[0] === '') {
      params.shift();
    }

    const privmsgCommand = new PrivmsgCommand(privmsg, command, params);

    const handler = this.commandHandlers.find((h) => h.commandName === 'chat');

    handler?.handle(this, privmsgCommand);
  }

  private async fetchAndSendUsers() {
    const playerModel_ = playerModel(mongoose);

    const players = await playerModel_.find();

    console.log('--- Fetching...');

    players
      .filter((p) => !!p)
      .forEach(async (p) => {
        const result = await lookup(p.name);

        if (result.type === 'error') {
          console.error(result);
          return;
        }

        console.log(`--- Fetched ${result.data?.name} ---`);

        const currentSkills = p.skills;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const newSkills = result.data!.skills;

        const skillsMap: Record<string, string> = {
          Attack: '⚔️',
          Defence: '🛡️',
          Strength: '💪',
          Hitpoints: '♥️',
          Ranged: '🏹',
          Prayer: '⛪',
          Magic: '🧙',
          Cooking: '🍳',
          Woodcutting: '🪓',
          Fishing: '🐟',
          Firemaking: '🔥',
          Crafting: '⚒️',
          Smithing: '🔨',
          Mining: '⛏️',
          Runecrafting: '⚡',
          Fletching: '🪶',
          Agility: '🏃',
          Herblore: '🌿',
          Thieving: '💰',
        };

        let updated = false;

        const builder = new FormattingBuilder('').colour(p.name, Colour.RED);

        Object.keys(skillsMap).forEach((s) => {
          const current = currentSkills.find((currentSkill) => currentSkill.skillName === s);

          const next = newSkills.find((newSkill) => newSkill.skillName === s);

          const emojii = skillsMap[s];

          if (!current && next) {
            updated = true;

            builder
              .normal(' :: ')
              .normal(`${emojii} `)
              .colour(next.level, Colour.GREEN)
              .colour(` (+${next.xp} XP) `, Colour.LIGHT_GREEN);
          } else if (current?.xp !== next?.xp) {
            updated = true;

            const diff =
              Number(next?.xp.replaceAll(',', '')) - Number(current?.xp.replaceAll(',', '') ?? 0);

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const level = next!.level;

            builder
              .normal(' :: ')
              .normal(`${emojii} `)
              .colour(level, Colour.GREEN)
              .colour(` (+${diff.toFixed()} XP) `, Colour.LIGHT_GREEN);
          }
        });

        p.skills = newSkills;

        this.clients.forEach((c) => {
          if (updated) {
            c.writeRaw(`PRIVMSG #trollhour :${builder.text}`);
          }
        });

        p.save();
      });
  }
}
