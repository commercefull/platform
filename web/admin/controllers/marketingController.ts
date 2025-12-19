/**
 * Marketing Controller
 * Handles marketing management for the Admin Hub
 */

import { Request, Response } from 'express';
import {
  saveCampaign,
  getCampaign,
  deleteCampaign,
  getCampaignsByMerchant,
  getTemplatesByMerchant,
  saveTemplate
} from '../../../modules/marketing/repos/emailCampaignRepo';

// ============================================================================
// Email Campaigns
// ============================================================================

export const listEmailCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getCampaignsByMerchant('default-merchant', { status: status as any }, { limit, offset });

    res.render('hub/views/marketing/campaigns/index', {
      pageName: 'Email Campaigns',
      campaigns: result.data,
      filters: { status },
      pagination: { limit, offset, total: result.total },
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing email campaigns:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load email campaigns',
      user: req.user
    });
  }
};

export const createEmailCampaignForm = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get available templates for selection
    const templates = await getTemplatesByMerchant('default-merchant');

    res.render('hub/views/marketing/campaigns/create', {
      pageName: 'Create Email Campaign',
      templates,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading create campaign form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const createEmailCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      subject,
      templateId,
      senderName,
      senderEmail,
      content,
      scheduledAt,
      targetAudience
    } = req.body;

    const campaign = await saveCampaign({
      merchantId: 'default-merchant',
      name,
      subject,
      fromName: senderName,
      fromEmail: senderEmail,
      bodyHtml: content,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      status: scheduledAt ? 'scheduled' : 'draft'
    });

    res.redirect(`/hub/marketing/campaigns/${campaign.emailCampaignId}?success=Email campaign created successfully`);
  } catch (error: any) {
    console.error('Error creating email campaign:', error);

    try {
      const templates = await getTemplatesByMerchant('default-merchant');

      res.render('hub/views/marketing/campaigns/create', {
        pageName: 'Create Email Campaign',
        templates,
        error: error.message || 'Failed to create email campaign',
        formData: req.body,
        user: req.user
      });
    } catch {
      res.status(500).render('hub/views/error', {
        pageName: 'Error',
        error: error.message || 'Failed to create email campaign',
        user: req.user
      });
    }
  }
};

export const viewEmailCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;

    const campaign = await getCampaign(campaignId);

    if (!campaign) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Email campaign not found',
        user: req.user
      });
      return;
    }

    // Get campaign statistics (placeholder for now)
    const stats = { sent: 0, opened: 0, clicked: 0 };

    res.render('hub/views/marketing/campaigns/view', {
      pageName: `Campaign: ${campaign.name}`,
      campaign,
      stats,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing email campaign:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load email campaign',
      user: req.user
    });
  }
};

export const editEmailCampaignForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;

    const campaign = await getCampaign(campaignId);

    if (!campaign) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'Email campaign not found',
        user: req.user
      });
      return;
    }

    const templates = await getTemplatesByMerchant('default-merchant');

    res.render('hub/views/marketing/campaigns/edit', {
      pageName: `Edit: ${campaign.name}`,
      campaign,
      templates,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading edit campaign form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const updateEmailCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const updates: any = {};

    const {
      name,
      subject,
      templateId,
      senderName,
      senderEmail,
      content,
      scheduledAt,
      targetAudience,
      status
    } = req.body;

    if (name !== undefined) updates.name = name;
    if (subject !== undefined) updates.subject = subject;
    if (templateId !== undefined) updates.templateId = templateId || undefined;
    if (senderName !== undefined) updates.senderName = senderName || undefined;
    if (senderEmail !== undefined) updates.senderEmail = senderEmail;
    if (content !== undefined) updates.content = content;
    if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
    if (targetAudience !== undefined) updates.targetAudience = targetAudience ? JSON.parse(targetAudience) : undefined;
    if (status !== undefined) updates.status = status;

    const campaign = await saveCampaign({
      emailCampaignId: campaignId,
      name: updates.name,
      subject: updates.subject,
      fromName: updates.senderName,
      fromEmail: updates.senderEmail,
      bodyHtml: updates.content,
      scheduledAt: updates.scheduledAt,
      status: updates.status
    });

    res.redirect(`/hub/marketing/campaigns/${campaignId}?success=Email campaign updated successfully`);
  } catch (error: any) {
    console.error('Error updating email campaign:', error);

    try {
      const campaign = await getCampaign(req.params.campaignId);
      const templates = await getTemplatesByMerchant('default-merchant');

      res.render('hub/views/marketing/campaigns/edit', {
        pageName: `Edit: ${campaign?.name || 'Campaign'}`,
        campaign,
        templates,
        error: error.message || 'Failed to update email campaign',
        formData: req.body,
        user: req.user
      });
    } catch {
      res.status(500).render('hub/views/error', {
        pageName: 'Error',
        error: error.message || 'Failed to update email campaign',
        user: req.user
      });
    }
  }
};

export const deleteEmailCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;

    await deleteCampaign(campaignId);

    res.json({ success: true, message: 'Email campaign deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting email campaign:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete email campaign' });
  }
};

// ============================================================================
// Email Templates
// ============================================================================

export const listEmailTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await getTemplatesByMerchant('default-merchant');

    res.render('hub/views/marketing/templates/index', {
      pageName: 'Email Templates',
      templates,
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing email templates:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load email templates',
      user: req.user
    });
  }
};

export const createEmailTemplateForm = async (req: Request, res: Response): Promise<void> => {
  try {
    res.render('hub/views/marketing/templates/create', {
      pageName: 'Create Email Template',
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading create template form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const createEmailTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      subject,
      content,
      variables
    } = req.body;

    const template = await saveTemplate({
      merchantId: 'default-merchant',
      name,
      subject,
      bodyHtml: content,
      variables: variables ? JSON.parse(variables) : undefined
    });

    res.redirect(`/hub/marketing/templates/${template.emailTemplateId}?success=Email template created successfully`);
  } catch (error: any) {
    console.error('Error creating email template:', error);

    res.render('hub/views/marketing/templates/create', {
      pageName: 'Create Email Template',
      error: error.message || 'Failed to create email template',
      formData: req.body,
      user: req.user
    });
  }
};
