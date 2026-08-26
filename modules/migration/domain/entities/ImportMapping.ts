export interface ImportMappingProps {
  importMappingId: string;
  importJobId: string;
  entityType: string;
  sourceId: string;
  platformId: string;
  sourceData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ImportMapping {
  private props: ImportMappingProps;

  private constructor(props: ImportMappingProps) {
    this.props = props;
  }

  static create(props: {
    importJobId: string;
    entityType: string;
    sourceId: string;
    platformId: string;
    sourceData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): ImportMapping {
    const now = new Date();
    return new ImportMapping({
      importMappingId: crypto.randomUUID(),
      importJobId: props.importJobId,
      entityType: props.entityType,
      sourceId: props.sourceId,
      platformId: props.platformId,
      sourceData: props.sourceData,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ImportMappingProps): ImportMapping {
    return new ImportMapping(props);
  }

  get importMappingId(): string { return this.props.importMappingId; }
  get importJobId(): string { return this.props.importJobId; }
  get entityType(): string { return this.props.entityType; }
  get sourceId(): string { return this.props.sourceId; }
  get platformId(): string { return this.props.platformId; }
  get sourceData(): Record<string, unknown> | undefined { return this.props.sourceData; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  updatePlatformId(platformId: string): void {
    this.props.platformId = platformId;
    this.props.updatedAt = new Date();
  }

  toJSON(): ImportMappingProps {
    return { ...this.props };
  }
}
