exports.up = function(knex) {
  return knex.schema.createTable('productTaxExemption', t => {
    t.uuid('productTaxExemptionId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('taxZoneId').notNullable().references('taxZoneId').inTable('taxZone').onDelete('CASCADE');
    t.uuid('taxCategoryId').references('taxCategoryId').inTable('taxCategory').onDelete('SET NULL');
    t.boolean('isExempt').notNullable().defaultTo(true);
    t.text('exemptionReason');
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.text('notes');

    t.index('productId');
    t.index('productVariantId');
    t.index('taxZoneId');
    t.index('taxCategoryId');
    t.index('isExempt');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.unique(['productId', 'productVariantId', 'taxZoneId'], 'productTaxExemptionVariantUnique').whereNotNull('productVariantId');
    t.unique(['productId', 'taxZoneId'], 'productTaxExemptionUnique').whereNull('productVariantId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productTaxExemption');
};
