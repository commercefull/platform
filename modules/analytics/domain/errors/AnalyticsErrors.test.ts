import {
  ReportNotFoundError, ReportScheduleNotFoundError, InvalidDateRangeError, MetricNotFoundError,
  DashboardNotFoundError, FailedToGenerateReportError, AnalyticsValidationError,
} from './AnalyticsErrors';

describe('AnalyticsErrors', () => {
  it('ReportNotFoundError', () => { expect(new ReportNotFoundError('r1').statusCode).toBe(404); });
  it('ReportScheduleNotFoundError', () => { expect(new ReportScheduleNotFoundError('s1').statusCode).toBe(404); });
  it('InvalidDateRangeError', () => { expect(new InvalidDateRangeError().statusCode).toBe(400); });
  it('MetricNotFoundError', () => { expect(new MetricNotFoundError('m1').statusCode).toBe(404); });
  it('DashboardNotFoundError', () => { expect(new DashboardNotFoundError('d1').statusCode).toBe(404); });
  it('FailedToGenerateReportError', () => { expect(new FailedToGenerateReportError().statusCode).toBe(500); });
  it('AnalyticsValidationError', () => { expect(new AnalyticsValidationError('bad').statusCode).toBe(400); });
});
