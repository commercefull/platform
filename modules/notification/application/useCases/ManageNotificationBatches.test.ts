import { createNotificationBatch, createNotificationBatchRepository } from '../../tests/testUtils';
import { ManageNotificationBatchesUseCase } from './ManageNotificationBatches';

describe('ManageNotificationBatchesUseCase', () => {
  let useCase: ManageNotificationBatchesUseCase;
  let batchRepo: ReturnType<typeof createNotificationBatchRepository>;

  beforeEach(() => {
    batchRepo = createNotificationBatchRepository();
    useCase = new ManageNotificationBatchesUseCase(batchRepo);
  });

  it('should return all batches with pagination args', async () => {
    const batches = [createNotificationBatch()];
    batchRepo.findAll.mockResolvedValue(batches);

    const result = await useCase.findAll(10, 20);

    expect(result).toEqual(batches);
    expect(batchRepo.findAll).toHaveBeenCalledWith(10, 20);
  });

  it('should return a batch by id', async () => {
    const batch = createNotificationBatch({ notificationBatchId: 'b-9' });
    batchRepo.findById.mockResolvedValue(batch);

    const result = await useCase.findById('b-9');

    expect(result).toEqual(batch);
    expect(batchRepo.findById).toHaveBeenCalledWith('b-9');
  });

  it('should return null when the batch does not exist', async () => {
    batchRepo.findById.mockResolvedValue(null);

    const result = await useCase.findById('missing');

    expect(result).toBeNull();
  });

  it('should return the total batch count', async () => {
    batchRepo.count.mockResolvedValue(7);

    expect(await useCase.count()).toBe(7);
  });
});
