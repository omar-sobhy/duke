import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('chatContexts');

  if (exists) {
    return;
  }

  return knex.schema.createTable('chatContexts', (table) => {
    table.string('identifier').primary();
    table.string('type').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('chatContexts');
}
