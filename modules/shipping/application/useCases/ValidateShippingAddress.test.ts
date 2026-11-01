import { ValidateShippingAddressUseCase } from './ValidateShippingAddress';

describe('ValidateShippingAddressUseCase', () => {
  let useCase: ValidateShippingAddressUseCase;

  beforeEach(() => {
    useCase = new ValidateShippingAddressUseCase();
  });

  it('should validate a complete address (happy path)', async () => {
    const result = await useCase.execute({
      street1: '123 Main St',
      city: 'NYC',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    });

    expect(result.valid).toBe(true);
    expect(result.messages).toHaveLength(0);
    expect(result.normalizedAddress).toBeDefined();
  });

  it('should return errors for missing fields', async () => {
    const result = await useCase.execute({
      street1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    });

    expect(result.valid).toBe(false);
    expect(result.messages).toContain('Street address is required');
    expect(result.messages).toContain('City is required');
    expect(result.messages).toContain('Country is required');
    expect(result.normalizedAddress).toBeUndefined();
  });

  it('should require state and postal code for a US address', async () => {
    const result = await useCase.execute({
      street1: '123 Main St',
      city: 'NYC',
      country: 'US',
    });

    expect(result.valid).toBe(false);
    expect(result.messages).toContain('State is required for this country');
    expect(result.messages).toContain('Postal code is required for this country');
  });

  it('should reject a malformed US postal code', async () => {
    const result = await useCase.execute({
      street1: '123 Main St',
      city: 'NYC',
      state: 'NY',
      postalCode: 'ABC',
      country: 'US',
    });

    expect(result.valid).toBe(false);
    expect(result.messages.some(m => m.includes('Postal code format is invalid'))).toBe(true);
  });

  it('should validate a UAE address without a postal code', async () => {
    const result = await useCase.execute({
      street1: '1 Sheikh Zayed Rd',
      city: 'Dubai',
      state: 'Dubai',
      country: 'AE',
    });

    expect(result.valid).toBe(true);
    expect(result.normalizedAddress?.country).toBe('AE');
  });

  it('should validate a Belgian address without a state', async () => {
    const result = await useCase.execute({
      street1: '1 Rue de la Loi',
      city: 'Brussels',
      postalCode: '1000',
      country: 'BE',
    });

    expect(result.valid).toBe(true);
  });
});
