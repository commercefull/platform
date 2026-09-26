/**
 * Unit Tests for DeleteMedia Use Case
 */

import { lazyMock, createContentMedia, emitMock } from '../../../tests/testUtils';
import { DeleteMediaUseCase } from './DeleteMedia';
import { MediaAssetNotFoundError } from '../../../domain/errors/ContentErrors';

describe('DeleteMediaUseCase', () => {
  let useCase: DeleteMediaUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof DeleteMediaUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof DeleteMediaUseCase>[0]>();
    useCase = new DeleteMediaUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should delete the media and emit the deleted event', async () => {
    mockRepo.findMediaById.mockResolvedValue(createContentMedia({ contentMediaId: 'media-1', fileName: 'pic.jpg' }));
    mockRepo.deleteMedia.mockResolvedValue(true);

    await useCase.execute('media-1');

    expect(mockRepo.deleteMedia).toHaveBeenCalledWith('media-1');
    expect(emitMock).toHaveBeenCalledWith('content.media.deleted', { mediaId: 'media-1', fileName: 'pic.jpg' });
  });

  it('should throw MediaAssetNotFoundError when the media does not exist', async () => {
    mockRepo.findMediaById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(MediaAssetNotFoundError);
    expect(mockRepo.deleteMedia).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
