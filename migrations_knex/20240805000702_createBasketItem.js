/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('basketItem', t => {
      t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.uuid('basketId').notNullable().references('id').inTable('basket').onDelete('CASCADE');
      t.uuid('productId').notNullable();
      t.uuid('variantId');
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
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.index('basketId');
      t.index('productId');
      t.index('variantId');
      t.index('sku');
    })
    .then(() => knex.schema.raw('ALTER TABLE "basketItem" ADD CONSTRAINT basket_item_quantity_check CHECK (quantity > 0)'))
    .then(() => knex.schema.raw('CREATE UNIQUE INDEX basket_item_variant_unique_idx ON "basketItem" ("basketId", "productId", "variantId") WHERE "variantId" IS NOT NULL'))
    .then(() => knex.schema.raw('CREATE UNIQUE INDEX basket_item_product_unique_idx ON "basketItem" ("basketId", "productId") WHERE "variantId" IS NULL'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basketItem');
};
