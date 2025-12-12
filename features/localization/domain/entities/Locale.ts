/**
 * Locale Entity
 */

export interface LocaleProps {
  localeId: string;
  code: string;
  name: string;
  nativeName: string;
  languageCode: string;
  countryCode?: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimalSeparator: string;
    thousandsSeparator: string;
    decimalPlaces: number;
  };
  currencyCode: string;
  isActive: boolean;
  isDefault: boolean;
  translations?: Record<string, string>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Locale {
  private props: LocaleProps;

  private constructor(props: LocaleProps) {
    this.props = props;
  }

  static create(props: Omit<LocaleProps, 'isActive' | 'createdAt' | 'updatedAt'>): Locale {
    const now = new Date();
    return new Locale({
      ...props,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: LocaleProps): Locale {
    return new Locale(props);
  }

  get localeId(): string { return this.props.localeId; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get languageCode(): string { return this.props.languageCode; }
  get direction(): 'ltr' | 'rtl' { return this.props.direction; }
  get currencyCode(): string { return this.props.currencyCode; }
  get isActive(): boolean { return this.props.isActive; }
  get isDefault(): boolean { return this.props.isDefault; }

  translate(key: string): string {
    return this.props.translations?.[key] || key;
  }

  formatNumber(value: number): string {
    const { decimalSeparator, thousandsSeparator, decimalPlaces } = this.props.numberFormat;
    const parts = value.toFixed(decimalPlaces).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    return parts.join(decimalSeparator);
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
