import { Duke } from './lib/duke/duke.js';
import { readFile } from 'node:fs/promises';
import { configSchema } from './lib/duke/config.js';
import { database } from './lib/database/index.js';

const rawConfig = await readFile('config.json', { encoding: 'utf-8' });

const config = configSchema.validate(JSON.parse(rawConfig));

if (config.error) {
  throw config.error;
}

const mongoose = await database(config.value.databaseHost);

const duke = new Duke({ ...config.value, database: mongoose });

duke.connect();
