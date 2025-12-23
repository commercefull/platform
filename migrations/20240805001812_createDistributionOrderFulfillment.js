/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionOrderFulfillment', table => {
    table.uuid('distributionOrderFulfillmentId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('deletedAt').nullable();

    // Order reference
    table.uuid('orderId').notNullable();
    table.string('orderNumber', 100).nullable();

    // Status tracking
    table
      .enum('status', [
        'pending',
        'processing',
        'picking',
        'packing',
        'ready_to_ship',
        'shipped',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'failed',
        'returned',
        'cancelled',
      ])
      .defaultTo('pending')
      .notNullable();
    table.string('statusReason', 500).nullable();

    // Foreign keys
    table
      .uuid('distributionWarehouseId')
      .nullable()
      .references('distributionWarehouseId')
      .inTable('distributionWarehouse')
      .onDelete('SET NULL');
    table.uuid('distributionRuleId').nullable().references('distributionRuleId').inTable('distributionRule').onDelete('SET NULL');
    table
      .uuid('distributionShippingMethodId')
      .nullable()
      .references('distributionShippingMethodId')
      .inTable('distributionShippingMethod')
      .onDelete('SET NULL');
    table
      .uuid('distributionShippingCarrierId')
      .nullable()
      .references('distributionShippingCarrierId')
      .inTable('distributionShippingCarrier')
      .onDelete('SET NULL');
    table
      .uuid('distributionFulfillmentPartnerId')
      .nullable()
      .references('distributionFulfillmentPartnerId')
      .inTable('distributionFulfillmentPartner')
      .onDelete('SET NULL');

    // Shipping details
    table.string('trackingNumber', 255).nullable();
    table.string('trackingUrl', 500).nullable();
    table.string('carrierCode', 100).nullable();
    table.string('serviceCode', 100).nullable();

    // Shipping address
    table.string('shipToName', 255).nullable();
    table.string('shipToCompany', 255).nullable();
    table.string('shipToAddressLine1', 500).nullable();
    table.string('shipToAddressLine2', 500).nullable();
    table.string('shipToCity', 255).nullable();
    table.string('shipToState', 255).nullable();
    table.string('shipToPostalCode', 50).nullable();
    table.string('shipToCountry', 100).nullable();
    table.string('shipToPhone', 50).nullable();
    table.string('shipToEmail', 255).nullable();

    // Package details
    table.decimal('packageWeight', 10, 3).nullable();
    table.string('packageWeightUnit', 10).defaultTo('kg').nullable();
    table.decimal('packageLength', 10, 2).nullable();
    table.decimal('packageWidth', 10, 2).nullable();
    table.decimal('packageHeight', 10, 2).nullable();
    table.string('packageDimensionUnit', 10).defaultTo('cm').nullable();
    table.integer('packageCount').defaultTo(1).notNullable();

    // Costs
    table.decimal('shippingCost', 12, 2).nullable();
    table.decimal('insuranceCost', 12, 2).nullable();
    table.decimal('handlingCost', 12, 2).nullable();
    table.decimal('totalCost', 12, 2).nullable();
    table.string('currency', 3).defaultTo('USD').notNullable();

    // Timestamps
    table.timestamp('pickedAt').nullable();
    table.timestamp('packedAt').nullable();
    table.timestamp('shippedAt').nullable();
    table.timestamp('deliveredAt').nullable();
    table.timestamp('estimatedDeliveryAt').nullable();
    table.timestamp('actualDeliveryAt').nullable();

    // Notes and metadata
    table.text('internalNotes').nullable();
    table.text('customerNotes').nullable();
    table.jsonb('shippingLabel').nullable();
    table.jsonb('trackingEvents').nullable();
    table.jsonb('metadata').nullable();

    // Audit
    table.string('pickedBy', 255).nullable();
    table.string('packedBy', 255).nullable();
    table.string('shippedBy', 255).nullable();
    table.string('createdBy', 255).nullable();

    // Indexes
    table.index('orderId');
    table.index('orderNumber');
    table.index('status');
    table.index('trackingNumber');
    table.index('distributionWarehouseId');
    table.index('distributionRuleId');
    table.index('distributionShippingMethodId');
    table.index('distributionFulfillmentPartnerId');
    table.index('shippedAt');
    table.index('deliveredAt');
    table.index('deletedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('distributionOrderFulfillment');
};
