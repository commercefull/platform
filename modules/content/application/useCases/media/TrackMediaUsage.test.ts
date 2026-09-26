/**
 * Unit Tests for TrackMediaUsage Use Case
 */

import { lazyMock, emitMock } from '../../../tests/testUtils';
import { TrackMediaUsageUseCase, TrackMediaUsageCommand } from './TrackMediaUsage';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('TrackMediaUsageUseCase', () => {
  let useCase: TrackMediaUsageUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof TrackMediaUsageUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof TrackMediaUsageUseCase>[0]>();
    useCase = new TrackMediaUsageUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should record the usage and emit the tracked event', async () => {
    mockRepo.createUsage.mockResolvedValue({
      contentMediaUsageId: 'usage-1',
      mediaId: 'media-1',
      entityType: 'contentPage',
      entityId: 'page-1',
    });

    const result = await useCase.execute(new TrackMediaUsageCommand('media-1', 'contentPage', 'page-1', 'featuredImage'));

    expect(result.contentMediaUsageId).toBe('usage-1');
    expect(mockRepo.createUsage).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: 'media-1', entityType: 'contentPage', entityId: 'page-1', field: 'featuredImage' }),
    );
    expect(emitMock).toHaveBeenCalledWith('content.media.usage_tracked', {
      mediaId: 'media-1',
      entityType: 'contentPage',
      entityId: 'page-1',
    });
  });

  it('should throw ContentValidationError when required fields are missing', async () => {
    await expect(useCase.execute(new TrackMediaUsageCommand('', 'contentPage', 'page-1'))).rejects.toThrow(
      ContentValidationError,
    );
    expect(mockRepo.createUsage).not.toHaveBeenCalled();
  });
});
