/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('basketAnalytics', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('basketId').notNullable().references('id').inTable('basket');
    t.uuid('customerId').references('id').inTable('customer');
    t.string('sessionId', 255);
    t.string('entryPoint', 100);
    t.string('referralSource', 255);
    t.string('deviceType', 50);
    t.integer('totalSessionTime');
    t.integer('totalBasketInteractions').defaultTo(0);
    t.string('abandonmentReason', 100);
    t.integer('timeToFirstAddItem');
    t.integer('timeToLastAddItem');
    t.integer('itemsBrowsed').defaultTo(0);
    t.decimal('addToCartRate', 5, 2);
    t.enum('conversionOutcome', ['purchased', 'abandoned', 'savedForLater', 'expired']);
    t.jsonb('meta');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('basketId');
    t.index('customerId');
    t.index('sessionId');
    t.index('createdAt');
    t.index('conversionOutcome');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basketAnalytics');
};
