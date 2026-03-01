import { config as dotenvConfig } from 'dotenv';
import type { Knex } from 'knex';

dotenvConfig();

// Update with your config settings.

export default {
  client: 'pg',
  connection: {
    database: 'duke',
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
} as Knex.Config;
