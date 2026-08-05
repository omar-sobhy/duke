import type { Duke } from '../duke.js';
import type { PrivmsgCommand } from '../privmsgCommand.js';
import { CommandHandler } from './CommandHandler.js';
import { fetchPlayerXp } from '../modules/hiscores/xp.js';
import { Colour, FormattingBuilder } from '../../irc/formatting.js';

export class XpHandler extends CommandHandler {
  public override readonly commandName = 'xp';

  help(): string {
    const prefix = `${this.duke.config.privmsgCommandPrefix}${this.commandName}`;
    return `${prefix} <skill> <player>`;
  }

  async match(duke: Duke, command: PrivmsgCommand): Promise<boolean> {
    return command.command.toLowerCase() === this.commandName;
  }

  async handle(duke: Duke, command: PrivmsgCommand): Promise<void> {
    if (command.params.length < 2) {
      return void command.privmsg.reply(`Usage: ${this.help()}`);
    }

    const [skillName, ...rest] = command.params;
    const playerName = rest.join(' ');

    const result = await fetchPlayerXp(skillName, playerName);

    if (result.type === 'error') {
      duke.config.logger.error(result);
      return void command.privmsg.reply(result.message);
    }

    const { skillName: name, level, xp } = result.data;

    const formatted = new FormattingBuilder('')
      .colour(`${playerName} `, Colour.RED)
      .normal(':: ')
      .colour(name, Colour.BLUE)
      .normal(` level ${level}, ${new Intl.NumberFormat('en-US').format(xp)} xp`).text;

    command.privmsg.reply(formatted);
  }
}
