/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('customerContact', t => {
    t.uuid('customerContactId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.enum('type', ['email', 'phone', 'mobile', 'fax', 'social', 'other']).notNullable();
    t.string('value', 255).notNullable();
    t.string('label', 50);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isVerified').notNullable().defaultTo(false);
    t.timestamp('verifiedAt');
    t.string('verificationToken', 255);
    t.string('socialNetwork', 50);
    t.string('countryCode', 5);
    t.string('extension', 20);
    t.index('customerId');
    t.index('type');
    t.index('value');
    t.index('isVerified');
    t.unique(['customerId', 'type', 'value']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerContact');
};
