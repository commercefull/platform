/**
 * Create checkout configuration table for per-store checkout configurability.
 * Stores customizable steps, fields, validation hooks, and behavior toggles.
 */

export async function up(knex) {
  await knex.schema.createTable('checkoutConfig', (table) => {
    table.string('configId').primary();
    table.string('storeId').notNullable().index();
    table.string('organizationId').notNullable().index();
    table.string('name').notNullable();
    table.jsonb('steps').notNullable().defaultTo('[]');
    table.jsonb('behavior').notNullable();
    table.boolean('isActive').notNullable().defaultTo(true);
    table.boolean('isDefault').notNullable().defaultTo(false);
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index(['storeId', 'isDefault']);
    table.index(['organizationId', 'isActive']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('checkoutConfig');
}
