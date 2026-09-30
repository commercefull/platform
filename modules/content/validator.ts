import type { HttpHandler, HttpRequest } from 'libs/http';

type FieldCheck = (value: unknown) => boolean;

interface ValidatedRequest extends HttpRequest {
  validationErrors?: string[];
}

const isNonEmpty: FieldCheck = value => typeof value === 'string' && value.trim().length > 0;
const isEmail: FieldCheck = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const minLength = (min: number): FieldCheck => value => typeof value === 'string' && value.length >= min;
const isPhone: FieldCheck = value => typeof value === 'string' && /^\+?[0-9\s().-]{5,20}$/.test(value);

/**
 * Build a validation middleware: fails the field when any check fails.
 * `optional` skips checks entirely when the field is absent/empty.
 */
const fieldRule = (field: string, message: string, checks: FieldCheck[], optional = false): HttpHandler => {
  return (req, _res, next) => {
    const value = (req.body as Record<string, unknown> | undefined)?.[field];
    const absent = value === undefined || value === null || value === '';
    if (optional && absent) {
      next();
      return;
    }
    if (checks.some(check => !check(value))) {
      const request = req as ValidatedRequest;
      (request.validationErrors ??= []).push(message);
    }
    next();
  };
};

const collectErrors = (req: ValidatedRequest): string[] => {
  const errors = req.validationErrors ?? [];
  req.validationErrors = [];
  return errors;
};

export const userContactUsValidationRules = (): HttpHandler[] => {
  return [
    fieldRule('name', 'Please enter a name', [isNonEmpty]),
    fieldRule('email', 'Please enter a valid email address', [isNonEmpty, isEmail]),
    fieldRule('message', 'Please enter a message with at least 10 words', [isNonEmpty, minLength(10)]),
  ];
};

export const userContactFormValidationRules = (): HttpHandler[] => {
  return [
    fieldRule('name', 'Please enter a valid name (minimum 2 characters)', [isNonEmpty, minLength(2)]),
    fieldRule('email', 'Please enter a valid email address', [isNonEmpty, isEmail]),
    fieldRule('subject', 'Please select a subject', [isNonEmpty]),
    fieldRule('message', 'Please enter a message (minimum 10 characters)', [isNonEmpty, minLength(10)]),
    fieldRule('phone', 'Please enter a valid phone number', [isPhone], true),
  ];
};

export const validateContactUs: HttpHandler = (req, res, next) => {
  const errors = collectErrors(req as ValidatedRequest);
  if (errors.length > 0) {
    req.flash('error', errors);
    return res.redirect('/pages/contact-us');
  }
  next();
};

export const validateContactForm: HttpHandler = (req, res, next) => {
  const errors = collectErrors(req as ValidatedRequest);
  if (errors.length > 0) {
    req.flash('error', errors);
    return res.redirect('/contact-form');
  }
  next();
};
