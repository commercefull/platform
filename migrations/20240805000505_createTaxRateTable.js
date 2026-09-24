exports.up = function (knex) {
  return knex.schema.createTable('taxRate', t => {
    t.uuid('taxRateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('taxCategoryId').notNullable().references('taxCategoryId').inTable('taxCategory').onDelete('CASCADE');
    t.uuid('taxZoneId').notNullable().references('taxZoneId').inTable('taxZone').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.decimal('rate', 10, 6).notNullable();
    t.enum('type', ['percentage', 'fixed']).notNullable().defaultTo('percentage');
    t.integer('priority').notNullable().defaultTo(0);
    t.boolean('isCompound').notNullable().defaultTo(false);
    t.boolean('includeInPrice').notNullable().defaultTo(false);
    t.boolean('isShippingTaxable').notNullable().defaultTo(false);
    t.bigInteger('fixedAmountCents');
    t.bigInteger('minimumAmountCents');
    t.bigInteger('maximumAmountCents');
    t.bigInteger('thresholdCents');
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index('taxCategoryId');
    t.index('taxZoneId');
    t.index('rate');
    t.index('type');
    t.index('priority');
    t.index('isCompound');
    t.index('includeInPrice');
    t.index('isShippingTaxable');
    t.index('startDate');
    t.index('endDate');
    t.index('isActive');
    t.unique(['taxCategoryId', 'taxZoneId', 'priority']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('taxRate');
};
