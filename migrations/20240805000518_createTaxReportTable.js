exports.up = function(knex) {
  return knex.schema.createTable('taxReport', t => {
    t.uuid('taxReportId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.enum('reportType', ['sales', 'filing', 'jurisdiction', 'summary', 'exemption', 'audit']).notNullable();
    t.timestamp('dateFrom').notNullable();
    t.timestamp('dateTo').notNullable();
    t.jsonb('taxJurisdictions');
    t.text('fileUrl');
    t.enum('fileFormat', ['csv', 'xlsx', 'pdf', 'json']);
    t.enum('status', ['pending', 'processing', 'completed', 'failed']).notNullable().defaultTo('pending');
    t.uuid('generatedBy').references('merchantId').inTable('merchant').onDelete('SET NULL');
    t.jsonb('parameters');
    t.jsonb('results');
    t.text('errorMessage');

    t.index('merchantId');
    t.index('reportType');
    t.index('dateFrom');
    t.index('dateTo');
    t.index('status');
    t.index('generatedBy');
    t.index('createdAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('taxReport');
};
