/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderAddress', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('orderId').notNullable().references('id').inTable('order').onDelete('CASCADE');
    t.uuid('customerAddressId').references('id').inTable('customerAddress');
    t.enum('addressType', ['billing', 'shipping']).notNullable();
    t.string('firstName', 100).notNullable();
    t.string('lastName', 100).notNullable();
    t.string('company', 255);
    t.string('addressLine1', 255).notNullable();
    t.string('addressLine2', 255);
    t.string('city', 100).notNullable();
    t.string('state', 100).notNullable();
    t.string('postalCode', 20).notNullable();
    t.string('country', 2).notNullable();
    t.string('phoneNumber', 50);
    t.string('email', 255);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.timestamp('validatedAt');
    t.text('additionalInfo');
    t.jsonb('metaData');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('orderId');
    t.index('customerAddressId');
    t.unique(['orderId', 'addressType']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderAddress');
};
