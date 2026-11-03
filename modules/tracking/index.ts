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

// Domain entity exports
export { TrackingStatus, GTMConfig, MetaCAPIConfig, TrackingConfigProps, TrackingConfig } from './domain/entities/TrackingConfig';
export { TrackingUserData, TrackingEcommerceData, TrackingEventProps, TrackingEvent } from './domain/entities/TrackingEvent';
