import { createUploadMediaRepository } from '../../tests/testUtils';
import { UploadMediaUseCase, UploadMediaInput } from './UploadMedia';
import { MediaValidationError } from '../../domain/errors/MediaErrors';

const uploadInput = (overrides: Partial<UploadMediaInput> = {}): UploadMediaInput => ({
  fileName: 'photo.jpg',
  mimeType: 'image/jpeg',
  fileSize: 102400,
  filePath: '/uploads/photo.jpg',
  url: 'https://cdn.example.com/photo.jpg',
  ...overrides,
});

describe('UploadMediaUseCase', () => {
  it('should upload the media when the input is valid', async () => {
    const repository = createUploadMediaRepository();

    const result = await new UploadMediaUseCase(repository).execute(uploadInput());

    expect(result.mediaId).toMatch(/^med_/);
    expect(result.fileName).toBe('photo.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.url).toBe('https://cdn.example.com/photo.jpg');
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('should pass optional fields through when provided', async () => {
    const repository = createUploadMediaRepository();

    await new UploadMediaUseCase(repository).execute(
      uploadInput({ altText: 'A photo', caption: 'My caption', folderId: 'folder-1', uploadedBy: 'user-1', tags: ['nature'] }),
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        altText: 'A photo',
        caption: 'My caption',
        folderId: 'folder-1',
        uploadedBy: 'user-1',
        tags: ['nature'],
      }),
    );
  });

  it('should default tags to an empty array when none are provided', async () => {
    const repository = createUploadMediaRepository();

    await new UploadMediaUseCase(repository).execute(uploadInput());

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ tags: [] }));
  });

  it.each([
    ['image', 'image/jpeg'],
    ['video', 'video/mp4'],
    ['audio', 'audio/mpeg'],
    ['document', 'application/pdf'],
    ['file', 'application/octet-stream'],
  ])('should set mediaType to %s when the mime type is %s', async (expected, mimeType) => {
    const repository = createUploadMediaRepository();

    await new UploadMediaUseCase(repository).execute(uploadInput({ mimeType }));

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ mediaType: expected }));
  });

  it.each([
    ['fileName', uploadInput({ fileName: '' })],
    ['mimeType', uploadInput({ mimeType: '' })],
    ['url', uploadInput({ url: '' })],
  ])('should throw MediaValidationError when %s is missing', async (_field, input) => {
    const repository = createUploadMediaRepository();

    await expect(new UploadMediaUseCase(repository).execute(input)).rejects.toThrow(MediaValidationError);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
