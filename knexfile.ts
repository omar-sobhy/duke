import { readFile } from 'fs/promises';
import { configSchema } from './src/lib/duke/config.ts';

import type { Knex } from 'knex';

const rawConfig = await readFile('config.json', { encoding: 'utf-8' });

const config = configSchema.validate(JSON.parse(rawConfig));

if (config.error) {
  throw config.error;
}
export default {
  client: 'pg',
  connection: {
    database: 'duke',
    user: config.value.databaseConfig.user,
    password: config.value.databaseConfig.password,
    host: config.value.databaseConfig.host,
    port: config.value.databaseConfig.port,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
} as Knex.Config;
