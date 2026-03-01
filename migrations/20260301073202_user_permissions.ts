import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('userPermissions');

  if (exists) {
    return;
  }

  return knex.schema.createTable('userPermissions', (table) => {
    table.increments('id').primary();
    table.integer('level').notNullable();
    table.string('serverName').notNullable();
    table.string('mask').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('userPermissions');
}
