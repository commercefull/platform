/**
 * ValidateCheckoutStep Use Case Tests
 */

import { ValidateCheckoutStepUseCase, ValidateCheckoutStepCommand } from './CheckoutConfig';
import { CheckoutConfigRepository } from '../../domain/repositories/CheckoutConfigRepository';
import { CheckoutConfig } from '../../domain/entities/CheckoutConfig';
import { validationHookRegistry } from '../../domain/services/ValidationHookRegistry';

class MockCheckoutConfigRepository implements CheckoutConfigRepository {
  private configs = new Map<string, CheckoutConfig>();

  async findDefaultByStore(storeId: string): Promise<CheckoutConfig | null> {
    for (const config of this.configs.values()) {
      if (config.storeId === storeId && config.isDefault) return config;
    }
    return null;
  }

  async findById(configId: string): Promise<CheckoutConfig | null> {
    return this.configs.get(configId) ?? null;
  }

  async findAllByStore(storeId: string): Promise<CheckoutConfig[]> {
    return Array.from(this.configs.values()).filter(c => c.storeId === storeId);
  }

  async findAllByOrganization(organizationId: string): Promise<CheckoutConfig[]> {
    return Array.from(this.configs.values()).filter(c => c.organizationId === organizationId);
  }

  async create(config: CheckoutConfig): Promise<CheckoutConfig> {
    this.configs.set(config.configId, config);
    return config;
  }

  async update(configId: string, config: CheckoutConfig): Promise<CheckoutConfig | null> {
    this.configs.set(configId, config);
    return config;
  }

  async delete(configId: string): Promise<boolean> {
    return this.configs.delete(configId);
  }

  async setDefault(configId: string): Promise<CheckoutConfig | null> {
    const config = this.configs.get(configId);
    if (!config) return null;
    // Unset previous default for same store
    for (const c of this.configs.values()) {
      if (c.storeId === config.storeId && c.isDefault) {
        // Can't directly modify — just skip, the entity handles it
      }
    }
    config.setAsDefault();
    return config;
  }
}

describe('ValidateCheckoutStepUseCase', () => {
  let repo: MockCheckoutConfigRepository;
  let useCase: ValidateCheckoutStepUseCase;

  beforeEach(() => {
    repo = new MockCheckoutConfigRepository();
    useCase = new ValidateCheckoutStepUseCase(repo);

    // Create a default config for the store
    const config = CheckoutConfig.create({
      configId: 'cfg_1',
      storeId: 'store_1',
      organizationId: 'org_1',
      name: 'Default',
    });
    config.setAsDefault();
    repo.create(config);
  });

  afterEach(() => {
    const { fieldValidators, stepValidators } = validationHookRegistry.listValidators();
    fieldValidators.forEach(name => validationHookRegistry.unregisterFieldValidator(name));
    stepValidators.forEach(name => validationHookRegistry.unregisterStepValidator(name));
  });

  it('should validate required fields', async () => {
    const cmd = new ValidateCheckoutStepCommand('store_1', 'contact', {});
    const result = await useCase.execute(cmd);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.fieldId === 'email')).toBe(true);
  });

  it('should pass when all required fields are provided', async () => {
    const cmd = new ValidateCheckoutStepCommand('store_1', 'contact', {
      email: 'test@example.com',
    });
    const result = await useCase.execute(cmd);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate email format', async () => {
    const cmd = new ValidateCheckoutStepCommand('store_1', 'contact', {
      email: 'not-an-email',
    });
    const result = await useCase.execute(cmd);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message.includes('valid email'))).toBe(true);
  });

  it('should validate shipping step required fields', async () => {
    const cmd = new ValidateCheckoutStepCommand('store_1', 'shipping', {});
    const result = await useCase.execute(cmd);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.fieldId === 'firstName')).toBe(true);
    expect(result.errors.some(e => e.fieldId === 'lastName')).toBe(true);
    expect(result.errors.some(e => e.fieldId === 'addressLine1')).toBe(true);
  });

  it('should pass shipping validation with all fields', async () => {
    const cmd = new ValidateCheckoutStepCommand('store_1', 'shipping', {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'Anytown',
      postalCode: '12345',
      country: 'US',
    });
    const result = await useCase.execute(cmd);

    expect(result.valid).toBe(true);
  });

  it('should run custom field validators', async () => {
    validationHookRegistry.registerFieldValidator('customEmailCheck', (ctx) => ({
      valid: ctx.value !== 'blocked@example.com',
      message: ctx.value === 'blocked@example.com' ? 'This email is blocked' : undefined,
    }));

    // Add a field with custom validator to the config
    const config = await repo.findDefaultByStore('store_1');
    if (config) {
      config.addField('contact', {
        fieldId: 'customField',
        label: 'Custom',
        type: 'text',
        position: 'contact',
        validationRules: [{ rule: 'required' }, { rule: 'custom', customValidator: 'customEmailCheck' }],
        isVisible: true,
        isEditable: true,
        sortOrder: 5,
      });
    }

    const cmd = new ValidateCheckoutStepCommand('store_1', 'contact', {
      email: 'test@example.com',
      customField: 'blocked@example.com',
    });
    const result = await useCase.execute(cmd);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message === 'This email is blocked')).toBe(true);
  });

  it('should run step-level validation hooks', async () => {
    validationHookRegistry.registerStepValidator('customStepCheck', (ctx) => ({
      valid: ctx.fieldValues['email'] !== 'blocked@example.com',
      message: ctx.fieldValues['email'] === 'blocked@example.com' ? 'Email is blocked by step validator' : undefined,
    }));

    // Add validation hook to the contact step
    const config = await repo.findDefaultByStore('store_1');
    if (config) {
      config.updateStep('contact', {
        ...config.getStep('contact')!,
        validationHook: 'customStepCheck',
      });
    }

    const cmd = new ValidateCheckoutStepCommand('store_1', 'contact', {
      email: 'blocked@example.com',
    });
    const result = await useCase.execute(cmd);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.message === 'Email is blocked by step validator')).toBe(true);
  });

  it('should throw when config not found', async () => {
    const cmd = new ValidateCheckoutStepCommand('nonexistent_store', 'contact', {});
    await expect(useCase.execute(cmd)).rejects.toThrow('No checkout configuration found');
  });

  it('should throw when step not found', async () => {
    const cmd = new ValidateCheckoutStepCommand('store_1', 'nonexistent_step', {});
    await expect(useCase.execute(cmd)).rejects.toThrow('Step \'nonexistent_step\' not found');
  });
});
