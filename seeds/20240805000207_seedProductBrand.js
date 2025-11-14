/**
 * Seed product brands
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  const brands = [
    { name: 'Acme Corporation', slug: 'acme-corporation', description: 'Quality products for every need', logoUrl: 'https://example.com/brands/acme-logo.png', isFeatured: true, isGlobal: true },
    { name: 'TechGear', slug: 'techgear', description: 'Innovative technology solutions', logoUrl: 'https://example.com/brands/techgear-logo.png', isFeatured: true, isGlobal: true },
    { name: 'Fashionista', slug: 'fashionista', description: 'Trendy and stylish fashion products', logoUrl: 'https://example.com/brands/fashionista-logo.png', isFeatured: false, isGlobal: true }
  ];

  for (const brand of brands) {
    await knex('productBrand')
      .insert(brand)
      .onConflict('slug')
      .merge();
  }
};
