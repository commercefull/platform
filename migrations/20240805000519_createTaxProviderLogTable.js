exports.up = function(knex) {
  return knex.schema.createTable('taxProviderLog', t => {
    t.uuid('taxProviderLogId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.enum('provider', ['internal', 'avalara', 'taxjar', 'external']).notNullable();
    t.enum('requestType', ['calculation', 'verification', 'filing', 'refund', 'adjustment', 'validation']).notNullable();
    t.string('entityType', 50).notNullable();
    t.uuid('entityId');
    t.jsonb('requestData');
    t.jsonb('responseData');
    t.integer('responseStatus');
    t.boolean('isSuccess').notNullable();
    t.string('errorCode', 100);
    t.text('errorMessage');
    t.integer('processingTimeMs');
    t.string('providerReference', 255);

    t.index('merchantId');
    t.index('provider');
    t.index('requestType');
    t.index('entityType');
    t.index('entityId');
    t.index('isSuccess');
    t.index('providerReference');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxProviderLog');
};
