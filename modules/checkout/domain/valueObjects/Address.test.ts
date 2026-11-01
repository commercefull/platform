import { Address } from './Address';
import { CheckoutValidationError } from '../errors/CheckoutErrors';

describe('Address', () => {
  const validProps = {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    city: 'NYC',
    region: 'NY',
    postalCode: '10001',
    country: 'US',
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

  it('should throw on missing postal code for a country that requires one', () => {
    expect(() => Address.create({ ...validProps, postalCode: '' })).toThrow(CheckoutValidationError);
    expect(() => Address.create({ ...validProps, postalCode: undefined })).toThrow(CheckoutValidationError);
  });

  it('should throw on missing region for a country that requires one', () => {
    expect(() => Address.create({ ...validProps, region: undefined })).toThrow(CheckoutValidationError);
  });

  it('should accept a postal-code-free address for a country without postal codes', () => {
    const ae = Address.create({
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '1 Sheikh Zayed Rd',
      city: 'Dubai',
      region: 'Dubai',
      country: 'AE',
    });
    expect(ae.postalCode).toBeUndefined();
  });

  it('should accept a region-free address for a country without states', () => {
    const be = Address.create({
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '1 Rue de la Loi',
      city: 'Brussels',
      postalCode: '1000',
      country: 'BE',
    });
    expect(be.region).toBeUndefined();
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
