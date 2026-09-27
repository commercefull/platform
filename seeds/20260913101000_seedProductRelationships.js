/**
 * Seed curated product relationships (productRelated) for the fashion catalog.
 * These merchant-style links drive the manual step of storefront
 * recommendations (pdpAlsoLike, pdpBoughtWith, …) on a fresh install.
 *
 * Runs after 20260913100400_seedFashionProducts — products are resolved by
 * slug (their UUIDs are generated at seed time).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// [source slug, target slug, type, position]
const LINKS = [
  ['oxford-cotton-shirt', 'tailored-chino-trousers', 'related', 0],
  ['oxford-cotton-shirt', 'merino-wool-jumper', 'related', 1],
  ['oxford-cotton-shirt', 'full-grain-leather-belt', 'cross_sell', 0],
  ['merino-wool-jumper', 'cashmere-scarf', 'accessory', 0],
  ['wax-cotton-jacket', 'leather-chelsea-boots', 'cross_sell', 0],
  ['wax-cotton-jacket', 'merino-beanie-hat', 'accessory', 1],
  ['selvedge-slim-jeans', 'classic-white-sneakers', 'related', 0],
  ['selvedge-slim-jeans', 'leather-chelsea-boots', 'cross_sell', 0],
  ['leather-weekend-bag', 'bifold-leather-wallet', 'accessory', 0],
  ['cashmere-crew-neck', 'womens-lambswool-cardigan', 'related', 0],
  ['cashmere-crew-neck', 'cashmere-scarf', 'accessory', 1],
  ['womens-yoga-leggings', 'performance-running-tshirt', 'related', 0],
];

exports.seed = async function (knex) {
  const slugs = [...new Set(LINKS.flatMap(([a, b]) => [a, b]))];
  const products = await knex('product').select('productId', 'slug').whereIn('slug', slugs);
  const idOf = slug => products.find(p => p.slug === slug)?.productId;

  for (const [sourceSlug, targetSlug, type, position] of LINKS) {
    const productId = idOf(sourceSlug);
    const relatedProductId = idOf(targetSlug);
    if (!productId || !relatedProductId) continue; // seed pair missing — skip

    const existing = await knex('productRelated').where({ productId, relatedProductId, type }).first('productRelatedId');
    if (existing) continue;

    await knex('productRelated').insert({
      productId,
      relatedProductId,
      type,
      position,
      isAutomated: false,
    });
  }
};
