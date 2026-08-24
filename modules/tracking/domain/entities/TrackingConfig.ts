/**
 * Tracking Configuration Entity
 *
 * Per-store configuration for server-side tracking.
 * Controls which tracking providers (GTM, Meta CAPI) are enabled,
 * their credentials, and which consent categories gate them.
 */

import { TrackingValidationError } from '../errors/TrackingErrors';
import { getDefaultEventMappings } from '../services/defaultEventMappings';

export type TrackingProvider = 'gtm' | 'meta_capi';
export type TrackingStatus = 'active' | 'disabled';

export interface GTMConfig {
  containerId: string;
  serverContainerUrl: string;
  /** GA4 measurement ID (optional, for GA4 events through GTM) */
  ga4MeasurementId?: string;
}

export interface MetaCAPIConfig {
  pixelId: string;
  accessToken: string;
  /** Test event code for Meta's event testing tool */
  testEventCode?: string;
  /** Whether to use the data layer for event matching */
  useDataLayer?: boolean;
}

export interface EventMapping {
  /** Source event type from the event bus (e.g. 'order.paid') */
  sourceEvent: string;
  /** Target event name for the provider (e.g. 'Purchase', 'PageView') */
  targetEvent: string;
  /** Which providers should receive this event */
  providers: TrackingProvider[];
  /** Consent category required to send this event */
  consentCategory: 'analytics' | 'marketing' | 'thirdParty';
}

