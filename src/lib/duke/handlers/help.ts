import { Duke } from '../duke';
import { CommandHandler } from './CommandHandler';
import { PrivmsgCommand } from '../privmsgCommand';

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
    const commandName = command.command.toLowerCase();

    const selectedCommand = duke.commandHandlers.find(
      (h) => h.commandName === commandName,
    );

    if (!selectedCommand) {
      await command.privmsg.reply(
        `Unknown command '${commandName}'. Available commands: ${duke.commandHandlers.map((h) => h.commandName).join(', ')}.`,
      );

      return;
    }
  }
}
