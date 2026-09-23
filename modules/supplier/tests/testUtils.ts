/**
 * Shared test utilities for supplier unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (event bus) before the use cases under test are evaluated.
 * Use real Supplier entities; only the ports are mocked.
 */

import { Supplier, SupplierProps } from '../domain/entities/Supplier';
import { eventBus } from '../../../libs/events/eventBus';
import type { SupplierRepository } from '../domain/repositories/SupplierRepository';
import type { CreateSupplierUseCase } from '../application/useCases/CreateSupplier';
import type { CreatePurchaseOrderUseCase } from '../application/useCases/CreatePurchaseOrder';
import type { ReceiveGoodsUseCase } from '../application/useCases/ReceiveGoods';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

export function createSupplier(overrides: Partial<SupplierProps> = {}): Supplier {
  return Supplier.reconstitute({
    supplierId: 'sup-1',
    name: 'Acme Supplies',
    code: 'ACME',
    email: 'contact@acme.com',
    status: 'approved',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

type CreateSupplierRepoPort = ConstructorParameters<typeof CreateSupplierUseCase>[0];
type PoSupplierRepoPort = ConstructorParameters<typeof CreatePurchaseOrderUseCase>[0];
type PurchaseOrderCreatePort = ConstructorParameters<typeof CreatePurchaseOrderUseCase>[1];
type PurchaseOrderRepoPort = ConstructorParameters<typeof ReceiveGoodsUseCase>[0];
type ReceivingRepoPort = ConstructorParameters<typeof ReceiveGoodsUseCase>[1];
type InventoryRepoPort = ConstructorParameters<typeof ReceiveGoodsUseCase>[2];

export function createSupplierCreateRepository(): jest.Mocked<CreateSupplierRepoPort> {
  const repository: jest.Mocked<CreateSupplierRepoPort> = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  repository.findByEmail.mockResolvedValue(null);
  repository.create.mockImplementation(data =>
    Promise.resolve({
      supplierId: String(data.supplierId),
      name: String(data.name),
      status: String(data.status),
      createdAt: new Date('2026-01-01'),
    }),
  );
  return repository;
}

export function createPoSupplierRepository(supplier: { status: string; isActive: boolean; minimumOrderValue?: number; leadTimeDays?: number } | null = { status: 'approved', isActive: true }): jest.Mocked<PoSupplierRepoPort> {
  const repository: jest.Mocked<PoSupplierRepoPort> = {
    findById: jest.fn(),
  };
  repository.findById.mockResolvedValue(supplier);
  return repository;
}

export function createPurchaseOrderCreateRepository(): jest.Mocked<PurchaseOrderCreatePort> {
  const repository: jest.Mocked<PurchaseOrderCreatePort> = {
    create: jest.fn(),
  };
  repository.create.mockImplementation(data =>
    Promise.resolve({
      purchaseOrderId: String(data.purchaseOrderId),
      poNumber: String(data.poNumber),
      supplierId: String(data.supplierId),
      totalAmount: Number(data.totalAmount),
      status: String(data.status),
      createdAt: new Date('2026-01-01'),
    }),
  );
  return repository;
}

export function createPurchaseOrderRepository(purchaseOrder: { status: string; items: { quantity: number }[] } | null = { status: 'submitted', items: [{ quantity: 10 }] }): jest.Mocked<PurchaseOrderRepoPort> {
  const repository: jest.Mocked<PurchaseOrderRepoPort> = {
    findById: jest.fn(),
    update: jest.fn(),
  };
  repository.findById.mockResolvedValue(purchaseOrder);
  repository.update.mockResolvedValue(undefined);
  return repository;
}

export function createReceivingRepository(): jest.Mocked<ReceivingRepoPort> {
  return { create: jest.fn().mockResolvedValue(undefined) };
}

export function createInventoryRepository(): jest.Mocked<InventoryRepoPort> {
  return { adjustStock: jest.fn().mockResolvedValue(undefined) };
}

export function createSupplierRepository(supplier: Supplier | null = createSupplier()): jest.Mocked<SupplierRepository> {
  const repository: jest.Mocked<SupplierRepository> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    findByStatus: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    setVisibility: jest.fn(),
    approve: jest.fn(),
    suspend: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    getStatistics: jest.fn(),
    findAddressById: jest.fn(),
    findAddressesBySupplierId: jest.fn(),
    createAddress: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    findProductById: jest.fn(),
    findProductsBySupplierId: jest.fn(),
    findProductsByProductId: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  };
  repository.findById.mockResolvedValue(supplier);
  repository.findByCode.mockResolvedValue(supplier);
  repository.findAll.mockResolvedValue(supplier ? [supplier] : []);
  repository.findByStatus.mockResolvedValue(supplier ? [supplier] : []);
  repository.create.mockResolvedValue(supplier ?? createSupplier());
  repository.update.mockResolvedValue(supplier);
  repository.delete.mockResolvedValue(true);
  repository.updateStatus.mockResolvedValue(supplier);
  repository.setVisibility.mockResolvedValue(supplier);
  repository.approve.mockResolvedValue(supplier);
  repository.suspend.mockResolvedValue(supplier);
  repository.activate.mockResolvedValue(supplier);
  repository.deactivate.mockResolvedValue(supplier);
  repository.getStatistics.mockResolvedValue({ total: 5, active: 3 });
  repository.findAddressById.mockResolvedValue(null);
  repository.findAddressesBySupplierId.mockResolvedValue([]);
  repository.deleteAddress.mockResolvedValue(true);
  repository.findProductById.mockResolvedValue(null);
  repository.findProductsBySupplierId.mockResolvedValue([]);
  repository.findProductsByProductId.mockResolvedValue([]);
  repository.updateProduct.mockResolvedValue(null);
  repository.deleteProduct.mockResolvedValue(true);
  return repository;
}
