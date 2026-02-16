/**
 * Page Status Value Object
 *
 * Encapsulates content page status with transition validation.
 */

export type PageStatusValue = 'draft' | 'published' | 'scheduled' | 'archived';

export class PageStatus {
  private readonly _value: PageStatusValue;

  private constructor(value: PageStatusValue) {
    this._value = value;
  }

  static readonly DRAFT = new PageStatus('draft');
  static readonly PUBLISHED = new PageStatus('published');
  static readonly SCHEDULED = new PageStatus('scheduled');
  static readonly ARCHIVED = new PageStatus('archived');

  static from(value: string): PageStatus {
    const validStatuses: PageStatusValue[] = ['draft', 'published', 'scheduled', 'archived'];
    if (!validStatuses.includes(value as PageStatusValue)) {
      throw new Error(`Invalid page status: ${value}`);
    }
    return new PageStatus(value as PageStatusValue);
  }

  get value(): PageStatusValue {
    return this._value;
  }

  get isDraft(): boolean {
    return this._value === 'draft';
  }

  get isPublished(): boolean {
    return this._value === 'published';
  }

  get isScheduled(): boolean {
    return this._value === 'scheduled';
  }

  get isArchived(): boolean {
    return this._value === 'archived';
  }

  canTransitionTo(target: PageStatus): boolean {
    const transitions: Record<PageStatusValue, PageStatusValue[]> = {
      draft: ['published', 'scheduled', 'archived'],
      published: ['draft', 'archived'],
      scheduled: ['draft', 'published', 'archived'],
      archived: ['draft'],
    };
    return transitions[this._value].includes(target._value);
  }

  equals(other: PageStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
