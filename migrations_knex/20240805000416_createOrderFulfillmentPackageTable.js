exports.up = function(knex) {
  return knex.schema.createTable('orderFulfillmentPackage', t => {
    t.uuid('orderFulfillmentPackageId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderFulfillmentId').notNullable().references('orderFulfillmentId').inTable('orderFulfillment').onDelete('CASCADE');
    t.string('packageNumber', 50).notNullable();
    t.string('trackingNumber', 100);
    t.decimal('weight', 10, 2);
    t.jsonb('dimensions');
    t.string('packageType', 50);
    t.text('shippingLabelUrl');
    t.text('commercialInvoiceUrl');
    t.jsonb('customsInfo');
    t.jsonb('metadata');

    t.index('fulfillmentId');
    t.index('packageNumber');
    t.index('trackingNumber');
    t.index('createdAt');
    t.index('updatedAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderFulfillmentPackage');
};
