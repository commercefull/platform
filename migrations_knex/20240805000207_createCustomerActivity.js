/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerActivity', t => {
    t.uuid('customerActivityId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('sessionId', 255);
    t.enum('activityType', [
      'login', 'logout', 'registration', 'passwordChange', 'profileUpdate', 
      'orderPlaced', 'cartUpdate', 'wishlistUpdate', 'reviewSubmitted', 
      'supportTicket', 'productView', 'categoryView', 'search', 'emailOpen', 
      'emailClick', 'paymentMethodAdded', 'addressAdded', 'addressUpdated', 
      'failedLogin', 'passwordReset', 'accountLocked', 'accountUnlocked'
    ]).notNullable();
    t.string('ipAddress', 50);
    t.string('userAgent', 255);
    t.string('deviceType', 20);
    t.string('osName', 50);
    t.string('browser', 50);
    t.jsonb('location');
    t.string('entityType', 50);
    t.uuid('entityId');
    t.jsonb('additionalData');
    t.boolean('success');
    t.text('message');
    t.index('customerId');
    t.index('sessionId');
    t.index('activityType');
    t.index('ipAddress');
    t.index('entityType');
    t.index('entityId');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerActivity');
};
