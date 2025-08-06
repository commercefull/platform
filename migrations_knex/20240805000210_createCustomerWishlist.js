/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('customerWishlist', t => {
      t.uuid('customerWishlistId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
      t.string('wishlistName', 100).notNullable().defaultTo('Default');
      t.text('wishlistDescription');
      t.boolean('isPublic').notNullable().defaultTo(false);
      t.string('shareToken', 100);
      t.index('customerId');
      t.index('isPublic');
      t.unique(['customerId', 'wishlistName']);
    })
    .then(() => {
      return knex.schema.raw('CREATE UNIQUE INDEX customer_wishlist_share_token_unique_idx ON "customerWishlist" ("shareToken") WHERE "shareToken" IS NOT NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('customerWishlist');
};
