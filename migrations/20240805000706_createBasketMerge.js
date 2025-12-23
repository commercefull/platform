/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('basketMerge', t => {
    t.uuid('basketMergeId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('targetBasketId').notNullable().references('basketId').inTable('basket');
    t.uuid('sourceBasketId').notNullable().references('basketId').inTable('basket');
    t.enum('mergeType', ['login', 'manual', 'system']).notNullable();
    t.integer('itemsMerged').notNullable().defaultTo(0);
    t.enum('conflictStrategy', ['keepBoth', 'useSource', 'useTarget', 'highestQuantity']).notNullable();
    t.uuid('mergedBy');

    t.index('targetBasketId');
    t.index('sourceBasketId');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basketMerge');
};
