import mongoose from 'mongoose';
import { Player, playerModel } from '../../database/models/player.model.js';
import { Duke } from '../duke.js';
import { CommandHandler } from './CommandHandler.js';
import { PrivmsgCommand } from '../privmsgCommand.js';
import { formatPlayerSkills, lookup } from './lookup.js';
import { Err, Result } from '../../../types/result.type.js';
import { ircUserModel } from '../../database/models/ircuser.model.js';

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

  async register(duke: Duke, command: PrivmsgCommand): Promise<Result<Player>> {
    if (command.params.length === 0) {
      return Err('Usage: !register <username>.');
    }

    const result = await lookup(command.params.join(' '));

    if (result.type === 'error') {
      return result;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const playerData = result.data!;

    try {
      const _playerModel = playerModel(mongoose);
      if (!(await _playerModel.findOne({ name: command.params.join(' ') }))) {
        await new _playerModel(playerData).save();
      }

      const _ircUserModel = ircUserModel(mongoose);
      let ircUser = await _ircUserModel.findOne({
        nick: command.privmsg.sender.nickname,
      });

      if (!ircUser) {
        ircUser = await new _ircUserModel({
          nick: command.privmsg.sender.nickname,
          players: [],
          mustIdentify: false,
        }).save();
      }

      // ircUser.players.push(player.id);
      await ircUser.save();

      return result;
    } catch (error) {
      console.error(error);

      return Err('An unknown error occurred.');
    }
  }
}
