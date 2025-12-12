/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryTransactionType', t => {
    t.uuid('inventoryTransactionTypeId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('code', 20).notNullable().unique();
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('affectsAvailable').notNullable().defaultTo(true);
    t.enum('direction', ['in', 'out', 'transfer', 'adjust']).notNullable();
    t.boolean('requiresApproval').notNullable().defaultTo(false);
    t.boolean('requiresDocumentation').notNullable().defaultTo(false);
    
    t.index('code');
    t.index('direction');
    t.index('affectsAvailable');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryTransactionType');
};
