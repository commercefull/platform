import { jsonResponse } from 'libs/apiResponse';
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

class SegmentController {
  // ── Segment CRUD ──────────────────────────────────────────────

  listSegments = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const activeOnly = req.query.activeOnly === 'true';
    const segments = await listSegmentsUseCase.execute(activeOnly);
    jsonResponse(res, 200, { success: true, data: segments.map(s => s.toJSON()) });
  };

  getSegment = async (req: HttpRequest<{ segmentId: string }>, res: HttpResponse): Promise<void> => {
    const segment = await getSegmentUseCase.execute(req.params.segmentId);
    jsonResponse(res, 200, { success: true, data: segment.toJSON() });
  };

  createSegment = async (
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
  ): Promise<void> => {
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
    jsonResponse(res, 201, { success: true, data: segment.toJSON() });
  };

  updateSegment = async (
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
  ): Promise<void> => {
    const segment = await updateSegmentUseCase.execute(
      req.params.segmentId,
      req.body as Parameters<typeof updateSegmentUseCase.execute>[1],
    );
    jsonResponse(res, 200, { success: true, data: segment.toJSON() });
  };

  deleteSegment = async (req: HttpRequest<{ segmentId: string }>, res: HttpResponse): Promise<void> => {
    await deleteSegmentUseCase.execute(req.params.segmentId);
    jsonResponse(res, 200, { success: true });
  };

  // ── Segment Evaluation ────────────────────────────────────────

  evaluateSegment = async (req: HttpRequest<{ segmentId: string }>, res: HttpResponse): Promise<void> => {
    const result = await evaluateSegmentUseCase.execute(req.params.segmentId);
    jsonResponse(res, 200, { success: true, data: result });
  };

  getSegmentMembers = async (req: HttpRequest<{ segmentId: string }>, res: HttpResponse): Promise<void> => {
    const members = await getSegmentMembersUseCase.execute(req.params.segmentId);
    jsonResponse(res, 200, { success: true, data: members.map(m => m.toJSON()) });
  };

  // ── Customer Profile ──────────────────────────────────────────

  getCustomerProfile = async (req: HttpRequest<{ customerId: string }>, res: HttpResponse): Promise<void> => {
    const profile = await getCustomerProfileUseCase.execute(req.params.customerId);
    if (!profile) {
      // Return a default empty profile instead of 404
      jsonResponse(res, 200, {
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
    jsonResponse(res, 200, { success: true, data: profile.toJSON() });
  };

  listCustomerProfiles = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const profiles = await listCustomerProfilesUseCase.execute(limit, offset);
    jsonResponse(res, 200, { success: true, data: profiles.map(p => p.toJSON()) });
  };

  computeProfile = async (req: HttpRequest<{ customerId: string }>, res: HttpResponse): Promise<void> => {
    const profile = await computeCustomerProfileUseCase.execute(req.params.customerId);
    if (!profile) {
      // Return a default empty profile instead of 404
      jsonResponse(res, 200, {
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
    jsonResponse(res, 200, { success: true, data: profile.toJSON() });
  };

  recomputeAll = async (_req: HttpRequest, res: HttpResponse): Promise<void> => {
    const count = await recomputeAllProfilesUseCase.execute();
    jsonResponse(res, 200, { success: true, data: { recomputed: count } });
  };

  // ── Customer Segments ─────────────────────────────────────────

  getCustomerSegments = async (req: HttpRequest<{ customerId: string }>, res: HttpResponse): Promise<void> => {
    const segments = await getCustomerSegmentsUseCase.execute(req.params.customerId);
    jsonResponse(res, 200, { success: true, data: segments });
  };
}

export default new SegmentController();
