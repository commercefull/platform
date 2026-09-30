import { createHmac, timingSafeEqual } from 'crypto';
import type { HttpHandler } from './http';

/**
 * Signed-cookie format compatible with `cookie-parser` + Express `res.cookie`:
 * `s:<value>.<base64url(HMAC-SHA256(value, secret))>`
 */
function unsignCookie(raw: string, secret: string): string | undefined {
  const dotIndex = raw.lastIndexOf('.');
  if (dotIndex < 0) {
    return undefined;
  }
  const value = raw.slice(0, dotIndex);
  const signature = raw.slice(dotIndex + 1);
  const expected = createHmac('sha256', secret).update(value).digest('base64url');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return undefined;
  }
  return value;
}

/**
 * Parse the `Cookie` header into `req.cookies` / `req.signedCookies`.
 *
 * Matches `cookie-parser` semantics: first occurrence wins, values are
 * URI-decoded, and when a secret is configured `s:`-prefixed cookies are
 * verified into `req.signedCookies` instead of `req.cookies`.
 */
export function cookieParser(secret?: string): HttpHandler {
  return (req, _res, next) => {
    const cookies: Record<string, string> = {};
    const signedCookies: Record<string, string> = {};

    const header = req.headers.cookie;
    if (typeof header === 'string') {
      for (const pair of header.split(';')) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex < 0) {
          continue;
        }
        const key = pair.slice(0, eqIndex).trim();
        if (key === '' || key in cookies || key in signedCookies) {
          continue;
        }
        let value = pair.slice(eqIndex + 1).trim();
        if (secret && value.startsWith('s:')) {
          const unsigned = unsignCookie(value.slice(2), secret);
          if (unsigned !== undefined) {
            try {
              signedCookies[key] = decodeURIComponent(unsigned);
            } catch {
              signedCookies[key] = unsigned;
            }
          }
          continue;
        }
        try {
          value = decodeURIComponent(value);
        } catch {
          // Keep the raw value if it is not valid percent-encoding.
        }
        cookies[key] = value;
      }
    }

    req.cookies = cookies;
    req.signedCookies = signedCookies;
    next();
  };
}
