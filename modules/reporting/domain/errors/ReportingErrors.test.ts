import {
  ReportScheduleNotFoundError, ReportExecutionNotFoundError, ReportNotFoundError,
  InvalidScheduleFrequencyError, ReportGenerationFailedError, FailedToCreateScheduleError,
  FailedToCreateExecutionError, UnknownReportTypeError,
} from './ReportingErrors';

describe('ReportingErrors', () => {
  it('ReportScheduleNotFoundError', () => { expect(new ReportScheduleNotFoundError('s1').statusCode).toBe(404); });
  it('ReportExecutionNotFoundError', () => { expect(new ReportExecutionNotFoundError('e1').statusCode).toBe(404); });
  it('ReportNotFoundError', () => { expect(new ReportNotFoundError('r1').statusCode).toBe(404); });
  it('InvalidScheduleFrequencyError', () => { expect(new InvalidScheduleFrequencyError('bad').statusCode).toBe(400); });
  it('ReportGenerationFailedError', () => { expect(new ReportGenerationFailedError('err').statusCode).toBe(500); });
  it('FailedToCreateScheduleError', () => { expect(new FailedToCreateScheduleError().statusCode).toBe(500); });
  it('FailedToCreateExecutionError', () => { expect(new FailedToCreateExecutionError().statusCode).toBe(500); });
  it('UnknownReportTypeError', () => { expect(new UnknownReportTypeError('bad').statusCode).toBe(400); });
});
