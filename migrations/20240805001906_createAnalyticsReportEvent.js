/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 *
 * Event tracking table for real-time reporting
 * Stores raw events that get aggregated into analytics tables
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('analyticsReportEvent', table => {
      table.uuid('analyticsReportEventId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('merchantId').references('merchantId').inTable('merchant');

      // Event identification
      table.string('eventType').notNullable(); // order.created, product.viewed, cart.abandoned, etc.
      table.string('eventCategory').notNullable(); // order, product, customer, cart, payment, etc.
      table.string('eventAction').notNullable(); // created, updated, viewed, purchased, etc.

      // Entity references
      table.uuid('customerId').references('customerId').inTable('customer');
      table.uuid('orderId').references('orderId').inTable('order');
      table.uuid('productId').references('productId').inTable('product');
      table.uuid('basketId').references('basketId').inTable('basket');

      // Session/visitor tracking
      table.string('sessionId');
      table.string('visitorId');
      table.string('channel'); // web, mobile, api, pos

      // Event data
      table.jsonb('eventData'); // Flexible data storage for event-specific info
      table.decimal('eventValue', 15, 2); // Monetary value if applicable
      table.integer('eventQuantity'); // Quantity if applicable
      table.string('currency', 3);

      // Context
      table.string('ipAddress');
      table.string('userAgent');
      table.string('referrer');
      table.string('utmSource');
      table.string('utmMedium');
      table.string('utmCampaign');
      table.string('deviceType'); // desktop, mobile, tablet
      table.string('country');
      table.string('region');

      // Processing status
      table.boolean('isProcessed').defaultTo(false);
      table.timestamp('processedAt');

      table.timestamp('createdAt').defaultTo(knex.fn.now());
    })
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportEvent"("eventType", "createdAt")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportEvent"("eventCategory", "createdAt")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportEvent"("customerId", "createdAt")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportEvent"("orderId")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportEvent"("productId", "createdAt")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportEvent"("isProcessed", "createdAt")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportEvent"("createdAt")'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('analyticsReportEvent');
};
