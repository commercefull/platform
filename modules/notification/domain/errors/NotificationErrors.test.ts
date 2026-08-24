import {
  NotificationNotFoundError, NotificationTemplateNotFoundError, NotificationDeviceNotFoundError,
  NotificationPreferenceNotFoundError, InvalidNotificationChannelError, FailedToSendNotificationError,
  FailedToSendBatchError, NotificationValidationError, NotificationTemplateAlreadyExistsError,
  FailedToCreateNotificationTemplateError, FailedToCreateNotificationDeliveryLogError, FailedToCreateNotificationError,
} from './NotificationErrors';

describe('NotificationErrors', () => {
  it('NotificationNotFoundError', () => { expect(new NotificationNotFoundError('n1').statusCode).toBe(404); });
  it('NotificationTemplateNotFoundError', () => { expect(new NotificationTemplateNotFoundError('t1').statusCode).toBe(404); });
  it('NotificationDeviceNotFoundError', () => { expect(new NotificationDeviceNotFoundError('d1').statusCode).toBe(404); });
  it('NotificationPreferenceNotFoundError', () => { expect(new NotificationPreferenceNotFoundError('p1').statusCode).toBe(404); });
  it('InvalidNotificationChannelError', () => { expect(new InvalidNotificationChannelError('bad').statusCode).toBe(400); });
  it('FailedToSendNotificationError', () => { expect(new FailedToSendNotificationError('err').statusCode).toBe(500); });
  it('FailedToSendBatchError', () => { expect(new FailedToSendBatchError().statusCode).toBe(500); });
  it('NotificationValidationError', () => { expect(new NotificationValidationError('bad').statusCode).toBe(400); });
  it('NotificationTemplateAlreadyExistsError', () => { expect(new NotificationTemplateAlreadyExistsError('code').statusCode).toBe(409); });
  it('FailedToCreateNotificationTemplateError', () => { expect(new FailedToCreateNotificationTemplateError().statusCode).toBe(500); });
  it('FailedToCreateNotificationDeliveryLogError', () => { expect(new FailedToCreateNotificationDeliveryLogError().statusCode).toBe(500); });
  it('FailedToCreateNotificationError', () => { expect(new FailedToCreateNotificationError().statusCode).toBe(500); });
});
