import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('skills');

  if (exists) {
    return;
  }

  return knex.schema.createTable('skills', (table) => {
    table.increments('id').primary();

    table
      .integer('playerId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('players')
      .onDelete('CASCADE');

    table.string('skillName').notNullable();

    table.string('level').notNullable();

    table.string('xp').notNullable();

    table.unique(['playerId', 'skillName']);

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('skills');
}
