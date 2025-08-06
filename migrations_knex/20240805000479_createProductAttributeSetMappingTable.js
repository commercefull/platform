exports.up = function(knex) {
  return knex.schema.createTable('productAttributeSetMapping', t => {
    t.uuid('productAttributeSetMappingId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('attributeSetId').notNullable().references('productAttributeSetId').inTable('productAttributeSet').onDelete('CASCADE');
    t.uuid('attributeId').notNullable().references('productAttributeId').inTable('productAttribute').onDelete('CASCADE');
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('isRequired').notNullable().defaultTo(false);
    t.text('defaultValue');
    t.jsonb('metadata');

    t.index('attributeSetId');
    t.index('attributeId');
    t.index('position');
    t.unique(['attributeSetId', 'attributeId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productAttributeSetMapping');
};
