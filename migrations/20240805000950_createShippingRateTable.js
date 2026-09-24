/**
 * Shipping Rate Migration
 * Creates the shippingRate table for shipping rate configuration per zone/method
 */
exports.up = function (knex) {
  return knex.schema.createTable('shippingRate', t => {
    t.uuid('shippingRateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('shippingZoneId').notNullable().references('shippingZoneId').inTable('shippingZone').onDelete('CASCADE');
    t.uuid('shippingMethodId').notNullable().references('shippingMethodId').inTable('shippingMethod').onDelete('CASCADE');
    t.string('name', 100);
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enum('rateType', ['flat', 'weightBased', 'priceBased', 'itemBased', 'dimensional', 'calculated', 'free']).notNullable();
    t.bigInteger('baseRateCents').notNullable();
    t.bigInteger('perItemRateCents').defaultTo(0);
    t.bigInteger('freeThresholdCents');
    t.jsonb('rateMatrix');
    t.bigInteger('minRateCents');
    t.bigInteger('maxRateCents');
    t.string('currencyCode', 3).notNullable().defaultTo('USD').references('code').inTable('currency');
    t.boolean('taxable').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.timestamp('validFrom');
    t.timestamp('validTo');
    t.jsonb('conditions');

    t.uuid('createdBy');
    t.index('shippingZoneId');
    t.index('shippingMethodId');
    t.index('isActive');
    t.index('rateType');
    t.index('priority');
    t.index('currencyCode');
    t.index('validFrom');
    t.index('validTo');
    t.unique(['shippingZoneId', 'shippingMethodId']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('shippingRate');
};
