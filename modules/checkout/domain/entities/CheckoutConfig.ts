/**
 * Checkout Configuration Entity
 *
 * Per-store checkout configuration with customizable steps, fields,
 * validation hooks, and behavior toggles.
 */

import { BadRequestError } from '../../../../libs/errors';

// ============================================================================
// Types
// ============================================================================

export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'hidden';
export type FieldPosition = 'shipping' | 'billing' | 'payment' | 'contact' | 'custom';
export type StepType = 'contact' | 'shipping' | 'billing' | 'payment' | 'review' | 'confirmation' | 'custom';
export type ValidationRule = 'required' | 'optional' | 'email' | 'phone' | 'postalCode' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'custom';

export interface CheckoutFieldConfig {
  fieldId: string;
  label: string;
  type: FieldType;
  position: FieldPosition;
  validationRules: Array<{
    rule: ValidationRule;
    value?: string | number;
    message?: string;
    /** Custom validator function name (resolved by the validation hook registry) */
    customValidator?: string;
  }>;
  placeholder?: string;
  defaultValue?: string;
  options?: Array<{ label: string; value: string }>;
  isVisible: boolean;
  isEditable: boolean;
  sortOrder: number;
  /** Only show this field when these conditions are met */
  conditionalVisibility?: {
    fieldId: string;
    operator: 'eq' | 'neq' | 'contains' | 'notContains';
    value: string;
  };
}

export interface CheckoutStepConfig {
  stepId: string;
  type: StepType;
  title: string;
  description?: string;
  fields: CheckoutFieldConfig[];
  isRequired: boolean;
  isSkippable: boolean;
  sortOrder: number;
  /** Custom validation hook to run before advancing to the next step */
  validationHook?: string;
}

export interface CheckoutBehaviorConfig {
  /** Allow guest checkout (without creating an account) */
  allowGuestCheckout: boolean;
  /** Require account creation before checkout */
  requireAccount: boolean;
  /** Allow shipping to multiple addresses */
  allowMultiAddressShipping: boolean;
  /** Show order notes field */
  showOrderNotes: boolean;
  /** Show gift options */
  showGiftOptions: boolean;
  /** Show terms and conditions checkbox */
  showTermsCheckbox: boolean;
  /** Terms and conditions URL */
  termsUrl?: string;
  /** Auto-apply shipping method based on address */
  autoSelectShipping: boolean;
  /** Enable express checkout (Apple Pay, Google Pay) */
  enableExpressCheckout: boolean;
  /** Minimum order amount for checkout */
  minimumOrderAmount?: number;
  /** Maximum order amount for checkout */
  maximumOrderAmount?: number;
  /** Session timeout in minutes */
  sessionTimeoutMinutes: number;
  /** Custom success message */
  successMessage?: string;
  /** Redirect URL after successful checkout */
  successRedirectUrl?: string;
}

export interface CheckoutConfigProps {
  configId: string;
  storeId: string;
  organizationId: string;
  name: string;
  steps: CheckoutStepConfig[];
  behavior: CheckoutBehaviorConfig;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Entity
// ============================================================================

export class CheckoutConfig {
  private props: CheckoutConfigProps;

  private constructor(props: CheckoutConfigProps) {
    this.props = props;
  }

