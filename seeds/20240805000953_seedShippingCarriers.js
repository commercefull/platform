/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('shippingCarrier').insert([
    { name: 'UPS', code: 'UPS', description: 'United Parcel Service', trackingUrl: 'https://www.ups.com/track?tracknum={tracking_number}', isActive: true },
    { name: 'FedEx', code: 'FEDEX', description: 'Federal Express', trackingUrl: 'https://www.fedex.com/apps/fedextrack/?tracknumbers={tracking_number}', isActive: true },
    { name: 'USPS', code: 'USPS', description: 'United States Postal Service', trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}', isActive: true },
    { name: 'DHL', code: 'DHL', description: 'DHL Express', trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}', isActive: true },
    { name: 'Custom', code: 'CUSTOM', description: 'Custom or manual shipping methods', trackingUrl: '', isActive: true }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('shippingCarrier').whereIn('code', ['UPS', 'FEDEX', 'USPS', 'DHL', 'CUSTOM']).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
