import type { Privmsg } from '../privmsg.js';

export interface Events {
  RawMessage: [message: string];
  RawSend: [message: string];
  Privmsg: [privmsg: Privmsg];
  Ping: [];
}
