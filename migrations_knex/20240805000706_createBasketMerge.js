/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('basketMerge', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('targetBasketId').notNullable().references('id').inTable('basket');
    t.uuid('sourceBasketId').notNullable().references('id').inTable('basket');
    t.enum('mergeType', ['login', 'manual', 'system']).notNullable();
    t.integer('itemsMerged').notNullable().defaultTo(0);
    t.enum('conflictStrategy', ['keep_both', 'use_source', 'use_target', 'highest_quantity']).notNullable();
    t.uuid('mergedBy');
    t.jsonb('meta');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
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
