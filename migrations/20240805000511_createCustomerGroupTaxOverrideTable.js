exports.up = function(knex) {
  return knex.schema.createTable('customerGroupTaxOverride', t => {
    t.uuid('customerGroupTaxOverrideId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerGroupId').notNullable();
    t.uuid('taxCategoryId').notNullable().references('taxCategoryId').inTable('taxCategory').onDelete('CASCADE');
    t.uuid('taxRateId').references('taxRateId').inTable('taxRate').onDelete('SET NULL');
    t.boolean('isExempt').notNullable().defaultTo(false);
    t.text('exemptionReason');
    t.decimal('overrideRate', 10, 6);
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.text('notes');

    t.index('customerGroupId');
    t.index('taxCategoryId');
    t.index('taxRateId');
    t.index('isExempt');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.unique(['customerGroupId', 'taxCategoryId']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customerGroupTaxOverride');
};
