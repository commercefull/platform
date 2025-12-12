exports.up = function(knex) {
  return knex.schema.createTable('orderShipping', t => {
    t.uuid('orderShippingId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.string('shippingMethod', 100).notNullable();
    t.string('carrier', 100);
    t.string('service', 100);
    t.decimal('amount', 15, 2).notNullable();
    t.decimal('taxAmount', 15, 2);
    t.string('trackingNumber', 100);
    t.text('trackingUrl');
    t.timestamp('estimatedDeliveryDate');
    

    t.index('orderId');
    t.index('shippingMethod');
    t.index('carrier');
    t.index('trackingNumber');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderShipping');
};
