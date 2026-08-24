import { AppError } from '../../../../libs/errors';

export class NotificationNotFoundError extends AppError {
  constructor(notificationId: string) {
    super(`Notification not found: ${notificationId}`, 404, { code: 'notification.not_found' });
  }
}

export class NotificationTemplateNotFoundError extends AppError {
  constructor(templateId: string) {
    super(`Notification template not found: ${templateId}`, 404, { code: 'notification.template_not_found' });
  }
}

export class NotificationDeviceNotFoundError extends AppError {
  constructor(deviceId: string) {
    super(`Notification device not found: ${deviceId}`, 404, { code: 'notification.device_not_found' });
  }
}

export class NotificationPreferenceNotFoundError extends AppError {
  constructor(preferenceId: string) {
    super(`Notification preference not found: ${preferenceId}`, 404, { code: 'notification.preference_not_found' });
  }
}

export class InvalidNotificationChannelError extends AppError {
  constructor(channel: string) {
    super(`Invalid notification channel: ${channel}`, 400, { code: 'notification.invalid_channel' });
  }
}

export class FailedToSendNotificationError extends AppError {
  constructor(reason: string) {
    super(`Failed to send notification: ${reason}`, 500, { code: 'notification.send_failed' });
  }
}

export class FailedToSendBatchError extends AppError {
  constructor() {
    super('Failed to send notification batch', 500, { code: 'notification.batch_send_failed' });
  }
}

export class NotificationValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'notification.validation_error' });
  }
}

export class NotificationTemplateAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Notification template with code '${code}' already exists`, 409, { code: 'notification.template_already_exists' });
  }
}

export class FailedToCreateNotificationTemplateError extends AppError {
  constructor() {
    super('Failed to create notification template', 500, { code: 'notification.template_creation_failed' });
  }
}

export class FailedToCreateNotificationDeliveryLogError extends AppError {
  constructor() {
    super('Failed to create notification delivery log', 500, { code: 'notification.delivery_log_creation_failed' });
  }
}

export class FailedToCreateNotificationError extends AppError {
  constructor() {
    super('Failed to create notification', 500, { code: 'notification.creation_failed' });
  }
}
