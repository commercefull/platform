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
    t.bigInteger('unitPriceCents').notNullable();
    t.bigInteger('totalPriceCents').notNullable();
    t.bigInteger('discountAmountCents').notNullable().defaultTo(0);
    t.bigInteger('taxAmountCents').notNullable().defaultTo(0);
    t.bigInteger('finalPriceCents').notNullable();
    t.text('imageUrl');
    t.jsonb('attributes');
    t.string('itemType', 20).notNullable().defaultTo('standard');
    t.boolean('isGift').notNullable().defaultTo(false);
    t.text('giftMessage');
    t.uuid('sellerId').nullable();
    t.index('basketId');
    t.index('productId');
    t.index('productVariantId');
    t.index('sellerId');
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
