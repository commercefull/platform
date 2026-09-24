export { TrackingConfig, GTMConfig, MetaCAPIConfig, EventMapping } from './domain/entities/TrackingConfig';
export { TrackingEvent } from './domain/entities/TrackingEvent';
export { TrackingAdapter, TrackingSendResult } from './domain/services/TrackingAdapter';
export { GTMServerAdapter } from './domain/services/GTMServerAdapter';
export { MetaCAPIAdapter } from './domain/services/MetaCAPIAdapter';
export { getDefaultEventMappings } from './domain/services/defaultEventMappings';
export { TrackingConfigRepository } from './domain/repositories/TrackingConfigRepository';
export { TrackingConfigRepositoryImpl } from './infrastructure/repositories/TrackingConfigRepositoryImpl';
export { ManageTrackingConfigUseCase } from './application/useCases/ManageTrackingConfig';
export { ProcessTrackingEventUseCase } from './application/useCases/ProcessTrackingEvent';
export { GetTrackingStatusUseCase } from './application/useCases/GetTrackingStatus';
export { registerTrackingEventHandlers, setConsentRepository } from './application/eventHandlers/trackingEventHandlers';
export { trackingBusinessRouter } from './interface/routers/trackingRouter';
export {
  listTrackingConfigs,
  viewTrackingConfig,
  createTrackingConfigForm,
  createTrackingConfig,
  editTrackingConfigForm,
  activateTrackingConfig,
  disableTrackingConfig,
  deleteTrackingConfig,
} from './interface/controllers/adminTrackingController';
