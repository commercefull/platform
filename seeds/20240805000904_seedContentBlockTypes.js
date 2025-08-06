/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('contentBlockType').insert([
    { name: 'Heading', slug: 'heading', description: 'Title or section heading', category: 'Basic', isSystem: true, sortOrder: 10 },
    { name: 'Text', slug: 'text', description: 'Rich text content', category: 'Basic', isSystem: true, sortOrder: 20 },
    { name: 'Image', slug: 'image', description: 'Single image with options', category: 'Media', isSystem: true, sortOrder: 30 },
    { name: 'Gallery', slug: 'gallery', description: 'Multiple image gallery', category: 'Media', isSystem: true, sortOrder: 40 },
    { name: 'Video', slug: 'video', description: 'Video embed or upload', category: 'Media', isSystem: true, sortOrder: 50 },
    { name: 'Button', slug: 'button', description: 'Call to action button', category: 'Basic', isSystem: true, sortOrder: 60 },
    { name: 'Divider', slug: 'divider', description: 'Visual separator', category: 'Layout', isSystem: true, sortOrder: 70 },
    { name: 'Columns', slug: 'columns', description: 'Multi-column layout', category: 'Layout', isSystem: true, sortOrder: 80 },
    { name: 'Spacer', slug: 'spacer', description: 'Vertical spacing control', category: 'Layout', isSystem: true, sortOrder: 90 },
    { name: 'Product', slug: 'product', description: 'Single product display', category: 'Commerce', isSystem: true, sortOrder: 100 },
    { name: 'Product Grid', slug: 'product-grid', description: 'Display multiple products', category: 'Commerce', isSystem: true, sortOrder: 110 },
    { name: 'Form', slug: 'form', description: 'Contact or subscription form', category: 'Interactive', isSystem: true, sortOrder: 120 },
    { name: 'HTML', slug: 'html', description: 'Custom HTML code', category: 'Advanced', isSystem: true, sortOrder: 130 }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('contentBlockType').whereIn('slug', [
    'heading', 'text', 'image', 'gallery', 'video', 'button', 'divider', 'columns', 'spacer', 'product', 'product-grid', 'form', 'html'
  ]).delete();
};
