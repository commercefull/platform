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
      street1: '', city: '', state: '', postalCode: '', country: '',
    });

    expect(result.valid).toBe(false);
    expect(result.messages).toContain('Street address is required');
    expect(result.messages).toContain('City is required');
    expect(result.messages).toContain('State/Province is required');
    expect(result.messages).toContain('Postal code is required');
    expect(result.messages).toContain('Country is required');
    expect(result.normalizedAddress).toBeUndefined();
  });
});
