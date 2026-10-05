exports.up = function (knex) {
  return knex.schema
    .createTable('promotionCouponUsage', t => {
      t.uuid('promotionCouponUsageId').primary().defaultTo(knex.raw('uuidv7()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('promotionCouponId').notNullable().references('promotionCouponId').inTable('promotionCoupon').onDelete('CASCADE');
      t.uuid('orderId').references('orderId').inTable('order').onDelete('SET NULL');
      t.uuid('customerId').references('customerId').inTable('customer').onDelete('SET NULL');
      t.bigInteger('discountAmountCents').notNullable();
      t.string('currencyCode', 3).notNullable().defaultTo('USD').references('code').inTable('currency');
      t.timestamp('usedAt').notNullable().defaultTo(knex.fn.now());

      t.index('promotionCouponId');
      t.index('orderId');
      t.index('customerId');
      t.index('usedAt');
    })
    .then(() =>
      // One redemption row per (coupon, order) — retried checkout completion
      // must not double-count usage. orderId is nullable, so the index only
      // constrains order-bound redemptions.
      knex.raw(`
        CREATE UNIQUE INDEX "promotionCouponUsage_uniqueOrderRedemption"
          ON "promotionCouponUsage" ("promotionCouponId", "orderId")
          WHERE "orderId" IS NOT NULL
      `),
    );
};

exports.down = function (knex) {
  return knex.schema.dropTable('promotionCouponUsage');
};
