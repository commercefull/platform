exports.up = function (knex) {
  return knex.schema.createTable('promotionCoupon', t => {
    t.uuid('promotionCouponId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('code', 100).notNullable().unique();
    t.uuid('promotionId').references('promotionId').inTable('promotion').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.text('description');
    t.enum('type', ['percentage', 'fixedAmount', 'freeShipping', 'buyXGetY', 'firstOrder', 'giftCard']).notNullable();
    t.decimal('discountAmount', 15, 2);
    t.string('currencyCode', 3).defaultTo('USD');
    t.decimal('minOrderAmount', 15, 2);
    t.decimal('maxDiscountAmount', 15, 2);
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isOneTimeUse').notNullable().defaultTo(false);
    t.integer('maxUsage');
    t.integer('usageCount').notNullable().defaultTo(0);
    t.integer('maxUsagePerCustomer').defaultTo(1);
    t.enum('generationMethod', ['manual', 'automatic', 'pattern', 'imported']).notNullable().defaultTo('manual');
    t.boolean('isReferral').notNullable().defaultTo(false);
    t.uuid('referrerId').references('customerId').inTable('customer');
    t.boolean('isPublic').notNullable().defaultTo(false);
    t.uuid('merchantId').references('merchantId').inTable('merchant');

    t.index('code');
    t.index('promotionId');
    t.index('type');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.index('isOneTimeUse');
    t.index('usageCount');
    t.index('generationMethod');
    t.index('isReferral');
    t.index('referrerId');
    t.index('isPublic');
    t.index('merchantId');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('promotionCoupon');
};
