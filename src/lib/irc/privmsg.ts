import { Err, Ok, Result } from '../../types/result.type.js';
import { Client } from './framework/client.js';
import { Commands } from './framework/commands.js';
import { Message } from './framework/message/message.js';
import { Prefix } from './framework/message/prefix.js';

export class Privmsg {
  private constructor(
    public readonly client: Client,
    public readonly sender: Prefix,
    public readonly target: string,
    public readonly text: string,
  ) {}

  public static parse(message: Message, client: Client): Result<Privmsg> {
    if (message.command !== Commands.PRIVMSG) {
      return Err(`Message '${message.command}' is not a PRIVMSG.`);
    }

    if (!message.prefix || !message.params || !message.trailing) {
      return Err('Attempted to parse malformed message into a Privmsg.');
    }

    return Ok(
      new Privmsg(client, message.prefix, message.params[0], message.trailing),
    );
  }

  public async reply(text: string): Promise<Result> {
    const messages = text.split('\n');

    for (const line of messages) {
      const sublines = line.match(/.{1,256}/g);
      if (sublines) {
        for (const subline of sublines) {
          await this.client.writeRaw(`PRIVMSG ${this.target} :${subline}`);
        }
      }
    }

    return Ok();
  }
}
