import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('locations');

  if (exists) {
    return;
  }

  return knex.schema.createTable('locations', (table) => {
    table.increments('id').primary();
    table.string('nick').notNullable().unique();
    table.string('longitude').notNullable();
    table.string('latitude').notNullable();
    table.string('displayName').notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('locations');
}
