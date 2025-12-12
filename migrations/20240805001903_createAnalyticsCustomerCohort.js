/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('analyticsCustomerCohort', table => {
    table.uuid('analyticsCustomerCohortId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('merchantId').references('merchantId').inTable('merchant');
    table.date('cohortMonth').notNullable(); // First day of cohort month
    table.integer('monthNumber').notNullable(); // 0 = acquisition month, 1 = first month after, etc.
    
    // Cohort size
    table.integer('customersInCohort').defaultTo(0);
    table.integer('activeCustomers').defaultTo(0);
    table.decimal('retentionRate', 5, 4).defaultTo(0);
    
    // Revenue metrics
    table.decimal('revenue', 15, 2).defaultTo(0);
    table.integer('orders').defaultTo(0);
    table.decimal('averageOrderValue', 15, 2).defaultTo(0);
    table.decimal('lifetimeValue', 15, 2).defaultTo(0);
    
    // Engagement metrics
    table.integer('repeatPurchasers').defaultTo(0);
    table.decimal('repeatPurchaseRate', 5, 4).defaultTo(0);
    table.decimal('averageOrdersPerCustomer', 5, 2).defaultTo(0);
    
    table.timestamp('computedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    
    table.unique(['merchantId', 'cohortMonth', 'monthNumber']);
  })
  .then(() => knex.raw('CREATE INDEX ON "analyticsCustomerCohort"("cohortMonth")'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('analyticsCustomerCohort');
};
