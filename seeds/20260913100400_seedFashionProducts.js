/**
 * Seed Fashion Products
 * Creates 30+ products across 8 brands and multiple categories.
 * Each product has size/colour variants with SKUs.
 * Products are assigned to brands and categories.
 */

const ORG_ID = '01911000-0000-7000-8000-000000000001';

// Brand IDs (from seedFashionBrands)
const BRAND = {
  NORTHWIND: '31000000-0000-0000-0000-000000000001',
  COASTLINE: '31000000-0000-0000-0000-000000000002',
  ATLAS: '31000000-0000-0000-0000-000000000003',
  VERONA: '31000000-0000-0000-0000-000000000004',
  MERIDIAN: '31000000-0000-0000-0000-000000000005',
  FOXGLOVE: '31000000-0000-0000-0000-000000000006',
  STRIDE: '31000000-0000-0000-0000-000000000007',
  LUMINA: '31000000-0000-0000-0000-000000000008',
};

// Store IDs (from seedMultiStoreData)
const STORE = {
  UK: '30000000-0000-0000-0000-000000000001',
  US: '30000000-0000-0000-0000-000000000002',
};

/**
 * Product definitions. Each product specifies:
 *   name, slug, description, brand, categorySlug, price (USD), salePrice, hasVariants, variants[]
 *   variants: [{ size, colour, sku, stockUK, stockUS }]
 */
