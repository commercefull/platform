/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('analyticsSearchQuery', table => {
      table.uuid('analyticsSearchQueryId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('merchantId').references('merchantId').inTable('merchant');
      table.string('query').notNullable();
      table.string('queryNormalized'); // lowercase, trimmed
      table.date('date').notNullable();

      // Search metrics
      table.integer('searchCount').defaultTo(0);
      table.integer('uniqueSearchers').defaultTo(0);
      table.integer('resultCount').defaultTo(0);
      table.boolean('isZeroResult').defaultTo(false);

      // Engagement metrics
      table.integer('clickCount').defaultTo(0);
      table.decimal('clickThroughRate', 5, 4).defaultTo(0);
      table.integer('averageClickPosition').defaultTo(0);

      // Conversion metrics
      table.integer('addToCartCount').defaultTo(0);
      table.integer('purchaseCount').defaultTo(0);
      table.decimal('conversionRate', 5, 4).defaultTo(0);
      table.decimal('revenue', 15, 2).defaultTo(0);

      // Refinement metrics
      table.integer('refinementCount').defaultTo(0);
      table.integer('exitCount').defaultTo(0);

      table.timestamp('createdAt').defaultTo(knex.fn.now());
      table.timestamp('updatedAt').defaultTo(knex.fn.now());

      table.unique(['merchantId', 'queryNormalized', 'date']);
    })
    .then(() => knex.raw('CREATE INDEX ON "analyticsSearchQuery"("date")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsSearchQuery"("isZeroResult")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsSearchQuery"("queryNormalized")'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('analyticsSearchQuery');
};
