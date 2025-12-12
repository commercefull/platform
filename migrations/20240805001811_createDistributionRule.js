/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('distributionRule', (table) => {
    table.uuid('distributionRuleId').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('deletedAt').nullable();
    
    // Basic info
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.integer('priority').defaultTo(0).notNullable();
    table.boolean('isActive').defaultTo(true).notNullable();
    table.boolean('isDefault').defaultTo(false).notNullable();
    
    // Foreign keys - linking distribution entities
    table.uuid('distributionWarehouseId').nullable()
      .references('distributionWarehouseId').inTable('distributionWarehouse')
      .onDelete('SET NULL');
    table.uuid('distributionShippingZoneId').nullable()
      .references('distributionShippingZoneId').inTable('distributionShippingZone')
      .onDelete('SET NULL');
    table.uuid('distributionShippingMethodId').nullable()
      .references('distributionShippingMethodId').inTable('distributionShippingMethod')
      .onDelete('SET NULL');
    table.uuid('distributionShippingCarrierId').nullable()
      .references('distributionShippingCarrierId').inTable('distributionShippingCarrier')
      .onDelete('SET NULL');
    table.uuid('distributionFulfillmentPartnerId').nullable()
      .references('distributionFulfillmentPartnerId').inTable('distributionFulfillmentPartner')
      .onDelete('SET NULL');
    
    // Conditions for rule matching
    table.specificType('applicableCountries', 'text[]').nullable();
    table.specificType('applicableRegions', 'text[]').nullable();
    table.specificType('applicablePostalCodes', 'text[]').nullable();
    table.specificType('applicableProductCategories', 'text[]').nullable();
    table.specificType('applicableProductTags', 'text[]').nullable();
    table.specificType('excludedProductIds', 'uuid[]').nullable();
    
    // Order conditions
    table.decimal('minOrderValue', 12, 2).nullable();
    table.decimal('maxOrderValue', 12, 2).nullable();
    table.integer('minOrderItems').nullable();
    table.integer('maxOrderItems').nullable();
    table.decimal('minOrderWeight', 10, 3).nullable();
    table.decimal('maxOrderWeight', 10, 3).nullable();
    
    // Customer conditions
    table.specificType('applicableCustomerGroups', 'text[]').nullable();
    table.specificType('applicableMembershipTiers', 'text[]').nullable();
    
    // Time-based conditions
    table.timestamp('validFrom').nullable();
    table.timestamp('validTo').nullable();
    table.specificType('applicableDaysOfWeek', 'integer[]').nullable();
    
    // Settings
    table.jsonb('settings').nullable();
    table.jsonb('metadata').nullable();
    
    // Audit
    table.string('createdBy', 255).nullable();
    
    // Indexes
    table.index('priority');
    table.index('isActive');
    table.index('isDefault');
    table.index('distributionWarehouseId');
    table.index('distributionShippingZoneId');
    table.index('distributionShippingMethodId');
    table.index('distributionFulfillmentPartnerId');
    table.index('deletedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('distributionRule');
};
