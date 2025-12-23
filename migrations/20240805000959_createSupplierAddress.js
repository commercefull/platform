/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supplierAddress', t => {
    t.uuid('supplierAddressId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('supplierId').notNullable().references('supplierId').inTable('supplier').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.string('addressLine1', 255).notNullable();
    t.string('addressLine2', 255);
    t.string('city', 100).notNullable();
    t.string('state', 100).notNullable();
    t.string('postalCode', 20).notNullable();
    t.string('country', 2).notNullable();
    t.enum('addressType', ['headquarters', 'billing', 'warehouse', 'returns', 'manufacturing']).notNullable().defaultTo('headquarters');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.string('contactName', 100);
    t.string('contactEmail', 255);
    t.string('contactPhone', 30);
    t.text('notes');
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index('supplierId');
    t.index('addressType');
    t.index('isDefault');
    t.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('supplierAddress');
};
