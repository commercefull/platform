/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderItem', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('orderId').notNullable().references('id').inTable('order').onDelete('CASCADE');
    t.uuid('basketItemId').references('id').inTable('basketItem');
    t.uuid('productId').notNullable();
    t.uuid('variantId');
    t.string('sku', 100).notNullable();
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('quantity').notNullable().defaultTo(1);
    t.decimal('unitPrice', 15, 2).notNullable();
    t.decimal('subtotal', 15, 2).notNullable();
    t.decimal('taxAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('discountAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('total', 15, 2).notNullable();
    t.decimal('weight', 10, 3);
    t.jsonb('options');
    t.text('imageUrl');
    t.boolean('downloadable').notNullable().defaultTo(false);
    t.boolean('taxable').notNullable().defaultTo(true);
    t.string('taxClass', 100);
    t.enum('fulfillmentStatus', [
      'unfulfilled', 'fulfilled', 'partially_fulfilled', 
      'backordered', 'returned', 'exchanged'
    ]).defaultTo('unfulfilled');
    t.jsonb('metaData');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('orderId');
    t.index('productId');
    t.index('sku');
    t.index('fulfillmentStatus');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderItem');
};
