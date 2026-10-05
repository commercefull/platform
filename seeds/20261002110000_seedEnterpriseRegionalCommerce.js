const STORE_IDS = {
  US_NY: '41000000-0000-7000-8000-000000000001',
  US_CA: '41000000-0000-7000-8000-000000000002',
  US_DIGITAL: '41000000-0000-7000-8000-000000000003',
  UK: '41000000-0000-7000-8000-000000000004',
  EU_DE: '41000000-0000-7000-8000-000000000005',
  EU_FR: '41000000-0000-7000-8000-000000000006',
};

const CHANNEL_IDS = {
  WEBSITE: '42000000-0000-7000-8000-000000000001',
  FACEBOOK: '42000000-0000-7000-8000-000000000002',
  GOOGLE: '42000000-0000-7000-8000-000000000003',
  POS: '42000000-0000-7000-8000-000000000004',
  AGENTIC: '42000000-0000-7000-8000-000000000005',
};

const WAREHOUSE_IDS = {
  US_NY: '43000000-0000-7000-8000-000000000001',
  US_CA: '43000000-0000-7000-8000-000000000002',
  UK: '43000000-0000-7000-8000-000000000003',
  EU_DE: '43000000-0000-7000-8000-000000000004',
  EU_FR: '43000000-0000-7000-8000-000000000005',
};

const PROMOTION_IDS = {
  US_FACEBOOK: '44000000-0000-7000-8000-000000000001',
  UK_WEBSITE: '44000000-0000-7000-8000-000000000002',
  EU_GOOGLE: '44000000-0000-7000-8000-000000000003',
};

const storeDefinitions = [
  {
    storeId: STORE_IDS.US_NY,
    name: 'Commercefull US New York',
    slug: 'enterprise-us-ny',
    channel: 'hybrid',
    country: 'US',
    state: 'NY',
    city: 'New York',
    postalCode: '10001',
    line1: '350 Fifth Avenue',
    timezone: 'America/New_York',
    defaultCurrency: 'USD',
    currencies: ['USD', 'EUR', 'GBP'],
    taxZoneCode: 'enterprise-us-ny',
  },
  {
    storeId: STORE_IDS.US_CA,
    name: 'Commercefull US California',
    slug: 'enterprise-us-ca',
    channel: 'physical',
    country: 'US',
    state: 'CA',
    city: 'Los Angeles',
    postalCode: '90012',
    line1: '200 North Spring Street',
    timezone: 'America/Los_Angeles',
    defaultCurrency: 'USD',
    currencies: ['USD', 'EUR'],
    taxZoneCode: 'enterprise-us-ca',
  },
  {
    storeId: STORE_IDS.US_DIGITAL,
    name: 'Commercefull US Digital',
    slug: 'enterprise-us-digital',
    channel: 'digital',
    country: 'US',
    state: 'DE',
    city: 'Wilmington',
    postalCode: '19801',
    line1: '100 Digital Commerce Way',
    timezone: 'America/New_York',
    defaultCurrency: 'USD',
    currencies: ['USD', 'EUR', 'GBP'],
    taxZoneCode: 'enterprise-us-de',
  },
  {
    storeId: STORE_IDS.UK,
    name: 'Commercefull United Kingdom',
    slug: 'enterprise-uk',
    channel: 'hybrid',
    country: 'GB',
    state: 'England',
    city: 'London',
    postalCode: 'W1D 1BS',
    line1: '100 Oxford Street',
    timezone: 'Europe/London',
    defaultCurrency: 'GBP',
    currencies: ['GBP', 'EUR', 'USD'],
    taxZoneCode: 'enterprise-gb',
  },
  {
    storeId: STORE_IDS.EU_DE,
    name: 'Commercefull EU Germany',
    slug: 'enterprise-eu-de',
    channel: 'hybrid',
    country: 'DE',
    state: 'Berlin',
    city: 'Berlin',
    postalCode: '10117',
    line1: '1 Friedrichstrasse',
    timezone: 'Europe/Berlin',
    defaultCurrency: 'EUR',
    currencies: ['EUR', 'GBP', 'USD'],
    taxZoneCode: 'enterprise-eu-de',
  },
  {
    storeId: STORE_IDS.EU_FR,
    name: 'Commercefull EU France',
    slug: 'enterprise-eu-fr',
    channel: 'hybrid',
    country: 'FR',
    state: 'Ile-de-France',
    city: 'Paris',
    postalCode: '75001',
    line1: '10 Rue de Rivoli',
    timezone: 'Europe/Paris',
    defaultCurrency: 'EUR',
    currencies: ['EUR', 'GBP', 'USD'],
    taxZoneCode: 'enterprise-eu-fr',
  },
];

