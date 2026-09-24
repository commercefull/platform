import { ListSegmentsUseCase } from './ListSegments';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';
import { createSegment, lazyMock } from '../../tests/testUtils';

describe('ListSegmentsUseCase', () => {
  let useCase: ListSegmentsUseCase;
  let repo: jest.Mocked<SegmentRepository>;

  beforeEach(() => {
    repo = lazyMock<SegmentRepository>();
    repo.findAll.mockResolvedValue([createSegment()]);
    useCase = new ListSegmentsUseCase(repo);
  });

  it('should list all segments', async () => {
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
  });

  it('should pass the activeOnly flag to the repository', async () => {
    await useCase.execute(true);

    expect(repo.findAll).toHaveBeenCalledWith(true);
  });
});
