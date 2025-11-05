import { Privmsg } from '../irc/privmsg.js';
/**
 * A chat command issued via privmsg.
 *
 * Chat commands are prefixed with a special character (e.g., '!chat').
 * The prefix is configured in `config.json`.
 */
export class PrivmsgCommand {
  /**
   *
   * @param privmsg The privmsg.
   * @param command The command name.
   * @param params The command parameters, i.e., the text after the command name.
   */
  constructor(
    public readonly privmsg: Privmsg,
    public readonly command: string,
    public readonly params: string[],
  ) {}
}
