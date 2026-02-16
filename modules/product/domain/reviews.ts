/**
 * Product Review Domain Entity
 * Represents a customer review for a product
 */

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface ReviewProps {
  productReviewId: string;
  productId: string;
  customerId?: string;
  rating: number;
  title?: string;
  content?: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  reviewerName: string;
  reviewerEmail?: string;
  helpfulCount: number;
  unhelpfulCount: number;
  reportCount: number;
  isHighlighted: boolean;
  adminResponse?: string;
  adminRespondedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Review {
  private props: ReviewProps;

  private constructor(props: ReviewProps) {
    this.props = props;
  }

  static create(props: {
    productReviewId: string;
    productId: string;
    customerId?: string;
    rating: number;
    title?: string;
    content?: string;
    isVerifiedPurchase?: boolean;
    reviewerName: string;
    reviewerEmail?: string;
  }): Review {
    if (props.rating < 1 || props.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    const now = new Date();
    return new Review({
      productReviewId: props.productReviewId,
      productId: props.productId,
      customerId: props.customerId,
      rating: props.rating,
      title: props.title,
      content: props.content,
      status: 'pending',
      isVerifiedPurchase: props.isVerifiedPurchase || false,
      reviewerName: props.reviewerName,
      reviewerEmail: props.reviewerEmail,
      helpfulCount: 0,
      unhelpfulCount: 0,
      reportCount: 0,
      isHighlighted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ReviewProps): Review {
    return new Review(props);
  }

  // Getters
  get productReviewId(): string {
    return this.props.productReviewId;
  }
  get productId(): string {
    return this.props.productId;
  }
  get customerId(): string | undefined {
    return this.props.customerId;
  }
  get rating(): number {
    return this.props.rating;
  }
  get title(): string | undefined {
    return this.props.title;
  }
  get content(): string | undefined {
    return this.props.content;
  }
  get status(): ReviewStatus {
    return this.props.status;
  }
  get isVerifiedPurchase(): boolean {
    return this.props.isVerifiedPurchase;
  }
  get reviewerName(): string {
    return this.props.reviewerName;
  }
  get helpfulCount(): number {
    return this.props.helpfulCount;
  }
  get unhelpfulCount(): number {
    return this.props.unhelpfulCount;
  }
  get reportCount(): number {
    return this.props.reportCount;
  }
  get isHighlighted(): boolean {
    return this.props.isHighlighted;
  }
  get adminResponse(): string | undefined {
    return this.props.adminResponse;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed
  get isApproved(): boolean {
    return this.props.status === 'approved';
  }

  get helpfulnessScore(): number {
    const total = this.props.helpfulCount + this.props.unhelpfulCount;
    return total > 0 ? this.props.helpfulCount / total : 0;
  }

  // Domain methods
  approve(): void {
    this.props.status = 'approved';
    this.touch();
  }

  reject(): void {
    this.props.status = 'rejected';
    this.touch();
  }

  flag(): void {
    this.props.status = 'flagged';
    this.touch();
  }

  markHelpful(): void {
    this.props.helpfulCount += 1;
    this.touch();
  }

  markUnhelpful(): void {
    this.props.unhelpfulCount += 1;
    this.touch();
  }

  report(): void {
    this.props.reportCount += 1;
    if (this.props.reportCount >= 5 && this.props.status === 'approved') {
      this.props.status = 'flagged';
    }
    this.touch();
  }

  highlight(): void {
    this.props.isHighlighted = true;
    this.touch();
  }

  unhighlight(): void {
    this.props.isHighlighted = false;
    this.touch();
  }

  addAdminResponse(response: string): void {
    this.props.adminResponse = response;
    this.props.adminRespondedAt = new Date();
    this.touch();
  }

  updateContent(updates: { title?: string; content?: string; rating?: number }): void {
    if (updates.rating !== undefined) {
      if (updates.rating < 1 || updates.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      this.props.rating = updates.rating;
    }
    if (updates.title !== undefined) this.props.title = updates.title;
    if (updates.content !== undefined) this.props.content = updates.content;
    this.props.status = 'pending';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      isApproved: this.isApproved,
      helpfulnessScore: this.helpfulnessScore,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      adminRespondedAt: this.props.adminRespondedAt?.toISOString(),
    };
  }
}
