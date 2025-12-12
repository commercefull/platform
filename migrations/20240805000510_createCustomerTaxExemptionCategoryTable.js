exports.up = function(knex) {
  return knex.schema.createTable('customerTaxExemptionCategory', t => {
    t.uuid('customerTaxExemptionCategoryId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('exemptionId').notNullable().references('customerTaxExemptionId').inTable('customerTaxExemption').onDelete('CASCADE');
    t.uuid('taxCategoryId').notNullable().references('taxCategoryId').inTable('taxCategory').onDelete('CASCADE');
    t.boolean('isExempt').notNullable().defaultTo(true);
    t.text('notes');

    t.index('exemptionId');
    t.index('taxCategoryId');
    t.unique(['exemptionId', 'taxCategoryId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customerTaxExemptionCategory');
};
