/**
 * DeliveryPromise — Estimated Delivery Window Value Object
 *
 * The delivery promise made for a shipFrom → shipTo fulfillment lane: the
 * promised window, the source (store or warehouse), carrier/service level,
 * and how confident the estimate is. Surfaces in checkout shipping options
 * and on the order's fulfillment groups — it is a promise to the customer,
 * not an internal guess, so it carries `isEstimate` + `confidence` so a
 * degraded estimate is never presented as a firm promise.
 */

export interface DeliveryPromiseProps {
  /** Fulfilling source — store id or distribution warehouse id. */
  sourceId: string;
  sourceType: 'store' | 'warehouse';
  /** Ship-from location (ISO-2 country, optional postal code for lane detail). */
  shipFrom: { country: string; postalCode?: string };
  /** Ship-to location (ISO-2 country, optional postal code). */
  shipTo: { country: string; postalCode?: string };
  /** Carrier + service level backing the promise (when rate-shopped). */
  carrier?: string;
  serviceLevel?: string;
  /** Earliest and latest expected delivery dates (inclusive). */
  earliestDate: Date;
  latestDate: Date;
  /** Same-day shipping cut-off local time (HH:mm) at the source. */
  cutoffTime?: string;
  /** Confidence in the window — 'high' | 'medium' | 'low'. */
  confidence: 'high' | 'medium' | 'low';
  /** True when the dates are an estimate rather than a committed promise. */
  isEstimate: boolean;
}

export class DeliveryPromise {
  private constructor(private readonly props: DeliveryPromiseProps) {
    if (props.latestDate.getTime() < props.earliestDate.getTime()) {
      throw new Error('DeliveryPromise latestDate must be on or after earliestDate');
    }
  }

  static create(props: DeliveryPromiseProps): DeliveryPromise {
    return new DeliveryPromise(props);
  }

  static reconstitute(props: DeliveryPromiseProps): DeliveryPromise {
    return new DeliveryPromise(props);
  }

  get sourceId(): string {
    return this.props.sourceId;
  }
  get sourceType(): 'store' | 'warehouse' {
    return this.props.sourceType;
  }
  get shipFrom(): DeliveryPromiseProps['shipFrom'] {
    return { ...this.props.shipFrom };
  }
  get shipTo(): DeliveryPromiseProps['shipTo'] {
    return { ...this.props.shipTo };
  }
  get carrier(): string | undefined {
    return this.props.carrier;
  }
  get serviceLevel(): string | undefined {
    return this.props.serviceLevel;
  }
  get earliestDate(): Date {
    return new Date(this.props.earliestDate.getTime());
  }
  get latestDate(): Date {
    return new Date(this.props.latestDate.getTime());
  }
  get cutoffTime(): string | undefined {
    return this.props.cutoffTime;
  }
  get confidence(): 'high' | 'medium' | 'low' {
    return this.props.confidence;
  }
  get isEstimate(): boolean {
    return this.props.isEstimate;
  }

  /** Transit window in whole days between the promise bounds. */
  transitDays(): number {
    const ms = this.props.latestDate.getTime() - this.props.earliestDate.getTime();
    return Math.round(ms / (24 * 60 * 60 * 1000));
  }

  /** Whether the promise window is already past at `at` (defaults to now). */
  isLate(at: Date = new Date()): boolean {
    return at.getTime() > this.props.latestDate.getTime();
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.props,
      shipFrom: this.shipFrom,
      shipTo: this.shipTo,
      earliestDate: this.props.earliestDate.toISOString(),
      latestDate: this.props.latestDate.toISOString(),
    };
  }
}
