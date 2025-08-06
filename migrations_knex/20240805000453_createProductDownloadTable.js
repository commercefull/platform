exports.up = function(knex) {
  return knex.schema.createTable('productDownload', t => {
    t.uuid('productDownloadId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('variantId').inTable('product_variant').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.text('fileUrl').notNullable();
    t.text('filePath');
    t.integer('fileSize');
    t.string('mimeType', 100);
    t.integer('maxDownloads');
    t.integer('daysValid');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.text('sampleUrl');
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('productId');
    t.index('variantId');
    t.index('isActive');
    t.index('sortOrder');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productDownload');
};
