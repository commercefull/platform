/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('productRecommendation', function(table) {
    table.uuid('productRecommendationId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.uuid('recommendedProductId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.string('recommendationType').notNullable().checkIn([
      'frequently_bought_together', 
      'similar_products', 
      'customers_also_viewed', 
      'customers_also_bought',
      'trending', 
      'personalized', 
      'manual',
      'cross_sell',
      'upsell'
    ]);
    table.decimal('score', 10, 6).defaultTo(0);
    table.integer('rank');
    table.integer('purchaseCount').defaultTo(0);
    table.integer('viewCount').defaultTo(0);
    table.integer('clickCount').defaultTo(0);
    table.decimal('conversionRate', 5, 4).defaultTo(0);
    table.boolean('isActive').defaultTo(true);
    table.boolean('isManual').defaultTo(false);
    table.timestamp('computedAt');
    table.timestamp('expiresAt');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.unique(['productId', 'recommendedProductId', 'recommendationType']);
    table.index('productId');
    table.index('recommendedProductId');
    table.index('recommendationType');
    table.index('isActive');
    table.index('score');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('productRecommendation');
};
