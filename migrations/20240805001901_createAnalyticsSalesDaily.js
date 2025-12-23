/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('analyticsSalesDaily', table => {
      table.uuid('analyticsSalesDailyId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('merchantId').references('merchantId').inTable('merchant');
      table.date('date').notNullable();
      table.string('channel').defaultTo('all'); // web, mobile, api, pos, all
      table.string('currency', 3).defaultTo('USD');

      // Order metrics
      table.integer('orderCount').defaultTo(0);
      table.integer('itemsSold').defaultTo(0);
      table.decimal('grossRevenue', 15, 2).defaultTo(0);
      table.decimal('discountTotal', 15, 2).defaultTo(0);
      table.decimal('refundTotal', 15, 2).defaultTo(0);
      table.decimal('netRevenue', 15, 2).defaultTo(0);
      table.decimal('taxTotal', 15, 2).defaultTo(0);
      table.decimal('shippingRevenue', 15, 2).defaultTo(0);
      table.decimal('averageOrderValue', 15, 2).defaultTo(0);

      // Customer metrics
      table.integer('newCustomers').defaultTo(0);
      table.integer('returningCustomers').defaultTo(0);
      table.integer('guestOrders').defaultTo(0);

      // Conversion metrics
      table.integer('cartCreated').defaultTo(0);
      table.integer('cartAbandoned').defaultTo(0);
      table.integer('checkoutStarted').defaultTo(0);
      table.integer('checkoutCompleted').defaultTo(0);
      table.decimal('conversionRate', 5, 4).defaultTo(0);

      // Payment metrics
      table.integer('paymentSuccessCount').defaultTo(0);
      table.integer('paymentFailedCount').defaultTo(0);
      table.decimal('paymentSuccessRate', 5, 4).defaultTo(0);

      table.timestamp('computedAt');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.unique(['merchantId', 'date', 'channel', 'currency']);
    })
    .then(() => knex.raw('CREATE INDEX ON "analyticsSalesDaily"("date")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsSalesDaily"("merchantId", "date")'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('analyticsSalesDaily');
};
