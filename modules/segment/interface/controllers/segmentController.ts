import { Response } from 'express';
import { TypedRequest } from '../../../../libs/types/express';
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

class SegmentController {
  // ── Segment CRUD ──────────────────────────────────────────────

  async listSegments(req: TypedRequest, res: Response): Promise<void> {
    const activeOnly = req.query.activeOnly === 'true';
    const segments = await listSegmentsUseCase.execute(activeOnly);
    res.json({ success: true, data: segments.map(s => s.toJSON()) });
  }

  async getSegment(req: TypedRequest<{ segmentId: string }>, res: Response): Promise<void> {
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

  async createSegment(req: TypedRequest<Record<string, never>, Record<string, never>, {
    name: string;
    code: string;
    description?: string;
    conditions: Array<{ field: string; operator: string; value?: unknown; values?: unknown[] }>;
    matchMode?: 'all' | 'any';
    color?: string;
    icon?: string;
    organizationId?: string;
  }>, res: Response): Promise<void> {
    try {
      const segment = await createSegmentUseCase.execute(req.body as Parameters<typeof createSegmentUseCase.execute>[0]);
      res.status(201).json({ success: true, data: segment.toJSON() });
    } catch (error) {
      if (error instanceof SegmentAlreadyExistsError || error instanceof InvalidSegmentConditionsError) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async updateSegment(req: TypedRequest<{ segmentId: string }, Record<string, never>, {
    name?: string;
    description?: string;
    conditions?: Array<{ field: string; operator: string; value?: unknown; values?: unknown[] }>;
    matchMode?: 'all' | 'any';
    color?: string;
    icon?: string;
    isActive?: boolean;
  }>, res: Response): Promise<void> {
    try {
      const segment = await updateSegmentUseCase.execute(req.params.segmentId, req.body as Parameters<typeof updateSegmentUseCase.execute>[1]);
      res.json({ success: true, data: segment.toJSON() });
    } catch (error) {
      if (error instanceof SegmentNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async deleteSegment(req: TypedRequest<{ segmentId: string }>, res: Response): Promise<void> {
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

  async evaluateSegment(req: TypedRequest<{ segmentId: string }>, res: Response): Promise<void> {
    try {
      const result = await evaluateSegmentUseCase.execute(req.params.segmentId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async getSegmentMembers(req: TypedRequest<{ segmentId: string }>, res: Response): Promise<void> {
    const members = await getSegmentMembersUseCase.execute(req.params.segmentId);
    res.json({ success: true, data: members.map(m => m.toJSON()) });
  }

  // ── Customer Profile ──────────────────────────────────────────

  async getCustomerProfile(req: TypedRequest<{ customerId: string }>, res: Response): Promise<void> {
    const profile = await getCustomerProfileUseCase.execute(req.params.customerId);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }
    res.json({ success: true, data: profile.toJSON() });
  }

  async listCustomerProfiles(req: TypedRequest, res: Response): Promise<void> {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const profiles = await listCustomerProfilesUseCase.execute(limit, offset);
    res.json({ success: true, data: profiles.map(p => p.toJSON()) });
  }

  async computeProfile(req: TypedRequest<{ customerId: string }>, res: Response): Promise<void> {
    const profile = await computeCustomerProfileUseCase.execute(req.params.customerId);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: profile.toJSON() });
  }

  async recomputeAll(_req: TypedRequest, res: Response): Promise<void> {
    const count = await recomputeAllProfilesUseCase.execute();
    res.json({ success: true, data: { recomputed: count } });
  }

  // ── Customer Segments ─────────────────────────────────────────

  async getCustomerSegments(req: TypedRequest<{ customerId: string }>, res: Response): Promise<void> {
    const segments = await getCustomerSegmentsUseCase.execute(req.params.customerId);
    res.json({ success: true, data: segments });
  }
}

export default new SegmentController();
