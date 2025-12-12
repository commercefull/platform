/**
 * Distribution Shipping Rate Migration
 * Creates the distributionShippingRate table for shipping rate configuration per zone/method
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionShippingRate', t => {
    t.uuid('distributionShippingRateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('distributionShippingZoneId').notNullable().references('distributionShippingZoneId').inTable('distributionShippingZone').onDelete('CASCADE');
    t.uuid('distributionShippingMethodId').notNullable().references('distributionShippingMethodId').inTable('distributionShippingMethod').onDelete('CASCADE');
    t.string('name', 100);
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enum('rateType', ['flat', 'weightBased', 'priceBased', 'itemBased', 'dimensional', 'calculated', 'free']).notNullable();
    t.decimal('baseRate', 10, 2).notNullable();
    t.decimal('perItemRate', 10, 2).defaultTo(0);
    t.decimal('freeThreshold', 10, 2);
    t.jsonb('rateMatrix');
    t.decimal('minRate', 10, 2);
    t.decimal('maxRate', 10, 2);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.boolean('taxable').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.timestamp('validFrom');
    t.timestamp('validTo');
    t.jsonb('conditions');
    
    t.uuid('createdBy');
    t.index('distributionShippingZoneId');
    t.index('distributionShippingMethodId');
    t.index('isActive');
    t.index('rateType');
    t.index('priority');
    t.index('currency');
    t.index('validFrom');
    t.index('validTo');
    t.unique(['distributionShippingZoneId', 'distributionShippingMethodId']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('distributionShippingRate');
};
