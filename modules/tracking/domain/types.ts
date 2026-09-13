export type TrackingProvider = 'gtm' | 'meta_capi';

export interface EventMapping {
  sourceEvent: string;
  targetEvent: string;
  providers: TrackingProvider[];
  consentCategory: 'analytics' | 'marketing' | 'thirdParty';
}
