/**
 * CheckoutConfig Entity Tests
 */

import { CheckoutConfig, CheckoutStepConfig, CheckoutFieldConfig } from './CheckoutConfig';

describe('CheckoutConfig', () => {
  const baseProps = {
    configId: 'cfg_1',
    storeId: 'store_1',
    organizationId: 'org_1',
    name: 'Default Checkout',
  };

  it('should create with default steps and behavior', () => {
    const config = CheckoutConfig.create(baseProps);

    expect(config.configId).toBe('cfg_1');
    expect(config.storeId).toBe('store_1');
    expect(config.name).toBe('Default Checkout');
    expect(config.isActive).toBe(true);
    expect(config.isDefault).toBe(false);
    expect(config.steps.length).toBe(5); // contact, shipping, billing, payment, review
  });

  it('should have contact as first step', () => {
    const config = CheckoutConfig.create(baseProps);
    const ordered = config.getOrderedSteps();

    expect(ordered[0].type).toBe('contact');
    expect(ordered[0].title).toBe('Contact Information');
  });

  it('should reconstitute from props', () => {
    const now = new Date();
    const config = CheckoutConfig.reconstitute({
      configId: 'cfg_2',
      storeId: 'store_2',
      organizationId: 'org_2',
      name: 'Custom Checkout',
      steps: [],
      behavior: { ...CheckoutConfig.getDefaultBehavior(), allowGuestCheckout: false },
      isActive: false,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    expect(config.name).toBe('Custom Checkout');
    expect(config.isActive).toBe(false);
    expect(config.isDefault).toBe(true);
    expect(config.behavior.allowGuestCheckout).toBe(false);
  });

  it('should activate and deactivate', () => {
    const config = CheckoutConfig.create(baseProps);

    config.deactivate();
    expect(config.isActive).toBe(false);
    config.activate();
    expect(config.isActive).toBe(true);
  });

  it('should not deactivate default config', () => {
    const config = CheckoutConfig.create(baseProps);
    config.setAsDefault();

    expect(() => config.deactivate()).toThrow('Cannot deactivate the default checkout configuration');
  });

  it('should set as default', () => {
    const config = CheckoutConfig.create(baseProps);
    config.setAsDefault();
    expect(config.isDefault).toBe(true);
    expect(config.isActive).toBe(true);
  });

  it('should update name', () => {
    const config = CheckoutConfig.create(baseProps);
    config.updateName('New Name');
    expect(config.name).toBe('New Name');
  });

  it('should reject empty name', () => {
    const config = CheckoutConfig.create(baseProps);
    expect(() => config.updateName('')).toThrow('Configuration name cannot be empty');
    expect(() => config.updateName('  ')).toThrow('Configuration name cannot be empty');
  });

  it('should add a step', () => {
    const config = CheckoutConfig.create(baseProps);
    const customStep: CheckoutStepConfig = {
      stepId: 'custom_1',
      type: 'custom',
      title: 'Gift Wrap',
      fields: [],
      isRequired: false,
      isSkippable: true,
      sortOrder: 10,
    };

    config.addStep(customStep);
    expect(config.getStep('custom_1')).toBeDefined();
  });

  it('should not add duplicate step', () => {
    const config = CheckoutConfig.create(baseProps);
    const step: CheckoutStepConfig = {
      stepId: 'contact',
      type: 'contact',
      title: 'Contact',
      fields: [],
      isRequired: true,
      isSkippable: false,
      sortOrder: 1,
    };

    expect(() => config.addStep(step)).toThrow('already exists');
  });

  it('should remove a non-required step', () => {
    const config = CheckoutConfig.create(baseProps);
    const step: CheckoutStepConfig = {
      stepId: 'custom_1',
      type: 'custom',
      title: 'Custom',
      fields: [],
      isRequired: false,
      isSkippable: true,
      sortOrder: 10,
    };
    config.addStep(step);
    config.removeStep('custom_1');
    expect(config.getStep('custom_1')).toBeUndefined();
  });

  it('should not remove a required step', () => {
    const config = CheckoutConfig.create(baseProps);
    expect(() => config.removeStep('contact')).toThrow('Cannot remove required step');
  });

  it('should add a field to a step', () => {
    const config = CheckoutConfig.create(baseProps);
    const field: CheckoutFieldConfig = {
      fieldId: 'phone',
      label: 'Phone Number',
      type: 'tel',
      position: 'contact',
      validationRules: [{ rule: 'required' }, { rule: 'phone' }],
      isVisible: true,
      isEditable: true,
      sortOrder: 2,
    };

    config.addField('contact', field);
    expect(config.getField('contact', 'phone')).toBeDefined();
  });

  it('should remove a field from a step', () => {
    const config = CheckoutConfig.create(baseProps);
    config.removeField('contact', 'email');
    expect(config.getField('contact', 'email')).toBeUndefined();
  });

  it('should update behavior', () => {
    const config = CheckoutConfig.create(baseProps);
    config.updateBehavior({ allowGuestCheckout: false, enableExpressCheckout: true });

    expect(config.behavior.allowGuestCheckout).toBe(false);
    expect(config.behavior.enableExpressCheckout).toBe(true);
    expect(config.behavior.showOrderNotes).toBe(true); // unchanged
  });

  it('should validate order amount', () => {
    const config = CheckoutConfig.create({
      ...baseProps,
      behavior: { minimumOrderAmount: 10, maximumOrderAmount: 5000 },
    });

    expect(config.validateOrderAmount(5)).toEqual({ valid: false, message: 'Minimum order amount is 10' });
    expect(config.validateOrderAmount(6000)).toEqual({ valid: false, message: 'Maximum order amount is 5000' });
    expect(config.validateOrderAmount(100)).toEqual({ valid: true });
  });

  it('should get ordered steps', () => {
    const config = CheckoutConfig.create(baseProps);
    const ordered = config.getOrderedSteps();

    expect(ordered[0].sortOrder).toBeLessThanOrEqual(ordered[1].sortOrder);
    expect(ordered[1].sortOrder).toBeLessThanOrEqual(ordered[2].sortOrder);
  });

  it('should serialize to JSON', () => {
    const config = CheckoutConfig.create(baseProps);
    const json = config.toJSON() as Record<string, unknown>;

    expect(json.configId).toBe('cfg_1');
    expect(json.storeId).toBe('store_1');
    expect(json.name).toBe('Default Checkout');
    expect(Array.isArray(json.steps)).toBe(true);
    expect(json.behavior).toBeDefined();
    expect(json.isActive).toBe(true);
  });
});
