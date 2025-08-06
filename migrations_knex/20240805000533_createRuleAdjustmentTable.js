exports.up = function(knex) {
  return knex.schema.createTable('ruleAdjustment', t => {
    t.uuid('ruleAdjustmentId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('pricingRuleId').notNullable().references('pricingRuleId').inTable('pricing_rule').onDelete('CASCADE');
    t.enum('type', ['percentage', 'fixed']).notNullable();
    t.decimal('value', 10, 2).notNullable();
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('pricingRuleId');
    t.index('type');
    t.index('value');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ruleAdjustment');
};
