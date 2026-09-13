/**
 * Seed Fashion Categories
 * Creates a fashion-specific category tree:
 *   Clothing → Men / Women / Unisex
 *   Accessories → Bags / Belts / Wallets / Scarves / Hats / Sunglasses
 *   Footwear → Sneakers / Boots / Sandals / Heels
 */

const tableName = 'productCategory';

exports.seed = async function (knex) {
  // Clean up fashion categories (by path prefix)
  await knex(tableName).where('path', 'like', '/fashion%').del();

  const now = knex.fn.now();

  const categories = [
    // Root
    { name: 'Clothing', slug: 'clothing', description: 'All clothing items', depth: 0, path: '/fashion/clothing' },
    { name: 'Accessories', slug: 'accessories', description: 'Bags, belts, wallets, and more', depth: 0, path: '/fashion/accessories' },
    { name: 'Footwear', slug: 'footwear', description: 'Sneakers, boots, sandals, and heels', depth: 0, path: '/fashion/footwear' },

    // Men's Clothing
    { name: 'Men', slug: 'men', description: "Men's clothing", depth: 1, path: '/fashion/clothing/men' },
    {
      name: "Men's Shirts",
      slug: 'mens-shirts',
      description: "Men's shirts and formal wear",
      depth: 2,
      path: '/fashion/clothing/men/shirts',
    },
    {
      name: "Men's T-Shirts",
      slug: 'mens-tshirts',
      description: "Men's t-shirts and casual tops",
      depth: 2,
      path: '/fashion/clothing/men/tshirts',
    },
    { name: "Men's Jeans", slug: 'mens-jeans', description: "Men's jeans and denim", depth: 2, path: '/fashion/clothing/men/jeans' },
    {
      name: "Men's Trousers",
      slug: 'mens-trousers',
      description: "Men's trousers and chinos",
      depth: 2,
      path: '/fashion/clothing/men/trousers',
    },
    {
      name: "Men's Jackets",
      slug: 'mens-jackets',
      description: "Men's jackets and coats",
      depth: 2,
      path: '/fashion/clothing/men/jackets',
    },
    {
      name: "Men's Knitwear",
      slug: 'mens-knitwear',
      description: "Men's knitwear and sweaters",
      depth: 2,
      path: '/fashion/clothing/men/knitwear',
    },
    {
      name: "Men's Underwear & Socks",
      slug: 'mens-underwear-socks',
      description: "Men's underwear and socks",
      depth: 2,
      path: '/fashion/clothing/men/underwear-socks',
    },

    // Women's Clothing
    { name: 'Women', slug: 'women', description: "Women's clothing", depth: 1, path: '/fashion/clothing/women' },
    { name: "Women's Dresses", slug: 'womens-dresses', description: "Women's dresses", depth: 2, path: '/fashion/clothing/women/dresses' },
    { name: "Women's Tops", slug: 'womens-tops', description: "Women's tops and blouses", depth: 2, path: '/fashion/clothing/women/tops' },
    {
      name: "Women's Jeans",
      slug: 'womens-jeans',
      description: "Women's jeans and denim",
      depth: 2,
      path: '/fashion/clothing/women/jeans',
    },
    { name: "Women's Skirts", slug: 'womens-skirts', description: "Women's skirts", depth: 2, path: '/fashion/clothing/women/skirts' },
    {
      name: "Women's Jackets",
      slug: 'womens-jackets',
      description: "Women's jackets and coats",
      depth: 2,
      path: '/fashion/clothing/women/jackets',
    },
    {
      name: "Women's Knitwear",
      slug: 'womens-knitwear',
      description: "Women's knitwear and sweaters",
      depth: 2,
      path: '/fashion/clothing/women/knitwear',
    },
    {
      name: "Women's Lingerie",
      slug: 'womens-lingerie',
      description: "Women's lingerie and loungewear",
      depth: 2,
      path: '/fashion/clothing/women/lingerie',
    },
    {
      name: "Women's Activewear",
      slug: 'womens-activewear',
      description: "Women's activewear and gym wear",
      depth: 2,
      path: '/fashion/clothing/women/activewear',
    },

    // Unisex
    { name: 'Unisex', slug: 'unisex', description: 'Unisex clothing', depth: 1, path: '/fashion/clothing/unisex' },
    { name: 'Unisex T-Shirts', slug: 'unisex-tshirts', description: 'Unisex t-shirts', depth: 2, path: '/fashion/clothing/unisex/tshirts' },
    {
      name: 'Hoodies & Sweatshirts',
      slug: 'hoodies-sweatshirts',
      description: 'Hoodies and sweatshirts',
      depth: 2,
      path: '/fashion/clothing/unisex/hoodies-sweatshirts',
    },

    // Accessories subcategories
    { name: 'Bags', slug: 'bags', description: 'Bags and backpacks', depth: 1, path: '/fashion/accessories/bags' },
    { name: 'Belts', slug: 'belts', description: 'Leather and fabric belts', depth: 1, path: '/fashion/accessories/belts' },
    { name: 'Wallets', slug: 'wallets', description: 'Wallets and cardholders', depth: 1, path: '/fashion/accessories/wallets' },
    { name: 'Scarves', slug: 'scarves', description: 'Scarves and wraps', depth: 1, path: '/fashion/accessories/scarves' },
    { name: 'Hats', slug: 'hats', description: 'Hats and caps', depth: 1, path: '/fashion/accessories/hats' },
    { name: 'Sunglasses', slug: 'sunglasses', description: 'Sunglasses and eyewear', depth: 1, path: '/fashion/accessories/sunglasses' },

    // Footwear subcategories
    { name: 'Sneakers', slug: 'sneakers', description: 'Sneakers and trainers', depth: 1, path: '/fashion/footwear/sneakers' },
    { name: 'Boots', slug: 'boots', description: 'Boots and booties', depth: 1, path: '/fashion/footwear/boots' },
    { name: 'Sandals', slug: 'sandals', description: 'Sandals and flip-flops', depth: 1, path: '/fashion/footwear/sandals' },
    { name: 'Heels', slug: 'heels', description: 'Heels and formal shoes', depth: 1, path: '/fashion/footwear/heels' },
  ];

  const rows = categories.map(c => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    isActive: true,
    includeInMenu: c.depth <= 1,
    depth: c.depth,
    path: c.path,
    createdAt: now,
    updatedAt: now,
  }));

  await knex(tableName).insert(rows);
};
