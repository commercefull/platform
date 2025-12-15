/**
 * Shipping Test Data Seed
 * Seeds test data for shipping integration tests
 */

// Fixed UUIDs for test data consistency
const CARRIER_IDS = {
  UPS: '01936000-0000-7000-8000-000000000001',
  FEDEX: '01936000-0000-7000-8000-000000000002',
  USPS: '01936000-0000-7000-8000-000000000003'
};

const METHOD_IDS = {
  UPS_GROUND: '01936001-0000-7000-8000-000000000001',
  UPS_EXPRESS: '01936001-0000-7000-8000-000000000002',
  FEDEX_GROUND: '01936001-0000-7000-8000-000000000003',
  FEDEX_OVERNIGHT: '01936001-0000-7000-8000-000000000004',
  USPS_PRIORITY: '01936001-0000-7000-8000-000000000005',
  FREE_SHIPPING: '01936001-0000-7000-8000-000000000006'
};

const ZONE_IDS = {
  US_DOMESTIC: '01936002-0000-7000-8000-000000000001',
  US_WEST: '01936002-0000-7000-8000-000000000002',
  INTERNATIONAL: '01936002-0000-7000-8000-000000000003'
};

const RATE_IDS = {
  UPS_GROUND_US: '01936003-0000-7000-8000-000000000001',
  UPS_EXPRESS_US: '01936003-0000-7000-8000-000000000002',
  FEDEX_GROUND_US: '01936003-0000-7000-8000-000000000003',
  FREE_SHIPPING_US: '01936003-0000-7000-8000-000000000004'
};

const PACKAGING_IDS = {
  SMALL_BOX: '01936004-0000-7000-8000-000000000001',
  MEDIUM_BOX: '01936004-0000-7000-8000-000000000002',
  LARGE_BOX: '01936004-0000-7000-8000-000000000003',
  ENVELOPE: '01936004-0000-7000-8000-000000000004'
};

