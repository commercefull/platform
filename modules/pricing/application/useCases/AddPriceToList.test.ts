import { AddPriceToListUseCase, CustomerPriceCreateProps } from './AddPriceToList';
import { PriceListNotFoundError, PricingValidationError } from '../../domain/errors/PricingErrors';
import { PricingAdjustmentType, PricingRuleStatus } from '../../domain/pricingRule';
import type { CustomerPrice, CustomerPriceList } from '../../domain/pricingRule';

type Port = ConstructorParameters<typeof AddPriceToListUseCase>[0];

function createPriceList(id = 'pl1'): CustomerPriceList {
  return {
    id,
    name: 'VIP list',
    customerIds: [],
    customerGroupIds: [],
    priority: 0,
    status: PricingRuleStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createPriceData(overrides: Partial<Omit<CustomerPriceCreateProps, 'priceListId'>> = {}) {
  return {
    productId: 'p1',
    adjustmentType: PricingAdjustmentType.OVERRIDE,
    adjustmentValue: 99.99,
    ...overrides,
  };
}

function createPort(priceList: CustomerPriceList | null = createPriceList()): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    findPriceListById: jest.fn(),
    createPrice: jest.fn(),
  };
  port.findPriceListById.mockResolvedValue(priceList);
  port.createPrice.mockImplementation(data =>
    Promise.resolve({ ...data, id: 'cp1', createdAt: new Date(), updatedAt: new Date() } as CustomerPrice),
  );
  return port;
}

describe('AddPriceToListUseCase', () => {
  it('should create the price scoped to the price list when the list exists', async () => {
    const port = createPort();
    const useCase = new AddPriceToListUseCase(port);

    const result = await useCase.execute('pl1', createPriceData());

    expect(result.id).toBe('cp1');
    expect(port.createPrice).toHaveBeenCalledWith(expect.objectContaining({ priceListId: 'pl1' }));
  });

  it('should throw PriceListNotFoundError when the price list does not exist', async () => {
    const port = createPort(null);
    const useCase = new AddPriceToListUseCase(port);

    await expect(useCase.execute('missing', createPriceData())).rejects.toBeInstanceOf(PriceListNotFoundError);
    expect(port.createPrice).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when required price fields are missing', async () => {
    const port = createPort();
    const useCase = new AddPriceToListUseCase(port);

    await expect(useCase.execute('pl1', createPriceData({ productId: '' }))).rejects.toBeInstanceOf(
      PricingValidationError,
    );
    expect(port.createPrice).not.toHaveBeenCalled();
  });
});
