import {
  ContentPageNotFoundError, ContentBlockNotFoundError, ContentTypeNotFoundError,
  ContentTemplateNotFoundError, MediaFolderNotFoundError, MediaAssetNotFoundError,
  NavigationMenuNotFoundError, RedirectNotFoundError, CategoryNotFoundError,
  SlugAlreadyExistsError, ContentValidationError, FailedToCreateContentError,
} from './ContentErrors';

describe('ContentErrors', () => {
  it('ContentPageNotFoundError', () => { expect(new ContentPageNotFoundError('p1').statusCode).toBe(404); });
  it('ContentBlockNotFoundError', () => { expect(new ContentBlockNotFoundError('b1').statusCode).toBe(404); });
  it('ContentTypeNotFoundError', () => { expect(new ContentTypeNotFoundError('t1').statusCode).toBe(404); });
  it('ContentTemplateNotFoundError', () => { expect(new ContentTemplateNotFoundError('t1').statusCode).toBe(404); });
  it('MediaFolderNotFoundError', () => { expect(new MediaFolderNotFoundError('f1').statusCode).toBe(404); });
  it('MediaAssetNotFoundError', () => { expect(new MediaAssetNotFoundError('a1').statusCode).toBe(404); });
  it('NavigationMenuNotFoundError', () => { expect(new NavigationMenuNotFoundError('m1').statusCode).toBe(404); });
  it('RedirectNotFoundError', () => { expect(new RedirectNotFoundError('r1').statusCode).toBe(404); });
  it('CategoryNotFoundError', () => { expect(new CategoryNotFoundError('c1').statusCode).toBe(404); });
  it('SlugAlreadyExistsError', () => { expect(new SlugAlreadyExistsError('slug').statusCode).toBe(409); });
  it('ContentValidationError', () => { expect(new ContentValidationError('bad').statusCode).toBe(400); });
  it('FailedToCreateContentError', () => { expect(new FailedToCreateContentError('err').statusCode).toBe(500); });
});
