/**
 * Seed Fashion Shipping
 * Creates shipping zones and rates for UK and US stores.
 *
 * UK: Royal Mail (Standard, Tracked), DPD (Next Day), Free over £50
 * US: UPS (Ground, Next Day), FedEx (Ground, Express), Free over $75
 */

const CARRIER = {
  ROYAL_MAIL: '33000000-0000-0000-0000-000000000001',
  DPD: '33000000-0000-0000-0000-000000000002',
  UPS: '33000000-0000-0000-0000-000000000003',
  FEDEX: '33000000-0000-0000-0000-000000000004',
};

const METHOD = {
  RM_STANDARD: '33000001-0000-0000-0000-000000000001',
  RM_TRACKED: '33000001-0000-0000-0000-000000000002',
  DPD_NEXT_DAY: '33000001-0000-0000-0000-000000000003',
  UPS_GROUND: '33000001-0000-0000-0000-000000000004',
  UPS_NEXT_DAY: '33000001-0000-0000-0000-000000000005',
  FEDEX_GROUND: '33000001-0000-0000-0000-000000000006',
  FEDEX_EXPRESS: '33000001-0000-0000-0000-000000000007',
};

const ZONE = {
  UK: '33000002-0000-0000-0000-000000000001',
  US: '33000002-0000-0000-0000-000000000002',
};

const RATE = {
  RM_STANDARD_UK: '33000003-0000-0000-0000-000000000001',
  RM_TRACKED_UK: '33000003-0000-0000-0000-000000000002',
  DPD_NEXT_DAY_UK: '33000003-0000-0000-0000-000000000003',
  FREE_UK: '33000003-0000-0000-0000-000000000004',
  UPS_GROUND_US: '33000003-0000-0000-0000-000000000005',
  UPS_NEXT_DAY_US: '33000003-0000-0000-0000-000000000006',
  FEDEX_GROUND_US: '33000003-0000-0000-0000-000000000007',
  FREE_US: '33000003-0000-0000-0000-000000000008',
};

