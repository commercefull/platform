/**
 * Create PSP route configuration table for failover routing.
 * Stores per-organization payment provider routes with priority and config.
 */

export async function up(knex) {
  await knex.schema.createTable('paymentPspRoute', table => {
    table.uuid('routeId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('organizationId').notNullable().index();
    table.string('provider').notNullable();
    table.integer('priority').notNullable().defaultTo(1);
    table.boolean('isActive').notNullable().defaultTo(true);
    table.jsonb('config').notNullable();
    table.jsonb('capabilities');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index(['organizationId', 'isActive', 'priority']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('paymentPspRoute');
}
