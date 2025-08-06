/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('merchantAddress', t => {
      t.uuid('merchantAddressId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
      t.enum('addressType', ['billing', 'shipping', 'business', 'warehouse', 'returns']).notNullable();
      t.boolean('isDefault').notNullable().defaultTo(false);
      t.string('firstName', 100);
      t.string('lastName', 100);
      t.string('company', 100);
      t.string('addressLine1', 255).notNullable();
      t.string('addressLine2', 255);
      t.string('city', 100).notNullable();
      t.string('state', 100).notNullable();
      t.string('postalCode', 20).notNullable();
      t.string('country', 2).notNullable();
      t.string('phone', 30);
      t.string('email', 255);
      t.boolean('isVerified').notNullable().defaultTo(false);
      t.timestamp('verifiedAt');
      t.decimal('latitude', 10, 7);
      t.decimal('longitude', 10, 7);
      t.text('notes');
      t.jsonb('metadata');
      t.index('merchantId');
      t.index('addressType');
      t.index('isDefault');
      t.index('city');
      t.index('state');
      t.index('postalCode');
      t.index('country');
      t.index('isVerified');
    })
    .then(() => {
      return knex.schema.raw('CREATE UNIQUE INDEX merchant_address_is_default_unique_index ON "merchantAddress" ("merchantId", "addressType", "isDefault") WHERE "isDefault" = true');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantAddress');
};
