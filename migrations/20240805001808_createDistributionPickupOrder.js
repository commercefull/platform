/**
 * Distribution Pickup Order Migration
 * Creates the distributionPickupOrder table for in-store pickup management
 */
exports.up = function(knex) {
  return knex.schema.createTable('distributionPickupOrder', function(table) {
    table.uuid('distributionPickupOrderId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    table.uuid('storeLocationId').notNullable().references('storeLocationId').inTable('storeLocation').onDelete('RESTRICT');
    table.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    table.string('pickupNumber').unique();
    table.string('status').defaultTo('pending'); // pending, ready, notified, picked_up, expired, cancelled
    table.timestamp('scheduledPickupAt');
    table.timestamp('pickupWindowStart');
    table.timestamp('pickupWindowEnd');
    table.timestamp('readyAt');
    table.timestamp('notifiedAt');
    table.timestamp('pickedUpAt');
    table.timestamp('expiresAt');
    table.string('pickedUpBy');
    table.string('pickupCode'); // Verification code
    table.string('lockerNumber');
    table.string('lockerCode');
    table.string('alternatePickupName');
    table.string('alternatePickupPhone');
    table.string('alternatePickupEmail');
    table.text('customerNotes');
    table.text('storeNotes');
    table.integer('remindersSent').defaultTo(0);
    table.timestamp('lastReminderAt');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index('orderId');
    table.index('storeLocationId');
    table.index('customerId');
    table.index('status');
    table.index('scheduledPickupAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('distributionPickupOrder');
};
