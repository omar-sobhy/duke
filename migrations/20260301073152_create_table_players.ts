import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('players');

  if (exists) {
    return;
  }

  return knex.schema.createTable('players', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('players');
}
