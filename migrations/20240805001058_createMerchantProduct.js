/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantProduct', t => {
    t.uuid('merchantProductId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isApproved').notNullable().defaultTo(false);
    t.timestamp('approvedAt');
    t.uuid('approvedBy');
    t.text('approvalNotes');
    t.boolean('isFeatured').notNullable().defaultTo(false);
    t.timestamp('featuredFrom');
    t.timestamp('featuredTo');
    t.string('merchantSku', 100);
    t.decimal('merchantPrice', 15, 2);
    t.decimal('merchantCost', 15, 2);
    t.integer('merchantStock');
    t.decimal('commissionRate', 5, 2);
    t.string('shippingTemplate', 50);
    t.integer('handlingTime');
    
    t.index('merchantId');
    t.index('productId');
    t.index('isActive');
    t.index('isApproved');
    t.index('isFeatured');
    t.index('merchantSku');
    t.index('merchantPrice');
    t.index('merchantStock');
    t.index('commissionRate');
    t.index('handlingTime');
    t.unique(['merchantId', 'productId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantProduct');
};
