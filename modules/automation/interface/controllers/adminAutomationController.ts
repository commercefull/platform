/**
 * Automation Controller
 * Handles automation rules management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';
import {
  createAutomationRuleUseCase,
  updateAutomationRuleUseCase,
  deleteAutomationRuleUseCase,
  getAutomationRuleUseCase,
  listAutomationRulesUseCase,
  executionEngine,
} from '../../application/useCases/wired';

// ============================================================================
// List Rules
// ============================================================================

export const listAutomationRules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const activeOnly = req.query.activeOnly === 'true';
  const rules = await listAutomationRulesUseCase.execute(activeOnly);

  adminRespond(req, res, 'operations/automation/index', {
    pageName: 'Automation Rules',
    rules: rules.map(r => r.toJSON()),
    filters: { activeOnly },
    success: req.query.success || null,
  });
};

// ============================================================================
// Create Rule
// ============================================================================

export const createAutomationRuleForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'operations/automation/create', {
    pageName: 'Create Automation Rule',
  });
};

export const createAutomationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const {
      name,
      description,
      triggerType,
      eventName,
      cronExpression,
      segmentId,
      conditions,
      conditionMatchMode,
      actions,
      actionExecutionMode,
      priority,
    } = body;

    const triggerConfig: Record<string, unknown> = {};
    if (eventName) triggerConfig.eventName = eventName;
    if (cronExpression) triggerConfig.cronExpression = cronExpression;
    if (segmentId) triggerConfig.segmentId = segmentId;

    const rule = await createAutomationRuleUseCase.execute({
      name,
      description: description || undefined,
      triggerType,
      triggerConfig,
      conditions: conditions ? (typeof conditions === 'string' ? JSON.parse(conditions) : conditions) : undefined,
      conditionMatchMode: conditionMatchMode || 'all',
      actions: typeof actions === 'string' ? JSON.parse(actions) : actions,
      actionExecutionMode: actionExecutionMode || 'sequential',
      priority: priority ? parseInt(priority as string, 10) : 0,
    } as unknown as Parameters<typeof createAutomationRuleUseCase.execute>[0]);

    res.redirect(`/admin/automation/${rule.automationRuleId}?success=Automation rule created successfully`);
  } catch (error: unknown) {
    logger.warn('Error creating automation rule:', error);
    adminRespond(req, res, 'operations/automation/create', {
      pageName: 'Create Automation Rule',
      error: (error as Error).message || 'Failed to create automation rule',
      formData: req.body as HttpRequestBody,
    });
  }
};

// ============================================================================
// View Rule
// ============================================================================

export const viewAutomationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { ruleId } = req.params;
  const rule = await getAutomationRuleUseCase.execute(ruleId);

  if (!rule) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Automation rule not found',
    });
    return;
  }

  adminRespond(req, res, 'operations/automation/view', {
    pageName: `Rule: ${rule.name}`,
    rule: rule.toJSON(),
    success: req.query.success || null,
  });
};

// ============================================================================
// Edit Rule
// ============================================================================

export const editAutomationRuleForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { ruleId } = req.params;
  const rule = await getAutomationRuleUseCase.execute(ruleId);

  if (!rule) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Automation rule not found',
    });
    return;
  }

  adminRespond(req, res, 'operations/automation/edit', {
    pageName: 'Edit Automation Rule',
    rule: rule.toJSON(),
  });
};

export const updateAutomationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { ruleId } = req.params;
    const body = req.body as HttpRequestBody;
    const {
      name,
      description,
      eventName,
      cronExpression,
      segmentId,
      conditions,
      conditionMatchMode,
      actions,
      actionExecutionMode,
      isActive,
      priority,
    } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description || undefined;
    if (eventName !== undefined || cronExpression !== undefined || segmentId !== undefined) {
      const triggerConfig: Record<string, unknown> = {};
      if (eventName) triggerConfig.eventName = eventName;
      if (cronExpression) triggerConfig.cronExpression = cronExpression;
      if (segmentId) triggerConfig.segmentId = segmentId;
      updates.triggerConfig = triggerConfig;
    }
    if (conditions !== undefined) updates.conditions = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
    if (conditionMatchMode !== undefined) updates.conditionMatchMode = conditionMatchMode;
    if (actions !== undefined) updates.actions = typeof actions === 'string' ? JSON.parse(actions) : actions;
    if (actionExecutionMode !== undefined) updates.actionExecutionMode = actionExecutionMode;
    if (isActive !== undefined) updates.isActive = isActive !== 'false';
    if (priority !== undefined) updates.priority = parseInt(priority as string, 10);

    const rule = await updateAutomationRuleUseCase.execute(ruleId, updates as never);
    res.redirect(`/admin/automation/${rule.automationRuleId}?success=Automation rule updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error updating automation rule:', error);
    const { ruleId } = req.params;
    adminRespond(req, res, 'operations/automation/edit', {
      pageName: 'Edit Automation Rule',
      error: (error as Error).message || 'Failed to update automation rule',
      formData: req.body as HttpRequestBody,
      rule: { automationRuleId: ruleId },
    });
  }
};

// ============================================================================
// Delete Rule
// ============================================================================

export const deleteAutomationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { ruleId } = req.params;
    await deleteAutomationRuleUseCase.execute(ruleId);
    res.redirect('/admin/automation?success=Automation rule deleted successfully');
  } catch (error: unknown) {
    logger.warn('Error deleting automation rule:', error);
    res.redirect('/admin/automation?error=Failed to delete automation rule');
  }
};

// ============================================================================
// Activate / Deactivate
// ============================================================================

export const activateAutomationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { ruleId } = req.params;
    await updateAutomationRuleUseCase.execute(ruleId, { isActive: true } as never);
    res.redirect(`/admin/automation/${ruleId}?success=Rule activated successfully`);
  } catch (error: unknown) {
    logger.warn('Error activating automation rule:', error);
    res.redirect(`/admin/automation/${req.params.ruleId}?error=Failed to activate rule`);
  }
};

export const deactivateAutomationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { ruleId } = req.params;
    await updateAutomationRuleUseCase.execute(ruleId, { isActive: false } as never);
    res.redirect(`/admin/automation/${ruleId}?success=Rule deactivated successfully`);
  } catch (error: unknown) {
    logger.warn('Error deactivating automation rule:', error);
    res.redirect(`/admin/automation/${req.params.ruleId}?error=Failed to deactivate rule`);
  }
};

// ============================================================================
// Manual Trigger
// ============================================================================

export const triggerAutomationRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { ruleId } = req.params;
    await executionEngine.triggerManual(ruleId, req.body as Record<string, unknown>);
    res.redirect(`/admin/automation/${ruleId}?success=Rule triggered successfully`);
  } catch (error: unknown) {
    logger.warn('Error triggering automation rule:', error);
    res.redirect(`/admin/automation/${req.params.ruleId}?error=Failed to trigger rule`);
  }
};
