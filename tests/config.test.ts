import { describe, expect, it } from '@jest/globals';
import { zConfig } from '../src/lib/duke/config.js';

const config = {
  clients: [
    {
      nickname: 'duke',
      logging: false,
      host: 'irc.rizon.net',
      port: 6660,
      serverName: 'Rizon',
      initialChannels: [],
      autotryNextNick: false,
      invisible: false,
      wallops: false,
      maxAutotryNextNickTries: 3,
      throttleInterval: 200,
      initPermissions: [],
    },
  ],
  privmsgCommandPrefix: '!',
  databaseConfig: {
    user: 'duke',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'duke',
  },
  openRouterKey: 'key',
  openWeatherMapKey: 'key',
  mapBoxKey: 'key',
};

describe('config parsing', () => {
  it('successful parse', () => {
    const result = zConfig.safeParse(config);

    expect(result.success).toBe(true);
  });
});
