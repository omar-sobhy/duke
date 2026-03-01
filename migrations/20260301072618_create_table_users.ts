import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('users');

  if (exists) {
    return;
  }

  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('nick').notNullable().unique();
    table.boolean('mustIdentify').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}
