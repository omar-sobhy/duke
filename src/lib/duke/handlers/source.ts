import { Duke } from '../duke.js';
import { CommandHandler } from './CommandHandler.js';
import { PrivmsgCommand } from '../privmsgCommand.js';

export class SourceHandler extends CommandHandler {
  help(): string {
    return 'Provides the source code link for Duke.';
  }

  public readonly commandName = 'source';

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === this.commandName;
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    command.privmsg.reply('https://github.com/omar-sobhy/duke');
  }
}
