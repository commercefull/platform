exports.up = function(knex) {
  return knex.schema.createTable('tax_report', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('merchant_id').notNullable().references('id').inTable('merchant').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.enu('report_type', ['sales', 'filing', 'jurisdiction', 'summary', 'exemption', 'audit']).notNullable();
    t.timestamp('date_from').notNullable();
    t.timestamp('date_to').notNullable();
    t.jsonb('tax_jurisdictions');
    t.text('file_url');
    t.enu('file_format', ['csv', 'xlsx', 'pdf', 'json']);
    t.enu('status', ['pending', 'processing', 'completed', 'failed']).notNullable().defaultTo('pending');
    t.uuid('generated_by').references('id').inTable('admin');
    t.jsonb('parameters');
    t.jsonb('results');
    t.text('error_message');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.index('merchant_id');
    t.index('report_type');
    t.index('date_from');
    t.index('date_to');
    t.index('status');
    t.index('generated_by');
    t.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_report');
};
