import { CreateSupplierUseCase } from './CreateSupplier';
import { SupplierValidationError } from '../../domain/errors/SupplierErrors';

describe('CreateSupplierUseCase', () => {
  let useCase: CreateSupplierUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        supplierId: 'sup-1', name: 'Acme Supplies', status: 'pending', createdAt: new Date(),
      }),
    };
    useCase = new CreateSupplierUseCase(mockRepo as never);
  });

  it('should create a supplier successfully (happy path)', async () => {
    const result = await useCase.execute({ name: 'Acme Supplies', email: 'contact@acme.com', phone: '+1234567890', contactPerson: 'John Doe' });

    expect(result.supplierId).toBe('sup-1');
    expect(result.name).toBe('Acme Supplies');
    expect(result.status).toBe('pending');
  });

  it('should throw SupplierValidationError when email already exists', async () => {
    mockRepo.findByEmail.mockResolvedValue({ supplierId: 'existing-sup' });

    await expect(useCase.execute({ name: 'New', email: 'contact@acme.com' })).rejects.toThrow(SupplierValidationError);
  });

  it('should set default payment terms and lead time', async () => {
    await useCase.execute({ name: 'Test', email: 'test@test.com' });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      paymentTermsDays: 30, leadTimeDays: 7, dropshipEnabled: false, status: 'pending', isActive: false,
    }));
  });

  it('should pass custom payment terms and lead time', async () => {
    await useCase.execute({ name: 'Test', email: 'test@test.com', paymentTermsDays: 60, leadTimeDays: 14, dropshipEnabled: true });

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      paymentTermsDays: 60, leadTimeDays: 14, dropshipEnabled: true,
    }));
  });
});
