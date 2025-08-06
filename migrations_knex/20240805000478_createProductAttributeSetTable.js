exports.up = function(knex) {
  return knex.schema.createTable('productAttributeSet', t => {
    t.uuid('productAttributeSetId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.uuid('productTypeId').references('productTypeId').inTable('productType').onDelete('CASCADE');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.uuid('merchantId').references('id').inTable('merchant');
    t.boolean('isGlobal').notNullable().defaultTo(true);
    t.jsonb('metadata');

    t.index('code');
    t.index('productTypeId');
    t.index('isActive');
    t.index('merchantId');
    t.index('isGlobal');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productAttributeSet');
};
