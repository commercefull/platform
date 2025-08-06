/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('merchantPaymentInfo', t => {
      t.uuid('merchantPaymentInfoId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('merchantId').notNullable().references('merchantId').inTable('merchant').onDelete('CASCADE');
      t.enum('paymentType', ['bankAccount', 'paypal', 'stripe', 'venmo', 'other']).notNullable();
      t.boolean('isDefault').notNullable().defaultTo(false);
      t.string('accountHolderName', 100);
      t.string('bankName', 100);
      t.string('accountNumber', 255);
      t.string('routingNumber', 255);
      t.string('accountType', 20);
      t.string('paypalEmail', 255);
      t.string('providerId', 255);
      t.jsonb('providerData');
      t.string('currency', 3).notNullable().defaultTo('USD');
      t.boolean('isVerified').notNullable().defaultTo(false);
      t.timestamp('verifiedAt');
      t.timestamp('lastPayoutDate');
      t.text('notes');
      t.jsonb('metadata');
      t.uuid('createdBy');
      t.index('merchantId');
      t.index('paymentType');
      t.index('isDefault');
      t.index('isVerified');
      t.index('providerId');
      t.index('lastPayoutDate');
    })
    .then(() => {
      return knex.schema.raw('CREATE UNIQUE INDEX merchant_payment_info_is_default_unique_index ON "merchantPaymentInfo" ("merchantId", "isDefault") WHERE "isDefault" = true');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('merchantPaymentInfo');
};
