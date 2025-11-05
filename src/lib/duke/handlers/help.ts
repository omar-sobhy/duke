import { Duke } from '../duke.js';
import { CommandHandler } from './CommandHandler.js';
import { PrivmsgCommand } from '../privmsgCommand.js';

export class HelpHandler extends CommandHandler {
  help(): string {
    const p = this.duke.config.privmsgCommandPrefix;
    return `Provides help information for commands. Usage: ${p}help [command].`;
  }

  public readonly commandName = 'help';

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === this.commandName;
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    if (command.params.length === 0) {
      await command.privmsg.reply(this.help());
      return;
    }

    const commandName = command.params[0].toLowerCase();

    const selectedCommand = duke.commandHandlers.find(
      (h) => h.commandName === commandName,
    );

    if (!selectedCommand) {
      await command.privmsg.reply(
        `Unknown command '${commandName}'. Available commands: ${duke.commandHandlers.map((h) => h.commandName).join(', ')}.`,
      );

      return;
    }

    await command.privmsg.reply(selectedCommand.help());
  }
}
