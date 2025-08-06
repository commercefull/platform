exports.up = function(knex) {
  return knex.schema.createTable('product_tiered_price', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('productVariant').onDelete('CASCADE');
    t.uuid('customerGroupId').references('id').inTable('customer_group').onDelete('CASCADE');
    t.integer('quantityMin').notNullable();
    t.integer('quantityMax');
    t.decimal('price', 15, 2).notNullable();
    t.decimal('discountPercentage', 5, 2);
    t.enu('discountType', null, { useNative: true, existingType: true, enumName: 'productTieredPriceDiscountType' }).notNullable().defaultTo('fixed_price');
    t.decimal('discountValue', 15, 2);
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').notNullable().defaultTo(0);
    t.uuid('merchantId').references('id').inTable('merchant');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('productId');
    t.index('variantId');
    t.index('customerGroupId');
    t.index('quantityMin');
    t.index('quantityMax');
    t.index('discountType');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.index('merchantId');
    
    // Composite partial indexes
    t.index(['productId', 'variantId', 'customerGroupId', 'quantityMin'], 'idx_tiered_price_pvqg', { predicate: knex.raw('"variantId" IS NOT NULL AND "customerGroupId" IS NOT NULL') });
    t.index(['productId', 'customerGroupId', 'quantityMin'], 'idx_tiered_price_pcgq', { predicate: knex.raw('"variantId" IS NULL AND "customerGroupId" IS NOT NULL') });
    t.index(['productId', 'variantId', 'quantityMin'], 'idx_tiered_price_pvq', { predicate: knex.raw('"variantId" IS NOT NULL AND "customerGroupId" IS NULL') });
    t.index(['productId', 'quantityMin'], 'idx_tiered_price_pq', { predicate: knex.raw('"variantId" IS NULL AND "customerGroupId" IS NULL') });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_tiered_price');
};
