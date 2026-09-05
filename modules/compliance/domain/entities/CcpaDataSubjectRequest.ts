 
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * CCPA Data Subject Request Entity
 *
 * Extends the GDPR data request concept with CCPA-specific rights:
 * - Right to know (what personal data is collected/sold)
 * - Right to delete
 * - Right to opt-out of sale
 * - Right to non-discrimination
 *
 * CCPA requires response within 45 days (vs GDPR's 30 days).
 */

import { ComplianceValidationError, DsrStatusError } from '../errors/ComplianceErrors';

export type CcpaRequestType =
  | 'know'          // Right to know what data is collected
  | 'delete'        // Right to delete
  | 'optOutSale'    // Right to opt-out of sale of personal data
  | 'optOutShare'   // Right to opt-out of sharing (as of CPRA)
  | 'limitUse'      // Right to limit use of sensitive personal data (CPRA)
  | 'correct';      // Right to correct inaccurate personal data (CPRA)

export type CcpaRequestStatus = 'pending' | 'verified' | 'processing' | 'completed' | 'rejected' | 'cancelled';

export type CcpaRequestSource = 'web' | 'email' | 'phone' | 'toll_free_number' | 'authorizedAgent';

export interface CcpaDataSubjectRequestProps {
  ccpaDsrId: string;
  customerId: string;
  organizationId: string;
  requestType: CcpaRequestType;
  status: CcpaRequestStatus;
  source: CcpaRequestSource;
  reason?: string;
  // Verification
  identityVerified: boolean;
  verificationMethod?: string;
  verifiedAt?: Date;
  authorizedAgent?: string;
  // SLA tracking
  requestedAt: Date;
  deadlineAt: Date;
  extensionRequested: boolean;
  extensionReason?: string;
  extendedDeadlineAt?: Date;
  completedAt?: Date;
  // Processing
  processedBy?: string;
  adminNotes?: string;
  rejectionReason?: string;
  // Data categories (for "know" requests)
  dataCategoriesRequested?: string[];
  // Export fields
  downloadUrl?: string;
  downloadExpiresAt?: Date;
  // Audit
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CCPA_DEADLINE_DAYS = 45;
const CCPA_EXTENSION_DAYS = 45;
const CCPA_MAX_EXTENSIONS = 1;

export class CcpaDataSubjectRequest {
  private props: CcpaDataSubjectRequestProps;

  private constructor(props: CcpaDataSubjectRequestProps) {
    this.props = props;
  }

  static create(params: {
    ccpaDsrId: string;
    customerId: string;
    organizationId: string;
    requestType: CcpaRequestType;
    source: CcpaRequestSource;
    reason?: string;
    authorizedAgent?: string;
    dataCategoriesRequested?: string[];
    ipAddress?: string;
    userAgent?: string;
  }): CcpaDataSubjectRequest {
    const now = new Date();
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + CCPA_DEADLINE_DAYS);

    return new CcpaDataSubjectRequest({
      ccpaDsrId: params.ccpaDsrId,
      customerId: params.customerId,
      organizationId: params.organizationId,
      requestType: params.requestType,
      status: 'pending',
      source: params.source,
      reason: params.reason,
      identityVerified: false,
      authorizedAgent: params.authorizedAgent,
      dataCategoriesRequested: params.dataCategoriesRequested,
      requestedAt: now,
      deadlineAt: deadline,
      extensionRequested: false,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: CcpaDataSubjectRequestProps): CcpaDataSubjectRequest {
    return new CcpaDataSubjectRequest(props);
  }

  // Getters
  get ccpaDsrId(): string { return this.props.ccpaDsrId; }
  get customerId(): string { return this.props.customerId; }
  get organizationId(): string { return this.props.organizationId; }
  get requestType(): CcpaRequestType { return this.props.requestType; }
  get status(): CcpaRequestStatus { return this.props.status; }
  get source(): CcpaRequestSource { return this.props.source; }
  get reason(): string | undefined { return this.props.reason; }
  get identityVerified(): boolean { return this.props.identityVerified; }
  get verificationMethod(): string | undefined { return this.props.verificationMethod; }
  get verifiedAt(): Date | undefined { return this.props.verifiedAt; }
  get authorizedAgent(): string | undefined { return this.props.authorizedAgent; }
  get requestedAt(): Date { return this.props.requestedAt; }
  get deadlineAt(): Date { return this.props.deadlineAt; }
  get extensionRequested(): boolean { return this.props.extensionRequested; }
  get extensionReason(): string | undefined { return this.props.extensionReason; }
  get extendedDeadlineAt(): Date | undefined { return this.props.extendedDeadlineAt; }
  get completedAt(): Date | undefined { return this.props.completedAt; }
  get processedBy(): string | undefined { return this.props.processedBy; }
  get adminNotes(): string | undefined { return this.props.adminNotes; }
  get rejectionReason(): string | undefined { return this.props.rejectionReason; }
  get dataCategoriesRequested(): string[] | undefined { return this.props.dataCategoriesRequested; }
  get downloadUrl(): string | undefined { return this.props.downloadUrl; }
  get downloadExpiresAt(): Date | undefined { return this.props.downloadExpiresAt; }
  get ipAddress(): string | undefined { return this.props.ipAddress; }
  get userAgent(): string | undefined { return this.props.userAgent; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  isOverdue(): boolean {
    const deadline = this.props.extendedDeadlineAt || this.props.deadlineAt;
    return new Date() > deadline && !['completed', 'rejected', 'cancelled'].includes(this.props.status);
  }

  daysUntilDeadline(): number {
    const deadline = this.props.extendedDeadlineAt || this.props.deadlineAt;
    const diff = deadline.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  canProcess(): boolean {
    return this.props.status === 'verified' && this.props.identityVerified;
  }

  verifyIdentity(method: string): void {
    if (this.props.status !== 'pending') {
      throw new DsrStatusError(`Cannot verify identity in status: ${this.props.status}`);
    }
    this.props.identityVerified = true;
    this.props.verificationMethod = method;
    this.props.verifiedAt = new Date();
    this.props.status = 'verified';
    this.props.updatedAt = new Date();
  }

  startProcessing(): void {
    if (this.props.status !== 'verified') {
      throw new DsrStatusError(`Can only start processing verified requests`);
    }
    this.props.status = 'processing';
    this.props.updatedAt = new Date();
  }

  completeWithDownload(downloadUrl: string, adminId: string): void {
    if (this.props.status !== 'processing') {
      throw new DsrStatusError(`Can only complete processing requests`);
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    this.props.status = 'completed';
    this.props.downloadUrl = downloadUrl;
    this.props.downloadExpiresAt = expiresAt;
    this.props.completedAt = new Date();
    this.props.processedBy = adminId;
    this.props.updatedAt = new Date();
  }

  complete(adminId: string, notes?: string): void {
    if (this.props.status !== 'processing') {
      throw new DsrStatusError(`Can only complete processing requests`);
    }
    this.props.status = 'completed';
    this.props.completedAt = new Date();
    this.props.processedBy = adminId;
    this.props.adminNotes = notes;
    this.props.updatedAt = new Date();
  }

  reject(adminId: string, reason: string): void {
    if (!['pending', 'verified', 'processing'].includes(this.props.status)) {
      throw new DsrStatusError(`Can only reject pending, verified, or processing requests`);
    }
    this.props.status = 'rejected';
    this.props.rejectionReason = reason;
    this.props.processedBy = adminId;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (!['pending', 'verified', 'processing'].includes(this.props.status)) {
      throw new DsrStatusError(`Can only cancel pending, verified, or processing requests`);
    }
    this.props.status = 'cancelled';
    this.props.updatedAt = new Date();
  }

  requestExtension(reason: string): void {
    if (this.props.extensionRequested) {
      throw new ComplianceValidationError('Extension already requested (max 1 allowed under CCPA)');
    }
    const extended = new Date(this.props.deadlineAt);
    extended.setDate(extended.getDate() + CCPA_EXTENSION_DAYS);
    this.props.extensionRequested = true;
    this.props.extensionReason = reason;
    this.props.extendedDeadlineAt = extended;
    this.props.updatedAt = new Date();
  }

  isOptOutRequest(): boolean {
    return this.props.requestType === 'optOutSale' || this.props.requestType === 'optOutShare';
  }

  isDeleteRequest(): boolean {
    return this.props.requestType === 'delete';
  }

  isKnowRequest(): boolean {
    return this.props.requestType === 'know';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.props,
      isOverdue: this.isOverdue(),
      daysUntilDeadline: this.daysUntilDeadline(),
    };
  }
}

export { CCPA_DEADLINE_DAYS };
