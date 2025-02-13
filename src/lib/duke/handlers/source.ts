import { CommandHandler, Duke } from '../duke.js';
import { PrivmsgCommand } from '../privmsgCommand.js';

export class SourceHandler implements CommandHandler {
  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === 'source';
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    command.privmsg.reply('https://github.com/omar-sobhy/duke');
  }
}
