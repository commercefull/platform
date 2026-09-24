/**
 * ExecuteAutomationRule Use Case
 *
 * Executes a single automation rule against a context: evaluates conditions,
 * runs actions, and records the outcome in the execution log and on the rule.
 * Orchestration only — condition evaluation lives in
 * `domain/services/ConditionEvaluator`, action dispatch in
 * `domain/services/ActionExecutor`.
 */

import type { AutomationRuleRepository, ExecutionLogRepository } from '../../domain/repositories/AutomationRepository';
import type { AutomationRule, ActionType } from '../../domain/entities/AutomationRule';
import { evaluateConditions } from '../../domain/services/ConditionEvaluator';
import {
  executeActions,
  type ActionContext,
  type ActionExecutionResult,
  type ActionHandler,
} from '../../domain/services/ActionExecutor';
import { logger } from '../../../../libs/logger';

export interface ExecutionResult {
  ruleId: string;
  executionLogId: string;
  status: 'success' | 'failed' | 'skipped';
  conditionResults: boolean;
  actionResults: ActionExecutionResult[];
  durationMs: number;
  error?: string;
}

export class ExecuteAutomationRuleUseCase {
  constructor(
    private readonly ruleRepo: AutomationRuleRepository,
    private readonly logRepo: ExecutionLogRepository,
    private readonly actionHandlers: ReadonlyMap<ActionType, ActionHandler>,
  ) {}

  async execute(
    rule: AutomationRule,
    context: Record<string, unknown> = {},
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

      const actionResults = await executeActions(rule.actions, rule.actionExecutionMode, actionContext, this.actionHandlers);
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
}
