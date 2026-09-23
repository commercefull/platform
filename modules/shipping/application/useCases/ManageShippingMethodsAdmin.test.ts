import {
  createShippingMethodPort,
  createShippingMethod,
} from '../../tests/testUtils';
import { ManageShippingMethodsAdminUseCase } from './ManageShippingMethodsAdmin';

describe('ManageShippingMethodsAdminUseCase', () => {
  let useCase: ManageShippingMethodsAdminUseCase;
  let methodRepo: ReturnType<typeof createShippingMethodPort>;

  beforeEach(() => {
    methodRepo = createShippingMethodPort();
    useCase = new ManageShippingMethodsAdminUseCase(methodRepo);
  });

  it('should list all shipping methods', async () => {
    methodRepo.findAll.mockResolvedValue([createShippingMethod()]);

    const result = await useCase.findAll();

    expect(result).toHaveLength(1);
  });

  it('should find a method by ID', async () => {
    methodRepo.findById.mockResolvedValue(createShippingMethod({ shippingMethodId: 'm1' }));

    const result = await useCase.findById('m1');

    expect(result?.shippingMethodId).toBe('m1');
    expect(methodRepo.findById).toHaveBeenCalledWith('m1');
  });

  it('should return null when the method does not exist', async () => {
    methodRepo.findById.mockResolvedValue(null);

    const result = await useCase.findById('missing');

    expect(result).toBeNull();
  });
});
