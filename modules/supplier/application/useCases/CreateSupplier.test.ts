import { createSupplierCreateRepository } from '../../tests/testUtils';
import { CreateSupplierUseCase } from './CreateSupplier';
import { SupplierValidationError } from '../../domain/errors/SupplierErrors';

describe('CreateSupplierUseCase', () => {
  it('should create the supplier when the email is available', async () => {
    const repository = createSupplierCreateRepository();

    const result = await new CreateSupplierUseCase(repository).execute({
      name: 'Acme Supplies',
      email: 'contact@acme.com',
      phone: '+1234567890',
      contactPerson: 'John Doe',
    });

    expect(result.supplierId).toMatch(/^sup_/);
    expect(result.name).toBe('Acme Supplies');
    expect(result.status).toBe('pending');
  });

  it('should throw SupplierValidationError when the email is already taken', async () => {
    const repository = createSupplierCreateRepository();
    repository.findByEmail.mockResolvedValue({
      supplierId: 'existing-sup',
      name: 'Existing',
      status: 'active',
      createdAt: new Date('2026-01-01'),
    });

    await expect(
      new CreateSupplierUseCase(repository).execute({ name: 'New', email: 'contact@acme.com' }),
    ).rejects.toThrow(SupplierValidationError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should apply default terms when payment terms and lead time are not provided', async () => {
    const repository = createSupplierCreateRepository();

    await new CreateSupplierUseCase(repository).execute({ name: 'Test', email: 'test@test.com' });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentTermsDays: 30,
        leadTimeDays: 7,
        dropshipEnabled: false,
        status: 'pending',
        isActive: false,
      }),
    );
  });

  it('should pass custom terms through when payment terms and lead time are provided', async () => {
    const repository = createSupplierCreateRepository();

    await new CreateSupplierUseCase(repository).execute({
      name: 'Test',
      email: 'test@test.com',
      paymentTermsDays: 60,
      leadTimeDays: 14,
      dropshipEnabled: true,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ paymentTermsDays: 60, leadTimeDays: 14, dropshipEnabled: true }),
    );
  });
});