export interface TrackingConfigProps {
  configId: string;
  storeId: string;
  organizationId: string;
  status: TrackingStatus;
  gtm: GTMConfig | null;
  metaCapi: MetaCAPIConfig | null;
  eventMappings: EventMapping[];
  /** Default consent category if not specified in mapping */
  defaultConsentCategory: 'analytics' | 'marketing' | 'thirdParty';
  /** Whether to hash PII (email, phone) before sending to providers */
  hashPii: boolean;
  /** Whether to send server-side events (vs client-side only) */
  serverSideEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TrackingConfig {
  private props: TrackingConfigProps;

  private constructor(props: TrackingConfigProps) {
    this.props = props;
  }

  static create(params: {
    configId: string;
    storeId: string;
    organizationId: string;
    gtm?: GTMConfig;
    metaCapi?: MetaCAPIConfig;
    eventMappings?: EventMapping[];
    defaultConsentCategory?: 'analytics' | 'marketing' | 'thirdParty';
    hashPii?: boolean;
    serverSideEnabled?: boolean;
    useDefaultMappings?: boolean;
  }): TrackingConfig {
    const now = new Date();

    if (!params.storeId?.trim()) throw new TrackingValidationError('Store ID is required');
    if (!params.organizationId?.trim()) throw new TrackingValidationError('Organization ID is required');
    if (!params.gtm && !params.metaCapi) {
      throw new TrackingValidationError('At least one tracking provider must be configured');
    }

    let eventMappings = params.eventMappings || [];
    if (params.useDefaultMappings !== false && !params.eventMappings) {
      eventMappings = getDefaultEventMappings();
    }

    return new TrackingConfig({
      configId: params.configId,
      storeId: params.storeId,
      organizationId: params.organizationId,
      status: 'active',
      gtm: params.gtm || null,
      metaCapi: params.metaCapi || null,
      eventMappings,
      defaultConsentCategory: params.defaultConsentCategory || 'marketing',
      hashPii: params.hashPii ?? true,
      serverSideEnabled: params.serverSideEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: TrackingConfigProps): TrackingConfig {
    return new TrackingConfig(props);
  }

  // Getters
  get configId(): string { return this.props.configId; }
  get storeId(): string { return this.props.storeId; }
  get organizationId(): string { return this.props.organizationId; }
  get status(): TrackingStatus { return this.props.status; }
  get gtm(): GTMConfig | null { return this.props.gtm; }
  get metaCapi(): MetaCAPIConfig | null { return this.props.metaCapi; }
  get eventMappings(): EventMapping[] { return this.props.eventMappings; }
  get defaultConsentCategory(): 'analytics' | 'marketing' | 'thirdParty' { return this.props.defaultConsentCategory; }
  get hashPii(): boolean { return this.props.hashPii; }
  get serverSideEnabled(): boolean { return this.props.serverSideEnabled; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  isGtmEnabled(): boolean { return this.props.gtm !== null && this.props.status === 'active'; }
  isMetaCapiEnabled(): boolean { return this.props.metaCapi !== null && this.props.status === 'active'; }
  isActive(): boolean { return this.props.status === 'active'; }

  /**
   * Find the event mapping for a given source event type
   */
  findMapping(sourceEvent: string): EventMapping | undefined {
    return this.props.eventMappings.find(m => m.sourceEvent === sourceEvent);
  }

  /**
   * Check if a provider should receive an event based on mapping
   */
  shouldSendToProvider(sourceEvent: string, provider: TrackingProvider): boolean {
    if (!this.isActive() || !this.serverSideEnabled) return false;
    const mapping = this.findMapping(sourceEvent);
    if (!mapping) return false;
    return mapping.providers.includes(provider);
  }

  /**
   * Get the consent category required for an event
   */
  getConsentCategory(sourceEvent: string): 'analytics' | 'marketing' | 'thirdParty' {
    const mapping = this.findMapping(sourceEvent);
    return mapping?.consentCategory || this.props.defaultConsentCategory;
  }

  // Mutations
  activate(): void {
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  disable(): void {
    this.props.status = 'disabled';
    this.props.updatedAt = new Date();
  }

  updateGtm(config: GTMConfig): void {
    this.props.gtm = config;
    this.props.updatedAt = new Date();
  }

  removeGtm(): void {
    if (!this.props.metaCapi) {
      throw new TrackingValidationError('Cannot remove GTM — at least one provider must remain');
    }
    this.props.gtm = null;
    this.props.updatedAt = new Date();
  }

  updateMetaCapi(config: MetaCAPIConfig): void {
    this.props.metaCapi = config;
    this.props.updatedAt = new Date();
  }

  removeMetaCapi(): void {
    if (!this.props.gtm) {
      throw new TrackingValidationError('Cannot remove Meta CAPI — at least one provider must remain');
    }
    this.props.metaCapi = null;
    this.props.updatedAt = new Date();
  }

  addEventMapping(mapping: EventMapping): void {
    const existing = this.findMapping(mapping.sourceEvent);
    if (existing) {
      throw new TrackingValidationError(`Mapping for event '${mapping.sourceEvent}' already exists`);
    }
    this.props.eventMappings.push(mapping);
    this.props.updatedAt = new Date();
  }

  removeEventMapping(sourceEvent: string): void {
    this.props.eventMappings = this.props.eventMappings.filter(m => m.sourceEvent !== sourceEvent);
    this.props.updatedAt = new Date();
  }

  updateEventMapping(sourceEvent: string, updates: Partial<EventMapping>): void {
    const mapping = this.findMapping(sourceEvent);
    if (!mapping) {
      throw new TrackingValidationError(`Mapping for event '${sourceEvent}' not found`);
    }
    if (updates.targetEvent !== undefined) mapping.targetEvent = updates.targetEvent;
    if (updates.providers !== undefined) mapping.providers = updates.providers;
    if (updates.consentCategory !== undefined) mapping.consentCategory = updates.consentCategory;
    this.props.updatedAt = new Date();
  }

  setHashPii(enabled: boolean): void {
    this.props.hashPii = enabled;
    this.props.updatedAt = new Date();
  }

  setServerSideEnabled(enabled: boolean): void {
    this.props.serverSideEnabled = enabled;
    this.props.updatedAt = new Date();
  }

  setDefaultConsentCategory(category: 'analytics' | 'marketing' | 'thirdParty'): void {
    this.props.defaultConsentCategory = category;
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.props,
      isGtmEnabled: this.isGtmEnabled(),
      isMetaCapiEnabled: this.isMetaCapiEnabled(),
    };
  }
}
