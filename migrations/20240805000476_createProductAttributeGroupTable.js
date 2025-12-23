exports.up = function (knex) {
  return knex.schema.createTable('productAttributeGroup', t => {
    t.uuid('productAttributeGroupId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.integer('position').notNullable().defaultTo(0);
    t.boolean('isVisible').notNullable().defaultTo(true);
    t.boolean('isComparable').notNullable().defaultTo(true);
    t.uuid('merchantId').references('merchantId').inTable('merchant');
    t.boolean('isGlobal').notNullable().defaultTo(true);

    t.index('code');
    t.index('position');
    t.index('isVisible');
    t.index('isComparable');
    t.index('merchantId');
    t.index('isGlobal');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('productAttributeGroup');
};