const products = [
  // === Northwind Apparel (Menswear) ===
  {
    name: 'Oxford Cotton Shirt',
    slug: 'oxford-cotton-shirt',
    description:
      'Classic Oxford cotton shirt with button-down collar. Tailored fit in premium 100% cotton. Perfect for office or casual wear.',
    brand: BRAND.NORTHWIND,
    categorySlug: 'mens-shirts',
    price: 79.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 's', colour: 'white', stockUK: 15, stockUS: 20 },
      { size: 'm', colour: 'white', stockUK: 18, stockUS: 25 },
      { size: 'l', colour: 'white', stockUK: 12, stockUS: 18 },
      { size: 'xl', colour: 'white', stockUK: 8, stockUS: 15 },
      { size: 'm', colour: 'navy', stockUK: 10, stockUS: 12 },
      { size: 'l', colour: 'navy', stockUK: 10, stockUS: 14 },
    ],
  },
  {
    name: 'Merino Wool Jumper',
    slug: 'merino-wool-jumper',
    description: 'Luxurious merino wool jumper with ribbed crew neck. Soft, breathable, and warm. Made from 100% Australian merino wool.',
    brand: BRAND.NORTHWIND,
    categorySlug: 'mens-knitwear',
    price: 129.0,
    salePrice: 99.0,
    isFeatured: true,
    variants: [
      { size: 's', colour: 'charcoal', stockUK: 8, stockUS: 10 },
      { size: 'm', colour: 'charcoal', stockUK: 12, stockUS: 15 },
      { size: 'l', colour: 'charcoal', stockUK: 10, stockUS: 12 },
      { size: 'xl', colour: 'charcoal', stockUK: 6, stockUS: 8 },
      { size: 'm', colour: 'navy', stockUK: 10, stockUS: 12 },
      { size: 'l', colour: 'navy', stockUK: 8, stockUS: 10 },
    ],
  },
  {
    name: 'Tailored Chino Trousers',
    slug: 'tailored-chino-trousers',
    description: 'Slim-fit chino trousers in stretch cotton twill. Comfortable, versatile, and perfect for smart-casual occasions.',
    brand: BRAND.NORTHWIND,
    categorySlug: 'mens-trousers',
    price: 89.0,
    salePrice: null,
    variants: [
      { size: 's', colour: 'sand', stockUK: 12, stockUS: 15 },
      { size: 'm', colour: 'sand', stockUK: 15, stockUS: 20 },
      { size: 'l', colour: 'sand', stockUK: 10, stockUS: 12 },
      { size: 'm', colour: 'navy', stockUK: 12, stockUS: 14 },
      { size: 'l', colour: 'navy', stockUK: 10, stockUS: 12 },
    ],
  },
  {
    name: 'Wax Cotton Jacket',
    slug: 'wax-cotton-jacket',
    description: 'Heritage wax cotton jacket with corduroy collar and tartan lining. Water-resistant and built to last.',
    brand: BRAND.NORTHWIND,
    categorySlug: 'mens-jackets',
    price: 249.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 's', colour: 'olive', stockUK: 5, stockUS: 8 },
      { size: 'm', colour: 'olive', stockUK: 8, stockUS: 10 },
      { size: 'l', colour: 'olive', stockUK: 6, stockUS: 8 },
      { size: 'xl', colour: 'olive', stockUK: 4, stockUS: 6 },
    ],
  },

  // === Coastline Denim ===
  {
    name: 'Selvedge Slim Jeans',
    slug: 'selvedge-slim-jeans',
    description: 'Premium Japanese selvedge denim jeans with slim fit. Raw indigo wash that fades beautifully over time.',
    brand: BRAND.COASTLINE,
    categorySlug: 'mens-jeans',
    price: 169.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 's', colour: 'navy', stockUK: 10, stockUS: 15 },
      { size: 'm', colour: 'navy', stockUK: 15, stockUS: 20 },
      { size: 'l', colour: 'navy', stockUK: 12, stockUS: 18 },
      { size: 'xl', colour: 'navy', stockUK: 8, stockUS: 12 },
      { size: 'xxl', colour: 'navy', stockUK: 4, stockUS: 6 },
    ],
  },
  {
    name: "Women's High-Rise Jeans",
    slug: 'womens-high-rise-jeans',
    description: 'High-rise skinny jeans in stretch denim. Comfortable fit with a classic dark wash.',
    brand: BRAND.COASTLINE,
    categorySlug: 'womens-jeans',
    price: 139.0,
    salePrice: 109.0,
    variants: [
      { size: 'xs', colour: 'navy', stockUK: 12, stockUS: 15 },
      { size: 's', colour: 'navy', stockUK: 18, stockUS: 22 },
      { size: 'm', colour: 'navy', stockUK: 15, stockUS: 20 },
      { size: 'l', colour: 'navy', stockUK: 10, stockUS: 12 },
      { size: 's', colour: 'black', stockUK: 10, stockUS: 14 },
      { size: 'm', colour: 'black', stockUK: 12, stockUS: 16 },
    ],
  },
  {
    name: 'Relaxed Fit Denim Jacket',
    slug: 'relaxed-fit-denim-jacket',
    description: 'Classic denim trucker jacket in relaxed fit. 100% cotton denim with button-front closure.',
    brand: BRAND.COASTLINE,
    categorySlug: 'mens-jackets',
    price: 149.0,
    salePrice: null,
    variants: [
      { size: 'm', colour: 'navy', stockUK: 8, stockUS: 12 },
      { size: 'l', colour: 'navy', stockUK: 10, stockUS: 14 },
      { size: 'xl', colour: 'navy', stockUK: 6, stockUS: 8 },
    ],
  },

  // === Atlas Activewear ===
  {
    name: 'Performance Running T-Shirt',
    slug: 'performance-running-tshirt',
    description: 'Moisture-wicking running t-shirt with breathable mesh panels. Lightweight and quick-drying for peak performance.',
    brand: BRAND.ATLAS,
    categorySlug: 'mens-tshirts',
    price: 49.0,
    salePrice: null,
    variants: [
      { size: 's', colour: 'black', stockUK: 15, stockUS: 20 },
      { size: 'm', colour: 'black', stockUK: 20, stockUS: 25 },
      { size: 'l', colour: 'black', stockUK: 15, stockUS: 20 },
      { size: 'xl', colour: 'black', stockUK: 10, stockUS: 15 },
      { size: 'm', colour: 'grey', stockUK: 12, stockUS: 15 },
      { size: 'l', colour: 'grey', stockUK: 10, stockUS: 12 },
    ],
  },
  {
    name: "Women's Yoga Leggings",
    slug: 'womens-yoga-leggings',
    description: 'High-waisted yoga leggings with four-way stretch. Squat-proof, moisture-wicking, and ultra-comfortable.',
    brand: BRAND.ATLAS,
    categorySlug: 'womens-activewear',
    price: 69.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 'xs', colour: 'black', stockUK: 15, stockUS: 20 },
      { size: 's', colour: 'black', stockUK: 20, stockUS: 25 },
      { size: 'm', colour: 'black', stockUK: 18, stockUS: 22 },
      { size: 'l', colour: 'black', stockUK: 12, stockUS: 15 },
      { size: 's', colour: 'navy', stockUK: 10, stockUS: 12 },
      { size: 'm', colour: 'navy', stockUK: 12, stockUS: 14 },
    ],
  },
  {
    name: 'Athletic Hoodie',
    slug: 'athletic-hoodie',
    description: 'Premium athletic hoodie with fleece lining. Kangaroo pocket and adjustable hood.',
    brand: BRAND.ATLAS,
    categorySlug: 'hoodies-sweatshirts',
    price: 79.0,
    salePrice: 59.0,
    variants: [
      { size: 's', colour: 'grey', stockUK: 12, stockUS: 15 },
      { size: 'm', colour: 'grey', stockUK: 15, stockUS: 20 },
      { size: 'l', colour: 'grey', stockUK: 12, stockUS: 15 },
      { size: 'xl', colour: 'grey', stockUK: 8, stockUS: 10 },
      { size: 'm', colour: 'black', stockUK: 10, stockUS: 12 },
      { size: 'l', colour: 'black', stockUK: 8, stockUS: 10 },
    ],
  },

  // === Verona Linen (Women's) ===
  {
    name: 'Linen Summer Dress',
    slug: 'linen-summer-dress',
    description: 'Breathable linen summer dress with adjustable straps. Perfect for warm days. 100% European flax linen.',
    brand: BRAND.VERONA,
    categorySlug: 'womens-dresses',
    price: 159.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 'xs', colour: 'cream', stockUK: 8, stockUS: 10 },
      { size: 's', colour: 'cream', stockUK: 12, stockUS: 15 },
      { size: 'm', colour: 'cream', stockUK: 10, stockUS: 12 },
      { size: 'l', colour: 'cream', stockUK: 6, stockUS: 8 },
      { size: 's', colour: 'sand', stockUK: 8, stockUS: 10 },
      { size: 'm', colour: 'sand', stockUK: 8, stockUS: 10 },
    ],
  },
  {
    name: 'Linen Blouse',
    slug: 'linen-blouse',
    description: 'Relaxed-fit linen blouse with mother-of-pearl buttons. Lightweight and breathable for summer.',
    brand: BRAND.VERONA,
    categorySlug: 'womens-tops',
    price: 99.0,
    salePrice: null,
    variants: [
      { size: 'xs', colour: 'white', stockUK: 10, stockUS: 12 },
      { size: 's', colour: 'white', stockUK: 12, stockUS: 15 },
      { size: 'm', colour: 'white', stockUK: 10, stockUS: 12 },
      { size: 's', colour: 'sand', stockUK: 8, stockUS: 10 },
      { size: 'm', colour: 'sand', stockUK: 8, stockUS: 10 },
    ],
  },
  {
    name: 'Linen Wide-Leg Trousers',
    slug: 'linen-wide-leg-trousers',
    description: 'High-waisted wide-leg linen trousers. Elegant and comfortable for summer occasions.',
    brand: BRAND.VERONA,
    categorySlug: 'womens-skirts',
    price: 119.0,
    salePrice: 89.0,
    variants: [
      { size: 'xs', colour: 'sand', stockUK: 8, stockUS: 10 },
      { size: 's', colour: 'sand', stockUK: 10, stockUS: 12 },
      { size: 'm', colour: 'sand', stockUK: 8, stockUS: 10 },
      { size: 'l', colour: 'sand', stockUK: 6, stockUS: 8 },
    ],
  },

  // === Meridian Knitwear ===
  {
    name: 'Cashmere Crew Neck',
    slug: 'cashmere-crew-neck',
    description: 'Pure cashmere crew neck sweater. Incredibly soft and warm. Made from grade-A Mongolian cashmere.',
    brand: BRAND.MERIDIAN,
    categorySlug: 'mens-knitwear',
    price: 199.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 's', colour: 'charcoal', stockUK: 6, stockUS: 8 },
      { size: 'm', colour: 'charcoal', stockUK: 8, stockUS: 10 },
      { size: 'l', colour: 'charcoal', stockUK: 6, stockUS: 8 },
      { size: 'xl', colour: 'charcoal', stockUK: 4, stockUS: 6 },
      { size: 'm', colour: 'burgundy', stockUK: 5, stockUS: 6 },
      { size: 'l', colour: 'burgundy', stockUK: 5, stockUS: 6 },
    ],
  },
  {
    name: "Women's Lambswool Cardigan",
    slug: 'womens-lambswool-cardigan',
    description: 'Button-front lambswool cardigan with ribbed cuffs. Warm, soft, and perfect for layering.',
    brand: BRAND.MERIDIAN,
    categorySlug: 'womens-knitwear',
    price: 149.0,
    salePrice: null,
    variants: [
      { size: 'xs', colour: 'cream', stockUK: 8, stockUS: 10 },
      { size: 's', colour: 'cream', stockUK: 10, stockUS: 12 },
      { size: 'm', colour: 'cream', stockUK: 8, stockUS: 10 },
      { size: 'l', colour: 'cream', stockUK: 6, stockUS: 8 },
      { size: 's', colour: 'forest-green', stockUK: 6, stockUS: 8 },
      { size: 'm', colour: 'forest-green', stockUK: 6, stockUS: 8 },
    ],
  },
  {
    name: 'Merino Beanie Hat',
    slug: 'merino-beanie-hat',
    description: 'Soft merino wool beanie. Lightweight, warm, and itch-free. One size fits most.',
    brand: BRAND.MERIDIAN,
    categorySlug: 'hats',
    price: 39.0,
    salePrice: null,
    variants: [
      { size: 'm', colour: 'charcoal', stockUK: 20, stockUS: 25 },
      { size: 'm', colour: 'navy', stockUK: 15, stockUS: 20 },
      { size: 'm', colour: 'burgundy', stockUK: 12, stockUS: 15 },
    ],
  },

  // === Foxglove Accessories ===
  {
    name: 'Leather Weekend Bag',
    slug: 'leather-weekend-bag',
    description: 'Handcrafted full-grain leather weekend bag. Cotton canvas lining, brass hardware, and lifetime guarantee.',
    brand: BRAND.FOXGLOVE,
    categorySlug: 'bags',
    price: 349.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 'm', colour: 'brown', stockUK: 5, stockUS: 8 },
      { size: 'm', colour: 'black', stockUK: 6, stockUS: 10 },
    ],
  },
  {
    name: 'Full-Grain Leather Belt',
    slug: 'full-grain-leather-belt',
    description: 'Full-grain leather belt with solid brass buckle. Ages beautifully with wear.',
    brand: BRAND.FOXGLOVE,
    categorySlug: 'belts',
    price: 69.0,
    salePrice: null,
    variants: [
      { size: 's', colour: 'brown', stockUK: 15, stockUS: 20 },
      { size: 'm', colour: 'brown', stockUK: 20, stockUS: 25 },
      { size: 'l', colour: 'brown', stockUK: 15, stockUS: 18 },
      { size: 'm', colour: 'black', stockUK: 15, stockUS: 20 },
      { size: 'l', colour: 'black', stockUK: 12, stockUS: 15 },
    ],
  },
  {
    name: 'Bifold Leather Wallet',
    slug: 'bifold-leather-wallet',
    description: 'Slim bifold wallet in full-grain leather. 6 card slots and a cash pocket.',
    brand: BRAND.FOXGLOVE,
    categorySlug: 'wallets',
    price: 79.0,
    salePrice: 59.0,
    variants: [
      { size: 'm', colour: 'brown', stockUK: 15, stockUS: 20 },
      { size: 'm', colour: 'black', stockUK: 18, stockUS: 22 },
    ],
  },
  {
    name: 'Cashmere Scarf',
    slug: 'cashmere-scarf',
    description: 'Luxurious cashmere scarf. Soft, warm, and elegant. 100% pure cashmere.',
    brand: BRAND.FOXGLOVE,
    categorySlug: 'scarves',
    price: 119.0,
    salePrice: null,
    variants: [
      { size: 'm', colour: 'charcoal', stockUK: 10, stockUS: 12 },
      { size: 'm', colour: 'burgundy', stockUK: 8, stockUS: 10 },
      { size: 'm', colour: 'forest-green', stockUK: 6, stockUS: 8 },
    ],
  },

  // === Stride Footwear ===
  {
    name: 'Classic White Sneakers',
    slug: 'classic-white-sneakers',
    description: 'Minimalist white leather sneakers. Clean design, premium materials, and all-day comfort.',
    brand: BRAND.STRIDE,
    categorySlug: 'sneakers',
    price: 129.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 's', colour: 'white', stockUK: 10, stockUS: 15 },
      { size: 'm', colour: 'white', stockUK: 15, stockUS: 20 },
      { size: 'l', colour: 'white', stockUK: 12, stockUS: 18 },
      { size: 'xl', colour: 'white', stockUK: 8, stockUS: 10 },
    ],
  },
  {
    name: 'Leather Chelsea Boots',
    slug: 'leather-chelsea-boots',
    description: 'Classic Chelsea boots in full-grain leather. Elastic side panels and durable rubber sole.',
    brand: BRAND.STRIDE,
    categorySlug: 'boots',
    price: 199.0,
    salePrice: null,
    variants: [
      { size: 's', colour: 'brown', stockUK: 8, stockUS: 10 },
      { size: 'm', colour: 'brown', stockUK: 10, stockUS: 12 },
      { size: 'l', colour: 'brown', stockUK: 8, stockUS: 10 },
      { size: 'm', colour: 'black', stockUK: 8, stockUS: 10 },
      { size: 'l', colour: 'black', stockUK: 6, stockUS: 8 },
    ],
  },
  {
    name: 'Leather Sandals',
    slug: 'leather-sandals',
    description: 'Handcrafted leather sandals with cushioned footbed. Perfect for summer.',
    brand: BRAND.STRIDE,
    categorySlug: 'sandals',
    price: 89.0,
    salePrice: 69.0,
    variants: [
      { size: 's', colour: 'brown', stockUK: 10, stockUS: 12 },
      { size: 'm', colour: 'brown', stockUK: 12, stockUS: 15 },
      { size: 'l', colour: 'brown', stockUK: 10, stockUS: 12 },
    ],
  },

  // === Lumina Eyewear ===
  {
    name: 'Classic Aviator Sunglasses',
    slug: 'classic-aviator-sunglasses',
    description: 'Timeless aviator sunglasses with UV400 protection. Lightweight metal frame and polarised lenses.',
    brand: BRAND.LUMINA,
    categorySlug: 'sunglasses',
    price: 149.0,
    salePrice: null,
    isFeatured: true,
    variants: [
      { size: 'm', colour: 'black', stockUK: 12, stockUS: 15 },
      { size: 'm', colour: 'navy', stockUK: 10, stockUS: 12 },
    ],
  },
  {
    name: 'Round Acetate Sunglasses',
    slug: 'round-acetate-sunglasses',
    description: 'Round-frame acetate sunglasses with gradient lenses. Italian craftsmanship.',
    brand: BRAND.LUMINA,
    categorySlug: 'sunglasses',
    price: 169.0,
    salePrice: null,
    variants: [
      { size: 'm', colour: 'charcoal', stockUK: 8, stockUS: 10 },
      { size: 'm', colour: 'burgundy', stockUK: 6, stockUS: 8 },
    ],
  },

  // === Unisex items ===
  {
    name: 'Organic Cotton T-Shirt',
    slug: 'organic-cotton-tshirt',
    description: 'Premium organic cotton t-shirt in relaxed fit. GOTS-certified cotton, ethically made.',
    brand: BRAND.NORTHWIND,
    categorySlug: 'unisex-tshirts',
    price: 39.0,
    salePrice: null,
    variants: [
      { size: 'xs', colour: 'white', stockUK: 15, stockUS: 20 },
      { size: 's', colour: 'white', stockUK: 20, stockUS: 25 },
      { size: 'm', colour: 'white', stockUK: 25, stockUS: 30 },
      { size: 'l', colour: 'white', stockUK: 20, stockUS: 25 },
      { size: 'xl', colour: 'white', stockUK: 15, stockUS: 20 },
      { size: 's', colour: 'black', stockUK: 18, stockUS: 22 },
      { size: 'm', colour: 'black', stockUK: 20, stockUS: 25 },
      { size: 'l', colour: 'black', stockUK: 15, stockUS: 20 },
    ],
  },
  {
    name: 'Heavyweight Hoodie',
    slug: 'heavyweight-hoodie',
    description: 'Heavyweight 400gsm cotton hoodie with fleece lining. Built to last with double-stitched seams.',
    brand: BRAND.COASTLINE,
    categorySlug: 'hoodies-sweatshirts',
    price: 89.0,
    salePrice: null,
    variants: [
      { size: 's', colour: 'black', stockUK: 12, stockUS: 15 },
      { size: 'm', colour: 'black', stockUK: 15, stockUS: 20 },
      { size: 'l', colour: 'black', stockUK: 12, stockUS: 15 },
      { size: 'xl', colour: 'black', stockUK: 10, stockUS: 12 },
      { size: 'm', colour: 'grey', stockUK: 12, stockUS: 15 },
      { size: 'l', colour: 'grey', stockUK: 10, stockUS: 12 },
    ],
  },
  {
    name: 'Cable Knit Beanie',
    slug: 'cable-knit-beanie',
    description: 'Cable knit beanie in lambswool. Warm, soft, and stylish.',
    brand: BRAND.MERIDIAN,
    categorySlug: 'hats',
    price: 45.0,
    salePrice: null,
    variants: [
      { size: 'm', colour: 'cream', stockUK: 15, stockUS: 20 },
      { size: 'm', colour: 'grey', stockUK: 12, stockUS: 15 },
      { size: 'm', colour: 'navy', stockUK: 10, stockUS: 12 },
    ],
  },
];

