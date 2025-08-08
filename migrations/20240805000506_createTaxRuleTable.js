exports.up = function(knex) {
  return knex.schema.createTable('taxRule', t => {
    t.uuid('taxRuleId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('taxRateId').notNullable().references('taxRateId').inTable('taxRate').onDelete('CASCADE');
    t.string('name', 100);
    t.text('description');
    t.enum('conditionType', ['product', 'category', 'brand']).notNullable();
    t.jsonb('conditionValue').notNullable();
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    

    t.index('taxRateId');
    t.index('conditionType');
    t.index('sortOrder');
    t.index('isActive');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxRule');
};
