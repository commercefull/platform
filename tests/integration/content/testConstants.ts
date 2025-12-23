/**
 * Content Integration Test Constants
 * Shared test data and IDs for content integration tests
 */

export const TEST_IDS = {
  // Content Types
  contentTypeId: '00000000-0000-0000-0000-000000000901',
  contentTypeId2: '00000000-0000-0000-0000-000000000902',

  // Pages
  pageId: '00000000-0000-0000-0000-000000000910',
  pageId2: '00000000-0000-0000-0000-000000000911',

  // Blocks
  blockId: '00000000-0000-0000-0000-000000000920',
  blockId2: '00000000-0000-0000-0000-000000000921',

  // Templates
  templateId: '00000000-0000-0000-0000-000000000930',
  templateId2: '00000000-0000-0000-0000-000000000931',

  // Categories
  categoryId: '00000000-0000-0000-0000-000000000940',
  categoryId2: '00000000-0000-0000-0000-000000000941',
  parentCategoryId: '00000000-0000-0000-0000-000000000942',

  // Navigation
  navigationId: '00000000-0000-0000-0000-000000000950',
  navigationItemId: '00000000-0000-0000-0000-000000000951',
  navigationItemId2: '00000000-0000-0000-0000-000000000952',

  // Media
  mediaId: '00000000-0000-0000-0000-000000000960',
  mediaId2: '00000000-0000-0000-0000-000000000961',
  mediaFolderId: '00000000-0000-0000-0000-000000000962',

  // Redirects
  redirectId: '00000000-0000-0000-0000-000000000970',
  redirectId2: '00000000-0000-0000-0000-000000000971',
};

export const TEST_DATA = {
  contentType: {
    name: 'Test Blog Post',
    slug: 'test-blog-post',
    description: 'A test blog post content type',
    icon: 'file-text',
    isActive: true,
  },

  page: {
    title: 'Test Page',
    slug: 'test-page',
    status: 'draft',
    visibility: 'public',
    summary: 'A test page summary',
    metaTitle: 'Test Page Meta Title',
    metaDescription: 'Test page meta description',
  },

  block: {
    name: 'Test Hero Block',
    order: 0,
    content: { title: 'Welcome', subtitle: 'To our site' },
    status: 'active',
  },

  template: {
    name: 'Test Template',
    slug: 'test-template',
    description: 'A test template',
    htmlStructure: '<div class="container">{{content}}</div>',
    isActive: true,
  },

  category: {
    name: 'Test Category',
    slug: 'test-category',
    description: 'A test category',
    sortOrder: 0,
    isActive: true,
  },

  navigation: {
    name: 'Test Navigation',
    slug: 'test-navigation',
    description: 'A test navigation menu',
    location: 'header',
    isActive: true,
  },

  navigationItem: {
    title: 'Home',
    type: 'url',
    url: '/',
    sortOrder: 0,
    isActive: true,
  },

  media: {
    title: 'Test Image',
    fileName: 'test-image.jpg',
    filePath: '/uploads/test-image.jpg',
    fileType: 'image/jpeg',
    fileSize: 1024,
    url: 'https://example.com/test-image.jpg',
    altText: 'Test image alt text',
  },

  redirect: {
    sourceUrl: '/old-page',
    targetUrl: '/new-page',
    statusCode: 301,
    isRegex: false,
    isActive: true,
  },
};

export const API_BASE = '/business/content';
