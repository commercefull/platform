import { createSupplier, createSupplierRepository } from '../../tests/testUtils';
import { ManageSuppliersAdminUseCase } from './ManageSuppliersAdmin';

describe('ManageSuppliersAdminUseCase', () => {
  it('should list suppliers with the given filters', async () => {
    const repository = createSupplierRepository();

    const result = await new ManageSuppliersAdminUseCase(repository).findAll(true, true);

    expect(result).toHaveLength(1);
    expect(repository.findAll).toHaveBeenCalledWith(true, true);
  });

  it('should list suppliers by status when a status is given', async () => {
    const repository = createSupplierRepository();

    const result = await new ManageSuppliersAdminUseCase(repository).findByStatus('active');

    expect(result).toHaveLength(1);
    expect(repository.findByStatus).toHaveBeenCalledWith('active');
  });

  it('should return statistics when asked', async () => {
    const repository = createSupplierRepository();

    const result = await new ManageSuppliersAdminUseCase(repository).getStatistics();

    expect(result).toEqual({ total: 5, active: 3 });
  });

  it('should return the supplier when looking it up by id', async () => {
    const supplier = createSupplier();
    const repository = createSupplierRepository(supplier);

    const result = await new ManageSuppliersAdminUseCase(repository).findById('sup-1');

    expect(result).toBe(supplier);
    expect(repository.findById).toHaveBeenCalledWith('sup-1');
  });

  it('should create the supplier through the repository', async () => {
    const repository = createSupplierRepository();
    const supplier = createSupplier({ name: 'New Supplier', code: 'NEW' });

    await new ManageSuppliersAdminUseCase(repository).create(supplier);

    expect(repository.create).toHaveBeenCalledWith(supplier);
  });

  it('should approve the supplier when an id is given', async () => {
    const repository = createSupplierRepository();

    await new ManageSuppliersAdminUseCase(repository).approve('sup-1');

    expect(repository.approve).toHaveBeenCalledWith('sup-1');
  });

  it('should delete the supplier when an id is given', async () => {
    const repository = createSupplierRepository();

    const result = await new ManageSuppliersAdminUseCase(repository).delete('sup-1');

    expect(result).toBe(true);
    expect(repository.delete).toHaveBeenCalledWith('sup-1');
  });
});
