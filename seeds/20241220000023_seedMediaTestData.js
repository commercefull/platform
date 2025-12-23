/**
 * Seed Media Test Data
 * Creates test media files for integration testing
 */

const tableName = 'media';

// Use fixed UUIDs for test media
const TEST_MEDIA_IDS = {
  PNG: '30000000-0000-0000-0000-000000000001',
  JPG: '30000000-0000-0000-0000-000000000002',
  SVG: '30000000-0000-0000-0000-000000000003',
  PDF: '30000000-0000-0000-0000-000000000004',
};

exports.seed = async function (knex) {
  // Clean up existing test data
  await knex(tableName).whereIn('mediaId', Object.values(TEST_MEDIA_IDS)).del();

  // Insert test media files
  await knex(tableName).insert([
    {
      mediaId: TEST_MEDIA_IDS.PNG,
      originalName: 'test-image.png',
      mimeType: 'image/png',
      size: 245760, // ~240KB
      originalUrl: 'https://example.com/test-image.png',
      processedFiles: JSON.stringify([
        {
          url: 'https://example.com/test-image.webp',
          format: 'webp',
          width: 1200,
          height: 800,
          size: 153600, // ~150KB
          quality: 85,
        },
        {
          url: 'https://example.com/test-image_800x533.webp',
          format: 'webp',
          width: 800,
          height: 533,
          size: 102400, // ~100KB
          quality: 85,
        },
        {
          url: 'https://example.com/test-image_400x267.webp',
          format: 'webp',
          width: 400,
          height: 267,
          size: 51200, // ~50KB
          quality: 85,
        },
      ]),
      thumbnailUrl: 'https://example.com/test-image_thumbnail.webp',
      altText: 'Test PNG image',
      title: 'Test Image PNG',
      tags: ['test', 'png', 'sample'],
      metadata: JSON.stringify({
        width: 1200,
        height: 800,
        colorSpace: 'RGB',
        hasAlpha: false,
        compression: 'lossless',
      }),
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      mediaId: TEST_MEDIA_IDS.JPG,
      originalName: 'test-photo.jpg',
      mimeType: 'image/jpeg',
      size: 512000, // ~500KB
      originalUrl: 'https://example.com/test-photo.jpg',
      processedFiles: JSON.stringify([
        {
          url: 'https://example.com/test-photo.webp',
          format: 'webp',
          width: 1920,
          height: 1280,
          size: 307200, // ~300KB
          quality: 90,
        },
        {
          url: 'https://example.com/test-photo_1280x853.webp',
          format: 'webp',
          width: 1280,
          height: 853,
          size: 204800, // ~200KB
          quality: 90,
        },
        {
          url: 'https://example.com/test-photo_640x427.webp',
          format: 'webp',
          width: 640,
          height: 427,
          size: 102400, // ~100KB
          quality: 90,
        },
      ]),
      thumbnailUrl: 'https://example.com/test-photo_thumbnail.webp',
      altText: 'Test JPEG photo',
      title: 'Test Photo JPEG',
      description: 'A beautiful test photograph for media processing',
      tags: ['test', 'jpeg', 'photo', 'sample'],
      metadata: JSON.stringify({
        width: 1920,
        height: 1280,
        colorSpace: 'RGB',
        compression: 'jpeg',
        quality: 95,
      }),
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      mediaId: TEST_MEDIA_IDS.SVG,
      originalName: 'test-banner.jpg',
      mimeType: 'image/jpeg',
      size: 768000, // ~750KB
      originalUrl: 'https://example.com/test-banner.jpg',
      processedFiles: JSON.stringify([
        {
          url: 'https://example.com/test-banner.webp',
          format: 'webp',
          width: 1920,
          height: 600,
          size: 245760, // ~240KB
          quality: 85,
        },
        {
          url: 'https://example.com/test-banner_1600x500.webp',
          format: 'webp',
          width: 1600,
          height: 500,
          size: 204800, // ~200KB
          quality: 85,
        },
        {
          url: 'https://example.com/test-banner_1200x375.webp',
          format: 'webp',
          width: 1200,
          height: 375,
          size: 153600, // ~150KB
          quality: 85,
        },
        {
          url: 'https://example.com/test-banner_800x250.webp',
          format: 'webp',
          width: 800,
          height: 250,
          size: 102400, // ~100KB
          quality: 85,
        },
      ]),
      thumbnailUrl: 'https://example.com/test-banner_thumbnail.webp',
      altText: 'Test banner image',
      title: 'Test Banner Image',
      description: 'Hero banner image for testing responsive processing',
      tags: ['test', 'banner', 'hero', 'responsive'],
      metadata: JSON.stringify({
        width: 1920,
        height: 600,
        colorSpace: 'RGB',
        aspectRatio: '3.2:1',
        usage: 'banner',
      }),
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
};
