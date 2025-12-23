/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('analyticsChannelAttribution', table => {
      table.uuid('analyticsChannelAttributionId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('merchantId').references('merchantId').inTable('merchant');
      table.date('date').notNullable();

      // Channel identification
      table.string('channel').notNullable(); // organic, paid_search, social, email, direct, referral, affiliate
      table.string('source'); // google, facebook, newsletter, etc.
      table.string('medium'); // cpc, email, social, etc.
      table.string('campaign'); // campaign name

      // Traffic metrics
      table.integer('sessions').defaultTo(0);
      table.integer('uniqueVisitors').defaultTo(0);
      table.integer('pageViews').defaultTo(0);
      table.decimal('bounceRate', 5, 4).defaultTo(0);
      table.integer('averageSessionDuration').defaultTo(0); // seconds

      // Conversion metrics
      table.integer('conversions').defaultTo(0);
      table.decimal('conversionRate', 5, 4).defaultTo(0);
      table.decimal('revenue', 15, 2).defaultTo(0);
      table.decimal('averageOrderValue', 15, 2).defaultTo(0);

      // Attribution models
      table.decimal('firstTouchRevenue', 15, 2).defaultTo(0);
      table.decimal('lastTouchRevenue', 15, 2).defaultTo(0);
      table.decimal('linearRevenue', 15, 2).defaultTo(0);

      // Cost metrics (if available)
      table.decimal('adSpend', 15, 2).defaultTo(0);
      table.decimal('costPerAcquisition', 15, 2).defaultTo(0);
      table.decimal('returnOnAdSpend', 10, 4).defaultTo(0);

      table.timestamp('computedAt');
      table.timestamp('createdAt').defaultTo(knex.fn.now());

      table.unique(['merchantId', 'date', 'channel', 'source', 'medium', 'campaign']);
    })
    .then(() => knex.raw('CREATE INDEX ON "analyticsChannelAttribution"("date", "channel")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsChannelAttribution"("merchantId", "date")'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('analyticsChannelAttribution');
};
