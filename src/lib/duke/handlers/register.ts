import { Duke } from '../duke.js';
import { CommandHandler } from './CommandHandler.js';
import { PrivmsgCommand } from '../privmsgCommand.js';
import { formatPlayerSkills, lookup, type PlayerApiResponse } from './lookup.js';
import { Err, Result } from '../../../types/result.type.js';

export class RegisterHandler extends CommandHandler {
  help(): string {
    const p = this.duke.config.privmsgCommandPrefix;

    return `Registers your in-game username with your IRC nickname. Usage: ${p}register <username>.`;
  }

  public readonly commandName = 'register';

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === this.commandName;
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    const result = await this.register(duke, command);

    if (result.type === 'error') {
      command.privmsg.reply(result.message);

      return;
    }

    await command.privmsg.reply('Ok.');

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    command.privmsg.reply(formatPlayerSkills(result.data!));
  }

  async register(duke: Duke, command: PrivmsgCommand): Promise<Result<PlayerApiResponse>> {
    if (command.params.length === 0) {
      const p = this.duke.config.privmsgCommandPrefix;

      return Err(`Usage: ${p}register <username>.`);
    }

    const result = await lookup(command.params.join(' '));

    if (result.type === 'error') {
      return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const playerData = result.data!;

    const transaction = await duke.config.database.transaction();

    try {
      const existing = await transaction('players').where({ name: playerData.name }).first();

      if (!existing) {
        const player = (
          await transaction('players').insert(
            {
              name: playerData.name,
            },
            '*',
          )
        )[0];

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
      }

      await transaction.commit();

      return result;
    } catch (error) {
      console.error(error);

      await transaction.rollback();

      return Err('An unknown error occurred.');
    }
  }
}
