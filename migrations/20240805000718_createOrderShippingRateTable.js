exports.up = function(knex) {
  return knex.schema.createTable('orderShippingRate', t => {
    t.uuid('orderShippingRateId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.enum('carrier', ['ups', 'usps', 'fedex', 'dhl', 'custom']).notNullable();
    t.string('serviceLevel', 100).notNullable();
    t.string('serviceName', 255).notNullable();
    t.decimal('rate', 15, 2).notNullable();
    t.integer('estimatedDays');
    t.timestamp('estimatedDeliveryDate');
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.boolean('isSelected').notNullable().defaultTo(false);
    t.string('carrierAccountId', 100);
    t.string('shipmentId', 100);
    
    t.jsonb('rateData');

    t.index('orderId');
    t.index('carrier');
    t.index('serviceLevel');
    t.index('rate');
    t.index('estimatedDays');
    t.index('isSelected');
    t.index('shipmentId');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderShippingRate');
};
