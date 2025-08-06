exports.up = function(knex) {
  return knex.schema.createTable('orderFulfillment', t => {
    t.uuid('orderFulfillmentId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('warehouseId').references('warehouseId').inTable('warehouse');
    t.string('fulfillmentNumber', 50).notNullable().unique();
    t.enum('status', ['pending', 'shipped', 'delivered', 'cancelled', 'failed']).notNullable().defaultTo('pending');
    t.enum('provider', ['self', 'thirdParty']).notNullable().defaultTo('self');
    t.enum('carrier', ['ups', 'fedex', 'dhl', 'usps', 'custom']).notNullable();
    t.string('serviceLevel', 100);
    t.string('trackingNumber', 100);
    t.text('trackingUrl');
    t.text('labelUrl');
    t.string('manifestId', 100);
    t.uuid('shippingAddressId').references('customerAddressId').inTable('customerAddress');
    t.jsonb('shippingAddress').notNullable();
    t.decimal('shippingCost', 15, 2);
    t.integer('packageCount').defaultTo(1);
    t.decimal('totalWeight', 10, 2);
    t.jsonb('dimensions');
    t.string('packagingType', 50);
    t.string('shippingMethod', 100);
    t.text('instructions');
    t.text('notes');
    t.jsonb('metadata');
    t.string('createdBy', 255);
    t.jsonb('fulfillmentData');
    t.timestamp('estimatedDeliveryDate');
    t.timestamp('shippedAt');
    t.timestamp('deliveredAt');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('orderId');
    t.index('warehouseId');
    t.index('fulfillmentNumber');
    t.index('status');
    t.index('provider');
    t.index('carrier');
    t.index('trackingNumber');
    t.index('shippingAddressId');
    t.index('shippedAt');
    t.index('deliveredAt');
    t.index('estimatedDeliveryDate');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderFulfillment');
};
