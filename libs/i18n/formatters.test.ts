import { formatDate, formatDateTime, formatNumber, formatPercent, formatUnit, sortLocalized } from './formatters';
import { createLocaleContext, languageOf, measurementSystemOf, textDirectionOf } from './localeContext';

describe('libs/i18n/localeContext', () => {
  it('should derive language, direction, and measurement when building a context', () => {
    const ctx = createLocaleContext('en-GB', 'Europe/London');
    expect(ctx.locale).toBe('en-GB');
    expect(ctx.language).toBe('en');
    expect(ctx.textDirection).toBe('ltr');
    expect(ctx.measurementSystem).toBe('imperial');
    expect(ctx.timeZone).toBe('Europe/London');
  });

  it('should report rtl when the locale language is Arabic or Hebrew', () => {
    expect(textDirectionOf('ar-AE')).toBe('rtl');
    expect(textDirectionOf('he-IL')).toBe('rtl');
    expect(textDirectionOf('ja-JP')).toBe('ltr');
  });

  it('should report us measurement when the region is US', () => {
    expect(measurementSystemOf('en-US')).toBe('us');
    expect(measurementSystemOf('de-DE')).toBe('metric');
  });

  it('should parse the language subtag when the locale has a region and script', () => {
    expect(languageOf('zh-Hant-TW')).toBe('zh');
    expect(languageOf('en')).toBe('en');
  });
});

describe('libs/i18n/formatters', () => {
  const de = createLocaleContext('de-DE', 'Europe/Berlin');
  const en = createLocaleContext('en-GB', 'Europe/London');
  const jp = createLocaleContext('ja-JP', 'Asia/Tokyo');

  it('should format numbers with locale grouping when locale differs', () => {
    expect(formatNumber(12345.67, de)).toBe('12.345,67');
    expect(formatNumber(12345.67, en)).toBe('12,345.67');
  });

  it('should format dates using the context locale when formatting', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const enOut = formatDate(date, en);
    const deOut = formatDate(date, de);
    expect(enOut).not.toBe(deOut);
    expect(deOut).toContain('2026');
  });

  it('should format date-times in the context timezone when provided', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const jpOut = formatDateTime(date, jp);
    const enOut = formatDateTime(date, en);
    // Tokyo is UTC+9 in March — the rendered clock time must differ from London.
    expect(jpOut).not.toBe(enOut);
  });

  it('should format units with localized symbols when formatting', () => {
    expect(formatUnit(2.5, 'kilogram', en)).toContain('kg');
    expect(formatUnit(2.5, 'kilogram', de)).toContain('kg');
  });

  it('should format percentages when formatting', () => {
    expect(formatPercent(0.2, en)).toBe('20%');
  });

  it('should sort strings with locale collation when sorting', () => {
    const sorted = sortLocalized(['zebra', 'apple', 'äpfel'], de);
    // German collation: 'ä' sorts near 'a', so 'äpfel' precedes 'apple'.
    expect(sorted).toEqual(['äpfel', 'apple', 'zebra']);
  });

  it('should fall back to en-US when no context is provided', () => {
    expect(formatNumber(1234.5)).toBe('1,234.5');
  });
});
