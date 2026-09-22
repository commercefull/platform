-- perf-seed.sql — bulk-load realistic data volume for DB performance investigation.
--
-- Generates production-scale rows in the tables that dominate read traffic so
-- pg_stat_statements + EXPLAIN ANALYZE produce meaningful plans (seed data is
-- too small — the planner correctly seq-scans everything at ~400kB).
--
-- Idempotent-ish: SKUs/slugs are prefixed 'PERF-' and the script deletes its
-- own generated rows before re-inserting.
--
-- Usage:
--   docker exec -i commerce-db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f - < scripts/perf-seed.sql
--
-- Tune volume with:  psql ... -v perf_products=50000

\set perf_products 20000
\set perf_customers 5000
\set perf_orders 50000

\timing on

BEGIN;

-- ---------------------------------------------------------------------------
-- Cleanup previous perf-seed rows (children first)
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE perf_products AS
SELECT "productId" FROM product WHERE sku LIKE 'PERF-%';

DELETE FROM "orderItem" WHERE "orderId" IN (SELECT "orderId" FROM "order" WHERE "orderNumber" LIKE 'PERF-%');
DELETE FROM "order" WHERE "orderNumber" LIKE 'PERF-%';
DELETE FROM "productCategoryMap" WHERE "productId" IN (SELECT "productId" FROM perf_products);
DELETE FROM "inventoryLevel" WHERE "productId" IN (SELECT "productId" FROM perf_products);
DELETE FROM "productImage" WHERE "productId" IN (SELECT "productId" FROM perf_products);
DELETE FROM "productVariant" WHERE "productId" IN (SELECT "productId" FROM perf_products);
DELETE FROM product WHERE sku LIKE 'PERF-%';
DELETE FROM customer WHERE email LIKE 'perf-%@example.com';
DROP TABLE perf_products;

-- ---------------------------------------------------------------------------
-- Products — mixed status/visibility so planner sees realistic selectivity
-- (~90% active+visible, 5% draft, 5% hidden; ~5% featured; ~20% on sale)
-- ---------------------------------------------------------------------------
INSERT INTO product (sku, name, slug, description, "shortDescription", status, visibility,
                     price, "basePrice", "salePrice", currency, "isFeatured", "isNew", "isBestseller",
                     "averageRating", "reviewCount", "storeId", "organizationId", "publishedAt")
SELECT 'PERF-' || i,
       (ARRAY['Wireless','Ergonomic','Portable','Premium','Compact','Smart','Classic','Ultra'])[1 + (i % 8)]
         || ' ' ||
       (ARRAY['Headphones','Keyboard','Backpack','Bottle','Chair','Lamp','Watch','Speaker','Mouse','Stand'])[1 + (i % 10)]
         || ' ' || i,
       'perf-' || i,
       'Performance test product ' || i || ' — ' || repeat('lorem ipsum dolor sit amet ', 3),
       'Perf product ' || i,
       CASE WHEN i % 20 < 18 THEN 'active'
            WHEN i % 20 = 18 THEN 'draft'
            ELSE 'archived' END,
       CASE WHEN i % 20 = 19 THEN 'not_visible' ELSE 'visible' END,
       (10 + (i % 490))::numeric + 0.99,
       (10 + (i % 490))::numeric + 0.99,
       CASE WHEN i % 5 = 0 THEN (8 + (i % 400))::numeric + 0.99 END,
       'USD',
       i % 20 = 0,          -- 5% featured
       i % 10 = 0,          -- 10% new
       i % 15 = 0,          -- ~7% bestseller
       round((1 + random() * 4)::numeric, 1),
       (random() * 500)::int,
       (SELECT "storeId" FROM store ORDER BY "storeId" LIMIT 1),
       (SELECT "organizationId" FROM organization ORDER BY "organizationId" LIMIT 1),
       now() - ((i % 365) || ' days')::interval
FROM generate_series(1, :perf_products) AS i;

-- ---------------------------------------------------------------------------
-- Variants — 1–2 per product
-- ---------------------------------------------------------------------------
INSERT INTO "productVariant" ("productId", sku, status, "isDefault", "optionValues", price)
SELECT "productId", sku || '-V1', 'active', true, '{}'::jsonb, price
FROM product WHERE sku LIKE 'PERF-%';

INSERT INTO "productVariant" ("productId", sku, status, "isDefault", "optionValues", price)
SELECT "productId", sku || '-V2', 'active', false, '{"size":"L"}'::jsonb, price + 5
FROM product WHERE sku LIKE 'PERF-%' AND right(sku, 1) IN ('0','2','4','6','8'); -- 50% get a 2nd variant

-- ---------------------------------------------------------------------------
-- Images — 2 per product
-- ---------------------------------------------------------------------------
INSERT INTO "productImage" ("productId", url, position, "isPrimary", "isVisible")
SELECT "productId", 'https://img.example.com/' || sku || '-1.jpg', 0, true, true
FROM product WHERE sku LIKE 'PERF-%';

INSERT INTO "productImage" ("productId", url, position, "isPrimary", "isVisible")
SELECT "productId", 'https://img.example.com/' || sku || '-2.jpg', 1, false, true
FROM product WHERE sku LIKE 'PERF-%';

