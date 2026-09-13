/**
 * Seed Fashion Brands
 * Creates 8 fashion brands for the multi-brand merchant.
 */

const tableName = 'brand';

const ORG_ID = '01911000-0000-7000-8000-000000000001';

const brands = [
  {
    brandId: '31000000-0000-0000-0000-000000000001',
    name: 'Northwind Apparel',
    slug: 'northwind-apparel',
    description:
      'Premium menswear crafted with timeless British tailoring traditions. Specialising in shirts, knitwear, and tailored essentials for the modern gentleman.',
    logoUrl: null,
    website: 'https://northwind.example.com',
    countryOfOrigin: 'GB',
    status: 'active',
  },
  {
    brandId: '31000000-0000-0000-0000-000000000002',
    name: 'Coastline Denim',
    slug: 'coastline-denim',
    description:
      'American denim specialists since 1985. Heritage craftsmanship meets modern fits. Made in the USA from premium Japanese selvedge denim.',
    logoUrl: null,
    website: 'https://coastline.example.com',
    countryOfOrigin: 'US',
    status: 'active',
  },
  {
    brandId: '31000000-0000-0000-0000-000000000003',
    name: 'Atlas Activewear',
    slug: 'atlas-activewear',
    description:
      'Performance sportswear designed for athletes. Moisture-wicking fabrics, ergonomic cuts, and sustainable materials for the modern active lifestyle.',
    logoUrl: null,
    website: 'https://atlas.example.com',
    countryOfOrigin: 'US',
    status: 'active',
  },
  {
    brandId: '31000000-0000-0000-0000-000000000004',
    name: 'Verona Linen',
    slug: 'verona-linen',
    description:
      'Italian linen and summer wear for women. Breathable, elegant, and effortlessly chic. Crafted in Italy from the finest European flax linen.',
    logoUrl: null,
    website: 'https://verona.example.com',
    countryOfOrigin: 'IT',
    status: 'active',
  },
  {
    brandId: '31000000-0000-0000-0000-000000000005',
    name: 'Meridian Knitwear',
    slug: 'meridian-knitwear',
    description:
      'British knitwear specialists. Cashmere, merino wool, and lambswool sweaters, cardigans, and accessories. Sustainable, ethical, and made to last.',
    logoUrl: null,
    website: 'https://meridian.example.com',
    countryOfOrigin: 'GB',
    status: 'active',
  },
  {
    brandId: '31000000-0000-0000-0000-000000000006',
    name: 'Foxglove Accessories',
    slug: 'foxglove-accessories',
    description:
      'Leather goods and accessories handcrafted in England. Bags, wallets, and belts made from full-grain leather with a lifetime guarantee.',
    logoUrl: null,
    website: 'https://foxglove.example.com',
    countryOfOrigin: 'GB',
    status: 'active',
  },
  {
    brandId: '31000000-0000-0000-0000-000000000007',
    name: 'Stride Footwear',
    slug: 'stride-footwear',
    description:
      'Sneakers and boots for the urban explorer. Combining athletic performance with street style. Made in the USA with globally sourced materials.',
    logoUrl: null,
    website: 'https://stride.example.com',
    countryOfOrigin: 'US',
    status: 'active',
  },
  {
    brandId: '31000000-0000-0000-0000-000000000008',
    name: 'Lumina Eyewear',
    slug: 'lumina-eyewear',
    description:
      'Italian-designed sunglasses and optical frames. UV-protective lenses, lightweight acetate frames, and timeless silhouettes. Crafted in Italy.',
    logoUrl: null,
    website: 'https://lumina.example.com',
    countryOfOrigin: 'IT',
    status: 'active',
  },
];

exports.seed = async function (knex) {
  await knex(tableName)
    .whereIn(
      'brandId',
      brands.map(b => b.brandId),
    )
    .del();

  const now = knex.fn.now();
  const rows = brands.map(b => ({
    ...b,
    organizationId: ORG_ID,
    metadata: JSON.stringify({}),
    createdAt: now,
    updatedAt: now,
  }));

  await knex(tableName).insert(rows);
};

exports.BRAND_IDS = brands.reduce((acc, b) => {
  acc[b.slug] = b.brandId;
  return acc;
}, {});
