/**
 * Content Slug Value Object
 *
 * Immutable representation of a URL-safe slug for content pages.
 */

export class ContentSlug {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): ContentSlug {
    const slug = ContentSlug.slugify(value);
    if (!slug) {
      throw new Error('Slug cannot be empty');
    }
    return new ContentSlug(slug);
  }

  static fromExisting(value: string): ContentSlug {
    return new ContentSlug(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ContentSlug): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
