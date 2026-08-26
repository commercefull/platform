/**
 * Credential Encryption Service
 *
 * Uses AES-256-GCM to encrypt/decrypt third-party credentials at rest.
 * The encryption key is read from INTEGRATION_ENCRYPTION_KEY env var.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { CredentialEncryptionError } from '../../domain/errors/IntegrationErrors';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!key) {
    throw new CredentialEncryptionError('INTEGRATION_ENCRYPTION_KEY environment variable is not set');
  }
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== KEY_LENGTH) {
    throw new CredentialEncryptionError(`INTEGRATION_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (256-bit)`);
  }
  return buf;
}

export interface EncryptedCredential {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export function encryptCredential(data: Record<string, unknown>): EncryptedCredential {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const json = JSON.stringify(data);
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptCredential(encryptedData: string, iv: string, authTag: string): Record<string, unknown> {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted) as Record<string, unknown>;
}
