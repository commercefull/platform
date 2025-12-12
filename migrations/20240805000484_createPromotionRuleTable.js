exports.up = function(knex) {
  return knex.schema.createTable('promotionRule', t => {
    t.uuid('promotionRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('promotionId').notNullable().references('promotionId').inTable('promotion').onDelete('CASCADE');
    t.string('name', 255);
    t.text('description');
    t.enum('condition', ['all', 'any']).notNullable();
    t.enum('operator', ['and', 'or']).notNullable();
    t.jsonb('value').notNullable();
    t.boolean('isRequired').notNullable().defaultTo(true);
    t.string('ruleGroup', 100).defaultTo('default');
    t.integer('sortOrder').notNullable().defaultTo(0);
    

    t.index('promotionId');
    t.index('condition');
    t.index('operator');
    t.index('ruleGroup');
    t.index('isRequired');
    t.index('sortOrder');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('promotionRule');
};
