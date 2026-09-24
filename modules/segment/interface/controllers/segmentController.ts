import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  createSegmentUseCase,
  updateSegmentUseCase,
  deleteSegmentUseCase,
  getSegmentUseCase,
  listSegmentsUseCase,
  getCustomerProfileUseCase,
  listCustomerProfilesUseCase,
  computeCustomerProfileUseCase,
  recomputeAllProfilesUseCase,
  evaluateSegmentUseCase,
  getSegmentMembersUseCase,
  getCustomerSegmentsUseCase,
} from '../../application/useCases/wired';
import { SegmentNotFoundError, SegmentAlreadyExistsError, InvalidSegmentConditionsError } from '../../domain/errors/SegmentErrors';
import { logger } from '../../../../libs/logger';

class SegmentController {
  // ── Segment CRUD ──────────────────────────────────────────────

  async listSegments(req: HttpRequest, res: HttpResponse): Promise<void> {
    const activeOnly = req.query.activeOnly === 'true';
    const segments = await listSegmentsUseCase.execute(activeOnly);
    res.json({ success: true, data: segments.map(s => s.toJSON()) });
  }

  async getSegment(req: HttpRequest<{ segmentId: string }>, res: HttpResponse): Promise<void> {
    try {
      const segment = await getSegmentUseCase.execute(req.params.segmentId);
      res.json({ success: true, data: segment.toJSON() });
    } catch (error) {
      if (error instanceof SegmentNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async createSegment(
    req: HttpRequest<
      Record<string, never>,
      Record<string, never>,
      {
        name: string;
        code?: string;
        description?: string;
        conditions?: Array<{ field: string; operator: string; value?: unknown; values?: unknown[] }>;
        rules?: Array<{ field: string; operator: string; value?: unknown; values?: unknown[] }>;
        matchMode?: 'all' | 'any';
        color?: string;
        icon?: string;
        organizationId?: string;
      }
    >,
    res: HttpResponse,
  ): Promise<void> {
    try {
      const body = req.body;
      // Normalize: accept "rules" as shorthand for "conditions"
      const conditions = body.conditions || body.rules || [];
      // Generate code from name if not provided
      const code =
        body.code ||
        body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      const payload = { ...body, conditions, code };
      const segment = await createSegmentUseCase.execute(payload as Parameters<typeof createSegmentUseCase.execute>[0]);
      res.status(201).json({ success: true, data: segment.toJSON() });
    } catch (error) {
      if (error instanceof SegmentAlreadyExistsError || error instanceof InvalidSegmentConditionsError) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async updateSegment(
    req: HttpRequest<
      { segmentId: string },
      Record<string, never>,
      {
        name?: string;
        description?: string;
        conditions?: Array<{ field: string; operator: string; value?: unknown; values?: unknown[] }>;
        matchMode?: 'all' | 'any';
        color?: string;
        icon?: string;
        isActive?: boolean;
      }
    >,
    res: HttpResponse,
  ): Promise<void> {
    try {
      const segment = await updateSegmentUseCase.execute(
        req.params.segmentId,
        req.body as Parameters<typeof updateSegmentUseCase.execute>[1],
      );
      res.json({ success: true, data: segment.toJSON() });
    } catch (error) {
      if (error instanceof SegmentNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async deleteSegment(req: HttpRequest<{ segmentId: string }>, res: HttpResponse): Promise<void> {
    try {
      await deleteSegmentUseCase.execute(req.params.segmentId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof SegmentNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  // ── Segment Evaluation ────────────────────────────────────────

  async evaluateSegment(req: HttpRequest<{ segmentId: string }>, res: HttpResponse): Promise<void> {
    try {
      const result = await evaluateSegmentUseCase.execute(req.params.segmentId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getSegmentMembers(req: HttpRequest<{ segmentId: string }>, res: HttpResponse): Promise<void> {
    const members = await getSegmentMembersUseCase.execute(req.params.segmentId);
    res.json({ success: true, data: members.map(m => m.toJSON()) });
  }

  // ── Customer Profile ──────────────────────────────────────────

  async getCustomerProfile(req: HttpRequest<{ customerId: string }>, res: HttpResponse): Promise<void> {
    const profile = await getCustomerProfileUseCase.execute(req.params.customerId);
    if (!profile) {
      // Return a default empty profile instead of 404
      res.json({
        success: true,
        data: {
          customerId: req.params.customerId,
          totalOrders: 0,
          totalSpentCents: 0,
          avgOrderValue: 0,
          lastOrderDate: null,
          firstOrderDate: null,
          preferredCategories: [],
          preferredBrands: [],
          tags: [],
          customAttributes: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }
    res.json({ success: true, data: profile.toJSON() });
  }

  async listCustomerProfiles(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const profiles = await listCustomerProfilesUseCase.execute(limit, offset);
      res.json({ success: true, data: profiles.map(p => p.toJSON()) });
    } catch (err) {
      logger.error('Failed to list customer profiles', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      res.status(500).json({ success: false, error: 'Internal error' });
    }
  }

  async computeProfile(req: HttpRequest<{ customerId: string }>, res: HttpResponse): Promise<void> {
    const profile = await computeCustomerProfileUseCase.execute(req.params.customerId);
    if (!profile) {
      // Return a default empty profile instead of 404
      res.json({
        success: true,
        data: {
          customerId: req.params.customerId,
          totalOrders: 0,
          totalSpentCents: 0,
          avgOrderValue: 0,
          lastOrderDate: null,
          firstOrderDate: null,
          preferredCategories: [],
          preferredBrands: [],
          tags: [],
          customAttributes: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }
    res.json({ success: true, data: profile.toJSON() });
  }

  async recomputeAll(_req: HttpRequest, res: HttpResponse): Promise<void> {
    const count = await recomputeAllProfilesUseCase.execute();
    res.json({ success: true, data: { recomputed: count } });
  }

  // ── Customer Segments ─────────────────────────────────────────

  async getCustomerSegments(req: HttpRequest<{ customerId: string }>, res: HttpResponse): Promise<void> {
    const segments = await getCustomerSegmentsUseCase.execute(req.params.customerId);
    res.json({ success: true, data: segments });
  }
}

export default new SegmentController();
