import axios from 'axios';

// Cache for country detection to avoid repeated API calls
const countryCache: Record<string, { country: string | null; expires: number }> = {};

/**
 * Detect country from IP address
 * This uses free IP geolocation services with fallbacks
 *
 * @param ip IP address to lookup
 * @returns ISO country code or null if detection fails
 */
export async function detectCountry(ip: string): Promise<string | null> {
  // Check cache first
  const now = Date.now();
  const cacheKey = ip.trim();

  if (countryCache[cacheKey] && countryCache[cacheKey].expires > now) {
    return countryCache[cacheKey].country;
  }

  // Skip private IP addresses
  if (
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('192.168.') ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip === '::1'
  ) {
    return null;
  }

  try {
    // Try ipapi.co first (45,000 free requests per month)
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);

    if (response.data && response.data.country_code) {
      const country = response.data.country_code;

      // Cache result for 7 days
      countryCache[cacheKey] = {
        country,
        expires: now + 7 * 24 * 60 * 60 * 1000,
      };

      return country;
    }
  } catch (error) {
    // Continue to fallback
  }

  try {
    // Fallback to ipinfo.io (50,000 free requests per month)
    const response = await axios.get(`https://ipinfo.io/${ip}/json`);

    if (response.data && response.data.country) {
      const country = response.data.country;

      // Cache result for 7 days
      countryCache[cacheKey] = {
        country,
        expires: now + 7 * 24 * 60 * 60 * 1000,
      };

      return country;
    }
  } catch (error) {}

  // Set null result in cache too, but only for 1 hour
  countryCache[cacheKey] = {
    country: null,
    expires: now + 60 * 60 * 1000,
  };

  return null;
}
