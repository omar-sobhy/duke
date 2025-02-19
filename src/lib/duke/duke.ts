import mongoose, { Mongoose } from 'mongoose';
import { Client } from '../irc/framework/client.js';
import { Commands } from '../irc/framework/commands.js';
import { Message } from '../irc/framework/message/message.js';
import { Privmsg } from '../irc/privmsg.js';
import { RootConfig } from './config.js';
import { lookup, LookupHandler } from './handlers/lookup.js';
import { PrivmsgCommand } from './privmsgCommand.js';
import { RegisterHandler } from './handlers/register.js';
import { playerModel } from '../database/models/player.model.js';
import { Colour, FormattingBuilder } from '../irc/formatting.js';
import { SourceHandler } from './handlers/source.js';
import schedule from 'node-schedule';

export interface CommandHandler {
  match(duke: Duke, command: PrivmsgCommand): Promise<boolean>;
  handle(duke: Duke, command: PrivmsgCommand): Promise<void>;
}

export interface DukeConfig extends RootConfig {
  database: Mongoose;
}

export class Duke {
  public clients: Client[];

  private commandHandlers: CommandHandler[] = [];

  constructor(public readonly config: DukeConfig) {
    this.clients = config.clients.map((c) => {
      return new Client(c);
    });

    this.commandHandlers = [LookupHandler, RegisterHandler, SourceHandler].map(
      (h) => new h(),
    );
  }

  public async connect() {
    this.clients.forEach(async (c) => {
      c.on('RawMessage', (message) => {
        console.log(`<<< ${message}`);

        const parsedMessage = Message.parse(message, c);

        if (parsedMessage.command === Commands.PRIVMSG.toString()) {
          const privmsgResult = Privmsg.parse(parsedMessage, c);

          if (privmsgResult.type === 'success') {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const privmsg = privmsgResult.data!;

            if (privmsg.text.startsWith(this.config.privmsgCommandPrefix)) {
              const data = privmsg.text.split(' ');

              const command = data[0].substring(1);
              const params = data.slice(1);

              const privmsgCommand = new PrivmsgCommand(
                privmsg,
                command,
                params,
              );

              this.commandHandlers.forEach(async (h) => {
                if (await h.match(this, privmsgCommand)) {
                  h.handle(this, privmsgCommand);
                }
              });
            }
          }
        }
      });

      c.on('RawSend', (message) => {
        console.log(`>>> ${message}`);
      });

      await c.connect();

      schedule.scheduleJob(
        {
          minute: 31,
        },
        this.fetchAndSendUsers,
      );

      schedule.scheduleJob({ minute: 1 }, this.fetchAndSendUsers);
    });
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

        console.log(`--- Fetched ${result.data?.name}`);

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
          Runecrafting: '🔁',
        };

        let updated = false;

        const builder = new FormattingBuilder('').colour(p.name, Colour.RED);

        Object.keys(skillsMap).forEach((s) => {
          const current = currentSkills.find(
            (currentSkill) => currentSkill.skillName === s,
          );

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
              Number(next?.xp.replaceAll(',', '')) -
              Number(current?.xp.replaceAll(',', '') ?? 0);

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const level = next!.level;

            builder
              .normal(' :: ')
              .normal(`${emojii} `)
              .colour(level, Colour.GREEN)
              .colour(` (+${diff.toFixed(2)} XP) `, Colour.LIGHT_GREEN);
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
