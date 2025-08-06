exports.up = function(knex) {
  return knex.schema.createTable('productAttributeOption', t => {
    t.uuid('productAttributeOptionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('attributeId').notNullable().references('id').inTable('product_attribute').onDelete('CASCADE');
    t.string('value', 255).notNullable();
    t.string('label', 255).notNullable();
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('attributeId');
    t.index('value');
    t.index('position');
    t.index('isDefault');
    t.unique(['attributeId', 'value']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productAttributeOption');
};
