jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { UploadMediaUseCase, UploadMediaCommand } from './UploadMedia';
import { MediaFolderNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('UploadMediaUseCase', () => {
  let useCase: UploadMediaUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findFolderById: jest.fn().mockResolvedValue({ folderId: 'f1' }),
      createMedia: jest.fn().mockResolvedValue({
        contentMediaId: 'm1', title: 'Test Image', fileName: 'test.jpg', fileType: 'image/jpeg',
        fileSize: 1024, url: 'https://cdn.test.com/test.jpg', thumbnailUrl: null, width: 800,
        height: 600, altText: 'Test', contentMediaFolderId: 'f1', createdAt: new Date(),
      }),
    };
    useCase = new UploadMediaUseCase(mockRepo as never);
  });

  it('should upload media (happy path)', async () => {
    const result = await useCase.execute(new UploadMediaCommand(
      'Test Image', 'test.jpg', '/uploads/test.jpg', 'image/jpeg', 1024, 'https://cdn.test.com/test.jpg',
    ));

    expect(result.id).toBe('m1');
    expect(result.title).toBe('Test Image');
    expect(eventBus.emit).toHaveBeenCalledWith('content.media.uploaded', expect.objectContaining({ mediaId: 'm1' }));
  });

  it('should throw ContentValidationError when title is empty', async () => {
    await expect(useCase.execute(new UploadMediaCommand(
      '', 'test.jpg', '/path', 'image/jpeg', 1024, 'url',
    ))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when fileName is empty', async () => {
    await expect(useCase.execute(new UploadMediaCommand(
      'Title', '', '/path', 'image/jpeg', 1024, 'url',
    ))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when url is empty', async () => {
    await expect(useCase.execute(new UploadMediaCommand(
      'Title', 'file.jpg', '/path', 'image/jpeg', 1024, '',
    ))).rejects.toThrow(ContentValidationError);
  });

  it('should throw MediaFolderNotFoundError when folder does not exist', async () => {
    mockRepo.findFolderById.mockResolvedValue(null);

    await expect(useCase.execute(new UploadMediaCommand(
      'Title', 'file.jpg', '/path', 'image/jpeg', 1024, 'url', undefined, undefined, undefined, undefined, undefined, undefined, 'missing-folder',
    ))).rejects.toThrow(MediaFolderNotFoundError);
  });
});
