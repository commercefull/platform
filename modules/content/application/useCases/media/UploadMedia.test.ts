import { lazyMock, createContentMedia, createContentMediaFolder, emitMock } from '../../../tests/testUtils';
import { UploadMediaUseCase, UploadMediaCommand } from './UploadMedia';
import { MediaFolderNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('UploadMediaUseCase', () => {
  let useCase: UploadMediaUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UploadMediaUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof UploadMediaUseCase>[0]>();
    mockRepo.findFolderById.mockResolvedValue(createContentMediaFolder({ contentMediaFolderId: 'f1' }));
    mockRepo.createMedia.mockResolvedValue(
      createContentMedia({ contentMediaId: 'm1', title: 'Test Image', fileName: 'test.jpg', fileType: 'image/jpeg', width: 800, height: 600, altText: 'Test', contentMediaFolderId: 'f1' }),
    );
    useCase = new UploadMediaUseCase(mockRepo);
  });

  it('should upload media (happy path)', async () => {
    const result = await useCase.execute(
      new UploadMediaCommand('Test Image', 'test.jpg', '/uploads/test.jpg', 'image/jpeg', 1024, 'https://cdn.test.com/test.jpg'),
    );

    expect(result.id).toBe('m1');
    expect(result.title).toBe('Test Image');
    expect(emitMock).toHaveBeenCalledWith('content.media.uploaded', expect.objectContaining({ mediaId: 'm1' }));
  });

  it('should throw ContentValidationError when title is empty', async () => {
    await expect(useCase.execute(new UploadMediaCommand('', 'test.jpg', '/path', 'image/jpeg', 1024, 'url'))).rejects.toThrow(
      ContentValidationError,
    );
  });

  it('should throw ContentValidationError when fileName is empty', async () => {
    await expect(useCase.execute(new UploadMediaCommand('Title', '', '/path', 'image/jpeg', 1024, 'url'))).rejects.toThrow(
      ContentValidationError,
    );
  });

  it('should throw ContentValidationError when url is empty', async () => {
    await expect(useCase.execute(new UploadMediaCommand('Title', 'file.jpg', '/path', 'image/jpeg', 1024, ''))).rejects.toThrow(
      ContentValidationError,
    );
  });

  it('should throw MediaFolderNotFoundError when folder does not exist', async () => {
    mockRepo.findFolderById.mockResolvedValue(null);

    await expect(
      useCase.execute(
        new UploadMediaCommand(
          'Title',
          'file.jpg',
          '/path',
          'image/jpeg',
          1024,
          'url',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'missing-folder',
        ),
      ),
    ).rejects.toThrow(MediaFolderNotFoundError);
  });
});
