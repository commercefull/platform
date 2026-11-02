import { AppError } from '../../../../libs/errors';

export class AutomationRuleNotFoundError extends AppError {
  constructor(identifier: string) {
    super(`Automation rule not found: ${identifier}`, 404, { code: 'automation.rule_not_found', details: { identifier } });
  }
}


export class InvalidAutomationRuleError extends AppError {
  constructor(reason: string) {
    super(`Invalid automation rule: ${reason}`, 400, { code: 'automation.invalid_rule', details: { reason } });
  }
}


export class AutomationValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'automation.validation_error' });
  }
}
