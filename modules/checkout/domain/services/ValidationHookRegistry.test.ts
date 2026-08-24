/**
 * Validation Hook Registry Tests
 */

import { validationHookRegistry } from './ValidationHookRegistry';

describe('ValidationHookRegistry', () => {
  afterEach(() => {
    // Clean up registered validators
    const { fieldValidators, stepValidators } = validationHookRegistry.listValidators();
    fieldValidators.forEach(name => validationHookRegistry.unregisterFieldValidator(name));
    stepValidators.forEach(name => validationHookRegistry.unregisterStepValidator(name));
  });

  it('should register and run a field validator', async () => {
    validationHookRegistry.registerFieldValidator('minAgeCheck', (ctx) => {
      const age = Number(ctx.value);
      return { valid: age >= 18, message: age < 18 ? 'Must be 18 or older' : undefined };
    });

    const result1 = await validationHookRegistry.runFieldValidator('minAgeCheck', {
      fieldId: 'age',
      fieldLabel: 'Age',
      value: 21,
      allFieldValues: {},
      storeId: 'store_1',
    });
    expect(result1.valid).toBe(true);

    const result2 = await validationHookRegistry.runFieldValidator('minAgeCheck', {
      fieldId: 'age',
      fieldLabel: 'Age',
      value: 15,
      allFieldValues: {},
      storeId: 'store_1',
    });
    expect(result2.valid).toBe(false);
    expect(result2.message).toBe('Must be 18 or older');
  });

  it('should register and run a step validator', async () => {
    validationHookRegistry.registerStepValidator('validateShippingStep', (ctx) => {
      const hasAddress = !!ctx.fieldValues['addressLine1'];
      return { valid: hasAddress, message: hasAddress ? undefined : 'Address is required' };
    });

    const result1 = await validationHookRegistry.runStepValidator('validateShippingStep', {
      stepId: 'shipping',
      stepType: 'shipping',
      fieldValues: { addressLine1: '123 Main St' },
      storeId: 'store_1',
    });
    expect(result1.valid).toBe(true);

    const result2 = await validationHookRegistry.runStepValidator('validateShippingStep', {
      stepId: 'shipping',
      stepType: 'shipping',
      fieldValues: {},
      storeId: 'store_1',
    });
    expect(result2.valid).toBe(false);
    expect(result2.message).toBe('Address is required');
  });

  it('should return pass-through for unregistered validators', async () => {
    const result = await validationHookRegistry.runFieldValidator('nonexistent', {
      fieldId: 'test',
      fieldLabel: 'Test',
      value: 'test',
      allFieldValues: {},
      storeId: 'store_1',
    });
    expect(result.valid).toBe(true);
    expect(result.message).toContain('not found');
  });

  it('should list registered validators', () => {
    validationHookRegistry.registerFieldValidator('validator1', () => ({ valid: true }));
    validationHookRegistry.registerFieldValidator('validator2', () => ({ valid: true }));
    validationHookRegistry.registerStepValidator('stepValidator1', () => ({ valid: true }));

    const { fieldValidators, stepValidators } = validationHookRegistry.listValidators();
    expect(fieldValidators).toContain('validator1');
    expect(fieldValidators).toContain('validator2');
    expect(stepValidators).toContain('stepValidator1');
  });

  it('should unregister validators', () => {
    validationHookRegistry.registerFieldValidator('tempValidator', () => ({ valid: true }));
    validationHookRegistry.unregisterFieldValidator('tempValidator');

    const { fieldValidators } = validationHookRegistry.listValidators();
    expect(fieldValidators).not.toContain('tempValidator');
  });

  it('should support async validators', async () => {
    validationHookRegistry.registerFieldValidator('asyncValidator', async (ctx) => {
      await new Promise(r => setTimeout(r, 10));
      return { valid: ctx.value === 'valid', message: ctx.value !== 'valid' ? 'Invalid value' : undefined };
    });

    const result = await validationHookRegistry.runFieldValidator('asyncValidator', {
      fieldId: 'test',
      fieldLabel: 'Test',
      value: 'valid',
      allFieldValues: {},
      storeId: 'store_1',
    });
    expect(result.valid).toBe(true);
  });
});
