/**
 * Content Page Entity
 */

export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export interface ContentBlock {
  blockId: string;
  type: string;
  content: Record<string, any>;
  position: number;
  settings?: Record<string, any>;
}

export interface ContentPageProps {
  pageId: string;
  title: string;
  slug: string;
  content?: string;
  blocks: ContentBlock[];
  templateId?: string;
  status: ContentStatus;
  publishedAt?: Date;
  scheduledFor?: Date;
  author?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  featuredImage?: string;
  locale: string;
  parentId?: string;
  order: number;
  isHomepage: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ContentPage {
  private props: ContentPageProps;

  private constructor(props: ContentPageProps) {
    this.props = props;
  }

  static create(
    props: Omit<ContentPageProps, 'status' | 'blocks' | 'order' | 'isHomepage' | 'createdAt' | 'updatedAt'> & { blocks?: ContentBlock[] },
  ): ContentPage {
    const now = new Date();
    return new ContentPage({
      ...props,
      blocks: props.blocks || [],
      status: 'draft',
      order: 0,
      isHomepage: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ContentPageProps): ContentPage {
    return new ContentPage(props);
  }

  get pageId(): string {
    return this.props.pageId;
  }
  get title(): string {
    return this.props.title;
  }
  get slug(): string {
    return this.props.slug;
  }
  get content(): string | undefined {
    return this.props.content;
  }
  get blocks(): ContentBlock[] {
    return this.props.blocks;
  }
  get status(): ContentStatus {
    return this.props.status;
  }
  get isPublished(): boolean {
    return this.props.status === 'published';
  }

  publish(): void {
    this.props.status = 'published';
    this.props.publishedAt = new Date();
    this.touch();
  }

  unpublish(): void {
    this.props.status = 'draft';
    this.touch();
  }

  schedule(date: Date): void {
    this.props.status = 'scheduled';
    this.props.scheduledFor = date;
    this.touch();
  }

  archive(): void {
    this.props.status = 'archived';
    this.touch();
  }

  addBlock(block: ContentBlock): void {
    this.props.blocks.push(block);
    this.reorderBlocks();
    this.touch();
  }

  removeBlock(blockId: string): void {
    this.props.blocks = this.props.blocks.filter(b => b.blockId !== blockId);
    this.reorderBlocks();
    this.touch();
  }

  private reorderBlocks(): void {
    this.props.blocks.forEach((block, index) => {
      block.position = index;
    });
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
