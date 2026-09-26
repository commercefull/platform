import { CreateTierPriceUseCase, TierPriceCreateProps } from './CreateTierPrice';
import { PricingValidationError } from '../../domain/errors/PricingErrors';
import type { TierPrice } from '../../domain/pricingRule';

type Port = ConstructorParameters<typeof CreateTierPriceUseCase>[0];

function createProps(overrides: Partial<TierPriceCreateProps> = {}): TierPriceCreateProps {
  return {
    productId: 'p1',
    quantityMin: 10,
    priceCents: 9000,
    ...overrides,
  };
}

function createPort(): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    create: jest.fn(),
  };
  port.create.mockImplementation(data =>
    Promise.resolve({ ...data, id: 'tp1', createdAt: new Date(), updatedAt: new Date() } as TierPrice),
  );
  return port;
}

describe('CreateTierPriceUseCase', () => {
  it('should create a tier price when required fields are present', async () => {
    const port = createPort();
    const useCase = new CreateTierPriceUseCase(port);

    const result = await useCase.execute(createProps());

    expect(result.id).toBe('tp1');
    expect(port.create).toHaveBeenCalledWith(createProps());
  });

  it('should throw PricingValidationError when productId is missing', async () => {
    const port = createPort();
    const useCase = new CreateTierPriceUseCase(port);

    await expect(useCase.execute(createProps({ productId: '' }))).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.create).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when priceCents is missing', async () => {
    const port = createPort();
    const useCase = new CreateTierPriceUseCase(port);

    await expect(useCase.execute(createProps({ priceCents: undefined as unknown as number }))).rejects.toBeInstanceOf(
      PricingValidationError,
    );
    expect(port.create).not.toHaveBeenCalled();
  });
});
