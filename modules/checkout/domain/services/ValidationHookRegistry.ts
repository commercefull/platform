/**
 * Custom Validation Hook Registry
 *
 * Allows registration of custom validation functions that can be referenced
 * by name in checkout step/field configurations. This enables per-store
 * custom validation logic without modifying the checkout module.
 */

export type ValidationContext = {
  fieldId: string;
  fieldLabel: string;
  value: unknown;
  allFieldValues: Record<string, unknown>;
  storeId: string;
};

export type ValidationResult = {
  valid: boolean;
  message?: string;
};

export type ValidationHookFn = (ctx: ValidationContext) => Promise<ValidationResult> | ValidationResult;

export type StepValidationContext = {
  stepId: string;
  stepType: string;
  fieldValues: Record<string, unknown>;
  storeId: string;
};

export type StepValidationHookFn = (ctx: StepValidationContext) => Promise<ValidationResult> | ValidationResult;

class ValidationHookRegistryClass {
  private fieldValidators = new Map<string, ValidationHookFn>();
  private stepValidators = new Map<string, StepValidationHookFn>();

  /**
   * Register a custom field validation function.
   */
  registerFieldValidator(name: string, fn: ValidationHookFn): void {
    this.fieldValidators.set(name, fn);
  }

  /**
   * Register a custom step validation function.
   */
  registerStepValidator(name: string, fn: StepValidationHookFn): void {
    this.stepValidators.set(name, fn);
  }

  /**
   * Get a registered field validator by name.
   */
  getFieldValidator(name: string): ValidationHookFn | undefined {
    return this.fieldValidators.get(name);
  }

  /**
   * Get a registered step validator by name.
   */
  getStepValidator(name: string): StepValidationHookFn | undefined {
    return this.stepValidators.get(name);
  }

  /**
   * Execute a field validator by name.
   * Returns a pass-through result if the validator is not found.
   */
  async runFieldValidator(name: string, ctx: ValidationContext): Promise<ValidationResult> {
    const fn = this.fieldValidators.get(name);
    if (!fn) {
      return { valid: true, message: `Validator '${name}' not found — skipping` };
    }
    return fn(ctx);
  }

  /**
   * Execute a step validator by name.
   * Returns a pass-through result if the validator is not found.
   */
  async runStepValidator(name: string, ctx: StepValidationContext): Promise<ValidationResult> {
    const fn = this.stepValidators.get(name);
    if (!fn) {
      return { valid: true, message: `Step validator '${name}' not found — skipping` };
    }
    return fn(ctx);
  }

  /**
   * Unregister a field validator.
   */
  unregisterFieldValidator(name: string): void {
    this.fieldValidators.delete(name);
  }

  /**
   * Unregister a step validator.
   */
  unregisterStepValidator(name: string): void {
    this.stepValidators.delete(name);
  }

  /**
   * List all registered validator names.
   */
  listValidators(): { fieldValidators: string[]; stepValidators: string[] } {
    return {
      fieldValidators: Array.from(this.fieldValidators.keys()),
      stepValidators: Array.from(this.stepValidators.keys()),
    };
  }
}

export const validationHookRegistry = new ValidationHookRegistryClass();
