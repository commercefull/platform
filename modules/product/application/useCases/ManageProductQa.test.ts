
import { ManageProductQaUseCase } from './ManageProductQa';
import { createProductQa, lazyMock } from '../../tests/testUtils';

;

describe('ManageProductQaUseCase', () => {
  let useCase: ManageProductQaUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductQaUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof ManageProductQaUseCase>[0]>();
    mockRepo.findByProduct.mockResolvedValue([createProductQa()]);
    mockRepo.updateStatus.mockResolvedValue(createProductQa({ status: 'answered' }));
    useCase = new ManageProductQaUseCase(mockRepo);
  });

  it('should find by product', async () => {
    const result = await useCase.findByProduct('p1', 'answered');
    expect(result).toHaveLength(1);
  });

  it('should update status', async () => {
    const result = await useCase.updateStatus('q1', 'answered');
    expect(result).toEqual(createProductQa({ status: 'answered' }));
    expect(mockRepo.updateStatus).toHaveBeenCalledWith('q1', 'answered');
  });
});
