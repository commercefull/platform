import {
  createShippingMethodPort,
  createShippingMethod,
} from '../../tests/testUtils';
import { ManageShippingMethodsUseCase } from './ManageShippingMethods';

describe('ManageShippingMethodsUseCase', () => {
  let useCase: ManageShippingMethodsUseCase;
  let methodRepo: ReturnType<typeof createShippingMethodPort>;

  beforeEach(() => {
    methodRepo = createShippingMethodPort();
    useCase = new ManageShippingMethodsUseCase(methodRepo);
  });

  it('should find a method by ID', async () => {
    methodRepo.findById.mockResolvedValue(createShippingMethod({ shippingMethodId: 'm1', name: 'Ground' }));

    const result = await useCase.findById('m1');

    expect(result?.name).toBe('Ground');
  });

  it('should list all methods', async () => {
    methodRepo.findAll.mockResolvedValue([createShippingMethod()]);

    const result = await useCase.findAll();

    expect(result).toHaveLength(1);
  });

  it('should create a method', async () => {
    methodRepo.create.mockImplementation(async input => createShippingMethod({ ...input, shippingMethodId: 'm2' }));
    const { shippingMethodId: _m, createdAt: _c2, updatedAt: _u2, ...input } = createShippingMethod({ name: 'Express', code: 'EXP' });

    const result = await useCase.create(input);

    expect(result.shippingMethodId).toBe('m2');
    expect(methodRepo.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'EXP' }));
  });

  it('should deactivate a method', async () => {
    methodRepo.deactivate.mockResolvedValue(createShippingMethod({ isActive: false }));

    const result = await useCase.deactivate('m1');

    expect(result?.isActive).toBe(false);
  });
});