-- ---------------------------------------------------------------------------
-- Category mapping — each product into 1–2 categories
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE perf_categories AS
SELECT "productCategoryId", row_number() OVER (ORDER BY "productCategoryId") - 1 AS rn
FROM "productCategory" WHERE "isActive" = true;

INSERT INTO "productCategoryMap" ("productId", "productCategoryId", position, "isPrimary")
SELECT p."productId", c."productCategoryId", 0, true
FROM product p
JOIN perf_categories c
  ON c.rn = abs(hashtext(p.sku)) % (SELECT count(*) FROM perf_categories)
WHERE p.sku LIKE 'PERF-%';

DROP TABLE perf_categories;

-- ---------------------------------------------------------------------------
-- Inventory — one level per product at the first warehouse
-- ---------------------------------------------------------------------------
INSERT INTO "inventoryLevel" ("productId", "distributionWarehouseId",
                              "availableQuantity", "onHandQuantity", "stockStatus")
SELECT "productId",
       (SELECT "distributionWarehouseId" FROM "distributionWarehouse" ORDER BY "distributionWarehouseId" LIMIT 1),
       (random() * 200)::int, (random() * 200)::int,
       CASE WHEN random() < 0.9 THEN 'inStock' ELSE 'outOfStock' END
FROM product WHERE sku LIKE 'PERF-%';

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
INSERT INTO customer (email, password, "firstName", "lastName", "isActive", "isVerified",
                      "emailVerified", "agreeToTerms")
SELECT 'perf-' || i || '@example.com', '$2b$10$invalidhashforperftestonly',
       'Perf', 'Customer ' || i, true, true, true, true
FROM generate_series(1, :perf_customers) AS i;

-- ---------------------------------------------------------------------------
-- Orders + items — spread over the last year, mixed statuses
-- ---------------------------------------------------------------------------
INSERT INTO "order" ("orderNumber", "customerId", "customerEmail", "customerName",
                     status, "paymentStatus", "fulfillmentStatus", "currencyCode",
                     subtotal, "totalAmount", "totalItems", "totalQuantity",
                     "orderDate", "storeId", "organizationId")
SELECT 'PERF-' || i,
       c."customerId",
       c.email,
       'Perf Customer ' || (i % :perf_customers + 1),
       (ARRAY['pending','processing','shipped','delivered','cancelled'])[1 + (i % 5)],
       (ARRAY['pending','paid','paid','paid','refunded'])[1 + (i % 5)],
       (ARRAY['unfulfilled','partiallyFulfilled','fulfilled','fulfilled','unfulfilled'])[1 + (i % 5)],
       'USD',
       (20 + (i % 300))::numeric,
       (22 + (i % 300))::numeric,
       1 + (i % 3),
       1 + (i % 5),
       now() - ((i % 365) || ' days')::interval - ((i % 86400) || ' seconds')::interval,
       (SELECT "storeId" FROM store ORDER BY "storeId" LIMIT 1),
       (SELECT "organizationId" FROM organization ORDER BY "organizationId" LIMIT 1)
FROM generate_series(1, :perf_orders) AS i
JOIN customer c ON c.email = 'perf-' || (i % :perf_customers + 1) || '@example.com';

CREATE TEMP TABLE perf_products AS
SELECT "productId", sku, name, price,
       row_number() OVER (ORDER BY sku) - 1 AS rn
FROM product WHERE sku LIKE 'PERF-%';

INSERT INTO "orderItem" ("orderId", "productId", "productVariantId", sku, name,
                         quantity, "unitPrice", "discountedUnitPrice", "lineTotal")
SELECT o."orderId", p."productId", pv."productVariantId", p.sku, p.name,
       1 + (i % 4), p.price, p.price, p.price * (1 + (i % 4))
FROM "order" o
JOIN LATERAL generate_series(1, o."totalItems") AS i ON true
JOIN perf_products p ON p.rn = abs(hashtext(o."orderNumber" || i)) % (SELECT count(*) FROM perf_products)
JOIN "productVariant" pv ON pv."productId" = p."productId" AND pv."isDefault"
WHERE o."orderNumber" LIKE 'PERF-%';

DROP TABLE perf_products;

COMMIT;

ANALYZE;

SELECT 'products' AS table, count(*) FROM product WHERE sku LIKE 'PERF-%'
UNION ALL SELECT 'variants',  count(*) FROM "productVariant" WHERE sku LIKE 'PERF-%'
UNION ALL SELECT 'images',    count(*) FROM "productImage" pi JOIN product p ON p."productId" = pi."productId" WHERE p.sku LIKE 'PERF-%'
UNION ALL SELECT 'customers', count(*) FROM customer WHERE email LIKE 'perf-%@example.com'
UNION ALL SELECT 'orders',    count(*) FROM "order" WHERE "orderNumber" LIKE 'PERF-%'
UNION ALL SELECT 'orderItems',count(*) FROM "orderItem" oi JOIN "order" o ON o."orderId" = oi."orderId" WHERE o."orderNumber" LIKE 'PERF-%';
