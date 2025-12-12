/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 * 
 * Custom dashboard configurations
 */
exports.up = function(knex) {
  return knex.schema.createTable('analyticsReportDashboard', table => {
    table.uuid('analyticsReportDashboardId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('merchantId').references('merchantId').inTable('merchant');
    table.uuid('createdBy'); // User who created the dashboard
    
    table.string('name').notNullable();
    table.string('slug');
    table.text('description');
    table.boolean('isDefault').defaultTo(false);
    table.boolean('isShared').defaultTo(false);
    
    // Dashboard layout configuration
    table.jsonb('layout'); // Grid layout configuration
    table.jsonb('widgets'); // Widget configurations
    table.jsonb('filters'); // Default filters
    table.string('dateRange').defaultTo('last_30_days');
    
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('analyticsReportDashboard');
};
