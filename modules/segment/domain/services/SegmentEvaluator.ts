/**
 * Segment Evaluator Service
 * 
 * Evaluates customer membership in dynamic segments.
 */

import { Segment, SegmentRule, RuleOperator } from '../entities/Segment';

export interface CustomerData {
  customerId: string;
  totalOrders?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  lastOrderDate?: Date;
  registeredAt?: Date;
  tags?: string[];
  location?: {
    country?: string;
    state?: string;
    city?: string;
  };
  [key: string]: unknown;
}

export class SegmentEvaluator {
  /**
   * Evaluate if a customer matches a segment's rules
   */
  evaluateCustomer(customer: CustomerData, segment: Segment): boolean {
    if (segment.type === 'static') {
      return segment.staticMemberIds.includes(customer.customerId);
    }

    if (segment.type === 'hybrid') {
      if (segment.staticMemberIds.includes(customer.customerId)) {
        return true;
      }
    }

    // Evaluate dynamic rules
    return this.evaluateRules(customer, segment.rules);
  }

  /**
   * Evaluate rules against customer data
   */
  private evaluateRules(customer: CustomerData, rules: SegmentRule[]): boolean {
    if (rules.length === 0) return false;

    let result = this.evaluateRule(customer, rules[0]);

    for (let i = 1; i < rules.length; i++) {
      const rule = rules[i];
      const ruleResult = this.evaluateRule(customer, rule);
      const prevLogicalOp = rules[i - 1].logicalOperator || 'AND';

      if (prevLogicalOp === 'AND') {
        result = result && ruleResult;
      } else {
        result = result || ruleResult;
      }
    }

    return result;
  }

  /**
   * Evaluate a single rule
   */
  private evaluateRule(customer: CustomerData, rule: SegmentRule): boolean {
    const fieldValue = this.getFieldValue(customer, rule.field);
    return this.compareValues(fieldValue, rule.operator, rule.value);
  }

  /**
   * Get nested field value from customer data
   */
  private getFieldValue(customer: CustomerData, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = customer;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[part];
    }

    return value;
  }

  /**
   * Compare values based on operator
   */
  private compareValues(fieldValue: unknown, operator: RuleOperator, ruleValue: unknown): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === ruleValue;

      case 'not_equals':
        return fieldValue !== ruleValue;

      case 'greater_than':
        return typeof fieldValue === 'number' && typeof ruleValue === 'number' && fieldValue > ruleValue;

      case 'less_than':
        return typeof fieldValue === 'number' && typeof ruleValue === 'number' && fieldValue < ruleValue;

      case 'contains':
        if (typeof fieldValue === 'string' && typeof ruleValue === 'string') {
          return fieldValue.toLowerCase().includes(ruleValue.toLowerCase());
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(ruleValue);
        }
        return false;

      case 'not_contains':
        if (typeof fieldValue === 'string' && typeof ruleValue === 'string') {
          return !fieldValue.toLowerCase().includes(ruleValue.toLowerCase());
        }
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(ruleValue);
        }
        return true;

      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);

      case 'not_in':
        return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);

      case 'between':
        if (typeof fieldValue === 'number' && Array.isArray(ruleValue) && ruleValue.length === 2) {
          const [min, max] = ruleValue as [number, number];
          return fieldValue >= min && fieldValue <= max;
        }
        return false;

      default:
        return false;
    }
  }
}
