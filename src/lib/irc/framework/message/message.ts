import { Client } from '../client.js';
import { Prefix } from './prefix.js';

interface MessageOptions {
  readonly command: string;
  readonly params: string[];
  readonly trailing?: string;
  prefix?: Prefix;
  client: Client;
}

export class Message {
  public readonly command: string;
  public readonly params: string[];
  public readonly trailing?: string;
  public readonly prefix?: Prefix;
  public readonly client: Client;

  private constructor(options: MessageOptions) {
    this.prefix = options.prefix;
    this.command = options.command;
    this.params = options.params;
    this.trailing = options.trailing;
    this.client = options.client;
  }

  public static parse(rawMessage: string, client: Client) {
    const data = rawMessage.split(' ');

    let prefix: Prefix | undefined = undefined;
    let command: string;
    let params: string[] | undefined = undefined;
    let trailing: string | undefined = undefined;

    if (rawMessage.startsWith(':')) {
      prefix = Prefix.parse(data[0]);

      command = data[1];
    } else {
      command = data[0];
    }

    rawMessage = rawMessage.substring(
      rawMessage.indexOf(command) + command.length + 1,
    );

    const index = rawMessage.indexOf(':');
    if (index !== -1) {
      trailing = rawMessage.substring(index + 1);
      const paramsSubstring = rawMessage.substring(0, index).trim();

      params = paramsSubstring.length === 0 ? [] : paramsSubstring.split(' ');
    } else {
      params = rawMessage.split(' ');
    }

    return new Message({
      command,
      params,
      prefix,
      trailing,
      client,
    });
  }
}