  static create(props: {
    configId: string;
    storeId: string;
    organizationId: string;
    name: string;
    steps?: CheckoutStepConfig[];
    behavior?: Partial<CheckoutBehaviorConfig>;
  }): CheckoutConfig {
    const now = new Date();
    return new CheckoutConfig({
      configId: props.configId,
      storeId: props.storeId,
      organizationId: props.organizationId,
      name: props.name,
      steps: props.steps || CheckoutConfig.getDefaultSteps(),
      behavior: { ...CheckoutConfig.getDefaultBehavior(), ...props.behavior },
      isActive: true,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CheckoutConfigProps): CheckoutConfig {
    return new CheckoutConfig(props);
  }

  static getDefaultSteps(): CheckoutStepConfig[] {
    return [
      {
        stepId: 'contact',
        type: 'contact',
        title: 'Contact Information',
        isRequired: true,
        isSkippable: false,
        sortOrder: 1,
        fields: [
          {
            fieldId: 'email',
            label: 'Email',
            type: 'email',
            position: 'contact',
            validationRules: [{ rule: 'required' }, { rule: 'email' }],
            isVisible: true,
            isEditable: true,
            sortOrder: 1,
          },
        ],
      },
      {
        stepId: 'shipping',
        type: 'shipping',
        title: 'Shipping Address',
        isRequired: true,
        isSkippable: false,
        sortOrder: 2,
        fields: [
          {
            fieldId: 'firstName',
            label: 'First Name',
            type: 'text',
            position: 'shipping',
            validationRules: [{ rule: 'required' }],
            isVisible: true,
            isEditable: true,
            sortOrder: 1,
          },
          {
            fieldId: 'lastName',
            label: 'Last Name',
            type: 'text',
            position: 'shipping',
            validationRules: [{ rule: 'required' }],
            isVisible: true,
            isEditable: true,
            sortOrder: 2,
          },
          {
            fieldId: 'addressLine1',
            label: 'Address Line 1',
            type: 'text',
            position: 'shipping',
            validationRules: [{ rule: 'required' }],
            isVisible: true,
            isEditable: true,
            sortOrder: 3,
          },
          {
            fieldId: 'city',
            label: 'City',
            type: 'text',
            position: 'shipping',
            validationRules: [{ rule: 'required' }],
            isVisible: true,
            isEditable: true,
            sortOrder: 4,
          },
          {
            fieldId: 'postalCode',
            label: 'Postal Code',
            type: 'text',
            position: 'shipping',
            validationRules: [{ rule: 'required' }, { rule: 'postalCode' }],
            isVisible: true,
            isEditable: true,
            sortOrder: 5,
          },
          {
            fieldId: 'country',
            label: 'Country',
            type: 'select',
            position: 'shipping',
            validationRules: [{ rule: 'required' }],
            isVisible: true,
            isEditable: true,
            sortOrder: 6,
          },
        ],
      },
      {
        stepId: 'billing',
        type: 'billing',
        title: 'Billing Address',
        isRequired: true,
        isSkippable: false,
        sortOrder: 3,
        fields: [
          {
            fieldId: 'sameAsShipping',
            label: 'Same as shipping address',
            type: 'checkbox',
            position: 'billing',
            validationRules: [],
            isVisible: true,
            isEditable: true,
            sortOrder: 1,
            defaultValue: 'true',
          },
        ],
      },
      {
        stepId: 'payment',
        type: 'payment',
        title: 'Payment Method',
        isRequired: true,
        isSkippable: false,
        sortOrder: 4,
        fields: [],
      },
      {
        stepId: 'review',
        type: 'review',
        title: 'Review Your Order',
        isRequired: true,
        isSkippable: false,
        sortOrder: 5,
        fields: [],
      },
    ];
  }

  static getDefaultBehavior(): CheckoutBehaviorConfig {
    return {
      allowGuestCheckout: true,
      requireAccount: false,
      allowMultiAddressShipping: false,
      showOrderNotes: true,
      showGiftOptions: false,
      showTermsCheckbox: false,
      autoSelectShipping: false,
      enableExpressCheckout: false,
      sessionTimeoutMinutes: 30,
    };
  }

  // Getters
  get configId(): string { return this.props.configId; }
  get storeId(): string { return this.props.storeId; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get steps(): CheckoutStepConfig[] { return this.props.steps; }
  get behavior(): CheckoutBehaviorConfig { return this.props.behavior; }
  get isActive(): boolean { return this.props.isActive; }
  get isDefault(): boolean { return this.props.isDefault; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Domain methods

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    if (this.props.isDefault) {
      throw new BadRequestError('Cannot deactivate the default checkout configuration');
    }
    this.props.isActive = false;
    this.touch();
  }

  setAsDefault(): void {
    this.props.isDefault = true;
    this.props.isActive = true;
    this.touch();
  }

  updateName(name: string): void {
    if (!name.trim()) throw new BadRequestError('Configuration name cannot be empty');
    this.props.name = name;
    this.touch();
  }

  addStep(step: CheckoutStepConfig): void {
    if (this.props.steps.some(s => s.stepId === step.stepId)) {
      throw new BadRequestError(`Step with ID '${step.stepId}' already exists`);
    }
    this.props.steps.push(step);
    this.sortSteps();
    this.touch();
  }

  removeStep(stepId: string): void {
    const step = this.props.steps.find(s => s.stepId === stepId);
    if (step?.isRequired) {
      throw new BadRequestError(`Cannot remove required step '${stepId}'`);
    }
    this.props.steps = this.props.steps.filter(s => s.stepId !== stepId);
    this.sortSteps();
    this.touch();
  }

  updateStep(stepId: string, updates: Partial<CheckoutStepConfig>): void {
    const idx = this.props.steps.findIndex(s => s.stepId === stepId);
    if (idx === -1) {
      throw new BadRequestError(`Step '${stepId}' not found`);
    }
    this.props.steps[idx] = { ...this.props.steps[idx], ...updates };
    this.sortSteps();
    this.touch();
  }

  addField(stepId: string, field: CheckoutFieldConfig): void {
    const step = this.props.steps.find(s => s.stepId === stepId);
    if (!step) {
      throw new BadRequestError(`Step '${stepId}' not found`);
    }
    if (step.fields.some(f => f.fieldId === field.fieldId)) {
      throw new BadRequestError(`Field with ID '${field.fieldId}' already exists in step '${stepId}'`);
    }
    step.fields.push(field);
    step.fields.sort((a, b) => a.sortOrder - b.sortOrder);
    this.touch();
  }

  removeField(stepId: string, fieldId: string): void {
    const step = this.props.steps.find(s => s.stepId === stepId);
    if (!step) return;
    step.fields = step.fields.filter(f => f.fieldId !== fieldId);
    this.touch();
  }

  updateField(stepId: string, fieldId: string, updates: Partial<CheckoutFieldConfig>): void {
    const step = this.props.steps.find(s => s.stepId === stepId);
    if (!step) return;
    const idx = step.fields.findIndex(f => f.fieldId === fieldId);
    if (idx === -1) return;
    step.fields[idx] = { ...step.fields[idx], ...updates };
    step.fields.sort((a, b) => a.sortOrder - b.sortOrder);
    this.touch();
  }

  updateBehavior(updates: Partial<CheckoutBehaviorConfig>): void {
    this.props.behavior = { ...this.props.behavior, ...updates };
    this.touch();
  }

  getOrderedSteps(): CheckoutStepConfig[] {
    return [...this.props.steps].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getStep(stepId: string): CheckoutStepConfig | undefined {
    return this.props.steps.find(s => s.stepId === stepId);
  }

  getField(stepId: string, fieldId: string): CheckoutFieldConfig | undefined {
    return this.getStep(stepId)?.fields.find(f => f.fieldId === fieldId);
  }

  validateOrderAmount(amount: number): { valid: boolean; message?: string } {
    if (this.props.behavior.minimumOrderAmount !== undefined && amount < this.props.behavior.minimumOrderAmount) {
      return { valid: false, message: `Minimum order amount is ${this.props.behavior.minimumOrderAmount}` };
    }
    if (this.props.behavior.maximumOrderAmount !== undefined && amount > this.props.behavior.maximumOrderAmount) {
      return { valid: false, message: `Maximum order amount is ${this.props.behavior.maximumOrderAmount}` };
    }
    return { valid: true };
  }

  private sortSteps(): void {
    this.props.steps.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      configId: this.props.configId,
      storeId: this.props.storeId,
      organizationId: this.props.organizationId,
      name: this.props.name,
      steps: this.props.steps,
      behavior: this.props.behavior,
      isActive: this.props.isActive,
      isDefault: this.props.isDefault,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
