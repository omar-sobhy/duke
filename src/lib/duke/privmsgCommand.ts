import { Privmsg } from '../irc/privmsg.js';

export class PrivmsgCommand {
  constructor(
    public readonly privmsg: Privmsg,
    public readonly command: string,
    public readonly params: string[],
  ) {}
}
