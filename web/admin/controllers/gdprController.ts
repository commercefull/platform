/**
 * GDPR Controller for Admin Hub
 * Handles GDPR compliance features
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// GDPR Dashboard
// ============================================================================

export const gdprDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get GDPR stats
    const statsResult = await queryOne<any>(
      `SELECT
        COUNT(CASE WHEN "status" = 'pending' THEN 1 END) as "pendingRequests",
        COUNT(CASE WHEN "status" = 'completed' AND "updatedAt" >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as "completedRequests",
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 86400) as "avgProcessingDays"
       FROM "gdprRequest"`
    );

    // Get consent stats
    const consentResult = await queryOne<any>(
      `SELECT
        COUNT(CASE WHEN "acceptsMarketing" = true THEN 1 END) as "marketingConsent",
        ROUND(100.0 * COUNT(CASE WHEN "acceptsMarketing" = true THEN 1 END) / COUNT(*), 1) as "marketingConsentRate",
        COUNT(CASE WHEN "acceptsAnalytics" = true THEN 1 END) as "analyticsConsent",
        ROUND(100.0 * COUNT(CASE WHEN "acceptsAnalytics" = true THEN 1 END) / COUNT(*), 1) as "analyticsConsentRate"
       FROM "customer"`
    );

    // Get recent requests
    const requests = await query<Array<any>>(
      `SELECT gr.*, c."firstName" || ' ' || c."lastName" as "customerName", c."email" as "customerEmail"
       FROM "gdprRequest" gr
       LEFT JOIN "customer" c ON gr."customerId" = c."customerId"
       WHERE gr."deletedAt" IS NULL
       ORDER BY gr."createdAt" DESC
       LIMIT 20`
    );

    res.render('admin/views/gdpr/index', {
      pageName: 'GDPR Compliance',
      stats: {
        pendingRequests: parseInt(statsResult?.pendingRequests || '0'),
        completedRequests: parseInt(statsResult?.completedRequests || '0'),
        avgProcessingDays: Math.round(parseFloat(statsResult?.avgProcessingDays || '0')),
        consentRate: parseFloat(consentResult?.marketingConsentRate || '0')
      },
      requests: requests || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading GDPR dashboard:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load GDPR dashboard',
      user: req.user
    });
  }
};

// ============================================================================
// GDPR Requests CRUD
// ============================================================================

export const createGdprRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestType, customerEmail, customerName, description } = req.body;

    // Find customer by email
    const customer = await queryOne<{ customerId: string }>(
      `SELECT "customerId" FROM "customer" WHERE "email" = $1 AND "deletedAt" IS NULL`,
      [customerEmail]
    );

    const requestId = uuidv4();
    await query(
      `INSERT INTO "gdprRequest" ("requestId", "customerId", "requestType", "status", "description", "customerEmail", "customerName", "dueDate", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        requestId,
        customer?.customerId || null,
        requestType,
        'pending',
        description || null,
        customerEmail,
        customerName || null,
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      ]
    );

    res.redirect('/hub/gdpr?success=GDPR request created');
  } catch (error: any) {
    console.error('Error creating GDPR request:', error);
    res.redirect('/hub/gdpr?error=' + encodeURIComponent(error.message));
  }
};

export const viewGdprRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    const request = await queryOne<any>(
      `SELECT gr.*, c."firstName" || ' ' || c."lastName" as "customerName", c."email" as "customerEmail"
       FROM "gdprRequest" gr
       LEFT JOIN "customer" c ON gr."customerId" = c."customerId"
       WHERE gr."requestId" = $1 AND gr."deletedAt" IS NULL`,
      [requestId]
    );

    if (!request) {
      res.status(404).render('admin/views/error', {
        pageName: 'Not Found',
        error: 'GDPR request not found',
        user: req.user
      });
      return;
    }

    res.render('admin/views/gdpr/view', {
      pageName: `GDPR Request: ${request.requestType}`,
      request,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error viewing GDPR request:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load GDPR request',
      user: req.user
    });
  }
};

export const processGdprRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    await query(
      `UPDATE "gdprRequest" SET "status" = 'processing', "updatedAt" = NOW() WHERE "requestId" = $1`,
      [requestId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing GDPR request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const completeGdprRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;

    await query(
      `UPDATE "gdprRequest" SET "status" = 'completed', "notes" = $1, "updatedAt" = NOW() WHERE "requestId" = $2`,
      [notes, requestId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error completing GDPR request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Consent Management
// ============================================================================

export const consentManagement = async (req: Request, res: Response): Promise<void> => {
  try {
    const consentSettings = {
      cookieConsentRequired: true,
      marketingConsentRequired: true,
      analyticsConsentRequired: true,
      consentRetentionDays: 365
    };

    res.render('admin/views/gdpr/consent', {
      pageName: 'Consent Management',
      consentSettings,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading consent management:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load consent management',
      user: req.user
    });
  }
};
