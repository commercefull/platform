exports.up = function(knex) {
  return knex.schema.createTable('taxRate', t => {
    t.uuid('taxRateId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('taxCategoryId').notNullable().references('id').inTable('taxCategory').onDelete('CASCADE');
    t.uuid('taxZoneId').notNullable().references('id').inTable('taxZone').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.decimal('rate', 10, 6).notNullable();
    t.enum('type', ['percentage', 'fixed']).notNullable().defaultTo('percentage');
    t.integer('priority').notNullable().defaultTo(0);
    t.boolean('isCompound').notNullable().defaultTo(false);
    t.boolean('includeInPrice').notNullable().defaultTo(false);
    t.boolean('isShippingTaxable').notNullable().defaultTo(false);
    t.decimal('fixedAmount', 15, 2);
    t.decimal('minimumAmount', 15, 2);
    t.decimal('maximumAmount', 15, 2);
    t.decimal('threshold', 15, 2);
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.jsonb('metadata');

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

exports.down = function(knex) {
  return knex.schema.dropTable('taxRate');
};
