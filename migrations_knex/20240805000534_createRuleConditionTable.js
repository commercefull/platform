exports.up = function(knex) {
  return knex.schema.createTable('rule_condition', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('rule_id').notNullable().references('id').inTable('pricing_rule').onDelete('CASCADE');
    t.string('type', 50).notNullable();
    t.jsonb('parameters').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rule_condition');
};
