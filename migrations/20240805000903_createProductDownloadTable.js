exports.up = function(knex) {
  return knex.schema.createTable('productDownload', t => {
    t.uuid('productDownloadId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
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
    
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('productId');
    t.index('productVariantId');
    t.index('isActive');
    t.index('sortOrder');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productDownload');
};
