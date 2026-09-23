import { GetSegmentUseCase } from './GetSegment';
import { SegmentNotFoundError } from '../../domain/errors/SegmentErrors';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';
import { createSegment, lazyMock } from '../../tests/testUtils';

describe('GetSegmentUseCase', () => {
  let useCase: GetSegmentUseCase;
  let repo: jest.Mocked<SegmentRepository>;

  beforeEach(() => {
    repo = lazyMock<SegmentRepository>();
    repo.findById.mockResolvedValue(createSegment());
    useCase = new GetSegmentUseCase(repo);
  });

  it('should return the segment when it exists', async () => {
    const result = await useCase.execute('seg-1');

    expect(result.name).toBe('VIP');
  });

  it('should throw SegmentNotFoundError when the segment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(SegmentNotFoundError);
  });
});

