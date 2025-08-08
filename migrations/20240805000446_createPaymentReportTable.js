exports.up = function(knex) {
  return knex.schema.createTable('paymentReport', t => {
    t.uuid('paymentReportId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.string('type', 50).notNullable().checkIn(['transaction', 'payout', 'fee', 'settlement', 'summary', 'tax', 'custom']);
    t.string('format', 10).notNullable().checkIn(['csv', 'pdf', 'json', 'xlsx']).defaultTo('csv');
    t.jsonb('parameters');
    t.specificType('dateRange', 'tstzrange').notNullable();
    t.string('status', 20).notNullable().checkIn(['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    t.text('fileUrl');
    t.integer('size');
    t.text('errorMessage');
    t.string('notifyEmail', 255);
    t.uuid('createdBy');
    t.timestamp('generatedAt');
    t.timestamp('downloadedAt');
    t.timestamp('completedAt');
    t.timestamp('expiresAt');
    

    t.index('merchantId');
    t.index('type');
    t.index('status');
    t.index('createdBy');
    t.index('generatedAt');
    t.index('completedAt');
    t.index('createdAt');
    t.index('expiresAt');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('paymentReport');
};
