/**
 * Seed product brands
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('productBrand').del();
  await knex('productBrand').insert([
    { name: 'Acme Corporation', slug: 'acme-corporation', description: 'Quality products for every need', logoUrl: 'https://example.com/brands/acme-logo.png', isActive: true, isFeatured: true, isGlobal: true },
    { name: 'TechGear', slug: 'techgear', description: 'Innovative technology solutions', logoUrl: 'https://example.com/brands/techgear-logo.png', isActive: true, isFeatured: true, isGlobal: true },
    { name: 'Fashionista', slug: 'fashionista', description: 'Trendy and stylish fashion products', logoUrl: 'https://example.com/brands/fashionista-logo.png', isActive: true, isFeatured: false, isGlobal: true }
  ]);
};
