exports.up = function(knex) {
  return knex.schema.createTable('productAttribute', t => {
    t.uuid('productAttributeId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.uuid('groupId').references('id').inTable('product_attribute_group');
    t.enu('type', null, { useNative: true, existingType: true, enumName: 'attributeType' }).notNullable().defaultTo('text');
    t.enu('inputType', null, { useNative: true, existingType: true, enumName: 'attributeInputType' }).defaultTo('text');
    t.boolean('isRequired').notNullable().defaultTo(false);
    t.boolean('isUnique').notNullable().defaultTo(false);
    t.boolean('isSystem').notNullable().defaultTo(false);
    t.boolean('isSearchable').notNullable().defaultTo(true);
    t.boolean('isFilterable').notNullable().defaultTo(true);
    t.boolean('isComparable').notNullable().defaultTo(true);
    t.boolean('isVisibleOnFront').notNullable().defaultTo(true);
    t.boolean('isUsedInProductListing').notNullable().defaultTo(false);
    t.boolean('useForVariants').notNullable().defaultTo(false);
    t.boolean('useForConfigurations').notNullable().defaultTo(false);
    t.integer('position').notNullable().defaultTo(0);
    t.text('defaultValue');
    t.jsonb('validationRules');
    t.jsonb('options');
    t.uuid('merchantId').references('id').inTable('merchant');
    t.boolean('isGlobal').notNullable().defaultTo(true);
    t.jsonb('metadata');

    t.index('code');
    t.index('groupId');
    t.index('type');
    t.index('isRequired');
    t.index('isSystem');
    t.index('isSearchable');
    t.index('isFilterable');
    t.index('isVisibleOnFront');
    t.index('useForVariants');
    t.index('useForConfigurations');
    t.index('position');
    t.index('merchantId');
    t.index('isGlobal');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('product_attribute');
};
