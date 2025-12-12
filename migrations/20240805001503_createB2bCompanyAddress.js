/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('b2bCompanyAddress', function(table) {
    table.uuid('b2bCompanyAddressId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('b2bCompanyId').notNullable().references('b2bCompanyId').inTable('b2bCompany').onDelete('CASCADE');
    table.string('addressType').defaultTo('shipping').checkIn(['billing', 'shipping', 'headquarters', 'warehouse', 'other']);
    table.string('label');
    table.string('contactName');
    table.string('contactPhone');
    table.string('contactEmail');
    table.string('company');
    table.string('addressLine1').notNullable();
    table.string('addressLine2');
    table.string('addressLine3');
    table.string('city').notNullable();
    table.string('state');
    table.string('postalCode');
    table.string('countryCode', 2).notNullable();
    table.string('country');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.boolean('isDefault').defaultTo(false);
    table.boolean('isDefaultBilling').defaultTo(false);
    table.boolean('isDefaultShipping').defaultTo(false);
    table.boolean('isVerified').defaultTo(false);
    table.timestamp('verifiedAt');
    table.string('verificationSource');
    table.text('deliveryInstructions');
    table.jsonb('metadata');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.timestamp('deletedAt');

    table.index('b2bCompanyId');
    table.index('addressType');
    table.index('countryCode');
    table.index('isDefault');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('b2bCompanyAddress');
};
