/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('analyticsProductPerformance', table => {
    table.uuid('analyticsProductPerformanceId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('productId').notNullable().references('productId').inTable('product');
    table.uuid('productVariantId').references('productVariantId').inTable('productVariant');
    table.date('date').notNullable();
    table.string('channel').defaultTo('all');
    
    // View metrics
    table.integer('views').defaultTo(0);
    table.integer('uniqueViews').defaultTo(0);
    table.integer('detailViews').defaultTo(0);
    
    // Cart metrics
    table.integer('addToCarts').defaultTo(0);
    table.integer('removeFromCarts').defaultTo(0);
    table.decimal('viewToCartRate', 5, 4).defaultTo(0);
    
    // Purchase metrics
    table.integer('purchases').defaultTo(0);
    table.integer('quantitySold').defaultTo(0);
    table.decimal('revenue', 15, 2).defaultTo(0);
    table.decimal('averagePrice', 15, 2).defaultTo(0);
    table.decimal('cartToOrderRate', 5, 4).defaultTo(0);
    
    // Return metrics
    table.integer('returns').defaultTo(0);
    table.integer('returnQuantity').defaultTo(0);
    table.decimal('returnRate', 5, 4).defaultTo(0);
    
    // Review metrics
    table.integer('reviews').defaultTo(0);
    table.decimal('averageRating', 3, 2);
    
    // Stock metrics
    table.integer('stockAlerts').defaultTo(0);
    table.integer('outOfStockViews').defaultTo(0);
    
    table.timestamp('computedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    
    table.unique(['productId', 'productVariantId', 'date', 'channel']);
  })
  .then(() => knex.raw('CREATE INDEX ON "analyticsProductPerformance"("productId", "date")'))
  .then(() => knex.raw('CREATE INDEX ON "analyticsProductPerformance"("date")'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('analyticsProductPerformance');
};
