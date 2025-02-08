import { describe, expect, test } from '@jest/globals';
import { Message } from '../src/lib/irc/framework/message/message.js';
import { Commands } from '../src/lib/irc/framework/commands.js';
import { Client } from '../src/lib/irc/index.js';

describe('message parsing', () => {
  const client = new Client({
    host: 'dummy',
    port: 6667,
    serverName: 'dummy',
  });

  test('PING :714425614', () => {
    const parsed = Message.parse('PING :714425614', client);

    expect(parsed).toMatchObject({
      command: Commands.PING,
      prefix: undefined,
      params: [],
      trailing: '714425614',
    });
  });

  test(':Angel!wings@irc.org PRIVMSG Wiz :Are you receiving this message ?', () => {
    const parsed = Message.parse(
      ':Angel!wings@irc.org PRIVMSG Wiz :Are you receiving this message ?',
      client,
    );

    expect(parsed.prefix).toMatchObject({
      serverName: undefined,
      nickname: 'Angel',
      user: 'wings',
      host: 'irc.org',
    });

    expect(parsed).toMatchObject({
      command: Commands.PRIVMSG,
      prefix: {
        serverName: undefined,
        nickname: 'Angel',
        user: 'wings',
        host: 'irc.org',
      },
      params: ['Wiz'],
      trailing: 'Are you receiving this message ?',
    });
  });
});
