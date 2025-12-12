/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantProductVariant', t => {
    t.uuid('merchantProductVariantId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantProductId').notNullable().references('merchantProductId').inTable('merchantProduct').onDelete('CASCADE');
    t.uuid('productVariantId').notNullable().references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.string('merchantSku', 100);
    t.decimal('merchantPrice', 15, 2);
    t.decimal('merchantCost', 15, 2);
    t.integer('merchantStock');
    
    t.index('merchantProductId');
    t.index('productVariantId');
    t.index('isActive');
    t.index('merchantSku');
    t.index('merchantPrice');
    t.index('merchantStock');
    t.unique(['merchantProductId', 'productVariantId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantProductVariant');
};
