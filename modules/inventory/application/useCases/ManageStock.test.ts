jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('txn-uuid'),
}));

jest.mock('../../../../libs/db', () => ({
  __esModule: true,
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RestockUseCase, RestockCommand, AdjustStockCommand, AdjustStockUseCase, ReserveStockCommand, ReserveStockUseCase } from './ManageStock';
import { InventoryItemNotFoundError} from '../../domain/errors/InventoryErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('RestockUseCase', () => {
  let useCase: RestockUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ inventoryId: 'i1', sku: 'SKU1', quantity: 10, restock: jest.fn() }),
      save: jest.fn().mockImplementation(async (i: unknown) => i),
      recordTransaction: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RestockUseCase(mockRepo as never);
  });

  it('should restock (happy path)', async () => {
    const result = await useCase.execute(new RestockCommand('i1', 50));

    expect(result.inventoryId).toBe('i1');
  });

  it('should throw InventoryItemNotFoundError when item not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new RestockCommand('missing', 10))).rejects.toThrow(InventoryItemNotFoundError);
  });
});

describe('AdjustStockUseCase', () => {
  let useCase: AdjustStockUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ inventoryId: 'i1', sku: 'SKU1', quantity: 10, adjust: jest.fn() }),
      save: jest.fn().mockImplementation(async (i: unknown) => i),
      recordTransaction: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new AdjustStockUseCase(mockRepo as never);
  });

  it('should adjust stock (happy path)', async () => {
    const result = await useCase.execute(new AdjustStockCommand('i1', 20, 'Cycle count'));

    expect(result.inventoryId).toBe('i1');
  });

  it('should throw InventoryItemNotFoundError when item not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new AdjustStockCommand('missing', 20, 'test'))).rejects.toThrow(InventoryItemNotFoundError);
  });
});

describe('ReserveStockUseCase', () => {
  let useCase: ReserveStockUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ inventoryId: 'i1', sku: 'SKU1', quantity: 100, reservedQuantity: 10, reserve: jest.fn() }),
      save: jest.fn().mockImplementation(async (i: unknown) => i),
      createReservation: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ReserveStockUseCase(mockRepo as never);
  });

  it('should reserve stock (happy path)', async () => {
    const result = await useCase.execute(new ReserveStockCommand('i1', 20, 'o1'));

    expect(result.inventoryId).toBe('i1');
    expect(result.quantity).toBe(20);
  });

  it('should throw InventoryItemNotFoundError when item not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ReserveStockCommand('missing', 20))).rejects.toThrow(InventoryItemNotFoundError);
  });
});
