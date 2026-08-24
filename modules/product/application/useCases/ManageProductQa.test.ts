jest.mock('../../infrastructure/repositories/productQaRepo', () => ({
  __esModule: true,
  default: {
    findByProduct: jest.fn().mockResolvedValue([{ qaId: 'q1', productId: 'p1' }]),
    updateStatus: jest.fn().mockResolvedValue({ qaId: 'q1', status: 'answered' }),
  },
}));

import { ManageProductQaUseCase } from './ManageProductQa';
import productQaRepo from '../../infrastructure/repositories/productQaRepo';

const mockRepo = productQaRepo as unknown as Record<string, jest.Mock>;

describe('ManageProductQaUseCase', () => {
  let useCase: ManageProductQaUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageProductQaUseCase();
  });

  it('should find by product', async () => {
    const result = await useCase.findByProduct('p1', 'answered');
    expect(result).toHaveLength(1);
  });

  it('should update status', async () => {
    const result = await useCase.updateStatus('q1', 'answered');
    expect(result).toEqual({ qaId: 'q1', status: 'answered' });
    expect(mockRepo.updateStatus).toHaveBeenCalledWith('q1', 'answered');
  });
});
