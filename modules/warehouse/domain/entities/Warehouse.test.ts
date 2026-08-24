import { Warehouse } from './Warehouse';
import { WarehouseValidationError } from '../errors/WarehouseErrors';

describe('Warehouse', () => {
  const baseProps = {
    warehouseId: 'w1', name: 'Main WH', code: 'WH01', type: 'warehouse' as const,
    organizationId: 'org1', isDefault: false, priority: 1,
    address: { line1: '123 St', city: 'NYC', postalCode: '10001', country: 'USA' },
  };

  it('should create a warehouse (happy path)', () => {
    const wh = Warehouse.create(baseProps);
    expect(wh.warehouseId).toBe('w1');
    expect(wh.isActive).toBe(true);
    expect(wh.autoFulfillment).toBe(false);
    expect(wh.isOrganizationOwned).toBe(true);
    expect(wh.ownerId).toBe('org1');
  });

  it('should set autoFulfillment for fulfillment_center type', () => {
    const wh = Warehouse.create({ ...baseProps, type: 'fulfillment_center' });
    expect(wh.autoFulfillment).toBe(true);
  });

  it('should throw without organizationId', () => {
    expect(() => Warehouse.create({ ...baseProps, organizationId: undefined })).toThrow(WarehouseValidationError);
  });

  it('should activate and deactivate', () => {
    const wh = Warehouse.create(baseProps);
    wh.deactivate();
    expect(wh.isActive).toBe(false);
    wh.activate();
    expect(wh.isActive).toBe(true);
  });

  it('should set as default', () => {
    const wh = Warehouse.create(baseProps);
    wh.setAsDefault();
    expect(wh.isDefault).toBe(true);
  });

  it('should update ownership', () => {
    const wh = Warehouse.create(baseProps);
    wh.updateOwnership({ storeId: 's1' });
    expect(wh.storeId).toBe('s1');
  });

  it('should update ownership with new org', () => {
    const wh = Warehouse.create(baseProps);
    wh.updateOwnership({ organizationId: 'org2', storeId: 's1' });
    expect(wh.organizationId).toBe('org2');
    expect(wh.storeId).toBe('s1');
  });

  it('should update configuration', () => {
    const wh = Warehouse.create(baseProps);
    wh.updateConfiguration({ autoFulfillment: true, capacity: 1000 });
    expect(wh.autoFulfillment).toBe(true);
  });

  it('should serialize to JSON', () => {
    const wh = Warehouse.create(baseProps);
    const json = wh.toJSON();
    expect(json.warehouseId).toBe('w1');
    expect(json.ownerId).toBe('org1');
  });
});
