/**
 * GDPR Data Request Entity
 * Represents a customer's request for data export, deletion, or other GDPR rights
 */

export type GdprRequestType =
  | 'export' // Article 20 - Data portability
  | 'deletion' // Article 17 - Right to erasure
  | 'rectification' // Article 16 - Right to rectification
  | 'restriction' // Article 18 - Right to restriction
  | 'access' // Article 15 - Right of access
  | 'objection'; // Article 21 - Right to object

export type GdprRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled' | 'failed';

export interface GdprDataRequestProps {
  gdprDataRequestId: string;
  customerId: string;
  requestType: GdprRequestType;
  status: GdprRequestStatus;
  reason?: string;
  requestedData?: string[]; // Data categories requested
  // Export fields
  downloadUrl?: string;
  downloadExpiresAt?: Date;
  downloadFormat?: 'json' | 'csv' | 'xml';
  // Processing
  processedAt?: Date;
  processedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
  // Verification
  identityVerified: boolean;
  verificationMethod?: string;
  verifiedAt?: Date;
  // Compliance tracking
  deadlineAt: Date;
  extensionRequested: boolean;
  extensionReason?: string;
  extendedDeadlineAt?: Date;
  // Audit
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GdprDataRequest {
  private props: GdprDataRequestProps;

  private constructor(props: GdprDataRequestProps) {
    this.props = props;
  }

  /**
   * Create a new GDPR data request
   */
  static create(params: {
    gdprDataRequestId: string;
    customerId: string;
    requestType: GdprRequestType;
    reason?: string;
    requestedData?: string[];
    ipAddress?: string;
    userAgent?: string;
  }): GdprDataRequest {
    const now = new Date();
    // GDPR requires response within 30 days
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 30);

    return new GdprDataRequest({
      gdprDataRequestId: params.gdprDataRequestId,
      customerId: params.customerId,
      requestType: params.requestType,
      status: 'pending',
      reason: params.reason,
      requestedData: params.requestedData,
      identityVerified: false,
      deadlineAt: deadline,
      extensionRequested: false,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: GdprDataRequestProps): GdprDataRequest {
    return new GdprDataRequest(props);
  }

  // Getters
  get gdprDataRequestId(): string {
    return this.props.gdprDataRequestId;
  }
  get customerId(): string {
    return this.props.customerId;
  }
  get requestType(): GdprRequestType {
    return this.props.requestType;
  }
  get status(): GdprRequestStatus {
    return this.props.status;
  }
  get reason(): string | undefined {
    return this.props.reason;
  }
  get requestedData(): string[] | undefined {
    return this.props.requestedData;
  }
  get downloadUrl(): string | undefined {
    return this.props.downloadUrl;
  }
  get downloadExpiresAt(): Date | undefined {
    return this.props.downloadExpiresAt;
  }
  get downloadFormat(): string | undefined {
    return this.props.downloadFormat;
  }
  get processedAt(): Date | undefined {
    return this.props.processedAt;
  }
  get processedBy(): string | undefined {
    return this.props.processedBy;
  }
  get adminNotes(): string | undefined {
    return this.props.adminNotes;
  }
  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }
  get identityVerified(): boolean {
    return this.props.identityVerified;
  }
  get verificationMethod(): string | undefined {
    return this.props.verificationMethod;
  }
  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }
  get deadlineAt(): Date {
    return this.props.deadlineAt;
  }
  get extensionRequested(): boolean {
    return this.props.extensionRequested;
  }
  get extensionReason(): string | undefined {
    return this.props.extensionReason;
  }
  get extendedDeadlineAt(): Date | undefined {
    return this.props.extendedDeadlineAt;
  }
  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }
  get userAgent(): string | undefined {
    return this.props.userAgent;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if request is overdue
   */
  isOverdue(): boolean {
    const deadline = this.props.extendedDeadlineAt || this.props.deadlineAt;
    return new Date() > deadline && !['completed', 'rejected', 'cancelled'].includes(this.props.status);
  }

  /**
   * Check if request can be processed
   */
  canProcess(): boolean {
    return this.props.status === 'pending' && this.props.identityVerified;
  }

  /**
   * Start processing the request
   */
  startProcessing(): void {
    if (this.props.status !== 'pending') {
      throw new Error('Can only start processing pending requests');
    }
    this.props.status = 'processing';
    this.props.updatedAt = new Date();
  }

  /**
   * Verify customer identity
   */
  verifyIdentity(method: string): void {
    this.props.identityVerified = true;
    this.props.verificationMethod = method;
    this.props.verifiedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Complete the request (for export requests)
   */
  completeWithDownload(downloadUrl: string, format: 'json' | 'csv' | 'xml', adminId: string): void {
    if (this.props.status !== 'processing') {
      throw new Error('Can only complete requests that are being processed');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Download expires in 7 days

    this.props.status = 'completed';
    this.props.downloadUrl = downloadUrl;
    this.props.downloadFormat = format;
    this.props.downloadExpiresAt = expiresAt;
    this.props.processedAt = new Date();
    this.props.processedBy = adminId;
    this.props.updatedAt = new Date();
  }

  /**
   * Complete the request (for deletion/other requests)
   */
  complete(adminId: string, notes?: string): void {
    if (this.props.status !== 'processing') {
      throw new Error('Can only complete requests that are being processed');
    }
    this.props.status = 'completed';
    this.props.processedAt = new Date();
    this.props.processedBy = adminId;
    this.props.adminNotes = notes;
    this.props.updatedAt = new Date();
  }

  /**
   * Reject the request
   */
  reject(adminId: string, reason: string): void {
    if (!['pending', 'processing'].includes(this.props.status)) {
      throw new Error('Can only reject pending or processing requests');
    }
    this.props.status = 'rejected';
    this.props.rejectionReason = reason;
    this.props.processedAt = new Date();
    this.props.processedBy = adminId;
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel the request (by customer)
   */
  cancel(): void {
    if (!['pending', 'processing'].includes(this.props.status)) {
      throw new Error('Can only cancel pending or processing requests');
    }
    this.props.status = 'cancelled';
    this.props.updatedAt = new Date();
  }

  /**
   * Request deadline extension
   */
  requestExtension(reason: string): void {
    if (this.props.extensionRequested) {
      throw new Error('Extension already requested');
    }

    const extendedDeadline = new Date(this.props.deadlineAt);
    extendedDeadline.setDate(extendedDeadline.getDate() + 60); // Additional 60 days per GDPR

    this.props.extensionRequested = true;
    this.props.extensionReason = reason;
    this.props.extendedDeadlineAt = extendedDeadline;
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      isOverdue: this.isOverdue(),
    };
  }
}
