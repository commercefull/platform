exports.up = function(knex) {
  return knex.schema.createTable('productTieredPrice', t => {
    t.uuid('productTieredPriceId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('customerGroupId').references('customerGroupId').inTable('customer_group').onDelete('CASCADE');
    t.integer('quantityMin').notNullable();
    t.integer('quantityMax');
    t.decimal('price', 15, 2).notNullable();
    t.decimal('discountPercentage', 5, 2);
    t.enum('discountType', ['fixed_price', 'percentage']).notNullable().defaultTo('fixed_price');
    t.decimal('discountValue', 15, 2);
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').notNullable().defaultTo(0);
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    

    t.index('productId');
    t.index('productVariantId');
    t.index('customerGroupId');
    t.index('quantityMin');
    t.index('quantityMax');
    t.index('discountType');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.index('merchantId');
    
    // Composite partial indexes
    t.index(['productId', 'productVariantId', 'customerGroupId', 'quantityMin'], 'idx_tiered_price_pvqg', { predicate: knex.raw('"productVariantId" IS NOT NULL AND "customerGroupId" IS NOT NULL') });
    t.index(['productId', 'customerGroupId', 'quantityMin'], 'idx_tiered_price_pcgq', { predicate: knex.raw('"productVariantId" IS NULL AND "customerGroupId" IS NOT NULL') });
    t.index(['productId', 'productVariantId', 'quantityMin'], 'idx_tiered_price_pvq', { predicate: knex.raw('"productVariantId" IS NOT NULL AND "customerGroupId" IS NULL') });
    t.index(['productId', 'quantityMin'], 'idx_tiered_price_pq', { predicate: knex.raw('"productVariantId" IS NULL AND "customerGroupId" IS NULL') });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productTieredPrice');
};