exports.seed = async function (knex) {
  // Clean up fashion products (by organizationId + slug prefix pattern)
  const fashionSlugs = products.map(p => p.slug);
  const existingProducts = await knex('product').whereIn('slug', fashionSlugs).pluck('productId');
  if (existingProducts.length > 0) {
    await knex('productCategoryMap').whereIn('productId', existingProducts).del();
    await knex('productVariant').whereIn('productId', existingProducts).del();
    await knex('productImage').whereIn('productId', existingProducts).del();
    await knex('product').whereIn('productId', existingProducts).del();
  }

  const now = knex.fn.now();

  for (const p of products) {
    // Find category by slug
    const category = await knex('productCategory').where({ slug: p.categorySlug }).first('productCategoryId');
    if (!category) {
      console.warn(`Category not found: ${p.categorySlug} — skipping ${p.name}`);
      continue;
    }

    // Insert product
    const [productRow] = await knex('product')
      .insert({
        sku: p.slug.toUpperCase().replace(/-/g, '-').substring(0, 20),
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.description.substring(0, 100),
        type: 'configurable',
        status: 'active',
        visibility: 'visible',
        price: p.price,
        salePrice: p.salePrice,
        weight: 500,
        weightUnit: 'g',
        isInventoryManaged: true,
        isFeatured: p.isFeatured || false,
        isNew: true,
        isBestseller: false,
        hasVariants: p.variants.length > 1,
        brandId: p.brand,
        organizationId: ORG_ID,
        createdAt: now,
        updatedAt: now,
      })
      .returning(['productId']);

    const productId = productRow.productId || productRow;

    // Link to category
    await knex('productCategoryMap').insert({
      productId,
      productCategoryId: category.productCategoryId,
      isPrimary: true,
    });

    // Insert product image (local file under public/uploads/products/)
    await knex('productImage').insert({
      productId,
      url: `/uploads/products/${p.slug}.jpg`,
      alt: p.name,
      position: 1,
      isPrimary: true,
    });

    // Insert variants
    for (let i = 0; i < p.variants.length; i++) {
      const v = p.variants[i];
      const variantSku = `${p.slug.substring(0, 15)}-${v.size}-${v.colour}`.toUpperCase();

      await knex('productVariant').insert({
        productId,
        sku: variantSku,
        name: `${p.name} - ${v.size.toUpperCase()} / ${v.colour}`,
        price: p.price,
        salePrice: p.salePrice,
        optionValues: JSON.stringify([
          { name: 'size', value: v.size },
          { name: 'color', value: v.colour },
        ]),
        status: 'active',
        position: i + 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  console.log(`Seeded ${products.length} fashion products`);
};

exports.STORE = STORE;
exports.BRAND = BRAND;
exports.products = products;
