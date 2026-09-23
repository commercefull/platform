

import { SubmitProductQaUseCase, SubmitProductQaCommand } from './SubmitProductQa';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';
import { createProductLookup, createProductQa, lazyMock } from '../../tests/testUtils';

;

describe('SubmitProductQaUseCase', () => {
  let useCase: SubmitProductQaUseCase;
  let mockRepo1: jest.Mocked<ConstructorParameters<typeof SubmitProductQaUseCase>[0]>;
  let mockRepo2: jest.Mocked<ConstructorParameters<typeof SubmitProductQaUseCase>[1]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo1 = lazyMock<ConstructorParameters<typeof SubmitProductQaUseCase>[0]>();
    mockRepo1.findById.mockResolvedValue(createProductLookup());
    mockRepo2 = lazyMock<ConstructorParameters<typeof SubmitProductQaUseCase>[1]>();
    mockRepo2.create.mockResolvedValue(
      createProductQa({ question: 'Is this durable?', customerId: 'c1', askerName: 'John', askerEmail: 'john@test.com' }),
    );
    useCase = new SubmitProductQaUseCase(mockRepo1, mockRepo2);
  });

  it('should submit Q&A (happy path)', async () => {
    const result = await useCase.execute(new SubmitProductQaCommand('p1', 'Is this durable?', 'c1', 'John', 'john@test.com'));

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
    mockRepo1.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(new SubmitProductQaCommand('p999', 'Question'))).rejects.toThrow(ProductNotFoundError);
  });
});
