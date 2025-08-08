exports.up = function(knex) {
  return knex.schema.createTable('productDiscount', t => {
    t.uuid('productDiscountId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('promotionId').references('promotionId').inTable('promotion').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.text('description');
    t.enum('discountType', ['percentage', 'fixed_amount']).notNullable(); 
    t.decimal('discountValue', 15, 2).notNullable();
    t.string('currencyCode', 3).defaultTo('USD');
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('priority').notNullable().defaultTo(0);
    t.enum('appliesTo', ['specific_products', 'all_products']).notNullable().defaultTo('specific_products');
    t.integer('minimumQuantity').defaultTo(1);
    t.integer('maximumQuantity');
    t.decimal('minimumAmount', 15, 2);
    t.decimal('maximumDiscountAmount', 15, 2);
    t.boolean('stackable').notNullable().defaultTo(false);
    t.boolean('displayOnProductPage').notNullable().defaultTo(true);
    t.boolean('displayInListing').notNullable().defaultTo(true);
    t.string('badgeText', 100);
    t.jsonb('badgeStyle');
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('promotionId');
    t.index('discountType');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.index('priority');
    t.index('appliesTo');
    t.index('merchantId');
    t.index('stackable');
    t.index('displayOnProductPage');
    t.index('displayInListing');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_discount');
};
