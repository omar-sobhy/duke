import { Duke } from './lib/duke/duke.js';
import { readFile } from 'node:fs/promises';
import { zConfig } from './lib/duke/config.js';
import knex from 'knex';
import * as winston from 'winston';

process.on('SIGTERM', () => {
  logger?.info('process exiting...', 'startup');

  process.exit(0);
});

const rawConfig = await readFile('config.json', { encoding: 'utf-8' });

const config = zConfig.parse(JSON.parse(rawConfig));

const database = knex({
  client: 'pg',
  connection: {
    host: config.databaseConfig.host,
    user: config.databaseConfig.user,
    password: config.databaseConfig.password,
    database: config.databaseConfig.database,
    port: config.databaseConfig.port,
    ssl: false,
  },
});

for (const client of config.clients) {
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

const duke = new Duke({ ...config, database, logger });

duke.connect();
