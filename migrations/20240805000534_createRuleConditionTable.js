exports.up = function(knex) {
  return knex.schema.createTable('ruleCondition', t => {
    t.uuid('ruleConditionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('ruleId').notNullable().references('ruleId').inTable('rule').onDelete('CASCADE');
    t.string('type', 50).notNullable();
    t.jsonb('parameters').notNullable();

    t.index('ruleId');
    t.index('type');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rule_condition');
};
