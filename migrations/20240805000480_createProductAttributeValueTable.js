exports.up = function(knex) {
  return knex.schema.createTable('productAttributeValue', t => {
    t.uuid('productAttributeValueId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('attributeId').notNullable().references('attributeId').inTable('productAttribute').onDelete('CASCADE');
    t.text('value');
    t.text('valueText');
    t.decimal('valueNumeric', 15, 6);
    t.boolean('valueBoolean');
    t.jsonb('valueJson');
    t.timestamp('valueDate');
    t.boolean('isSystem').notNullable().defaultTo(false);
    t.string('language', 10).defaultTo('en');
    

    t.index('productId');
    t.index('productVariantId');
    t.index('attributeId');
    t.index('valueText');
    t.index('valueNumeric');
    t.index('valueBoolean');
    t.index('valueDate');
    t.index('isSystem');
    t.index('language');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productAttributeValue');
};
