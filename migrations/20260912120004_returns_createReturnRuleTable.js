/**
 * Creates the `returnRule` table for return policy rules.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('returnRule', t => {
    t.uuid('returnRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 200).notNullable();
    t.text('description');
    t.enum('scope', ['global', 'category', 'product']).notNullable().defaultTo('global');
    t.uuid('categoryId');
    t.uuid('productId');
    t.integer('returnWindowDays');
    t.decimal('restockingFeePercent', 5, 2).defaultTo(0);
    t.decimal('restockingFeeFlat', 15, 2).defaultTo(0);
    t.decimal('returnShippingCost', 15, 2).defaultTo(0);
    t.boolean('customerPaysReturnShipping').notNullable().defaultTo(false);
    t.boolean('autoApprove').notNullable().defaultTo(false);
    t.boolean('requiresManualReview').notNullable().defaultTo(false);
    t.boolean('requiresInspection').notNullable().defaultTo(true);
    t.enum('refundMethod', ['original', 'storeCredit', 'either']).notNullable().defaultTo('original');
    t.jsonb('conditions');
    t.integer('priority').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index('scope');
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
  return knex.schema.dropTable('returnRule');
};
