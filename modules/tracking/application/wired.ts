import { TrackingConfigRepositoryImpl } from '../infrastructure/repositories/TrackingConfigRepositoryImpl';
import { ManageTrackingConfigUseCase } from './useCases/ManageTrackingConfig';
import { ProcessTrackingEventUseCase } from './useCases/ProcessTrackingEvent';
import { GetTrackingStatusUseCase } from './useCases/GetTrackingStatus';

const trackingConfigRepository = new TrackingConfigRepositoryImpl();

export const manageTrackingConfigUseCase = new ManageTrackingConfigUseCase(trackingConfigRepository);
export const processTrackingEventUseCase = new ProcessTrackingEventUseCase(trackingConfigRepository);
export const getTrackingStatusUseCase = new GetTrackingStatusUseCase(trackingConfigRepository);

export { TrackingConfigRepositoryImpl };
