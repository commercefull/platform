import { Response } from 'express';
import { TypedRequest } from '../../../../libs/types/express';
import {
  createAutomationRuleUseCase,
  updateAutomationRuleUseCase,
  deleteAutomationRuleUseCase,
  getAutomationRuleUseCase,
  listAutomationRulesUseCase,
  executionEngine,
} from '../../application/useCases/wired';
import { ExecutionLogRepositoryImpl } from '../../infrastructure';
import { AutomationRuleNotFoundError, InvalidAutomationRuleError } from '../../domain/errors/AutomationErrors';

export class AutomationController {
  async listRules(req: TypedRequest, res: Response): Promise<void> {
    const activeOnly = req.query.activeOnly === 'true';
    const rules = await listAutomationRulesUseCase.execute(activeOnly);
    res.json({ success: true, data: rules.map(r => r.toJSON()) });
  }

  async getRule(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      const rule = await getAutomationRuleUseCase.execute(req.params.ruleId);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      if (error instanceof AutomationRuleNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async createRule(req: TypedRequest<Record<string, never>, Record<string, never>, {
    name: string;
    description?: string;
    triggerType: string;
    triggerConfig: Record<string, unknown>;
    conditions?: Array<{ field: string; operator: string; value?: unknown; values?: unknown[]; dataPath?: string }>;
    conditionMatchMode?: 'all' | 'any';
    actions: Array<{ type: string; config: Record<string, unknown>; delayMs?: number }>;
    actionExecutionMode?: 'sequential' | 'parallel';
    priority?: number;
    organizationId?: string;
    createdBy?: string;
  }>, res: Response): Promise<void> {
    try {
      const rule = await createAutomationRuleUseCase.execute(req.body as Parameters<typeof createAutomationRuleUseCase.execute>[0]);
      res.status(201).json({ success: true, data: rule.toJSON() });
    } catch (error) {
      if (error instanceof InvalidAutomationRuleError) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async updateRule(req: TypedRequest<{ ruleId: string }, Record<string, never>, {
    name?: string;
    description?: string;
    triggerConfig?: Record<string, unknown>;
    conditions?: Array<{ field: string; operator: string; value?: unknown; values?: unknown[]; dataPath?: string }>;
    conditionMatchMode?: 'all' | 'any';
    actions?: Array<{ type: string; config: Record<string, unknown>; delayMs?: number }>;
    actionExecutionMode?: 'sequential' | 'parallel';
    isActive?: boolean;
    priority?: number;
  }>, res: Response): Promise<void> {
    try {
      const rule = await updateAutomationRuleUseCase.execute(req.params.ruleId, req.body as Parameters<typeof updateAutomationRuleUseCase.execute>[1]);
      res.json({ success: true, data: rule.toJSON() });
    } catch (error) {
      if (error instanceof AutomationRuleNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async deleteRule(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    try {
      await deleteAutomationRuleUseCase.execute(req.params.ruleId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof AutomationRuleNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async triggerRule(req: TypedRequest<{ ruleId: string }, Record<string, never>, { context?: Record<string, unknown> }>, res: Response): Promise<void> {
    try {
      const result = await executionEngine.triggerManual(req.params.ruleId, req.body?.context);
      res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AutomationRuleNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    }
  }

  async getExecutionLogs(req: TypedRequest<{ ruleId: string }>, res: Response): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logRepo = new ExecutionLogRepositoryImpl();
    const logs = await logRepo.findByRule(req.params.ruleId, limit);
    res.json({ success: true, data: logs });
  }
}

export default new AutomationController();
