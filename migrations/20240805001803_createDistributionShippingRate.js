/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('distributionShippingRate', (table) => {
    table.uuid('distributionShippingRateId').primary().defaultTo(knex.raw('uuidv7()'));
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();
    
    table.uuid('distributionShippingZoneId').notNullable()
      .references('distributionShippingZoneId').inTable('distributionShippingZone')
      .onDelete('CASCADE');
    table.uuid('distributionShippingMethodId').notNullable()
      .references('distributionShippingMethodId').inTable('distributionShippingMethod')
      .onDelete('CASCADE');
    
    table.string('name', 100).nullable();
    table.text('description').nullable();
    table.boolean('isActive').defaultTo(true).notNullable();
    table.enum('rateType', ['flat', 'weight', 'price', 'item', 'tiered', 'calculated', 'free']).notNullable().defaultTo('flat');
    table.decimal('baseRate', 15, 2).notNullable().defaultTo(0);
    table.decimal('perItemRate', 15, 2).nullable();
    table.decimal('freeThreshold', 15, 2).nullable();
    table.jsonb('rateMatrix').nullable();
    table.decimal('minRate', 15, 2).nullable();
    table.decimal('maxRate', 15, 2).nullable();
    table.string('currency', 3).notNullable().defaultTo('USD');
    table.boolean('taxable').defaultTo(true).notNullable();
    table.integer('priority').nullable();
    table.timestamp('validFrom').nullable();
    table.timestamp('validTo').nullable();
    table.jsonb('conditions').nullable();
    table.uuid('createdBy').nullable();

    table.index('distributionShippingZoneId');
    table.index('distributionShippingMethodId');
    table.index('isActive');
    table.index('rateType');
    table.unique(['distributionShippingZoneId', 'distributionShippingMethodId']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('distributionShippingRate');
};
