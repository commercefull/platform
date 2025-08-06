/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('merchantShippingTemplate', t => {
    t.uuid('merchantShippingTemplateId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.decimal('flatRate', 10, 2);
    t.decimal('freeShippingThreshold', 10, 2);
    t.integer('processingTime').defaultTo(1);
        t.enu('rulesType', ['flat', 'weight', 'price', 'distance', 'item', 'complex'], { useNative: true, enumName: 'merchantShippingTemplateRulesType' }).notNullable().defaultTo('flat');
    t.jsonb('rules');
    t.jsonb('shippingDestinations');
    t.jsonb('restrictedDestinations');
    t.jsonb('supportedCarriers');
    t.jsonb('metadata');
    t.index('merchantId');
    t.index('isDefault');
    t.index('isActive');
    t.index('flatRate');
    t.index('freeShippingThreshold');
    t.index('rulesType');
  }).then(() => {
        return knex.raw('CREATE UNIQUE INDEX "merchantShippingTemplateDefaultIdx" ON "merchantShippingTemplate" ("merchantId", "isDefault") WHERE "isDefault" = true');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantShippingTemplate')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS merchantShippingTemplateRulesType'));
};
