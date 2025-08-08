exports.up = function(knex) {
  return knex.schema.createTable('orderFulfillmentItem', t => {
    t.uuid('orderFulfillmentItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('orderFulfillmentId').notNullable().references('orderFulfillmentId').inTable('orderFulfillment').onDelete('CASCADE');
    t.uuid('orderItemId').notNullable().references('orderItemId').inTable('orderItem').onDelete('CASCADE');
    t.integer('quantity').notNullable();
    t.uuid('inventoryItemId').references('inventoryItemId').inTable('inventoryItem');
    t.uuid('warehouseLocationId').references('warehouseLocationId').inTable('warehouseLocation');
    t.string('lotNumber', 100);
    t.string('serialNumber', 100);
    t.text('notes');
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index('fulfillmentId');
    t.index('orderItemId');
    t.index('inventoryItemId');
    t.index('warehouseLocationId');
    t.index('lotNumber');
    t.index('serialNumber');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderFulfillmentItem');
};
