exports.up = function(knex) {
  return knex.schema.createTable('orderItem', t => {
    t.uuid('orderItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('productId').references('productId').inTable('product');
    t.uuid('variantId').references('productVariantId').inTable('productVariant');
    t.uuid('basketItemId').references('basketItemId').inTable('basketItem');
    t.string('sku', 100).notNullable();
    t.string('name', 255).notNullable();
    t.text('description');
    t.integer('quantity').notNullable();
    t.decimal('unitPrice', 15, 2).notNullable();
    t.decimal('unitCost', 15, 2);
    t.decimal('discountedUnitPrice', 15, 2).notNullable();
    t.decimal('lineTotal', 15, 2).notNullable();
    t.decimal('discountTotal', 15, 2).notNullable().defaultTo(0);
    t.decimal('taxTotal', 15, 2).notNullable().defaultTo(0);
    t.decimal('taxRate', 6, 4).defaultTo(0);
    t.boolean('taxExempt').notNullable().defaultTo(false);
    t.jsonb('options');
    t.jsonb('attributes');
    t.enum('fulfillmentStatus', ['unfulfilled', 'partiallyFulfilled', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'returned', 'pendingPickup', 'pickedUp']).notNullable().defaultTo('unfulfilled');
    t.boolean('giftWrapped').notNullable().defaultTo(false);
    t.text('giftMessage');
    t.decimal('weight', 10, 2);
    t.jsonb('dimensions');
    t.boolean('isDigital').notNullable().defaultTo(false);
    t.text('downloadLink');
    t.timestamp('downloadExpiryDate');
    t.integer('downloadLimit');
    t.jsonb('subscriptionInfo');
    t.jsonb('metadata');

    t.index('orderId');
    t.index('productId');
    t.index('variantId');
    t.index('basketItemId');
    t.index('sku');
    t.index('fulfillmentStatus');
    t.index('isDigital');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderItem');
};
