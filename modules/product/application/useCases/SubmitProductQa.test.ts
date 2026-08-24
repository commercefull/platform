jest.mock('../../infrastructure/repositories/productRepo', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockResolvedValue({ productId: 'p1', name: 'Widget' }),
  },
}));

jest.mock('../../infrastructure/repositories/productQaRepo', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({
      productQaId: 'q1', productId: 'p1', question: 'Is this durable?', status: 'pending',
      customerId: 'c1', askerName: 'John', askerEmail: 'john@test.com', createdAt: new Date(),
    }),
  },
}));

import { SubmitProductQaUseCase, SubmitProductQaCommand } from './SubmitProductQa';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';
import productRepo from '../../infrastructure/repositories/productRepo';

const mockProductRepo = productRepo as unknown as Record<string, jest.Mock>;

describe('SubmitProductQaUseCase', () => {
  let useCase: SubmitProductQaUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SubmitProductQaUseCase();
  });

  it('should submit Q&A (happy path)', async () => {
    const result = await useCase.execute(new SubmitProductQaCommand(
      'p1', 'Is this durable?', 'c1', 'John', 'john@test.com',
    ));

    expect(result.productQaId).toBe('q1');
    expect(result.status).toBe('pending');
  });

  it('should throw ProductValidationError when productId is empty', async () => {
    await expect(useCase.execute(new SubmitProductQaCommand('', 'Question'))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductValidationError when question is empty', async () => {
    await expect(useCase.execute(new SubmitProductQaCommand('p1', ''))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    mockProductRepo.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(new SubmitProductQaCommand('p999', 'Question'))).rejects.toThrow(ProductNotFoundError);
  });
});
