import { CreateSegmentUseCase } from './CreateSegment';
import { SegmentAlreadyExistsError, InvalidSegmentConditionsError } from '../../domain/errors/SegmentErrors';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';
import { createSegment, lazyMock } from '../../tests/testUtils';

describe('CreateSegmentUseCase', () => {
  let useCase: CreateSegmentUseCase;
  let repo: jest.Mocked<SegmentRepository>;

  beforeEach(() => {
    repo = lazyMock<SegmentRepository>();
    repo.findByCode.mockResolvedValue(null);
    repo.create.mockImplementation(async s => s);
    useCase = new CreateSegmentUseCase(repo);
  });

  it('should create a segment when code is unique and conditions are provided', async () => {
    const result = await useCase.execute({ name: 'VIP', code: 'vip', conditions: [{ field: 'lifetimeValue', operator: 'gte', value: 100 }] });

    expect(result.name).toBe('VIP');
    expect(result.isActive).toBe(true);
    expect(repo.create).toHaveBeenCalled();
  });

  it('should throw InvalidSegmentConditionsError when conditions are empty', async () => {
    await expect(useCase.execute({ name: 'X', code: 'x', conditions: [] })).rejects.toThrow(InvalidSegmentConditionsError);
  });

  it('should throw SegmentAlreadyExistsError when code is taken', async () => {
    repo.findByCode.mockResolvedValue(createSegment());

    await expect(
      useCase.execute({ name: 'VIP', code: 'vip', conditions: [{ field: 'status', operator: 'eq', value: 'x' }] }),
    ).rejects.toThrow(SegmentAlreadyExistsError);
  });
});

