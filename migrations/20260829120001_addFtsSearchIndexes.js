/**
 * Add GIN indexes for full-text search (FTS) on searchable text columns.
 *
 * These indexes support the `fts` strategy in `libs/db/searchHelpers.ts`.
 * They use `to_tsvector('simple', ...)` with COALESCE to handle nullable columns.
 * The `'simple'` config matches the search helper default (no stemming/stop words).
 *
 * Set SEARCH_STRATEGY=fts in .env to use FTS instead of ILIKE.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  const indexes = [
    // product — name, description, shortDescription, sku, slug
    {
      table: 'product',
      name: 'idx_product_fts',
      expr: "to_tsvector('simple', COALESCE(\"name\", '') || ' ' || COALESCE(\"description\", '') || ' ' || COALESCE(\"shortDescription\", '') || ' ' || COALESCE(\"sku\", '') || ' ' || COALESCE(\"slug\", ''))",
    },
    // productVariant — sku, barcode, name
    {
      table: 'productVariant',
      name: 'idx_productVariant_fts',
      expr: "to_tsvector('simple', COALESCE(\"sku\", '') || ' ' || COALESCE(\"barcode\", '') || ' ' || COALESCE(\"name\", ''))",
    },
    // customer — email, firstName, lastName, phone
    {
      table: 'customer',
      name: 'idx_customer_fts',
      expr: "to_tsvector('simple', COALESCE(\"email\", '') || ' ' || COALESCE(\"firstName\", '') || ' ' || COALESCE(\"lastName\", '') || ' ' || COALESCE(\"phone\", ''))",
    },
    // order — orderNumber, customerEmail, customerName
    {
      table: 'order',
      name: 'idx_order_fts',
      expr: "to_tsvector('simple', COALESCE(\"orderNumber\", '') || ' ' || COALESCE(\"customerEmail\", '') || ' ' || COALESCE(\"customerName\", ''))",
    },
    // promotionCoupon — code, name, description
    {
      table: 'promotionCoupon',
      name: 'idx_promotionCoupon_fts',
      expr: "to_tsvector('simple', COALESCE(\"code\", '') || ' ' || COALESCE(\"name\", '') || ' ' || COALESCE(\"description\", ''))",
    },
    // contentMedia — title, fileName, altText
    {
      table: 'contentMedia',
      name: 'idx_contentMedia_fts',
      expr: "to_tsvector('simple', COALESCE(\"title\", '') || ' ' || COALESCE(\"fileName\", '') || ' ' || COALESCE(\"altText\", ''))",
    },
    // contentPage — title, slug
    {
      table: 'contentPage',
      name: 'idx_contentPage_fts',
      expr: "to_tsvector('simple', COALESCE(\"title\", '') || ' ' || COALESCE(\"slug\", ''))",
    },
    // supplier — name, description, code
    {
      table: 'supplier',
      name: 'idx_supplier_fts',
      expr: "to_tsvector('simple', COALESCE(\"name\", '') || ' ' || COALESCE(\"description\", '') || ' ' || COALESCE(\"code\", ''))",
    },
    // distributionWarehouse — name, code, city
    {
      table: 'distributionWarehouse',
      name: 'idx_distributionWarehouse_fts',
      expr: "to_tsvector('simple', COALESCE(\"name\", '') || ' ' || COALESCE(\"code\", '') || ' ' || COALESCE(\"city\", ''))",
    },
    // notificationTemplate — name, description
    {
      table: 'notificationTemplate',
      name: 'idx_notificationTemplate_fts',
      expr: "to_tsvector('simple', COALESCE(\"name\", '') || ' ' || COALESCE(\"description\", ''))",
    },
    // supportTicket — subject, description
    {
      table: 'supportTicket',
      name: 'idx_supportTicket_fts',
      expr: "to_tsvector('simple', COALESCE(\"subject\", '') || ' ' || COALESCE(\"description\", ''))",
    },
    // supportFaqArticle — title, content
    {
      table: 'supportFaqArticle',
      name: 'idx_supportFaqArticle_fts',
      expr: "to_tsvector('simple', COALESCE(\"title\", '') || ' ' || COALESCE(\"content\", ''))",
    },
    // shippingCarrier — name, code
    {
      table: 'shippingCarrier',
      name: 'idx_shippingCarrier_fts',
      expr: "to_tsvector('simple', COALESCE(\"name\", '') || ' ' || COALESCE(\"code\", ''))",
    },
  ];

  return Promise.all(
    indexes.map(({ table, name, expr }) =>
      knex.raw(`CREATE INDEX IF NOT EXISTS "${name}" ON "${table}" USING GIN (${expr})`),
    ),
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  const indexNames = [
    'idx_product_fts',
    'idx_productVariant_fts',
    'idx_customer_fts',
    'idx_order_fts',
    'idx_promotionCoupon_fts',
    'idx_contentMedia_fts',
    'idx_contentPage_fts',
    'idx_supplier_fts',
    'idx_distributionWarehouse_fts',
    'idx_notificationTemplate_fts',
    'idx_supportTicket_fts',
    'idx_supportFaqArticle_fts',
    'idx_shippingCarrier_fts',
  ];

  return Promise.all(
    indexNames.map((name) => knex.raw(`DROP INDEX IF EXISTS "${name}"`)),
  );
};
