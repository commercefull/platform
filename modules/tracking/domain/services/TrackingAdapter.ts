import { TrackingEvent } from '../entities/TrackingEvent';
import { TrackingConfig } from '../entities/TrackingConfig';

export interface TrackingAdapter {
  readonly providerName: string;
  send(event: TrackingEvent, config: TrackingConfig): Promise<TrackingSendResult>;
  validateConfig(config: TrackingConfig): boolean;
}

export interface TrackingSendResult {
  success: boolean;
  provider: string;
  eventId: string;
  response?: unknown;
  error?: string;
}
