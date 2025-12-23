import { BaseNotification, NotificationBuilder, NotificationChannel, NotificationType } from './notification';

/**
 * Parameters for account registration notification
 */
export interface AccountRegistrationParams {
  firstName: string;
  email: string;
  verificationToken?: string;
  verificationUrl?: string;
}

/**
 * Account registration notification
 */
export class AccountRegistrationNotification extends NotificationBuilder<AccountRegistrationParams> {
  private params: AccountRegistrationParams;

  constructor(userId: string, params: AccountRegistrationParams, channels: NotificationChannel[] = ['email']) {
    super(userId, 'customer', channels);
    this.type = 'account_registration';
    this.params = params;
  }

  buildTitle(): string {
    return `Welcome to our store, ${this.params.firstName}!`;
  }

  buildContent(): string {
    let content = `Hi ${this.params.firstName},\n\n`;
    content += "Thank you for creating an account with us. We're excited to have you join our community.\n\n";

    if (this.params.verificationUrl) {
      content += `Please verify your email address by clicking this link: ${this.params.verificationUrl}\n\n`;
    }

    content += "If you have any questions or need assistance, please don't hesitate to contact our customer service team.\n\n";
    content += 'Best regards,\nThe Team';

    return content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      email: this.params.email,
      verificationToken: this.params.verificationToken,
      verificationUrl: this.params.verificationUrl,
    };
  }
}

/**
 * Parameters for password reset notification
 */
export interface PasswordResetParams {
  firstName: string;
  email: string;
  resetToken: string;
  resetUrl: string;
  expiryTime: string;
}

/**
 * Password reset notification
 */
export class PasswordResetNotification extends NotificationBuilder<PasswordResetParams> {
  private params: PasswordResetParams;

  constructor(userId: string, params: PasswordResetParams, channels: NotificationChannel[] = ['email']) {
    super(userId, 'customer', channels);
    this.type = 'password_reset';
    this.params = params;
  }

  buildTitle(): string {
    return 'Password Reset Request';
  }

  buildContent(): string {
    let content = `Hello ${this.params.firstName},\n\n`;
    content += 'We received a request to reset your password. If you did not make this request, please ignore this email.\n\n';
    content += `To reset your password, please click on the following link: ${this.params.resetUrl}\n\n`;
    content += `This link will expire in ${this.params.expiryTime}.\n\n`;
    content += 'If you have any issues or questions, please contact our support team.\n\n';
    content += 'Thank you,\nThe Team';

    return content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      email: this.params.email,
      resetToken: this.params.resetToken,
      resetUrl: this.params.resetUrl,
      expiryTime: this.params.expiryTime,
    };
  }
}

/**
 * Parameters for email verification notification
 */
export interface EmailVerificationParams {
  firstName: string;
  email: string;
  verificationToken: string;
  verificationUrl: string;
}

/**
 * Email verification notification
 */
export class EmailVerificationNotification extends NotificationBuilder<EmailVerificationParams> {
  private params: EmailVerificationParams;

  constructor(userId: string, params: EmailVerificationParams, channels: NotificationChannel[] = ['email']) {
    super(userId, 'customer', channels);
    this.type = 'email_verification';
    this.params = params;
  }

  buildTitle(): string {
    return 'Verify Your Email Address';
  }

  buildContent(): string {
    let content = `Hi ${this.params.firstName},\n\n`;
    content += 'Thank you for providing your email address. To complete the verification process, please click on the link below:\n\n';
    content += `${this.params.verificationUrl}\n\n`;
    content += 'If you did not request this verification, please ignore this email.\n\n';
    content += 'Best regards,\nThe Team';

    return content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      email: this.params.email,
      verificationToken: this.params.verificationToken,
      verificationUrl: this.params.verificationUrl,
    };
  }
}
