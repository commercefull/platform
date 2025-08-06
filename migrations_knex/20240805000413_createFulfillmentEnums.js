exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE TYPE "shipmentStatus" AS ENUM (
      'pending',
      'processing',
      'readyForPickup',
      'pickedUp',
      'inTransit',
      'outForDelivery',
      'delivered',
      'failedDelivery',
      'returned',
      'cancelled'
    );
    CREATE TYPE "shippingCarrier" AS ENUM (
      'fedex',
      'ups',
      'usps',
      'dhl',
      'amazon',
      'other'
    );
    CREATE TYPE "fulfillmentProvider" AS ENUM (
      'self',
      'shipbob',
      'shipmonk',
      'amazonFba',
      'shopifyFulfillment',
      'externalWarehouse',
      'other'
    );
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP TYPE "shipmentStatus";
    DROP TYPE "shippingCarrier";
    DROP TYPE "fulfillmentProvider";
  `);
};
