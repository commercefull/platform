/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('analyticsSalesDaily', table => {
      table.uuid('analyticsSalesDailyId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('organizationId').references('organizationId').inTable('organization');
      table.date('date').notNullable();
      table.string('channel').defaultTo('all'); // web, mobile, api, pos, all
      // Structured sales-channel attribution — nullable: org/platform-scoped
      // rollups and pre-channel events have none.
      table.uuid('salesChannelId').references('salesChannelId').inTable('salesChannel').onDelete('SET NULL');
      table.string('currencyCode', 3).defaultTo('USD').references('code').inTable('currency');

      // Order metrics
      table.integer('orderCount').defaultTo(0);
      table.integer('itemsSold').defaultTo(0);
      table.bigInteger('grossRevenueCents').defaultTo(0);
      table.bigInteger('discountTotalCents').defaultTo(0);
      table.bigInteger('refundTotalCents').defaultTo(0);
      table.bigInteger('netRevenueCents').defaultTo(0);
      table.bigInteger('taxTotalCents').defaultTo(0);
      table.bigInteger('shippingRevenueCents').defaultTo(0);
      table.bigInteger('averageOrderValueCents').defaultTo(0);

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

      table.index('salesChannelId');
    })
    .then(() =>
      // Rollup merge key for ON CONFLICT upserts. NULLS NOT DISTINCT:
      // organizationId is nullable (pre-org events) and standard unique
      // constraints treat NULLs as distinct, which would defeat merging.
      knex.raw(`
        ALTER TABLE "analyticsSalesDaily"
          ADD CONSTRAINT analyticssalesdaily_organizationid_date_channel_currencycode_un
          UNIQUE NULLS NOT DISTINCT ("organizationId", "date", "channel", "currencyCode")
      `),
    )
    .then(() => knex.raw('CREATE INDEX ON "analyticsSalesDaily"("date")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsSalesDaily"("organizationId", "date")'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('analyticsSalesDaily');
};
