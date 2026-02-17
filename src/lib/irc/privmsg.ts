import { Err, Ok, Result } from '../../types/result.type.js';
import { Client } from './framework/client.js';
import { Commands } from './framework/commands.js';
import { Message } from './framework/message/message.js';
import { Prefix } from './framework/message/prefix.js';

/**
 * A PRIVMSG command
 */
export class Privmsg {
  private constructor(
    /**
     * The client that received the message
     */
    public readonly client: Client,

    /**
     * The prefix of the sender of the message
     */
    public readonly sender: Prefix,

    /**
     * The target of the message (channel or user)
     */
    public readonly target: string,

    /**
     * The text of the message
     *
     * This is the text after the raw PRIVMSG command that would be displayed
     * to users by their clients
     */
    public readonly text: string,

    /**
     * The raw message that was received
     */
    public readonly message: Message,
  ) { }

  /**
   * Attempts to parse a message into a Privmsg
   *
   * @param message The message to parse
   * @param client The client that received the message
   *
   * @returns Success<Privmsg> if the message is a valid PRIVMSG, otherwise Failure<string>
   */
  public static parse(message: Message, client: Client): Result<Privmsg> {
    if (message.command !== Commands.PRIVMSG) {
      return Err(`Message '${message.command}' is not a PRIVMSG.`);
    }

    if (!message.prefix || !message.params || !message.trailing) {
      return Err('Attempted to parse malformed message into a Privmsg.');
    }

    return Ok(new Privmsg(client, message.prefix, message.params[0], message.trailing, message));
  }

  public async reply(text: string): Promise<Result> {
    const messages = text.split('\n');

    const prefixLength = `PRIVMSG ${this.target} :`.length;

    const maxMessageLength = 512 - prefixLength - 2;

    const regex = new RegExp(`.{1,${maxMessageLength}}`, 'g');

    const target = this.target === this.client.getNickname() ? this.sender.nickname : this.target;

    for (const line of messages) {
      const sublines = line.match(regex);
      if (sublines) {
        for (const subline of sublines) {
          await this.client.writeRaw(`PRIVMSG ${target} :${subline}`, { throttle: true });
        }
      }
    }

    return Ok();
  }
}