exports.seed = async function(knex) {
  // Check if required tables exist
  const hasCarrierTable = await knex.schema.hasTable('shippingCarrier');
  if (!hasCarrierTable) {
    console.log('Shipping tables not found, skipping shipping test data seed');
    return;
  }

  // Clean up existing test data (with catch for missing tables)
  await knex('shippingRate').whereIn('shippingRateId', Object.values(RATE_IDS)).del().catch(() => {});
  await knex('shippingMethod').whereIn('shippingMethodId', Object.values(METHOD_IDS)).del().catch(() => {});
  await knex('shippingZone').whereIn('shippingZoneId', Object.values(ZONE_IDS)).del().catch(() => {});
  await knex('shippingCarrier').whereIn('shippingCarrierId', Object.values(CARRIER_IDS)).del().catch(() => {});
  await knex('shippingPackagingType').whereIn('shippingPackagingTypeId', Object.values(PACKAGING_IDS)).del().catch(() => {});

  // Seed Shipping Carriers
  await knex('shippingCarrier').insert([
    {
      shippingCarrierId: CARRIER_IDS.UPS,
      name: 'UPS',
      code: 'TEST_UPS',
      description: 'United Parcel Service',
      websiteUrl: 'https://www.ups.com',
      trackingUrl: 'https://www.ups.com/track?tracknum={tracking}',
      isActive: true,
      hasApiIntegration: true,
      requiresContract: false,
      supportedRegions: JSON.stringify(['US', 'CA', 'MX', 'EU']),
      supportedServices: JSON.stringify(['ground', 'express', 'overnight'])
    },
    {
      shippingCarrierId: CARRIER_IDS.FEDEX,
      name: 'FedEx',
      code: 'TEST_FEDEX',
      description: 'Federal Express',
      websiteUrl: 'https://www.fedex.com',
      trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={tracking}',
      isActive: true,
      hasApiIntegration: true,
      requiresContract: false,
      supportedRegions: JSON.stringify(['US', 'CA', 'MX', 'EU', 'APAC']),
      supportedServices: JSON.stringify(['ground', 'express', 'overnight', 'freight'])
    },
    {
      shippingCarrierId: CARRIER_IDS.USPS,
      name: 'USPS',
      code: 'TEST_USPS',
      description: 'United States Postal Service',
      websiteUrl: 'https://www.usps.com',
      trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}',
      isActive: true,
      hasApiIntegration: false,
      requiresContract: false,
      supportedRegions: JSON.stringify(['US']),
      supportedServices: JSON.stringify(['priority', 'express', 'first-class'])
    }
  ]).onConflict('shippingCarrierId').ignore();

  // Seed Shipping Zones
  await knex('shippingZone').insert([
    {
      shippingZoneId: ZONE_IDS.US_DOMESTIC,
      name: 'US Domestic',
      description: 'Continental United States',
      isActive: true,
      priority: 1,
      locationType: 'country',
      locations: JSON.stringify(['US'])
    },
    {
      shippingZoneId: ZONE_IDS.US_WEST,
      name: 'US West Coast',
      description: 'Western US States',
      isActive: true,
      priority: 0,
      locationType: 'state',
      locations: JSON.stringify(['CA', 'OR', 'WA', 'NV', 'AZ'])
    },
    {
      shippingZoneId: ZONE_IDS.INTERNATIONAL,
      name: 'International',
      description: 'International shipping zone',
      isActive: true,
      priority: 10,
      locationType: 'country',
      locations: JSON.stringify(['CA', 'MX', 'GB', 'DE', 'FR', 'AU']),
      excludedLocations: JSON.stringify(['US'])
    }
  ]).onConflict('shippingZoneId').ignore();

  // Seed Shipping Methods
  await knex('shippingMethod').insert([
    {
      shippingMethodId: METHOD_IDS.UPS_GROUND,
      shippingCarrierId: CARRIER_IDS.UPS,
      name: 'UPS Ground',
      code: 'UPS_GROUND',
      description: 'Standard ground shipping via UPS',
      isActive: true,
      isDefault: false,
      serviceCode: '03',
      domesticInternational: 'domestic',
      estimatedDeliveryDays: JSON.stringify({ min: 3, max: 7 }),
      handlingDays: 1,
      priority: 10,
      displayOnFrontend: true,
      allowFreeShipping: true
    },
    {
      shippingMethodId: METHOD_IDS.UPS_EXPRESS,
      shippingCarrierId: CARRIER_IDS.UPS,
      name: 'UPS Express',
      code: 'UPS_EXPRESS',
      description: 'Express shipping via UPS',
      isActive: true,
      isDefault: false,
      serviceCode: '02',
      domesticInternational: 'both',
      estimatedDeliveryDays: JSON.stringify({ min: 1, max: 2 }),
      handlingDays: 0,
      priority: 5,
      displayOnFrontend: true,
      allowFreeShipping: false
    },
    {
      shippingMethodId: METHOD_IDS.FEDEX_GROUND,
      shippingCarrierId: CARRIER_IDS.FEDEX,
      name: 'FedEx Ground',
      code: 'FEDEX_GROUND',
      description: 'Standard ground shipping via FedEx',
      isActive: true,
      isDefault: false,
      serviceCode: 'FEDEX_GROUND',
      domesticInternational: 'domestic',
      estimatedDeliveryDays: JSON.stringify({ min: 3, max: 7 }),
      handlingDays: 1,
      priority: 10,
      displayOnFrontend: true,
      allowFreeShipping: true
    },
    {
      shippingMethodId: METHOD_IDS.FEDEX_OVERNIGHT,
      shippingCarrierId: CARRIER_IDS.FEDEX,
      name: 'FedEx Overnight',
      code: 'FEDEX_OVERNIGHT',
      description: 'Overnight shipping via FedEx',
      isActive: true,
      isDefault: false,
      serviceCode: 'PRIORITY_OVERNIGHT',
      domesticInternational: 'domestic',
      estimatedDeliveryDays: JSON.stringify({ min: 1, max: 1 }),
      handlingDays: 0,
      priority: 1,
      displayOnFrontend: true,
      allowFreeShipping: false
    },
    {
      shippingMethodId: METHOD_IDS.USPS_PRIORITY,
      shippingCarrierId: CARRIER_IDS.USPS,
      name: 'USPS Priority Mail',
      code: 'USPS_PRIORITY',
      description: 'Priority Mail via USPS',
      isActive: true,
      isDefault: true,
      serviceCode: 'PRIORITY',
      domesticInternational: 'domestic',
      estimatedDeliveryDays: JSON.stringify({ min: 2, max: 3 }),
      handlingDays: 1,
      priority: 8,
      displayOnFrontend: true,
      allowFreeShipping: true
    },
    {
      shippingMethodId: METHOD_IDS.FREE_SHIPPING,
      shippingCarrierId: null,
      name: 'Free Standard Shipping',
      code: 'FREE_STANDARD',
      description: 'Free shipping on orders over $50',
      isActive: true,
      isDefault: false,
      domesticInternational: 'domestic',
      estimatedDeliveryDays: JSON.stringify({ min: 5, max: 10 }),
      handlingDays: 2,
      priority: 20,
      displayOnFrontend: true,
      allowFreeShipping: true,
      minOrderValue: 50.00
    }
  ]).onConflict('shippingMethodId').ignore();

  // Seed Shipping Rates
  await knex('shippingRate').insert([
    {
      shippingRateId: RATE_IDS.UPS_GROUND_US,
      shippingZoneId: ZONE_IDS.US_DOMESTIC,
      shippingMethodId: METHOD_IDS.UPS_GROUND,
      name: 'UPS Ground - US',
      isActive: true,
      rateType: 'flat',
      baseRate: 9.99,
      perItemRate: 0,
      currency: 'USD',
      taxable: true,
      priority: 10
    },
    {
      shippingRateId: RATE_IDS.UPS_EXPRESS_US,
      shippingZoneId: ZONE_IDS.US_DOMESTIC,
      shippingMethodId: METHOD_IDS.UPS_EXPRESS,
      name: 'UPS Express - US',
      isActive: true,
      rateType: 'flat',
      baseRate: 24.99,
      perItemRate: 2.00,
      currency: 'USD',
      taxable: true,
      priority: 5
    },
    {
      shippingRateId: RATE_IDS.FEDEX_GROUND_US,
      shippingZoneId: ZONE_IDS.US_DOMESTIC,
      shippingMethodId: METHOD_IDS.FEDEX_GROUND,
      name: 'FedEx Ground - US',
      isActive: true,
      rateType: 'priceBased',
      baseRate: 8.99,
      rateMatrix: JSON.stringify({
        tiers: [
          { min: 0, max: 50, rate: 8.99 },
          { min: 50, max: 100, rate: 6.99 },
          { min: 100, max: 999999, rate: 4.99 }
        ]
      }),
      currency: 'USD',
      taxable: true,
      priority: 10
    },
    {
      shippingRateId: RATE_IDS.FREE_SHIPPING_US,
      shippingZoneId: ZONE_IDS.US_DOMESTIC,
      shippingMethodId: METHOD_IDS.FREE_SHIPPING,
      name: 'Free Shipping - US',
      isActive: true,
      rateType: 'free',
      baseRate: 0,
      freeThreshold: 50.00,
      currency: 'USD',
      taxable: false,
      priority: 20
    }
  ]).onConflict('shippingRateId').ignore();

  // Seed Packaging Types
  await knex('shippingPackagingType').insert([
    {
      shippingPackagingTypeId: PACKAGING_IDS.SMALL_BOX,
      name: 'Small Box',
      code: 'TEST_SMALL_BOX',
      description: 'Small shipping box for lightweight items',
      isActive: true,
      isDefault: false,
      weight: 0.5,
      length: 8,
      width: 6,
      height: 4,
      volume: 192,
      maxWeight: 5,
      maxItems: 3,
      cost: 0.50,
      currency: 'USD',
      recyclable: true
    },
    {
      shippingPackagingTypeId: PACKAGING_IDS.MEDIUM_BOX,
      name: 'Medium Box',
      code: 'TEST_MEDIUM_BOX',
      description: 'Medium shipping box for standard items',
      isActive: true,
      isDefault: true,
      weight: 1.0,
      length: 12,
      width: 10,
      height: 8,
      volume: 960,
      maxWeight: 20,
      maxItems: 10,
      cost: 1.00,
      currency: 'USD',
      recyclable: true
    },
    {
      shippingPackagingTypeId: PACKAGING_IDS.LARGE_BOX,
      name: 'Large Box',
      code: 'TEST_LARGE_BOX',
      description: 'Large shipping box for bulky items',
      isActive: true,
      isDefault: false,
      weight: 2.0,
      length: 18,
      width: 14,
      height: 12,
      volume: 3024,
      maxWeight: 50,
      maxItems: 25,
      cost: 2.00,
      currency: 'USD',
      recyclable: true
    },
    {
      shippingPackagingTypeId: PACKAGING_IDS.ENVELOPE,
      name: 'Padded Envelope',
      code: 'TEST_ENVELOPE',
      description: 'Padded envelope for documents and small flat items',
      isActive: true,
      isDefault: false,
      weight: 0.1,
      length: 12,
      width: 9,
      height: 1,
      volume: 108,
      maxWeight: 1,
      maxItems: 1,
      cost: 0.25,
      currency: 'USD',
      recyclable: false
    }
  ]).onConflict('shippingPackagingTypeId').ignore();

  console.log('Shipping test data seeded successfully');
};
