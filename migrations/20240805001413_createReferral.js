/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('referral', function(table) {
    table.uuid('referralId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('referrerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    table.uuid('referredId').references('customerId').inTable('customer').onDelete('SET NULL');
    table.string('referralCode').notNullable();
    table.string('referredEmail');
    table.string('referredFirstName');
    table.string('status').defaultTo('pending').checkIn(['pending', 'signed_up', 'purchased', 'rewarded', 'expired', 'cancelled']);
    table.uuid('firstOrderId').references('orderId').inTable('order').onDelete('SET NULL');
    table.decimal('firstOrderValue', 15, 2);
    table.string('source').checkIn(['email', 'social', 'link', 'qr_code']);
    table.string('channel');
    table.timestamp('invitedAt');
    table.timestamp('signedUpAt');
    table.timestamp('purchasedAt');
    table.timestamp('rewardedAt');
    table.timestamp('expiresAt');
    table.string('ipAddress');
    table.string('userAgent');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('referrerId');
    table.index('referredId');
    table.index('referralCode');
    table.index('referredEmail');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('referral');
};
