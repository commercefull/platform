export type ImportJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export type ImportJobType =
  | 'full'
  | 'products'
  | 'customers'
  | 'orders'
  | 'categories'
  | 'collections'
  | 'inventory'
  | 'coupons'
  | 'tax_rates'
  | 'shipping_zones'
  | 'reviews'
  | 'gift_cards'
  | 'customer_groups'
  | 'cms_pages'
  | 'returns'
  | 'brands'
  | 'custom';

export type ImportSource = 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'prestashop' | 'shopware' | 'wix' | 'squarespace' | 'csv' | 'api' | 'custom';

export interface ImportJobStats {
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
}

export interface ImportJobProps {
  importJobId: string;
  organizationId: string;
  jobType: ImportJobType;
  source: ImportSource;
  status: ImportJobStatus;
  sourceStoreUrl?: string;
  sourceApiKey?: string;
  sourceConfig?: Record<string, unknown>;
  stats: ImportJobStats;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  dryRun: boolean;
  autoActivate: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ImportJob {
  private props: ImportJobProps;

  private constructor(props: ImportJobProps) {
    this.props = props;
  }

  static create(props: {
    organizationId: string;
    jobType: ImportJobType;
    source: ImportSource;
    sourceStoreUrl?: string;
    sourceApiKey?: string;
    sourceConfig?: Record<string, unknown>;
    dryRun?: boolean;
    autoActivate?: boolean;
    metadata?: Record<string, unknown>;
  }): ImportJob {
    const now = new Date();
    return new ImportJob({
      importJobId: crypto.randomUUID(),
      organizationId: props.organizationId,
      jobType: props.jobType,
      source: props.source,
      status: 'pending',
      sourceStoreUrl: props.sourceStoreUrl,
      sourceApiKey: props.sourceApiKey,
      sourceConfig: props.sourceConfig,
      stats: {
        totalRecords: 0,
        processedRecords: 0,
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
      },
      dryRun: props.dryRun ?? false,
      autoActivate: props.autoActivate ?? true,
      metadata: props.metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ImportJobProps): ImportJob {
    return new ImportJob(props);
  }

  get importJobId(): string { return this.props.importJobId; }
  get organizationId(): string { return this.props.organizationId; }
  get jobType(): ImportJobType { return this.props.jobType; }
  get source(): ImportSource { return this.props.source; }
  get status(): ImportJobStatus { return this.props.status; }
  get sourceStoreUrl(): string | undefined { return this.props.sourceStoreUrl; }
  get sourceApiKey(): string | undefined { return this.props.sourceApiKey; }
  get sourceConfig(): Record<string, unknown> | undefined { return this.props.sourceConfig; }
  get stats(): ImportJobStats { return this.props.stats; }
  get startedAt(): Date | undefined { return this.props.startedAt; }
  get completedAt(): Date | undefined { return this.props.completedAt; }
  get errorMessage(): string | undefined { return this.props.errorMessage; }
  get dryRun(): boolean { return this.props.dryRun; }
  get autoActivate(): boolean { return this.props.autoActivate; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  start(): void {
    if (this.props.status !== 'pending' && this.props.status !== 'paused') return;
    this.props.status = 'running';
    this.props.startedAt = new Date();
    this.props.updatedAt = new Date();
  }

  setTotalRecords(count: number): void {
    this.props.stats.totalRecords = count;
    this.props.updatedAt = new Date();
  }

  recordSuccess(): void {
    this.props.stats.processedRecords++;
    this.props.stats.successCount++;
    this.props.updatedAt = new Date();
  }

  recordError(): void {
    this.props.stats.processedRecords++;
    this.props.stats.errorCount++;
    this.props.updatedAt = new Date();
  }

  recordSkipped(): void {
    this.props.stats.processedRecords++;
    this.props.stats.skippedCount++;
    this.props.updatedAt = new Date();
  }

  complete(): void {
    this.props.status = 'completed';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  fail(errorMessage: string): void {
    this.props.status = 'failed';
    this.props.errorMessage = errorMessage;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  pause(): void {
    if (this.props.status !== 'running') return;
    this.props.status = 'paused';
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.props.status === 'completed' || this.props.status === 'failed') return;
    this.props.status = 'cancelled';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  get progress(): number {
    if (this.props.stats.totalRecords === 0) return 0;
    return Math.round((this.props.stats.processedRecords / this.props.stats.totalRecords) * 100);
  }

  toJSON(): ImportJobProps {
    return { ...this.props };
  }
}
