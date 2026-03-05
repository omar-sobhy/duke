import { OpenRouter } from '@openrouter/sdk';
import { Client } from '../irc/framework/client.js';
import { Privmsg } from '../irc/privmsg.js';
import { RootConfig } from './config.js';
import { lookup, LookupHandler } from './handlers/lookup.js';
import { PrivmsgCommand } from './privmsgCommand.js';
import { RegisterHandler } from './handlers/register.js';
import { Colour, FormattingBuilder } from '../irc/formatting.js';
import { SourceHandler } from './handlers/source.js';
import { CommandHandler } from './handlers/CommandHandler.js';
import { ChatHandler } from './handlers/chat.js';
import { HelpHandler } from './handlers/help.js';
import { PermissionHandler } from './handlers/permission.js';
import schedule from 'node-schedule';
import { RefreshHandler } from './handlers/refresh.js';
import { Knex } from 'knex';
import type { Logger } from 'winston';

export interface DukeConfig extends RootConfig {
  database: Knex;
  logger: Logger;
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
      RefreshHandler,
    ].map((h) => new h(this));

    this.openRouter = new OpenRouter({
      apiKey: this.config.openRouterKey,
    });
  }

  public async connect() {
    this.clients.forEach(async (c) => {
      c.on('RawMessage', (message) => {
        this.config.logger.info(message, 'incoming_message');
      });

      c.on('RawSend', (message) => {
        this.config.logger.info(message, 'outgoing_message');
      });

      c.on('Privmsg', (p) => this.privmsgListener(p));

      await c.connect();
    });

    schedule.scheduleJob(
      {
        minute: 31,
      },
      () => this.fetchAndSendUsers(),
    );

    schedule.scheduleJob({ minute: 1 }, () => this.fetchAndSendUsers());
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

  public async fetchAndSendUsers() {
    const transaction = await this.config.database.transaction();

    const players = await transaction('players').select('*');

    for (const player of players) {
      const result = await lookup(player.name);

      if (result.type === 'error') {
        this.config.logger.error(result.data);
        continue;
      }

      this.config.logger.info(`fetched ${player.name}`);

      const skills = await transaction('skills').where('playerId', player.id).select('*');

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

      const builder = new FormattingBuilder('').colour(player.name, Colour.RED);

      Object.keys(skillsMap).forEach((s) => {
        const currentSkill = skills.find((currentSkill) => currentSkill.skillName === s);

        const next = result.data?.skills.find((newSkill) => newSkill.skillName === s);

        if (!next) {
          return;
        }

        const emojii = skillsMap[s];

        if (!currentSkill) {
          updated = true;
          builder
            .normal(' :: ')
            .normal(`${emojii} `)
            .colour(next.level, Colour.GREEN)
            .colour(` (+${next.xp} XP) `, Colour.LIGHT_GREEN);
        } else if (currentSkill.xp !== next.xp) {
          updated = true;

          const diff =
            Number(next.xp.replaceAll(',', '')) - Number(currentSkill.xp.replaceAll(',', '') ?? 0);

          const level = next.level;

          builder
            .normal(' :: ')
            .normal(`${emojii} `)
            .colour(level, Colour.GREEN)
            .colour(` (+${diff.toFixed()} XP) `, Colour.LIGHT_GREEN);
        }
      });

      for (const skill of result.data?.skills ?? []) {
        await transaction('skills')
          .insert({
            playerId: player.id,
            skillName: skill.skillName,
            level: skill.level,
            xp: skill.xp,
          })
          .onConflict(['playerId', 'skillName'])
          .merge();
      }

      await transaction.commit();

      this.clients.forEach((c) => {
        if (updated) {
          // TODO: don't hardcode channel
          c.writeRaw(`PRIVMSG #trollhour :${builder.text}`);
        }
      });
    }
  }
}
