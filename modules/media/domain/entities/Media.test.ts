/**
 * Unit Tests for Media Entity
 */

import { Media, MediaFile } from './Media';

describe('Media', () => {
  function createMedia(overrides?: Record<string, unknown>): Media {
    return Media.create({
      mediaId: 'med-1',
      originalName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 102400,
      originalUrl: 'https://cdn.example.com/photo.jpg',
      ...overrides,
    });
  }

  describe('create', () => {
    it('should create with defaults', () => {
      const m = createMedia();

      expect(m.mediaId).toBe('med-1');
      expect(m.originalName).toBe('photo.jpg');
      expect(m.mimeType).toBe('image/jpeg');
      expect(m.size).toBe(102400);
      expect(m.processedFiles).toHaveLength(0);
      expect(m.tags).toHaveLength(0);
    });

    it('should create with optional fields', () => {
      const m = createMedia({
        altText: 'A photo',
        title: 'My Photo',
        tags: ['nature', 'summer'],
        metadata: { width: 800, height: 600 },
      });

      expect(m.altText).toBe('A photo');
      expect(m.title).toBe('My Photo');
      expect(m.tags).toEqual(['nature', 'summer']);
      expect(m.metadata).toEqual({ width: 800, height: 600 });
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const m = Media.reconstitute({
        mediaId: 'med-1',
        originalName: 'video.mp4',
        mimeType: 'video/mp4',
        size: 5000000,
        originalUrl: 'https://cdn.example.com/video.mp4',
        processedFiles: [],
        tags: [],
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(m.originalName).toBe('video.mp4');
      expect(m.isVideo).toBe(true);
    });
  });

  describe('computed properties', () => {
    it('isImage should be true for image mime type', () => {
      const m = createMedia({ mimeType: 'image/png' });
      expect(m.isImage).toBe(true);
      expect(m.isVideo).toBe(false);
    });

    it('isVideo should be true for video mime type', () => {
      const m = createMedia({ mimeType: 'video/mp4' });
      expect(m.isVideo).toBe(true);
      expect(m.isImage).toBe(false);
    });

    it('primaryFile should prefer webp format', () => {
      const webp: MediaFile = { url: 'u.webp', format: 'webp', size: 100, width: 800, height: 600 };
      const orig: MediaFile = { url: 'u.jpg', format: 'original', size: 200 };
      const m = createMedia({ processedFiles: [orig, webp] });

      expect(m.primaryFile?.format).toBe('webp');
    });

    it('primaryFile should fall back to original', () => {
      const orig: MediaFile = { url: 'u.jpg', format: 'original', size: 200 };
      const m = createMedia({ processedFiles: [orig] });

      expect(m.primaryFile?.format).toBe('original');
    });

    it('primaryFile should fall back to first file', () => {
      const f: MediaFile = { url: 'u.avif', format: 'avif', size: 100 };
      const m = createMedia({ processedFiles: [f] });

      expect(m.primaryFile?.format).toBe('avif');
    });

    it('primaryFile should be undefined when no processed files', () => {
      const m = createMedia();
      expect(m.primaryFile).toBeUndefined();
    });
  });

  describe('addProcessedFile', () => {
    it('should add a new processed file', () => {
      const m = createMedia();
      m.addProcessedFile({ url: 'u.webp', format: 'webp', size: 100, width: 800, height: 600 });

      expect(m.processedFiles).toHaveLength(1);
    });

    it('should replace existing file with same format and dimensions', () => {
      const m = createMedia();
      m.addProcessedFile({ url: 'u1.webp', format: 'webp', size: 100, width: 800, height: 600 });
      m.addProcessedFile({ url: 'u2.webp', format: 'webp', size: 90, width: 800, height: 600 });

      expect(m.processedFiles).toHaveLength(1);
      expect(m.processedFiles[0].url).toBe('u2.webp');
    });
  });

  describe('removeProcessedFile', () => {
    it('should remove a processed file by format and dimensions', () => {
      const m = createMedia();
      m.addProcessedFile({ url: 'u1.webp', format: 'webp', size: 100, width: 800, height: 600 });
      m.addProcessedFile({ url: 'u2.jpg', format: 'original', size: 200 });
      m.removeProcessedFile('webp', 800, 600);

      expect(m.processedFiles).toHaveLength(1);
      expect(m.processedFiles[0].format).toBe('original');
    });
  });

  describe('setThumbnail', () => {
    it('should set thumbnail URL', () => {
      const m = createMedia();
      m.setThumbnail('https://cdn.example.com/thumb.jpg');

      expect(m.thumbnailUrl).toBe('https://cdn.example.com/thumb.jpg');
    });
  });

  describe('tags', () => {
    it('addTag should add a new tag', () => {
      const m = createMedia();
      m.addTag('summer');

      expect(m.tags).toContain('summer');
    });

    it('addTag should not add duplicates', () => {
      const m = createMedia({ tags: ['summer'] });
      m.addTag('summer');

      expect(m.tags).toHaveLength(1);
    });

    it('removeTag should remove a tag', () => {
      const m = createMedia({ tags: ['summer', 'winter'] });
      m.removeTag('summer');

      expect(m.tags).toEqual(['winter']);
    });
  });

  describe('updateMetadata', () => {
    it('should merge metadata', () => {
      const m = createMedia({ metadata: { width: 800 } });
      m.updateMetadata({ height: 600, format: 'jpeg' });

      expect(m.metadata).toEqual({ width: 800, height: 600, format: 'jpeg' });
    });
  });

  describe('toJSON', () => {
    it('should return serialized object', () => {
      const m = createMedia();
      const json = m.toJSON();

      expect(json.mediaId).toBe('med-1');
      expect(json.originalName).toBe('photo.jpg');
      expect(json.isImage).toBe(true);
    });
  });
});
