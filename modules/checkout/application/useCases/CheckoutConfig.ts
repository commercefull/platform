 
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Checkout Configuration Use Cases
 *
 * - ManageCheckoutConfig: CRUD operations for per-store checkout configurations
 * - ValidateCheckoutStep: Validate a checkout step using configured fields + custom hooks
 */

import { generateUUID } from '../../../../libs/uuid';
import { CheckoutConfigRepository } from '../../domain/repositories/CheckoutConfigRepository';
import { CheckoutConfig, CheckoutStepConfig, CheckoutFieldConfig } from '../../domain/entities/CheckoutConfig';
import { validationHookRegistry, ValidationContext, StepValidationContext } from '../../domain/services/ValidationHookRegistry';
import { CheckoutValidationError } from '../../domain/errors/CheckoutErrors';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Manage Checkout Config
// ============================================================================

class CreateCheckoutConfigCommand {
  constructor(
    public readonly storeId: string,
    public readonly organizationId: string,
    public readonly name: string,
    public readonly steps: CheckoutStepConfig[] | undefined,
    public readonly behavior: Partial<CheckoutConfig['behavior']> | undefined,
    public readonly isDefault: boolean | undefined,
  ) {}
}

class UpdateCheckoutConfigCommand {
  constructor(
    public readonly configId: string,
    public readonly name: string | undefined,
    public readonly steps: CheckoutStepConfig[] | undefined,
    public readonly behavior: Partial<CheckoutConfig['behavior']> | undefined,
    public readonly isActive: boolean | undefined,
  ) {}
}

class ManageCheckoutConfigUseCase {
  constructor(private readonly configRepository: CheckoutConfigRepository) {}

  async create(command: CreateCheckoutConfigCommand): Promise<CheckoutConfig> {
    const config = CheckoutConfig.create({
      configId: generateUUID(),
      storeId: command.storeId,
      organizationId: command.organizationId,
      name: command.name,
      steps: command.steps,
      behavior: command.behavior,
    });

    if (command.isDefault) {
      config.setAsDefault();
    }

    const saved = await this.configRepository.create(config);

    if (command.isDefault) {
      await this.configRepository.setDefault(saved.configId);
    }

    eventBus.emit('checkout.config.created', {
      configId: saved.configId,
      storeId: saved.storeId,
    });

    return saved;
  }

  async update(command: UpdateCheckoutConfigCommand): Promise<CheckoutConfig | null> {
    const existing = await this.configRepository.findById(command.configId);
    if (!existing) return null;

    if (command.name !== undefined) existing.updateName(command.name);
    if (command.steps !== undefined) {
      // Replace all steps
      for (const step of existing.steps) {
        existing.removeStep(step.stepId);
      }
      for (const step of command.steps) {
        existing.addStep(step);
      }
    }
    if (command.behavior !== undefined) existing.updateBehavior(command.behavior);
    if (command.isActive === true) existing.activate();
    if (command.isActive === false) existing.deactivate();

    const updated = await this.configRepository.update(command.configId, existing);

    eventBus.emit('checkout.config.updated', {
      configId: command.configId,
    });

    return updated;
  }

  async delete(configId: string): Promise<boolean> {
    const config = await this.configRepository.findById(configId);
    if (config?.isDefault) {
      throw new CheckoutValidationError('Cannot delete the default checkout configuration');
    }
    const deleted = await this.configRepository.delete(configId);
    if (deleted) {
      eventBus.emit('checkout.config.deleted', { configId });
    }
    return deleted;
  }

  async get(configId: string): Promise<CheckoutConfig | null> {
    return this.configRepository.findById(configId);
  }

  async getByStore(storeId: string): Promise<CheckoutConfig | null> {
    return this.configRepository.findDefaultByStore(storeId);
  }

  async listByStore(storeId: string): Promise<CheckoutConfig[]> {
    return this.configRepository.findAllByStore(storeId);
  }

  async listByOrganization(organizationId: string): Promise<CheckoutConfig[]> {
    return this.configRepository.findAllByOrganization(organizationId);
  }

  async setDefault(configId: string): Promise<CheckoutConfig | null> {
    const config = await this.configRepository.findById(configId);
    if (!config) return null;
    config.setAsDefault();
    return this.configRepository.setDefault(configId);
  }

  // Step management
  async addStep(configId: string, step: CheckoutStepConfig): Promise<CheckoutConfig | null> {
    const config = await this.configRepository.findById(configId);
    if (!config) return null;
    config.addStep(step);
    return this.configRepository.update(configId, config);
  }

  async removeStep(configId: string, stepId: string): Promise<CheckoutConfig | null> {
    const config = await this.configRepository.findById(configId);
    if (!config) return null;
    config.removeStep(stepId);
    return this.configRepository.update(configId, config);
  }

  // Field management
  async addField(configId: string, stepId: string, field: CheckoutFieldConfig): Promise<CheckoutConfig | null> {
    const config = await this.configRepository.findById(configId);
    if (!config) return null;
    config.addField(stepId, field);
    return this.configRepository.update(configId, config);
  }

