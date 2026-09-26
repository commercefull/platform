import { ManageSupplierDirectoryUseCase, type SupplierDirectoryPort } from './ManageSupplierDirectory';
import { SupplierValidationError } from '../../domain/errors/SupplierErrors';

const lazyMock = <T extends object>(): jest.Mocked<T> => {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_t, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
};

describe('ManageSupplierDirectoryUseCase', () => {
  let port: jest.Mocked<SupplierDirectoryPort>;
  let useCase: ManageSupplierDirectoryUseCase;

  beforeEach(() => {
    port = lazyMock<SupplierDirectoryPort>();
    useCase = new ManageSupplierDirectoryUseCase(port);
  });

  describe('createSupplier', () => {
    it('should reject when name or code is missing', async () => {
      await expect(useCase.createSupplier({ code: 'C1' })).rejects.toBeInstanceOf(SupplierValidationError);
      await expect(useCase.createSupplier({ name: 'N' })).rejects.toBeInstanceOf(SupplierValidationError);
      expect(port.createSupplier).not.toHaveBeenCalled();
    });

    it('should apply the USD currency default', async () => {
      port.createSupplier.mockResolvedValue({ supplierId: 's-1' });
      await useCase.createSupplier({ name: 'Acme', code: 'ACME' });
      expect(port.createSupplier).toHaveBeenCalledWith(expect.objectContaining({ currencyCode: 'USD' }));
    });
  });

  describe('createAddress', () => {
    it('should reject when required fields are missing', async () => {
      await expect(useCase.createAddress({ supplierId: 's-1', name: 'HQ' })).rejects.toBeInstanceOf(
        SupplierValidationError,
      );
      expect(port.createSupplierAddress).not.toHaveBeenCalled();
    });

    it('should default addressType to headquarters', async () => {
      port.createSupplierAddress.mockResolvedValue({ supplierAddressId: 'a-1' });
      await useCase.createAddress({
        supplierId: 's-1',
        name: 'HQ',
        addressLine1: '1 Main St',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'US',
      });
      expect(port.createSupplierAddress).toHaveBeenCalledWith(
        expect.objectContaining({ addressType: 'headquarters', isActive: true, isDefault: false }),
      );
    });
  });

  describe('addProduct', () => {
    it('should reject when required fields are missing', async () => {
      await expect(useCase.addProduct({ supplierId: 's-1', productId: 'p-1' })).rejects.toBeInstanceOf(
        SupplierValidationError,
      );
      expect(port.createSupplierProduct).not.toHaveBeenCalled();
    });

    it('should apply product defaults', async () => {
      port.createSupplierProduct.mockResolvedValue({ supplierProductId: 'sp-1' });
      await useCase.addProduct({ supplierId: 's-1', productId: 'p-1', sku: 'SKU-1', unitCostCents: 500 });
      expect(port.createSupplierProduct).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', currencyCode: 'USD', minimumOrderQuantity: 1, isPreferred: false }),
      );
    });
  });
});
