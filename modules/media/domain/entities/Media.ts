/**
 * Media Entity
 * Represents processed media files with multiple formats and sizes
 */

export interface MediaFile {
  url: string;
  format: string;
  width?: number;
  height?: number;
  size: number; // bytes
  quality?: number;
}

export interface MediaProps {
  mediaId: string;
  originalName: string;
  mimeType: string;
  size: number;
  originalUrl: string;
  processedFiles: MediaFile[];
  thumbnailUrl?: string;
  altText?: string;
  title?: string;
  description?: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Media {
  private props: MediaProps;

  private constructor(props: MediaProps) {
    this.props = props;
  }

  static create(props: {
    mediaId: string;
    originalName: string;
    mimeType: string;
    size: number;
    originalUrl: string;
    processedFiles?: MediaFile[];
    thumbnailUrl?: string;
    altText?: string;
    title?: string;
    description?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Media {
    const now = new Date();

    return new Media({
      mediaId: props.mediaId,
      originalName: props.originalName,
      mimeType: props.mimeType,
      size: props.size,
      originalUrl: props.originalUrl,
      processedFiles: props.processedFiles || [],
      thumbnailUrl: props.thumbnailUrl,
      altText: props.altText,
      title: props.title,
      description: props.description,
      tags: props.tags || [],
      metadata: props.metadata || {},
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MediaProps): Media {
    return new Media(props);
  }

  // Getters
  get mediaId(): string {
    return this.props.mediaId;
  }
  get originalName(): string {
    return this.props.originalName;
  }
  get mimeType(): string {
    return this.props.mimeType;
  }
  get size(): number {
    return this.props.size;
  }
  get originalUrl(): string {
    return this.props.originalUrl;
  }
  get processedFiles(): MediaFile[] {
    return [...this.props.processedFiles];
  }
  get thumbnailUrl(): string | undefined {
    return this.props.thumbnailUrl;
  }
  get altText(): string | undefined {
    return this.props.altText;
  }
  get title(): string | undefined {
    return this.props.title;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get tags(): string[] {
    return [...this.props.tags];
  }
  get metadata(): Record<string, any> {
    return { ...this.props.metadata };
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get isImage(): boolean {
    return this.props.mimeType.startsWith('image/');
  }

  get isVideo(): boolean {
    return this.props.mimeType.startsWith('video/');
  }

  get primaryFile(): MediaFile | undefined {
    return (
      this.props.processedFiles.find(f => f.format === 'webp') ||
      this.props.processedFiles.find(f => f.format === 'original') ||
      this.props.processedFiles[0]
    );
  }

  // Domain methods
  addProcessedFile(file: MediaFile): void {
    const existingIndex = this.props.processedFiles.findIndex(
      f => f.format === file.format && f.width === file.width && f.height === file.height,
    );

    if (existingIndex >= 0) {
      this.props.processedFiles[existingIndex] = file;
    } else {
      this.props.processedFiles.push(file);
    }

    this.touch();
  }

  removeProcessedFile(format: string, width?: number, height?: number): void {
    this.props.processedFiles = this.props.processedFiles.filter(f => !(f.format === format && f.width === width && f.height === height));
    this.touch();
  }

  setThumbnail(url: string): void {
    this.props.thumbnailUrl = url;
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.touch();
  }

  addTag(tag: string): void {
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    const index = this.props.tags.indexOf(tag);
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.touch();
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      mediaId: this.props.mediaId,
      originalName: this.props.originalName,
      mimeType: this.props.mimeType,
      size: this.props.size,
      originalUrl: this.props.originalUrl,
      processedFiles: this.props.processedFiles,
      thumbnailUrl: this.props.thumbnailUrl,
      altText: this.props.altText,
      title: this.props.title,
      description: this.props.description,
      tags: this.props.tags,
      metadata: this.props.metadata,
      isImage: this.isImage,
      isVideo: this.isVideo,
      primaryFile: this.primaryFile,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
