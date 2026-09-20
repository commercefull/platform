/**
 * Segment Admin UI Controller
 * Admin views for managing customer segments
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import {
  createSegmentUseCase,
  updateSegmentUseCase,
  deleteSegmentUseCase,
  getSegmentUseCase,
  listSegmentsUseCase,
  evaluateSegmentUseCase,
  getSegmentMembersUseCase,
} from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

export const listSegments = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const activeOnly = req.query.activeOnly === 'true';
  const segments = await listSegmentsUseCase.execute(activeOnly);

  adminRespond(req, res, 'segment/index', {
    pageName: 'Customer Segments',
    segments: segments.map(s => s.toJSON()),
    activeOnly,
    success: req.query.success || null,
  });
};

export const viewSegment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { segmentId } = req.params;
  const segment = await getSegmentUseCase.execute(segmentId);

  if (!segment) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Segment not found' });
    return;
  }

  adminRespond(req, res, 'segment/view', {
    pageName: `Segment: ${segment.name}`,
    segment: segment.toJSON(),
    success: req.query.success || null,
  });
};

export const createSegmentForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'segment/create', { pageName: 'Create Segment' });
};

export const createSegment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const segment = await createSegmentUseCase.execute(body as Parameters<typeof createSegmentUseCase.execute>[0]);
  res.redirect(`/admin/segments/${segment.segmentId}?success=Segment created successfully`);
};

export const editSegmentForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { segmentId } = req.params;
  const segment = await getSegmentUseCase.execute(segmentId);

  if (!segment) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Segment not found' });
    return;
  }

  adminRespond(req, res, 'segment/edit', {
    pageName: `Edit: ${segment.name}`,
    segment: segment.toJSON(),
  });
};

export const updateSegment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { segmentId } = req.params;
  const body = req.body as HttpRequestBody;
  await updateSegmentUseCase.execute(segmentId, body as Parameters<typeof updateSegmentUseCase.execute>[1]);
  res.redirect(`/admin/segments/${segmentId}?success=Segment updated successfully`);
};

export const deleteSegment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { segmentId } = req.params;
  await deleteSegmentUseCase.execute(segmentId);
  res.redirect('/admin/segments?success=Segment deleted');
};

export const evaluateSegment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { segmentId } = req.params;
  const result = await evaluateSegmentUseCase.execute(segmentId);
  res.redirect(`/admin/segments/${segmentId}?success=Segment evaluated: ${result.matched} customers matched`);
};

export const viewSegmentMembers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { segmentId } = req.params;
  const segment = await getSegmentUseCase.execute(segmentId);

  if (!segment) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Segment not found' });
    return;
  }

  const members = await getSegmentMembersUseCase.execute(segmentId);

  adminRespond(req, res, 'segment/members', {
    pageName: `Members: ${segment.name}`,
    segment: segment.toJSON(),
    members: members.map(m => m.toJSON()),
  });
};
