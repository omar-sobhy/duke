import { Prefix } from './prefix.js';

interface MessageOptions {
  readonly command: string;
  readonly params?: string[];
  readonly trailing?: string;
  prefix?: Prefix;
}

export class Message {
  public readonly command: string;
  public readonly params?: string[];
  public readonly trailing?: string;
  public prefix?: Prefix;

  private constructor(options: MessageOptions) {
    this.prefix = options.prefix;
    this.command = options.command;
    this.params = options.params;
    this.trailing = options.trailing;
  }

  public static parse(rawMessage: string) {
    const data = rawMessage.split(' ');

    let prefix: Prefix | undefined = undefined;
    let command: string;
    let params: string[] | undefined = undefined;
    let trailing: string | undefined = undefined;

    if (rawMessage.startsWith(':')) {
      prefix = Prefix.parse(data[0]);

      command = data[1];

      if (data.length > 2) {
        const rawParamsIndex = rawMessage.substring(1).indexOf(':');

        const rawParams = rawMessage.substring(rawParamsIndex + 1);

        const trailingIndex = rawParams.indexOf(':');

        if (trailingIndex !== -1) {
          params = rawParams.substring(0, trailingIndex).split(' ');
          trailing = rawParams.substring(trailingIndex);
        } else {
          params = rawParams.split(' ');
        }
      }
    } else {
      command = data[0];
    }

    return new Message({
      command,
      params,
      prefix,
      trailing,
    });
  }
}
