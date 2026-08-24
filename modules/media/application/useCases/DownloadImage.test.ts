import { DownloadImageUseCase } from './DownloadImage';
import { ProcessImageUseCase } from './ProcessImage';
import { InvalidImageUrlError, MediaDownloadError } from '../../domain/errors/MediaErrors';

jest.mock('../../../../libs/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('DownloadImageUseCase', () => {
  let useCase: DownloadImageUseCase;
  let mockProcessImageUseCase: Record<string, jest.Mock>;

  beforeEach(() => {
    mockProcessImageUseCase = {
      execute: jest.fn().mockResolvedValue({
        media: { toJSON: () => ({ mediaId: 'media_123' }) },
        urls: { original: 'https://cdn.example.com/media/test.jpg' },
      }),
    };
    useCase = new DownloadImageUseCase(mockProcessImageUseCase as unknown as ProcessImageUseCase);
  });

  describe('execute', () => {
    it('should reject an empty URL', async () => {
      await expect(useCase.execute({ url: '' })).rejects.toThrow(InvalidImageUrlError);
    });

    it('should reject a non-HTTP URL', async () => {
      await expect(useCase.execute({ url: 'ftp://example.com/image.png' })).rejects.toThrow(InvalidImageUrlError);
    });

    it('should reject a malformed URL', async () => {
      await expect(useCase.execute({ url: 'not-a-url' })).rejects.toThrow(InvalidImageUrlError);
    });

    it('should delegate to ProcessImageUseCase on successful fetch', async () => {
      const mockArrayBuffer = new ArrayBuffer(4);
      const view = new Uint8Array(mockArrayBuffer);
      view[0] = 0x89;
      view[1] = 0x50;
      view[2] = 0x4e;
      view[3] = 0x47;

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn((key: string) => {
            if (key === 'content-type') return 'image/png';
            if (key === 'content-length') return '4';
            return null;
          }),
        },
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      };

      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      const result = await useCase.execute({
        url: 'https://example.com/product.png',
        altText: 'Product photo',
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/product.png',
        expect.objectContaining({ redirect: 'follow' }),
      );
      expect(mockProcessImageUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            mimetype: 'image/png',
            originalname: 'product.png',
            size: 4,
          }),
          altText: 'Product photo',
          metadata: expect.objectContaining({
            sourceUrl: 'https://example.com/product.png',
          }),
        }),
      );
      expect(result.urls.original).toContain('cdn.example.com');

      fetchSpy.mockRestore();
    });

    it('should reject non-image content types', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn((key: string) => {
            if (key === 'content-type') return 'text/html';
            if (key === 'content-length') return '100';
            return null;
          }),
        },
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(100)),
      };

      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      await expect(useCase.execute({ url: 'https://example.com/page.html' })).rejects.toThrow(InvalidImageUrlError);

      fetchSpy.mockRestore();
    });

    it('should reject when fetch returns non-OK status', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: { get: jest.fn().mockReturnValue(null) },
        arrayBuffer: jest.fn(),
      };

      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      await expect(useCase.execute({ url: 'https://example.com/missing.png' })).rejects.toThrow(MediaDownloadError);

      fetchSpy.mockRestore();
    });

    it('should reject when fetch throws a network error', async () => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect(useCase.execute({ url: 'https://example.com/image.png' })).rejects.toThrow(MediaDownloadError);

      fetchSpy.mockRestore();
    });

    it('should extract filename from URL path', async () => {
      const mockArrayBuffer = new ArrayBuffer(2);
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn((key: string) => {
            if (key === 'content-type') return 'image/jpeg';
            if (key === 'content-length') return '2';
            return null;
          }),
        },
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      };

      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      await useCase.execute({ url: 'https://cdn.example.com/images/2024/photo.jpg?w=800' });

      expect(mockProcessImageUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.objectContaining({
            originalname: 'photo.jpg',
          }),
        }),
      );

      fetchSpy.mockRestore();
    });

    it('should pass through options and metadata', async () => {
      const mockArrayBuffer = new ArrayBuffer(2);
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn((key: string) => {
            if (key === 'content-type') return 'image/webp';
            if (key === 'content-length') return '2';
            return null;
          }),
        },
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      };

      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

      const customMetadata = { productId: 'prod-123' };
      await useCase.execute({
        url: 'https://example.com/img.webp',
        metadata: customMetadata,
        tags: ['product', 'hero'],
      });

      const callArg = mockProcessImageUseCase.execute.mock.calls[0][0];
      expect(callArg.metadata).toEqual(expect.objectContaining({ productId: 'prod-123' }));
      expect(callArg.metadata).toEqual(expect.objectContaining({ sourceUrl: 'https://example.com/img.webp' }));
      expect(callArg.tags).toEqual(['product', 'hero']);

      fetchSpy.mockRestore();
    });
  });
});
