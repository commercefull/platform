exports.up = function(knex) {
  return knex.schema.createTable('shippingRate', t => {
    t.uuid('shippingRateId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('id').inTable('order').onDelete('CASCADE');
    t.enu('carrier', null, { useNative: true, existingType: true, enumName: 'shippingCarrier' }).notNullable();
    t.string('serviceLevel', 100).notNullable();
    t.string('serviceName', 255).notNullable();
    t.decimal('rate', 15, 2).notNullable();
    t.integer('estimatedDays');
    t.timestamp('estimatedDeliveryDate');
    t.string('currencyCode', 3).notNullable().defaultTo('USD');
    t.boolean('isSelected').notNullable().defaultTo(false);
    t.string('carrierAccountId', 100);
    t.string('shipmentId', 100);
    t.jsonb('metadata');
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
  return knex.schema.dropTable('shippingRate');
};
