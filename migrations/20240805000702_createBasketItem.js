/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('basketItem', t => {
    t.uuid('basketItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('basketId').notNullable().references('basketId').inTable('basket').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.string('sku', 100).notNullable();
    t.string('name', 255).notNullable();
    t.integer('quantity').notNullable().defaultTo(1);
    t.decimal('unitPrice', 15, 2).notNullable();
    t.decimal('totalPrice', 15, 2).notNullable();
    t.decimal('discountAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('taxAmount', 15, 2).notNullable().defaultTo(0);
    t.decimal('finalPrice', 15, 2).notNullable();
    t.text('imageUrl');
    t.jsonb('attributes');
    t.string('itemType', 20).notNullable().defaultTo('standard');
    t.boolean('isGift').notNullable().defaultTo(false);
    t.text('giftMessage');
    t.index('basketId');
    t.index('productId');
    t.index('productVariantId');
    t.index('sku');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basketItem');
};
