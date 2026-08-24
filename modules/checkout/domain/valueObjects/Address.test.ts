import { Address } from './Address';
import { CheckoutValidationError } from '../errors/CheckoutErrors';

describe('Address', () => {
  const validProps = {
    firstName: 'John', lastName: 'Doe', addressLine1: '123 Main St',
    city: 'NYC', postalCode: '10001', country: 'USA',
  };

  it('should create an address (happy path)', () => {
    const addr = Address.create(validProps);
    expect(addr.firstName).toBe('John');
    expect(addr.fullName).toBe('John Doe');
    expect(addr.addressLine1).toBe('123 Main St');
  });

  it('should throw on missing first name', () => {
    expect(() => Address.create({ ...validProps, firstName: '' })).toThrow(CheckoutValidationError);
  });

  it('should throw on missing last name', () => {
    expect(() => Address.create({ ...validProps, lastName: '' })).toThrow(CheckoutValidationError);
  });

  it('should throw on missing address line 1', () => {
    expect(() => Address.create({ ...validProps, addressLine1: '' })).toThrow(CheckoutValidationError);
  });

  it('should throw on missing city', () => {
    expect(() => Address.create({ ...validProps, city: '' })).toThrow(CheckoutValidationError);
  });

  it('should throw on missing postal code', () => {
    expect(() => Address.create({ ...validProps, postalCode: '' })).toThrow(CheckoutValidationError);
  });

  it('should throw on missing country', () => {
    expect(() => Address.create({ ...validProps, country: '' })).toThrow(CheckoutValidationError);
  });

  it('should check equality', () => {
    const a1 = Address.create(validProps);
    const a2 = Address.create(validProps);
    const a3 = Address.create({ ...validProps, city: 'Boston' });
    expect(a1.equals(a2)).toBe(true);
    expect(a1.equals(a3)).toBe(false);
  });

  it('should convert to string', () => {
    const addr = Address.create({ ...validProps, region: 'NY' });
    const str = addr.toString();
    expect(str).toContain('John Doe');
    expect(str).toContain('123 Main St');
    expect(str).toContain('NYC');
  });

  it('should serialize to JSON', () => {
    const addr = Address.create({ ...validProps, company: 'ACME' });
    const json = addr.toJSON();
    expect(json.firstName).toBe('John');
    expect(json.company).toBe('ACME');
  });
});
