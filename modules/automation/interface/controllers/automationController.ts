import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  createAutomationRuleUseCase,
  updateAutomationRuleUseCase,
  deleteAutomationRuleUseCase,
  getAutomationRuleUseCase,
  listAutomationRulesUseCase,
  triggerAutomationRuleUseCase,
  listExecutionLogsUseCase,
} from '../../application/useCases/wired';

interface CreateRuleBody {
  name: string;
  description?: string;
  triggerType?: string;
  triggerConfig?: Record<string, unknown>;
  trigger?: Record<string, unknown>;
  conditions?: Array<{ field: string; operator: string; value?: unknown; values?: unknown[]; dataPath?: string }>;
  conditionMatchMode?: 'all' | 'any';
  actions: Array<{ type: string; config?: Record<string, unknown>; channel?: string; delayMs?: number }>;
  actionExecutionMode?: 'sequential' | 'parallel';
  priority?: number;
  organizationId?: string;
  createdBy?: string;
}

/**
 * Normalize the create-rule payload: accepts "trigger" as shorthand for
 * triggerType/triggerConfig and "channel" as shorthand for action config.
 */
function normalizeCreatePayload(body: CreateRuleBody, fallbackUserId: string) {
  let triggerType = body.triggerType || '';
  let triggerConfig = body.triggerConfig || {};
  if (body.trigger) {
    const evt = body.trigger.event || body.trigger.type || '';
    if (evt) {
      triggerType = 'event';
      triggerConfig = { eventName: String(evt), ...(body.trigger as Record<string, unknown>) };
    }
  }

  const actions = (body.actions || []).map(a => ({
    type: a.type,
    config: a.config || (a.channel ? { channel: a.channel } : {}),
    delayMs: a.delayMs,
  }));

  return {
    ...body,
    triggerType,
    triggerConfig,
    actions,
    organizationId: body.organizationId || fallbackUserId,
    createdBy: body.createdBy || fallbackUserId,
  };
}

class AutomationController {
  async listRules(req: HttpRequest, res: HttpResponse): Promise<void> {
    const activeOnly = req.query.activeOnly === 'true';
    const rules = await listAutomationRulesUseCase.execute(activeOnly);
    jsonResponse(res, 200, { success: true, data: rules.map(r => r.toJSON()) });
  }

  async getRule(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    const rule = await getAutomationRuleUseCase.execute(req.params.ruleId);
    jsonResponse(res, 200, { success: true, data: rule.toJSON() });
  }

  async createRule(req: HttpRequest<Record<string, never>, Record<string, never>, CreateRuleBody>, res: HttpResponse): Promise<void> {
    const fallbackUserId = (req.user as { id?: string })?.id || '';
    const payload = normalizeCreatePayload(req.body, fallbackUserId);
    const rule = await createAutomationRuleUseCase.execute(payload as Parameters<typeof createAutomationRuleUseCase.execute>[0]);
    jsonResponse(res, 201, { success: true, data: rule.toJSON() });
  }

  async updateRule(
    req: HttpRequest<
      { ruleId: string },
      Record<string, never>,
      {
        name?: string;
        description?: string;
        triggerConfig?: Record<string, unknown>;
        conditions?: Array<{ field: string; operator: string; value?: unknown; values?: unknown[]; dataPath?: string }>;
        conditionMatchMode?: 'all' | 'any';
        actions?: Array<{ type: string; config: Record<string, unknown>; delayMs?: number }>;
        actionExecutionMode?: 'sequential' | 'parallel';
        isActive?: boolean;
        priority?: number;
      }
    >,
    res: HttpResponse,
  ): Promise<void> {
    const rule = await updateAutomationRuleUseCase.execute(
      req.params.ruleId,
      req.body as Parameters<typeof updateAutomationRuleUseCase.execute>[1],
    );
    jsonResponse(res, 200, { success: true, data: rule.toJSON() });
  }

  async deleteRule(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    await deleteAutomationRuleUseCase.execute(req.params.ruleId);
    jsonResponse(res, 200, { success: true });
  }

  async triggerRule(
    req: HttpRequest<{ ruleId: string }, Record<string, never>, { context?: Record<string, unknown> }>,
    res: HttpResponse,
  ): Promise<void> {
    const result = await triggerAutomationRuleUseCase.execute(req.params.ruleId, req.body?.context);
    jsonResponse(res, 200, { success: true, data: result });
  }

  async getExecutionLogs(req: HttpRequest<{ ruleId: string }>, res: HttpResponse): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = await listExecutionLogsUseCase.findByRule(req.params.ruleId, limit);
    jsonResponse(res, 200, { success: true, data: logs });
  }
}

export default new AutomationController();
