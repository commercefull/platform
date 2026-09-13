export * from './domain/entities/SegmentDefinition';
export * from './domain/entities/CustomerProfile';
export * from './domain/services/ConditionEvaluator';
export * from './domain/errors/SegmentErrors';
export * from './domain/repositories/SegmentRepository';
export * from './infrastructure';
export * from './application/useCases';

// Interface exports (routers, GraphQL)
export { segmentBusinessRouter } from './interface/routers/segmentRouter';
export {
  listSegments,
  viewSegment,
  createSegmentForm,
  createSegment,
  editSegmentForm,
  updateSegment,
  deleteSegment,
  evaluateSegment,
  viewSegmentMembers,
} from './interface/controllers/adminSegmentController';
