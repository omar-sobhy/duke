import { Duke } from './lib/duke/duke.js';
import { readFile } from 'node:fs/promises';
import { configSchema } from './lib/duke/config.js';
import knex from 'knex';
import * as winston from 'winston';

const rawConfig = await readFile('config.json', { encoding: 'utf-8' });

const config = configSchema.validate(JSON.parse(rawConfig));

if (config.error) {
  throw config.error;
}

const database = knex({
  client: 'pg',
  connection: {
    host: config.value.databaseConfig.host,
    user: config.value.databaseConfig.user,
    password: config.value.databaseConfig.password,
    database: config.value.databaseConfig.database,
    port: config.value.databaseConfig.port,
    ssl: false,
  },
});

for (const client of config.value.clients) {
  for (const permission of client.initPermissions) {
    const existing = await database('userPermissions')
      .where({
        serverName: client.serverName,
        mask: permission.mask.toLowerCase(),
      })
      .first();

    if (!existing) {
      await database('userPermissions').insert({
        serverName: client.serverName,
        mask: permission.mask.toLowerCase(),
        level: permission.level,
      });
    }
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

const duke = new Duke({ ...config.value, database, logger });

duke.connect();
