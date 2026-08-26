import { ImportJob } from './ImportJob';

describe('ImportJob Entity', () => {
  describe('create', () => {
    it('should create an import job with default values', () => {
      const job = ImportJob.create({
        organizationId: 'org-1',
        jobType: 'products',
        source: 'shopify',
      });
      expect(job.importJobId).toBeDefined();
      expect(job.status).toBe('pending');
      expect(job.jobType).toBe('products');
      expect(job.source).toBe('shopify');
      expect(job.dryRun).toBe(false);
      expect(job.autoActivate).toBe(true);
      expect(job.stats.totalRecords).toBe(0);
    });

    it('should create with custom values', () => {
      const job = ImportJob.create({
        organizationId: 'org-1',
        jobType: 'full',
        source: 'woocommerce',
        sourceStoreUrl: 'https://store.example.com',
        dryRun: true,
        autoActivate: false,
      });
      expect(job.source).toBe('woocommerce');
      expect(job.sourceStoreUrl).toBe('https://store.example.com');
      expect(job.dryRun).toBe(true);
      expect(job.autoActivate).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const job = ImportJob.reconstitute({
        importJobId: 'job-1',
        organizationId: 'org-1',
        jobType: 'customers',
        source: 'csv',
        status: 'completed',
        stats: { totalRecords: 100, processedRecords: 95, successCount: 90, errorCount: 5, skippedCount: 5 },
        dryRun: false,
        autoActivate: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      });
      expect(job.importJobId).toBe('job-1');
      expect(job.status).toBe('completed');
      expect(job.stats.successCount).toBe(90);
    });
  });

  describe('lifecycle', () => {
    it('should start a pending job', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      job.start();
      expect(job.status).toBe('running');
      expect(job.startedAt).toBeDefined();
    });

    it('should complete a running job', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      job.start();
      job.complete();
      expect(job.status).toBe('completed');
      expect(job.completedAt).toBeDefined();
    });

    it('should fail with error message', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      job.start();
      job.fail('Connection refused');
      expect(job.status).toBe('failed');
      expect(job.errorMessage).toBe('Connection refused');
    });

    it('should pause and resume a running job', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      job.start();
      job.pause();
      expect(job.status).toBe('paused');
      job.start();
      expect(job.status).toBe('running');
    });

    it('should cancel a running job', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      job.start();
      job.cancel();
      expect(job.status).toBe('cancelled');
    });

    it('should not cancel a completed job', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      job.start();
      job.complete();
      job.cancel();
      expect(job.status).toBe('completed');
    });
  });

  describe('stats tracking', () => {
    it('should track success and error counts', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      job.setTotalRecords(10);
      job.recordSuccess();
      job.recordSuccess();
      job.recordError();
      job.recordSkipped();
      expect(job.stats.processedRecords).toBe(4);
      expect(job.stats.successCount).toBe(2);
      expect(job.stats.errorCount).toBe(1);
      expect(job.stats.skippedCount).toBe(1);
    });

    it('should calculate progress percentage', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      job.setTotalRecords(100);
      job.recordSuccess();
      job.recordSuccess();
      expect(job.progress).toBe(2);
    });

    it('should return 0 progress when no total records', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      expect(job.progress).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('should return all props', () => {
      const job = ImportJob.create({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });
      const json = job.toJSON();
      expect(json.organizationId).toBe('org-1');
      expect(json.jobType).toBe('products');
      expect(json.status).toBe('pending');
    });
  });
});
