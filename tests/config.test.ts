import { describe, expect, it } from '@jest/globals';
import { configSchema, RootConfig } from '../src/lib/duke/config.js';

const config: RootConfig = {
  clients: [
    {
      host: 'irc.rizon.net',
      port: 6660,
      logging: false,
      nickname: 'Duke',
      serverName: 'Rizon',
    },
  ],
  privmsgCommandPrefix: '!',
  databaseHost: 'something',
  openRouterKey: 'key',
};

describe('config parsing', () => {
  it('successful parse', () => {
    const result = configSchema.validate(config);

    expect(result.error).toBeUndefined();
  });
});
