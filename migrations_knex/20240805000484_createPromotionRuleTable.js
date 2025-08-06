exports.up = function(knex) {
  return knex.schema.createTable('promotionRule', t => {
    t.uuid('promotionRuleId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionId').notNullable().references('id').inTable('promotion').onDelete('CASCADE');
    t.string('name', 255);
    t.text('description');
    t.enu('condition', null, { useNative: true, existingType: true, enumName: 'promotionRuleCondition' }).notNullable();
    t.enu('operator', null, { useNative: true, existingType: true, enumName: 'promotionRuleOperator' }).notNullable();
    t.jsonb('value').notNullable();
    t.boolean('isRequired').notNullable().defaultTo(true);
    t.string('ruleGroup', 100).defaultTo('default');
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.jsonb('metadata');

    t.index('promotionId');
    t.index('condition');
    t.index('operator');
    t.index('ruleGroup');
    t.index('isRequired');
    t.index('sortOrder');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotion_rule');
};
