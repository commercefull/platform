exports.up = function(knex) {
  return knex.schema.createTable('taxNexus', t => {
    t.uuid('taxNexusId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.string('country', 2).notNullable();
    t.string('region', 100);
    t.string('regionCode', 10);
    t.string('city', 100);
    t.string('postalCode', 20);
    t.text('streetAddress');
    t.string('taxId', 100);
    t.string('registrationNumber', 100);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.timestamp('startDate').notNullable().defaultTo(knex.fn.now());
    t.timestamp('endDate');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.text('notes');
    

    t.index('merchantId');
    t.index('country');
    t.index('regionCode');
    t.index('city');
    t.index('postalCode');
    t.index('isDefault');
    t.index('isActive');
    t.index('startDate');
    t.index('endDate');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxNexus');
};
