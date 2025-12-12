/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supplier', t => {
    t.uuid('supplierId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable().unique();
    t.text('description');
    t.string('website', 255);
    t.string('email', 255);
    t.string('phone', 30);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isApproved').notNullable().defaultTo(false);
    t.enum('status', ['active', 'inactive', 'pending', 'suspended', 'blacklisted']).notNullable().defaultTo('active');
    t.decimal('rating', 3, 2);
    t.string('taxId', 50);
    t.string('paymentTerms', 100);
    t.string('paymentMethod', 50);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.decimal('minOrderValue', 10, 2);
    t.integer('leadTime');
    t.text('notes');
    t.specificType('categories', 'text[]');
    t.specificType('tags', 'text[]');
    t.jsonb('customFields');

    t.index('code');
    t.index('isActive');
    t.index('isApproved');
    t.index('status');
    t.index('rating');
    t.index('leadTime');
    t.index('categories', null, 'gin');
    t.index('tags', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('supplier');
};
