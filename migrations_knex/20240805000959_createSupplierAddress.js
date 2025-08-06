/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('supplier_address', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('supplier_id').notNullable().references('id').inTable('supplier').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.string('address_line1', 255).notNullable();
    t.string('address_line2', 255);
    t.string('city', 100).notNullable();
    t.string('state', 100).notNullable();
    t.string('postal_code', 20).notNullable();
    t.string('country', 2).notNullable();
    t.enu('address_type', ['headquarters', 'billing', 'warehouse', 'returns', 'manufacturing'], { useNative: true, enumName: 'supplier_address_type' }).notNullable().defaultTo('headquarters');
    t.boolean('is_default').notNullable().defaultTo(false);
    t.string('contact_name', 100);
    t.string('contact_email', 255);
    t.string('contact_phone', 30);
    t.text('notes');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('supplier_id');
    t.index('address_type');
    t.index('is_default');
    t.index('is_active');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_supplier_address_default ON supplier_address (supplier_id, address_type, is_default) WHERE is_default = true');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('supplier_address')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS supplier_address_type'));
};