const taxZones = [
  { code: 'enterprise-us-ny', name: 'US New York destination', countries: ['US'], states: ['NY'] },
  { code: 'enterprise-us-ca', name: 'US California destination', countries: ['US'], states: ['CA'] },
  { code: 'enterprise-us-de', name: 'US Delaware destination', countries: ['US'], states: ['DE'] },
  { code: 'enterprise-gb', name: 'United Kingdom VAT', countries: ['GB'] },
  { code: 'enterprise-eu-de', name: 'Germany VAT destination', countries: ['DE'] },
  { code: 'enterprise-eu-fr', name: 'France VAT destination', countries: ['FR'] },
];

exports.seed = async function (knex) {
  const organization =
    (await knex('organization').where({ email: 'merchant@example.com' }).first('organizationId')) ||
    (await knex('organization').where({ status: 'active' }).first('organizationId'));
  if (!organization) return;

  for (const zone of taxZones) {
    await knex('taxZone')
      .insert({
        name: zone.name,
        code: zone.code,
        description: 'Enterprise regional commerce seed',
        countries: JSON.stringify(zone.countries),
        states: zone.states ? JSON.stringify(zone.states) : null,
        isDefault: false,
        isActive: true,
      })
      .onConflict('code')
      .merge({
        name: zone.name,
        countries: JSON.stringify(zone.countries),
        states: zone.states ? JSON.stringify(zone.states) : null,
        isActive: true,
        updatedAt: knex.fn.now(),
      });
  }

  const zoneRows = await knex('taxZone').whereIn(
    'code',
    taxZones.map(zone => zone.code),
  );
  const zoneByCode = new Map(zoneRows.map(zone => [zone.code, zone.taxZoneId]));

  // Seller VAT registrations — enables VAT-ID quoting and intra-EU B2B
  // reverse charge (seller must hold an active registration).
  const vatRegistrations = [
    { countryCode: 'DE', vatNumber: 'DE123456789', registrationType: 'standard', tradingName: 'Enterprise EU (Germany)' },
    { countryCode: 'FR', vatNumber: 'FR00123456789', registrationType: 'standard', tradingName: 'Enterprise EU (France)' },
    { countryCode: 'DE', vatNumber: 'DE123456789', registrationType: 'oss', tradingName: 'Enterprise EU (OSS)' },
    { countryCode: 'GB', vatNumber: 'GB123456789', registrationType: 'standard', tradingName: 'Enterprise UK' },
  ];
  for (const registration of vatRegistrations) {
    await knex('taxVatRegistration')
      .insert({
        organizationId: organization.organizationId,
        countryCode: registration.countryCode,
        vatNumber: registration.vatNumber,
        tradingName: registration.tradingName,
        registrationType: registration.registrationType,
        isVerified: true,
        verifiedAt: knex.fn.now(),
        verificationSource: 'seed',
        registrationDate: knex.fn.now(),
        effectiveFrom: knex.fn.now(),
        isActive: true,
      })
      .onConflict(['organizationId', 'countryCode', 'registrationType'])
      .merge({ vatNumber: registration.vatNumber, isVerified: true, isActive: true, updatedAt: knex.fn.now() });
  }

  // Nexus records matching the store footprint — gates tax collection:
  // destinations without nexus collect no tax once records exist.
  const nexusRecords = [
    { name: 'New York warehouse', country: 'US', region: 'New York', regionCode: 'NY', taxId: 'US-NY-1234567' },
    { name: 'California warehouse', country: 'US', region: 'California', regionCode: 'CA', taxId: 'US-CA-7654321' },
    { name: 'Delaware office', country: 'US', region: 'Delaware', regionCode: 'DE', taxId: 'US-DE-9999999' },
    { name: 'United Kingdom store', country: 'GB', region: null, regionCode: null, taxId: 'GB123456789' },
    { name: 'Germany store', country: 'DE', region: null, regionCode: null, taxId: 'DE123456789' },
    { name: 'France store', country: 'FR', region: null, regionCode: null, taxId: 'FR00123456789' },
  ];
  for (const nexus of nexusRecords) {
    const existing = await knex('taxNexus')
      .where({ organizationId: organization.organizationId, country: nexus.country, regionCode: nexus.regionCode })
      .first('taxNexusId');
    if (!existing) {
      await knex('taxNexus').insert({
        organizationId: organization.organizationId,
        name: nexus.name,
        country: nexus.country,
        region: nexus.region,
        regionCode: nexus.regionCode,
        taxId: nexus.taxId,
        isActive: true,
      });
    }
  }

  // EU/UK/international delivery coverage — without a rate row bound to the
  // international shipping zone, cross-border destinations (FR/DE/GB) get
  // "no shipping methods available" at checkout.
  await knex('shippingRate')
    .insert({
      shippingRateId: '45000000-0000-7000-8000-000000000001',
      shippingZoneId: '01936002-0000-7000-8000-000000000003',
      shippingMethodId: '01936001-0000-7000-8000-000000000002',
      name: 'UPS Express - International',
      isActive: true,
      rateType: 'flat',
      baseRateCents: 1499,
      perItemRateCents: 0,
      currencyCode: 'EUR',
      taxable: true,
      priority: 5,
    })
    .onConflict('shippingRateId')
    .merge({ isActive: true, updatedAt: knex.fn.now() });

  for (const definition of storeDefinitions) {
    await knex('store')
      .insert({
        storeId: definition.storeId,
        organizationId: organization.organizationId,
        name: definition.name,
        slug: definition.slug,
        description: `${definition.name} regional commerce store`,
        storeType: 'organization_store',
        channel: definition.channel,
        storeEmail: `support@${definition.slug}.example.com`,
        address: {
          line1: definition.line1,
          city: definition.city,
          state: definition.state,
          postalCode: definition.postalCode,
          country: definition.country,
        },
        isActive: true,
        isVerified: true,
        isFeatured: definition.storeId === STORE_IDS.US_NY,
        settings: {
          allowGuestCheckout: true,
          priceDisplayMode: definition.country === 'US' ? 'exclusive_tax' : 'inclusive_tax',
          inventoryPolicy: definition.channel === 'digital' ? 'unlimited_digital' : 'tracked',
          locale: { US: 'en-US', GB: 'en-GB', DE: 'de-DE', FR: 'fr-FR' }[definition.country] || 'en-US',
        },
        taxZoneId: zoneByCode.get(definition.taxZoneCode),
        defaultLanguage: definition.country === 'FR' ? 'fr' : definition.country === 'DE' ? 'de' : 'en',
      })
      .onConflict('storeId')
      .merge({
        name: definition.name,
        channel: definition.channel,
        address: {
          line1: definition.line1,
          city: definition.city,
          state: definition.state,
          postalCode: definition.postalCode,
          country: definition.country,
        },
        taxZoneId: zoneByCode.get(definition.taxZoneCode),
        settings: {
          allowGuestCheckout: true,
          priceDisplayMode: definition.country === 'US' ? 'exclusive_tax' : 'inclusive_tax',
          inventoryPolicy: definition.channel === 'digital' ? 'unlimited_digital' : 'tracked',
          locale: { US: 'en-US', GB: 'en-GB', DE: 'de-DE', FR: 'fr-FR' }[definition.country] || 'en-US',
        },
        isActive: true,
        updatedAt: knex.fn.now(),
      });
  }

  const channelDefinitions = [
    { salesChannelId: CHANNEL_IDS.WEBSITE, code: 'website', name: 'Website', type: 'web' },
    { salesChannelId: CHANNEL_IDS.FACEBOOK, code: 'facebook', name: 'Facebook Shop', type: 'social' },
    { salesChannelId: CHANNEL_IDS.GOOGLE, code: 'google', name: 'Google Shopping', type: 'marketplace' },
    { salesChannelId: CHANNEL_IDS.POS, code: 'pos', name: 'Point of Sale', type: 'pos' },
    { salesChannelId: CHANNEL_IDS.AGENTIC, code: 'agentic', name: 'Agentic Commerce', type: 'agentic' },
  ];
  for (const channel of channelDefinitions) {
    await knex('salesChannel')
      .insert({ ...channel, organizationId: organization.organizationId, status: 'active', config: {}, metadata: {} })
      .onConflict(['organizationId', 'code'])
      .merge({ name: channel.name, type: channel.type, status: 'active', updatedAt: knex.fn.now() });
  }
  const persistedChannels = await knex('salesChannel').where({ organizationId: organization.organizationId });
  const channelByCode = new Map(persistedChannels.map(channel => [channel.code, channel.salesChannelId]));

  for (const store of storeDefinitions) {
    const codes =
      store.channel === 'digital' ? ['website', 'facebook', 'google', 'agentic'] : ['website', 'facebook', 'google', 'pos', 'agentic'];
    for (const code of codes) {
      await knex('storeSalesChannel')
        .insert({
          storeId: store.storeId,
          salesChannelId: channelByCode.get(code),
          isDefault: code === 'website',
          isActive: true,
          settings: {
            region: store.country,
            currency: store.defaultCurrency,
            locale: { US: 'en-US', GB: 'en-GB', DE: 'de-DE', FR: 'fr-FR' }[store.country] || 'en-US',
          },
        })
        .onConflict(['storeId', 'salesChannelId'])
        .merge({
          isDefault: code === 'website',
          isActive: true,
          settings: {
            region: store.country,
            currency: store.defaultCurrency,
            locale: { US: 'en-US', GB: 'en-GB', DE: 'de-DE', FR: 'fr-FR' }[store.country] || 'en-US',
          },
        });
    }
  }

  const currencies = await knex('currency').whereIn('code', ['USD', 'GBP', 'EUR']);
  const currencyByCode = new Map(currencies.map(currency => [currency.code, currency.currencyId]));
  for (const store of storeDefinitions) {
    for (const code of store.currencies) {
      const currencyId = currencyByCode.get(code);
      if (!currencyId) continue;
      await knex('storeCurrency')
        .insert({ storeId: store.storeId, currencyId, isDefault: code === store.defaultCurrency, isActive: true })
        .onConflict(['storeId', 'currencyId'])
        .merge({ isDefault: code === store.defaultCurrency, isActive: true, updatedAt: knex.fn.now() });
    }
    const defaultCurrencyId = currencyByCode.get(store.defaultCurrency);
    if (defaultCurrencyId) {
      await knex('storeCurrencySettings')
        .insert({
          storeId: store.storeId,
          baseCurrencyId: defaultCurrencyId,
          displayCurrencyId: defaultCurrencyId,
          allowCustomerCurrencySelection: true,
          showCurrencySelector: true,
          autoUpdateRates: false,
          activeProviderCode: 'manual',
          markupPercentage: 0,
          roundPrecision: 2,
          roundingMethod: 'half_up',
          priceDisplayFormat: 'symbol_code',
        })
        .onConflict('storeId')
        .merge({ baseCurrencyId: defaultCurrencyId, displayCurrencyId: defaultCurrencyId, updatedAt: knex.fn.now() });
    }
  }

  const warehouses = [
    { id: WAREHOUSE_IDS.US_NY, store: storeDefinitions[0], code: 'ENT-US-NY' },
    { id: WAREHOUSE_IDS.US_CA, store: storeDefinitions[1], code: 'ENT-US-CA' },
    { id: WAREHOUSE_IDS.UK, store: storeDefinitions[3], code: 'ENT-UK-LON' },
    { id: WAREHOUSE_IDS.EU_DE, store: storeDefinitions[4], code: 'ENT-EU-DE' },
    { id: WAREHOUSE_IDS.EU_FR, store: storeDefinitions[5], code: 'ENT-EU-FR' },
  ];
  for (const warehouse of warehouses) {
    const store = warehouse.store;
    await knex('distributionWarehouse')
      .insert({
        distributionWarehouseId: warehouse.id,
        organizationId: organization.organizationId,
        storeId: store.storeId,
        name: `${store.name} Fulfillment Centre`,
        code: warehouse.code,
        isActive: true,
        isDefault: true,
        isFulfillmentCenter: true,
        isReturnCenter: true,
        isVirtual: false,
        addressLine1: store.line1,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode,
        country: store.country,
        timezone: store.timezone,
      })
      .onConflict('distributionWarehouseId')
      .merge({ storeId: store.storeId, name: `${store.name} Fulfillment Centre`, isActive: true, updatedAt: knex.fn.now() });
  }

  const categories = await knex('taxCategory').whereIn('code', ['standard', 'zero']);
  const categoryByCode = new Map(categories.map(category => [category.code, category.taxCategoryId]));
  const rates = [
    { zone: 'enterprise-us-ny', category: 'standard', name: 'Demo NY destination sales tax', rate: 8.875, includeInPrice: false },
    { zone: 'enterprise-us-ca', category: 'standard', name: 'Demo CA destination sales tax', rate: 9.5, includeInPrice: false },
    { zone: 'enterprise-us-de', category: 'standard', name: 'Delaware no sales tax', rate: 0, includeInPrice: false },
    { zone: 'enterprise-gb', category: 'standard', name: 'UK standard VAT', rate: 20, includeInPrice: true },
    { zone: 'enterprise-gb', category: 'zero', name: 'UK zero-rated eligible goods', rate: 0, includeInPrice: true },
    { zone: 'enterprise-eu-de', category: 'standard', name: 'Germany standard VAT', rate: 19, includeInPrice: true },
    { zone: 'enterprise-eu-fr', category: 'standard', name: 'France standard VAT', rate: 20, includeInPrice: true },
  ];
  for (const [priority, rate] of rates.entries()) {
    const taxCategoryId = categoryByCode.get(rate.category);
    const taxZoneId = zoneByCode.get(rate.zone);
    if (!taxCategoryId || !taxZoneId) continue;
    await knex('taxRate')
      .insert({
        taxCategoryId,
        taxZoneId,
        name: rate.name,
        rate: rate.rate,
        type: 'percentage',
        priority: priority + 100,
        isCompound: false,
        includeInPrice: rate.includeInPrice,
        isShippingTaxable: rate.zone.startsWith('enterprise-eu') || rate.zone === 'enterprise-gb',
        isActive: true,
      })
      .onConflict(['taxCategoryId', 'taxZoneId', 'priority'])
      .merge({ name: rate.name, rate: rate.rate, includeInPrice: rate.includeInPrice, isActive: true, updatedAt: knex.fn.now() });
  }

  await knex('promotionRule').whereIn('promotionId', Object.values(PROMOTION_IDS)).del();
  await knex('promotionAction').whereIn('promotionId', Object.values(PROMOTION_IDS)).del();
  const promotions = [
    { id: PROMOTION_IDS.US_FACEBOOK, name: 'US Facebook launch offer', channel: 'facebook', country: ['US'], currency: 'USD', value: 15 },
    { id: PROMOTION_IDS.UK_WEBSITE, name: 'UK website member offer', channel: 'website', country: ['GB'], currency: 'GBP', value: 10 },
    { id: PROMOTION_IDS.EU_GOOGLE, name: 'EU Google Shopping offer', channel: 'google', country: ['DE', 'FR'], currency: 'EUR', value: 12 },
  ];
  for (const promotion of promotions) {
    await knex('promotion')
      .insert({
        promotionId: promotion.id,
        organizationId: organization.organizationId,
        name: promotion.name,
        description: 'Channel and region scoped enterprise seed offer',
        status: 'active',
        scope: 'cart',
        priority: 50,
        startDate: knex.fn.now(),
        isActive: true,
        isExclusive: false,
        stackability: 'stackable',
        usageCount: 0,
        isGlobal: false,
      })
      .onConflict('promotionId')
      .merge({ name: promotion.name, status: 'active', isActive: true, updatedAt: knex.fn.now() });
    await knex('promotionRule').insert([
      {
        promotionId: promotion.id,
        name: 'Sales channel',
        condition: 'channel',
        operator: 'in',
        value: JSON.stringify([channelByCode.get(promotion.channel)]),
        sortOrder: 0,
      },
      {
        promotionId: promotion.id,
        name: 'Destination country',
        condition: 'country',
        operator: 'in',
        value: JSON.stringify(promotion.country),
        sortOrder: 1,
      },
      {
        promotionId: promotion.id,
        name: 'Transaction currency',
        condition: 'currency',
        operator: 'in',
        value: JSON.stringify([promotion.currency]),
        sortOrder: 2,
      },
    ]);
    await knex('promotionAction').insert({
      promotionId: promotion.id,
      name: `${promotion.value}% discount`,
      actionType: 'discountByPercentage',
      value: promotion.value,
      targetType: 'cart',
      sortOrder: 0,
    });
  }
};

exports.STORE_IDS = STORE_IDS;
exports.CHANNEL_IDS = CHANNEL_IDS;
exports.WAREHOUSE_IDS = WAREHOUSE_IDS;
