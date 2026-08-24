import {
  MediaAssetNotFoundError, MediaFolderNotFoundError, MediaUploadFailedError, InvalidMediaTypeError,
  MediaFileTooLargeError, DuplicateMediaNameError, MediaValidationError, MediaFileNotFoundError,
} from './MediaErrors';

describe('MediaErrors', () => {
  it('MediaAssetNotFoundError', () => { expect(new MediaAssetNotFoundError('a1').statusCode).toBe(404); });
  it('MediaFolderNotFoundError', () => { expect(new MediaFolderNotFoundError('f1').statusCode).toBe(404); });
  it('MediaUploadFailedError', () => { expect(new MediaUploadFailedError('err').statusCode).toBe(500); });
  it('InvalidMediaTypeError', () => { expect(new InvalidMediaTypeError('bad').statusCode).toBe(400); });
  it('MediaFileTooLargeError', () => { expect(new MediaFileTooLargeError('10MB').statusCode).toBe(400); });
  it('DuplicateMediaNameError', () => { expect(new DuplicateMediaNameError('name').statusCode).toBe(409); });
  it('MediaValidationError', () => { expect(new MediaValidationError('bad').statusCode).toBe(400); });
  it('MediaFileNotFoundError', () => { expect(new MediaFileNotFoundError('key').statusCode).toBe(404); });
});