exports.seed = async function (knex) {
  const now = knex.fn.now();

  // Clean up existing fashion shipping data
  await knex('shippingRate').whereIn('shippingRateId', Object.values(RATE)).del();
  await knex('shippingMethod').whereIn('shippingMethodId', Object.values(METHOD)).del();
  await knex('shippingZone').whereIn('shippingZoneId', Object.values(ZONE)).del();
  await knex('shippingCarrier').whereIn('shippingCarrierId', Object.values(CARRIER)).del();

  // === Carriers ===
  await knex('shippingCarrier').insert([
    {
      shippingCarrierId: CARRIER.ROYAL_MAIL,
      name: 'Royal Mail',
      code: 'royal_mail',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingCarrierId: CARRIER.DPD,
      name: 'DPD',
      code: 'dpd',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingCarrierId: CARRIER.UPS,
      name: 'UPS',
      code: 'ups',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingCarrierId: CARRIER.FEDEX,
      name: 'FedEx',
      code: 'fedex',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // === Shipping Zones ===
  await knex('shippingZone').insert([
    {
      shippingZoneId: ZONE.UK,
      name: 'UK Domestic',
      description: 'United Kingdom domestic shipping',
      isActive: true,
      priority: 10,
      locationType: 'country',
      locations: JSON.stringify(['GB']),
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingZoneId: ZONE.US,
      name: 'US Domestic',
      description: 'United States domestic shipping',
      isActive: true,
      priority: 10,
      locationType: 'country',
      locations: JSON.stringify(['US']),
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // === Shipping Methods ===
  await knex('shippingMethod').insert([
    {
      shippingMethodId: METHOD.RM_STANDARD,
      shippingCarrierId: CARRIER.ROYAL_MAIL,
      name: 'Royal Mail Standard',
      code: 'rm_standard',
      description: '2-5 business days',
      isActive: true,
      isTracked: false,
      estimatedDeliveryDays: '2-5',
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingMethodId: METHOD.RM_TRACKED,
      shippingCarrierId: CARRIER.ROYAL_MAIL,
      name: 'Royal Mail Tracked',
      code: 'rm_tracked',
      description: '2-3 business days with tracking',
      isActive: true,
      isTracked: true,
      estimatedDeliveryDays: '2-3',
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingMethodId: METHOD.DPD_NEXT_DAY,
      shippingCarrierId: CARRIER.DPD,
      name: 'DPD Next Day',
      code: 'dpd_next_day',
      description: 'Next business day delivery',
      isActive: true,
      isTracked: true,
      estimatedDeliveryDays: '1',
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingMethodId: METHOD.UPS_GROUND,
      shippingCarrierId: CARRIER.UPS,
      name: 'UPS Ground',
      code: 'ups_ground',
      description: '3-5 business days',
      isActive: true,
      isTracked: true,
      estimatedDeliveryDays: '3-5',
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingMethodId: METHOD.UPS_NEXT_DAY,
      shippingCarrierId: CARRIER.UPS,
      name: 'UPS Next Day Air',
      code: 'ups_next_day',
      description: 'Next business day delivery',
      isActive: true,
      isTracked: true,
      estimatedDeliveryDays: '1',
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingMethodId: METHOD.FEDEX_GROUND,
      shippingCarrierId: CARRIER.FEDEX,
      name: 'FedEx Ground',
      code: 'fedex_ground',
      description: '3-7 business days',
      isActive: true,
      isTracked: true,
      estimatedDeliveryDays: '3-7',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // === Shipping Rates ===
  await knex('shippingRate').insert([
    // UK rates (GBP)
    {
      shippingRateId: RATE.RM_STANDARD_UK,
      shippingZoneId: ZONE.UK,
      shippingMethodId: METHOD.RM_STANDARD,
      name: 'Standard UK',
      isActive: true,
      rateType: 'flat',
      baseRate: 3.95,
      currency: 'GBP',
      taxable: false,
      priority: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingRateId: RATE.RM_TRACKED_UK,
      shippingZoneId: ZONE.UK,
      shippingMethodId: METHOD.RM_TRACKED,
      name: 'Tracked UK',
      isActive: true,
      rateType: 'flat',
      baseRate: 5.95,
      currency: 'GBP',
      taxable: false,
      priority: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingRateId: RATE.DPD_NEXT_DAY_UK,
      shippingZoneId: ZONE.UK,
      shippingMethodId: METHOD.DPD_NEXT_DAY,
      name: 'DPD Next Day UK',
      isActive: true,
      rateType: 'flat',
      baseRate: 9.95,
      currency: 'GBP',
      taxable: false,
      priority: 30,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingRateId: RATE.FREE_UK,
      shippingZoneId: ZONE.UK,
      shippingMethodId: METHOD.RM_TRACKED,
      name: 'Free UK Shipping (over £50)',
      isActive: true,
      rateType: 'free',
      baseRate: 0,
      freeThreshold: 50.0,
      currency: 'GBP',
      taxable: false,
      priority: 5,
      createdAt: now,
      updatedAt: now,
    },
    // US rates (USD)
    {
      shippingRateId: RATE.UPS_GROUND_US,
      shippingZoneId: ZONE.US,
      shippingMethodId: METHOD.UPS_GROUND,
      name: 'UPS Ground US',
      isActive: true,
      rateType: 'flat',
      baseRate: 7.95,
      currency: 'USD',
      taxable: false,
      priority: 10,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingRateId: RATE.UPS_NEXT_DAY_US,
      shippingZoneId: ZONE.US,
      shippingMethodId: METHOD.UPS_NEXT_DAY,
      name: 'UPS Next Day US',
      isActive: true,
      rateType: 'flat',
      baseRate: 24.95,
      currency: 'USD',
      taxable: false,
      priority: 30,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingRateId: RATE.FEDEX_GROUND_US,
      shippingZoneId: ZONE.US,
      shippingMethodId: METHOD.FEDEX_GROUND,
      name: 'FedEx Ground US',
      isActive: true,
      rateType: 'flat',
      baseRate: 8.95,
      currency: 'USD',
      taxable: false,
      priority: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      shippingRateId: RATE.FREE_US,
      shippingZoneId: ZONE.US,
      shippingMethodId: METHOD.UPS_GROUND,
      name: 'Free US Shipping (over $75)',
      isActive: true,
      rateType: 'free',
      baseRate: 0,
      freeThreshold: 75.0,
      currency: 'USD',
      taxable: false,
      priority: 5,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log('Seeded fashion shipping — UK (GBP) and US (USD) rates');
};

exports.CARRIER = CARRIER;
exports.METHOD = METHOD;
exports.ZONE = ZONE;
exports.RATE = RATE;
