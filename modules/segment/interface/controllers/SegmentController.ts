/**
 * Segment Controller
 *
 * HTTP interface for segment management.
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import { segmentRepository } from '../../infrastructure/repositories/SegmentRepository';
import { CreateSegmentUseCase, GetCustomerSegmentsUseCase } from '../../application/useCases';

export const createSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new CreateSegmentUseCase(segmentRepository);
    const result = await useCase.execute({
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      rules: req.body.rules,
      staticMemberIds: req.body.staticMemberIds,
      evaluationFrequency: req.body.evaluationFrequency,
      isActive: req.body.isActive,
      metadata: req.body.metadata,
    });
    res.status(201).json({ success: true, data: result.segment });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    const segment = await segmentRepository.findById(req.params.segmentId);
    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }
    res.json({ success: true, data: segment });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    const segment = await segmentRepository.findById(req.params.segmentId);
    if (!segment) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }

    segment.update({
      name: req.body.name,
      description: req.body.description,
      rules: req.body.rules,
      staticMemberIds: req.body.staticMemberIds,
      evaluationFrequency: req.body.evaluationFrequency,
      isActive: req.body.isActive,
      metadata: req.body.metadata,
    });

    const saved = await segmentRepository.save(segment);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listSegments = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await segmentRepository.findAll(
      {
        type: req.query.type as any,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string | undefined,
      },
      {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      },
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const evaluateSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    // For now, use repository directly for basic evaluation
    const memberIds = await segmentRepository.evaluateSegment(req.params.segmentId);
    await segmentRepository.updateMemberCount(req.params.segmentId, memberIds.length);
    res.json({
      success: true,
      data: {
        segmentId: req.params.segmentId,
        memberCount: memberIds.length,
        memberIds,
      },
    });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getCustomerSegments = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new GetCustomerSegmentsUseCase(segmentRepository);
    const result = await useCase.execute({ customerId: req.params.customerId });
    res.json({ success: true, data: result.segments });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await segmentRepository.delete(req.params.segmentId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Segment not found' });
      return;
    }
    res.json({ success: true, message: 'Segment deleted' });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export default {
  createSegment,
  getSegment,
  updateSegment,
  listSegments,
  evaluateSegment,
  getCustomerSegments,
  deleteSegment,
};
