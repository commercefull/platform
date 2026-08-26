/**
 * IntegrationLog Entity
 *
 * Tracks each dispatch attempt to a third-party service.
 */

export type LogStatus = 'success' | 'failed' | 'pending' | 'retrying';

export interface IntegrationLogProps {
  logId: string;
  integrationId: string;
  subscriptionId: string | null;
  eventType: string;
  targetAction: string;
  status: LogStatus;
  requestPayload: Record<string, unknown> | null;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
}

export class IntegrationLog {
  private props: IntegrationLogProps;

  private constructor(props: IntegrationLogProps) {
    this.props = props;
  }

  static create(params: {
    logId: string;
    integrationId: string;
    subscriptionId?: string;
    eventType: string;
    targetAction: string;
    requestPayload?: Record<string, unknown>;
  }): IntegrationLog {
    return new IntegrationLog({
      logId: params.logId,
      integrationId: params.integrationId,
      subscriptionId: params.subscriptionId ?? null,
      eventType: params.eventType,
      targetAction: params.targetAction,
      status: 'pending',
      requestPayload: params.requestPayload ?? null,
      responseStatus: null,
      responseBody: null,
      errorMessage: null,
      durationMs: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: IntegrationLogProps): IntegrationLog {
    return new IntegrationLog(props);
  }

  get logId(): string { return this.props.logId; }
  get integrationId(): string { return this.props.integrationId; }
  get subscriptionId(): string | null { return this.props.subscriptionId; }
  get eventType(): string { return this.props.eventType; }
  get targetAction(): string { return this.props.targetAction; }
  get status(): LogStatus { return this.props.status; }
  get requestPayload(): Record<string, unknown> | null { return this.props.requestPayload; }
  get responseStatus(): number | null { return this.props.responseStatus; }
  get responseBody(): string | null { return this.props.responseBody; }
  get errorMessage(): string | null { return this.props.errorMessage; }
  get durationMs(): number | null { return this.props.durationMs; }
  get createdAt(): Date { return this.props.createdAt; }

  markSuccess(responseStatus: number, responseBody: string, durationMs: number): void {
    this.props.status = 'success';
    this.props.responseStatus = responseStatus;
    this.props.responseBody = responseBody;
    this.props.durationMs = durationMs;
    this.props.errorMessage = null;
  }

  markFailed(errorMessage: string, responseStatus: number | null, responseBody: string | null, durationMs: number): void {
    this.props.status = 'failed';
    this.props.errorMessage = errorMessage;
    this.props.responseStatus = responseStatus;
    this.props.responseBody = responseBody;
    this.props.durationMs = durationMs;
  }

  markRetrying(): void {
    this.props.status = 'retrying';
  }

  toJSON(): Record<string, unknown> {
    return {
      logId: this.props.logId,
      integrationId: this.props.integrationId,
      subscriptionId: this.props.subscriptionId,
      eventType: this.props.eventType,
      targetAction: this.props.targetAction,
      status: this.props.status,
      requestPayload: this.props.requestPayload,
      responseStatus: this.props.responseStatus,
      responseBody: this.props.responseBody,
      errorMessage: this.props.errorMessage,
      durationMs: this.props.durationMs,
      createdAt: this.props.createdAt,
    };
  }
}
