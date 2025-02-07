import { Message } from './lib/irc/message.js';

const messages = [
  ':rizon NICK 23',
  ':hik!hikilaka@asdf.com PRIVMSG #trollhour :testing 123 abc xyz :a',
];

messages.forEach((m) => {
  const msg = Message.parse(m);
  console.log(msg);
});
