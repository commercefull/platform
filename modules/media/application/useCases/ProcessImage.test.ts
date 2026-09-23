import { createMediaRepository, createImageProcessingService, createStorageService } from '../../tests/testUtils';
import { ProcessImageUseCase } from './ProcessImage';

const jpegFile = { buffer: Buffer.from('raw-image'), originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 2048 };

describe('ProcessImageUseCase', () => {
  it('should process and persist the media when a file is provided', async () => {
    const mediaRepository = createMediaRepository();
    const storageService = createStorageService();

    const result = await new ProcessImageUseCase(
      mediaRepository,
      createImageProcessingService(),
      storageService,
    ).execute({ file: jpegFile, altText: 'Test photo' });

    expect(result.media.mediaId).toBe('test-uuid');
    expect(result.urls.original).toBe('https://cdn.example.com/media/test-uuid/original.jpg');
    expect(mediaRepository.save).toHaveBeenCalledWith(result.media);
  });

  it('should upload the webp and thumbnail variants when processing generates them', async () => {
    const storageService = createStorageService();

    const result = await new ProcessImageUseCase(
      createMediaRepository(),
      createImageProcessingService(),
      storageService,
    ).execute({ file: jpegFile });

    // original + webp + thumbnail
    expect(storageService.upload).toHaveBeenCalledTimes(3);
    expect(result.urls.webp).toBe('https://cdn.example.com/media/test-uuid/image.webp');
    expect(result.urls.thumbnail).toBe('https://cdn.example.com/media/test-uuid/thumbnail.webp');
  });

  it('should upload responsive sizes when they match the requested options', async () => {
    const storageService = createStorageService();
    const imageProcessingService = createImageProcessingService({
      original: { buffer: Buffer.from('img'), format: 'jpeg', size: 1024 },
      responsiveSizes: [{ buffer: Buffer.from('r640'), width: 640, suffix: '_md', size: 256 }],
    });

    const result = await new ProcessImageUseCase(createMediaRepository(), imageProcessingService, storageService).execute({
      file: jpegFile,
      options: { responsiveSizes: [{ width: 640, suffix: '_md' }] },
    });

    expect(result.urls.responsive).toEqual({ _md: 'https://cdn.example.com/media/test-uuid/image_md.webp' });
  });

  it('should skip the thumbnail upload when thumbnail generation is disabled', async () => {
    const storageService = createStorageService();
    const imageProcessingService = createImageProcessingService({
      original: { buffer: Buffer.from('img'), format: 'jpeg', size: 1024 },
      thumbnail: { buffer: Buffer.from('thumb'), format: 'webp', size: 128 },
    });

    const result = await new ProcessImageUseCase(createMediaRepository(), imageProcessingService, storageService).execute({
      file: jpegFile,
      options: { generateThumbnail: false },
    });

    expect(result.urls.thumbnail).toBeUndefined();
    expect(storageService.upload).toHaveBeenCalledTimes(1);
  });
});
