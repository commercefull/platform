/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 *
 * Periodic snapshots of key metrics for trend analysis
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('analyticsReportSnapshot', table => {
      table.uuid('analyticsReportSnapshotId').primary().defaultTo(knex.raw('uuidv7()'));
      table.uuid('merchantId').references('merchantId').inTable('merchant');

      // Snapshot timing
      table.string('snapshotType').notNullable(); // hourly, daily, weekly, monthly
      table.timestamp('snapshotTime').notNullable();
      table.date('snapshotDate').notNullable();
      table.integer('snapshotHour'); // 0-23 for hourly snapshots

      // Order metrics
      table.integer('totalOrders').defaultTo(0);
      table.integer('pendingOrders').defaultTo(0);
      table.integer('processingOrders').defaultTo(0);
      table.integer('shippedOrders').defaultTo(0);
      table.integer('deliveredOrders').defaultTo(0);
      table.integer('cancelledOrders').defaultTo(0);
      table.integer('refundedOrders').defaultTo(0);

      // Revenue metrics
      table.decimal('totalRevenue', 15, 2).defaultTo(0);
      table.decimal('pendingRevenue', 15, 2).defaultTo(0);
      table.decimal('refundedAmount', 15, 2).defaultTo(0);

      // Customer metrics
      table.integer('totalCustomers').defaultTo(0);
      table.integer('activeCustomers').defaultTo(0);
      table.integer('newCustomersToday').defaultTo(0);

      // Product metrics
      table.integer('totalProducts').defaultTo(0);
      table.integer('activeProducts').defaultTo(0);
      table.integer('outOfStockProducts').defaultTo(0);
      table.integer('lowStockProducts').defaultTo(0);

      // Inventory metrics
      table.decimal('totalInventoryValue', 15, 2).defaultTo(0);
      table.integer('totalInventoryUnits').defaultTo(0);

      // Support metrics
      table.integer('openTickets').defaultTo(0);
      table.integer('pendingTickets').defaultTo(0);

      // Subscription metrics
      table.integer('activeSubscriptions').defaultTo(0);
      table.decimal('monthlyRecurringRevenue', 15, 2).defaultTo(0);

      table.timestamp('createdAt').defaultTo(knex.fn.now());

      table.unique(['merchantId', 'snapshotType', 'snapshotTime']);
    })
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportSnapshot"("snapshotDate", "snapshotType")'))
    .then(() => knex.raw('CREATE INDEX ON "analyticsReportSnapshot"("merchantId", "snapshotDate")'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('analyticsReportSnapshot');
};
