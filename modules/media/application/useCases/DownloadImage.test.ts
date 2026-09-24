import { createProcessImageUseCase, mockFetchResponse } from '../../tests/testUtils';
import { DownloadImageUseCase } from './DownloadImage';
import { InvalidImageUrlError, MediaDownloadError } from '../../domain/errors/MediaErrors';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('DownloadImageUseCase', () => {
  it('should reject when the url is empty', async () => {
    await expect(new DownloadImageUseCase(createProcessImageUseCase()).execute({ url: '' })).rejects.toThrow(
      InvalidImageUrlError,
    );
  });

  it('should reject when the url is not http', async () => {
    await expect(
      new DownloadImageUseCase(createProcessImageUseCase()).execute({ url: 'ftp://example.com/image.png' }),
    ).rejects.toThrow(InvalidImageUrlError);
  });

  it('should reject when the url is malformed', async () => {
    await expect(new DownloadImageUseCase(createProcessImageUseCase()).execute({ url: 'not-a-url' })).rejects.toThrow(
      InvalidImageUrlError,
    );
  });

  it('should delegate to ProcessImageUseCase when the fetch succeeds', async () => {
    const processImageUseCase = createProcessImageUseCase();
    const fetchSpy = mockFetchResponse({ contentType: 'image/png', body: new ArrayBuffer(4) });

    const result = await new DownloadImageUseCase(processImageUseCase).execute({
      url: 'https://example.com/product.png',
      altText: 'Product photo',
    });

    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/product.png', expect.objectContaining({ redirect: 'follow' }));
    expect(processImageUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({ mimetype: 'image/png', originalname: 'product.png', size: 4 }),
        altText: 'Product photo',
        metadata: expect.objectContaining({ sourceUrl: 'https://example.com/product.png' }),
      }),
    );
    expect(result.urls.original).toContain('cdn.example.com');
  });

  it('should reject when the content type is not an image', async () => {
    mockFetchResponse({ contentType: 'text/html' });

    await expect(
      new DownloadImageUseCase(createProcessImageUseCase()).execute({ url: 'https://example.com/page.html' }),
    ).rejects.toThrow(InvalidImageUrlError);
  });

  it('should reject when the fetch returns a non-OK status', async () => {
    mockFetchResponse({ status: 404 });

    await expect(
      new DownloadImageUseCase(createProcessImageUseCase()).execute({ url: 'https://example.com/missing.png' }),
    ).rejects.toThrow(MediaDownloadError);
  });

  it('should reject when the fetch throws a network error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    await expect(
      new DownloadImageUseCase(createProcessImageUseCase()).execute({ url: 'https://example.com/image.png' }),
    ).rejects.toThrow(MediaDownloadError);
  });

  it('should reject when the image exceeds the maximum download size', async () => {
    mockFetchResponse({ body: new ArrayBuffer(11 * 1024 * 1024) });

    await expect(
      new DownloadImageUseCase(createProcessImageUseCase()).execute({ url: 'https://example.com/huge.png' }),
    ).rejects.toThrow(MediaDownloadError);
  });

  it('should extract the filename from the url path when delegating', async () => {
    const processImageUseCase = createProcessImageUseCase();
    mockFetchResponse({ contentType: 'image/jpeg' });

    await new DownloadImageUseCase(processImageUseCase).execute({
      url: 'https://cdn.example.com/images/2024/photo.jpg?w=800',
    });

    expect(processImageUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ file: expect.objectContaining({ originalname: 'photo.jpg' }) }),
    );
  });

  it('should pass options, tags, and metadata through when provided', async () => {
    const processImageUseCase = createProcessImageUseCase();
    mockFetchResponse({ contentType: 'image/webp' });

    await new DownloadImageUseCase(processImageUseCase).execute({
      url: 'https://example.com/img.webp',
      metadata: { productId: 'prod-123' },
      tags: ['product', 'hero'],
    });

    const command = processImageUseCase.execute.mock.calls[0][0];
    expect(command.metadata).toEqual(
      expect.objectContaining({ productId: 'prod-123', sourceUrl: 'https://example.com/img.webp' }),
    );
    expect(command.tags).toEqual(['product', 'hero']);
  });
});
