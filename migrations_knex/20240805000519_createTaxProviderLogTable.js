exports.up = function(knex) {
  return knex.schema.createTable('tax_provider_log', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('merchant_id').notNullable().references('id').inTable('merchant').onDelete('CASCADE');
    t.enu('provider', ['internal', 'avalara', 'taxjar', 'external']).notNullable();
    t.enu('request_type', ['calculation', 'verification', 'filing', 'refund', 'adjustment', 'validation']).notNullable();
    t.string('entity_type', 50).notNullable();
    t.uuid('entity_id');
    t.jsonb('request_data');
    t.jsonb('response_data');
    t.integer('response_status');
    t.boolean('is_success').notNullable();
    t.string('error_code', 100);
    t.text('error_message');
    t.integer('processing_time_ms');
    t.string('provider_reference', 255);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.index('merchant_id');
    t.index('provider');
    t.index('request_type');
    t.index('entity_type');
    t.index('entity_id');
    t.index('is_success');
    t.index('provider_reference');
    t.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tax_provider_log');
};
