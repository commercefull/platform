exports.up = function(knex) {
  return knex.schema.createTable('orderReturnItem', t => {
    t.uuid('orderReturnItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('orderReturnId').notNullable().references('orderReturnId').inTable('orderReturn').onDelete('CASCADE');
    t.uuid('orderItemId').notNullable().references('orderItemId').inTable('orderItem').onDelete('CASCADE');
    t.integer('quantity').notNullable();
    t.enum('returnReason', ['productNotAsDescribed', 'wrongProduct', 'damaged', 'expired', 'other']).notNullable();
    t.text('returnReasonDetail');
    t.string('condition', 50).notNullable().checkIn(['new', 'likeNew', 'used', 'damaged', 'unsellable']);
    t.boolean('restockItem').notNullable().defaultTo(false);
    t.decimal('refundAmount', 15, 2);
    t.uuid('exchangeProductId').references('productId').inTable('product');
    t.uuid('exchangeVariantId').references('productVariantId').inTable('productVariant');
    
    t.text('notes');
    t.text('inspectionNotes');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());

    t.index('orderReturnId');
    t.index('orderItemId');
    t.index('returnReason');
    t.index('condition');
    t.index('restockItem');
    t.index('exchangeProductId');
    t.index('exchangeVariantId');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('orderReturnItem');
};
