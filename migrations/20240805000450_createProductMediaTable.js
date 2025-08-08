exports.up = function(knex) {
  return knex.schema.createTable('productMedia', t => {
    t.uuid('productMediaId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.string('type', 50).notNullable().checkIn(['image', 'video', 'document', '3d_model', 'audio']);
    t.text('url').notNullable();
    t.string('filename', 255);
    t.integer('filesize');
    t.string('mimeType', 100);
    t.string('altText', 255);
    t.string('title', 255);
    t.integer('sortOrder').notNullable().defaultTo(0);
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.integer('width');
    t.integer('height');
    t.integer('duration');
    
    t.index('productId');
    t.index('productVariantId');
    t.index('type');
    t.index('sortOrder');
    t.index('isPrimary');
    t.unique(['productId', 'isPrimary'], { predicate: knex.raw('"isPrimary" = true AND "productVariantId" IS NULL') });
    t.unique(['productVariantId', 'isPrimary'], { predicate: knex.raw('"isPrimary" = true AND "productVariantId" IS NOT NULL') });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('productMedia');
};
