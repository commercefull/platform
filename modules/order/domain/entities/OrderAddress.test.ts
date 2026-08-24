import { OrderAddress } from './OrderAddress';

describe('OrderAddress', () => {
  const baseProps = {
    orderAddressId: 'a1', orderId: 'o1', addressType: 'shipping' as const,
    firstName: 'John', lastName: 'Doe', address1: '123 Main St',
    city: 'NYC', state: 'NY', postalCode: '10001', country: 'USA', countryCode: 'US',
  };

  it('should create an address (happy path)', () => {
    const addr = OrderAddress.create(baseProps);
    expect(addr.orderAddressId).toBe('a1');
    expect(addr.firstName).toBe('John');
    expect(addr.isShipping).toBe(true);
    expect(addr.isBilling).toBe(false);
  });

  it('should compute full name', () => {
    const addr = OrderAddress.create(baseProps);
    expect(addr.fullName).toBe('John Doe');
  });

  it('should compute full address', () => {
    const addr = OrderAddress.create({ ...baseProps, address2: 'Apt 4' });
    expect(addr.fullAddress).toContain('123 Main St');
    expect(addr.fullAddress).toContain('Apt 4');
    expect(addr.fullAddress).toContain('NYC');
  });

  it('should detect billing type', () => {
    const addr = OrderAddress.create({ ...baseProps, addressType: 'billing' });
    expect(addr.isBilling).toBe(true);
    expect(addr.isShipping).toBe(false);
  });

  it('should update fields', () => {
    const addr = OrderAddress.create(baseProps);
    addr.update({ firstName: 'Jane', city: 'Boston' });
    expect(addr.firstName).toBe('Jane');
    expect(addr.city).toBe('Boston');
  });

  it('should serialize to JSON', () => {
    const addr = OrderAddress.create(baseProps);
    const json = addr.toJSON();
    expect(json.orderAddressId).toBe('a1');
    expect(json.fullName).toBe('John Doe');
  });
});