  async removeField(configId: string, stepId: string, fieldId: string): Promise<CheckoutConfig | null> {
    const config = await this.configRepository.findById(configId);
    if (!config) return null;
    config.removeField(stepId, fieldId);
    return this.configRepository.update(configId, config);
  }
}

// ============================================================================
// Validate Checkout Step
// ============================================================================

export class ValidateCheckoutStepCommand {
  constructor(
    public readonly storeId: string,
    public readonly stepId: string,
    public readonly fieldValues: Record<string, unknown>,
  ) {}
}

export interface ValidateCheckoutStepResponse {
  valid: boolean;
  errors: Array<{ fieldId: string; message: string }>;
}

export class ValidateCheckoutStepUseCase {
  constructor(private readonly configRepository: CheckoutConfigRepository) {}

  async execute(command: ValidateCheckoutStepCommand): Promise<ValidateCheckoutStepResponse> {
    const config = await this.configRepository.findDefaultByStore(command.storeId);
    if (!config) {
      throw new CheckoutValidationError(`No checkout configuration found for store ${command.storeId}`);
    }

    const step = config.getStep(command.stepId);
    if (!step) {
      throw new CheckoutValidationError(`Step '${command.stepId}' not found in checkout configuration`);
    }

    const errors: Array<{ fieldId: string; message: string }> = [];

    // Validate each field
    for (const field of step.fields) {
      if (!field.isVisible) continue;

      const value = command.fieldValues[field.fieldId];
      const fieldErrors = this.validateField(field, value, command.fieldValues);

      for (const msg of fieldErrors) {
        errors.push({ fieldId: field.fieldId, message: msg });
      }

      // Run custom validators
      for (const rule of field.validationRules) {
        if (rule.customValidator) {
          const ctx: ValidationContext = {
            fieldId: field.fieldId,
            fieldLabel: field.label,
            value,
            allFieldValues: command.fieldValues,
            storeId: command.storeId,
          };
          const result = await validationHookRegistry.runFieldValidator(rule.customValidator, ctx);
          if (!result.valid) {
            errors.push({ fieldId: field.fieldId, message: result.message || 'Validation failed' });
          }
        }
      }
    }

    // Run step-level validation hook
    if (step.validationHook) {
      const stepCtx: StepValidationContext = {
        stepId: step.stepId,
        stepType: step.type,
        fieldValues: command.fieldValues,
        storeId: command.storeId,
      };
      const stepResult = await validationHookRegistry.runStepValidator(step.validationHook, stepCtx);
      if (!stepResult.valid) {
        errors.push({ fieldId: '_step', message: stepResult.message || 'Step validation failed' });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateField(
    field: CheckoutFieldConfig,
    value: unknown,
    allValues: Record<string, unknown>,
  ): string[] {
    const errors: string[] = [];

    // Check conditional visibility
    if (field.conditionalVisibility) {
      const cond = field.conditionalVisibility;
      const condValue = allValues[cond.fieldId];
      const meetsCondition = this.evaluateCondition(condValue, cond.operator, cond.value);
      if (!meetsCondition) return errors; // Field is not visible, skip validation
    }

    for (const rule of field.validationRules) {
      switch (rule.rule) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push(rule.message || `${field.label} is required`);
          }
          break;
        case 'email':
          if (value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(rule.message || `${field.label} must be a valid email`);
          }
          break;
        case 'phone':
          if (value && typeof value === 'string' && !/^[\d\s+()-]+$/.test(value)) {
            errors.push(rule.message || `${field.label} must be a valid phone number`);
          }
          break;
        case 'postalCode':
          if (value && typeof value === 'string' && !/^[A-Za-z0-9\s-]{3,10}$/.test(value)) {
            errors.push(rule.message || `${field.label} must be a valid postal code`);
          }
          break;
        case 'minLength':
          if (value && typeof value === 'string' && value.length < (rule.value as number)) {
            errors.push(rule.message || `${field.label} must be at least ${rule.value} characters`);
          }
          break;
        case 'maxLength':
          if (value && typeof value === 'string' && value.length > (rule.value as number)) {
            errors.push(rule.message || `${field.label} must be at most ${rule.value} characters`);
          }
          break;
        case 'pattern':
          if (value && typeof value === 'string' && rule.value && !new RegExp(rule.value as string).test(value)) {
            errors.push(rule.message || `${field.label} format is invalid`);
          }
          break;
        case 'min':
          if (value !== undefined && value !== null && typeof value === 'number' && value < (rule.value as number)) {
            errors.push(rule.message || `${field.label} must be at least ${rule.value}`);
          }
          break;
        case 'max':
          if (value !== undefined && value !== null && typeof value === 'number' && value > (rule.value as number)) {
            errors.push(rule.message || `${field.label} must be at most ${rule.value}`);
          }
          break;
        case 'optional':
        case 'custom':
          // These are handled elsewhere
          break;
      }
    }

    return errors;
  }

  private evaluateCondition(value: unknown, operator: string, target: string): boolean {
    const strValue = String(value ?? '');
    switch (operator) {
      case 'eq': return strValue === target;
      case 'neq': return strValue !== target;
      case 'contains': return strValue.includes(target);
      case 'notContains': return !strValue.includes(target);
      default: return true;
    }
  }
}
