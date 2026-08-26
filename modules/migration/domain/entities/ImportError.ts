export type ImportErrorSeverity = 'error' | 'warning' | 'info';

export interface ImportErrorProps {
  importErrorId: string;
  importJobId: string;
  entityType: string;
  sourceId?: string;
  severity: ImportErrorSeverity;
  message: string;
  stackTrace?: string;
  rawData?: Record<string, unknown>;
  resolvedAt?: Date;
  createdAt: Date;
}

export class ImportError {
  private props: ImportErrorProps;

  private constructor(props: ImportErrorProps) {
    this.props = props;
  }

  static create(props: {
    importJobId: string;
    entityType: string;
    message: string;
    sourceId?: string;
    severity?: ImportErrorSeverity;
    stackTrace?: string;
    rawData?: Record<string, unknown>;
  }): ImportError {
    return new ImportError({
      importErrorId: crypto.randomUUID(),
      importJobId: props.importJobId,
      entityType: props.entityType,
      sourceId: props.sourceId,
      severity: props.severity ?? 'error',
      message: props.message,
      stackTrace: props.stackTrace,
      rawData: props.rawData,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: ImportErrorProps): ImportError {
    return new ImportError(props);
  }

  get importErrorId(): string { return this.props.importErrorId; }
  get importJobId(): string { return this.props.importJobId; }
  get entityType(): string { return this.props.entityType; }
  get sourceId(): string | undefined { return this.props.sourceId; }
  get severity(): ImportErrorSeverity { return this.props.severity; }
  get message(): string { return this.props.message; }
  get stackTrace(): string | undefined { return this.props.stackTrace; }
  get rawData(): Record<string, unknown> | undefined { return this.props.rawData; }
  get resolvedAt(): Date | undefined { return this.props.resolvedAt; }
  get createdAt(): Date { return this.props.createdAt; }

  resolve(): void {
    this.props.resolvedAt = new Date();
  }

  get isResolved(): boolean {
    return this.props.resolvedAt !== undefined;
  }

  toJSON(): ImportErrorProps {
    return { ...this.props };
  }
}
