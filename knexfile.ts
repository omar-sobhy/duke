import { readFile } from 'fs/promises';
import { zConfig } from './src/lib/duke/config.ts';

import type { Knex } from 'knex';

const rawConfig = await readFile('config.json', { encoding: 'utf-8' });

const config = zConfig.parse(JSON.parse(rawConfig));

export default {
  client: 'pg',
  connection: {
    database: 'duke',
    user: config.databaseConfig.user,
    password: config.databaseConfig.password,
    host: config.databaseConfig.host,
    port: config.databaseConfig.port,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
} as Knex.Config;
