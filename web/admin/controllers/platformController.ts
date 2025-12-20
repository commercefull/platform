/**
 * Platform Controller
 * Handles platform administration, configuration, and monitoring
 * for the Commercefull Admin Hub - Phase 8
 */

import { Request, Response } from 'express';
import {
  getHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
  getDependencyStatus,
  getPerformanceMetrics,
  getActiveAlerts,
  acknowledgeAlert
} from '../../../modules/platform/services/healthService';
import {
  getAuditLogs,
  getAuditLogById,
  getAuditSummary,
  AuditLogFilter
} from '../../../modules/platform/services/auditService';
import {
  getWebhookEndpoints,
  getWebhookEndpoint,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  getWebhookDeliveries,
  WEBHOOK_EVENTS
} from '../../../modules/platform/services/webhookService';
import {
  getAllConfigs,
  getConfigCategories,
  setConfig,
  deleteConfig,
  getFeatureFlags,
  setFeatureFlag
} from '../../../modules/platform/services/configService';

// ============================================================================
// Health & Monitoring
// ============================================================================

export const healthDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = await getHealthStatus();
    const dependencies = await getDependencyStatus();
    const performanceMetrics = await getPerformanceMetrics('1h');
    const alerts = getActiveAlerts();

    res.render('hub/views/platform/health', {
      pageName: 'System Health',
      healthStatus,
      dependencies,
      performanceMetrics,
      alerts,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading health dashboard:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load health dashboard',
      user: req.user
    });
  }
};

export const healthApi = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = await getHealthStatus();
    res.json(healthStatus);
  } catch (error: any) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
};

export const livenessApi = async (req: Request, res: Response): Promise<void> => {
  const status = await getLivenessStatus();
  res.status(status.alive ? 200 : 503).json(status);
};

export const readinessApi = async (req: Request, res: Response): Promise<void> => {
  const status = await getReadinessStatus();
  res.status(status.ready ? 200 : 503).json(status);
};

export const acknowledgeAlertAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { alertId } = req.params;
    const success = acknowledgeAlert(alertId);

    res.json({ success, message: success ? 'Alert acknowledged' : 'Alert not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Audit Logs
// ============================================================================

export const auditLogsDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entityType, action, actorType, startDate, endDate, page = '1' } = req.query;

    const filters: AuditLogFilter = {};
    if (entityType) filters.entityType = entityType as string;
    if (action) filters.action = action as string;
    if (actorType) filters.actorType = actorType as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const limit = 50;
    const offset = (parseInt(page as string) - 1) * limit;

    const { data: auditLogs, total } = await getAuditLogs(filters, { limit, offset });

    // Get summary for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const summary = await getAuditSummary(thirtyDaysAgo, new Date());

    res.render('hub/views/platform/audit-logs', {
      pageName: 'Audit Logs',
      auditLogs,
      total,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(total / limit),
      filters: { entityType, action, actorType, startDate, endDate },
      summary,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading audit logs:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load audit logs',
      user: req.user
    });
  }
};

export const auditLogDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auditLogId } = req.params;
    const auditLog = await getAuditLogById(auditLogId);

    if (!auditLog) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Audit log not found',
        user: req.user
      });
      return;
    }

    res.render('hub/views/platform/audit-log-detail', {
      pageName: 'Audit Log Detail',
      auditLog,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading audit log detail:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load audit log detail',
      user: req.user
    });
  }
};

// ============================================================================
// Webhooks
// ============================================================================

export const webhooksDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhooks = await getWebhookEndpoints();

    res.render('hub/views/platform/webhooks', {
      pageName: 'Webhooks',
      webhooks,
      availableEvents: Object.values(WEBHOOK_EVENTS),
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading webhooks:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load webhooks',
      user: req.user
    });
  }
};

export const webhookDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    const webhook = await getWebhookEndpoint(webhookId);

    if (!webhook) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Webhook not found',
        user: req.user
      });
      return;
    }

    const { data: deliveries } = await getWebhookDeliveries(webhookId, { limit: 20 });

    res.render('hub/views/platform/webhook-detail', {
      pageName: 'Webhook Detail',
      webhook,
      deliveries,
      availableEvents: Object.values(WEBHOOK_EVENTS),
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading webhook detail:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load webhook detail',
      user: req.user
    });
  }
};

export const createWebhookAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, url, events } = req.body;

    if (!name || !url || !events || !Array.isArray(events)) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const webhook = await createWebhookEndpoint({ name, url, events });

    res.json({ success: true, webhook });
  } catch (error: any) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWebhookAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    const updates = req.body;

    const webhook = await updateWebhookEndpoint(webhookId, updates);

    if (!webhook) {
      res.status(404).json({ success: false, message: 'Webhook not found' });
      return;
    }

    res.json({ success: true, webhook });
  } catch (error: any) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWebhookAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhookId } = req.params;
    await deleteWebhookEndpoint(webhookId);

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error: any) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Configuration
// ============================================================================

export const configurationDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getConfigCategories();
    const featureFlags = await getFeatureFlags();

    res.render('hub/views/platform/configuration', {
      pageName: 'Platform Configuration',
      categories,
      featureFlags,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading configuration:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load configuration',
      user: req.user
    });
  }
};

export const updateConfigAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, value, type, category, description } = req.body;

    if (!key) {
      res.status(400).json({ success: false, message: 'Config key is required' });
      return;
    }

    const config = await setConfig(key, value, { type, category, description });

    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error updating config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteConfigAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    await deleteConfig(key);

    res.json({ success: true, message: 'Config deleted' });
  } catch (error: any) {
    console.error('Error deleting config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleFeatureFlagAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { featureKey } = req.params;
    const { enabled } = req.body;

    await setFeatureFlag(featureKey, enabled);

    res.json({ success: true, message: `Feature ${featureKey} ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error: any) {
    console.error('Error toggling feature flag:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// API Keys (Placeholder)
// ============================================================================

export const apiKeysDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Placeholder - would fetch API keys from database
    const apiKeys: any[] = [];

    res.render('hub/views/platform/api-keys', {
      pageName: 'API Keys',
      apiKeys,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading API keys:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load API keys',
      user: req.user
    });
  }
};
