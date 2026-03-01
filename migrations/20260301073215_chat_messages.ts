import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('chatMessages');

  if (exists) {
    return;
  }

  return knex.schema.createTable('chatMessages', (table) => {
    table.increments('id').primary();

    table
      .string('contextIdentifier')
      .notNullable()
      .references('identifier')
      .inTable('chatContexts')
      .onDelete('CASCADE');

    table.text('input').notNullable();

    table.text('text').notNullable();

    table.integer('splitIndex').notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('chatMessages');
}
