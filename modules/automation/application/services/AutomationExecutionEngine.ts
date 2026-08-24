import type { AutomationRuleRepository, ExecutionLogRepository } from '../../domain/repositories/AutomationRepository';
import type { AutomationRule } from '../../domain/entities/AutomationRule';
import { evaluateConditions } from '../../domain/services/ConditionEvaluator';
import { executeActions, type ActionContext, type ActionExecutionResult } from '../../domain/services/ActionExecutor';
import { logger } from '../../../../libs/logger';
import { AutomationRuleNotFoundError } from '../../domain/errors/AutomationErrors';

export interface ExecutionResult {
  ruleId: string;
  executionLogId: string;
  status: 'success' | 'failed' | 'skipped';
  conditionResults: boolean;
  actionResults: ActionExecutionResult[];
  durationMs: number;
  error?: string;
}

export class AutomationExecutionEngine {
  constructor(
    private ruleRepo: AutomationRuleRepository,
    private logRepo: ExecutionLogRepository,
  ) {}

  async executeRule(
    rule: AutomationRule,
    context: Record<string, unknown>,
    triggerEventId?: string,
    correlationId?: string,
  ): Promise<ExecutionResult> {
    const start = Date.now();
    const executionLogId = await this.logRepo.create({
      automationRuleId: rule.automationRuleId,
      triggerType: rule.triggerType,
      triggerEventId,
      correlationId,
      triggerData: context.event ?? context,
      status: 'running',
      organizationId: rule.organizationId ?? undefined,
    });

    try {
      const conditionsMet = evaluateConditions(rule.conditions, rule.conditionMatchMode, context);

      if (!conditionsMet) {
        await this.logRepo.update(executionLogId, {
          status: 'skipped',
          conditionResults: false,
          completedAt: new Date(),
          durationMs: Date.now() - start,
        });

        rule.recordExecution(true);
        await this.ruleRepo.update(rule);

        return {
          ruleId: rule.automationRuleId,
          executionLogId,
          status: 'skipped',
          conditionResults: false,
          actionResults: [],
          durationMs: Date.now() - start,
        };
      }

      const actionContext: ActionContext = {
        event: context.event as { type: string; data: unknown; correlationId?: string } | undefined,
        customer: context.customer as Record<string, unknown> | undefined,
        order: context.order as Record<string, unknown> | undefined,
        product: context.product as Record<string, unknown> | undefined,
        organizationId: rule.organizationId ?? undefined,
        ruleId: rule.automationRuleId,
        executionLogId,
      };

      const actionResults = await executeActions(rule.actions, rule.actionExecutionMode, actionContext);
      const allSuccess = actionResults.every(r => r.success);
      const hasPartial = !allSuccess && actionResults.some(r => r.success);

      const status = allSuccess ? 'success' : hasPartial ? 'partial' : 'failed';

      await this.logRepo.update(executionLogId, {
        status,
        conditionResults: true,
        actionResults,
        completedAt: new Date(),
        durationMs: Date.now() - start,
      });

      rule.recordExecution(allSuccess);
      await this.ruleRepo.update(rule);

      logger.info('Automation rule executed', {
        ruleId: rule.automationRuleId,
        ruleName: rule.name,
        status,
        durationMs: Date.now() - start,
        actionCount: actionResults.length,
      });

      return {
        ruleId: rule.automationRuleId,
        executionLogId,
        status: allSuccess ? 'success' : 'failed',
        conditionResults: true,
        actionResults,
        durationMs: Date.now() - start,
        error: allSuccess ? undefined : 'One or more actions failed',
      };
    } catch (error) {
      const errorMessage = (error as Error).message;

      await this.logRepo.update(executionLogId, {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
        durationMs: Date.now() - start,
      });

      rule.recordExecution(false);
      await this.ruleRepo.update(rule);

      logger.error('Automation rule execution failed', {
        ruleId: rule.automationRuleId,
        error: errorMessage,
      });

      return {
        ruleId: rule.automationRuleId,
        executionLogId,
        status: 'failed',
        conditionResults: false,
        actionResults: [],
        durationMs: Date.now() - start,
        error: errorMessage,
      };
    }
  }

  async triggerEvent(
    eventName: string,
    eventData: unknown,
    correlationId?: string,
  ): Promise<ExecutionResult[]> {
    const rules = await this.ruleRepo.findByEventName(eventName, true);
    if (rules.length === 0) return [];

    const context = {
      event: { type: eventName, data: eventData, correlationId },
    };

    const results: ExecutionResult[] = [];
    for (const rule of rules) {
      const result = await this.executeRule(rule, context, undefined, correlationId);
      results.push(result);
    }

    return results;
  }

  async triggerManual(
    ruleId: string,
    context?: Record<string, unknown>,
  ): Promise<ExecutionResult> {
    const rule = await this.ruleRepo.findById(ruleId);
    if (!rule) throw new AutomationRuleNotFoundError(ruleId);

    return this.executeRule(rule, context ?? {}, 'manual');
  }
}
