exports.up = function(knex) {
  return knex.schema.createTable('taxCalculationApplied', t => {
    t.uuid('taxCalculationAppliedId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('calculationId').notNullable().references('taxCalculationId').inTable('taxCalculation').onDelete('CASCADE');
    t.uuid('calculationLineId').references('taxCalculationLineId').inTable('taxCalculationLine').onDelete('CASCADE');
    t.uuid('taxRateId').references('taxRateId').inTable('taxRate').onDelete('CASCADE');
    t.string('taxRateName', 100).notNullable();
    t.uuid('taxZoneId').references('taxZoneId').inTable('taxZone').onDelete('CASCADE');
    t.string('taxZoneName', 100);
    t.uuid('taxCategoryId').references('taxCategoryId').inTable('taxCategory').onDelete('CASCADE');
    t.string('taxCategoryName', 100);
    t.enum('jurisdictionLevel', ['country', 'state', 'county', 'city', 'district', 'special']).notNullable();
    t.string('jurisdictionName', 100).notNullable();
    t.decimal('rate', 10, 6).notNullable();
    t.boolean('isCompound').notNullable().defaultTo(false);
    t.decimal('taxableAmount', 15, 2).notNullable();
    t.decimal('taxAmount', 15, 2).notNullable();

    t.index('calculationId');
    t.index('calculationLineId');
    t.index('taxRateId');
    t.index('taxZoneId');
    t.index('taxCategoryId');
    t.index('jurisdictionLevel');
    t.index('jurisdictionName');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxCalculationApplied');
};
