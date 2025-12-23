/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distributionShippingMethod', table => {
    table.uuid('distributionShippingMethodId').primary().defaultTo(knex.raw('uuidv7()'));
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable();

    table
      .uuid('distributionShippingCarrierId')
      .nullable()
      .references('distributionShippingCarrierId')
      .inTable('distributionShippingCarrier')
      .onDelete('SET NULL');

    table.string('name', 100).notNullable();
    table.string('code', 50).notNullable().unique();
    table.text('description').nullable();
    table.boolean('isActive').defaultTo(true).notNullable();
    table.boolean('isDefault').defaultTo(false).notNullable();
    table.string('serviceCode', 50).nullable();
    table.enum('domesticInternational', ['domestic', 'international', 'both']).notNullable().defaultTo('both');
    table.jsonb('estimatedDeliveryDays').nullable();
    table.integer('handlingDays').nullable();
    table.integer('priority').nullable();
    table.boolean('displayOnFrontend').defaultTo(true).notNullable();
    table.boolean('allowFreeShipping').defaultTo(false).notNullable();
    table.decimal('minWeight', 10, 3).nullable();
    table.decimal('maxWeight', 10, 3).nullable();
    table.decimal('minOrderValue', 15, 2).nullable();
    table.decimal('maxOrderValue', 15, 2).nullable();
    table.jsonb('dimensionRestrictions').nullable();
    table.string('shippingClass', 50).nullable();
    table.jsonb('customFields').nullable();
    table.uuid('createdBy').nullable();

    table.index('code');
    table.index('isActive');
    table.index('isDefault');
    table.index('distributionShippingCarrierId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('distributionShippingMethod');
};
