/**
 * Creates the `inventoryAllocationRule` table for inventory allocation rules.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryAllocationRule', t => {
    t.uuid('inventoryAllocationRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 200).notNullable();
    t.text('description');
    t.enum('scope', ['global', 'pool', 'product', 'category']).notNullable().defaultTo('global');
    t.uuid('poolId');
    t.uuid('categoryId');
    t.uuid('productId');
    t.enum('allocationStrategy', ['fifo', 'lifo', 'nearest', 'even_split', 'priority']).notNullable().defaultTo('fifo');
    t.enum('reservationPolicy', ['immediate', 'deferred']).notNullable().defaultTo('immediate');
    t.integer('lowStockThreshold').defaultTo(0);
    t.integer('oversellBuffer').defaultTo(0);
    t.boolean('allowBackorder').notNullable().defaultTo(false);
    t.boolean('allowOversell').notNullable().defaultTo(false);
    t.integer('maxAllocationPerOrder').defaultTo(0);
    t.jsonb('conditions');
    t.integer('priority').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index('scope');
    t.index('poolId');
    t.index('categoryId');
    t.index('productId');
    t.index('isActive');
    t.index('priority');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryAllocationRule');
};
