/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerAddress', t => {
    t.uuid('customerAddressId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.string('firstName', 100);
    t.string('lastName', 100);
    t.string('company', 255);
    t.string('addressLine1', 255).notNullable();
    t.string('addressLine2', 255);
    t.string('city', 100).notNullable();
    t.string('state', 100);
    t.string('postalCode', 20).notNullable();
    t.string('country', 2).notNullable();
    t.string('phone', 30);
    t.string('email', 255);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isDefaultBilling').notNullable().defaultTo(false);
    t.boolean('isDefaultShipping').notNullable().defaultTo(false);
    t.enum('addressType', ['billing', 'shipping', 'both']).notNullable().defaultTo('both');
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.timestamp('verifiedAt');
    t.jsonb('verificationData');
    t.text('additionalInfo');
    t.decimal('latitude', 10, 7);
    t.decimal('longitude', 10, 7);
    t.string('name', 100);

    t.index('customerId');
    t.index('country');
    t.index('addressType');
    t.index('isVerified');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerAddress');
};
