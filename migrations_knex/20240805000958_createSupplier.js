/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supplier', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable().unique();
    t.text('description');
    t.string('website', 255);
    t.string('email', 255);
    t.string('phone', 30);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.boolean('is_approved').notNullable().defaultTo(false);
    t.enu('status', ['active', 'inactive', 'pending', 'suspended', 'blacklisted'], { useNative: true, enumName: 'supplier_status_type' }).notNullable().defaultTo('active');
    t.decimal('rating', 3, 2);
    t.string('tax_id', 50);
    t.string('payment_terms', 100);
    t.string('payment_method', 50);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.decimal('min_order_value', 10, 2);
    t.integer('lead_time');
    t.text('notes');
    t.specificType('categories', 'text[]');
    t.specificType('tags', 'text[]');
    t.jsonb('custom_fields');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.index('code');
    t.index('is_active');
    t.index('is_approved');
    t.index('status');
    t.index('rating');
    t.index('lead_time');
    t.index('categories', null, 'gin');
    t.index('tags', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('supplier')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS supplier_status_type'));
};
