/**
 * ContentType Entity
 * Represents a content type that defines the structure of content pages
 */

export interface ContentTypeProps {
  contentTypeId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  allowedBlocks?: string[];
  defaultTemplate?: string;
  requiredFields?: Record<string, any>;
  metaFields?: Record<string, any>;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export class ContentType {
  private props: ContentTypeProps;

  private constructor(props: ContentTypeProps) {
    this.props = props;
  }

  // Getters
  get contentTypeId(): string {
    return this.props.contentTypeId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get icon(): string | undefined {
    return this.props.icon;
  }
  get allowedBlocks(): string[] | undefined {
    return this.props.allowedBlocks;
  }
  get defaultTemplate(): string | undefined {
    return this.props.defaultTemplate;
  }
  get requiredFields(): Record<string, any> | undefined {
    return this.props.requiredFields;
  }
  get metaFields(): Record<string, any> | undefined {
    return this.props.metaFields;
  }
  get isSystem(): boolean {
    return this.props.isSystem;
  }
  get isActive(): boolean {
    return this.props.isActive;
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
  static create(props: Omit<ContentTypeProps, 'createdAt' | 'updatedAt'> & { createdAt?: Date; updatedAt?: Date }): ContentType {
    const now = new Date();
    return new ContentType({
      ...props,
      createdAt: props.createdAt || now,
      updatedAt: props.updatedAt || now,
    });
  }

  // Domain methods
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    if (this.props.isSystem) {
      throw new Error('Cannot deactivate a system content type');
    }
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.props.name = name.trim();
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  setAllowedBlocks(blockTypes: string[]): void {
    this.props.allowedBlocks = blockTypes;
    this.props.updatedAt = new Date();
  }

  setDefaultTemplate(templateId: string): void {
    this.props.defaultTemplate = templateId;
    this.props.updatedAt = new Date();
  }

  updateRequiredFields(fields: Record<string, any>): void {
    this.props.requiredFields = fields;
    this.props.updatedAt = new Date();
  }

  updateMetaFields(fields: Record<string, any>): void {
    this.props.metaFields = fields;
    this.props.updatedAt = new Date();
  }

  // Validation
  canBeDeleted(): boolean {
    return !this.props.isSystem;
  }

  // Serialization
  toJSON(): ContentTypeProps {
    return { ...this.props };
  }
}
