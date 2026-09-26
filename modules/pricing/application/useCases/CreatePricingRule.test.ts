import { createPricingRule } from '../../tests/testUtils';
import { CreatePricingRuleUseCase } from './CreatePricingRule';
import { PricingValidationError } from '../../domain/errors/PricingErrors';
import { PricingAdjustmentType, PricingRuleScope, PricingRuleStatus, PricingRuleType } from '../../domain/pricingRule';
import type { PricingRuleCreateProps } from '../../domain/pricingRule';

type Port = ConstructorParameters<typeof CreatePricingRuleUseCase>[0];

function createProps(overrides: Partial<PricingRuleCreateProps> = {}): PricingRuleCreateProps {
  return {
    name: '10% off',
    type: PricingRuleType.DYNAMIC,
    scope: PricingRuleScope.GLOBAL,
    status: PricingRuleStatus.ACTIVE,
    priority: 0,
    conditions: [],
    adjustments: [{ type: PricingAdjustmentType.PERCENTAGE, value: 10 }],
    ...overrides,
  };
}

function createPort(): jest.Mocked<Port> {
  const port: jest.Mocked<Port> = {
    create: jest.fn(),
  };
  port.create.mockImplementation(data => Promise.resolve({ ...createPricingRule(), ...data, id: 'rule1' }));
  return port;
}

describe('CreatePricingRuleUseCase', () => {
  it('should create a pricing rule when required fields are present', async () => {
    const port = createPort();
    const useCase = new CreatePricingRuleUseCase(port);

    const result = await useCase.execute(createProps());

    expect(result.id).toBe('rule1');
    expect(port.create).toHaveBeenCalled();
  });

  it('should throw PricingValidationError when name, type, or scope is missing', async () => {
    const port = createPort();
    const useCase = new CreatePricingRuleUseCase(port);

    await expect(useCase.execute(createProps({ name: '' }))).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.create).not.toHaveBeenCalled();
  });

  it('should throw PricingValidationError when no adjustments are provided', async () => {
    const port = createPort();
    const useCase = new CreatePricingRuleUseCase(port);

    await expect(useCase.execute(createProps({ adjustments: [] }))).rejects.toBeInstanceOf(PricingValidationError);
    expect(port.create).not.toHaveBeenCalled();
  });
});
