import { UpdateSegmentUseCase } from './UpdateSegment';
import { SegmentNotFoundError } from '../../domain/errors/SegmentErrors';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';
import { createSegment, lazyMock } from '../../tests/testUtils';

describe('UpdateSegmentUseCase', () => {
  let useCase: UpdateSegmentUseCase;
  let repo: jest.Mocked<SegmentRepository>;

  beforeEach(() => {
    repo = lazyMock<SegmentRepository>();
    repo.findById.mockResolvedValue(createSegment());
    repo.update.mockImplementation(async s => s);
    useCase = new UpdateSegmentUseCase(repo);
  });

  it('should update the segment when it exists', async () => {
    const result = await useCase.execute('seg-1', { name: 'Renamed' });

    expect(result.name).toBe('Renamed');
    expect(repo.update).toHaveBeenCalled();
  });

  it('should throw SegmentNotFoundError when the segment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', { name: 'X' })).rejects.toThrow(SegmentNotFoundError);
  });
});

