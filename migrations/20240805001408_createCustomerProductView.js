/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('customerProductView', function(table) {
    table.uuid('customerProductViewId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('customerId').references('customerId').inTable('customer').onDelete('CASCADE');
    table.string('sessionId');
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('SET NULL');
    table.string('source').checkIn(['search', 'category', 'recommendation', 'direct', 'email', 'social', 'ad']);
    table.string('referrer');
    table.integer('viewDurationSeconds');
    table.integer('scrollDepthPercent');
    table.boolean('addedToCart').defaultTo(false);
    table.boolean('purchased').defaultTo(false);
    table.string('deviceType');
    table.string('country');
    table.string('ipAddress');
    table.string('userAgent');
    table.jsonb('metadata');
    table.timestamp('viewedAt').defaultTo(knex.fn.now());

    table.index('customerId');
    table.index('sessionId');
    table.index('productId');
    table.index('viewedAt');
    table.index(['customerId', 'productId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('customerProductView');
};
