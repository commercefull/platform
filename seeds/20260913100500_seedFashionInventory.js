/**
 * Seed Fashion Inventory
 * Creates inventory levels for each product variant in both UK and US warehouses.
 * UK variants → UK warehouse, US variants → US warehouse.
 */

const { products, STORE } = require('./20260913100400_seedFashionProducts.js');

// Warehouse IDs (from seedMultiStoreData)
const WAREHOUSE = {
  UK: '30000000-0000-7000-8000-000000000001',
  US: '30000000-0000-7000-8000-000000000002',
};

exports.seed = async function (knex) {
  const now = knex.fn.now();

  // Clean up existing fashion inventory (for our product slugs)
  const fashionSlugs = products.map(p => p.slug);
  const productIds = await knex('product').whereIn('slug', fashionSlugs).pluck('productId');

  if (productIds.length > 0) {
    await knex('inventoryLevel').whereIn('productId', productIds).del();
  }

  for (const p of products) {
    const product = await knex('product').where({ slug: p.slug }).first('productId');
    if (!product) {
      console.warn(`Product not found: ${p.slug} — skipping inventory`);
      continue;
    }

    // Get all variants for this product
    const variants = await knex('productVariant').where({ productId: product.productId }).select('productVariantId', 'sku', 'optionValues');

    for (const variant of variants) {
      // Parse optionValues to find size + colour
      let attrs = {};
      try {
        attrs = typeof variant.optionValues === 'string' ? JSON.parse(variant.optionValues) : variant.optionValues;
      } catch {
        attrs = {};
      }
      const sizeAttr = attrs.find(a => a.name === 'size');
      const colourAttr = attrs.find(a => a.name === 'color');
      const size = sizeAttr ? sizeAttr.value : 'm';
      const colour = colourAttr ? colourAttr.value : 'black';

      // Find matching variant definition in product seed
      const variantDef = p.variants.find(v => v.size === size && v.colour === colour);
      if (!variantDef) {
        continue;
      }

      // Create UK inventory level
      await knex('inventoryLevel').insert({
        productId: product.productId,
        productVariantId: variant.productVariantId,
        distributionWarehouseId: WAREHOUSE.UK,
        isTracked: true,
        isBackorderable: false,
        isPurchasableOutOfStock: false,
        availableQuantity: variantDef.stockUK,
        onHandQuantity: variantDef.stockUK,
        allocatedQuantity: 0,
        reservedQuantity: 0,
        minStockLevel: 5,
        stockStatus: variantDef.stockUK === 0 ? 'outOfStock' : variantDef.stockUK < 10 ? 'lowStock' : 'inStock',
        createdAt: now,
        updatedAt: now,
      });

      // Create US inventory level
      await knex('inventoryLevel').insert({
        productId: product.productId,
        productVariantId: variant.productVariantId,
        distributionWarehouseId: WAREHOUSE.US,
        isTracked: true,
        isBackorderable: false,
        isPurchasableOutOfStock: false,
        availableQuantity: variantDef.stockUS,
        onHandQuantity: variantDef.stockUS,
        allocatedQuantity: 0,
        reservedQuantity: 0,
        minStockLevel: 5,
        stockStatus: variantDef.stockUS === 0 ? 'outOfStock' : variantDef.stockUS < 10 ? 'lowStock' : 'inStock',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  console.log('Seeded fashion inventory for UK and US warehouses');
};

exports.WAREHOUSE = WAREHOUSE;
