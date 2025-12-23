/**
 * ContentBlock Entity
 * Represents a content block within a page
 */

export interface ContentBlockProps {
  contentBlockId: string;
  pageId: string;
  contentTypeId: string;
  name: string;
  order: number;
  content: Record<string, any>;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class ContentBlock {
  private props: ContentBlockProps;

  private constructor(props: ContentBlockProps) {
    this.props = props;
  }

  // Getters
  get contentBlockId(): string {
    return this.props.contentBlockId;
  }
  get pageId(): string {
    return this.props.pageId;
  }
  get contentTypeId(): string {
    return this.props.contentTypeId;
  }
  get name(): string {
    return this.props.name;
  }
  get order(): number {
    return this.props.order;
  }
  get content(): Record<string, any> {
    return this.props.content;
  }
  get status(): 'active' | 'inactive' {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get createdBy(): string | undefined {
    return this.props.createdBy;
  }
  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  // Factory method
  static create(props: Omit<ContentBlockProps, 'createdAt' | 'updatedAt'> & { createdAt?: Date; updatedAt?: Date }): ContentBlock {
    const now = new Date();
    return new ContentBlock({
      ...props,
      status: props.status || 'active',
      createdAt: props.createdAt || now,
      updatedAt: props.updatedAt || now,
    });
  }

  // Domain methods
  activate(): void {
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.status = 'inactive';
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Block name cannot be empty');
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
  }

  updateContent(content: Record<string, any>): void {
    this.props.content = content;
    this.props.updatedAt = new Date();
  }

  setOrder(order: number): void {
    if (order < 0) {
      throw new Error('Order cannot be negative');
    }
    this.props.order = order;
    this.props.updatedAt = new Date();
  }

  moveUp(): void {
    if (this.props.order > 0) {
      this.props.order -= 1;
      this.props.updatedAt = new Date();
    }
  }

  moveDown(): void {
    this.props.order += 1;
    this.props.updatedAt = new Date();
  }

  // Validation
  isActive(): boolean {
    return this.props.status === 'active';
  }

  hasContent(): boolean {
    return Object.keys(this.props.content).length > 0;
  }

  // Serialization
  toJSON(): ContentBlockProps {
    return { ...this.props };
  }
}
