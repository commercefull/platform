/**
 * Simple validation utility for request bodies
 */

/**
 * Validate request to ensure required fields are present
 * @param data Object to validate
 * @param requiredFields Array of required field names
 * @returns Validation result with isValid flag and message
 */
export function validateRequest(data: any, requiredFields: string[]): { isValid: boolean; message: string } {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
    };
  }

  return {
    isValid: true,
    message: 'All required fields provided',
  };
}

/**
 * Validate email format
 * @param email Email to validate
 * @returns Whether the email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param phone Phone number to validate
 * @returns Whether the phone number is valid
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate password strength
 * @param password Password to validate
 * @param minLength Minimum length (default: 8)
 * @returns Whether the password meets requirements
 */
export function validatePassword(password: string, minLength: number = 8): boolean {
  if (password.length < minLength) return false;

  // Check for at least one uppercase letter, one lowercase letter, and one digit
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  return hasUppercase && hasLowercase && hasDigit;
}

export default {
  validateRequest,
  validateEmail,
  validatePhone,
  validatePassword,
};
