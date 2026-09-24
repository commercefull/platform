import { DeleteSegmentUseCase } from './DeleteSegment';
import { SegmentNotFoundError } from '../../domain/errors/SegmentErrors';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';
import { createSegment, lazyMock } from '../../tests/testUtils';

describe('DeleteSegmentUseCase', () => {
  let useCase: DeleteSegmentUseCase;
  let repo: jest.Mocked<SegmentRepository>;

  beforeEach(() => {
    repo = lazyMock<SegmentRepository>();
    repo.findById.mockResolvedValue(createSegment());
    repo.delete.mockResolvedValue(true);
    useCase = new DeleteSegmentUseCase(repo);
  });

  it('should delete the segment when it exists', async () => {
    const result = await useCase.execute('seg-1');

    expect(result).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('seg-1');
  });

  it('should throw SegmentNotFoundError when the segment does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(SegmentNotFoundError);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

