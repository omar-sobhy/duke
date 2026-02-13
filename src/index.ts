import { Duke } from './lib/duke/duke.js';
import { readFile } from 'node:fs/promises';
import { configSchema } from './lib/duke/config.js';
import { database } from './lib/database/index.js';
import { userPermissionModel } from './lib/database/models/userpermission.model.js';

const rawConfig = await readFile('config.json', { encoding: 'utf-8' });

const config = configSchema.validate(JSON.parse(rawConfig));

if (config.error) {
  throw config.error;
}

const mongoose = await database(config.value.databaseHost);

const model = userPermissionModel(mongoose);

for (const client of config.value.clients) {
  for (const permission of client.initPermissions) {
    const existing = await model.findOne({
      serverName: client.serverName,
      mask: permission.mask.toLowerCase(),
    });

    if (!existing) {
      await model.insertOne({
        serverName: client.serverName,
        mask: permission.mask.toLowerCase(),
        level: permission.level,
      });
    }
  }
}

const duke = new Duke({ ...config.value, database: mongoose });

duke.connect();
