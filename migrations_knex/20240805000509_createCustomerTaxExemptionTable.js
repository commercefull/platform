exports.up = function(knex) {
  return knex.schema.createTable('customer_tax_exemption', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.uuid('tax_zone_id').references('id').inTable('tax_zone').onDelete('SET NULL');
    t.enu('type', null, { useNative: true, existingType: true, enumName: 'tax_exemption_type' }).notNullable();
    t.enu('status', null, { useNative: true, existingType: true, enumName: 'tax_exemption_status' }).notNullable().defaultTo('pending');
    t.string('name', 100).notNullable();
    t.string('exemption_number', 100).notNullable();
    t.string('business_name', 255);
    t.text('exemption_reason');
    t.text('document_url');
    t.timestamp('start_date').notNullable().defaultTo(knex.fn.now());
    t.timestamp('expiry_date');
    t.boolean('is_verified').notNullable().defaultTo(false);
    t.uuid('verified_by').references('id').inTable('admin'); // Assuming admin table is named 'admin'
    t.timestamp('verified_at');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('customer_id');
    t.index('tax_zone_id');
    t.index('type');
    t.index('status');
    t.index('exemption_number');
    t.index('start_date');
    t.index('expiry_date');
    t.index('is_verified');
    t.index('verified_by');
    t.index('verified_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customer_tax_exemption');
};
